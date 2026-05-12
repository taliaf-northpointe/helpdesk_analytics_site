"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function LoginButton() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn("azure-ad", { callbackUrl: "/" });
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-brand-primary text-white font-medium hover:bg-brand-primary-light transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        // Microsoft icon (simplified SVG)
        <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
          <rect x="1"  y="1"  width="9" height="9" fill="#F25022" />
          <rect x="11" y="1"  width="9" height="9" fill="#7FBA00" />
          <rect x="1"  y="11" width="9" height="9" fill="#00A4EF" />
          <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
        </svg>
      )}
      {loading ? "Signing in…" : "Sign in with Microsoft"}
    </button>
  );
}
