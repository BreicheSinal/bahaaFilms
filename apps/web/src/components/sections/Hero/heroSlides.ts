import type { Project } from "@/data/projects";

export function selectHeroSlides(projects: Project[]): string[] {
  const seenImages = new Set<string>();

  return projects.reduce<string[]>((slides, project) => {
    const image = project.coverImage?.trim();

    if (slides.length === 5 || !image || seenImages.has(image)) {
      return slides;
    }

    seenImages.add(image);
    slides.push(image);
    return slides;
  }, []);
}
