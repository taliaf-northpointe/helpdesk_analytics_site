"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { toast } from "sonner";
import { Save, RefreshCw, Database } from "lucide-react";

export default function SettingsPage() {
  const [sdpUrl,        setSdpUrl]        = useState("");
  const [portalName,    setPortalName]    = useState("");
  const [syncInterval,  setSyncInterval]  = useState("15");
  const [syncing,       setSyncing]       = useState(false);
  const [syncStatus,    setSyncStatus]    = useState<{ lastSync: string | null; ticketCount: number; status: string } | null>(null);

  useEffect(() => {
    fetch("/api/sync")
      .then((r) => r.json())
      .then((d) => setSyncStatus(d as typeof syncStatus))
      .catch(() => {});
  }, []);

  const triggerSync = async (type: "FULL" | "INCREMENTAL") => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type }),
      });
      const data = await res.json() as { success?: boolean; ticketCount?: number; error?: string };
      if (data.success) toast.success(`Sync complete — ${data.ticketCount?.toLocaleString()} tickets processed.`);
      else toast.error(data.error ?? "Sync failed");
    } catch {
      toast.error("Sync request failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header greeting="Settings" subtitle="Configure integrations, sync schedules, and preferences." />

      <div className="flex-1 px-6 py-5 max-w-3xl space-y-6">

        {/* SDP Configuration */}
        <section className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
          <h2 className="text-base font-semibold text-foreground">ServiceDesk Plus Integration</h2>
          <p className="text-sm text-muted-foreground">
            Credentials are loaded from environment variables (<code className="text-xs bg-muted px-1 py-0.5 rounded">.env</code>).
            Modify them there and redeploy to update.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SDP Base URL</label>
              <input value={process.env.NEXT_PUBLIC_SDP_BASE_URL ?? "Loaded from environment"} readOnly
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/50 text-muted-foreground cursor-not-allowed" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Auth Method</label>
              <input value="Zoho OAuth2 (refresh token)" readOnly
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/50 text-muted-foreground cursor-not-allowed" />
            </div>
          </div>
        </section>

        {/* Sync controls */}
        <section className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
          <h2 className="text-base font-semibold text-foreground">Data Sync</h2>
          {syncStatus && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
              <Database size={16} />
              <span>{syncStatus.ticketCount?.toLocaleString() ?? 0} tickets in database</span>
              <span>·</span>
              <span>Last sync: {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : "Never"}</span>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => triggerSync("INCREMENTAL")} disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-secondary text-white text-sm font-medium hover:bg-brand-secondary-dark disabled:opacity-50 transition-colors">
              {syncing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Incremental Sync
            </button>
            <button onClick={() => triggerSync("FULL")} disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors">
              Full Sync (slow)
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Incremental sync fetches tickets updated since the last successful sync. Full sync re-imports all tickets.</p>
        </section>

        {/* AI Configuration */}
        <section className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
          <h2 className="text-base font-semibold text-foreground">AI Assistant (Claude)</h2>
          <p className="text-sm text-muted-foreground">
            The chatbot uses Anthropic Claude with live ServiceDesk Plus data. Configure via environment variables.
          </p>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</label>
            <input value={process.env.NEXT_PUBLIC_CLAUDE_MODEL ?? "claude-sonnet-4-6"} readOnly
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/50 text-muted-foreground cursor-not-allowed" />
          </div>
        </section>
      </div>

      <ChatWidget />
    </div>
  );
}
