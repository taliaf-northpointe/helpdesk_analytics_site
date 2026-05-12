import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { LoginButton } from "./LoginButton";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-primary via-brand-primary-light to-brand-secondary">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-glass p-10 mx-4">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary text-white font-bold text-xl">
              N
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground leading-tight">Northpointe Bank</h2>
              <p className="text-xs text-muted-foreground">IT Help Desk Analytics</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Sign in with your Northpointe Microsoft account to continue.
          </p>

          <LoginButton />

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Access is restricted to Northpointe Bank employees.<br />
            Contact IT for access issues.
          </p>
        </div>
      </div>
    </div>
  );
}
