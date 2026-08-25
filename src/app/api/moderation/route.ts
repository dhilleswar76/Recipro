import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/postgres';
import { requireRole } from '@/lib/auth';
import { ModeratorActionSchema } from '@/lib/validations';
import { refundEscrowCredits, settleSessionCredits } from '@/lib/state-machine';

export async function GET(req: NextRequest) {
  const authRes = await requireRole(req, ['MODERATOR', 'ADMIN']);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  // 1. Overview metrics
  const totalUsers = (await query('SELECT COUNT(*) as c FROM users')).rows[0].c;
  const flaggedAlertsCount = (await query("SELECT COUNT(*) as c FROM fraud_alerts WHERE status = 'PENDING_REVIEW'")).rows[0].c;
  const openReportsCount = (await query("SELECT COUNT(*) as c FROM reports WHERE status = 'OPEN'")).rows[0].c;
  const openDisputesCount = (await query("SELECT COUNT(*) as c FROM disputes WHERE status = 'OPEN'")).rows[0].c;
  const totalSessionsCount = (await query('SELECT COUNT(*) as c FROM sessions')).rows[0].c;

  // 2. Fraud Alerts
  const fraudAlerts = (await query(`
    SELECT fa.*, p.display_name, p.college, p.major, u.email, u.status as user_status
    FROM fraud_alerts fa
    JOIN users u ON fa.user_id = u.id
    JOIN profiles p ON u.id = p.user_id
    ORDER BY fa.risk_score DESC, fa.created_at DESC
    LIMIT 20
  `)).rows;

  // 3. User Reports
  const reports = (await query(`
    SELECT 
      r.*,
      rp.display_name as reporter_name,
      tp.display_name as reported_name
    FROM reports r
    JOIN profiles rp ON r.reporter_id = rp.user_id
    JOIN profiles tp ON r.reported_id = tp.user_id
    ORDER BY r.created_at DESC
    LIMIT 20
  `)).rows;

  // 4. Disputes
  const disputes = (await query(`
    SELECT 
      d.*,
      s.title as session_title, s.credits_amount, s.teacher_id, s.learner_id,
      ip.display_name as initiator_name
    FROM disputes d
    JOIN sessions s ON d.session_id = s.id
    JOIN profiles ip ON d.initiator_id = ip.user_id
    ORDER BY d.created_at DESC
    LIMIT 20
  `)).rows;

  // 5. Recent Audit Logs
  const auditLogs = (await query(`
    SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 25
  `)).rows;

  return NextResponse.json({
    metrics: {
      totalUsers,
      flaggedAlertsCount,
      openReportsCount,
      openDisputesCount,
      totalSessionsCount,
    },
    fraudAlerts,
    reports,
    disputes,
    auditLogs,
  });
}

export async function POST(req: NextRequest) {
  const authRes = await requireRole(req, ['MODERATOR', 'ADMIN']);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;

  try {
    const body = await req.json();
    const parsed = ModeratorActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid moderator action schema', details: parsed.error.format() }, { status: 400 });
    }

    const { targetType, targetId, action, reason } = parsed.data;

    await withTransaction(async (client) => {
      let prevStatus = 'UNKNOWN';

      if (action === 'SUSPEND_USER') {
        const uResult = await client.query('SELECT status FROM users WHERE id = $1', [targetId]);
        const u = uResult.rows[0] as any;
        prevStatus = u?.status || 'ACTIVE';
        await client.query("UPDATE users SET status = 'SUSPENDED', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [targetId]);
      } else if (action === 'RESTRICT_CREDITS') {
        await client.query("UPDATE users SET status = 'RESTRICTED', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [targetId]);
      } else if (action === 'CLEAR_ALERT') {
        await client.query("UPDATE fraud_alerts SET status = 'CLEARED', reviewed_by = $1, review_notes = $2 WHERE id = $3", [user.userId, reason, targetId]);
      } else if (action === 'DISMISS_REPORT') {
        await client.query("UPDATE reports SET status = 'DISMISSED', resolution_notes = $1, moderator_id = $2 WHERE id = $3", [reason, user.userId, targetId]);
      } else if (action === 'RESOLVE_REFUND') {
        // Resolve dispute by refunding learner
        const disputeResult = await client.query('SELECT session_id FROM disputes WHERE id = $1', [targetId]);
        const dispute = disputeResult.rows[0] as any;
        if (dispute) {
          const sessionResult = await client.query('SELECT * FROM sessions WHERE id = $1', [dispute.session_id]);
          const sess = sessionResult.rows[0] as any;
          if (sess) {
            await refundEscrowCredits(sess.learner_id, sess.credits_amount, sess.id, `Moderator Refund: ${reason}`);
            await client.query("UPDATE sessions SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [sess.id]);
            await client.query("UPDATE disputes SET status = 'RESOLVED_REFUND', moderator_id = $1, resolution_notes = $2 WHERE id = $3", [user.userId, reason, targetId]);
          }
        }
      } else if (action === 'RESOLVE_PAYOUT') {
        // Resolve dispute by settling credits to teacher
        const disputeResult = await client.query('SELECT session_id FROM disputes WHERE id = $1', [targetId]);
        const dispute = disputeResult.rows[0] as any;
        if (dispute) {
            await settleSessionCredits(dispute.session_id);
          await client.query("UPDATE disputes SET status = 'RESOLVED_PAYOUT', moderator_id = $1, resolution_notes = $2 WHERE id = $3", [user.userId, reason, targetId]);
        }
      }

      // Record in Audit Log
      await client.query(`
        INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, previous_state, new_state)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        `audit-${Date.now()}`,
        user.userId,
        `MODERATOR_${action}`,
        targetType,
        targetId,
        prevStatus,
        action
      ]);
    });

    return NextResponse.json({
      success: true,
      message: `Moderator action "${action}" executed and recorded in campus audit log.`,
    });
  } catch (err: any) {
    console.error('Moderator Action Error:', err);
    return NextResponse.json({ error: 'Failed to process moderator action' }, { status: 500 });
  }
}
