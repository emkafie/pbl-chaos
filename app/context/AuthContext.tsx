"use client";

import { UserProfile } from "@/types";
import { useState, useEffect, createContext, useContext } from "react";
import { auth, db } from "@/app/lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { AuthService } from "@/app/lib/authService";
import { UserService, UserData } from "@/app/lib/userService";

interface AuthContextType {
  user: UserProfile | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  users: UserData[];
  usersLoading: boolean;
  usersError: string | null;
  refreshUsers: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Initial Load from LocalStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("active_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem("active_user");
      }
    }
    setLoading(false);

    // Keep Firebase Auth in sync for potential Firebase rules usage (optional)
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log(
        "Firebase Auth State:",
        firebaseUser ? "Anonymously Authenticated" : "Unauthenticated",
      );
    });

    return () => unsubscribe();
  }, []);

  // Fetch users list
  const refreshUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const usersList = await UserService.getAllUsers(db);
      setUsers(usersList);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsersError(
        err instanceof Error ? err.message : "Failed to fetch users",
      );
    } finally {
      setUsersLoading(false);
    }
  };

  // Load users saat component mount
  useEffect(() => {
    refreshUsers();
  }, []);

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const profile = await AuthService.login(db, username, password);
      const userProfile: UserProfile = {
        ...profile,
        lastLogin: new Date().toISOString(),
      };

      setUser(userProfile);
      localStorage.setItem("active_user", JSON.stringify(userProfile));

      // Refresh users list to update login times
      await refreshUsers();

      // Set session cookie for middleware if needed
      document.cookie = "user_session=true; path=/;";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage = err.message || "Login failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth); // Sign out from Firebase if logged in anonymously
      setUser(null);
      localStorage.removeItem("active_user");
      document.cookie =
        "user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signOut,
        isAuthenticated: !!user,
        loading,
        error,
        users,
        usersLoading,
        usersError,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
