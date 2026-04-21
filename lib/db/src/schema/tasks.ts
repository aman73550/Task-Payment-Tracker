import { boolean, jsonb, pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export interface HistoryEntry {
  date: string;
  note: string;
  images?: string[];
  link?: string;
}

export const tasksTable = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  task_name: text("task_name").notNull(),
  person_name: text("person_name"),
  phone: text("phone"),
  total_amount: integer("total_amount").notNull().default(0),
  paid_amount: integer("paid_amount").notNull().default(0),
  status: text("status").notNull().default("Pending"),
  work_done: boolean("work_done").notNull().default(false),
  payment_received: boolean("payment_received").notNull().default(false),
  image_uris: jsonb("image_uris").$type<string[]>().notNull().default([]),
  notes: text("notes"),
  deadline_at: text("deadline_at"),
  history: jsonb("history").$type<HistoryEntry[]>().notNull().default([]),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type Task = typeof tasksTable.$inferSelect;
export type InsertTask = typeof tasksTable.$inferInsert;
