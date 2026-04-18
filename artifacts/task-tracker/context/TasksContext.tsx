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
  change?: string;
}

export interface Task {
  id: string;
  task_name: string;
  total_amount: number;
  paid_amount: number;
  status: TaskStatus;
  image_uri?: string;
  notes?: string;
  history: HistoryEntry[];
  created_at: string;
}

interface TasksContextType {
  tasks: Task[];
  loading: boolean;
  addTask: (task: Omit<Task, "id" | "created_at" | "history">) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>, historyNote?: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTask: (id: string) => Task | undefined;
}

const TasksContext = createContext<TasksContextType | null>(null);

const STORAGE_KEY = "@tasks_v1";

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTasks(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load tasks", e);
    } finally {
      setLoading(false);
    }
  };

  const saveTasks = async (updated: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save tasks", e);
    }
  };

  const addTask = useCallback(
    async (task: Omit<Task, "id" | "created_at" | "history">) => {
      const newTask: Task = {
        ...task,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        history: [
          {
            date: new Date().toISOString(),
            note: "Task created",
          },
        ],
      };
      const updated = [newTask, ...tasks];
      setTasks(updated);
      await saveTasks(updated);
    },
    [tasks]
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>, historyNote?: string) => {
      const updated = tasks.map((t) => {
        if (t.id !== id) return t;
        const history = historyNote
          ? [
              ...t.history,
              {
                date: new Date().toISOString(),
                note: historyNote,
              },
            ]
          : t.history;
        return { ...t, ...updates, history };
      });
      setTasks(updated);
      await saveTasks(updated);
    },
    [tasks]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const updated = tasks.filter((t) => t.id !== id);
      setTasks(updated);
      await saveTasks(updated);
    },
    [tasks]
  );

  const getTask = useCallback(
    (id: string) => tasks.find((t) => t.id === id),
    [tasks]
  );

  return (
    <TasksContext.Provider
      value={{ tasks, loading, addTask, updateTask, deleteTask, getTask }}
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
