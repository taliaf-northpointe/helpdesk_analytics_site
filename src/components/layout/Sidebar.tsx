"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FileText, Ticket, BarChart3,
  ShieldCheck, Settings, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ColorThemeSwitcher } from "@/components/layout/ColorThemeSwitcher";
import { SidebarVine, SleepingCat, SidebarBeardie } from "@/components/layout/LofiDecor";

const NAV_ITEMS = [
  { href: "/",            icon: LayoutDashboard, label: "Dashboard"   },
  { href: "/reports",     icon: FileText,         label: "Reports"     },
  { href: "/tickets",     icon: Ticket,           label: "Tickets"     },
  { href: "/analytics",  icon: BarChart3,         label: "Analytics"   },
  { href: "/sla-monitor", icon: ShieldCheck,      label: "SLA Monitor" },
  { href: "/settings",   icon: Settings,          label: "Settings"    },
];

export function Sidebar() {
  const pathname   = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 220 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex flex-col h-screen bg-brand-primary text-white shrink-0 overflow-hidden"
    >
      {/* Lofi: vertical vine along left edge */}
      <div className="lofi-decor">
        <SidebarVine />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 text-white font-bold text-lg shrink-0">
          N
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="font-semibold text-sm leading-tight whitespace-nowrap"
            >
              Northpointe
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Menu label */}
      {!collapsed && (
        <p className="px-4 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">
          Menu
        </p>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                active
                  ? "bg-brand-secondary text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon size={18} className="shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.12 }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Color theme switcher */}
      <div className="px-2 pb-1">
        <ColorThemeSwitcher collapsed={collapsed} />
      </div>

      {/* Lofi: bearded dragon + sleeping cat */}
      <div className="lofi-decor flex justify-center items-end gap-1 px-1 shrink-0">
        <SidebarBeardie />
        <SleepingCat />
      </div>

      {/* User profile */}
      <div className="px-2 pb-4 border-t border-white/10 pt-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-accent text-brand-primary-dark font-bold text-sm shrink-0">
            TF
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0"
              >
                <p className="text-sm font-medium text-white truncate">Talia Frazier</p>
                <p className="text-xs text-white/50">Admin</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute top-1/2 -right-3 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary border border-white/20 text-white hover:bg-brand-primary-light transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
