import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const from = new Date("2026-05-01");
  const to   = new Date("2026-05-31T23:59:59");

  const statuses = await prisma.ticket.groupBy({
    by: ["status"],
    where: { createdAt: { gte: from, lte: to } },
    _count: { status: true },
    orderBy: { _count: { status: "desc" } },
  });
  console.log("\n── Statuses this month ──");
  statuses.forEach(r => console.log(` ${r.status}: ${r._count.status}`));

  const groups = await prisma.group.findMany({ select: { name: true } });
  console.log("\n── All groups in DB ──");
  groups.forEach(g => console.log(` ${g.name}`));

  const groupsThisMonth = await prisma.ticket.groupBy({
    by: ["groupId"],
    where: { createdAt: { gte: from, lte: to } },
    _count: { groupId: true },
  });
  const groupIds = groupsThisMonth.map(g => g.groupId).filter(Boolean) as string[];
  const groupNames = await prisma.group.findMany({ where: { id: { in: groupIds } }, select: { name: true } });
  console.log("\n── Groups with tickets this month ──");
  groupNames.forEach(g => console.log(` ${g.name}`));

  const totalThisMonth = await prisma.ticket.count({ where: { createdAt: { gte: from, lte: to } } });
  console.log(`\n── Total tickets this month: ${totalThisMonth} ──`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
