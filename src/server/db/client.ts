import postgres, { type Sql } from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __ki_postgres_sql__: Sql | undefined;
}

export function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    null
  );
}

export function isDatabaseConfigured() {
  return Boolean(getDatabaseUrl());
}

export function getSqlClient() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL (or POSTGRES_URL) is required for the shared Postgres runtime.",
    );
  }

  if (!global.__ki_postgres_sql__) {
    global.__ki_postgres_sql__ = postgres(databaseUrl, {
      max: 1,
      prepare: false,
    });
  }

  return global.__ki_postgres_sql__;
}
