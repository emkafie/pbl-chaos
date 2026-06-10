import {
    doc,
    getDoc,
} from "firebase/firestore";

export interface RFIDCardData {
  id: string;
  saldo: number;
  owner?: string;
  last_transaction?: string;
  created_at?: string;
}

export const RFIDCardService = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCardBalance: async (database: any, rfidUid: string): Promise<RFIDCardData | null> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const cardDoc = await getDoc(doc(database, "rfid_cards", rfidUid));

      if (!cardDoc.exists()) {
        console.warn(`RFID Card not found: ${rfidUid}`);
        return null;
      }

      return {
        id: cardDoc.id,
        saldo: cardDoc.data().saldo || 0,
        owner: cardDoc.data().owner,
        last_transaction: cardDoc.data().last_transaction,
        created_at: cardDoc.data().created_at,
      };
    } catch (error) {
      console.error("Error fetching RFID card balance:", error);
      throw new Error("FETCH_CARD_BALANCE_FAILED");
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deductBalance: async (
    database: any,
    rfidUid: string,
    amount: number,
  ): Promise<number> => {
    try {
      const response = await fetch("/api/guest/deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfid_uid: rfidUid, amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "DEDUCT_BALANCE_FAILED");
      }

      const data = await response.json();

      console.log(
        `✅ Balance deducted for ${rfidUid}: Rp${amount.toLocaleString("id-ID")} | New balance: Rp${data.saldo.toLocaleString("id-ID")}`,
      );

      return data.saldo;
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (
          error.message === "INSUFFICIENT_BALANCE" ||
          error.message === "CARD_NOT_FOUND"
        ) {
          throw error;
        }
      }
      console.error("Error deducting balance:", error);
      throw new Error("DEDUCT_BALANCE_FAILED");
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addBalance: async (
    database: any,
    rfidUid: string,
    amount: number,
  ): Promise<number> => {
    try {
      const response = await fetch("/api/guest/deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfid_uid: rfidUid, amount: -amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "ADD_BALANCE_FAILED");
      }

      const data = await response.json();

      console.log(
        `✅ Balance added for ${rfidUid}: Rp${amount.toLocaleString("id-ID")} | New balance: Rp${data.saldo.toLocaleString("id-ID")}`,
      );

      return data.saldo;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "CARD_NOT_FOUND") {
        throw error;
      }
      console.error("Error adding balance:", error);
      throw new Error("ADD_BALANCE_FAILED");
    }
  },
};
