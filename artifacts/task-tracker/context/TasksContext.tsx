import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { API_BASE, useApiHeaders } from "./AuthContext";

export type TaskStatus = "Pending" | "In Progress" | "Completed";

export interface HistoryEntry {
  date: string;
  note: string;
  images?: string[];
  link?: string;
}

export interface Task {
  id: string;
  task_name: string;
  person_name?: string;
  phone?: string;
  total_amount: number;
  paid_amount: number;
  status: TaskStatus;
  work_done: boolean;
  payment_received: boolean;
  image_uris: string[];
  notes?: string;
  deadline_at?: string;
  history: HistoryEntry[];
  created_at: string;
}

export interface BulkTaskRow {
  task_name: string;
  total_amount: number;
  image_uri?: string;
  deadline_at?: string;
}

interface TasksContextType {
  tasks: Task[];
  loading: boolean;
  addTask: (payload: Omit<Task, "id" | "created_at" | "history">) => Promise<void>;
  bulkAddTasks: (rows: BulkTaskRow[], onProgress: (done: number, total: number) => void) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>, historyEntry?: HistoryEntry) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTask: (id: string) => Task | undefined;
  refresh: () => Promise<void>;
}

const TasksContext = createContext<TasksContextType | null>(null);

function migrateTask(raw: any): Task {
  const imageUris: string[] = raw.image_uris ? raw.image_uris : raw.image_uri ? [raw.image_uri] : [];
  return {
    id: raw.id,
    task_name: raw.task_name,
    person_name: raw.person_name ?? undefined,
    phone: raw.phone ?? undefined,
    total_amount: raw.total_amount ?? 0,
    paid_amount: raw.paid_amount ?? 0,
    status: raw.status ?? "Pending",
    work_done: raw.work_done ?? false,
    payment_received: raw.payment_received ?? false,
    image_uris: imageUris,
    notes: raw.notes,
    deadline_at: raw.deadline_at,
    history: raw.history ?? [],
    created_at: raw.created_at,
  };
}

interface TasksProviderProps {
  children: React.ReactNode;
  token: string | null;
}

export function TasksProvider({ children, token }: TasksProviderProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const tasksRef = useRef<Task[]>([]);
  const headers = useApiHeaders();

  const fetchFromAPI = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/tasks`, { headers });
      if (res.ok) {
        const data = await res.json();
        const mapped: Task[] = data.map(migrateTask);
        mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setTasks(mapped);
      }
    } catch {}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (token) { setLoading(true); fetchFromAPI(); }
    else { setTasks([]); setLoading(false); }
  }, [token]);

  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  const addTask = useCallback(async (payload: Omit<Task, "id" | "created_at" | "history">) => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/tasks`, { method: "POST", headers, body: JSON.stringify(payload) });
    if (res.ok) {
      const task: Task = migrateTask(await res.json());
      setTasks((prev) => [task, ...prev]);
    }
  }, [token, headers]);

  const bulkAddTasks = useCallback(async (rows: BulkTaskRow[], onProgress: (done: number, total: number) => void) => {
    if (!token) return;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const payload = {
        task_name: row.task_name,
        total_amount: row.total_amount,
        paid_amount: 0,
        status: "Pending",
        work_done: false,
        payment_received: false,
        image_uris: row.image_uri ? [row.image_uri] : [],
        deadline_at: row.deadline_at,
        history: [{ date: new Date().toISOString(), note: "Task created via bulk entry" }],
      };
      const res = await fetch(`${API_BASE}/tasks`, { method: "POST", headers, body: JSON.stringify(payload) });
      if (res.ok) {
        const task: Task = migrateTask(await res.json());
        setTasks((prev) => [task, ...prev]);
      }
      onProgress(i + 1, rows.length);
      await new Promise((r) => setTimeout(r, 80));
    }
  }, [token, headers]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>, historyEntry?: HistoryEntry) => {
    if (!token) return;
    const current = tasksRef.current.find((t) => t.id === id);
    const history = historyEntry && current ? [...current.history, historyEntry] : current?.history;
    const payload = { ...updates, ...(history ? { history } : {}) };
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: "PUT", headers, body: JSON.stringify(payload) });
    if (res.ok) {
      const task: Task = migrateTask(await res.json());
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    }
  }, [token, headers]);

  const deleteTask = useCallback(async (id: string) => {
    if (!token) return;
    await fetch(`${API_BASE}/tasks/${id}`, { method: "DELETE", headers });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [token, headers]);

  const getTask = useCallback((id: string) => tasksRef.current.find((t) => t.id === id), []);

  return (
    <TasksContext.Provider value={{ tasks, loading, addTask, bulkAddTasks, updateTask, deleteTask, getTask, refresh: fetchFromAPI }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within TasksProvider");
  return ctx;
}
