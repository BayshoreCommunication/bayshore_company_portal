import { cookies } from "next/headers";

// The pass from the services security code (app/actions/servicesLock.ts), in a cookie only the
// server reads. Not a server action, so the browser can't ask for it.
export const SERVICES_PASS_COOKIE = "bs_services_unlock";

// Whether the Services pages ask for the code. Off for now — the passwords still do (backend:
// utils/serviceLock.ts → SERVICES_NEED_CODE, kept in step).
export const SERVICES_NEED_CODE = false;

export const servicesPass = async () => (await cookies()).get(SERVICES_PASS_COOKIE)?.value;
