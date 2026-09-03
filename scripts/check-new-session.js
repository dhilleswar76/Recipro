require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const sessionId = 'sess-1787684035293-3ha7e';
  const sess = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
  console.log('Session record:', sess.rows);

  const notifications = await pool.query('SELECT * FROM notifications LIMIT 5');
  console.log('Notifications sample:', notifications.rows);

  const notifPrefs = await pool.query('SELECT * FROM notification_preferences LIMIT 5');
  console.log('Notif prefs:', notifPrefs.rows);

  await pool.end();
}

check().catch(console.error);
