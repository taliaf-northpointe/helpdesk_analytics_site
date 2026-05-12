import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { chatWithDashboard, type ChatTurn } from "@/lib/claude/chat";
import prisma from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, sessionId } = (await req.json()) as {
    message: string;
    sessionId?: string;
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;

  let chatSession = sessionId
    ? await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
      })
    : null;

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data: { userId },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
    });
  }

  const history: ChatTurn[] = (chatSession.messages ?? []).map((m) => ({
    role:    m.role === "USER" ? "user" : "assistant",
    content: m.content,
  }));

  await prisma.chatMessage.create({
    data: { sessionId: chatSession.id, role: "USER", content: message },
  });

  let reply: string;
  try {
    reply = await chatWithDashboard(message, history);
  } catch (err) {
    console.error("[chat] Claude error:", err);
    reply = "I encountered an error querying the data. Please try again.";
  }

  await prisma.chatMessage.create({
    data: { sessionId: chatSession.id, role: "ASSISTANT", content: reply },
  });

  return NextResponse.json({ reply, sessionId: chatSession.id });
}