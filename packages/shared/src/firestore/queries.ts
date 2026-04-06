import type { QueryConstraint } from "firebase/firestore";
import { orderBy, where } from "firebase/firestore";

export function publicProjectsQuery(): QueryConstraint[] {
  return [
    where("status", "==", "published"),
    where("hidden", "==", false),
    orderBy("sortOrder", "desc"),
    orderBy("publishedAt", "desc"),
  ];
}