import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_BASE, useApiHeaders } from "./AuthContext";

export type UdhaarType = "Lent" | "Borrowed";
export type UdhaarStatus = "Active" | "Settled";
export type TransactionType = "Initial" | "Add" | "Reduce";

export interface TransactionEntry {
  type: TransactionType;
  amount: number;
  note: string;
  date: string;
}

export interface Udhaar {
  id: string;
  person_name: string;
  phone?: string;
  amount: number;
  type: UdhaarType;
  status: UdhaarStatus;
  due_date?: string;
  history: TransactionEntry[];
  settled_amount: number;
  created_at: string;
}

interface UdhaarContextType {
  entries: Udhaar[];
  loading: boolean;
  addUdhaar: (payload: { person_name: string; phone?: string; amount: number; type: UdhaarType; due_date?: string; note?: string }) => Promise<void>;
  addTransaction: (id: string, type: "Add" | "Reduce", amount: number, note: string) => Promise<void>;
  markFullySettled: (id: string) => Promise<void>;
  deleteUdhaar: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const UdhaarContext = createContext<UdhaarContextType | null>(null);

interface UdhaarProviderProps {
  children: React.ReactNode;
  token: string | null;
}

export function UdhaarProvider({ children, token }: UdhaarProviderProps) {
  const [entries, setEntries] = useState<Udhaar[]>([]);
  const [loading, setLoading] = useState(true);
  const headers = useApiHeaders();

  const fetchFromAPI = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/udhaar`, { headers });
      if (res.ok) {
        const data: Udhaar[] = await res.json();
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setEntries(data);
      }
    } catch {}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (token) { setLoading(true); fetchFromAPI(); }
    else { setEntries([]); setLoading(false); }
  }, [token]);

  const addUdhaar = useCallback(async (payload: { person_name: string; phone?: string; amount: number; type: UdhaarType; due_date?: string; note?: string }) => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/udhaar`, { method: "POST", headers, body: JSON.stringify(payload) });
    if (res.ok) {
      const entry: Udhaar = await res.json();
      setEntries((prev) => [entry, ...prev]);
    }
  }, [token, headers]);

  const addTransaction = useCallback(async (id: string, type: "Add" | "Reduce", amount: number, note: string) => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/udhaar/${id}/transaction`, {
      method: "POST",
      headers,
      body: JSON.stringify({ type, amount, note }),
    });
    if (res.ok) {
      const updated: Udhaar = await res.json();
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    }
  }, [token, headers]);

  const markFullySettled = useCallback(async (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    const remaining = entry.amount - entry.settled_amount;
    if (remaining > 0) {
      await addTransaction(id, "Reduce", remaining, "Marked as fully settled");
    }
  }, [entries, addTransaction]);

  const deleteUdhaar = useCallback(async (id: string) => {
    if (!token) return;
    await fetch(`${API_BASE}/udhaar/${id}`, { method: "DELETE", headers });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, [token, headers]);

  return (
    <UdhaarContext.Provider value={{ entries, loading, addUdhaar, addTransaction, markFullySettled, deleteUdhaar, refresh: fetchFromAPI }}>
      {children}
    </UdhaarContext.Provider>
  );
}

export function useUdhaar() {
  const ctx = useContext(UdhaarContext);
  if (!ctx) throw new Error("useUdhaar must be used within UdhaarProvider");
  return ctx;
}
