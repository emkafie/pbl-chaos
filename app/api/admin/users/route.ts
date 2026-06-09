import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminDb } from "@/app/lib/firebaseAdmin";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { username, password, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // 1. Cek apakah username sudah terdaftar
    const usersRef = getAdminDb().collection("users");
    const snapshot = await usersRef.where("username", "==", username).get();
    if (!snapshot.empty) {
      return NextResponse.json(
        { error: "USERNAME_ALREADY_EXISTS" },
        { status: 400 }
      );
    }

    // 2. Hash password menggunakan SHA-256
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    // 3. Buat dokumen baru dengan ID acak
    const newUserRef = usersRef.doc();
    const userData = {
      username: username,
      password: hashedPassword,
      role: role || "operator",
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    };

    await newUserRef.set(userData);

    return NextResponse.json({
      id: newUserRef.id,
      ...userData,
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

    // Hapus dokumen user di Firestore
    const userRef = getAdminDb().collection("users").doc(id);
    await userRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/admin/users] DELETE Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete user" },
      { status: 500 }
    );
  }
}
