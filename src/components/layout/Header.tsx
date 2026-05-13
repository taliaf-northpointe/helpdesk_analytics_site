"use client";

import { Search, Sun, Moon, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  greeting:  string;
  subtitle?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  rightSlot?: React.ReactNode;
}

export function Header({ greeting, subtitle, onRefresh, refreshing, rightSlot }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !searchValue.trim()) return;
    router.push(`/tickets?q=${encodeURIComponent(searchValue.trim())}`);
    setSearchValue("");
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
      toast.info("Refreshing data…");
    }
  };

  return (
    <header className="relative flex flex-col gap-3 px-6 pt-6 pb-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{greeting}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search tickets…"
              onKeyDown={handleSearch}
              className="pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 w-64 placeholder:text-muted-foreground"
            />
          </div>

          {/* Ticket filter pills */}
          {rightSlot}

          {/* Refresh */}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors",
                refreshing && "opacity-50 cursor-not-allowed",
              )}
              title="Refresh data"
            >
              <RefreshCw size={15} className={cn("text-muted-foreground", refreshing && "animate-spin")} />
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors"
            title="Toggle theme"
          >
            {theme === "dark"
              ? <Sun size={15} className="text-muted-foreground" />
              : <Moon size={15} className="text-muted-foreground" />
            }
          </button>

          {/* Notifications */}
          <NotificationBell />
        </div>
      </div>

    </header>
  );
}
