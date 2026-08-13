import type { Project } from "@/data/projects";

export function selectUniqueClients(projects: Project[]): Project[] {
  const seenTitles = new Set<string>();
  const seenLogos = new Set<string>();

  return projects.filter((project) => {
    const title = project.title.trim();
    const titleKey = title.toLocaleLowerCase();
    const logo = project.logo?.trim();

    if (!title || !logo || seenTitles.has(titleKey) || seenLogos.has(logo)) {
      return false;
    }

    seenTitles.add(titleKey);
    seenLogos.add(logo);
    return true;
  });
}
