import { PrismaAdapter } from "@auth/prisma-adapter";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import prisma from "@/lib/db/prisma";

const isDev = process.env.NODE_ENV === "development";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],

  providers: [
    // Dev-only: sign in with any email, no password required
    ...(isDev ? [
      CredentialsProvider({
        id:   "dev-login",
        name: "Dev Login",
        credentials: {
          email: { label: "Email", type: "email", placeholder: "talia.frazier@northpointe.com" },
        },
        async authorize(credentials) {
          if (!credentials?.email) return null;
          // Upsert the dev user so the session works
          const user = await prisma.user.upsert({
            where:  { email: credentials.email },
            update: {},
            create: { email: credentials.email, name: credentials.email.split("@")[0], role: "ADMIN" },
          });
          return { id: user.id, email: user.email!, name: user.name };
        },
      }),
    ] : []),

    AzureADProvider({
      clientId:     process.env.AZURE_AD_CLIENT_ID ?? "placeholder",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? "placeholder",
      tenantId:     process.env.AZURE_AD_TENANT_ID ?? "placeholder",
      authorization: {
        params: { scope: "openid profile email User.Read" },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as typeof user & { role?: string }).role ?? "VIEWER";
      }
      return token;
    },

    async session({ session, token, user }) {
      if (session.user) {
        let id:   string | undefined = (token?.id   as string | undefined) ?? user?.id;
        let role: string | undefined = (token?.role as string | undefined) ?? (user as typeof user & { role?: string })?.role;

        // Stale JWT (missing id) — re-hydrate from DB by email
        if (!id && session.user.email) {
          const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
          if (dbUser) { id = dbUser.id; role = dbUser.role; }
        }

        (session.user as typeof session.user & { id: string; role: string }).id   = id   ?? "";
        (session.user as typeof session.user & { id: string; role: string }).role = role ?? "VIEWER";
      }
      return session;
    },

    async signIn({ user }) {
      return !!user.email;
    },
  },

  pages: {
    signIn:  "/login",
    error:   "/login",
  },

  session: {
    strategy: isDev ? "jwt" : "database",
    maxAge:   8 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
};
