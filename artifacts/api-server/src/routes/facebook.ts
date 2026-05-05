import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { leadsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { broadcastLeadEvent } from "../lib/ws";

const router = Router();

const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

async function fetchLeadDetails(leadgenId: string): Promise<{
  fullName: string;
  phone?: string;
  email?: string;
} | null> {
  if (!PAGE_ACCESS_TOKEN) {
    logger.warn("FACEBOOK_PAGE_ACCESS_TOKEN not set — cannot fetch lead details");
    return null;
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${PAGE_ACCESS_TOKEN}`;
    const res = await fetch(url);
    const data = (await res.json()) as {
      field_data?: Array<{ name: string; values: string[] }>;
      error?: { message: string };
    };

    if (!res.ok || data.error) {
      logger.error({ leadgenId, error: data.error }, "Failed to fetch lead from Graph API");
      return null;
    }

    const fields: Record<string, string> = {};
    for (const field of data.field_data ?? []) {
      fields[field.name.toLowerCase()] = field.values[0] ?? "";
    }

    const fullName =
      fields["full_name"] ??
      [fields["first_name"], fields["last_name"]].filter(Boolean).join(" ") ??
      "Unknown";

    return {
      fullName: fullName || "Unknown",
      phone: fields["phone_number"] ?? fields["phone"] ?? undefined,
      email: fields["email"] ?? undefined,
    };
  } catch (err) {
    logger.error({ err, leadgenId }, "Error fetching lead from Graph API");
    return null;
  }
}

router.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    logger.info("Facebook webhook verified successfully");
    res.status(200).send(challenge);
    return;
  }

  logger.warn({ mode, token }, "Facebook webhook verification failed");
  res.status(403).json({ error: "Verification failed" });
});

router.post("/webhook", async (req: Request, res: Response): Promise<void> => {
  const body = req.body as {
    object?: string;
    entry?: Array<{
      id?: string;
      changes?: Array<{
        field?: string;
        value?: {
          leadgen_id?: string;
          page_id?: string;
          form_id?: string;
          ad_id?: string;
          campaign_id?: string;
          adgroup_id?: string;
          created_time?: number;
        };
      }>;
    }>;
  };

  if (body.object !== "page") {
    res.status(200).json({ status: "ignored" });
    return;
  }

  res.status(200).json({ status: "ok" });

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") continue;

      const value = change.value;
      if (!value?.leadgen_id) continue;

      const leadgenId = value.leadgen_id;

      const [existing] = await db
        .select({ id: leadsTable.id })
        .from(leadsTable)
        .where(eq(leadsTable.facebookLeadId, leadgenId))
        .limit(1);

      if (existing) {
        logger.info({ leadgenId }, "Lead already exists, skipping");
        continue;
      }

      const details = await fetchLeadDetails(leadgenId);

      const [lead] = await db
        .insert(leadsTable)
        .values({
          facebookLeadId: leadgenId,
          fullName: details?.fullName ?? "Unknown",
          phone: details?.phone ?? null,
          email: details?.email ?? null,
          source: "facebook",
          campaignName: value.campaign_id ?? null,
          adName: value.ad_id ?? null,
          status: "CREATED",
        })
        .returning();

      logger.info({ leadId: lead?.id, leadgenId }, "Lead created from Facebook webhook");

      if (lead) {
        broadcastLeadEvent({
          type: "new_lead",
          lead: {
            id: lead.id,
            fullName: lead.fullName,
            email: lead.email ?? null,
            phone: lead.phone ?? null,
            status: lead.status,
            source: lead.source ?? null,
            createdAt: lead.createdAt instanceof Date
              ? lead.createdAt.toISOString()
              : String(lead.createdAt),
          },
        });
      }
    }
  }
});

export default router;
