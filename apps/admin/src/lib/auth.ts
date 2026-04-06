import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuth } from "@/lib/firebaseAdmin";

const SESSION_COOKIE = "admin_session";

export async function getAdminFromSessionCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = await getAdminAuth().verifyIdToken(token, true);
    if (!decoded.admin) return null;

    return {
      uid: decoded.uid,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

export async function requireAdminPageSession() {
  const admin = await getAdminFromSessionCookie();
  if (!admin) redirect("/login");
  return admin;
}

export async function verifyAdminIdToken(idToken: string) {
  const decoded = await getAdminAuth().verifyIdToken(idToken, true);
  if (!decoded.admin) {
    throw new Error("Admin claim required");
  }
  return decoded;
}

export async function requireAdminApiToken() {
  const headerStore = await headers();
  const authorization = headerStore.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const idToken = authorization.replace("Bearer ", "");
    return verifyAdminIdToken(idToken);
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionToken) {
    throw new Error("Missing admin session");
  }

  return verifyAdminIdToken(sessionToken);
}

export { SESSION_COOKIE };
