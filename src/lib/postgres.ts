import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

const globalForPostgres = globalThis as typeof globalThis & {
  postgresPool?: Pool;
};

function getPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !databaseUrl.startsWith('postgres')) {
    throw new Error(`DATABASE_URL must be a PostgreSQL connection string. Found: ${databaseUrl ? 'non-postgres string' : 'undefined'}`);
  }

  if (!globalForPostgres.postgresPool) {
    const isLocalhost = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
    const useSsl = !isLocalhost || databaseUrl.includes('sslmode=require') || databaseUrl.includes('ssl=true');

    globalForPostgres.postgresPool = new Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    });
  }

  return globalForPostgres.postgresPool;
}

export function query<Row extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<Row>> {
  return getPool().query<Row>(text, values);
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