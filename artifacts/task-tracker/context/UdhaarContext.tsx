import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type UdhaarType = "Lent" | "Borrowed";
export type UdhaarStatus = "Active" | "Settled";

export interface SettlementEntry {
  date: string;
  amount_paid: number;
  note: string;
}

export interface Udhaar {
  id: string;
  person_name: string;
  amount: number;
  type: UdhaarType;
  status: UdhaarStatus;
  due_date?: string;
  history: SettlementEntry[];
  settled_amount: number;
  created_at: string;
}

interface UdhaarContextType {
  entries: Udhaar[];
  loading: boolean;
  addUdhaar: (payload: Omit<Udhaar, "id" | "created_at" | "history" | "settled_amount" | "status">) => Promise<void>;
  settlePartial: (id: string, amount_paid: number, note: string) => Promise<void>;
  markFullySettled: (id: string) => Promise<void>;
  deleteUdhaar: (id: string) => Promise<void>;
}

const UdhaarContext = createContext<UdhaarContextType | null>(null);
const STORAGE_KEY = "@udhaar_v1";

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

async function persistList(list: Udhaar[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function UdhaarProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Udhaar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => { if (stored) setEntries(JSON.parse(stored)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addUdhaar = useCallback(
    async (payload: Omit<Udhaar, "id" | "created_at" | "history" | "settled_amount" | "status">) => {
      const entry: Udhaar = {
        ...payload,
        id: generateId(),
        status: "Active",
        settled_amount: 0,
        history: [],
        created_at: new Date().toISOString(),
      };
      setEntries((prev) => {
        const next = [entry, ...prev];
        persistList(next);
        return next;
      });
    },
    []
  );

  const settlePartial = useCallback(async (id: string, amount_paid: number, note: string) => {
    setEntries((prev) => {
      const next = prev.map((e) => {
        if (e.id !== id) return e;
        const newSettled = e.settled_amount + amount_paid;
        return {
          ...e,
          settled_amount: newSettled,
          status: (newSettled >= e.amount ? "Settled" : "Active") as UdhaarStatus,
          history: [...e.history, { date: new Date().toISOString(), amount_paid, note }],
        };
      });
      persistList(next);
      return next;
    });
  }, []);

  const markFullySettled = useCallback(async (id: string) => {
    setEntries((prev) => {
      const next = prev.map((e) => {
        if (e.id !== id) return e;
        return {
          ...e,
          settled_amount: e.amount,
          status: "Settled" as UdhaarStatus,
          history: [
            ...e.history,
            { date: new Date().toISOString(), amount_paid: e.amount - e.settled_amount, note: "Marked as fully settled" },
          ],
        };
      });
      persistList(next);
      return next;
    });
  }, []);

  const deleteUdhaar = useCallback(async (id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      persistList(next);
      return next;
    });
  }, []);

  return (
    <UdhaarContext.Provider value={{ entries, loading, addUdhaar, settlePartial, markFullySettled, deleteUdhaar }}>
      {children}
    </UdhaarContext.Provider>
  );
}

export function useUdhaar() {
  const ctx = useContext(UdhaarContext);
  if (!ctx) throw new Error("useUdhaar must be used within UdhaarProvider");
  return ctx;
}
