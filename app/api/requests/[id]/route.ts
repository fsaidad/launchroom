import { NextRequest } from "next/server";
import { canTransition, statuses, type Status } from "@/lib/domain";
import { database, record, reply, sameOrigin, workspace, type Row } from "@/lib/server";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, context: Context) {
  const session = workspace(req); const { id } = await context.params;
  try {
    const row = await database().prepare("SELECT * FROM requests WHERE id=? AND workspace=? AND expires_at>?").bind(id, session, new Date().toISOString()).first<Row>();
    if (!row) return reply(req, session, { error: "not_found" }, 404);
    const history = await database().prepare("SELECT id,status,created_at AS createdAt FROM events WHERE request_id=? ORDER BY created_at,rowid").bind(id).all();
    return reply(req, session, { request: record(row), events: history.results });
  } catch { return reply(req, session, { error: "unavailable" }, 503); }
}
export async function PATCH(req: NextRequest, context: Context) {
  const session = workspace(req); const { id } = await context.params;
  if (!sameOrigin(req)) return reply(req, session, { error: "origin" }, 403);
  let body;
  try { const text = await req.text(); if (text.length > 2000) return reply(req, session, { error: "too_large" }, 413); body = JSON.parse(text); } catch { return reply(req, session, { error: "invalid_json" }, 400); }
  if (!body || typeof body !== "object" || !statuses.includes(body.status) || !Number.isInteger(body.version)) return reply(req, session, { error: "validation" }, 422);
  try {
    const db = database(); const now = new Date().toISOString();
    const row = await db.prepare("SELECT * FROM requests WHERE id=? AND workspace=? AND expires_at>?").bind(id, session, now).first<Row>();
    if (!row) return reply(req, session, { error: "not_found" }, 404);
    if (row.version !== body.version) return reply(req, session, { error: "conflict" }, 409);
    if (!canTransition(row.status, body.status as Status)) return reply(req, session, { error: "transition" }, 422);
    const result = await db.batch([
      db.prepare("UPDATE requests SET status=?,version=version+1,updated_at=? WHERE id=? AND workspace=? AND version=?").bind(body.status, now, id, session, body.version),
      db.prepare("INSERT INTO events (id,request_id,status,created_at) SELECT ?,?,?,? WHERE changes()=1").bind(crypto.randomUUID(), id, body.status, now),
    ]);
    if (!result[0].meta.changes) return reply(req, session, { error: "conflict" }, 409);
    const updated = await db.prepare("SELECT * FROM requests WHERE id=? AND workspace=?").bind(id, session).first<Row>();
    return reply(req, session, { request: record(updated!) });
  } catch { return reply(req, session, { error: "unavailable" }, 503); }
}
