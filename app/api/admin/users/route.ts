import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminDb } from "@/app/lib/firebaseAdmin";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, role } = body;
    const rfid_uid = typeof body.rfid_uid === "string" ? body.rfid_uid.trim() : undefined;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: "Admin SDK unavailable. Please add service-account.json to the project root." },
        { status: 503 }
      );
    }

    const usersRef = adminDb.collection("users");

    const snapshot = await usersRef.where("username", "==", username).get();
    if (!snapshot.empty) {
      return NextResponse.json(
        { error: "USERNAME_ALREADY_EXISTS" },
        { status: 400 }
      );
    }

    if (role === "guest") {
      if (!rfid_uid) {
        return NextResponse.json(
          { error: "RFID_UID_REQUIRED_FOR_GUEST" },
          { status: 400 }
        );
      }

      const rfidDoc = await adminDb.collection("rfid_cards").doc(rfid_uid).get();
      if (!rfidDoc.exists) {
        return NextResponse.json(
          { error: "RFID_CARD_NOT_FOUND" },
          { status: 400 }
        );
      }
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const newUserRef = usersRef.doc();
    const userData: Record<string, unknown> = {
      username,
      password: hashedPassword,
      role: role || "operator",
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    };

    if (rfid_uid) {
      userData.rfid_uid = rfid_uid;
    }

    await newUserRef.set(userData);

    return NextResponse.json({
      id: newUserRef.id,
      username,
      role: role || "operator",
      rfid_uid: rfid_uid || "",
      created_at: userData.created_at as string,
      last_login: userData.last_login as string,
    });
  } catch (error) {
    console.error("[/api/admin/users] POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: "Admin SDK unavailable" },
        { status: 503 }
      );
    }

    await adminDb.collection("users").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/admin/users] DELETE Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete user" },
      { status: 500 }
    );
  }
}
