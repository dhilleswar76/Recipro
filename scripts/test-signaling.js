require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
  const sessionId = 'sess-1787681006379-16xu5';
  const userId = 'usr-1787671566812-0bhuk';
  const signalId = `sig-${sessionId}-${Date.now()}`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      INSERT INTO session_signaling_messages (
        id, session_id, sender_id, receiver_id, signal_type, payload_json, is_consumed, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, false, CURRENT_TIMESTAMP)
    `, [signalId, sessionId, userId, 'usr-1787678637284-47w0x', 'OFFER', JSON.stringify({ type: 'offer', sdp: 'test' })]);

    await client.query(`
      INSERT INTO session_room_presence (
        id, session_id, user_id, display_name, role, camera_on, mic_on, screen_sharing, status, last_ping
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CONNECTED', CURRENT_TIMESTAMP)
      ON CONFLICT(session_id, user_id) DO UPDATE SET
        display_name = excluded.display_name,
        role = excluded.role,
        camera_on = COALESCE($9, session_room_presence.camera_on),
        mic_on = COALESCE($10, session_room_presence.mic_on),
        screen_sharing = COALESCE($11, session_room_presence.screen_sharing),
        status = 'CONNECTED',
        last_ping = CURRENT_TIMESTAMP
    `, [
      `pres-${sessionId}-${userId}`,
      sessionId,
      userId,
      'anill',
      'LEARNER',
      true,
      true,
      false,
      true,
      true,
      false
    ]);
    await client.query('COMMIT');
    console.log('✅ Signaling & Presence SQL succeeded!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ SQL failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

test();
