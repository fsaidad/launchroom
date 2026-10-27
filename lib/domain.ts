export const markets = ["DE", "BR", "IN", "GB"] as const;
export const languages = ["en", "de", "pt-BR", "hi"] as const;
export const pageTypes = ["comparison", "landing", "editorial"] as const;
export const budgets = ["small", "medium", "large"] as const;
export const statuses = ["received", "scoped", "in_progress", "delivered", "cancelled"] as const;
export type Status = typeof statuses[number];
export type Brief = { title: string; market: string; language: string; pageType: string; budget: string; deadline: string; objective: string; acceptance: string };
export type RequestRecord = Brief & { id: string; code: string; status: Status; version: number; createdAt: string; updatedAt: string; expiresAt: string };
export type EventRecord = { id: string; status: Status; createdAt: string };
export type FieldErrors = Partial<Record<keyof Brief, string>>;
export const transitions: Record<Status, readonly Status[]> = {
  received: ["scoped", "cancelled"], scoped: ["in_progress", "cancelled"],
  in_progress: ["delivered", "cancelled"], delivered: [], cancelled: [],
};
export function canTransition(from: Status, to: Status) { return transitions[from]?.includes(to) ?? false; }
export function validateBrief(input: unknown, today = new Date().toISOString().slice(0, 10)): { data?: Brief; errors: FieldErrors } {
  const raw = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const read = (key: keyof Brief) => typeof raw[key] === "string" ? (raw[key] as string).trim() : "";
  const data: Brief = { title: read("title"), market: read("market"), language: read("language"), pageType: read("pageType"), budget: read("budget"), deadline: read("deadline"), objective: read("objective"), acceptance: read("acceptance") };
  const errors: FieldErrors = {};
  if (data.title.length < 4 || data.title.length > 80) errors.title = "title";
  if (!(markets as readonly string[]).includes(data.market)) errors.market = "market";
  if (!(languages as readonly string[]).includes(data.language)) errors.language = "language";
  if (!(pageTypes as readonly string[]).includes(data.pageType)) errors.pageType = "pageType";
  if (!(budgets as readonly string[]).includes(data.budget)) errors.budget = "budget";
  const parsed = new Date(`${data.deadline}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.deadline) || Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== data.deadline || data.deadline < today) errors.deadline = "deadline";
  if (data.objective.length < 30 || data.objective.length > 1200) errors.objective = "objective";
  if (data.acceptance.length < 15 || data.acceptance.length > 600) errors.acceptance = "acceptance";
  return Object.keys(errors).length ? { errors } : { data, errors };
}
export function makeCode(id: string) { return `LR-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`; }
