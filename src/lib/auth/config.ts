import { PrismaAdapter } from "@auth/prisma-adapter";
import AzureADProvider from "next-auth/providers/azure-ad";
import type { NextAuthOptions } from "next-auth";
import prisma from "@/lib/db/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],

  providers: [
    AzureADProvider({
      clientId:     process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId:     process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
  ],

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as typeof session.user & { id: string; role: string }).id   = user.id;
        (session.user as typeof session.user & { id: string; role: string }).role = (user as typeof user & { role: string }).role ?? "VIEWER";
      }
      return session;
    },

    async signIn({ user }) {
      // Allow all users from the configured tenant.
      // You can add domain allowlist logic here.
      return !!user.email;
    },
  },

  pages: {
    signIn:  "/login",
    error:   "/login",
  },

  session: {
    strategy: "database",
    maxAge:   8 * 60 * 60, // 8 hours
  },

  secret: process.env.NEXTAUTH_SECRET,
};
