import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

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
}

const TasksContext = createContext<TasksContextType | null>(null);

const STORAGE_KEY = "@tasks_v2";

function migrateTask(raw: any): Task {
  const imageUris: string[] = raw.image_uris
    ? raw.image_uris
    : raw.image_uri
    ? [raw.image_uri]
    : [];
  return {
    id: raw.id,
    task_name: raw.task_name,
    total_amount: raw.total_amount,
    paid_amount: raw.paid_amount ?? 0,
    status: raw.status ?? "Pending",
    work_done: raw.work_done ?? raw.status === "Completed",
    payment_received: raw.payment_received ?? raw.status === "Completed",
    image_uris: imageUris,
    notes: raw.notes,
    deadline_at: raw.deadline_at,
    history: raw.history ?? [],
    created_at: raw.created_at,
  };
}

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

async function persist(list: Task[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const tasksRef = useRef<Task[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: any[] = JSON.parse(stored);
          setTasks(parsed.map(migrateTask));
        } else {
          const legacy = await AsyncStorage.getItem("@tasks_v1");
          if (legacy) {
            const parsed: any[] = JSON.parse(legacy);
            setTasks(parsed.map(migrateTask));
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const addTask = useCallback(async (payload: Omit<Task, "id" | "created_at" | "history">) => {
    const newTask: Task = {
      ...payload,
      id: genId(),
      created_at: new Date().toISOString(),
      history: [{ date: new Date().toISOString(), note: "Task created" }],
    };
    setTasks((prev) => {
      const next = [newTask, ...prev];
      persist(next);
      return next;
    });
  }, []);

  const bulkAddTasks = useCallback(async (
    rows: BulkTaskRow[],
    onProgress: (done: number, total: number) => void
  ) => {
    const newTasks: Task[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      newTasks.push({
        id: genId(),
        task_name: row.task_name,
        total_amount: row.total_amount,
        paid_amount: 0,
        status: "Pending",
        work_done: false,
        payment_received: false,
        image_uris: row.image_uri ? [row.image_uri] : [],
        deadline_at: row.deadline_at,
        history: [{ date: new Date().toISOString(), note: "Task created via bulk entry" }],
        created_at: new Date().toISOString(),
      });
      onProgress(i + 1, rows.length);
      await new Promise((r) => setTimeout(r, 120));
    }
    setTasks((prev) => {
      const next = [...newTasks, ...prev];
      persist(next);
      return next;
    });
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>, historyEntry?: HistoryEntry) => {
    setTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== id) return t;
        const history = historyEntry ? [...t.history, historyEntry] : t.history;
        return { ...t, ...updates, history };
      });
      persist(next);
      return next;
    });
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const getTask = useCallback((id: string) => tasksRef.current.find((t) => t.id === id), []);

  return (
    <TasksContext.Provider value={{ tasks, loading, addTask, bulkAddTasks, updateTask, deleteTask, getTask }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within TasksProvider");
  return ctx;
}
