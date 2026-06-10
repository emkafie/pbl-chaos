import {
  collection,
  query,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

export interface UserData {
  id: string;
  username: string;
  role: "admin" | "operator" | "guest";
  rfid_uid?: string;
  created_at: string;
  last_login: string;
}

export const UserService = {
  hashPassword: async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAllUsers: async (database: any): Promise<UserData[]> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const usersRef = collection(database, "users");
      const q = query(usersRef, orderBy("created_at", "desc"), limit(100));
      const querySnapshot = await getDocs(q);

      const users: UserData[] = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          username: doc.data().username,
          role: doc.data().role || "guest",
          rfid_uid: doc.data().rfid_uid || "",
          created_at: doc.data().created_at,
          last_login: doc.data().last_login,
        });
      });

      return users.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("FETCH_USERS_FAILED");
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getUserById: async (database: any, userId: string): Promise<UserData | null> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const userDoc = await getDoc(doc(database, "users", userId));
      if (!userDoc.exists()) return null;

      return {
        id: userDoc.id,
        username: userDoc.data().username,
        role: userDoc.data().role || "guest",
        rfid_uid: userDoc.data().rfid_uid || "",
        created_at: userDoc.data().created_at,
        last_login: userDoc.data().last_login,
      };
    } catch (error) {
      console.error("Error fetching user:", error);
      throw new Error("FETCH_USER_FAILED");
    }
  },

  // CREATE: via API Route (Admin SDK server-side — no adblocker issues)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createUser: async (
    database: any,
    username: string,
    password: string,
    role: "admin" | "operator" | "guest" = "operator",
    rfid_uid?: string,
  ): Promise<UserData> => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role, rfid_uid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "CREATE_USER_FAILED");
      }

      return await response.json();
    } catch (error: unknown) {
      if (error instanceof Error) throw error;
      console.error("Error creating user:", error);
      throw new Error("CREATE_USER_FAILED");
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateUser: async (
    database: any,
    userId: string,
    updateData: Partial<Omit<UserData, "id" | "created_at" | "last_login">>,
  ): Promise<UserData> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const userRef = doc(database, "users", userId);

      if (updateData.username) {
        const usersRef = collection(database, "users");
        const q = query(usersRef, where("username", "==", updateData.username));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty && querySnapshot.docs[0].id !== userId) {
          throw new Error("USERNAME_ALREADY_EXISTS");
        }
      }

      const updatePayload: Record<string, unknown> = { ...updateData };
      await updateDoc(userRef, updatePayload);

      const updatedUser = await UserService.getUserById(database, userId);
      if (!updatedUser) throw new Error("USER_NOT_FOUND");
      return updatedUser;
    } catch (error: unknown) {
      if (error instanceof Error) throw error;
      console.error("Error updating user:", error);
      throw new Error("UPDATE_USER_FAILED");
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateUserPassword: async (database: any, userId: string, newPassword: string): Promise<void> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const userRef = doc(database, "users", userId);
      const hashedPassword = await UserService.hashPassword(newPassword);
      await updateDoc(userRef, { password: hashedPassword });
    } catch (error) {
      console.error("Error updating password:", error);
      throw new Error("UPDATE_PASSWORD_FAILED");
    }
  },

  // DELETE: via API Route (Admin SDK server-side)
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
    } catch (error: unknown) {
      if (error instanceof Error) throw error;
      console.error("Error deleting user:", error);
      throw new Error("DELETE_USER_FAILED");
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verifyPassword: async (database: any, userId: string, currentPassword: string): Promise<boolean> => {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProfilePicture: async (database: any, userId: string, profilePicture: string): Promise<void> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const userRef = doc(database, "users", userId);
      await updateDoc(userRef, { profilePicture });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      throw new Error("UPDATE_PROFILE_PICTURE_FAILED");
    }
  },
};
