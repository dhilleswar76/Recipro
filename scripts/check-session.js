require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const sessionId = 'sess-1787681006379-16xu5';
  const sess = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
  console.log('Session:', sess.rows[0]);

  const presence = await pool.query('SELECT * FROM session_room_presence WHERE session_id = $1', [sessionId]);
  console.log('Presence in room:', presence.rows);

  const signals = await pool.query('SELECT * FROM session_signaling_messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 5', [sessionId]);
  console.log('Signals in room:', signals.rows);
  
  await pool.end();
}

main().catch(console.error);
