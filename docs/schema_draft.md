# Schema Draft

This is the draft shared backend schema for the future system. It is intentionally backend-ready but still marked as draft until the real persistence layer is chosen.

Code-first reference:
- `src/domain/config/schema-draft.ts`

## Entities

### `bookings`
- Purpose: shared booking record for customer web, future staff dashboard, and future social-assisted flows.
- Key fields:
  - `id`
  - `reference_code`
  - `customer_id`
  - `branch_id`
  - `source`
  - `channel`
  - `status`
  - `assigned_staff_mode`
  - `assigned_staff_id`
  - `date`
  - `start_time`
  - `estimated_end_time`
  - `duration_minutes`
  - `guest_count`
  - `set_type`
  - `nail_type`
  - `polish_style`
  - `effects`
  - `notes`
  - `anonymous_session_id`
  - `created_at`
  - `updated_at`
  - `confirmed_at`
  - `checked_in_at`
  - `actual_completed_at`
  - `cancelled_at`

### `customers`
- Purpose: normalized customer profile across all booking channels.
- Key fields:
  - `id`
  - `full_name`
  - `phone_e164`
  - `phone_display`
  - `notes`
  - `preferred_locale`
  - `anonymous_session_id`
  - `created_at`
  - `updated_at`

### `staff`
- Purpose: bookable technicians and internal staff users.
- Key fields:
  - `id`
  - `display_name`
  - `initials`
  - `branch_id`
  - `active`
  - `role`
  - `created_at`
  - `updated_at`

### `staff_working_schedules`
- Purpose: recurring or effective-dated working windows for each staff member.
- Key fields:
  - `id`
  - `staff_id`
  - `branch_id`
  - `day_of_week`
  - `start_time`
  - `end_time`
  - `is_working_day`
  - `timezone`
  - `effective_from`
  - `effective_to`
  - `created_at`
  - `updated_at`

### `block_off`
- Purpose: non-bookable windows for staff, branch, or global scope.
- Key fields:
  - `id`
  - `branch_id`
  - `staff_id`
  - `scope`
  - `title`
  - `reason`
  - `start_at`
  - `end_at`
  - `active`
  - `created_at`
  - `updated_at`

### `service_duration_rules`
- Purpose: configurable duration lookup rules used before slot fitting.
- Key fields:
  - `id`
  - `code`
  - `branch_id`
  - `set_type`
  - `nail_type`
  - `polish_style`
  - `effect_option`
  - `base_duration_minutes`
  - `guest_count_strategy`
  - `guest_count_multiplier`
  - `block_round_to_minutes`
  - `active`
  - `notes`
  - `created_at`
  - `updated_at`

### `audit_logs`
- Purpose: immutable log of booking lifecycle changes and other booking mutations.
- Key fields:
  - `id`
  - `entity_type`
  - `entity_id`
  - `action`
  - `previous_status`
  - `next_status`
  - `performed_by_actor_type`
  - `performed_by_actor_id`
  - `occurred_at`
  - `notes`
  - `payload`

## Key relationships

- `bookings.customer_id -> customers.id`
- `bookings.assigned_staff_id -> staff.id`
- `staff_working_schedules.staff_id -> staff.id`
- `block_off.staff_id -> staff.id`
- `audit_logs.entity_id -> bookings.id` when `entity_type = booking`

## Notes

- Multi-branch support remains optional in this draft. `branch_id` is present where it likely matters.
- `source` and `channel` intentionally stay separate to align with the SRS.
- `actual_completed_at` exists so completed-early slot release behavior can be implemented later.
