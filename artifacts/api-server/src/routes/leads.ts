import { Router, type Response } from "express";
import { db } from "@workspace/db";
import { leadsTable, leadStatusEnum } from "@workspace/db/schema";
import { eq, ilike, or, and, sql, type SQL } from "drizzle-orm";
import { CreateLeadBody, UpdateLeadStatusBody } from "@workspace/api-zod";
import {
  sendLeadCreatedEvent,
  sendLeadQualifiedEvent,
  sendLeadClosedEvent,
} from "../services/facebook-capi";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.post(
  "/",
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = CreateLeadBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Validation error" });
      return;
    }

    const data = parsed.data;

    if (data.facebookLeadId) {
      const [existing] = await db
        .select({ id: leadsTable.id })
        .from(leadsTable)
        .where(eq(leadsTable.facebookLeadId, data.facebookLeadId))
        .limit(1);

      if (existing) {
        res.status(409).json({ error: "Lead with this facebook_lead_id already exists" });
        return;
      }
    }

    const [lead] = await db
      .insert(leadsTable)
      .values({
        facebookLeadId: data.facebookLeadId ?? null,
        fullName: data.fullName,
        phone: data.phone ?? null,
        email: data.email ?? null,
        source: data.source ?? null,
        campaignName: data.campaignName ?? null,
        adName: data.adName ?? null,
        status: "CREATED",
      })
      .returning();

    req.log.info({ leadId: lead?.id }, "Lead created");

    sendLeadCreatedEvent(lead?.phone, lead?.email, lead?.facebookLeadId).catch(() => {});

    res.status(201).json(lead);
  },
);

router.get(
  "/stats",
  requireAuth,
  requireAdmin,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const rows = await db
      .select({
        status: leadsTable.status,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(leadsTable)
      .groupBy(leadsTable.status);

    const stats = { total: 0, created: 0, qualified: 0, closed: 0, rejected: 0 };
    for (const row of rows) {
      const c = Number(row.count);
      stats.total += c;
      if (row.status === "CREATED") stats.created = c;
      else if (row.status === "QUALIFIED") stats.qualified = c;
      else if (row.status === "CLOSED") stats.closed = c;
      else if (row.status === "REJECTED") stats.rejected = c;
    }

    res.json(stats);
  },
);

router.get(
  "/",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const conditions: SQL[] = [];

    if (search) {
      conditions.push(
        or(
          ilike(leadsTable.fullName, `%${search}%`),
          ilike(leadsTable.email, `%${search}%`),
          ilike(leadsTable.phone, `%${search}%`),
        ) as SQL,
      );
    }

    if (status && ["CREATED", "QUALIFIED", "CLOSED", "REJECTED"].includes(status)) {
      conditions.push(
        eq(leadsTable.status, status as (typeof leadStatusEnum.enumValues)[number]),
      );
    }

    const leads = await db
      .select()
      .from(leadsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(leadsTable.createdAt);

    res.json({ leads, total: leads.length });
  },
);

router.patch(
  "/:id/status",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid lead id" });
      return;
    }

    const parsed = UpdateLeadStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Validation error" });
      return;
    }

    const { status } = parsed.data;

    const [lead] = await db
      .update(leadsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(leadsTable.id, id))
      .returning();

    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    req.log.info({ leadId: id, status }, "Lead status updated");

    if (status === "QUALIFIED") {
      sendLeadQualifiedEvent(lead.phone, lead.email, lead.facebookLeadId).catch(() => {});
    } else if (status === "CLOSED") {
      sendLeadClosedEvent(lead.phone, lead.email, lead.facebookLeadId).catch(() => {});
    }

    res.json(lead);
  },
);

export default router;
