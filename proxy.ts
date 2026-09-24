import { NextResponse, type NextRequest } from "next/server";
import { getToken, encode } from "next-auth/jwt";
import { BACKEND_API_URL } from "@/lib/backend";

const AUTH_ROUTES = ["/sign-in", "/forgot-password"];

// Refresh a bit before the access token actually expires, so no request ever
// races an access token that's a few seconds away from dying.
const REFRESH_SKEW_MS = 60 * 1000;

// Matches the backend refresh token's lifetime (REFRESH_TOKEN_EXPIRES_IN) —
// as long as the refresh token keeps rotating successfully below, the
// session stays alive for up to this long.
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

type SessionToken = Record<string, unknown> & {
  accessToken?: string;
  accessTokenExpiresAt?: number;
  refreshToken?: string;
};

type RefreshedBackendTokens = {
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  // Fresh profile fields from the backend, so a role/name/avatar change made by
  // an admin shows up without waiting for the user to sign in again.
  profile?: { name?: string; role?: string; avatar?: string | null };
};

// "invalid" = the backend explicitly rejected the refresh token (expired,
// revoked, reused, or the account is gone) — the session really is over.
// "error" = we couldn't get a definitive answer at all (network hiccup,
// backend mid-restart, 5xx, timeout) — the token itself may still be fine,
// so this must NOT be treated as a logout.
type RefreshOutcome = { status: "ok"; tokens: RefreshedBackendTokens } | { status: "invalid" } | { status: "error" };

// Next.js prefetches every visible <Link> on a page — the Sidebar alone
// fires off a dozen near-simultaneous requests. When the access token is
// close to expiry, every one of those requests hits this same proxy
// function around the same instant, all still carrying the SAME stale
// refresh token (none of them have seen another's Set-Cookie yet). Without
// de-duping, they'd all try to rotate that one token in parallel — only the
// first would succeed, and the backend's reuse-detection would treat every
// other concurrent attempt as token theft and revoke the lot, including the
// token the first call just issued. Concurrent invocations of this module
// share the same process/memory, so an in-memory single-flight cache keyed
// by the old refresh token is sufficient (no cross-instance store needed).
const refreshPromises = new Map<string, Promise<RefreshOutcome>>();

const refreshBackendTokens = (refreshToken: string): Promise<RefreshOutcome> => {
  const inFlight = refreshPromises.get(refreshToken);
  if (inFlight) return inFlight;

  const promise = (async (): Promise<RefreshOutcome> => {
    try {
      const res = await fetch(`${BACKEND_API_URL}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      // 401 here means the backend actually looked at the token and
      // rejected it — that's a real, definitive invalidation. Anything
      // else (500, 502, 503, ...) is the backend failing to answer, not
      // the backend saying no.
      if (res.status === 401) return { status: "invalid" };
      if (!res.ok) return { status: "error" };

      const body = await res.json().catch(() => null);
      if (!body?.data?.accessToken || !body?.data?.refreshToken) return { status: "error" };

      return {
        status: "ok",
        tokens: {
          accessToken: body.data.accessToken,
          accessTokenExpiresAt: new Date(body.data.accessTokenExpiresAt).getTime(),
          refreshToken: body.data.refreshToken,
          profile: body.data.user
            ? {
                name: body.data.user.fullName,
                role: body.data.user.role,
                avatar: body.data.user.avatar || null,
              }
            : undefined,
        },
      };
    } catch {
      // fetch threw — backend unreachable (down, restarting, timed out).
      // Definitely not proof the refresh token is invalid.
      return { status: "error" };
    } finally {
      // Keep the settled result cached briefly rather than deleting it the
      // instant it resolves — concurrent requests can still be a beat behind.
      setTimeout(() => refreshPromises.delete(refreshToken), 30_000);
    }
  })();

  refreshPromises.set(refreshToken, promise);
  return promise;
};

// Proxy is the ONLY place that talks to the backend to rotate the access
// token. It's also the only layer of this app that can persist an updated
// session cookie both forward (into this same request's downstream render,
// via the rewritten request headers) and back to the browser (via the
// response). A Server Component (the (main) layout) can decode the same
// cookie, but can't write it — if it also tried to refresh, it would race
// this call against the same stale refresh token, and the backend's
// reuse-detection would treat the second attempt as token theft and kill
// the whole session. So the layout's auth() call must stay a pure read.
export default async function proxy(req: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  const cookieName =
    req.nextUrl.protocol === "https:" ? "__Secure-authjs.session-token" : "authjs.session-token";

  const token = (await getToken({ req, secret, cookieName })) as SessionToken | null;
  const { pathname } = req.nextUrl;
  const isServerAction = req.headers.has("next-action");
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  let isLoggedIn = !!token;
  let refreshedCookieValue: string | null = null;

  if (
    token &&
    typeof token.accessTokenExpiresAt === "number" &&
    typeof token.refreshToken === "string" &&
    Date.now() >= token.accessTokenExpiresAt - REFRESH_SKEW_MS
  ) {
    const outcome = await refreshBackendTokens(token.refreshToken);

    if (outcome.status === "ok") {
      token.accessToken = outcome.tokens.accessToken;
      token.accessTokenExpiresAt = outcome.tokens.accessTokenExpiresAt;
      token.refreshToken = outcome.tokens.refreshToken;

      const { profile } = outcome.tokens;
      if (profile) {
        if (profile.name) token.name = profile.name;
        if (profile.role) token.role = profile.role;
        if (profile.avatar !== undefined) token.avatar = profile.avatar;
      }

      refreshedCookieValue = await encode({
        token,
        secret: secret as string,
        salt: cookieName,
        maxAge: SESSION_MAX_AGE,
      });
    } else if (outcome.status === "invalid") {
      // Refresh token is dead (expired, revoked, or already used) — the
      // session is over even though the outer Auth.js cookie hasn't expired.
      isLoggedIn = false;
    }
    // outcome.status === "error": the backend didn't give a definitive
    // answer (down, restarting, network blip). Don't log the user out over
    // it — just carry on with the existing cookie and try again next request.
  }

  if (!isLoggedIn) {
    // A server action (a form button like "Sign out", or a save) is answered with data, not a
    // redirect page — redirecting it makes the browser fail with "An unexpected response was
    // received from the server" and leaves the person stuck. So let it through: every action
    // checks its own token with the backend, and signing out clears the cookie itself.
    if (isAuthRoute || isServerAction) {
      const response = NextResponse.next();
      if (token) response.cookies.delete(cookieName);
      return response;
    }

    const signInUrl = new URL("/sign-in", req.nextUrl);
    signInUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(signInUrl);
    if (token) response.cookies.delete(cookieName);
    return response;
  }

  // The refresh token was already rotated on the backend above, so the browser
  // must receive the new cookie on every response — including a redirect —
  // or its next request would present the old, now-revoked token.
  const persistCookie = (response: NextResponse) => {
    if (!refreshedCookieValue) return response;
    response.cookies.set(cookieName, refreshedCookieValue, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: req.nextUrl.protocol === "https:",
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  };

  if (isAuthRoute) {
    return persistCookie(NextResponse.redirect(new URL("/dashboard", req.nextUrl)));
  }

  if (!refreshedCookieValue) {
    return NextResponse.next();
  }

  // Forward the rotated cookie into THIS request's downstream render...
  const requestHeaders = new Headers(req.headers);
  const remainingCookies = (requestHeaders.get("cookie") ?? "")
    .split("; ")
    .filter((part) => part && !part.startsWith(`${cookieName}=`));
  requestHeaders.set("cookie", [...remainingCookies, `${cookieName}=${refreshedCookieValue}`].join("; "));

  // ...and persist it for the browser's future requests.
  return persistCookie(NextResponse.next({ request: { headers: requestHeaders } }));
}

// Only optimistic checks here — run on every page route, skip static assets/API.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
