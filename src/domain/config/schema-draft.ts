export interface SchemaFieldDraft {
  name: string;
  type: string;
  required: boolean;
  description: string;
  indexed?: boolean;
  unique?: boolean;
  references?: string;
}

export interface SchemaIndexDraft {
  name: string;
  fields: string[];
  unique?: boolean;
  description: string;
}

export interface SchemaRelationshipDraft {
  target: string;
  type: "belongs_to" | "has_many";
  description: string;
}

export interface SchemaEntityDraft {
  entity: string;
  description: string;
  fields: SchemaFieldDraft[];
  indexes: SchemaIndexDraft[];
  relationships: SchemaRelationshipDraft[];
  notes?: string[];
}

export const SHARED_SCHEMA_DRAFT: SchemaEntityDraft[] = [
  {
    entity: "bookings",
    description:
      "Shared booking records for website, social-assisted, phone-assisted, walk-in, and future staff dashboard operations.",
    fields: [
      { name: "id", type: "uuid", required: true, description: "Primary booking identifier.", unique: true },
      { name: "reference_code", type: "varchar(32)", required: true, description: "Human-friendly booking code for lookup.", indexed: true, unique: true },
      { name: "shop_id", type: "varchar(64)", required: false, description: "Shop identifier for future multi-shop pricing and reporting." },
      { name: "branch_id", type: "uuid", required: false, description: "Branch identifier when the shop has multiple locations.", indexed: true },
      { name: "customer_id", type: "uuid", required: false, description: "Optional link to a shared customer profile.", references: "customers.id", indexed: true },
      { name: "anonymous_session_id", type: "varchar(128)", required: false, description: "Temporary anonymous identifier for web-originated drafts." },
      { name: "customer_full_name", type: "varchar(255)", required: true, description: "Customer name snapshot stored on the booking." },
      { name: "customer_phone_e164", type: "varchar(32)", required: true, description: "Normalized phone snapshot for lookup and auditing.", indexed: true },
      { name: "customer_phone_display", type: "varchar(32)", required: false, description: "Display-friendly phone number snapshot." },
      { name: "date", type: "date", required: true, description: "Booking service date.", indexed: true },
      { name: "start_time", type: "time", required: true, description: "Shared slot start time.", indexed: true },
      { name: "estimated_end_time", type: "time", required: true, description: "Estimated end time from duration plus availability logic." },
      { name: "duration_minutes", type: "integer", required: true, description: "Estimated service duration before actual completion." },
      { name: "guest_count", type: "integer", required: true, description: "Number of guests included in the booking." },
      { name: "set_type", type: "enum", required: true, description: "Hands, feet, or both." },
      { name: "nail_type", type: "enum", required: true, description: "Natural, tip, builder gel, or future variants." },
      { name: "polish_style", type: "enum", required: true, description: "Gel solid, glitter, cat eye, chrome, or future polish types." },
      { name: "effects", type: "jsonb", required: true, description: "Selected effect options such as sticker or design." },
      { name: "notes", type: "text", required: false, description: "Customer or staff note field stored on the booking." },
      { name: "source", type: "enum", required: true, description: "Original booking source such as website, phone, or walk-in.", indexed: true },
      { name: "channel", type: "enum", required: true, description: "Handling channel such as web_self_booking or manual_staff_entry.", indexed: true },
      { name: "status", type: "enum", required: true, description: "Shared booking lifecycle state.", indexed: true },
      { name: "assigned_staff_mode", type: "enum", required: true, description: "Pool assignment or specific staff assignment." },
      { name: "assigned_staff_id", type: "uuid", required: false, description: "Specific assigned staff when not in pool mode.", references: "staff.id", indexed: true },
      { name: "payment_method", type: "enum", required: false, description: "Frontend-compatible payment method chosen during booking." },
      { name: "payment_status", type: "enum", required: false, description: "Demo-safe payment summary state for confirmation and later backend reconciliation." },
      { name: "payment_detail_label", type: "varchar(128)", required: false, description: "Short label used in confirmation summaries." },
      { name: "payment_detail_value", type: "varchar(255)", required: false, description: "Masked card summary, transfer reference, or similar payment detail." },
      { name: "pricing_shop_id", type: "varchar(64)", required: false, description: "Shop-scoped pricing source used to quote the booking." },
      { name: "pricing_price_list_id", type: "varchar(64)", required: false, description: "Versioned price list identifier for later pricing audit." },
      { name: "pricing_service_display_label", type: "varchar(255)", required: false, description: "Rendered service summary used in customer-facing confirmations." },
      { name: "pricing_quoted_total_label", type: "varchar(64)", required: false, description: "Display-friendly quoted price or price range." },
      { name: "confirmed_at", type: "timestamptz", required: false, description: "When the booking was confirmed." },
      { name: "checked_in_at", type: "timestamptz", required: false, description: "When the guest was checked in." },
      { name: "actual_completed_at", type: "timestamptz", required: false, description: "Actual completion time for future slot-release logic." },
      { name: "cancelled_at", type: "timestamptz", required: false, description: "Cancellation timestamp if the booking is cancelled." },
      { name: "created_at", type: "timestamptz", required: true, description: "Booking creation timestamp.", indexed: true },
      { name: "updated_at", type: "timestamptz", required: true, description: "Booking last update timestamp." },
      { name: "created_by_actor_type", type: "enum", required: true, description: "Customer, staff, or system actor that created the booking." },
      { name: "created_by_actor_id", type: "varchar(128)", required: false, description: "Actor identifier used for audit correlation." },
      { name: "updated_by_actor_type", type: "enum", required: false, description: "Last actor type to update the booking." },
      { name: "updated_by_actor_id", type: "varchar(128)", required: false, description: "Last actor identifier to update the booking." },
    ],
    indexes: [
      { name: "bookings_reference_code_uq", fields: ["reference_code"], unique: true, description: "Fast lookup by booking code." },
      { name: "bookings_date_staff_idx", fields: ["date", "assigned_staff_id", "status"], description: "Primary availability lookup path." },
      { name: "bookings_customer_phone_idx", fields: ["customer_phone_e164", "date"], description: "Customer self-service lookup path." },
      { name: "bookings_branch_date_idx", fields: ["branch_id", "date", "status"], description: "Shared branch/day schedule reporting." },
    ],
    relationships: [
      { target: "customers", type: "belongs_to", description: "Optional customer profile reference." },
      { target: "staff", type: "belongs_to", description: "Optional specific staff assignment." },
      { target: "audit_logs", type: "has_many", description: "Lifecycle and change history." },
    ],
    notes: [
      "Source and channel remain separate fields by design.",
      "TEMP_HOLD stays outside the booking status lifecycle and should not be stored in this table as a booking status.",
    ],
  },
  {
    entity: "customers",
    description:
      "Reusable customer profiles for web lookup, future staff search, and booking history linking.",
    fields: [
      { name: "id", type: "uuid", required: true, description: "Primary customer identifier.", unique: true },
      { name: "full_name", type: "varchar(255)", required: true, description: "Customer full name." },
      { name: "phone_e164", type: "varchar(32)", required: true, description: "Normalized phone lookup key.", unique: true, indexed: true },
      { name: "phone_display", type: "varchar(32)", required: false, description: "Display phone for UI reuse." },
      { name: "notes", type: "text", required: false, description: "Staff-facing customer notes." },
      { name: "preferred_locale", type: "varchar(16)", required: false, description: "Locale hint for future messaging." },
      { name: "anonymous_session_id", type: "varchar(128)", required: false, description: "Web session correlation while converting anonymous bookings." },
      { name: "latest_booking_id", type: "uuid", required: false, description: "Pointer to the most recent booking.", references: "bookings.id" },
      { name: "created_at", type: "timestamptz", required: true, description: "Customer creation timestamp." },
      { name: "updated_at", type: "timestamptz", required: true, description: "Customer last update timestamp." },
    ],
    indexes: [
      { name: "customers_phone_e164_uq", fields: ["phone_e164"], unique: true, description: "Primary customer lookup path." },
    ],
    relationships: [
      { target: "bookings", type: "has_many", description: "A customer can have many bookings." },
    ],
  },
  {
    entity: "staff",
    description:
      "Staff members assignable in both customer availability and future staff-side manual booking flows.",
    fields: [
      { name: "id", type: "uuid", required: true, description: "Primary staff identifier.", unique: true },
      { name: "branch_id", type: "uuid", required: false, description: "Default branch for this staff member.", indexed: true },
      { name: "display_name", type: "varchar(255)", required: true, description: "Public or internal staff display name." },
      { name: "initials", type: "varchar(8)", required: true, description: "Short initials used in UI avatars." },
      { name: "role", type: "enum", required: false, description: "Staff, manager, or admin role." },
      { name: "active", type: "boolean", required: true, description: "Whether the staff member can take bookings.", indexed: true },
      { name: "created_at", type: "timestamptz", required: true, description: "Staff record creation timestamp." },
      { name: "updated_at", type: "timestamptz", required: true, description: "Staff record last update timestamp." },
    ],
    indexes: [
      { name: "staff_branch_active_idx", fields: ["branch_id", "active"], description: "Active staff lookup for availability." },
    ],
    relationships: [
      { target: "staff_working_schedules", type: "has_many", description: "Recurring working schedule rows." },
      { target: "block_off", type: "has_many", description: "Staff-scoped block-off periods." },
      { target: "bookings", type: "has_many", description: "Bookings assigned to this staff member." },
    ],
  },
  {
    entity: "staff_working_schedules",
    description:
      "Recurring working schedule rows used by the shared availability engine for both public and staff flows.",
    fields: [
      { name: "id", type: "uuid", required: true, description: "Primary schedule identifier.", unique: true },
      { name: "staff_id", type: "uuid", required: true, description: "Staff member owning the schedule row.", references: "staff.id", indexed: true },
      { name: "branch_id", type: "uuid", required: false, description: "Branch scope when schedule differs by location.", indexed: true },
      { name: "day_of_week", type: "smallint", required: true, description: "Recurring weekday number." },
      { name: "start_time", type: "time", required: true, description: "Workday start time." },
      { name: "end_time", type: "time", required: true, description: "Workday end time." },
      { name: "is_working_day", type: "boolean", required: true, description: "Whether staff works on that weekday." },
      { name: "timezone", type: "varchar(64)", required: true, description: "Timezone used for schedule interpretation." },
      { name: "effective_from", type: "date", required: false, description: "Optional start date for schedule validity." },
      { name: "effective_to", type: "date", required: false, description: "Optional end date for schedule validity." },
      { name: "created_at", type: "timestamptz", required: true, description: "Row creation timestamp." },
      { name: "updated_at", type: "timestamptz", required: true, description: "Row update timestamp." },
    ],
    indexes: [
      { name: "staff_working_schedules_staff_day_idx", fields: ["staff_id", "day_of_week", "effective_from", "effective_to"], description: "Primary schedule lookup for a date and staff." },
    ],
    relationships: [
      { target: "staff", type: "belongs_to", description: "Schedule owner." },
    ],
  },
  {
    entity: "block_off",
    description:
      "Availability-blocking windows that may apply globally, by branch, or by specific staff.",
    fields: [
      { name: "id", type: "uuid", required: true, description: "Primary block-off identifier.", unique: true },
      { name: "branch_id", type: "uuid", required: false, description: "Branch scope for branch-level block-offs.", indexed: true },
      { name: "staff_id", type: "uuid", required: false, description: "Staff scope for staff-level block-offs.", references: "staff.id", indexed: true },
      { name: "scope", type: "enum", required: true, description: "Global, branch, or staff scope." },
      { name: "title", type: "varchar(255)", required: true, description: "Short display title." },
      { name: "reason", type: "text", required: false, description: "Operational reason for the block-off." },
      { name: "start_at", type: "timestamptz", required: true, description: "Block-off start timestamp.", indexed: true },
      { name: "end_at", type: "timestamptz", required: true, description: "Block-off end timestamp." },
      { name: "active", type: "boolean", required: true, description: "Soft-active flag for future scheduling controls.", indexed: true },
      { name: "created_at", type: "timestamptz", required: true, description: "Row creation timestamp." },
      { name: "updated_at", type: "timestamptz", required: true, description: "Row update timestamp." },
    ],
    indexes: [
      { name: "block_off_scope_time_idx", fields: ["scope", "branch_id", "staff_id", "start_at"], description: "Availability engine block-off lookup path." },
    ],
    relationships: [
      { target: "staff", type: "belongs_to", description: "Optional staff scope." },
    ],
  },
  {
    entity: "service_duration_rules",
    description:
      "Rule table used by duration estimation before availability is checked.",
    fields: [
      { name: "id", type: "uuid", required: true, description: "Primary duration rule identifier.", unique: true },
      { name: "code", type: "varchar(64)", required: true, description: "Stable business rule code.", unique: true, indexed: true },
      { name: "branch_id", type: "uuid", required: false, description: "Optional branch override scope.", indexed: true },
      { name: "set_type", type: "enum", required: true, description: "Hands, feet, or both." },
      { name: "nail_type", type: "enum", required: true, description: "Natural, tip, builder gel, or future types." },
      { name: "polish_style", type: "enum", required: true, description: "Polish style dimension." },
      { name: "effect_option", type: "enum", required: true, description: "Effect-specific rule targeting or catch-all any." },
      { name: "base_duration_minutes", type: "integer", required: true, description: "Base duration before guest/effect modifiers." },
      { name: "guest_count_strategy", type: "enum", required: true, description: "Sequential vs parallel scaling strategy." },
      { name: "guest_count_multiplier", type: "numeric(6,2)", required: true, description: "Multiplier used when guest strategy is not 1:1." },
      { name: "block_round_to_minutes", type: "integer", required: true, description: "Slot rounding unit used by the availability engine." },
      { name: "active", type: "boolean", required: true, description: "Whether the rule can still be used." },
      { name: "notes", type: "text", required: false, description: "Operational notes or TODO markers." },
      { name: "created_at", type: "timestamptz", required: true, description: "Row creation timestamp." },
      { name: "updated_at", type: "timestamptz", required: true, description: "Row update timestamp." },
    ],
    indexes: [
      { name: "service_duration_rules_lookup_idx", fields: ["branch_id", "set_type", "nail_type", "polish_style", "effect_option", "active"], description: "Primary duration rule lookup path." },
    ],
    relationships: [],
  },
  {
    entity: "audit_logs",
    description:
      "Append-only event history for booking lifecycle changes and future operator actions.",
    fields: [
      { name: "id", type: "uuid", required: true, description: "Primary audit entry identifier.", unique: true },
      { name: "entity_type", type: "enum", required: true, description: "Currently booking, extensible later." },
      { name: "entity_id", type: "uuid", required: true, description: "Entity identifier referenced by the audit row.", indexed: true },
      { name: "action", type: "enum", required: true, description: "Lifecycle or change action name.", indexed: true },
      { name: "previous_status", type: "enum", required: false, description: "Status before the action." },
      { name: "next_status", type: "enum", required: false, description: "Status after the action." },
      { name: "performed_by_actor_type", type: "enum", required: true, description: "Customer, staff, or system actor." },
      { name: "performed_by_actor_id", type: "varchar(128)", required: false, description: "Actor identifier if known." },
      { name: "notes", type: "text", required: false, description: "Optional audit note." },
      { name: "payload", type: "jsonb", required: false, description: "Structured metadata about the change." },
      { name: "occurred_at", type: "timestamptz", required: true, description: "When the action happened.", indexed: true },
    ],
    indexes: [
      { name: "audit_logs_entity_idx", fields: ["entity_type", "entity_id", "occurred_at"], description: "Audit lookup by entity in time order." },
    ],
    relationships: [
      { target: "bookings", type: "belongs_to", description: "Booking lifecycle history." },
    ],
  },
];
