import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generateUUID } from "@/lib/utils/uuid";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 60 * 60 * 24 * 7, // 7 días
} as const;

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("chatSessionId")?.value;
  const messages = cookieStore.get("chatMessages")?.value;

  return NextResponse.json({
    sessionId,
    messages: messages ? JSON.parse(messages) : [],
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const { action, data } = await request.json();

  if (action === "createSession") {
    const newSessionId = generateUUID();
    cookieStore.set("chatSessionId", newSessionId, COOKIE_OPTIONS);
    return NextResponse.json({ sessionId: newSessionId });
  }

  if (action === "updateMessages") {
    cookieStore.set("chatMessages", JSON.stringify(data), COOKIE_OPTIONS);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
