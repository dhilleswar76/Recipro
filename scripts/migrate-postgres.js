const fs = require('node:fs/promises');
const path = require('node:path');
const { Pool } = require('pg');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (_) {}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('[migrate] DATABASE_URL not present in build environment. Skipping database migration during build step.');
    return;
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('[migrate] PostgreSQL schema successfully applied.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.warn(`[migrate] PostgreSQL migration note: ${error.message}`);
});