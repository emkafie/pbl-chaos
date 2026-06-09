import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let serviceAccount;

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
  throw new Error(
    "Firebase Admin credentials not found. Please place service-account.json at the project root or configure the FIREBASE_SERVICE_ACCOUNT env variable."
  );
}

const app = getApps().length > 0
  ? getApp()
  : initializeApp({
      credential: cert(serviceAccount),
    });

const adminDb = getFirestore(app);

export { adminDb };
