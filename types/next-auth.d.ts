import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    role: string;
    avatar: string | null;
    accessToken: string;
    accessTokenExpiresAt: number;
    refreshToken: string;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      avatar: string | null;
    } & DefaultSession["user"];
    accessToken: string;
    // Server-only: this app never renders the session to the client (no
    // SessionProvider/useSession), so it's safe to carry the refresh token
    // here purely for signOutAction to revoke it against the backend.
    refreshToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string;
    avatar: string | null;
    accessToken: string;
    accessTokenExpiresAt: number;
    refreshToken: string;
  }
}
