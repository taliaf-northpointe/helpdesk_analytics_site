/**
 * ServiceDesk Plus Cloud (SDP On-Demand) API client.
 *
 * Authentication: Zoho OAuth2 refresh-token flow.
 * The access token is fetched on demand and cached in memory for its lifetime
 * (typically 3600 s).  Configure credentials via environment variables.
 *
 * SDP API quirks (from production observation):
 *   - Time-field condition is "lesser than" NOT "less than"
 *   - Time-field VALUES must be NESTED: { value: "<epoch_ms_string>" }
 *   - List responses omit category/subcategory unless listed in `fields_required`
 *   - Lookup by display_id requires a search; detail fetch needs the INTERNAL id
 */

import axios, { type AxiosInstance } from "axios";
import pRetry from "p-retry";
import pLimit from "p-limit";

// ─── Token cache ──────────────────────────────────────────────────────────────

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getZohoAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const params = new URLSearchParams({
    grant_type:    "refresh_token",
    refresh_token: (process.env.SDP_ZOHO_REFRESH_TOKEN ?? "").trim(),
    client_id:     (process.env.SDP_ZOHO_CLIENT_ID     ?? "").trim(),
    client_secret: (process.env.SDP_ZOHO_CLIENT_SECRET ?? "").trim(),
  });

  const res = await axios.post<{ access_token: string; expires_in: number }>(
    "https://accounts.zoho.com/oauth/v2/token",
    params.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  cachedToken = {
    value:     res.data.access_token,
    expiresAt: Date.now() + (res.data.expires_in ?? 3600) * 1000,
  };

  return cachedToken.value;
}

// ─── Axios instance factory ───────────────────────────────────────────────────

function createInstance(accessToken: string): AxiosInstance {
  const baseUrl = process.env.SDP_BASE_URL ?? "https://northpointe.sdpondemand.manageengine.com";
  const apiBase = "/api/v3";

  return axios.create({
    baseURL: `${baseUrl}${apiBase}`,
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      Accept:        "application/vnd.manageengine.sdp.v3+json",
    },
    timeout: 30_000,
  });
}

// ─── Concurrency limiter ──────────────────────────────────────────────────────

const limiter = pLimit(5);

// ─── Core request helper ──────────────────────────────────────────────────────

export async function sdpGet<T>(
  path: string,
  listInfo: Record<string, unknown> = {},
  retries = 3,
): Promise<T> {
  return limiter(() =>
    pRetry(
      async () => {
        const token    = await getZohoAccessToken();
        const instance = createInstance(token);
        const res = await instance.get<T>(path, {
          params: { input_data: JSON.stringify({ list_info: listInfo }) },
        });
        return res.data;
      },
      {
        retries,
        onFailedAttempt: (err) =>
          console.warn(`[SDP] ${path} failed attempt ${err.attemptNumber}: ${err.message}`),
        shouldRetry: (err) => {
          const status = (err as { response?: { status: number } }).response?.status;
          return !(status && status >= 400 && status < 500 && status !== 429);
        },
      },
    ),
  );
}

/** Fetch full ticket detail by INTERNAL id. */
export async function sdpGetTicket(internalId: string): Promise<Record<string, unknown>> {
  const token    = await getZohoAccessToken();
  const instance = createInstance(token);
  const res = await instance.get<{ request: Record<string, unknown> }>(
    `/requests/${encodeURIComponent(internalId)}`,
  );
  return res.data.request ?? {};
}

// ─── Paginator ────────────────────────────────────────────────────────────────

const LIST_FIELDS = [
  "id", "display_id", "subject", "status", "technician",
  "group", "category", "subcategory", "requester", "priority",
  "created_time", "resolved_time", "closed_time", "due_by_time", "is_overdue", "sla",
];

export async function sdpPaginate<T>(
  path:            string,
  listKey:         string,
  pageSize = 100,
  searchCriteria?: Record<string, unknown>[],
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  while (true) {
    const listInfo: Record<string, unknown> = {
      row_count:       pageSize,
      start_index:     (page - 1) * pageSize + 1,
      sort_field:      "id",
      sort_order:      "asc",
      fields_required: LIST_FIELDS,
      get_total_count: true,
    };
    if (searchCriteria?.length) listInfo.search_criteria = searchCriteria;

    const data = await sdpGet<Record<string, unknown>>(path, listInfo);

    const rows = (data[listKey] ?? []) as T[];
    results.push(...rows);

    const info = data.list_info as { has_more_rows?: boolean } | undefined;
    if (!info?.has_more_rows || page >= 500) break;
    page++;
  }

  return results;
}

// ─── Query helpers used by chatbot ────────────────────────────────────────────

export type SDPPeriod =
  | "today" | "yesterday" | "this_week" | "last_week"
  | "this_month" | "last_month" | "last_7_days" | "last_30_days"
  | "last_90_days" | "all_time";

function periodToDates(period: SDPPeriod): { from: Date | null; to: Date | null } {
  const now = new Date();
  const startOfDay  = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0);    return x; };
  const endOfDay    = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
  const startOfWeek = (d: Date) => { const x = startOfDay(d); x.setDate(x.getDate() - x.getDay()); return x; };
  const startOfMon  = (d: Date) => { const x = startOfDay(d); x.setDate(1); return x; };

  switch (period) {
    case "today":       return { from: startOfDay(now), to: now };
    case "yesterday":   { const y = new Date(now); y.setDate(y.getDate()-1); return { from: startOfDay(y), to: endOfDay(y) }; }
    case "this_week":   return { from: startOfWeek(now), to: now };
    case "last_week":   { const lw = new Date(now); lw.setDate(lw.getDate()-7); const s = startOfWeek(lw); const e = new Date(s); e.setDate(e.getDate()+7); e.setMilliseconds(-1); return { from: s, to: e }; }
    case "this_month":  return { from: startOfMon(now), to: now };
    case "last_month":  { const s = startOfMon(now); s.setMonth(s.getMonth()-1); const e = new Date(startOfMon(now)); e.setMilliseconds(-1); return { from: s, to: e }; }
    case "last_7_days": return { from: new Date(now.getTime() - 7*86400000), to: now };
    case "last_30_days":return { from: new Date(now.getTime() - 30*86400000), to: now };
    case "last_90_days":return { from: new Date(now.getTime() - 90*86400000), to: now };
    case "all_time":    return { from: null, to: null };
  }
}

export interface SDPQueryOptions {
  period?:      SDPPeriod;
  status?:      string;
  technician?:  string;
  group?:       string;
  category?:    string;
  subcategory?: string;
  keyword?:     string;
  limit?:       number;
}

interface SDPTicketRow {
  id: string;
  display_id?: string | number;
  subject?: string;
  status?: { name: string };
  technician?: { name: string };
  group?: { name: string };
  category?: { name: string };
  subcategory?: { name: string };
  requester?: { name: string };
  created_time?: { value: string; display_value?: string };
  resolved_time?: { display_value?: string };
}

/** Execute a structured query against SDP and return shaped rows + total count. */
export async function sdpQuery(opts: SDPQueryOptions): Promise<{
  rows:  SDPTicketRow[];
  total: number;
}> {
  const period = opts.period ?? "this_week";
  const { from, to } = periodToDates(period);
  const limit = Math.min(opts.limit ?? 100, 100);

  const criteria: Record<string, unknown>[] = [];
  // NOTE: SDP uses "lesser than" (NOT "less than") for time comparisons
  if (from) criteria.push({ field: "created_time", condition: "greater than", value: { value: String(from.getTime()) } });
  if (to)   criteria.push({ field: "created_time", condition: "lesser than",  value: { value: String(to.getTime()) }, logical_operator: "AND" });
  if (opts.status)      criteria.push({ field: "status.name",      condition: "is",       value: opts.status,      logical_operator: "AND" });
  if (opts.technician)  criteria.push({ field: "technician.name",  condition: "is",       value: opts.technician,  logical_operator: "AND" });
  if (opts.group)       criteria.push({ field: "group.name",       condition: "is",       value: opts.group,       logical_operator: "AND" });
  if (opts.category)    criteria.push({ field: "category.name",    condition: "is",       value: opts.category,    logical_operator: "AND" });
  if (opts.subcategory) criteria.push({ field: "subcategory.name", condition: "is",       value: opts.subcategory, logical_operator: "AND" });
  if (opts.keyword)     criteria.push({ field: "subject",          condition: "contains", value: opts.keyword,     logical_operator: "AND" });

  const listInfo: Record<string, unknown> = {
    row_count:       limit,
    start_index:     1,
    sort_field:      "created_time",
    sort_order:      "desc",
    get_total_count: true,
    fields_required: LIST_FIELDS,
  };
  if (criteria.length) listInfo.search_criteria = criteria;

  const data = await sdpGet<{ requests?: SDPTicketRow[]; list_info?: { total_count?: number } }>(
    "/requests",
    listInfo,
  );

  return {
    rows:  data.requests ?? [],
    total: data.list_info?.total_count ?? (data.requests?.length ?? 0),
  };
}
