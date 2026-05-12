import OpenAI from "openai";
import prisma from "@/lib/db/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Context builder ──────────────────────────────────────────────────────────
// Gathers live KPI data to inject into the system prompt so the AI has
// current, factual data to reference.

async function buildDashboardContext(): Promise<string> {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1); // start of current month

  const [total, open, closed, resolved, breaches, avgRes, groups, categories] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.ticket.count({ where: { status: "CLOSED" } }),
    prisma.ticket.count({ where: { status: "RESOLVED" } }),
    prisma.ticket.count({ where: { slaBreach: true } }),
    prisma.ticket.aggregate({ _avg: { resolutionTimeMinutes: true }, where: { resolutionTimeMinutes: { not: null } } }),
    prisma.group.findMany({
      include: {
        _count: { select: { tickets: true } },
        tickets: { where: { slaBreach: true }, select: { id: true } },
      },
    }),
    prisma.category.findMany({
      include: { _count: { select: { tickets: true } } },
      take: 10,
      orderBy: { tickets: { _count: "desc" } },
    }),
  ]);

  const slaCompliance =
    total > 0 ? Math.round(((total - breaches) / total) * 1000) / 10 : 100;
  const avgResHours =
    Math.round(((avgRes._avg.resolutionTimeMinutes ?? 0) / 60) * 10) / 10;

  const groupLines = groups
    .map(
      (g) =>
        `  - ${g.name}: ${g._count.tickets} tickets, ${g.tickets.length} SLA breaches`,
    )
    .join("\n");

  const catLines = categories
    .map((c) => `  - ${c.name}: ${c._count.tickets} tickets`)
    .join("\n");

  return `
CURRENT TICKET ANALYTICS DATA (as of ${now.toISOString()}):
- Total tickets (all time): ${total.toLocaleString()}
- Open tickets: ${open.toLocaleString()}
- In progress / resolved: ${resolved.toLocaleString()}
- Closed tickets: ${closed.toLocaleString()}
- SLA compliance: ${slaCompliance}%
- SLA breaches (all time): ${breaches.toLocaleString()}
- Average resolution time: ${avgResHours} hours

GROUP PERFORMANCE:
${groupLines}

TOP CATEGORIES:
${catLines}
`.trim();
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are a helpful AI assistant embedded in the Northpointe Bank IT Help Desk Analytics Dashboard.
Your role is to help analysts, managers, and IT staff understand ticket data, SLA performance, trends, and support metrics.

Guidelines:
- Answer questions concisely and accurately using the provided data context.
- When asked for trends, reference specific numbers from the context.
- If a question cannot be answered from the available data, say so clearly.
- Format tables and lists in markdown when it improves readability.
- Be professional, friendly, and brief. Avoid unnecessary filler text.
- Never fabricate data. Only use numbers from the provided context.
- When asked to compare periods, note that historical period breakdowns require selecting a date range in the dashboard.

Example questions you can answer:
- "What's the SLA compliance rate?"
- "Which group has the most tickets?"
- "How many open tickets do we have?"
- "What are the top categories this month?"
- "Which team has the most SLA breaches?"
`.trim();

// ─── Chat function ────────────────────────────────────────────────────────────

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithDashboard(
  message: string,
  history: ChatTurn[] = [],
): Promise<string> {
  const context = await buildDashboardContext();

  const systemMessage = `${SYSTEM_PROMPT}\n\n${context}`;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemMessage },
    ...history.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const completion = await openai.chat.completions.create({
    model:       process.env.OPENAI_MODEL ?? "gpt-4o",
    messages,
    max_tokens:  800,
    temperature: 0.3, // more deterministic for analytics
  });

  return completion.choices[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

export const SUGGESTED_PROMPTS = [
  "What's the SLA compliance trend this quarter?",
  "Which team has the most open tickets?",
  "How many high-priority tickets were opened this week?",
  "Which categories are trending up?",
  "Compare this month vs last month.",
  "Which group has the most SLA breaches?",
  "What is our average resolution time?",
  "Show tickets by priority breakdown.",
];
