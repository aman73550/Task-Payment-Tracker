import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  history: HistoryEntry[];
  created_at: string;
}

export interface BulkTaskRow {
  task_name: string;
  total_amount: number;
  image_uri?: string;
}

interface TasksContextType {
  tasks: Task[];
  loading: boolean;
  addTask: (payload: Omit<Task, "id" | "created_at" | "history">) => Promise<void>;
  bulkAddTasks: (
    rows: BulkTaskRow[],
    onProgress: (done: number, total: number) => void
  ) => Promise<void>;
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
    history: raw.history ?? [],
    created_at: raw.created_at,
  };
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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

  const persistTasks = async (taskList: Task[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(taskList));
  };

  const generateId = () =>
    Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const addTask = useCallback(
    async (payload: Omit<Task, "id" | "created_at" | "history">) => {
      const newTask: Task = {
        ...payload,
        id: generateId(),
        created_at: new Date().toISOString(),
        history: [{ date: new Date().toISOString(), note: "Task created" }],
      };
      const updated = [newTask, ...tasks];
      setTasks(updated);
      await persistTasks(updated);
    },
    [tasks]
  );

  const bulkAddTasks = useCallback(
    async (
      rows: BulkTaskRow[],
      onProgress: (done: number, total: number) => void
    ) => {
      const newTasks: Task[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const taskEntry: Task = {
          id: generateId(),
          task_name: row.task_name,
          total_amount: row.total_amount,
          paid_amount: 0,
          status: "Pending",
          work_done: false,
          payment_received: false,
          image_uris: row.image_uri ? [row.image_uri] : [],
          history: [{ date: new Date().toISOString(), note: "Task created via bulk entry" }],
          created_at: new Date().toISOString(),
        };
        newTasks.push(taskEntry);
        onProgress(i + 1, rows.length);
        await new Promise((r) => setTimeout(r, 120));
      }
      const updated = [...newTasks, ...tasks];
      setTasks(updated);
      await persistTasks(updated);
    },
    [tasks]
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>, historyEntry?: HistoryEntry) => {
      const updated = tasks.map((t) => {
        if (t.id !== id) return t;
        const history = historyEntry
          ? [...t.history, historyEntry]
          : t.history;
        return { ...t, ...updates, history };
      });
      setTasks(updated);
      await persistTasks(updated);
    },
    [tasks]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const updated = tasks.filter((t) => t.id !== id);
      setTasks(updated);
      await persistTasks(updated);
    },
    [tasks]
  );

  const getTask = useCallback(
    (id: string) => tasks.find((t) => t.id === id),
    [tasks]
  );

  return (
    <TasksContext.Provider
      value={{ tasks, loading, addTask, bulkAddTasks, updateTask, deleteTask, getTask }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within TasksProvider");
  return ctx;
}
