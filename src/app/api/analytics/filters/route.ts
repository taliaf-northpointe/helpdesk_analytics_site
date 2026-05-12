import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@/lib/db/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [groups, technicians, categories] = await Promise.all([
    prisma.group.findMany({ select: { name: true } }),
    prisma.technician.findMany({ select: { name: true } }),
    prisma.category.findMany({ select: { name: true }, where: { isActive: true } }),
  ]);

  // Deduplicate by name (SDP may have created duplicate records)
  const uniqueGroups      = [...new Set(groups.map((g) => g.name))].sort();
  const uniqueTechnicians = [...new Set(technicians.map((t) => t.name))].sort();
  const uniqueCategories  = [...new Set(categories.map((c) => c.name))].sort();

  return NextResponse.json(
    { groups: uniqueGroups, technicians: uniqueTechnicians, categories: uniqueCategories },
    { headers: { "Cache-Control": "private, max-age=300" } },
  );
}
