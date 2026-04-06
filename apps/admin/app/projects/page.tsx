import { requireAdminPageSession } from "@/lib/auth";
import ProjectsManager from "@/components/ProjectsManager";

export default async function ProjectsPage() {
  const admin = await requireAdminPageSession();
  return <ProjectsManager adminEmail={admin.email || admin.uid} />;
}
