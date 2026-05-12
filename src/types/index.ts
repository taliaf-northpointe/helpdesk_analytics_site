import type { TicketStatus, TicketPriority, UserRole } from "@prisma/client";

export type { TicketStatus, TicketPriority, UserRole };

// ─── KPI / Analytics ─────────────────────────────────────────────────────────

export interface KPIData {
  totalTickets:     number;
  openTickets:      number;
  closedTickets:    number;
  slaCompliance:    number;   // 0–100 %
  avgResolutionTime: number;  // hours
  slaBreaches:      number;
  inProgressTickets: number;
  resolvedTickets:  number;

  // Period-over-period deltas (%)
  deltaTotal?:      number;
  deltaOpen?:       number;
  deltaClosed?:     number;
  deltaSla?:        number;
  deltaResolution?: number;
}

export interface TrendPoint {
  date:   string;    // ISO date string
  label:  string;    // display label (e.g. "Jan", "Week 3")
  count:  number;
  open?:  number;
  closed?: number;
  resolved?: number;
}

export interface GroupPerformance {
  groupId:      string;
  groupName:    string;
  totalTickets: number;
  open:         number;
  closed:       number;
  slaPercent:   number;
  breaches:     number;
  avgResolutionHours: number;
}

export interface CategoryBreakdown {
  categoryId:   string;
  categoryName: string;
  count:        number;
  trend:        "up" | "down" | "flat";
  subcategories: { name: string; count: number }[];
}

export interface TechnicianPerformance {
  technicianId:       string;
  technicianName:     string;
  resolved:           number;
  open:               number;
  avgRating:          number;
  slaPercent:         number;
  avgResolutionHours: number;
}

export interface StatusBreakdown {
  open:       number;
  inProgress: number;
  onHold:     number;
  resolved:   number;
  closed:     number;
}

export interface PriorityBreakdown {
  low:    number;
  medium: number;
  high:   number;
  urgent: number;
}

export interface DashboardData {
  kpis:         KPIData;
  trends:       TrendPoint[];
  statusBreakdown: StatusBreakdown;
  priorityBreakdown: PriorityBreakdown;
  groupPerformance: GroupPerformance[];
  categoryBreakdown: CategoryBreakdown[];
  technicianPerformance: TechnicianPerformance[];
  recentTickets: RecentTicket[];
  period:       TimePeriod;
  dateRange:    { from: string; to: string };
}

export type TimePeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export interface RecentTicket {
  id:          string;
  externalId:  string;
  subject:     string;
  status:      TicketStatus;
  priority:    TicketPriority;
  group:       string;
  technician:  string;
  createdAt:   string;
  updatedAt:   string;
  slaBreach:   boolean;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id:        string;
  role:      "user" | "assistant";
  content:   string;
  createdAt: string;
}

export interface ChatRequest {
  message:   string;
  sessionId: string;
}

export interface ChatResponse {
  reply:     string;
  sessionId: string;
}

// ─── SDP Integration ─────────────────────────────────────────────────────────

export interface SDPTicket {
  id:          string;
  subject:     string;
  status:      { name: string };
  priority:    { name: string };
  group:       { id: string; name: string } | null;
  technician:  { id: string; name: string; email_id: string } | null;
  category:    { id: string; name: string } | null;
  subcategory: { id: string; name: string } | null;
  sla:         { id: string; name: string } | null;
  created_time:  { value: string };
  resolved_time: { value: string } | null;
  closed_time:   { value: string } | null;
  due_by_time:   { value: string } | null;
  is_overdue:    boolean;
}

export interface SDPListResponse<T> {
  list_info: { total_count: number; page: number; row_count: number; has_more_rows: boolean };
  [key: string]: T[] | unknown;
}

// ─── Admin / Config ───────────────────────────────────────────────────────────

export interface SyncStatus {
  lastSync:     string | null;
  nextSync:     string | null;
  status:       "idle" | "running" | "failed";
  ticketCount:  number;
  errorMessage: string | null;
}

export interface AdminConfig {
  sdpBaseUrl:        string;
  sdpApiKey:         string;
  sdpPortalName:     string;
  syncIntervalMin:   number;
  openaiModel:       string;
  adminEmails:       string[];
}
