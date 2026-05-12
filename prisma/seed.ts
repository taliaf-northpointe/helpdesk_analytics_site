import { PrismaClient } from "@prisma/client";

type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
import { subDays, subMonths, startOfDay, addHours } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding database...");

  // ── Groups ──────────────────────────────────────────────────────────────────
  const groups = await Promise.all([
    prisma.group.upsert({ where: { externalId: "grp-1"  }, update: {}, create: { externalId: "grp-1",  name: "Application Development - Group" } }),
    prisma.group.upsert({ where: { externalId: "grp-2"  }, update: {}, create: { externalId: "grp-2",  name: "Application Support - Group" } }),
    prisma.group.upsert({ where: { externalId: "grp-3"  }, update: {}, create: { externalId: "grp-3",  name: "Credit Admin/ERM" } }),
    prisma.group.upsert({ where: { externalId: "grp-4"  }, update: {}, create: { externalId: "grp-4",  name: "Enterprise Data (BI) - Group" } }),
    prisma.group.upsert({ where: { externalId: "grp-5"  }, update: {}, create: { externalId: "grp-5",  name: "Facilities - Group" } }),
    prisma.group.upsert({ where: { externalId: "grp-6"  }, update: {}, create: { externalId: "grp-6",  name: "Finance / Accounting - Group" } }),
    prisma.group.upsert({ where: { externalId: "grp-7"  }, update: {}, create: { externalId: "grp-7",  name: "InfoSec - Group" } }),
    prisma.group.upsert({ where: { externalId: "grp-8"  }, update: {}, create: { externalId: "grp-8",  name: "IT Risk Analyst" } }),
    prisma.group.upsert({ where: { externalId: "grp-9"  }, update: {}, create: { externalId: "grp-9",  name: "IT Senior Leadership - Group" } }),
    prisma.group.upsert({ where: { externalId: "grp-10" }, update: {}, create: { externalId: "grp-10", name: "IT Support - Group" } }),
    prisma.group.upsert({ where: { externalId: "grp-11" }, update: {}, create: { externalId: "grp-11", name: "LOS Application Development - Group" } }),
    prisma.group.upsert({ where: { externalId: "grp-12" }, update: {}, create: { externalId: "grp-12", name: "NetOps - Group" } }),
    prisma.group.upsert({ where: { externalId: "grp-13" }, update: {}, create: { externalId: "grp-13", name: "Servicing-Investor Accounting & Reporting - Group" } }),
  ]);

  // ── Technicians ─────────────────────────────────────────────────────────────
  const technicians = await Promise.all([
    prisma.technician.upsert({ where: { externalId: "tech-1"  }, update: {}, create: { externalId: "tech-1",  name: "Adam Boot",            email: "adam.boot@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-2"  }, update: {}, create: { externalId: "tech-2",  name: "Adrian Thomas",        email: "adrian.thomas@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-3"  }, update: {}, create: { externalId: "tech-3",  name: "AJ Bays",              email: "aj.bays@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-4"  }, update: {}, create: { externalId: "tech-4",  name: "Brad Hass",            email: "brad.hass@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-5"  }, update: {}, create: { externalId: "tech-5",  name: "Brad Sherwood",        email: "brad.sherwood@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-6"  }, update: {}, create: { externalId: "tech-6",  name: "Cathleen Porter",      email: "cathleen.porter@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-7"  }, update: {}, create: { externalId: "tech-7",  name: "Crissa Klein",         email: "crissa.klein@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-8"  }, update: {}, create: { externalId: "tech-8",  name: "Derek DeLange",        email: "derek.delange@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-9"  }, update: {}, create: { externalId: "tech-9",  name: "Divya Balasundaram",   email: "divya.balasundaram@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-10" }, update: {}, create: { externalId: "tech-10", name: "Doug McClintick",      email: "doug.mcclintick@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-11" }, update: {}, create: { externalId: "tech-11", name: "Gavin Keen",           email: "gavin.keen@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-12" }, update: {}, create: { externalId: "tech-12", name: "Grant Abejar",         email: "grant.abejar@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-13" }, update: {}, create: { externalId: "tech-13", name: "Jarrell Brown",        email: "jarrell.brown@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-14" }, update: {}, create: { externalId: "tech-14", name: "Jayson Miller",        email: "jayson.miller@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-15" }, update: {}, create: { externalId: "tech-15", name: "Joe Harder",           email: "joe.harder@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-16" }, update: {}, create: { externalId: "tech-16", name: "John Zelasko",         email: "john.zelasko@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-17" }, update: {}, create: { externalId: "tech-17", name: "Josh Sharpe",          email: "josh.sharpe@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-18" }, update: {}, create: { externalId: "tech-18", name: "Karthik Modukuri",     email: "karthik.modukuri@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-19" }, update: {}, create: { externalId: "tech-19", name: "Kyle Vela",            email: "kyle.vela@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-20" }, update: {}, create: { externalId: "tech-20", name: "Lucas Reist",          email: "lucas.reist@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-21" }, update: {}, create: { externalId: "tech-21", name: "Mark Loew",            email: "mark.loew@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-22" }, update: {}, create: { externalId: "tech-22", name: "Matthew Garcia",       email: "matthew.garcia@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-23" }, update: {}, create: { externalId: "tech-23", name: "Michael Sanford",      email: "michael.sanford@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-24" }, update: {}, create: { externalId: "tech-24", name: "Michael Snow",         email: "michael.snow@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-25" }, update: {}, create: { externalId: "tech-25", name: "Mike Nulph",           email: "mike.nulph@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-26" }, update: {}, create: { externalId: "tech-26", name: "Nora, ServiceDesk Assistant", email: "nora@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-27" }, update: {}, create: { externalId: "tech-27", name: "Patti Curry",          email: "patti.curry@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-28" }, update: {}, create: { externalId: "tech-28", name: "Rhema LaMontagne",     email: "rhema.lamontagne@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-29" }, update: {}, create: { externalId: "tech-29", name: "Rod Cushman",          email: "rod.cushman@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-30" }, update: {}, create: { externalId: "tech-30", name: "Ryan Foy",             email: "ryan.foy@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-31" }, update: {}, create: { externalId: "tech-31", name: "Sarah Federico",       email: "sarah.federico@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-32" }, update: {}, create: { externalId: "tech-32", name: "Sean Kluiter",         email: "sean.kluiter@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-33" }, update: {}, create: { externalId: "tech-33", name: "Seth Compston",        email: "seth.compston@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-34" }, update: {}, create: { externalId: "tech-34", name: "Steve Pagano",         email: "steve.pagano@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-35" }, update: {}, create: { externalId: "tech-35", name: "Talia Frazier",        email: "talia.frazier@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-36" }, update: {}, create: { externalId: "tech-36", name: "Todd Cates",           email: "todd.cates@northpointe.com" } }),
    prisma.technician.upsert({ where: { externalId: "tech-37" }, update: {}, create: { externalId: "tech-37", name: "William McCaster",     email: "william.mccaster@northpointe.com" } }),
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
  const statuses = [
    "Open",
    "Pending Requester Response",
    "On Hold / Waiting for Vendor",
    "Closed",
    "Cancelled",
    "Awaiting CAB",
    "Awaiting Peer Review",
    "Awaiting Vendor Action",
  ] as const;
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
      const isResolved = status === "Closed" || status === "Cancelled";
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
