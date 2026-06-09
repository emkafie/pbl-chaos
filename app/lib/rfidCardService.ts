import {
    doc,
    getDoc,
    updateDoc
} from "firebase/firestore";

export interface RFIDCardData {
  id: string; // RFID UID
  saldo: number;
  owner?: string;
  last_transaction?: string;
  created_at?: string;
}

export const RFIDCardService = {
  // READ: Get card balance by RFID UID
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

  // UPDATE: Deduct balance from RFID card when checking out
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deductBalance: async (
    database: any,
    rfidUid: string,
    amount: number,
  ): Promise<number> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const cardRef = doc(database, "rfid_cards", rfidUid);
      const cardDoc = await getDoc(cardRef);

      if (!cardDoc.exists()) {
        throw new Error("CARD_NOT_FOUND");
      }

      const currentBalance = cardDoc.data().saldo || 0;

      // Check if balance is sufficient
      if (currentBalance < amount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // Deduct balance
      const newBalance = currentBalance - amount;
      await updateDoc(cardRef, {
        saldo: newBalance,
        last_transaction: new Date().toISOString(),
      });

      console.log(
        `✅ Balance deducted for ${rfidUid}: Rp${amount.toLocaleString("id-ID")} | New balance: Rp${newBalance.toLocaleString("id-ID")}`,
      );

      return newBalance;
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

  // UPDATE: Add balance to RFID card (for top-up)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addBalance: async (
    database: any,
    rfidUid: string,
    amount: number,
  ): Promise<number> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const cardRef = doc(database, "rfid_cards", rfidUid);
      const cardDoc = await getDoc(cardRef);

      if (!cardDoc.exists()) {
        throw new Error("CARD_NOT_FOUND");
      }

      const currentBalance = cardDoc.data().saldo || 0;
      const newBalance = currentBalance + amount;

      await updateDoc(cardRef, {
        saldo: newBalance,
        last_transaction: new Date().toISOString(),
      });

      console.log(
        `✅ Balance added for ${rfidUid}: Rp${amount.toLocaleString("id-ID")} | New balance: Rp${newBalance.toLocaleString("id-ID")}`,
      );

      return newBalance;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "CARD_NOT_FOUND") {
        throw error;
      }
      console.error("Error adding balance:", error);
      throw new Error("ADD_BALANCE_FAILED");
    }
  },
};
