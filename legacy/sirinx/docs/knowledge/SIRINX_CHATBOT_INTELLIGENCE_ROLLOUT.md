# SIRINX Chatbot Intelligence Rollout

Status: local implementation packet, not deployed.

Date: 2026-05-16

## Goal

Upgrade the public `www.sirinx.co` chatbot from keyword fallback behavior into a governed solar lead assistant that can qualify prospects, explain SIRINX solutions, and avoid unsupported financial claims.

## Scope

Allowed surfaces:

- `shared/chatbotIntelligence.ts`
- `server/_core/chatbotFallback.ts`
- `server/routers.ts`
- `client/src/components/FloatingChatWidget.tsx`
- chatbot tests and this documentation

Out of scope without separate approval:

- Cloudflare deploy
- DNS changes
- Supabase writes
- LINE, Telegram, or CRM credential setup
- production data access
- `.env` or secret inspection
- package truth changes

## Operating Plan

1. Audit the current chatbot contract.
   - Public widget calls `chatbot.chat`.
   - Server uses an LLM when configured.
   - Server and client both need a safe fallback when the LLM is unavailable.

2. Centralize deterministic chatbot behavior.
   - Create one shared module for intent detection, lead qualification, quick replies, fallback responses, and unsafe-claim filtering.
   - Reuse the same module in server and client code.

3. Improve lead qualification.
   - Track only in-session fields: solution, monthly bill, site type, location, area, timeline, and contact channel.
   - Ask no more than two missing questions at a time.
   - Do not persist chat memory in this packet.

4. Tighten financial and policy safety.
   - Do not guarantee savings, ROI, payback, tax treatment, or BOI eligibility.
   - Route serious buyers to LINE `@sirinx` and an engineering survey.
   - Treat public `system` messages as untrusted input.

5. Improve the widget UX.
   - Update quick replies for Solar Carport, energy savings, Rooftop-vs-Carport, BESS/EV Charger, and site survey.
   - Show lightweight lead-progress status after a conversation starts.
   - Keep the existing dark premium SIRINX UI.

6. Harden public SEO claim safety.
   - Remove unsupported guaranteed savings/payback wording from default HTML metadata.
   - Remove unsupported guaranteed savings/payback wording from server-side OG metadata.
   - Add regression tests so injected public metadata does not reintroduce `30-100%`, fixed `3-5 ปี`, or unqualified BOI 200% claims on high-risk routes.

7. Harden high-risk public body copy.
   - Replace broad `30-100%` savings and fixed `3-5 ปี` payback claims in the main hero, Solar Carport, Solutions, Projects, Blog teaser, and pricing comparison copy with site-specific assessment wording.
   - Preserve capacity ranges such as `30-100 kWp` and O&M contract terms because those are not savings/payback claims.
   - Keep calculator outputs intact because they are computed estimates from user inputs and already display estimate disclaimers.

8. Verify locally.
   - Run type check.
   - Run chatbot and router tests.
   - Run production build.
   - Do not deploy from this packet.

## Acceptance Criteria

- Chatbot still opens on the public site.
- `chatbot.chat` remains public and unauthenticated.
- Fallback works without an LLM key.
- Client fallback and server fallback produce governed guidance from the same logic.
- Unsafe LLM claims such as guaranteed 100% savings or fixed 3-5 year payback are replaced by safer guidance.
- Default public SEO metadata avoids unsupported guaranteed savings/payback claims.
- High-risk public body copy avoids broad guaranteed savings/payback wording while keeping calculator estimates and capacity ranges intact.
- No source outside the chatbot/UI/shared/test/docs scope is changed.
- No secrets are read, printed, or committed.

## Verification Results

Completed locally on 2026-05-16:

- `pnpm check` passed.
- `pnpm test` passed: 15 files, 156 tests.
- `pnpm build` passed.
- Local production smoke passed at `http://127.0.0.1:4179/` with HTTP 200.
- Local HTML title/description smoke confirmed the rebuilt homepage metadata no longer contains `30-100%` or fixed `3-5 ปี` payback wording.
- Built `FloatingChatWidget` asset contains the new Solar Carport quick reply and qualification progress text.

Notes:

- The production deploy was not run.
- `.env` values were not read or printed.
- The local smoke server used `DOTENV_CONFIG_PATH=/tmp/sirinx-no-env` to avoid loading repo env files.

## Next Integration Steps

These require explicit approval after local verification:

1. Connect LINE/Telegram/CRM handoff through a server-side queue, not direct browser secrets.
2. Add lead event capture with clear consent and privacy review.
3. Add retrieval from approved public SIRINX docs only.
4. Add admin review dashboard for chatbot leads in the internal control plane.
5. Deploy to Cloudflare and verify `www.sirinx.co` with screenshots.
