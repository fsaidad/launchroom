# Launchroom / independent portfolio case

Launchroom demonstrates a complete campaign-production handoff: a visitor writes a brief, the server validates and saves it, and a simulated team moves the request through scoping, production and delivery.

This is an independent project made with AI assistance, not an NDA client engagement. All examples are fictional. No revenue, conversion or client time-saving claims are made.

## Business problem

A campaign request often arrives across several chat messages: target market, language, deadline and acceptance criteria are scattered. The team cannot estimate the work until somebody reconstructs the brief.

## Implemented solution

- One structured brief with bounded text fields, market/language/page-type selectors, an indicative budget and target date.
- A live handoff preview and a sample brief, so the visitor can understand the task without writing their own data.
- Server-side validation and durable SQLite/D1 storage.
- A browser-specific demo workspace carried in an HttpOnly, SameSite=Strict cookie. Requests in another workspace are not accessible by ID.
- Explicit lifecycle: received → scoped → in progress → delivered; cancellation is allowed before delivery.
- Idempotency keys for retry and duplicate submission protection.
- Optimistic version checks to prevent one browser tab from overwriting another tab's update.
- Event history, queue filters and copyable handoff text.
- English/Russian interface, keyboard focus handling and responsive CSS.

## What the evidence establishes

Six domain tests verify normalization, required fields, enum/date/length validation, allowed transitions and request references.

Twenty-one local API checks verify persistence, malformed inputs, workspace isolation, duplicate and simultaneous submissions, stale versions, simultaneous status updates, lifecycle order, terminal states and the 20-request workspace quota under concurrency.

Browser checks cover empty-form errors, sample submission, confirmation, queue, full lifecycle, reload persistence, language switching and modal interaction. Automated checks do not establish a commercial business outcome or replace a full accessibility/security audit.

## Boundaries

The team role is simulated inside one anonymous workspace. This is not a multi-user project-management product. Records become inaccessible after 24 hours; expired rows are removed on later request creation. The workspace quota is a demo guard, not abuse protection against an adversary creating fresh cookies.

No payments, wagering, real offers, external email, CRM delivery, analytics or advertising integrations are implemented. Budget ranges are illustrative, not accepted quotes. Commercial deployment would need authentication, team permissions, scheduled retention cleanup, production abuse controls, monitoring and an agreed data policy.

## Suggested paid first stage

A comparable client engagement can start with one agreed workflow: form fields, validation rules, one destination or queue, explicit acceptance checks and a short handover. Integration with the client's actual CRM is a separate scoped stage.
