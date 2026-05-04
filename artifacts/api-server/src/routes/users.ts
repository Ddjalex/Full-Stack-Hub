import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq, ilike, or, and, sql } from "drizzle-orm";
import { UpdateUserBody } from "@workspace/api-zod";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

const safeUserFields = {
  id: usersTable.id,
  fullName: usersTable.fullName,
  email: usersTable.email,
  role: usersTable.role,
  createdAt: usersTable.createdAt,
};

router.get("/", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const { search, role } = req.query as { search?: string; role?: string };

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(usersTable.fullName, `%${search}%`),
        ilike(usersTable.email, `%${search}%`),
      ),
    );
  }
  if (role === "user" || role === "admin") {
    conditions.push(eq(usersTable.role, role));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const users = await db
    .select(safeUserFields)
    .from(usersTable)
    .where(where)
    .orderBy(usersTable.createdAt);

  res.json({ users, total: users.length });
});

router.get("/stats", requireAuth, requireAdmin, async (_req, res) => {
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      admins: sql<number>`count(*) filter (where role = 'admin')::int`,
      regularUsers: sql<number>`count(*) filter (where role = 'user')::int`,
      newThisMonth: sql<number>`count(*) filter (where created_at >= date_trunc('month', now()))::int`,
    })
    .from(usersTable);

  res.json(totals ?? { total: 0, admins: 0, regularUsers: 0, newThisMonth: 0 });
});

router.get("/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const [user] = await db
    .select(safeUserFields)
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

router.patch("/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const updates: Partial<{ role: "user" | "admin"; fullName: string }> = {};
  if (parsed.data.role) updates.role = parsed.data.role;
  if (parsed.data.fullName) updates.fullName = parsed.data.fullName;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning(safeUserFields);

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(updated);
});

router.delete("/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const [deleted] = await db
    .delete(usersTable)
    .where(eq(usersTable.id, id))
    .returning({ id: usersTable.id });

  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ message: "User deleted successfully" });
});

export default router;
