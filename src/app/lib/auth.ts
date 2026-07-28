import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const envWhitelist = process.env.WHITELIST_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
      const defaultAllowed = ["juridico.ironmasters@gmail.com", "contato.ironmasters@gmail.com"];
      const whitelist = Array.from(new Set([...envWhitelist, ...defaultAllowed]));
      const userEmail = user.email?.trim().toLowerCase() || "";
      console.log(`[NextAuth] SignIn Attempt: ${userEmail}`);
      console.log(`[NextAuth] Whitelist:`, whitelist);
      const isAllowed = whitelist.includes(userEmail);
      console.log(`[NextAuth] Access: ${isAllowed ? 'GRANTED' : 'DENIED'}`);
      return isAllowed;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).error = token.error;
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.expiresAt = account.expires_at;
        token.refreshToken = account.refresh_token;
        if (account.refresh_token) {
          try {
            const { prisma } = await import("./db");
            await prisma.systemConfig.upsert({
              where: { key: "google_refresh_token" },
              update: { value: account.refresh_token },
              create: { key: "google_refresh_token", value: account.refresh_token },
            });
          } catch (err) {
            console.warn("[NextAuth] Could not save refresh token to DB");
          }
        }
        return token;
      }

      // If token is not expired yet, return it
      // Google tokens expire in 1 hour. We refresh if we are within 5 minutes of expiration.
      if (token.expiresAt && Date.now() < ((token.expiresAt as number) - 5 * 60) * 1000) {
        return token;
      }

      // If token is expired but we have no refresh token in the JWT (e.g. old session), return error
      if (!token.refreshToken) {
        return { ...token, error: "RefreshAccessTokenError" };
      }

      // Access token has expired, try to update it
      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID || "",
            client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
            grant_type: "refresh_token",
            refresh_token: token.refreshToken as string,
          }),
          method: "POST",
        });

        const tokens = await response.json();

        if (!response.ok) throw tokens;

        return {
          ...token,
          accessToken: tokens.access_token,
          expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
          refreshToken: tokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
        };
      } catch (error) {
        console.error("Error refreshing access token", error);
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
