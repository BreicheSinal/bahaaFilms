import { NextResponse } from "next/server";
import { requireAdminApiToken } from "@/lib/auth";
import { reorderSchema } from "@portfolio/shared/validators";
import { reorderProjects } from "@/lib/projects";

export async function POST(req: Request) {
  try {
    await requireAdminApiToken();
    const body = await req.json();
    const parsed = reorderSchema.parse(body);
    await reorderProjects(parsed.idsInOrder);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
