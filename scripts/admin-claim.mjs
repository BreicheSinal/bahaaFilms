#!/usr/bin/env node
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function required(primary, fallback) {
  const value = process.env[primary] || (fallback ? process.env[fallback] : undefined);
  if (!value) {
    throw new Error(
      `Missing ${primary}${fallback ? ` (or ${fallback})` : ""} env var`
    );
  }
  return value;
}

function parseArgs(argv) {
  const args = { email: "", action: "grant" };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--email") {
      args.email = argv[i + 1] || "";
      i += 1;
    } else if (current === "--action") {
      const next = argv[i + 1] || "";
      if (["grant", "revoke", "status"].includes(next)) {
        args.action = next;
      }
      i += 1;
    }
  }

  return args;
}

function initAdmin() {
  if (getApps().length) return;

  initializeApp({
    credential: cert({
      projectId: required("FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
      clientEmail: required("FIREBASE_CLIENT_EMAIL", "NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL"),
      privateKey: required("FIREBASE_PRIVATE_KEY", "NEXT_PUBLIC_FIREBASE_PRIVATE_KEY").replace(
        /\\n/g,
        "\n"
      ),
    }),
  });
}

async function main() {
  const { email, action } = parseArgs(process.argv.slice(2));

  if (!email) {
    console.error("Usage: node scripts/admin-claim.mjs --email you@example.com --action grant|revoke|status");
    process.exit(1);
  }

  initAdmin();
  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  const currentClaims = user.customClaims || {};

  if (action === "status") {
    console.log(JSON.stringify({
      email,
      uid: user.uid,
      admin: Boolean(currentClaims.admin),
      claims: currentClaims,
    }, null, 2));
    return;
  }

  if (action === "grant") {
    await auth.setCustomUserClaims(user.uid, { ...currentClaims, admin: true });
    console.log(`Granted admin claim to ${email} (${user.uid})`);
    return;
  }

  const { admin: _unused, ...rest } = currentClaims;
  await auth.setCustomUserClaims(user.uid, rest);
  console.log(`Revoked admin claim from ${email} (${user.uid})`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
