import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { requireRole } from '@/lib/auth';
import { getBlockchainStatus, reconcileBlockchainTransactions } from '@/lib/web3';

export async function GET(req: NextRequest) {
  const authRes = await requireRole(req, ['ADMIN', 'MODERATOR']);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  // 1. Database Health
  let dbStatus = 'HEALTHY';
  let dbStats: any = {};
  try {
    const [users, sessions, skills, creditTxs, credentials, fraudAlerts] = await Promise.all([
      query('SELECT COUNT(*) as c FROM users'),
      query('SELECT COUNT(*) as c FROM sessions'),
      query('SELECT COUNT(*) as c FROM skills'),
      query('SELECT COUNT(*) as c FROM credit_transactions'),
      query('SELECT COUNT(*) as c FROM credentials'),
      query('SELECT COUNT(*) as c FROM fraud_alerts'),
    ]);
    const counts = {
      users: Number((users.rows[0] as any).c),
      sessions: Number((sessions.rows[0] as any).c),
      skills: Number((skills.rows[0] as any).c),
      creditTxs: Number((creditTxs.rows[0] as any).c),
      credentials: Number((credentials.rows[0] as any).c),
      fraudAlerts: Number((fraudAlerts.rows[0] as any).c),
    };
    dbStats = counts;
  } catch {
    dbStatus = 'DEGRADED';
  }

  // 2. Python ML Service Health
  let mlStatus = 'FALLBACK_READY';
  let mlInfo: any = { mode: 'TypeScript Built-in Hybrid Engine' };
  try {
    const mlRes = await Promise.race([
      fetch('http://localhost:8000/health'),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 800))
    ]);
    if (mlRes.ok) {
      const mlData = await mlRes.json();
      mlStatus = 'ONLINE';
      mlInfo = mlData;
    }
  } catch {
    mlStatus = 'FALLBACK_ACTIVE';
  }

  // 3. Blockchain RPC Status
  const blockchainStatus = await getBlockchainStatus();
  const reconciliation = await reconcileBlockchainTransactions();

  // 4. Recent Audit Logs
  const auditResult = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 30');

  return NextResponse.json({
    systemStatus: 'OPERATIONAL',
    timestamp: new Date().toISOString(),
    components: {
      database: {
        status: dbStatus,
        driver: 'PostgreSQL',
        stats: dbStats,
      },
      mlIntelligence: {
        status: mlStatus,
        details: mlInfo,
        fallbackEnabled: true,
      },
      blockchain: {
        status: blockchainStatus.connected ? 'ONLINE_EVM_RPC' : 'LOCAL_DEVNET_MODE',
        chainId: blockchainStatus.chainId,
        blockNumber: blockchainStatus.blockNumber,
        escrowContract: blockchainStatus.escrowAddress,
        credentialContract: blockchainStatus.credentialAddress,
      },
      reconciliation,
    },
    auditLogs: auditResult.rows,
  });
}
