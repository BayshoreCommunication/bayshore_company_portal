// Where clients book their onboarding call: a Google Calendar appointment schedule (the client
// portal's lib/booking.ts has the same one). The calls booked on it are in the calendar that
// owns it — open that to see when a client's call is. Nothing here reads it.
export const BOOKING_URL = "https://calendar.google.com/calendar/appointments/schedules/AcZssZ3xiwhgZG7-JPeXm3m_pZVueFOj54UnDfxT_JWB3ixQ5v88SIsI-coqD6knMrZzf4k38WzCDkU2";
export const CALENDAR_URL = process.env.NEXT_PUBLIC_BOOKING_CALENDAR_URL || "https://calendar.google.com/calendar/r";
// The Google calendar that owns the booking page (usually its account's email): the Calendar page
// shows it, with each booked call on its day. Read when the portal is built.
export const BOOKING_CALENDAR_ID = process.env.NEXT_PUBLIC_BOOKING_CALENDAR_ID || "";
