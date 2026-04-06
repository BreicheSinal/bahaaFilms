export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function buildUniqueSlug(base: string, taken: Set<string>): string {
  const normalized = slugify(base) || "project";
  if (!taken.has(normalized)) return normalized;

  let i = 2;
  while (taken.has(`${normalized}-${i}`)) i += 1;
  return `${normalized}-${i}`;
}