"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, ShieldAlert, UserX, RefreshCw, User, CheckCircle, CheckCheck } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface NotifData {
  slaBreaches:    number;
  unassignedUrgent: number;
  assignedToMe:   number;
  syncFailed:     boolean;
  lastSyncAt:     string | null;
  lastSyncErr:    string | null;
  total:          number;
}

interface DismissedState {
  slaBreaches:     number;
  unassignedUrgent: number;
  assignedToMe:    number;
  syncFailed:      boolean;
}

const STORAGE_KEY = "notif-dismissed";

function loadDismissed(): DismissedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DismissedState) : null;
  } catch { return null; }
}

function hasNewAlerts(data: NotifData, dismissed: DismissedState | null): boolean {
  if (!dismissed) return data.total > 0;
  return (
    data.slaBreaches     > dismissed.slaBreaches     ||
    data.unassignedUrgent > dismissed.unassignedUrgent ||
    data.assignedToMe    > dismissed.assignedToMe    ||
    (data.syncFailed && !dismissed.syncFailed)
  );
}

export function NotificationBell() {
  const [open,      setOpen]      = useState(false);
  const [data,      setData]      = useState<NotifData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [dismissed, setDismissed] = useState<DismissedState | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load dismissed state from localStorage on mount
  useEffect(() => { setDismissed(loadDismissed()); }, []);

  const fetchNotifs = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setData(d as NotifData))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkRead = useCallback(() => {
    if (!data) return;
    const next: DismissedState = {
      slaBreaches:      data.slaBreaches,
      unassignedUrgent: data.unassignedUrgent,
      assignedToMe:     data.assignedToMe,
      syncFailed:       data.syncFailed,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setDismissed(next);
  }, [data]);

  const hasNew = !loading && data ? hasNewAlerts(data, dismissed) : false;
  const count  = data?.total ?? 0;

  const items = data ? [
    {
      show:  data.slaBreaches > 0,
      icon:  ShieldAlert,
      color: "text-raspberry-500",
      bg:    "bg-raspberry-100 dark:bg-raspberry-900/30",
      title: "SLA Breaches",
      body:  `${data.slaBreaches} open ticket${data.slaBreaches !== 1 ? "s" : ""} past SLA target`,
      href:  "/tickets",
      badge: data.slaBreaches,
      urgent: true,
    },
    {
      show:  data.unassignedUrgent > 0,
      icon:  UserX,
      color: "text-amber-500",
      bg:    "bg-amber-100 dark:bg-amber-900/30",
      title: "Unassigned Urgent/High",
      body:  `${data.unassignedUrgent} ticket${data.unassignedUrgent !== 1 ? "s" : ""} with no technician assigned`,
      href:  "/tickets",
      badge: data.unassignedUrgent,
      urgent: false,
    },
    {
      show:  data.assignedToMe > 0,
      icon:  User,
      color: "text-blue-500",
      bg:    "bg-blue-100 dark:bg-blue-900/30",
      title: "Assigned to You",
      body:  `${data.assignedToMe} open ticket${data.assignedToMe !== 1 ? "s" : ""} on your plate`,
      href:  "/tickets",
      badge: data.assignedToMe,
      urgent: false,
    },
    {
      show:  data.syncFailed,
      icon:  RefreshCw,
      color: "text-destructive",
      bg:    "bg-destructive/10",
      title: "Sync Failed",
      body:  data.lastSyncErr ?? "Last sync did not complete successfully",
      href:  "/settings",
      badge: null,
      urgent: true,
    },
  ].filter((i) => i.show) : [];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors",
          open && "bg-muted",
        )}
      >
        <Bell size={15} className="text-muted-foreground" />
        {!loading && hasNew && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {count > 99 ? "99+" : count}
          </span>
        )}
        {!loading && !hasNew && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <div className="flex items-center gap-2">
              {hasNew && (
                <button
                  onClick={handleMarkRead}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  Mark read
                </button>
              )}
              <button onClick={fetchNotifs} className="text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <CheckCircle size={24} className="text-emerald-500" />
              <p className="text-sm">All clear — nothing needs attention</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <button
                  key={item.title}
                  onClick={() => { setOpen(false); router.push(item.href); }}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <span className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", item.bg)}>
                    <item.icon size={13} className={item.color} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.body}</p>
                  </div>
                  {item.badge !== null && (
                    <span className={cn(
                      "shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center",
                      item.urgent ? "bg-destructive text-destructive-foreground" : "bg-muted text-foreground",
                    )}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {data?.lastSyncAt && (
            <div className="px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground">
              Last sync: {formatDate(data.lastSyncAt, "MMM d 'at' h:mm a")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
