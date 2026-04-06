import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifyAdminIdToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { idToken?: string };
    if (!body.idToken) {
      return NextResponse.json({ error: "idToken is required" }, { status: 400 });
    }

    const decoded = await verifyAdminIdToken(body.idToken);
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const maxAge = Math.max(decoded.exp - nowInSeconds, 0);
    const response = NextResponse.json({
      ok: true,
      uid: decoded.uid,
      email: decoded.email,
    });

    response.cookies.set({
      name: SESSION_COOKIE,
      value: body.idToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: SESSION_COOKIE, value: "", path: "/", maxAge: 0 });
  return response;
}
