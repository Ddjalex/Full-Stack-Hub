import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadStatusEnum = pgEnum("lead_status", [
  "CREATED",
  "QUALIFIED",
  "CLOSED",
  "REJECTED",
]);

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  facebookLeadId: text("facebook_lead_id").unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  source: text("source"),
  campaignName: text("campaign_name"),
  adName: text("ad_name"),
  status: leadStatusEnum("status").notNull().default("CREATED"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

export const selectLeadSchema = createSelectSchema(leadsTable);

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
