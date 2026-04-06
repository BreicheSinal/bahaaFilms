import { NextResponse } from "next/server";
import { requireAdminApiToken } from "@/lib/auth";
import { projectDraftSchema } from "@portfolio/shared/validators";
import { listProjectsAdmin, saveProject } from "@/lib/projects";

export async function GET() {
  try {
    await requireAdminApiToken();
    const projects = await listProjectsAdmin();
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminApiToken();
    const body = await req.json();
    const parsed = projectDraftSchema.parse(body);
    const project = await saveProject(parsed);
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
