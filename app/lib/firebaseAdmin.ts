import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let _adminDb: ReturnType<typeof getFirestore> | null = null;
let _initError: string | null = null;

function initAdminDb(): ReturnType<typeof getFirestore> | null {
  let serviceAccount: Record<string, unknown> | undefined;

  const serviceAccountPath = path.resolve(process.cwd(), "service-account.json");
  if (fs.existsSync(serviceAccountPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    } catch (error) {
      console.error("Failed to parse service-account.json:", error);
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env var:", error);
    }
  }

  if (!serviceAccount) {
    _initError = "Firebase Admin credentials not found. API routes will fallback to client SDK.";
    console.warn("[firebaseAdmin]", _initError);
    return null;
  }

  try {
    const app = getApps().length > 0
      ? getApp()
      : initializeApp({ credential: cert(serviceAccount as any) });

    return getFirestore(app);
  } catch (err) {
    _initError = "Firebase Admin init failed: " + (err instanceof Error ? err.message : String(err));
    console.warn("[firebaseAdmin]", _initError);
    return null;
  }
}

export function getAdminDb(): ReturnType<typeof getFirestore> | null {
  if (_adminDb !== null) return _adminDb;
  if (_initError !== null) return null;
  _adminDb = initAdminDb();
  return _adminDb;
}

export { _initError as adminInitError };
