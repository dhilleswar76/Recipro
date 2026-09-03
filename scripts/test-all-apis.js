require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testChat() {
  const sessionId = 'sess-1787684035293-3ha7e';
  const userId = 'usr-1787671566812-0bhuk';

  try {
    const sessionResult = await pool.query(`
      SELECT s.*, sk.name as skill_name,
             tp.display_name as teacher_name, lp.display_name as learner_name
      FROM sessions s
      LEFT JOIN skills sk ON s.skill_id = sk.id
      LEFT JOIN profiles tp ON s.teacher_id = tp.user_id
      LEFT JOIN profiles lp ON s.learner_id = lp.user_id
      WHERE s.id = $1
    `, [sessionId]);
    console.log('Session query:', sessionResult.rows[0]);

    const chatResult = await pool.query(`
      SELECT m.*, p.display_name as sender_name, p.avatar as sender_avatar
      FROM chat_messages m
      LEFT JOIN profiles p ON m.sender_id = p.user_id
      WHERE m.session_id = $1
      ORDER BY m.created_at ASC
    `, [sessionId]);
    console.log('Chat result:', chatResult.rows);

    const padResult = await pool.query(`
      SELECT * FROM session_scratchpads WHERE session_id = $1
    `, [sessionId]);
    console.log('Pad result:', padResult.rows);

    const sigResult = await pool.query(`
      SELECT id, session_id, sender_id, receiver_id, signal_type, payload_json, created_at
      FROM session_signaling_messages
      WHERE session_id = $1 AND sender_id != $2 AND is_consumed = false AND created_at >= CURRENT_TIMESTAMP - INTERVAL '30 seconds'
      ORDER BY created_at ASC
      LIMIT 20
    `, [sessionId, userId]);
    console.log('Sig result:', sigResult.rows);

    console.log('✅ ALL API queries succeeded perfectly in DB!');
  } catch (err) {
    console.error('❌ Query error:', err);
  } finally {
    await pool.end();
  }
}

testChat();
