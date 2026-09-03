require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
  const sessionId = 'sess-1787681006379-16xu5';
  const userId = 'usr-1787671566812-0bhuk';

  try {
    const pad = await pool.query('SELECT * FROM session_scratchpads WHERE session_id = $1', [sessionId]);
    console.log('Scratchpad in DB:', pad.rows);

    await pool.query(`
      INSERT INTO session_scratchpads (id, session_id, content, language, updated_by, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT(session_id) DO UPDATE SET
        content = excluded.content,
        language = COALESCE(excluded.language, session_scratchpads.language),
        updated_by = excluded.updated_by,
        updated_at = CURRENT_TIMESTAMP
    `, [`pad-${sessionId}`, sessionId, 'test content', 'javascript', userId]);
    console.log('✅ Scratchpad save succeeded!');

    const chat = await pool.query('SELECT * FROM chat_messages WHERE session_id = $1', [sessionId]);
    console.log('Chat in DB:', chat.rows);

    console.log('✅ All queries succeeded!');
  } catch (err) {
    console.error('❌ Query failed:', err);
  } finally {
    await pool.end();
  }
}

test();
