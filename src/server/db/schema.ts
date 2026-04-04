import type { Sql } from "postgres";
import {
  DEMO_BLOCK_OFFS,
  DEMO_BRANCH_ID,
  DEMO_DURATION_RULES,
  DEMO_STAFF,
  DEMO_STAFF_SCHEDULES,
} from "@/src/server/demo/demo-seed";

declare global {
  // eslint-disable-next-line no-var
  var __ki_postgres_bootstrap_promise__: Promise<void> | undefined;
}

export function ensureDatabaseBootstrap(sql: Sql) {
  if (!global.__ki_postgres_bootstrap_promise__) {
    global.__ki_postgres_bootstrap_promise__ = bootstrapDatabase(sql);
  }

  return global.__ki_postgres_bootstrap_promise__;
}

async function bootstrapDatabase(sql: Sql) {
  await sql`
    create table if not exists staff (
      id text primary key,
      branch_id text,
      display_name text not null,
      initials text not null,
      is_active boolean not null default true,
      sort_order integer not null default 0,
      role text,
      created_at timestamptz not null,
      updated_at timestamptz not null
    )
  `;

  await sql`
    create table if not exists staff_working_schedules (
      id text primary key,
      staff_id text not null references staff(id) on delete cascade,
      branch_id text,
      weekday smallint not null,
      start_time time not null,
      end_time time not null,
      break_ranges jsonb not null default '[]'::jsonb,
      is_off boolean not null default false,
      timezone text not null,
      effective_from date,
      effective_to date,
      created_at timestamptz not null,
      updated_at timestamptz not null
    )
  `;

  await sql`
    create table if not exists block_off (
      id text primary key,
      branch_id text,
      scope text not null,
      staff_id text references staff(id) on delete cascade,
      date date not null,
      start_time time not null,
      end_time time not null,
      reason text,
      created_at timestamptz not null,
      updated_at timestamptz not null
    )
  `;

  await sql`
    create table if not exists service_duration_rules (
      id text primary key,
      code text not null unique,
      branch_id text,
      set_type text not null,
      nail_type text not null,
      polish_style text not null,
      effect_option text not null,
      base_duration_minutes integer not null,
      guest_count_strategy text not null,
      guest_count_multiplier numeric not null,
      block_round_to_minutes integer not null,
      is_active boolean not null default true,
      notes text,
      created_at timestamptz not null,
      updated_at timestamptz not null
    )
  `;

  await sql`
    create table if not exists bookings (
      id text primary key,
      reference_code text not null unique,
      shop_id text,
      branch_id text,
      customer_name text not null,
      customer_phone_normalized text not null,
      customer_phone_display text,
      date date not null,
      start_time time not null,
      estimated_duration_minutes integer not null,
      estimated_end_time time not null,
      guest_count integer not null,
      set_type text not null,
      nail_type text not null,
      polish_style text not null,
      effects jsonb not null default '[]'::jsonb,
      notes text,
      source text not null,
      booking_channel text not null,
      status text not null,
      assigned_staff_id text references staff(id) on delete set null,
      staff_mode text not null,
      payment_method text,
      payment_status text,
      payment_detail_label text,
      payment_detail_value text,
      service_label text,
      created_at timestamptz not null,
      updated_at timestamptz not null
    )
  `;

  await sql`
    create index if not exists bookings_date_staff_idx
    on bookings (date, assigned_staff_id, status)
  `;

  await sql`
    create index if not exists bookings_customer_phone_idx
    on bookings (customer_phone_normalized, date)
  `;

  await sql`
    create index if not exists staff_active_sort_idx
    on staff (is_active, sort_order)
  `;

  await sql`
    create index if not exists schedules_staff_weekday_idx
    on staff_working_schedules (staff_id, weekday)
  `;

  await sql`
    create index if not exists block_off_date_scope_idx
    on block_off (date, scope, staff_id)
  `;

  await sql`
    create index if not exists duration_rules_lookup_idx
    on service_duration_rules (branch_id, set_type, nail_type, polish_style, effect_option, is_active)
  `;

  const [{ count: staffCount }] =
    await sql<{ count: string }[]>`select count(*)::text as count from staff`;

  if (staffCount === "0") {
    for (const staff of DEMO_STAFF) {
      await sql`
        insert into staff (
          id, branch_id, display_name, initials, is_active, sort_order, role, created_at, updated_at
        ) values (
          ${staff.id},
          ${staff.branchId ?? DEMO_BRANCH_ID},
          ${staff.displayName},
          ${staff.initials},
          ${staff.active},
          ${staff.sortOrder ?? 0},
          ${staff.role ?? "staff"},
          ${staff.createdAt},
          ${staff.updatedAt}
        )
      `;
    }

    for (const schedule of DEMO_STAFF_SCHEDULES) {
      await sql`
        insert into staff_working_schedules (
          id, staff_id, branch_id, weekday, start_time, end_time, break_ranges, is_off, timezone, effective_from, effective_to, created_at, updated_at
        ) values (
          ${schedule.id},
          ${schedule.staffId},
          ${schedule.branchId ?? DEMO_BRANCH_ID},
          ${schedule.dayOfWeek},
          ${schedule.startTime},
          ${schedule.endTime},
          ${sql.json((schedule.breakRanges ?? []) as any)},
          ${!schedule.isWorkingDay},
          ${schedule.timezone},
          ${schedule.effectiveFrom ?? null},
          ${schedule.effectiveTo ?? null},
          ${schedule.createdAt},
          ${schedule.updatedAt}
        )
      `;
    }

    for (const block of DEMO_BLOCK_OFFS) {
      const start = new Date(block.startAt);
      const end = new Date(block.endAt);
      await sql`
        insert into block_off (
          id, branch_id, scope, staff_id, date, start_time, end_time, reason, created_at, updated_at
        ) values (
          ${block.id},
          ${block.branchId ?? DEMO_BRANCH_ID},
          ${block.scope === "branch" ? "salon" : block.scope},
          ${block.staffId ?? null},
          ${toIsoDate(start)},
          ${toTime(start)},
          ${toTime(end)},
          ${block.reason ?? block.title},
          ${block.createdAt},
          ${block.updatedAt}
        )
      `;
    }

    for (const rule of DEMO_DURATION_RULES) {
      await sql`
        insert into service_duration_rules (
          id, code, branch_id, set_type, nail_type, polish_style, effect_option, base_duration_minutes, guest_count_strategy, guest_count_multiplier, block_round_to_minutes, is_active, notes, created_at, updated_at
        ) values (
          ${rule.id},
          ${rule.code},
          ${rule.branchId ?? DEMO_BRANCH_ID},
          ${rule.setType},
          ${rule.nailType},
          ${rule.polishStyle},
          ${rule.effectOption},
          ${rule.baseDurationMinutes},
          ${rule.guestCountStrategy},
          ${rule.guestCountMultiplier},
          ${rule.blockRoundToMinutes},
          ${rule.active},
          ${rule.notes ?? null},
          ${rule.createdAt},
          ${rule.updatedAt}
        )
      `;
    }
  }
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function toTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}
