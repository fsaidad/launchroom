import { test } from "node:test";
import assert from "node:assert/strict";
import { validateBrief, canTransition, makeCode } from "../lib/domain.ts";
const sample = { title: "  Atlas comparison page  ", market: "DE", language: "en", pageType: "comparison", budget: "medium", deadline: "2026-10-30", objective: "Explain three fictional partner offers in a clear comparison layout.", acceptance: "Three cards, working filters, mobile layout and clear empty state." };
test("a valid brief is normalized without changing the original", () => {
  const result = validateBrief(sample, "2026-10-27"); assert.equal(result.data?.title, "Atlas comparison page"); assert.equal(sample.title, "  Atlas comparison page  "); assert.deepEqual(result.errors, {});
});
test("missing and forged values return field errors", () => {
  const invalid = validateBrief({ ...sample, title: " ", market: "ANY", language: 7, pageType: "unknown", budget: "free", objective: "short", acceptance: "" }, "2026-10-27");
  for (const field of ["title", "market", "language", "pageType", "budget", "objective", "acceptance"]) assert.ok(invalid.errors[field as keyof typeof invalid.errors]); assert.equal(invalid.data, undefined);
});
test("past and impossible dates are rejected", () => {
  for (const date of ["2026-10-26", "2026-02-30", "2026-13-01", "tomorrow"]) assert.ok(validateBrief({ ...sample, deadline: date }, "2026-10-27").errors.deadline);
  assert.ok(validateBrief({ ...sample, deadline: "2026-10-27" }, "2026-10-27").data);
});
test("the lifecycle is explicit and delivered/cancelled are terminal", () => {
  assert.equal(canTransition("received", "scoped"), true); assert.equal(canTransition("received", "delivered"), false); assert.equal(canTransition("in_progress", "delivered"), true); assert.equal(canTransition("delivered", "received"), false); assert.equal(canTransition("cancelled", "in_progress"), false);
});
test("null inputs and length limits cannot bypass validation", () => {
  assert.equal(validateBrief(null, "2026-10-27").data, undefined); assert.ok(validateBrief({ ...sample, title: "a".repeat(81), objective: "a".repeat(1201), acceptance: "b".repeat(601) }, "2026-10-27").errors.title);
});
test("request references are deterministic", () => { assert.equal(makeCode("d231b1d5-abcdef"), "LR-D231B1D5"); });
