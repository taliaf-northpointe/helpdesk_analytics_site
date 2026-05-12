import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient({ log: [] });

const CSV_PATH = path.join(
  "C:\\Users\\talia.frazier\\Downloads",
  "Talia's_Report ( May 12, 2026 03_08 PM ).csv",
);

const SLA_CONFIG: Record<string, { responseTime: number; resolutionTime: number; priority: string }> = {
  "High SLA":   { responseTime: 60,  resolutionTime: 480,  priority: "HIGH"   },
  "Medium SLA": { responseTime: 240, resolutionTime: 1440, priority: "MEDIUM" },
  "Low SLA":    { responseTime: 480, resolutionTime: 2880, priority: "LOW"    },
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

function parseDate(s: string): Date | null {
  if (!s || s === "Not Assigned") return null;
  const m = s.trim().match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/);
  if (!m) return null;
  return new Date(+m[3], +m[1] - 1, +m[2], +m[4], +m[5]);
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
}

async function main() {
  console.log("📂  Reading CSV...");
  const raw   = fs.readFileSync(CSV_PATH, "utf-8");
  const lines = raw.split(/\r?\n/);

  // ── Pass 1: collect all unique lookup values ───────────────────────────────
  const groupSet = new Set<string>(["Not Assigned"]);
  const techSet  = new Set<string>();
  const catSet   = new Set<string>();
  const subMap   = new Map<string, Set<string>>(); // cat → subs
  const slaSet   = new Set<string>();

  let headerFound = false;
  let curGroup    = "Not Assigned";

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = parseCSVLine(line);

    if (!headerFound) {
      if (cols[0] === "Created Time") headerFound = true;
      continue;
    }

    if (!/^\d{2}-\d{2}-\d{4}/.test(cols[0]) || !cols[1]?.trim()) {
      curGroup = cols[0].trim().replace(/ - Group$/i, "").trim() || "Not Assigned";
      groupSet.add(curGroup);
      continue;
    }

    const [,, , tech, cat, sub,, sla] = cols;
    if (tech && tech !== "Not Assigned") techSet.add(tech);
    if (cat  && cat  !== "Not Assigned") {
      catSet.add(cat);
      if (sub && sub !== "Not Assigned") {
        if (!subMap.has(cat)) subMap.set(cat, new Set());
        subMap.get(cat)!.add(sub);
      }
    }
    if (sla && sla !== "Not Assigned") slaSet.add(sla);
  }

  // ── Clear existing data ────────────────────────────────────────────────────
  console.log("🗑️   Clearing existing data...");
  await prisma.analyticsSnapshot.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.technicianGroup.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.technician.deleteMany();
  await prisma.group.deleteMany();
  await prisma.sLA.deleteMany();
  await prisma.syncJob.deleteMany();

  // ── Create lookup records ──────────────────────────────────────────────────
  console.log("🔧  Creating lookup records...");

  const slaDb = new Map<string, string>();
  for (const [i, name] of [...slaSet].entries()) {
    const cfg = SLA_CONFIG[name] ?? { responseTime: 240, resolutionTime: 1440 };
    const r   = await prisma.sLA.create({
      data: { externalId: `sla-${i}`, name, responseTime: cfg.responseTime, resolutionTime: cfg.resolutionTime },
    });
    slaDb.set(name, r.id);
  }

  const groupDb = new Map<string, string>();
  for (const [i, name] of [...groupSet].entries()) {
    const r = await prisma.group.create({ data: { externalId: `grp-${i}`, name } });
    groupDb.set(name, r.id);
  }

  const techDb = new Map<string, string>();
  for (const [i, name] of [...techSet].entries()) {
    const r = await prisma.technician.create({
      data: { externalId: `tech-${i}`, name, email: `${toSlug(name)}@northpointe.com` },
    });
    techDb.set(name, r.id);
  }

  const catDb = new Map<string, string>();
  const subDb = new Map<string, string>(); // "cat|sub" → id

  for (const [i, catName] of [...catSet].entries()) {
    const r = await prisma.category.create({ data: { externalId: `cat-${i}`, name: catName } });
    catDb.set(catName, r.id);
    for (const [j, subName] of [...(subMap.get(catName) ?? [])].entries()) {
      const sr = await prisma.subcategory.create({
        data: { externalId: `sub-${i}-${j}`, name: subName, categoryId: r.id },
      });
      subDb.set(`${catName}|${subName}`, sr.id);
    }
  }

  const syncJob = await prisma.syncJob.create({
    data: { type: "FULL", status: "COMPLETED", completedAt: new Date() },
  });

  // ── Pass 2: build ticket rows ──────────────────────────────────────────────
  console.log("🎫  Building ticket records...");

  const tickets: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  headerFound = false;
  curGroup    = "Not Assigned";

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = parseCSVLine(line);

    if (!headerFound) {
      if (cols[0] === "Created Time") headerFound = true;
      continue;
    }

    if (!/^\d{2}-\d{2}-\d{4}/.test(cols[0]) || !cols[1]?.trim()) {
      curGroup = cols[0].trim().replace(/ - Group$/i, "").trim() || "Not Assigned";
      continue;
    }

    const [createdStr, requestId, subject, techName, catName, subName, resolvedStr, slaName, requester] = cols;

    if (!requestId || seen.has(requestId)) continue;
    seen.add(requestId);

    const createdAt  = parseDate(createdStr);
    if (!createdAt) continue;

    const resolvedAt = parseDate(resolvedStr);
    const status     = resolvedAt ? "RESOLVED" : "OPEN";
    const cfg        = SLA_CONFIG[slaName] ?? null;
    const priority   = cfg?.priority ?? "MEDIUM";

    const slaId   = slaName  !== "Not Assigned" ? slaDb.get(slaName)   : undefined;
    const groupId = groupDb.get(curGroup) ?? groupDb.get("Not Assigned");
    const techId  = techName !== "Not Assigned" ? techDb.get(techName) : undefined;
    const catId   = catName  !== "Not Assigned" ? catDb.get(catName)   : undefined;
    const subKey  = catName  !== "Not Assigned" && subName !== "Not Assigned" ? `${catName}|${subName}` : null;
    const subId   = subKey ? subDb.get(subKey) : undefined;

    const resMinutes = resolvedAt
      ? Math.max(0, Math.round((resolvedAt.getTime() - createdAt.getTime()) / 60000))
      : null;
    const slaBreach = resolvedAt && resMinutes !== null && cfg
      ? resMinutes > cfg.resolutionTime
      : false;

    tickets.push({
      externalId:            requestId,
      subject:               subject || "(No Subject)",
      status,
      priority,
      createdAt,
      updatedAt:             resolvedAt ?? createdAt,
      resolvedAt:            resolvedAt ?? undefined,
      slaId:                 slaId     ?? undefined,
      slaBreach,
      groupId:               groupId   ?? undefined,
      technicianId:          techId    ?? undefined,
      categoryId:            catId     ?? undefined,
      subcategoryId:         subId     ?? undefined,
      resolutionTimeMinutes: resMinutes ?? undefined,
      createdDay:            createdAt.getDate(),
      createdMonth:          createdAt.getMonth() + 1,
      createdYear:           createdAt.getFullYear(),
      syncJobId:             syncJob.id,
      rawData:               JSON.stringify({ requester }),
    });
  }

  // ── Batch insert ───────────────────────────────────────────────────────────
  console.log(`📥  Inserting ${tickets.length} tickets...`);
  const CHUNK = 500;
  for (let i = 0; i < tickets.length; i += CHUNK) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.ticket.createMany({ data: tickets.slice(i, i + CHUNK) as any });
    process.stdout.write(`\r   ${Math.min(i + CHUNK, tickets.length)} / ${tickets.length}`);
  }

  console.log(`\n✅  Done! Imported ${tickets.length} tickets from CSV.`);
  console.log(`   Groups: ${groupSet.size}  |  Technicians: ${techSet.size}  |  Categories: ${catSet.size}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
