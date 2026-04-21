import { Router } from "express";
import { db, tasksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import type { Request, Response } from "express";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: Request, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.user_id, userId));
  res.json(tasks);
});

router.post("/", async (req: Request, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const body = req.body as {
    task_name: string;
    person_name?: string;
    phone?: string;
    total_amount: number;
    paid_amount?: number;
    status?: string;
    work_done?: boolean;
    payment_received?: boolean;
    image_uris?: string[];
    notes?: string;
    deadline_at?: string;
    history?: any[];
  };

  if (!body.task_name) {
    res.status(400).json({ error: "task_name is required" });
    return;
  }

  const [task] = await db.insert(tasksTable).values({
    user_id: userId,
    task_name: body.task_name,
    person_name: body.person_name,
    phone: body.phone,
    total_amount: body.total_amount ?? 0,
    paid_amount: body.paid_amount ?? 0,
    status: body.status ?? "Pending",
    work_done: body.work_done ?? false,
    payment_received: body.payment_received ?? false,
    image_uris: body.image_uris ?? [],
    notes: body.notes,
    deadline_at: body.deadline_at,
    history: body.history ?? [{ date: new Date().toISOString(), note: "Task created" }],
  }).returning();

  res.status(201).json(task);
});

router.put("/:id", async (req: Request, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = req.params;
  const body = req.body as Record<string, any>;

  const allowed = ["task_name","total_amount","paid_amount","status","work_done","payment_received","image_uris","notes","deadline_at","history"];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [task] = await db.update(tasksTable)
    .set(updates)
    .where(and(eq(tasksTable.id, id), eq(tasksTable.user_id, userId)))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(task);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = req.params;
  await db.delete(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.user_id, userId)));
  res.json({ ok: true });
});

export default router;
