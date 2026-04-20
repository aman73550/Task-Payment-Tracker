import { Router } from "express";
import { db, udhaarTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import type { Request, Response } from "express";
import type { TransactionEntry } from "@workspace/db";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: Request, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const entries = await db.select().from(udhaarTable).where(eq(udhaarTable.user_id, userId));
  res.json(entries);
});

router.post("/", async (req: Request, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const body = req.body as { person_name: string; amount: number; type: string; due_date?: string; note?: string };

  if (!body.person_name || !body.amount || !body.type) {
    res.status(400).json({ error: "person_name, amount and type are required" });
    return;
  }

  const initialEntry: TransactionEntry = {
    type: "Initial",
    amount: body.amount,
    note: body.note ?? "Initial entry",
    date: new Date().toISOString(),
  };

  const [entry] = await db.insert(udhaarTable).values({
    user_id: userId,
    person_name: body.person_name,
    amount: body.amount,
    type: body.type,
    status: "Active",
    due_date: body.due_date,
    history: [initialEntry],
    settled_amount: 0,
  }).returning();

  res.status(201).json(entry);
});

router.post("/:id/transaction", async (req: Request, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = req.params;
  const body = req.body as { type: "Add" | "Reduce"; amount: number; note: string };

  if (!body.type || !body.amount || !body.note) {
    res.status(400).json({ error: "type, amount and note are required" });
    return;
  }

  const [existing] = await db.select().from(udhaarTable)
    .where(and(eq(udhaarTable.id, id), eq(udhaarTable.user_id, userId)));

  if (!existing) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  const newEntry: TransactionEntry = {
    type: body.type,
    amount: body.amount,
    note: body.note,
    date: new Date().toISOString(),
  };

  const newHistory = [...(existing.history as TransactionEntry[]), newEntry];
  const newAmount = body.type === "Add" ? existing.amount + body.amount : existing.amount;
  const newSettled = body.type === "Reduce" ? existing.settled_amount + body.amount : existing.settled_amount;
  const balance = newAmount - newSettled;
  const newStatus = balance <= 0 ? "Settled" : "Active";

  const [updated] = await db.update(udhaarTable).set({
    history: newHistory,
    amount: newAmount,
    settled_amount: newSettled,
    status: newStatus,
  }).where(eq(udhaarTable.id, id)).returning();

  res.json(updated);
});

router.put("/:id", async (req: Request, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = req.params;
  const body = req.body as Record<string, any>;

  const allowed = ["person_name","due_date","status"];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const [entry] = await db.update(udhaarTable).set(updates)
    .where(and(eq(udhaarTable.id, id), eq(udhaarTable.user_id, userId)))
    .returning();

  if (!entry) { res.status(404).json({ error: "Not found" }); return; }
  res.json(entry);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = req.params;
  await db.delete(udhaarTable).where(and(eq(udhaarTable.id, id), eq(udhaarTable.user_id, userId)));
  res.json({ ok: true });
});

export default router;
