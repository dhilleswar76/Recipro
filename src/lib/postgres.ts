import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

const globalForPostgres = globalThis as typeof globalThis & {
  postgresPool?: Pool;
};

function getPool(): Pool {
  if (!databaseUrl || !databaseUrl.startsWith('postgres')) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection string');
  }

  if (!globalForPostgres.postgresPool) {
    globalForPostgres.postgresPool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
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