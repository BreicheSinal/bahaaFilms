import { requireAdminPageSession } from "@/lib/auth";
import ProjectEditor from "@/components/ProjectEditor";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPageSession();
  const { id } = await params;
  return <ProjectEditor mode="edit" projectId={id} />;
}
