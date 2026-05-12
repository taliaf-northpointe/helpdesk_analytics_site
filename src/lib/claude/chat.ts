import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { sdpQuery, sdpGetTicket, type SDPPeriod, type SDPQueryOptions } from "@/lib/integrations/servicedesk-plus/client";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Action types (mirrors n8n flow) ─────────────────────────────────────────

type SDPAction =
  | "count_tickets"
  | "tickets_by_technician"
  | "tickets_by_group"
  | "tickets_by_status"
  | "tickets_by_category"
  | "tickets_by_subcategory"
  | "recent_tickets"
  | "ticket_trends"
  | "lookup_ticket";

interface QueryParams {
  action:      SDPAction;
  period:      SDPPeriod;
  status?:     string;
  technician?: string;
  group?:      string;
  category?:   string;
  subcategory?: string;
  keyword?:    string;
  ticket_id?:  string;
  limit?:      number;
}

// ─── SDP query executor ───────────────────────────────────────────────────────

function groupCount(rows: { name?: string }[], getter: (r: unknown) => string | undefined) {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = getter(r) || "(unassigned)";
    out[k] = (out[k] ?? 0) + 1;
  }
  return Object.entries(out)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

type AnyRow = Record<string, unknown>;

async function executeSdpQuery(params: QueryParams): Promise<string> {
  const opts: SDPQueryOptions = {
    period:      params.period,
    status:      params.status,
    technician:  params.technician,
    group:       params.group,
    category:    params.category,
    subcategory: params.subcategory,
    keyword:     params.keyword,
    limit:       params.limit ?? 100,
  };

  if (params.action === "lookup_ticket") {
    if (!params.ticket_id) return "Error: ticket_id is required for lookup_ticket.";
    // Search by display_id first, then fetch full detail
    const { rows } = await sdpQuery({ ...opts, keyword: params.ticket_id, limit: 1 });
    if (rows.length === 0) return `No ticket found with ID ${params.ticket_id}.`;
    const internalId = rows[0].id as string;
    try {
      const detail = await sdpGetTicket(internalId) as AnyRow;
      return JSON.stringify({
        action: "lookup_ticket",
        ticket: {
          display_id:    (detail.display_id as string) ?? params.ticket_id,
          subject:       detail.subject,
          status:        (detail.status as AnyRow)?.name,
          priority:      (detail.priority as AnyRow)?.name,
          technician:    (detail.technician as AnyRow)?.name,
          group:         (detail.group as AnyRow)?.name,
          category:      (detail.category as AnyRow)?.name,
          requester:     (detail.requester as AnyRow)?.name,
          created_time:  (detail.created_time as AnyRow)?.display_value,
          resolved_time: (detail.resolved_time as AnyRow)?.display_value,
          description:   detail.description,
          resolution:    (detail.resolution as AnyRow)?.content,
        },
      }, null, 2);
    } catch {
      return JSON.stringify({ action: "lookup_ticket", ticket: rows[0] }, null, 2);
    }
  }

  const { rows, total } = await sdpQuery(opts);

  const pick = (r: AnyRow) => ({
    display_id:   r.display_id,
    subject:      r.subject,
    status:       (r.status as AnyRow)?.name,
    technician:   (r.technician as AnyRow)?.name,
    group:        (r.group as AnyRow)?.name,
    category:     (r.category as AnyRow)?.name,
    created_time: (r.created_time as AnyRow)?.display_value,
  });

  switch (params.action) {
    case "count_tickets":
      return JSON.stringify({ action: params.action, period: params.period, count: total }, null, 2);

    case "tickets_by_technician":
      return JSON.stringify({ action: params.action, period: params.period, total, breakdown: groupCount(rows as AnyRow[], (r) => ((r as AnyRow).technician as AnyRow)?.name as string) }, null, 2);

    case "tickets_by_group":
      return JSON.stringify({ action: params.action, period: params.period, total, breakdown: groupCount(rows as AnyRow[], (r) => ((r as AnyRow).group as AnyRow)?.name as string) }, null, 2);

    case "tickets_by_status":
      return JSON.stringify({ action: params.action, period: params.period, total, breakdown: groupCount(rows as AnyRow[], (r) => ((r as AnyRow).status as AnyRow)?.name as string) }, null, 2);

    case "tickets_by_category":
      return JSON.stringify({ action: params.action, period: params.period, total, breakdown: groupCount(rows as AnyRow[], (r) => ((r as AnyRow).category as AnyRow)?.name as string) }, null, 2);

    case "tickets_by_subcategory":
      return JSON.stringify({ action: params.action, period: params.period, total, breakdown: groupCount(rows as AnyRow[], (r) => ((r as AnyRow).subcategory as AnyRow)?.name as string) }, null, 2);

    case "ticket_trends": {
      const buckets: Record<string, number> = {};
      for (const r of rows as AnyRow[]) {
        const v = ((r.created_time as AnyRow)?.value) as string | undefined;
        if (!v) continue;
        const key = new Date(Number(v)).toISOString().slice(0, 10);
        buckets[key] = (buckets[key] ?? 0) + 1;
      }
      return JSON.stringify({ action: params.action, period: params.period, total, daily_counts: Object.entries(buckets).sort().map(([date, count]) => ({ date, count })) }, null, 2);
    }

    case "recent_tickets":
    default:
      return JSON.stringify({ action: params.action, period: params.period, total, tickets: (rows as AnyRow[]).slice(0, 20).map(pick) }, null, 2);
  }
}

// ─── Claude tool definition ───────────────────────────────────────────────────

const QUERY_TOOL: Anthropic.Tool = {
  name:        "query_tickets",
  description: "Query live ticket data from ServiceDesk Plus. Use this for any question about ticket counts, breakdowns, trends, statuses, groups, or technician performance.",
  input_schema: {
    type:     "object",
    required: ["action", "period"],
    properties: {
      action: {
        type: "string",
        enum: ["count_tickets", "tickets_by_technician", "tickets_by_group",
               "tickets_by_status", "tickets_by_category", "tickets_by_subcategory",
               "recent_tickets", "ticket_trends", "lookup_ticket"],
        description: "The type of query to run.",
      },
      period: {
        type: "string",
        enum: ["today", "yesterday", "this_week", "last_week",
               "this_month", "last_month", "last_7_days", "last_30_days", "last_90_days", "all_time"],
        description: "The time window for the query.",
      },
      status:      { type: "string", description: "Filter by ticket status name (e.g. Open, Resolved, Closed)." },
      technician:  { type: "string", description: "Filter by technician name." },
      group:       { type: "string", description: "Filter by support group name (e.g. Technical Support, Billing)." },
      category:    { type: "string", description: "Filter by category name." },
      subcategory: { type: "string", description: "Filter by subcategory name." },
      keyword:     { type: "string", description: "Search ticket subjects for a keyword." },
      ticket_id:   { type: "string", description: "The display ID of a specific ticket to look up." },
      limit:       { type: "number", description: "Max tickets to return (1–100, default 100)." },
    },
  },
};

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an AI analytics assistant embedded in the Northpointe Bank IT Help Desk Dashboard.
You have access to a live query tool that fetches real ticket data from ServiceDesk Plus.

Known support groups (use these exact names when filtering by group):
- Application Development - Group
- Application Support - Group
- Credit Admin/ERM
- Enterprise Data (BI) - Group
- Facilities - Group
- Finance / Accounting - Group
- InfoSec - Group
- IT Risk Analyst
- IT Senior Leadership - Group
- IT Support - Group
- LOS Application Development - Group
- NetOps - Group
- Servicing-Investor Accounting & Reporting - Group

Known technicians (use these exact names when filtering by technician):
- Adam Boot
- Adrian Thomas
- AJ Bays
- Brad Hass
- Brad Sherwood
- Cathleen Porter
- Crissa Klein
- Derek DeLange
- Divya Balasundaram
- Doug McClintick
- Gavin Keen
- Grant Abejar
- Jarrell Brown
- Jayson Miller
- Joe Harder
- John Zelasko
- Josh Sharpe
- Karthik Modukuri
- Kyle Vela
- Lucas Reist
- Mark Loew
- Matthew Garcia
- Michael Sanford
- Michael Snow
- Mike Nulph
- Nora, ServiceDesk Assistant
- Patti Curry
- Rhema LaMontagne
- Rod Cushman
- Ryan Foy
- Sarah Federico
- Sean Kluiter
- Seth Compston
- Steve Pagano
- Talia Frazier
- Todd Cates
- William McCaster

Known ticket statuses (use these exact names when filtering by status):
Open statuses (ticket is not yet resolved):
- Open
- Awaiting CAB
- Awaiting Peer Review
- Awaiting prod sign-off
- Awaiting Vendor Action
- On Hold / Waiting for Vendor
- Pending Requester Response
- Received - Assessing

Closed/completed statuses:
- Completed
- Closed
- Cancelled

Guidelines:
- Always use the query_tickets tool to answer data questions — never guess or make up numbers.
- After getting tool results, summarize them clearly for the user in plain English.
- Format breakdowns as markdown tables when there are multiple rows.
- For trend questions, describe the pattern in the daily counts data.
- Be concise and professional. Get to the numbers quickly.
- If the user asks about a specific ticket, use action: lookup_ticket with the ticket ID.
- Default period is "this_week" unless the user specifies otherwise.
- When filtering by status, use the exact SDP status names listed above (e.g. "Open", not "OPEN").`;

// ─── Chat function ────────────────────────────────────────────────────────────

export interface ChatTurn {
  role:    "user" | "assistant";
  content: string;
}

export async function chatWithDashboard(
  message: string,
  history: ChatTurn[] = [],
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-8).map((m) => ({
      role:    m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  // Agentic loop: Claude may call the tool multiple times
  let response = await anthropic.messages.create({
    model:      process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 1024,
    system:     SYSTEM_PROMPT,
    tools:      [QUERY_TOOL],
    messages,
  });

  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
    const toolResults: Anthropic.MessageParam = {
      role:    "user",
      content: await Promise.all(
        toolUseBlocks.map(async (block) => {
          if (block.type !== "tool_use") return { type: "tool_result" as const, tool_use_id: "", content: "" };
          let result = "";
          try {
            result = await executeSdpQuery(block.input as QueryParams);
          } catch (err) {
            result = `Error querying SDP: ${err instanceof Error ? err.message : String(err)}`;
          }
          return {
            type:        "tool_result" as const,
            tool_use_id: block.id,
            content:     result,
          };
        }),
      ),
    };

    messages.push({ role: "assistant", content: response.content });
    messages.push(toolResults);

    response = await anthropic.messages.create({
      model:      process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6",
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      tools:      [QUERY_TOOL],
      messages,
    });
  }

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "Sorry, I couldn't generate a response.";
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

export const SUGGESTED_PROMPTS = [
  "How many tickets are open this week?",
  "Which team has the most tickets this month?",
  "Show me ticket trends for the last 30 days.",
  "Break down tickets by category this month.",
  "Which technician resolved the most tickets?",
  "How many high-priority tickets are open?",
  "Compare this week vs last week.",
  "Look up ticket #12345.",
];
