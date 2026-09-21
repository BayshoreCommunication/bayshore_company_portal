import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000/api/v1";

class InvalidLoginError extends CredentialsSignin {
  code = "invalid-credentials";
}

class AccountNotActiveError extends CredentialsSignin {
  code = "account-not-active";
}

class BackendUnreachableError extends CredentialsSignin {
  code = "backend-unreachable";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    // Matches the backend refresh token's lifetime (REFRESH_TOKEN_EXPIRES_IN).
    // proxy.ts rotates the access token and re-signs this cookie before it
    // expires — see the comment there for why this file's jwt() callback
    // must stay network-free.
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      name: "Staff Sign In",
      credentials: {
        identifier: { label: "Email or phone" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier;
        const password = credentials?.password;

        if (typeof identifier !== "string" || typeof password !== "string") {
          throw new InvalidLoginError("Email/phone and password are required");
        }

        let res: Response;
        try {
          res = await fetch(`${BACKEND_API_URL}/auth/signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, password }),
          });
        } catch {
          throw new BackendUnreachableError("Could not reach the server. Please try again.");
        }

        const body = await res.json().catch(() => null);

        // Backend refuses pending / inactive / blocked accounts with 403.
        if (res.status === 403) {
          throw new AccountNotActiveError(body?.message ?? "Account is not active");
        }

        if (
          !res.ok ||
          !body?.data?.accessToken ||
          !body?.data?.refreshToken ||
          !body?.data?.user
        ) {
          throw new InvalidLoginError(body?.message ?? "Invalid credentials");
        }

        const { user, accessToken, accessTokenExpiresAt, refreshToken } = body.data;

        // /auth/signin accepts every role, but this portal is staff-only:
        // clients belong in the client portal. Treat it like a wrong password
        // and revoke the refresh token the backend just issued.
        if (user.role === "client") {
          await fetch(`${BACKEND_API_URL}/auth/signout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          }).catch(() => undefined);
          throw new InvalidLoginError("Invalid credentials");
        }

        return {
          id: user._id,
          name: user.fullName ?? "",
          email: user.email ?? null,
          role: user.role,
          avatar: user.avatar ?? null,
          accessToken: accessToken as string,
          accessTokenExpiresAt: new Date(accessTokenExpiresAt).getTime(),
          refreshToken: refreshToken as string,
        };
      },
    }),
  ],
  callbacks: {
    // Deliberately network-free: this only ever seeds the token on a fresh
    // sign-in and otherwise passes it through unchanged. Rotating the access
    // token lives solely in proxy.ts, which is the only layer that can both
    // call the backend AND persist the resulting cookie — see the comment
    // there. If this callback also refreshed, a Server Component's auth()
    // call and proxy's auth() call would race to rotate the same stale
    // refresh token, and the backend's reuse-detection would kill the
    // session (this happened — see git history/commit message if reverted).
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.avatar = user.avatar ?? null;
        token.accessToken = user.accessToken;
        token.accessTokenExpiresAt = user.accessTokenExpiresAt;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role;
        session.user.avatar = token.avatar;
      }
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      return session;
    },
  },
});
