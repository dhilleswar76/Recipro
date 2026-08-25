import { query, withTransaction } from './postgres';

// ---------------------------------------------------------------------------
// Primary DB interface — re-export postgres helpers so callers that imported
// from '@/lib/db' keep working without any change.
// ---------------------------------------------------------------------------
export { query, withTransaction } from './postgres';


// ---------------------------------------------------------------------------
// initDatabase — schema is applied once via `npm run db:migrate` before deploy.
// This is a no-op at runtime to keep Vercel serverless cold-starts clean.
// ---------------------------------------------------------------------------
export async function initDatabase(): Promise<void> {
  // Schema is managed by scripts/migrate-postgres.js — run it once before deploying.
  // Do NOT apply DDL on every cold start in production.
  console.log('[db] initDatabase: schema managed by migrate-postgres.js — skipping runtime apply.');
}


// ---------------------------------------------------------------------------
// safeAddColumn — adds a column to a table if it doesn't already exist.
// Uses information_schema (PostgreSQL-native) instead of SQLite PRAGMA.
// ---------------------------------------------------------------------------
export async function safeAddColumn(
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  try {
    const result = await query<{ column_name: string }>(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = $1
          AND column_name  = $2`,
      [table, column],
    );

    if (result.rows.length === 0) {
      await query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`, []);
    }
  } catch (err: any) {
    // Ignore if column already exists or table is not yet created
    console.warn(`[db] safeAddColumn(${table}.${column}):`, err.message);
  }
}

// ---------------------------------------------------------------------------
// syncSessionParticipants â€“ back-fills session_participants rows for any
// sessions that don't yet have entries (idempotent via ON CONFLICT DO NOTHING).
// ---------------------------------------------------------------------------
export async function syncSessionParticipants(): Promise<void> {
  try {
    const sessionsResult = await query<{
      id: string;
      teacher_id: string;
      learner_id: string;
      teacher_confirmed: boolean;
      learner_confirmed: boolean;
      created_at: string;
    }>(
      `SELECT s.id, s.teacher_id, s.learner_id, s.teacher_confirmed, s.learner_confirmed, s.created_at
         FROM sessions s
         LEFT JOIN session_participants sp ON s.id = sp.session_id
        WHERE sp.id IS NULL`,
      [],
    );

    if (sessionsResult.rows.length === 0) return;

    await withTransaction(async (client) => {
      for (const s of sessionsResult.rows) {
        if (s.teacher_id) {
          await client.query(
            `INSERT INTO session_participants (id, session_id, user_id, session_role, confirmed, created_at)
             VALUES ($1, $2, $3, 'TRAINER', $4, $5)
             ON CONFLICT DO NOTHING`,
            [`sp-${s.id}-trainer`, s.id, s.teacher_id, s.teacher_confirmed ?? false, s.created_at],
          );
        }
        if (s.learner_id) {
          await client.query(
            `INSERT INTO session_participants (id, session_id, user_id, session_role, confirmed, created_at)
             VALUES ($1, $2, $3, 'LEARNER', $4, $5)
             ON CONFLICT DO NOTHING`,
            [`sp-${s.id}-learner`, s.id, s.learner_id, s.learner_confirmed ?? false, s.created_at],
          );
        }
      }
    });
  } catch (err: any) {
    // Ignore sync errors during initial setup when tables may not exist yet
    console.warn('[db] syncSessionParticipants:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Re-export utility helpers that consumers previously imported from this module
// ---------------------------------------------------------------------------
export { isAcademicEmail } from './validations';
