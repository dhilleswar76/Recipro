/**
 * tests/test-db.js
 * Shared PostgreSQL test helper — replaces better-sqlite3 for all test files.
 * Reads DATABASE_URL from environment (set in .env or shell) and returns
 * a pg Pool with helpers that mirror the old SQLite API surface.
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL || !DATABASE_URL.startsWith('postgres')) {
  throw new Error(
    '[test-db] DATABASE_URL must be a PostgreSQL connection string. ' +
    'Copy .env to the project root and set DATABASE_URL.'
  );
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  ssl: DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
});

/**
 * Run a parameterised query and return the pg QueryResult.
 * @param {string} text  SQL with $1..$N placeholders
 * @param {any[]}  [params]
 */
async function query(text, params = []) {
  return pool.query(text, params);
}

/**
 * Shorthand: run a query and return all rows.
 * @param {string} text
 * @param {any[]}  [params]
 * @returns {Promise<any[]>}
 */
async function all(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

/**
 * Shorthand: run a query and return the first row (or undefined).
 * @param {string} text
 * @param {any[]}  [params]
 * @returns {Promise<any|undefined>}
 */
async function get(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows[0];
}

/**
 * Run a query with no return value needed (INSERT / UPDATE / DELETE).
 * @param {string} text
 * @param {any[]}  [params]
 */
async function run(text, params = []) {
  await pool.query(text, params);
}

/**
 * Execute raw SQL (no parameters). Useful for multi-statement DDL blocks.
 * Note: pg does not support multi-statement strings in parameterised mode,
 * so split on semicolons and run each statement individually.
 * @param {string} sql
 */
async function exec(sql) {
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  for (const stmt of statements) {
    await pool.query(stmt);
  }
}

/**
 * Close the pool when tests finish.
 */
async function close() {
  await pool.end();
}

module.exports = { pool, query, all, get, run, exec, close };
