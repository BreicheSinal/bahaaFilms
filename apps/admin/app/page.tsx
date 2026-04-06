import { redirect } from "next/navigation";
import { getAdminFromSessionCookie } from "@/lib/auth";

export default async function HomePage() {
  const admin = await getAdminFromSessionCookie();
  redirect(admin ? "/projects" : "/login");
}
