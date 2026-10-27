import { NextRequest } from "next/server";
import { validateBrief } from "@/lib/domain";
import { database, record, reply, sameOrigin, workspace, type Row } from "@/lib/server";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const session = workspace(req);
  try {
    const { results } = await database().prepare("SELECT * FROM requests WHERE workspace=? AND expires_at>? ORDER BY created_at DESC LIMIT 20").bind(session, new Date().toISOString()).all<Row>();
    return reply(req, session, { requests: results.map(record) });
  } catch { return reply(req, session, { error: "unavailable" }, 503); }
}
export async function POST(req: NextRequest) {
  const session = workspace(req);
  if (!sameOrigin(req)) return reply(req, session, { error: "origin" }, 403);
  if (Number(req.headers.get("content-length")) > 12000) return reply(req, session, { error: "too_large" }, 413);
  let body;
  try { const text = await req.text(); if (text.length > 12000) return reply(req, session, { error: "too_large" }, 413); body = JSON.parse(text); } catch { return reply(req, session, { error: "invalid_json" }, 400); }
  const validation = validateBrief(body);
  if (!validation.data) return reply(req, session, { error: "validation", fields: validation.errors }, 422);
  const key = body.idempotencyKey;
  if (typeof key !== "string" || !/^[a-f0-9-]{36}$/.test(key)) return reply(req, session, { error: "idempotency" }, 422);
  try {
    const db = database();
    const previous = await db.prepare("SELECT * FROM requests WHERE workspace=? AND idempotency_key=? AND expires_at>?").bind(session, key, new Date().toISOString()).first<Row>();
    if (previous) return reply(req, session, { request: record(previous), replayed: true });
    const count = await db.prepare("SELECT COUNT(*) AS count FROM requests WHERE workspace=? AND expires_at>?").bind(session, new Date().toISOString()).first<{ count: number }>();
    if ((count?.count ?? 0) >= 20) return reply(req, session, { error: "limit" }, 429);
    const id = crypto.randomUUID(); const now = new Date().toISOString(); const expires = new Date(Date.now() + 86400000).toISOString();
    await db.batch([
      db.prepare("DELETE FROM requests WHERE expires_at<=?").bind(now),
      db.prepare("INSERT OR IGNORE INTO requests (id,workspace,idempotency_key,brief,status,version,created_at,updated_at,expires_at) SELECT ?,?,?,?,?,1,?,?,? WHERE (SELECT COUNT(*) FROM requests WHERE workspace=? AND expires_at>?) < 20").bind(id, session, key, JSON.stringify(validation.data), "received", now, now, expires, session, now),
      db.prepare("INSERT INTO events (id,request_id,status,created_at) SELECT ?,id,'received',? FROM requests WHERE id=?").bind(crypto.randomUUID(), now, id),
    ]);
    const saved = await db.prepare("SELECT * FROM requests WHERE workspace=? AND idempotency_key=?").bind(session, key).first<Row>();
    if (!saved) return reply(req, session, { error: "limit" }, 429);
    return reply(req, session, { request: record(saved), replayed: saved.id !== id }, saved.id === id ? 201 : 200);
  } catch { return reply(req, session, { error: "unavailable" }, 503); }
}
