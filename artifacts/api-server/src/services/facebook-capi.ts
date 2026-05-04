import { createHash } from "crypto";
import { logger } from "../lib/logger";

const PIXEL_ID = process.env.FACEBOOK_PIXEL_ID;
const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.FACEBOOK_TEST_EVENT_CODE;

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function buildUserData(phone?: string | null, email?: string | null) {
  const userData: Record<string, string[]> = {};
  if (email) userData["em"] = [sha256(email)];
  if (phone) userData["ph"] = [sha256(phone.replace(/\D/g, ""))];
  return userData;
}

interface SendEventOptions {
  eventName: string;
  phone?: string | null;
  email?: string | null;
  leadId?: string | null;
  customData?: Record<string, unknown>;
}

export async function sendCapiEvent(opts: SendEventOptions): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    logger.warn(
      "Facebook CAPI skipped: FACEBOOK_PIXEL_ID or FACEBOOK_ACCESS_TOKEN not set",
    );
    return;
  }

  const eventPayload: Record<string, unknown> = {
    event_name: opts.eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: "system_generated",
    user_data: buildUserData(opts.phone, opts.email),
  };

  if (opts.leadId) {
    eventPayload["lead_id"] = opts.leadId;
  }

  if (opts.customData && Object.keys(opts.customData).length > 0) {
    eventPayload["custom_data"] = opts.customData;
  }

  const body: Record<string, unknown> = {
    data: [eventPayload],
  };

  if (TEST_EVENT_CODE) {
    body["test_event_code"] = TEST_EVENT_CODE;
  }

  const url = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as Record<string, unknown>;

    if (!res.ok) {
      logger.error(
        { status: res.status, response: json },
        `Facebook CAPI error sending ${opts.eventName}`,
      );
      return;
    }

    logger.info(
      { eventName: opts.eventName, response: json },
      "Facebook CAPI event sent successfully",
    );
  } catch (err) {
    logger.error({ err }, `Facebook CAPI fetch failed for ${opts.eventName}`);
  }
}

export async function sendLeadCreatedEvent(
  phone?: string | null,
  email?: string | null,
  leadId?: string | null,
) {
  return sendCapiEvent({
    eventName: "Lead",
    phone,
    email,
    leadId,
  });
}

export async function sendLeadQualifiedEvent(
  phone?: string | null,
  email?: string | null,
  leadId?: string | null,
) {
  return sendCapiEvent({
    eventName: "CompleteRegistration",
    phone,
    email,
    leadId,
    customData: { status: "QUALIFIED" },
  });
}

export async function sendLeadClosedEvent(
  phone?: string | null,
  email?: string | null,
  leadId?: string | null,
) {
  return sendCapiEvent({
    eventName: "Purchase",
    phone,
    email,
    leadId,
    customData: { status: "CLOSED" },
  });
}
