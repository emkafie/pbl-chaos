import {
  collection,
  query,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

export interface UserData {
  id: string;
  username: string;
  role: "admin" | "operator" | "guest";
  created_at: string;
  last_login: string;
}

export const UserService = {
  // Fungsi untuk hashing password (sama seperti di AuthService)
  hashPassword: async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  },

  // READ: Dapatkan semua users
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAllUsers: async (database: any): Promise<UserData[]> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const usersRef = collection(database, "users");
      // limit(100) caps reads — users collection is small but safety first
      const q = query(usersRef, orderBy("created_at", "desc"), limit(100));
      const querySnapshot = await getDocs(q);

      const users: UserData[] = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          username: doc.data().username,
          role: doc.data().role || "guest",
          created_at: doc.data().created_at,
          last_login: doc.data().last_login,
        });
      });

      // Sort by created_at descending (terbaru di atas)
      return users.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("FETCH_USERS_FAILED");
    }
  },

  // READ: Dapatkan user berdasarkan ID
  getUserById: async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    database: any,
    userId: string,
  ): Promise<UserData | null> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const userDoc = await getDoc(doc(database, "users", userId));

      if (!userDoc.exists()) {
        return null;
      }

      return {
        id: userDoc.id,
        username: userDoc.data().username,
        role: userDoc.data().role || "guest",
        created_at: userDoc.data().created_at,
        last_login: userDoc.data().last_login,
      };
    } catch (error) {
      console.error("Error fetching user:", error);
      throw new Error("FETCH_USER_FAILED");
    }
  },

  // CREATE: Buat user baru (melalui API Route agar lolos aturan Firestore)
  createUser: async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    database: any,
    username: string,
    password: string,
    role: "admin" | "operator" | "guest" = "operator",
  ): Promise<UserData> => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "CREATE_USER_FAILED");
      }

      return await response.json();
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      console.error("Error creating user:", error);
      throw new Error("CREATE_USER_FAILED");
    }
  },

  // UPDATE: Update user (username, role)
  updateUser: async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    database: any,
    userId: string,
    updateData: Partial<Omit<UserData, "id" | "created_at" | "last_login">>,
  ): Promise<UserData> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const userRef = doc(database, "users", userId);

      // Validasi kalau username berubah, cek apakah sudah ada user lain dengan username itu
      if (updateData.username) {
        const usersRef = collection(database, "users");
        const q = query(usersRef, where("username", "==", updateData.username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty && querySnapshot.docs[0].id !== userId) {
          throw new Error("USERNAME_ALREADY_EXISTS");
        }
      }

      const updatePayload: Record<string, unknown> = {
        ...updateData,
      };

      await updateDoc(userRef, updatePayload);

      // Return updated user
      const updatedUser = await UserService.getUserById(database, userId);
      if (!updatedUser) throw new Error("USER_NOT_FOUND");

      return updatedUser;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      console.error("Error updating user:", error);
      throw new Error("UPDATE_USER_FAILED");
    }
  },

  // UPDATE: Update password user
  updateUserPassword: async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    database: any,
    userId: string,
    newPassword: string,
  ): Promise<void> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const userRef = doc(database, "users", userId);
      const hashedPassword = await UserService.hashPassword(newPassword);

      await updateDoc(userRef, {
        password: hashedPassword,
      });
    } catch (error) {
      console.error("Error updating password:", error);
      throw new Error("UPDATE_PASSWORD_FAILED");
    }
  },

  // DELETE: Hapus user (melalui API Route agar lolos aturan Firestore)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteUser: async (database: any, userId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "DELETE_USER_FAILED");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error("DELETE_USER_FAILED");
    }
  },

  // VERIFY: Verify current password for reauthentication
  verifyPassword: async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    database: any,
    userId: string,
    currentPassword: string,
  ): Promise<boolean> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const userDoc = await getDoc(doc(database, "users", userId));
      if (!userDoc.exists()) throw new Error("USER_NOT_FOUND");

      const userData = userDoc.data();
      const hashedPassword = await UserService.hashPassword(currentPassword);
      return userData.password === hashedPassword;
    } catch (error) {
      console.error("Error verifying password:", error);
      throw new Error("VERIFY_PASSWORD_FAILED");
    }
  },

  // UPDATE: Update profile picture
  updateProfilePicture: async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    database: any,
    userId: string,
    profilePicture: string,
  ): Promise<void> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const userRef = doc(database, "users", userId);
      await updateDoc(userRef, {
        profilePicture: profilePicture,
      });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      throw new Error("UPDATE_PROFILE_PICTURE_FAILED");
    }
  },
};
