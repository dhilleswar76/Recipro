import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

const globalForPostgres = globalThis as typeof globalThis & {
  postgresPool?: Pool;
};

export function getPool(): Pool {
  let databaseUrl = (process.env.DATABASE_URL || '').trim().replace(/^["']|["']$/g, '');

  if (!databaseUrl || !databaseUrl.startsWith('postgres')) {
    throw new Error(`DATABASE_URL environment variable is missing or not a valid PostgreSQL connection string.`);
  }

  if (!globalForPostgres.postgresPool) {
    const isLocalhost = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
    const useSsl = !isLocalhost || databaseUrl.includes('sslmode=require') || databaseUrl.includes('ssl=true') || databaseUrl.includes('render.com') || databaseUrl.includes('neon.tech') || databaseUrl.includes('supabase.co');

    const pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    });

    pool.on('error', (err) => {
      console.error('[pg-pool] Unexpected error on idle client:', err.message);
    });

    globalForPostgres.postgresPool = pool;
  }

  return globalForPostgres.postgresPool;
}

export async function query<Row extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<Row>> {
  try {
    return await getPool().query<Row>(text, values);
  } catch (error: any) {
    console.error('[db-query-error]', error.message, 'Query:', text.substring(0, 100));
    throw error;
  }
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}