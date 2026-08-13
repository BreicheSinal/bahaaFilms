export function matchesSelectedTag(projectTags: string[], selectedTag: string): boolean {
  if (selectedTag === "All") return true;

  const selectedTagKey = selectedTag.trim().toLocaleLowerCase();
  return projectTags.some(
    (tag) => tag.trim().toLocaleLowerCase() === selectedTagKey
  );
}
