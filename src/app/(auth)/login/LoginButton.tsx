"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const isDev = process.env.NODE_ENV === "development";

export function LoginButton() {
  const [loading, setLoading]   = useState(false);
  const [email,   setEmail]     = useState("talia.frazier@northpointe.com");
  const [devMode, setDevMode]   = useState(
    // Show dev form automatically if Azure AD isn't configured
    typeof window !== "undefined" && !process.env.NEXT_PUBLIC_AZURE_CONFIGURED,
  );

  const handleAzureSignIn = async () => {
    setLoading(true);
    await signIn("azure-ad", { callbackUrl: "/" });
  };

  const handleDevSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn("dev-login", { email, callbackUrl: "/" });
  };

  return (
    <div className="space-y-4">
      {/* Dev login form — only shown in development */}
      {process.env.NODE_ENV !== "production" && (
        <form onSubmit={handleDevSignIn} className="space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-3 py-2">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
              Dev mode — no Azure AD required
            </p>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand-primary text-white font-medium hover:bg-brand-primary-light transition-colors disabled:opacity-70"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Signing in…" : "Sign in (Dev)"}
          </button>
        </form>
      )}

      {/* Divider */}
      {process.env.NODE_ENV !== "production" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" />or<div className="flex-1 h-px bg-border" />
        </div>
      )}

      {/* Azure AD button */}
      <button
        onClick={handleAzureSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-70"
      >
        <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
          <rect x="1"  y="1"  width="9" height="9" fill="#F25022" />
          <rect x="11" y="1"  width="9" height="9" fill="#7FBA00" />
          <rect x="1"  y="11" width="9" height="9" fill="#00A4EF" />
          <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
        </svg>
        Sign in with Microsoft (Azure AD)
      </button>
    </div>
  );
}
