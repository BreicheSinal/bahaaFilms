import { NextResponse } from "next/server";
import { requireAdminApiToken } from "@/lib/auth";
import {
  projectDraftSchema,
  projectPublishSchema,
} from "@portfolio/shared/validators";
import {
  deleteProject,
  getProjectById,
  saveProject,
  setProjectStatus,
} from "@/lib/projects";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, { params }: Params) {
  try {
    await requireAdminApiToken();
    const { id } = await params;
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdminApiToken();
    const { id } = await params;
    const body = await req.json();

    if (typeof body?.status === "string") {
      const parsed = projectPublishSchema.parse({ ...body, id });
      await setProjectStatus(parsed.id, parsed.status, parsed.hidden);
      return NextResponse.json({ ok: true });
    }

    const parsed = projectDraftSchema.parse({ ...body, id });
    const project = await saveProject(parsed);
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await requireAdminApiToken();
    const { id } = await params;
    await deleteProject(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    const status = message === "Project not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
