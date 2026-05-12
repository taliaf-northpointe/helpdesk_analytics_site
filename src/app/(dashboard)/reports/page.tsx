"use client";

import { Header } from "@/components/layout/Header";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { FileText, BarChart3, ShieldCheck, Users, Download } from "lucide-react";

const REPORT_TYPES = [
  { title: "Executive Summary",     icon: BarChart3,    description: "High-level KPIs, trends, and SLA overview for leadership.",    tag: "Monthly"  },
  { title: "SLA Compliance Report", icon: ShieldCheck,  description: "Detailed SLA performance breakdown by group and category.",   tag: "Weekly"   },
  { title: "Technician Performance",icon: Users,        description: "Agent-level metrics: tickets resolved, avg resolution, SLA%.", tag: "Monthly"  },
  { title: "Ticket Volume Trends",  icon: BarChart3,    description: "Volume trends over time with period-over-period comparison.", tag: "Custom"   },
  { title: "Category Analysis",     icon: FileText,     description: "Top issue categories and subcategories with trend indicators.", tag: "Monthly"  },
  { title: "Aging Report",          icon: FileText,     description: "Open tickets by age buckets: <1d, 1-3d, 3-7d, 7d+.",           tag: "Daily"    },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header greeting="Reports" subtitle="Generate and export analytics reports." />

      <div className="flex-1 px-6 py-5 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_TYPES.map((report) => (
            <div key={report.title} className="bg-card rounded-xl border border-border p-5 shadow-card card-hover flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-primary/10">
                  <report.icon size={20} className="text-brand-primary" />
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{report.tag}</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{report.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
              </div>
              <div className="flex gap-2 mt-auto pt-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-primary text-white text-xs font-medium hover:bg-brand-primary-light transition-colors">
                  <BarChart3 size={12} /> View
                </button>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                  <Download size={12} /> Export
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-2">Custom Report Builder</h3>
          <p className="text-sm text-muted-foreground">
            Use the AI Assistant (bottom-right) to generate custom ad-hoc reports in natural language.
            Try: <em>"Show me tickets by group for the last 30 days"</em> or <em>"Which categories are trending up this month?"</em>
          </p>
        </div>
      </div>

      <ChatWidget />
    </div>
  );
}
