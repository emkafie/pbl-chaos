import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminDb } from "@/app/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rfid_uid = searchParams.get("rfid_uid");

    if (!rfid_uid) {
      return NextResponse.json({ error: "RFID_UID_REQUIRED" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Admin SDK unavailable" }, { status: 503 });
    }

    const sessionsRef = adminDb.collection("sessions");
    const snapshot = await sessionsRef
      .where("rfid_uid", "==", rfid_uid)
      .limit(50)
      .get();

    const sessions: Record<string, unknown>[] = [];
    snapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
    });

    sessions.sort((a, b) => {
      const aTime = (a.created_at as any)?.toMillis?.() ?? 0;
      const bTime = (b.created_at as any)?.toMillis?.() ?? 0;
      return bTime - aTime;
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("[/api/guest/history] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch history" },
      { status: 500 }
    );
  }
}
