import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { makeCode, type RequestRecord } from "./domain";
export type Row = { id: string; brief: string; status: RequestRecord["status"]; version: number; created_at: string; updated_at: string; expires_at: string };
export function database() { if (!env.DB) throw new Error("Database unavailable"); return env.DB; }
export function workspace(req: NextRequest) {
  const existing = req.cookies.get("lr_workspace")?.value;
  return existing && /^[a-f0-9-]{36}$/.test(existing) ? existing : crypto.randomUUID();
}
export function reply(req: NextRequest, session: string, data: unknown, status = 200) {
  const response = NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  response.cookies.set("lr_workspace", session, { httpOnly: true, secure: new URL(req.url).protocol === "https:", sameSite: "strict", path: "/", maxAge: 86400 });
  return response;
}
export function sameOrigin(req: NextRequest) { const origin = req.headers.get("origin"); return !origin || origin === new URL(req.url).origin; }
export function record(row: Row): RequestRecord { return { ...JSON.parse(row.brief), id: row.id, code: makeCode(row.id), status: row.status, version: row.version, createdAt: row.created_at, updatedAt: row.updated_at, expiresAt: row.expires_at }; }
