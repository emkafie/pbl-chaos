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

    const sessionRef = adminDb.collection("sessions").doc(session_id);
    const sessionDoc = await sessionRef.get();

    // If session ID is deterministic (ends with _ongoing) and the document is not found,
    // it means another client/tab concurrent request already checked it out and deleted the placeholder.
    if (session_id.endsWith("_ongoing") && !sessionDoc.exists) {
      return NextResponse.json({
        success: true,
        already_completed: true,
        message: "Session already checked out by concurrent request"
      });
    }

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const sessionData = sessionDoc.data();
    if (sessionData?.status !== "ongoing") {
      return NextResponse.json({
        success: true,
        already_completed: true,
        message: "Session already completed"
      });
    }

    // Deduct balance from RFID Card
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

    const finalCheckOut = check_out || new Date().toISOString();
    const finalDuration = duration_minutes || 0;
    const finalFee = fee || 0;

    if (session_id.endsWith("_ongoing")) {
      // Create a completed copy in history (with random document ID)
      const newSessionRef = adminDb.collection("sessions").doc();
      await newSessionRef.set({
        ...sessionData,
        status: "completed",
        check_out: finalCheckOut,
        duration_minutes: finalDuration,
        fee: finalFee,
      });

      // Delete the ongoing placeholder
      await sessionRef.delete();
      console.log(`[/api/parking/checkout] Copied ongoing session ${session_id} to completed session ${newSessionRef.id} and deleted placeholder. RFID: ${rfid_uid}, Fee: Rp${fee}, New Balance: ${newBalance}`);
    } else {
      // Fallback update for legacy/other session IDs
      await sessionRef.update({
        status: "completed",
        check_out: finalCheckOut,
        duration_minutes: finalDuration,
        fee: finalFee,
      });
      console.log(`[/api/parking/checkout] Session ${session_id} completed (fallback update). RFID: ${rfid_uid}, Fee: Rp${fee}, New Balance: ${newBalance}`);
    }

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
