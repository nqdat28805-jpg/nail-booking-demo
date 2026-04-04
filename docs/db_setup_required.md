# DB Setup Required

## Chosen DB path

Preferred MVP path in this codebase:
- Postgres-compatible connection string
- suited for Supabase Postgres or Neon Postgres

The runtime currently checks:
- `DATABASE_URL`
- `POSTGRES_URL`

If neither is set, the app falls back to the in-memory shared runtime.

## Required environment variables

Minimum:
- `DATABASE_URL`

Accepted alias:
- `POSTGRES_URL`

Recommended local `.env.local` example:

```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
```

## What setup the developer still needs to do

1. Provision a Postgres database in Supabase or Neon.
2. Add `DATABASE_URL` to local `.env.local`.
3. Add the same connection string to the Vercel project environment variables.
4. Restart the app.

## Schema bootstrap behavior

The current code auto-bootstraps the MVP tables on first runtime use when Postgres is configured:
- `staff`
- `staff_working_schedules`
- `block_off`
- `service_duration_rules`
- `bookings`

It also seeds demo rows for:
- staff
- working schedules
- block-off windows
- duration rules

The seed runs only when the `staff` table is empty.

## Current limitation

The current Postgres MVP path does not yet persist:
- `TEMP_HOLD`
- customer profiles
- audit logs

Those remain follow-up work for the next prompt.
