import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  limit,
  startAt,
  endAt,
} from "firebase/firestore";
import { ParkingSession } from "@/types";

export const SessionService = {
  // READ: Dapatkan semua sessions dengan limit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAllSessions: async (database: any): Promise<ParkingSession[]> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const sessionsRef = collection(database, "sessions");
      // Limit 1000 reads — big data optimization
      const q = query(sessionsRef, orderBy("created_at", "desc"), limit(1000));
      const querySnapshot = await getDocs(q);

      const sessions: ParkingSession[] = [];
      querySnapshot.forEach((doc) => {
        sessions.push({
          id: doc.id,
          rfid_uid: doc.data().rfid_uid,
          vehicle_type: doc.data().vehicle_type,
          slot_id: doc.data().slot_id,
          check_in: doc.data().check_in,
          check_out: doc.data().check_out || null,
          duration_minutes: doc.data().duration_minutes || 0,
          fee: doc.data().fee || 0,
          status: doc.data().status || "ongoing",
          created_at: doc.data().created_at,
        });
      });

      return sessions;
    } catch (error) {
      console.error("Error fetching sessions:", error);
      throw new Error("FETCH_SESSIONS_FAILED");
    }
  },

  // READ: Filter sessions by date range
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSessionsByDateRange: async (
    database: any,
    startDate: string,
    endDate: string,
  ): Promise<ParkingSession[]> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const sessionsRef = collection(database, "sessions");
      const startDateTime = new Date(startDate).toISOString();
      const endDateTime = new Date(endDate).toISOString();

      const q = query(
        sessionsRef,
        where("created_at", ">=", startDateTime),
        where("created_at", "<=", endDateTime),
        orderBy("created_at", "desc"),
        limit(1000),
      );

      const querySnapshot = await getDocs(q);

      const sessions: ParkingSession[] = [];
      querySnapshot.forEach((doc) => {
        sessions.push({
          id: doc.id,
          rfid_uid: doc.data().rfid_uid,
          vehicle_type: doc.data().vehicle_type,
          slot_id: doc.data().slot_id,
          check_in: doc.data().check_in,
          check_out: doc.data().check_out || null,
          duration_minutes: doc.data().duration_minutes || 0,
          fee: doc.data().fee || 0,
          status: doc.data().status || "ongoing",
          created_at: doc.data().created_at,
        });
      });

      return sessions;
    } catch (error) {
      console.error("Error fetching sessions by date range:", error);
      throw new Error("FETCH_SESSIONS_BY_DATE_FAILED");
    }
  },

  // READ: Filter sessions by status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSessionsByStatus: async (
    database: any,
    status: string,
  ): Promise<ParkingSession[]> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const sessionsRef = collection(database, "sessions");
      const q = query(
        sessionsRef,
        where("status", "==", status),
        orderBy("created_at", "desc"),
        limit(1000),
      );

      const querySnapshot = await getDocs(q);

      const sessions: ParkingSession[] = [];
      querySnapshot.forEach((doc) => {
        sessions.push({
          id: doc.id,
          rfid_uid: doc.data().rfid_uid,
          vehicle_type: doc.data().vehicle_type,
          slot_id: doc.data().slot_id,
          check_in: doc.data().check_in,
          check_out: doc.data().check_out || null,
          duration_minutes: doc.data().duration_minutes || 0,
          fee: doc.data().fee || 0,
          status: doc.data().status || "ongoing",
          created_at: doc.data().created_at,
        });
      });

      return sessions;
    } catch (error) {
      console.error("Error fetching sessions by status:", error);
      throw new Error("FETCH_SESSIONS_BY_STATUS_FAILED");
    }
  },

  // READ: Get session statistics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSessionStatistics: async (
    database: any,
  ): Promise<{
    totalSessions: number;
    totalRevenue: number;
    averageDuration: number;
    averageFee: number;
    completedSessions: number;
    ongoingSessions: number;
  }> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const sessions = await SessionService.getAllSessions(database);

      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(
        (s) => s.status === "completed",
      ).length;
      const ongoingSessions = sessions.filter(
        (s) => s.status === "ongoing",
      ).length;
      const totalRevenue = sessions.reduce((sum, s) => sum + (s.fee || 0), 0);
      const totalDuration = sessions.reduce(
        (sum, s) => sum + (s.duration_minutes || 0),
        0,
      );
      const averageDuration =
        totalSessions > 0 ? totalDuration / totalSessions : 0;
      const averageFee = totalSessions > 0 ? totalRevenue / totalSessions : 0;

      return {
        totalSessions,
        totalRevenue,
        averageDuration,
        averageFee,
        completedSessions,
        ongoingSessions,
      };
    } catch (error) {
      console.error("Error calculating session statistics:", error);
      throw new Error("CALCULATE_STATISTICS_FAILED");
    }
  },
};
