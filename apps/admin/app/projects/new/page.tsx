import { requireAdminPageSession } from "@/lib/auth";
import ProjectEditor from "@/components/ProjectEditor";

export default async function NewProjectPage() {
  await requireAdminPageSession();
  return <ProjectEditor mode="create" />;
}
