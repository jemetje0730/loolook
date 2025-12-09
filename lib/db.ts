import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not set');
}

export const sql = postgres(process.env.DATABASE_URL, { prepare: true });
