import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminDb } from "@/app/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, rfid_uid, check_in, check_out, duration_minutes, fee } = body;

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Admin SDK unavailable" }, { status: 503 });
    }

    await adminDb.collection("sessions").doc(session_id).update({
      status: "completed",
      check_out: check_out || new Date().toISOString(),
      duration_minutes: duration_minutes || 0,
      fee: fee || 0,
    });

    let newBalance: number | null = null;
    let deductionError: string | null = null;

    if (rfid_uid && fee > 0) {
      const cardRef = adminDb.collection("rfid_cards").doc(rfid_uid);
      const cardDoc = await cardRef.get();

      if (!cardDoc.exists) {
        deductionError = "CARD_NOT_FOUND";
      } else {
        const currentBalance = cardDoc.data()?.saldo || 0;
        if (currentBalance < fee) {
          deductionError = "INSUFFICIENT_BALANCE";
        } else {
          newBalance = currentBalance - fee;
          await cardRef.update({
            saldo: newBalance,
            last_transaction: new Date().toISOString(),
          });
        }
      }
    }

    console.log(`[/api/parking/checkout] Session ${session_id} completed. RFID: ${rfid_uid}, Fee: Rp${fee}, New Balance: ${newBalance}`);

    return NextResponse.json({
      success: true,
      new_balance: newBalance,
      deduction_error: deductionError,
    });
  } catch (error) {
    console.error("[/api/parking/checkout] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
