const fs = require('node:fs/promises');
const path = require('node:path');
const { Pool } = require('pg');

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const schema = await fs.readFile(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('PostgreSQL schema is ready.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => { console.error(`PostgreSQL migration failed: ${error.message}`); process.exitCode = 1; });