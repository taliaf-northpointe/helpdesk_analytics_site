import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const page     = Math.max(1, parseInt(params.get("page")  ?? "1",  10));
  const pageSize = Math.min(100, parseInt(params.get("size") ?? "25", 10));
  const statusRaw   = params.get("statuses") ?? params.get("status") ?? undefined;
  const status      = statusRaw?.includes(",") ? undefined : statusRaw;
  const statusIn    = statusRaw?.includes(",") ? statusRaw.split(",") : undefined;
  const priority = params.get("priority") ?? undefined;
  const groupId  = params.get("groupId") ?? undefined;
  const search   = params.get("q") ?? undefined;
  const from     = params.get("from") ? new Date(params.get("from")!) : undefined;
  const to       = params.get("to")   ? new Date(params.get("to")!)   : undefined;

  const where = {
    ...(statusIn  ? { status:   { in: statusIn as never[] } } : status ? { status: status as never } : {}),
    ...(priority ? { priority: priority as never } : {}),
    ...(groupId  ? { groupId } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    ...(search ? {
      subject: { contains: search, mode: "insensitive" as const },
    } : {}),
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      take:    pageSize,
      skip:    (page - 1) * pageSize,
      orderBy: { createdAt: "desc" },
      include: { group: true, technician: true, category: true, subcategory: true },
    }),
    prisma.ticket.count({ where }),
  ]);

  return NextResponse.json({
    tickets,
    pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
  });
}
