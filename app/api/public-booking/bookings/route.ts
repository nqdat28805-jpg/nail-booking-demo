import { NextResponse } from "next/server";
import { getSharedBookingRuntime } from "@/src/server/runtime/shared-booking-runtime";
import { buildPaymentSummary } from "@/src/server/public-booking";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingDraft = body.bookingDraft;
    const guestDraft = body.guestDraft;
    const runtime = await getSharedBookingRuntime();

    const booking = await runtime.services.bookingService.createBooking({
      customer: {
        fullName: guestDraft.fullName,
        phoneE164: guestDraft.phoneE164,
        phoneDisplay: guestDraft.phone,
        anonymousSessionId: "customer-demo-session",
      },
      branchId: bookingDraft.branchId ?? "19nail-main",
      date: bookingDraft.date,
      startTime: bookingDraft.startTime,
      guestCount: bookingDraft.serviceSelections.guestCount,
      setType: bookingDraft.serviceSelections.setType,
      nailType: bookingDraft.serviceSelections.nailType,
      polishStyle: bookingDraft.serviceSelections.polishStyle,
      effects: bookingDraft.serviceSelections.effects,
      notes: guestDraft.note ?? bookingDraft.notes ?? null,
      source: bookingDraft.source,
      channel: bookingDraft.channel,
      assignedStaffMode: bookingDraft.availabilityMode,
      assignedStaffId:
        bookingDraft.staffId && bookingDraft.staffId !== "any"
          ? bookingDraft.staffId
          : null,
      shopId: "19nail-studio",
      pricingSummary: {
        shopId: "19nail-studio",
        priceListId: "19nail-studio-main-draft",
        serviceDisplayLabel: guestDraft.serviceLabel ?? bookingDraft.serviceLabel ?? null,
        quotedSubtotalLabel: null,
        quotedTotalLabel: null,
        currency: "VND",
      },
      paymentSummary: buildPaymentSummary({
        method: guestDraft.paymentMethod,
        transferReference: guestDraft.paymentDetails?.transferReference ?? null,
        maskedCardNumber: guestDraft.paymentDetails?.cardNumber ?? null,
      }),
      finalAvailabilityQuery: bookingDraft.availabilityQuery,
      activeHoldSlot: bookingDraft.holdSlot ?? null,
    });

    return NextResponse.json({
      source: runtime.source,
      booking,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create booking through the shared booking service.";
    const status = message.includes("final availability recheck") ? 409 : 400;

    return NextResponse.json(
      {
        message,
        alternativeSlots: [],
      },
      { status },
    );
  }
}
