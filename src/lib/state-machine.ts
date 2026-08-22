import { getDb } from './db';
import crypto from 'crypto';

export type SessionState = 
  | 'REQUESTED' 
  | 'ACCEPTED' 
  | 'SCHEDULED' 
  | 'IN_PROGRESS' 
  | 'PENDING_CONFIRMATION' 
  | 'COMPLETED' 
  | 'CREDIT_SETTLED' 
  | 'DISPUTED' 
  | 'CANCELLED';

export interface TransitionResult {
  success: boolean;
  previousState: SessionState;
  newState: SessionState;
  sessionId: string;
  message: string;
  txHash?: string;
}

/**
 * Valid state transitions map
 */
const VALID_TRANSITIONS: Record<SessionState, SessionState[]> = {
  'REQUESTED': ['ACCEPTED', 'CANCELLED'],
  'ACCEPTED': ['SCHEDULED', 'IN_PROGRESS', 'CANCELLED'],
  'SCHEDULED': ['IN_PROGRESS', 'CANCELLED', 'DISPUTED'],
  'IN_PROGRESS': ['PENDING_CONFIRMATION', 'COMPLETED', 'DISPUTED'],
  'PENDING_CONFIRMATION': ['COMPLETED', 'DISPUTED'],
  'COMPLETED': ['CREDIT_SETTLED', 'DISPUTED'],
  'CREDIT_SETTLED': ['DISPUTED'], // Post-settlement disputes can still be submitted for investigation
  'DISPUTED': ['CREDIT_SETTLED', 'CANCELLED'], // Resolved by moderator
  'CANCELLED': [], // Terminal
};

/**
 * Reserve Learner Credits when Session is Requested
 */
export function reserveEscrowCredits(
  learnerId: string, 
  creditsAmount: number, 
  sessionId: string, 
  idempotencyKey: string
): { success: boolean; message: string } {
  const db = getDb();

  const account = db.prepare(`
    SELECT balance, escrow_balance FROM skill_credit_accounts WHERE user_id = ?
  `).get(learnerId) as { balance: number; escrow_balance: number } | undefined;

  if (!account || account.balance < creditsAmount) {
    return {
      success: false,
      message: `Insufficient Skill Credits. You have ${account?.balance || 0} credits, but ${creditsAmount} is required.`,
    };
  }

  // Atomic transaction
  const tx = db.transaction(() => {
    // Check if idempotency key already processed
    const existingTx = db.prepare(`SELECT id FROM credit_transactions WHERE idempotency_key = ?`).get(idempotencyKey);
    if (existingTx) return;

    db.prepare(`
      UPDATE skill_credit_accounts 
      SET balance = balance - ?, escrow_balance = escrow_balance + ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(creditsAmount, creditsAmount, learnerId);

    db.prepare(`
      INSERT INTO credit_transactions (
        id, reference_session_id, sender_id, receiver_id, amount, transaction_type, status, idempotency_key
      ) VALUES (?, ?, ?, NULL, ?, 'ESCROW_RESERVE', 'SETTLED', ?)
    `).run(
      `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sessionId,
      learnerId,
      creditsAmount,
      idempotencyKey
    );
  });

  tx();
  return { success: true, message: 'Credits reserved in escrow' };
}

/**
 * Refund Escrow Credits back to Learner upon Cancellation / Rejection
 */
export function refundEscrowCredits(
  learnerId: string, 
  creditsAmount: number, 
  sessionId: string, 
  reason: string
): void {
  const db = getDb();
  const idempotencyKey = `refund-${sessionId}-${Date.now()}`;

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE skill_credit_accounts 
      SET balance = balance + ?, escrow_balance = MAX(0, escrow_balance - ?), updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(creditsAmount, creditsAmount, learnerId);

    db.prepare(`
      INSERT INTO credit_transactions (
        id, reference_session_id, sender_id, receiver_id, amount, transaction_type, status, idempotency_key
      ) VALUES (?, ?, NULL, ?, ?, 'ESCROW_REFUND', 'SETTLED', ?)
    `).run(
      `tx-refund-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sessionId,
      learnerId,
      creditsAmount,
      idempotencyKey
    );

    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, previous_state, new_state)
      VALUES (?, ?, 'ESCROW_REFUND', 'SESSION', ?, 'ESCROW_HELD', 'REFUNDED')
    `).run(`audit-${Date.now()}`, learnerId, sessionId);
  });

  tx();
}

/**
 * Settle Credits: Releases escrow from Learner to Teacher upon Completion
 */
export function settleSessionCredits(sessionId: string): { success: boolean; txHash: string; message: string } {
  const db = getDb();

  const session = db.prepare(`
    SELECT id, teacher_id, learner_id, credits_amount, status FROM sessions WHERE id = ?
  `).get(sessionId) as any;

  if (!session) {
    return { success: false, txHash: '', message: 'Session not found' };
  }

  if (session.status === 'CREDIT_SETTLED') {
    return { success: true, txHash: 'already_settled', message: 'Session credits have already been settled' };
  }

  const simulatedTxHash = `0x${crypto.randomBytes(32).toString('hex')}`;
  const idempotencyKey = `settle-${sessionId}`;

  const tx = db.transaction(() => {
    // 1. Deduct from learner's escrow balance & increment lifetime spent
    db.prepare(`
      UPDATE skill_credit_accounts
      SET escrow_balance = MAX(0, escrow_balance - ?), lifetime_spent = lifetime_spent + ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(session.credits_amount, session.credits_amount, session.learner_id);

    // 2. Add to teacher's balance & increment lifetime earned
    db.prepare(`
      UPDATE skill_credit_accounts
      SET balance = balance + ?, lifetime_earned = lifetime_earned + ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(session.credits_amount, session.credits_amount, session.teacher_id);

    // 3. Record credit transaction
    db.prepare(`
      INSERT INTO credit_transactions (
        id, reference_session_id, sender_id, receiver_id, amount, transaction_type, status, idempotency_key, on_chain_tx_hash
      ) VALUES (?, ?, ?, ?, ?, 'ESCROW_RELEASE', 'SETTLED', ?, ?)
    `).run(
      `tx-settle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      session.id,
      session.learner_id,
      session.teacher_id,
      session.credits_amount,
      idempotencyKey,
      simulatedTxHash
    );

    // 4. Update session status to CREDIT_SETTLED
    db.prepare(`
      UPDATE sessions SET status = 'CREDIT_SETTLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(sessionId);

    // 5. Update Reputations: increment sessions taught and learned
    db.prepare(`
      UPDATE reputations
      SET total_sessions_taught = total_sessions_taught + 1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(session.teacher_id);

    db.prepare(`
      UPDATE reputations
      SET total_sessions_learned = total_sessions_learned + 1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(session.learner_id);

    // 6. Record in Blockchain transactions registry
    db.prepare(`
      INSERT INTO blockchain_transactions (
        id, reference_type, reference_id, chain_id, contract_address, tx_hash, status
      ) VALUES (?, 'SESSION_SETTLEMENT', ?, 31337, '0x5FbDB2315678afecb367f032d93F642f64180aa3', ?, 'CONFIRMED')
    `).run(`bctx-${Date.now()}`, sessionId, simulatedTxHash);

    // 7. Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, previous_state, new_state)
      VALUES (?, ?, 'SETTLE_CREDITS', 'SESSION', ?, 'COMPLETED', 'CREDIT_SETTLED')
    `).run(`audit-${Date.now()}`, session.teacher_id, sessionId);
  });

  tx();

  // Check and evaluate if teacher qualifies for Verifiable Credential Badges!
  checkAndAwardCredentials(session.teacher_id, session.skill_id);

  return {
    success: true,
    txHash: simulatedTxHash,
    message: `1 Skill Credit successfully settled to teacher. Blockchain Proof: ${simulatedTxHash.substring(0, 10)}...`,
  };
}

/**
 * Deterministic Verifiable Credential Evaluation
 */
export function checkAndAwardCredentials(userId: string, skillId: string): void {
  const db = getDb();

  const reputation = db.prepare(`
    SELECT total_sessions_taught, bayesian_rating, reliability_score FROM reputations WHERE user_id = ?
  `).get(userId) as any;

  if (!reputation) return;

  const skill = db.prepare(`SELECT name FROM skills WHERE id = ?`).get(skillId) as { name: string } | undefined;
  const skillName = skill ? skill.name : 'General';

  // Criteria for Tier 1 Mentor: >= 3 completed teaching sessions & rating >= 4.5
  if (reputation.total_sessions_taught >= 3 && reputation.bayesian_rating >= 4.5) {
    const existingCred = db.prepare(`
      SELECT id FROM credentials WHERE user_id = ? AND badge_type = 'MENTOR_TIER_1' AND skill_id = ?
    `).get(userId, skillId);

    if (!existingCred) {
      const tokenId = `CERT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
      const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      const criteria = JSON.stringify({
        sessionsTaught: reputation.total_sessions_taught,
        bayesianRating: reputation.bayesian_rating,
        minSessionsRequired: 3,
        minRatingRequired: 4.5,
      });

      db.prepare(`
        INSERT INTO credentials (id, user_id, title, badge_type, skill_id, token_id, tx_hash, criteria_met)
        VALUES (?, ?, ?, 'MENTOR_TIER_1', ?, ?, ?, ?)
      `).run(
        `cred-${Date.now()}`,
        userId,
        `${skillName} Mentor — Level 1`,
        skillId,
        tokenId,
        txHash,
        criteria
      );

      // Notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, 'Verifiable Credential Earned!', ?, 'CREDENTIAL_ISSUED', '/credentials')
      `).run(
        `notif-${Date.now()}`,
        userId,
        `Congratulations! You earned the verified credential: "${skillName} Mentor — Level 1"`
      );
    }
  }
}

/**
 * Main State Machine Transition Handler
 */
export function transitionSessionState(
  sessionId: string,
  targetState: SessionState,
  actorUserId: string,
  metadata?: { reason?: string; idempotencyKey?: string }
): TransitionResult {
  const db = getDb();

  const session = db.prepare(`
    SELECT * FROM sessions WHERE id = ?
  `).get(sessionId) as any;

  if (!session) {
    return {
      success: false,
      previousState: 'REQUESTED',
      newState: 'REQUESTED',
      sessionId,
      message: 'Session does not exist',
    };
  }

  const currentState = session.status as SessionState;

  // Verify actor is either teacher, learner, or moderator/admin
  const isTeacher = session.teacher_id === actorUserId;
  const isLearner = session.learner_id === actorUserId;

  const actorUser = db.prepare(`SELECT role FROM users WHERE id = ?`).get(actorUserId) as { role: string } | undefined;
  const isPrivileged = actorUser?.role === 'MODERATOR' || actorUser?.role === 'ADMIN';

  if (!isTeacher && !isLearner && !isPrivileged) {
    return {
      success: false,
      previousState: currentState,
      newState: currentState,
      sessionId,
      message: 'Unauthorized: You are not a participant in this session',
    };
  }

  // Check state machine transition validity
  const allowedNext = VALID_TRANSITIONS[currentState] || [];
  if (!allowedNext.includes(targetState) && !isPrivileged) {
    return {
      success: false,
      previousState: currentState,
      newState: currentState,
      sessionId,
      message: `Invalid state transition from ${currentState} to ${targetState}`,
    };
  }

  // Handle Specific Transition Logic
  if (targetState === 'CANCELLED') {
    refundEscrowCredits(session.learner_id, session.credits_amount, session.id, metadata?.reason || 'Cancelled');
    db.prepare(`
      UPDATE sessions SET status = 'CANCELLED', cancellation_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(metadata?.reason || 'Cancelled', sessionId);

    return {
      success: true,
      previousState: currentState,
      newState: 'CANCELLED',
      sessionId,
      message: 'Session cancelled and credits refunded to learner',
    };
  }

  if (targetState === 'ACCEPTED') {
    if (!isTeacher && !isPrivileged) {
      return { success: false, previousState: currentState, newState: currentState, sessionId, message: 'Only the mentor can accept this session request' };
    }
    db.prepare(`UPDATE sessions SET status = 'ACCEPTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(sessionId);
    return { success: true, previousState: currentState, newState: 'ACCEPTED', sessionId, message: 'Session accepted by mentor' };
  }

  if (targetState === 'IN_PROGRESS') {
    db.prepare(`UPDATE sessions SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(sessionId);
    return { success: true, previousState: currentState, newState: 'IN_PROGRESS', sessionId, message: 'Session is now live in progress' };
  }

  if (targetState === 'PENDING_CONFIRMATION' || targetState === 'COMPLETED') {
    // Record confirmation flags
    let learnerConfirmed = session.learner_confirmed;
    let teacherConfirmed = session.teacher_confirmed;

    if (isLearner) learnerConfirmed = 1;
    if (isTeacher) teacherConfirmed = 1;

    // If both confirmed (or privileged moderator overrides), mark COMPLETED & Settle Credits!
    if ((learnerConfirmed === 1 && teacherConfirmed === 1) || isPrivileged) {
      db.prepare(`
        UPDATE sessions 
        SET learner_confirmed = 1, teacher_confirmed = 1, status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(sessionId);

      const settleRes = settleSessionCredits(sessionId);

      return {
        success: true,
        previousState: currentState,
        newState: 'CREDIT_SETTLED',
        sessionId,
        txHash: settleRes.txHash,
        message: 'Session confirmed complete by both parties. Credits settled!',
      };
    } else {
      db.prepare(`
        UPDATE sessions 
        SET learner_confirmed = ?, teacher_confirmed = ?, status = 'PENDING_CONFIRMATION', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(learnerConfirmed, teacherConfirmed, sessionId);

      return {
        success: true,
        previousState: currentState,
        newState: 'PENDING_CONFIRMATION',
        sessionId,
        message: 'Your confirmation was recorded. Waiting for the other participant to confirm.',
      };
    }
  }

  if (targetState === 'DISPUTED') {
    db.prepare(`UPDATE sessions SET status = 'DISPUTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(sessionId);
    return {
      success: true,
      previousState: currentState,
      newState: 'DISPUTED',
      sessionId,
      message: 'Session flagged for dispute. Escrow credits frozen pending moderator review.',
    };
  }

  return {
    success: false,
    previousState: currentState,
    newState: currentState,
    sessionId,
    message: 'Unhandled transition state',
  };
}
