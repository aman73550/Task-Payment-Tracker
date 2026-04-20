import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, signToken, requireAuth, type AuthedRequest } from "../lib/auth";
import type { Request, Response } from "express";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const { phone, password, name } = req.body as { phone?: string; password?: string; name?: string };

  if (!phone || !password || !name) {
    res.status(400).json({ error: "Phone, password and name are required" });
    return;
  }

  const clean = phone.replace(/\D/g, "");
  if (clean.length < 10) {
    res.status(400).json({ error: "Enter a valid phone number" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.phone, clean)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "This number is already registered" });
    return;
  }

  const password_hash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({ phone: clean, password_hash, name }).returning();

  const token = signToken(user.id);
  res.status(201).json({ token, user: { id: user.id, phone: user.phone, name: user.name } });
});

router.post("/login", async (req: Request, res: Response) => {
  const { phone, password } = req.body as { phone?: string; password?: string };

  if (!phone || !password) {
    res.status(400).json({ error: "Phone and password are required" });
    return;
  }

  const clean = phone.replace(/\D/g, "");
  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, clean)).limit(1);

  if (!user) {
    res.status(401).json({ error: "Wrong password, let's try that again." });
    return;
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    res.status(401).json({ error: "Wrong password, let's try that again." });
    return;
  }

  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, phone: user.phone, name: user.name } });
});

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, phone: user.phone, name: user.name });
});

export default router;
