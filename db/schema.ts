import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
export const requests = sqliteTable("requests", {
  id: text("id").primaryKey(), workspace: text("workspace").notNull(),
  idempotencyKey: text("idempotency_key").notNull(), brief: text("brief").notNull(),
  status: text("status").notNull(), version: integer("version").notNull().default(1),
  createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(), expiresAt: text("expires_at").notNull(),
}, t => [uniqueIndex("request_idempotency").on(t.workspace, t.idempotencyKey), index("workspace_created").on(t.workspace, t.createdAt)]);
export const events = sqliteTable("events", {
  id: text("id").primaryKey(), requestId: text("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
  status: text("status").notNull(), createdAt: text("created_at").notNull(),
}, t => [index("request_events").on(t.requestId, t.createdAt)]);
