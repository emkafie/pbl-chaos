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

    const cardDoc = await adminDb.collection("rfid_cards").doc(rfid_uid).get();
    if (!cardDoc.exists) {
      return NextResponse.json({ error: "RFID_CARD_NOT_FOUND" }, { status: 404 });
    }

    const data = cardDoc.data();
    return NextResponse.json({
      rfid_uid: cardDoc.id,
      saldo: data?.saldo || 0,
      owner: data?.owner || "",
      last_transaction: data?.last_transaction || null,
      created_at: data?.created_at || null,
    });
  } catch (error) {
    console.error("[/api/guest/balance] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch balance" },
      { status: 500 }
    );
  }
}
