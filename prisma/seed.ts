import { PrismaClient } from "@prisma/client";

type TicketStatus  = "OPEN" | "IN_PROGRESS" | "ON_HOLD" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
import { subDays, subMonths, startOfDay, addHours } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding database...");

  // ── Groups ──────────────────────────────────────────────────────────────────
  const groups = await Promise.all([
    prisma.group.upsert({ where: { externalId: "grp-1" }, update: {}, create: { externalId: "grp-1", name: "Technical Support" } }),
    prisma.group.upsert({ where: { externalId: "grp-2" }, update: {}, create: { externalId: "grp-2", name: "Billing" } }),
    prisma.group.upsert({ where: { externalId: "grp-3" }, update: {}, create: { externalId: "grp-3", name: "Network Ops" } }),
    prisma.group.upsert({ where: { externalId: "grp-4" }, update: {}, create: { externalId: "grp-4", name: "Customer Success" } }),
    prisma.group.upsert({ where: { externalId: "grp-5" }, update: {}, create: { externalId: "grp-5", name: "Escalations" } }),
  ]);

  // ── Technicians ─────────────────────────────────────────────────────────────
  const technicians = await Promise.all([
    prisma.technician.upsert({ where: { externalId: "tech-1" }, update: {}, create: { externalId: "tech-1", name: "Mike Chen",    email: "m.chen@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-2" }, update: {}, create: { externalId: "tech-2", name: "Sarah Kim",    email: "s.kim@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-3" }, update: {}, create: { externalId: "tech-3", name: "Luis Wang",    email: "l.wang@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-4" }, update: {}, create: { externalId: "tech-4", name: "Jane Torres",  email: "j.torres@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-5" }, update: {}, create: { externalId: "tech-5", name: "Zinda Lee",    email: "z.lee@northpointe.com" } }),
  ]);

  // ── Categories ──────────────────────────────────────────────────────────────
  const catHardware  = await prisma.category.upsert({ where: { externalId: "cat-1" }, update: {}, create: { externalId: "cat-1", name: "Hardware" } });
  const catSoftware  = await prisma.category.upsert({ where: { externalId: "cat-2" }, update: {}, create: { externalId: "cat-2", name: "Software" } });
  const catNetwork   = await prisma.category.upsert({ where: { externalId: "cat-3" }, update: {}, create: { externalId: "cat-3", name: "Network" } });
  const catSecurity  = await prisma.category.upsert({ where: { externalId: "cat-4" }, update: {}, create: { externalId: "cat-4", name: "Security" } });
  const catGeneral   = await prisma.category.upsert({ where: { externalId: "cat-5" }, update: {}, create: { externalId: "cat-5", name: "General" } });

  // ── Subcategories ───────────────────────────────────────────────────────────
  await Promise.all([
    prisma.subcategory.upsert({ where: { externalId: "sub-1" }, update: {}, create: { externalId: "sub-1", name: "Servers",      categoryId: catHardware.id } }),
    prisma.subcategory.upsert({ where: { externalId: "sub-2" }, update: {}, create: { externalId: "sub-2", name: "Workstations", categoryId: catHardware.id } }),
    prisma.subcategory.upsert({ where: { externalId: "sub-3" }, update: {}, create: { externalId: "sub-3", name: "Licensing",    categoryId: catSoftware.id } }),
    prisma.subcategory.upsert({ where: { externalId: "sub-4" }, update: {}, create: { externalId: "sub-4", name: "Bugs",         categoryId: catSoftware.id } }),
    prisma.subcategory.upsert({ where: { externalId: "sub-5" }, update: {}, create: { externalId: "sub-5", name: "Connectivity", categoryId: catNetwork.id } }),
    prisma.subcategory.upsert({ where: { externalId: "sub-6" }, update: {}, create: { externalId: "sub-6", name: "VPN",          categoryId: catNetwork.id } }),
    prisma.subcategory.upsert({ where: { externalId: "sub-7" }, update: {}, create: { externalId: "sub-7", name: "Access",       categoryId: catSecurity.id } }),
    prisma.subcategory.upsert({ where: { externalId: "sub-8" }, update: {}, create: { externalId: "sub-8", name: "Inquiry",      categoryId: catGeneral.id } }),
  ]);

  // ── SLA ─────────────────────────────────────────────────────────────────────
  const slaStandard = await prisma.sLA.upsert({ where: { externalId: "sla-1" }, update: {}, create: { externalId: "sla-1", name: "Standard",  responseTime: 240,  resolutionTime: 1440 } });
  const slaPriority = await prisma.sLA.upsert({ where: { externalId: "sla-2" }, update: {}, create: { externalId: "sla-2", name: "Priority",  responseTime: 60,   resolutionTime: 480  } });
  const slaCritical = await prisma.sLA.upsert({ where: { externalId: "sla-3" }, update: {}, create: { externalId: "sla-3", name: "Critical",  responseTime: 15,   resolutionTime: 120  } });

  // ── Seed sync job ────────────────────────────────────────────────────────────
  const seedJob = await prisma.syncJob.create({
    data: { type: "FULL", status: "COMPLETED", completedAt: new Date() },
  });

  // ── Tickets (180 days of history) ────────────────────────────────────────────
  const statuses: TicketStatus[] = ["OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED"];
  const priorities: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  const categories = [catHardware, catSoftware, catNetwork, catSecurity, catGeneral];
  const slas = [slaStandard, slaPriority, slaCritical];

  const ticketsToCreate: Record<string, unknown>[] = [];
  let externalCounter = 10000;

  for (let daysAgo = 180; daysAgo >= 0; daysAgo--) {
    const dayDate = startOfDay(subDays(new Date(), daysAgo));
    const count = Math.floor(Math.random() * 25) + 10; // 10–34 per day

    for (let i = 0; i < count; i++) {
      const createdAt = addHours(dayDate, Math.random() * 23);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const group = groups[Math.floor(Math.random() * groups.length)];
      const tech = technicians[Math.floor(Math.random() * technicians.length)];
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const sla = slas[Math.floor(Math.random() * slas.length)];
      const isResolved = status === "RESOLVED" || status === "CLOSED";
      const resMinutes = isResolved ? Math.floor(Math.random() * 2880) + 30 : undefined;
      const slaBreach = isResolved ? resMinutes! > sla.resolutionTime : false;

      const ticket: Record<string, unknown> = {
        externalId: `sdp-${externalCounter++}`,
        subject: `Ticket ${externalCounter} – ${cat.name} issue`,
        status,
        priority,
        createdAt,
        updatedAt: createdAt,
        slaId: sla.id,
        slaBreach,
        groupId: group.id,
        technicianId: tech.id,
        categoryId: cat.id,
        createdDay: dayDate.getDate(),
        createdMonth: dayDate.getMonth() + 1,
        createdYear: dayDate.getFullYear(),
        syncJobId: seedJob.id,
      };
      if (isResolved) ticket.resolvedAt = addHours(createdAt, (resMinutes ?? 60) / 60);
      if (resMinutes != null) ticket.resolutionTimeMinutes = resMinutes;
      ticketsToCreate.push(ticket);
    }
  }

  // Batch insert in chunks of 500
  const chunkSize = 500;
  for (let i = 0; i < ticketsToCreate.length; i += chunkSize) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.ticket.createMany({ data: ticketsToCreate.slice(i, i + chunkSize) as any });
  }

  console.log(`✅  Seeded ${ticketsToCreate.length} tickets across 6 months.`);
  console.log("✅  Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
