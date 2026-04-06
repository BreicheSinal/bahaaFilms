export function toISODate(value: Date | string | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value.split("T")[0] ?? "";
  return value.toISOString().split("T")[0] ?? "";
}

export function nowIsoString(): string {
  return new Date().toISOString();
}