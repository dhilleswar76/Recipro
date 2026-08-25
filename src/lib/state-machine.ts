import crypto from 'crypto';
import { query, withTransaction } from './postgres';

export type SessionState = 'REQUESTED' | 'ACCEPTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'PENDING_CONFIRMATION' | 'COMPLETED' | 'CREDIT_SETTLED' | 'DISPUTED' | 'CANCELLED';

export interface TransitionResult { success: boolean; previousState: SessionState; newState: SessionState; sessionId: string; message: string; txHash?: string; }

const VALID_TRANSITIONS: Record<SessionState, SessionState[]> = {
  REQUESTED: ['ACCEPTED', 'CANCELLED'], ACCEPTED: ['SCHEDULED', 'IN_PROGRESS', 'PENDING_CONFIRMATION', 'COMPLETED', 'CANCELLED'],
  SCHEDULED: ['IN_PROGRESS', 'PENDING_CONFIRMATION', 'COMPLETED', 'CANCELLED', 'DISPUTED'], IN_PROGRESS: ['PENDING_CONFIRMATION', 'COMPLETED', 'CANCELLED', 'DISPUTED'],
  PENDING_CONFIRMATION: ['COMPLETED', 'CREDIT_SETTLED', 'CANCELLED', 'DISPUTED'], COMPLETED: ['CREDIT_SETTLED', 'DISPUTED'], CREDIT_SETTLED: ['DISPUTED'], DISPUTED: ['CREDIT_SETTLED', 'CANCELLED'], CANCELLED: [],
};
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

export async function reserveEscrowCredits(learnerId: string, creditsAmount: number, sessionId: string, idempotencyKey: string): Promise<{ success: boolean; message: string }> {
  const account = (await query<{ balance: number }>('SELECT balance FROM skill_credit_accounts WHERE user_id = $1', [learnerId])).rows[0];
  if (!account || Number(account.balance) < creditsAmount) return { success: false, message: `Insufficient Skill Credits. You have ${account?.balance || 0} credits, but ${creditsAmount} is required.` };
  await withTransaction(async (client) => {
    if ((await client.query('SELECT id FROM credit_transactions WHERE idempotency_key = $1', [idempotencyKey])).rowCount) return;
    await client.query('UPDATE skill_credit_accounts SET balance = balance - $1, escrow_balance = escrow_balance + $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3', [creditsAmount, creditsAmount, learnerId]);
    await client.query(`INSERT INTO credit_transactions (id, reference_session_id, sender_id, receiver_id, amount, transaction_type, status, idempotency_key) VALUES ($1, $2, $3, NULL, $4, 'ESCROW_RESERVE', 'SETTLED', $5)`, [makeId('tx'), sessionId, learnerId, creditsAmount, idempotencyKey]);
  });
  return { success: true, message: 'Credits reserved in escrow' };
}

export async function refundEscrowCredits(learnerId: string, creditsAmount: number, sessionId: string, reason: string): Promise<void> {
  await withTransaction(async (client) => {
    await client.query('UPDATE skill_credit_accounts SET balance = balance + $1, escrow_balance = GREATEST(0, escrow_balance - $2), updated_at = CURRENT_TIMESTAMP WHERE user_id = $3', [creditsAmount, creditsAmount, learnerId]);
    await client.query(`INSERT INTO credit_transactions (id, reference_session_id, sender_id, receiver_id, amount, transaction_type, status, idempotency_key) VALUES ($1, $2, NULL, $3, $4, 'ESCROW_REFUND', 'SETTLED', $5)`, [makeId('tx-refund'), sessionId, learnerId, creditsAmount, `refund-${sessionId}-${Date.now()}`]);
    await client.query(`INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, previous_state, new_state) VALUES ($1, $2, 'ESCROW_REFUND', 'SESSION', $3, 'ESCROW_HELD', 'REFUNDED')`, [makeId('audit'), learnerId, sessionId]);
  });
}

export async function settleSessionCredits(sessionId: string): Promise<{ success: boolean; txHash: string; message: string }> {
  const session = (await query('SELECT id, teacher_id, learner_id, skill_id, credits_amount, status FROM sessions WHERE id = $1', [sessionId])).rows[0] as any;
  if (!session) return { success: false, txHash: '', message: 'Session not found' };
  if (session.status === 'CREDIT_SETTLED') return { success: true, txHash: 'already_settled', message: 'Session credits have already been settled' };
  const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
  await withTransaction(async (client) => {
    await client.query('UPDATE skill_credit_accounts SET escrow_balance = GREATEST(0, escrow_balance - $1), lifetime_spent = lifetime_spent + $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3', [session.credits_amount, session.credits_amount, session.learner_id]);
    await client.query('UPDATE skill_credit_accounts SET balance = balance + $1, lifetime_earned = lifetime_earned + $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3', [session.credits_amount, session.credits_amount, session.teacher_id]);
    await client.query(`INSERT INTO credit_transactions (id, reference_session_id, sender_id, receiver_id, amount, transaction_type, status, idempotency_key, on_chain_tx_hash) VALUES ($1, $2, $3, $4, $5, 'ESCROW_RELEASE', 'SETTLED', $6, $7)`, [makeId('tx-settle'), session.id, session.learner_id, session.teacher_id, session.credits_amount, `settle-${sessionId}`, txHash]);
    await client.query(`UPDATE sessions SET status = 'CREDIT_SETTLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [sessionId]);
    await client.query('UPDATE reputations SET total_sessions_taught = total_sessions_taught + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1', [session.teacher_id]);
    await client.query('UPDATE reputations SET total_sessions_learned = total_sessions_learned + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1', [session.learner_id]);
    await client.query(`INSERT INTO blockchain_transactions (id, reference_type, reference_id, chain_id, contract_address, tx_hash, status) VALUES ($1, 'SESSION_SETTLEMENT', $2, 31337, '0x5FbDB2315678afecb367f032d93F642f64180aa3', $3, 'CONFIRMED')`, [makeId('bctx'), sessionId, txHash]);
    await client.query(`INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, previous_state, new_state) VALUES ($1, $2, 'SETTLE_CREDITS', 'SESSION', $3, 'COMPLETED', 'CREDIT_SETTLED')`, [makeId('audit'), session.teacher_id, sessionId]);
    const linked = (await client.query(`SELECT id FROM learning_requests WHERE learner_id = $1 AND (skill_id = $2 OR session_id = $3) AND status NOT IN ('FULFILLED', 'CANCELLED') LIMIT 1`, [session.learner_id, session.skill_id, sessionId])).rows[0] as any;
    if (linked) {
      await client.query('UPDATE learning_requests SET status = \'FULFILLED\', session_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [sessionId, linked.id]);
      await client.query(`INSERT INTO learning_request_events (id, request_id, event_type, title, description, created_at) VALUES ($1, $2, 'REQUEST_FULFILLED', 'Learning Request Fulfilled', 'Session completed and skill credits settled.', CURRENT_TIMESTAMP)`, [makeId('ev'), linked.id]);
    }
  });
  await checkAndAwardCredentials(session.teacher_id, session.skill_id);
  return { success: true, txHash, message: `1 Skill Credit successfully settled to teacher. Blockchain Proof: ${txHash.substring(0, 10)}...` };
}

export async function checkAndAwardCredentials(userId: string, skillId: string): Promise<void> {
  const rep = (await query('SELECT total_sessions_taught, bayesian_rating FROM reputations WHERE user_id = $1', [userId])).rows[0] as any;
  if (!rep || rep.total_sessions_taught < 3 || rep.bayesian_rating < 4.5) return;
  if ((await query('SELECT id FROM credentials WHERE user_id = $1 AND badge_type = $2 AND skill_id = $3', [userId, 'MENTOR_TIER_1', skillId])).rows[0]) return;
  const skill = (await query<{ name: string }>('SELECT name FROM skills WHERE id = $1', [skillId])).rows[0];
  const title = `${skill?.name || 'General'} Mentor - Level 1`, txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
  await query(`INSERT INTO credentials (id, user_id, title, badge_type, skill_id, token_id, tx_hash, criteria_met) VALUES ($1, $2, $3, 'MENTOR_TIER_1', $4, $5, $6, $7)`, [makeId('cred'), userId, title, skillId, `CERT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`, txHash, JSON.stringify({ sessionsTaught: rep.total_sessions_taught, bayesianRating: rep.bayesian_rating, minSessionsRequired: 3, minRatingRequired: 4.5 })]);
  await query(`INSERT INTO notifications (id, user_id, title, message, type, link) VALUES ($1, $2, 'Verifiable Credential Earned!', $3, 'CREDENTIAL_ISSUED', '/credentials')`, [makeId('notif'), userId, `Congratulations! You earned the verified credential: "${title}"`]);
}

export const CREDIT_RATE_PER_HOUR = 1;
export function calculateRequiredCredits(durationHours: number = 1): number { return Math.max(1, Math.ceil((durationHours || 1) * CREDIT_RATE_PER_HOUR)); }

const agreementSql = `SELECT sea.*, sk_taught.name AS taught_skill_name, sk_return.name AS return_skill_catalog_name, mp.display_name AS mentor_name, lp.display_name AS learner_name FROM session_exchange_agreements sea JOIN skills sk_taught ON sea.taught_skill_id = sk_taught.id LEFT JOIN skills sk_return ON sea.requested_return_skill_id = sk_return.id JOIN profiles mp ON sea.mentor_id = mp.user_id JOIN profiles lp ON sea.learner_id = lp.user_id WHERE sea.session_id = $1`;
export async function getExchangeAgreement(sessionId: string): Promise<any> { return (await query(agreementSql, [sessionId])).rows[0]; }

export async function proposeReturnSkill(params: { sessionId: string; actorUserId: string; skillName: string; notes?: string }): Promise<{ success: boolean; agreement?: any; message: string }> {
  const { sessionId, actorUserId, skillName, notes } = params;
  if (!skillName?.trim()) return { success: false, message: 'Return skill name is required' };
  const session = (await query('SELECT s.*, sk.name AS skill_name FROM sessions s JOIN skills sk ON s.skill_id = sk.id WHERE s.id = $1', [sessionId])).rows[0] as any;
  if (!session) return { success: false, message: 'Session not found' };
  if (['COMPLETED', 'CANCELLED', 'DISPUTED', 'IN_PROGRESS'].includes(session.status)) return { success: false, message: `Cannot modify return skill for a session with status ${session.status}` };
  const teacher = session.teacher_id === actorUserId, learner = session.learner_id === actorUserId;
  if (!teacher && !learner) return { success: false, message: 'Unauthorized: You are not a participant in this session' };
  const cleanName = skillName.trim();
  let skill = (await query(`SELECT id, name FROM skills WHERE LOWER(name) = LOWER($1) OR LOWER(name) LIKE $2 OR $3 LIKE ('%' || LOWER(name) || '%') ORDER BY CASE WHEN LOWER(name) = LOWER($4) THEN 0 ELSE 1 END LIMIT 1`, [cleanName, `%${cleanName.toLowerCase()}%`, cleanName.toLowerCase(), cleanName])).rows[0] as any;
  if (!skill) { skill = { id: makeId('skill'), name: cleanName }; await query(`INSERT INTO skills (id, name, category, description, is_verified) VALUES ($1, $2, 'General', $3, true)`, [skill.id, cleanName, `Peer requested skill: ${cleanName}`]); }
  const existing = (await query('SELECT * FROM session_exchange_agreements WHERE session_id = $1', [sessionId])).rows[0] as any;
  const agreement = await withTransaction(async (client) => {
    const agreementId = existing?.id || makeId('sea'), status = existing ? (teacher ? 'PROPOSED' : 'CHANGED') : 'PROPOSED', count = existing ? Number(existing.proposal_count) + 1 : 1;
    if (existing && existing.proposal_count >= 10) throw new Error('Maximum negotiation limit reached for this session.');
    if (existing) await client.query(`UPDATE session_exchange_agreements SET requested_return_skill_id = $1, requested_return_skill_name = $2, return_type = 'SKILL', credit_amount = $3, status = $4, proposal_count = $5, proposed_by = $6, accepted_by = NULL, accepted_at = NULL, notes = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8`, [skill.id, skill.name, calculateRequiredCredits(session.duration_hours), status, count, actorUserId, notes || '', agreementId]);
    else await client.query(`INSERT INTO session_exchange_agreements (id, session_id, mentor_id, learner_id, taught_skill_id, requested_return_skill_id, requested_return_skill_name, return_type, credit_amount, status, proposal_count, proposed_by, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, 'SKILL', $8, 'PROPOSED', 1, $9, $10)`, [agreementId, sessionId, session.teacher_id, session.learner_id, session.skill_id, skill.id, skill.name, calculateRequiredCredits(session.duration_hours), actorUserId, notes || '']);
    await client.query(`INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, previous_state, new_state) VALUES ($1, $2, $3, 'EXCHANGE_AGREEMENT', $4, $5, $6)`, [makeId('audit'), actorUserId, teacher ? 'RETURN_SKILL_PROPOSED' : 'RETURN_SKILL_CHANGED', agreementId, existing?.status || 'NONE', status]);
    const target = teacher ? session.learner_id : session.teacher_id, profile = (await client.query('SELECT display_name FROM profiles WHERE user_id = $1', [actorUserId])).rows[0] as any;
    await client.query(`INSERT INTO notifications (id, user_id, title, message, type, link) VALUES ($1, $2, 'SkillSwap Return Request', $3, 'RETURN_SKILL_REQUESTED', '/sessions')`, [makeId('notif'), target, `${profile?.display_name || 'Your peer'} requested "${skill.name}" in return for your upcoming ${session.skill_name} session.`]);
    return (await client.query('SELECT * FROM session_exchange_agreements WHERE id = $1', [agreementId])).rows[0];
  });
  return { success: true, agreement, message: `Return skill "${skill.name}" proposed successfully.` };
}

export async function respondToReturnProposal(params: { sessionId: string; actorUserId: string; action: 'ACCEPT_SKILL' | 'OFFER_CREDITS' | 'PROPOSE_ALTERNATIVE' | 'DECLINE'; alternativeSkillName?: string; notes?: string }): Promise<{ success: boolean; agreement?: any; message: string }> {
  const { sessionId, actorUserId, action, alternativeSkillName, notes } = params;
  const session = (await query('SELECT s.*, sk.name AS skill_name FROM sessions s JOIN skills sk ON s.skill_id = sk.id WHERE s.id = $1', [sessionId])).rows[0] as any;
  const agreement = (await query('SELECT * FROM session_exchange_agreements WHERE session_id = $1', [sessionId])).rows[0] as any;
  if (!session) return { success: false, message: 'Session not found' }; if (!agreement) return { success: false, message: 'No exchange proposal exists for this session' };
  const teacher = session.teacher_id === actorUserId, learner = session.learner_id === actorUserId;
  if (!teacher && !learner) return { success: false, message: 'Unauthorized: You are not a participant in this session' };
  if (action === 'PROPOSE_ALTERNATIVE') return alternativeSkillName?.trim() ? proposeReturnSkill({ sessionId, actorUserId, skillName: alternativeSkillName, notes: notes || 'Counter-proposal from peer' }) : { success: false, message: 'Please specify the alternative skill you can teach.' };
  const target = learner ? session.teacher_id : session.learner_id, profile = (await query('SELECT display_name FROM profiles WHERE user_id = $1', [actorUserId])).rows[0] as any;
  if (action === 'ACCEPT_SKILL') {
    const reqName = agreement.requested_return_skill_name.toLowerCase();
    const verified = (await query(`SELECT us.* FROM user_skills us JOIN skills sk ON us.skill_id = sk.id WHERE us.user_id = $1 AND (us.skill_id = $2 OR LOWER(sk.name) = LOWER($3) OR LOWER(sk.name) LIKE $4 OR $5 LIKE ('%' || LOWER(sk.name) || '%')) AND us.verification_status IN ('PEER_VERIFIED', 'PLATFORM_VERIFIED', 'ASSESSMENT_VERIFIED', 'VERIFIED')`, [session.learner_id, agreement.requested_return_skill_id, agreement.requested_return_skill_name, `%${reqName}%`, reqName])).rows[0];
    if (!verified) return { success: false, message: `Learner does not have a verified teaching skill for "${agreement.requested_return_skill_name}". Please take the skill verification assessment first or offer Skill Credits.` };
    await withTransaction(async (client) => { await client.query(`UPDATE session_exchange_agreements SET return_type = 'SKILL', status = 'ACCEPTED', accepted_by = $1, accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [actorUserId, agreement.id]); await client.query(`UPDATE sessions SET status = 'SCHEDULED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [sessionId]); await client.query(`INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, previous_state, new_state) VALUES ($1, $2, 'RETURN_SKILL_ACCEPTED', 'EXCHANGE_AGREEMENT', $3, $4, 'ACCEPTED')`, [makeId('audit'), actorUserId, agreement.id, agreement.status]); await client.query(`INSERT INTO notifications (id, user_id, title, message, type, link) VALUES ($1, $2, 'Return Skill Confirmed', $3, 'RETURN_SKILL_ACCEPTED', '/sessions')`, [makeId('notif'), target, `${profile?.display_name || 'Your peer'} confirmed they will teach "${agreement.requested_return_skill_name}" in return. Exchange is confirmed!`]); });
    return { success: true, message: `Return skill exchange confirmed: ${session.skill_name} ↔ ${agreement.requested_return_skill_name}` };
  }
  if (action === 'OFFER_CREDITS') {
    const required = agreement.credit_amount || calculateRequiredCredits(session.duration_hours), account = (await query('SELECT balance FROM skill_credit_accounts WHERE user_id = $1', [actorUserId])).rows[0] as any;
    if (!account || account.balance < required) return { success: false, message: `Insufficient Skill Credits. Required: ${required}, Available: ${account?.balance || 0}.` };
    const escrow = await reserveEscrowCredits(actorUserId, required, sessionId, `escrow-exchange-${sessionId}-${Date.now()}`); if (!escrow.success) return escrow;
    await withTransaction(async (client) => { await client.query(`UPDATE session_exchange_agreements SET return_type = 'CREDITS', credit_amount = $1, status = 'ACCEPTED', accepted_by = $2, accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $3`, [required, actorUserId, agreement.id]); await client.query(`UPDATE sessions SET credits_amount = $1, status = 'SCHEDULED', updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [required, sessionId]); await client.query(`INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, previous_state, new_state) VALUES ($1, $2, 'CREDIT_RESERVED', 'EXCHANGE_AGREEMENT', $3, $4, 'ACCEPTED')`, [makeId('audit'), actorUserId, agreement.id, agreement.status]); await client.query(`INSERT INTO notifications (id, user_id, title, message, type, link) VALUES ($1, $2, 'Credit Return Confirmed', $3, 'RETURN_CREDIT_OFFERED', '/sessions')`, [makeId('notif'), target, `${profile?.display_name || 'Your peer'} offered ${required} Skill Credit(s) in return. Credits are safely reserved in escrow.`]); });
    return { success: true, message: `Credit exchange confirmed: ${session.skill_name} ↔ ${required} Skill Credit(s) reserved.` };
  }
  if (action === 'DECLINE') { await query(`UPDATE session_exchange_agreements SET status = 'REJECTED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [agreement.id]); await insertEventAudit(actorUserId, agreement.id, agreement.status); await query(`INSERT INTO notifications (id, user_id, title, message, type, link) VALUES ($1, $2, 'Return Skill Declined', $3, 'RETURN_SKILL_DECLINED', '/sessions')`, [makeId('notif'), target, `${profile?.display_name || 'Your peer'} declined the return requirement for your upcoming session.`]); return { success: true, message: 'Return proposal declined.' }; }
  return { success: false, message: 'Unknown action' };
}

async function insertEventAudit(actorId: string, agreementId: string, previousState: string) { await query(`INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, previous_state, new_state) VALUES ($1, $2, 'RETURN_SKILL_DECLINED', 'EXCHANGE_AGREEMENT', $3, $4, 'REJECTED')`, [makeId('audit'), actorId, agreementId, previousState]); }
async function notify(userId: string, title: string, message: string, type: string, actionUrl: string) { await query(`INSERT INTO notifications (id, user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5, $6)`, [makeId('notif'), userId, title, message, type, actionUrl]); }

export async function transitionSessionState(sessionId: string, targetState: SessionState, actorUserId: string, metadata?: { reason?: string; idempotencyKey?: string }): Promise<TransitionResult> {
  const session = (await query('SELECT * FROM sessions WHERE id = $1', [sessionId])).rows[0] as any;
  if (!session) return { success: false, previousState: 'REQUESTED', newState: 'REQUESTED', sessionId, message: 'Session does not exist' };
  const currentState = session.status as SessionState, teacher = session.teacher_id === actorUserId, learner = session.learner_id === actorUserId;
  const role = (await query<{ role: string }>('SELECT role FROM users WHERE id = $1', [actorUserId])).rows[0]?.role;
  const privileged = role === 'MODERATOR' || role === 'ADMIN';
  if (!teacher && !learner && !privileged) return { success: false, previousState: currentState, newState: currentState, sessionId, message: 'Unauthorized: You are not a participant in this session' };
  if (!(VALID_TRANSITIONS[currentState] || []).includes(targetState) && !privileged) return { success: false, previousState: currentState, newState: currentState, sessionId, message: `Invalid state transition from ${currentState} to ${targetState}` };
  if (targetState === 'CANCELLED') { await refundEscrowCredits(session.learner_id, session.credits_amount, session.id, metadata?.reason || 'Cancelled'); await query(`UPDATE session_exchange_agreements SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE session_id = $1`, [sessionId]); await query(`UPDATE sessions SET status = 'CANCELLED', cancellation_reason = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [metadata?.reason || 'Cancelled', sessionId]); await recordSessionEvent(sessionId, actorUserId, 'CANCELLED', 'Session Cancelled', metadata?.reason ? `Session cancelled. Reason: ${metadata.reason}` : 'Session was cancelled. Escrow credits refunded.', currentState, 'CANCELLED', metadata); await notify(teacher ? session.learner_id : session.teacher_id, 'Session Cancelled', `The session was cancelled: ${metadata?.reason || 'Cancelled by participant'}. Any reserved credits have been refunded.`, 'SESSION_CANCELLED', `/sessions/${sessionId}`); return { success: true, previousState: currentState, newState: 'CANCELLED', sessionId, message: 'Session cancelled and credits refunded to learner' }; }
  if (targetState === 'ACCEPTED') { if (!teacher && !privileged) return { success: false, previousState: currentState, newState: currentState, sessionId, message: 'Only the mentor can accept this session request' }; await query(`UPDATE sessions SET status = 'ACCEPTED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [sessionId]); await recordSessionEvent(sessionId, actorUserId, 'ACCEPTED', 'Session Accepted by Mentor', 'The mentor has accepted the session booking request.', currentState, 'ACCEPTED'); await notify(session.learner_id, 'Session Request Accepted!', 'Your mentor accepted the session. You can now review exchange terms or enter the classroom when scheduled.', 'SESSION_ACCEPTED', `/sessions/${sessionId}`); return { success: true, previousState: currentState, newState: 'ACCEPTED', sessionId, message: 'Session accepted by mentor' }; }
  if (targetState === 'IN_PROGRESS') { const agreement = (await query('SELECT * FROM session_exchange_agreements WHERE session_id = $1', [sessionId])).rows[0] as any; if (!agreement || agreement.status !== 'ACCEPTED') return { success: false, previousState: currentState, newState: currentState, sessionId, message: 'Pre-session exchange confirmation required. The mentor and learner must confirm the return skill or credit terms before starting.' }; await query(`UPDATE sessions SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [sessionId]); await recordSessionEvent(sessionId, actorUserId, 'STARTED', 'Session Started Live', 'Participants joined the live collaborative classroom.', currentState, 'IN_PROGRESS'); return { success: true, previousState: currentState, newState: 'IN_PROGRESS', sessionId, message: 'Session is now live in progress' }; }
  if (targetState === 'PENDING_CONFIRMATION' || targetState === 'COMPLETED') { const learnerConfirmed = learner || privileged ? 1 : session.learner_confirmed, teacherConfirmed = teacher || privileged ? 1 : session.teacher_confirmed; if ((learnerConfirmed === 1 && teacherConfirmed === 1) || privileged) { await query(`UPDATE sessions SET learner_confirmed = 1, teacher_confirmed = 1, status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [sessionId]); const settled = await settleSessionCredits(sessionId); await recordSessionEvent(sessionId, actorUserId, 'CREDITS_SETTLED', 'Session Completed & Credits Settled', 'Both participants confirmed completion. Escrow credits successfully transferred.', currentState, 'CREDIT_SETTLED', { txHash: settled.txHash }); await notify(session.teacher_id, 'Skill Credit Earned!', `Your mentoring session is complete. ${session.credits_amount || 1} Skill Credit was added to your balance.`, 'CREDIT_SETTLED', '/wallet'); await notify(session.learner_id, 'Session Completed', 'Your learning session has been finalized and settled. Don\'t forget to leave a review!', 'SESSION_COMPLETED', `/sessions/${sessionId}`); return { success: true, previousState: currentState, newState: 'CREDIT_SETTLED', sessionId, txHash: settled.txHash, message: 'Session confirmed complete by both parties. Credits settled!' }; } await query(`UPDATE sessions SET learner_confirmed = $1, teacher_confirmed = $2, status = 'PENDING_CONFIRMATION', updated_at = CURRENT_TIMESTAMP WHERE id = $3`, [learnerConfirmed, teacherConfirmed, sessionId]); await recordSessionEvent(sessionId, actorUserId, 'CONFIRMED', 'Completion Confirmed', `${teacher ? 'Mentor' : 'Learner'} confirmed session completion. Waiting for counterparty confirmation.`, currentState, 'PENDING_CONFIRMATION'); await notify(teacher ? session.learner_id : session.teacher_id, 'Session Completion Awaiting Confirmation', 'The other participant marked the session as complete. Please confirm completion to finalize escrow settlement.', 'SESSION_COMPLETION_PENDING', `/sessions/${sessionId}`); return { success: true, previousState: currentState, newState: 'PENDING_CONFIRMATION', sessionId, message: 'Your confirmation was recorded. Waiting for the other participant to confirm.' }; }
  if (targetState === 'DISPUTED') { await query(`UPDATE sessions SET status = 'DISPUTED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [sessionId]); await recordSessionEvent(sessionId, actorUserId, 'DISPUTED', 'Session Flagged for Dispute', metadata?.reason ? `Dispute filed: ${metadata.reason}` : 'Session was flagged for dispute. Escrow credits frozen pending review.', currentState, 'DISPUTED', metadata); return { success: true, previousState: currentState, newState: 'DISPUTED', sessionId, message: 'Session flagged for dispute. Escrow credits frozen pending moderator review.' }; }
  return { success: false, previousState: currentState, newState: currentState, sessionId, message: 'Unhandled transition state' };
}

export async function recordSessionEvent(sessionId: string, actorId: string | null, eventType: string, title: string, description: string, previousState?: string, newState?: string, metadata?: any): Promise<void> { try { await query(`INSERT INTO session_events (id, session_id, actor_id, event_type, title, description, previous_state, new_state, metadata_json, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`, [makeId('sev'), sessionId, actorId, eventType, title, description, previousState || null, newState || null, JSON.stringify(metadata || {})]); } catch (error) { console.error('Record Session Event Error:', error); } }
export async function getSessionEvents(sessionId: string): Promise<any[]> { try { return (await query(`SELECT se.*, p.display_name AS actor_name FROM session_events se LEFT JOIN profiles p ON se.actor_id = p.user_id WHERE se.session_id = $1 ORDER BY se.created_at ASC`, [sessionId])).rows; } catch { return []; } }
export function canTransition(currentState: SessionState, targetState: SessionState, actorRole: 'TEACHER' | 'LEARNER' | 'ADMIN'): { allowed: boolean; reason?: string } { if (!(VALID_TRANSITIONS[currentState] || []).includes(targetState) && actorRole !== 'ADMIN') return { allowed: false, reason: `Cannot transition from ${currentState} to ${targetState}` }; if (targetState === 'ACCEPTED' && actorRole !== 'TEACHER' && actorRole !== 'ADMIN') return { allowed: false, reason: 'Only the mentor can accept a session' }; return { allowed: true }; }