import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export type TransactionType = "Initial" | "Add" | "Reduce";

export interface TransactionEntry {
  type: TransactionType;
  amount: number;
  note: string;
  date: string;
}

export const udhaarTable = pgTable("udhaar", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  person_name: text("person_name").notNull(),
  amount: integer("amount").notNull().default(0),
  type: text("type").notNull(),
  status: text("status").notNull().default("Active"),
  due_date: text("due_date"),
  history: jsonb("history").$type<TransactionEntry[]>().notNull().default([]),
  settled_amount: integer("settled_amount").notNull().default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type Udhaar = typeof udhaarTable.$inferSelect;
export type InsertUdhaar = typeof udhaarTable.$inferInsert;
