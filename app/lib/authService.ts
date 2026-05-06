import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  setDoc,
} from "firebase/firestore";

export const AuthService = {
  // Fungsi untuk melakukan hashing password
  hashPassword: async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  login: async (database: any, username: string, plainPassword: string) => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    const usersRef = collection(database, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("USER_NOT_FOUND");
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Hash password input dan bandingkan dengan yang ada di DB
    const hashedPassword = await AuthService.hashPassword(plainPassword);

    if (userData.password !== hashedPassword) {
      throw new Error("INVALID_PASSWORD");
    }

    // Update login terakhir
    await updateDoc(doc(database, "users", userDoc.id), {
      last_login: new Date().toISOString(),
    });

    return {
      id: userDoc.id,
      username: userData.username,
      email: userData.email || "",
      role: userData.role || "operator",
      profilePicture: userData.profilePicture || "",
    };
  },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: async (database: any, username: string, plainPassword: string) => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    const usersRef = collection(database, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error("USERNAME_ALREADY_EXISTS");
    }

    // Hash password sebelum disimpan ke database (SANGAT PENTING!)
    const hashedPassword = await AuthService.hashPassword(plainPassword);

    // Penentuan role sederhana (jika ada kata 'admin' jadi admin, else operator else user)
    const role = username.toLowerCase().includes("admin")
      ? "admin"
      : username.toLowerCase().includes("operator")
      ? "operator"
      : "guest";

    // Buat dokumen baru dengan ID random dari Firestore
    const newUserRef = doc(collection(database, "users"));
    await setDoc(newUserRef, {
      username: username,
      password: hashedPassword, // YANG DISIMPAN ADALAH HASH, BUKAN PLAIN TEXT
      role: role,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    });

    return true;
  },
};
