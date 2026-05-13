import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@/lib/db/prisma";
import { sdpGetTicket, sdpGetNotes } from "@/lib/integrations/servicedesk-plus/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { group: true, technician: true, category: true, subcategory: true, sla: true },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [sdpDetail, notes] = await Promise.all([
    sdpGetTicket(ticket.externalId).catch(() => null),
    sdpGetNotes(ticket.externalId),
  ]);

  let description: string | null = null;
  if (sdpDetail?.description) {
    if (typeof sdpDetail.description === "string") {
      description = sdpDetail.description;
    } else if (typeof (sdpDetail.description as { content?: string }).content === "string") {
      description = (sdpDetail.description as { content?: string }).content!;
    }
  }

  return NextResponse.json({ ticket, description, notes });
}
