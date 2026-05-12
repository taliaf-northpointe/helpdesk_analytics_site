import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { chatWithDashboard } from "@/lib/claude/chat";
import prisma from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { message?: string; sessionId?: string };
  const { message, sessionId } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "User ID missing" }, { status: 400 });

  // Resolve or create chat session
  let chatSession = sessionId
    ? await prisma.chatSession.findFirst({ where: { id: sessionId, userId } })
    : null;

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({ data: { userId } });
  }

  // Load recent history for context
  const history = await prisma.chatMessage.findMany({
    where:   { sessionId: chatSession.id },
    orderBy: { createdAt: "asc" },
    take:    20,
    select:  { role: true, content: true },
  });

  // Persist user message
  await prisma.chatMessage.create({
    data: { sessionId: chatSession.id, role: "USER", content: message },
  });

  try {
    const reply = await chatWithDashboard(
      message,
      history.map((m) => ({ role: m.role === "USER" ? "user" : "assistant", content: m.content })),
    );

    // Persist assistant reply
    await prisma.chatMessage.create({
      data: { sessionId: chatSession.id, role: "ASSISTANT", content: reply },
    });

    return NextResponse.json({ reply, sessionId: chatSession.id });
  } catch (err) {
    console.error("[API /chat]", err);
    return NextResponse.json({ error: "Failed to get response from AI" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ messages: [] });

  const messages = await prisma.chatMessage.findMany({
    where:   { sessionId },
    orderBy: { createdAt: "asc" },
    select:  { id: true, role: true, content: true, createdAt: true },
  });

  return NextResponse.json({ messages });
}
