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
      const whitelist = process.env.WHITELIST_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
      const userEmail = user.email?.trim().toLowerCase() || "";
      console.log(`[NextAuth] SignIn Attempt: ${userEmail}`);
      console.log(`[NextAuth] Whitelist:`, whitelist);
      const isAllowed = whitelist.includes(userEmail);
      console.log(`[NextAuth] Access: ${isAllowed ? 'GRANTED' : 'DENIED'}`);
      return isAllowed;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        if (account.refresh_token) {
          // Salvar refresh_token no banco para uso em background
          const { prisma } = require("./db");
          await prisma.systemConfig.upsert({
            where: { key: "google_refresh_token" },
            update: { value: account.refresh_token },
            create: { key: "google_refresh_token", value: account.refresh_token },
          });
        }
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
