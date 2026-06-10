import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminDb } from "@/app/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const { rfid_uid, amount } = await request.json();

    if (!rfid_uid || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "RFID_UID_AND_AMOUNT_REQUIRED" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Admin SDK unavailable" }, { status: 503 });
    }

    const cardRef = adminDb.collection("rfid_cards").doc(rfid_uid);
    const cardDoc = await cardRef.get();

    if (!cardDoc.exists) {
      return NextResponse.json({ error: "CARD_NOT_FOUND" }, { status: 404 });
    }

    const currentBalance = cardDoc.data()?.saldo || 0;

    if (currentBalance < amount) {
      return NextResponse.json({ error: "INSUFFICIENT_BALANCE" }, { status: 400 });
    }

    const newBalance = currentBalance - amount;
    await cardRef.update({
      saldo: newBalance,
      last_transaction: new Date().toISOString(),
    });

    return NextResponse.json({ rfid_uid, saldo: newBalance, deducted: amount });
  } catch (error) {
    console.error("[/api/guest/deduct] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to deduct balance" },
      { status: 500 }
    );
  }
}
