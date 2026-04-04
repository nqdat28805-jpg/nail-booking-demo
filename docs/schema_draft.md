# Schema Draft

Code-first source:
- `src/domain/config/schema-draft.ts`

This draft is now closer to implementation. Each entity includes required fields, optional fields, relationships, and important indexes.

## Entities

### `bookings`
- Required:
  - `id`
  - `reference_code`
  - `customer_full_name`
  - `customer_phone_e164`
  - `date`
  - `start_time`
  - `estimated_end_time`
  - `duration_minutes`
  - `guest_count`
  - `set_type`
  - `nail_type`
  - `polish_style`
  - `effects`
  - `source`
  - `channel`
  - `status`
  - `assigned_staff_mode`
  - `created_at`
  - `updated_at`
  - `created_by_actor_type`
- Optional:
  - `shop_id`
  - `branch_id`
  - `customer_id`
  - `anonymous_session_id`
  - `customer_phone_display`
  - `notes`
  - `assigned_staff_id`
  - `payment_method`
  - `payment_status`
  - `payment_detail_label`
  - `payment_detail_value`
  - `pricing_shop_id`
  - `pricing_price_list_id`
  - `pricing_service_display_label`
  - `pricing_quoted_total_label`
  - `confirmed_at`
  - `checked_in_at`
  - `actual_completed_at`
  - `cancelled_at`
  - `created_by_actor_id`
  - `updated_by_actor_type`
  - `updated_by_actor_id`
- Relationships:
  - `bookings.customer_id -> customers.id`
  - `bookings.assigned_staff_id -> staff.id`
  - `bookings.id <- audit_logs.entity_id`
- Key indexes:
  - unique `reference_code`
  - `(date, assigned_staff_id, status)`
  - `(customer_phone_e164, date)`
  - `(branch_id, date, status)`

### `customers`
- Required:
  - `id`
  - `full_name`
  - `phone_e164`
  - `created_at`
  - `updated_at`
- Optional:
  - `phone_display`
  - `notes`
  - `preferred_locale`
  - `anonymous_session_id`
  - `latest_booking_id`
- Relationship:
  - `customers.id <- bookings.customer_id`
- Key index:
  - unique `phone_e164`

### `staff`
- Required:
  - `id`
  - `display_name`
  - `initials`
  - `active`
  - `created_at`
  - `updated_at`
- Optional:
  - `branch_id`
  - `role`
- Relationships:
  - `staff.id <- bookings.assigned_staff_id`
  - `staff.id <- staff_working_schedules.staff_id`
  - `staff.id <- block_off.staff_id`
- Key index:
  - `(branch_id, active)`

### `staff_working_schedules`
- Required:
  - `id`
  - `staff_id`
  - `day_of_week`
  - `start_time`
  - `end_time`
  - `is_working_day`
  - `timezone`
  - `created_at`
  - `updated_at`
- Optional:
  - `branch_id`
  - `effective_from`
  - `effective_to`
- Relationship:
  - `staff_working_schedules.staff_id -> staff.id`
- Key index:
  - `(staff_id, day_of_week, effective_from, effective_to)`

### `block_off`
- Required:
  - `id`
  - `scope`
  - `title`
  - `start_at`
  - `end_at`
  - `active`
  - `created_at`
  - `updated_at`
- Optional:
  - `branch_id`
  - `staff_id`
  - `reason`
- Relationship:
  - optional `block_off.staff_id -> staff.id`
- Key index:
  - `(scope, branch_id, staff_id, start_at)`

### `service_duration_rules`
- Required:
  - `id`
  - `code`
  - `set_type`
  - `nail_type`
  - `polish_style`
  - `effect_option`
  - `base_duration_minutes`
  - `guest_count_strategy`
  - `guest_count_multiplier`
  - `block_round_to_minutes`
  - `active`
  - `created_at`
  - `updated_at`
- Optional:
  - `branch_id`
  - `notes`
- Key index:
  - `(branch_id, set_type, nail_type, polish_style, effect_option, active)`

### `audit_logs`
- Required:
  - `id`
  - `entity_type`
  - `entity_id`
  - `action`
  - `performed_by_actor_type`
  - `occurred_at`
- Optional:
  - `previous_status`
  - `next_status`
  - `performed_by_actor_id`
  - `notes`
  - `payload`
- Relationship:
  - `audit_logs.entity_id -> bookings.id` when `entity_type = booking`
- Key index:
  - `(entity_type, entity_id, occurred_at)`

## Notes

- `source` and `channel` stay separate.
- Booking lifecycle fields are compatible with `pending`, `confirmed`, `checked_in`, `completed`, `cancelled`, `no_show`, and `late_show`.
- Payment fields are compatible with the current Step 3 and Step 4 demo flow, but still draft-level.
- Shop-specific pricing support is modeled through pricing snapshot fields without turning the app into full multi-tenant logic yet.
