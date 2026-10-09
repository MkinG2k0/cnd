# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: people investing in Dagestan real estate and people buying a home for themselves (often in Makhachkala / surrounding districts).

Jobs on the site, in order: browse and choose a residential complex (ЖК) → leave a lead request → call the team.

## Product Purpose

CND («Недвижимость Дагестана») helps clients find and buy apartments in new-build residential complexes, with deal accompaniment from the team. Success means a visitor picks a ЖК that fits them and contacts the company (form or phone).

## Positioning

Focus on new builds only (новостройки), with transaction accompaniment and a named team — not a general secondary-market agency.

## Operating Context

Marketing / lead-gen site for a Dagestan real-estate practice. Visitors compare ЖК (class, district, address), then convert via request or call. Team and contacts are part of trust.

## Capabilities and Constraints

- Must preserve: ЖК catalog, contacts, photography of objects/team as available.
- Stack: Next.js App Router + Tailwind; content in `content/site.json`; images in `public/assets/`; optional project PDFs in `public/projects/`.
- Conversion: multi-step quiz posts into WhatsApp; phone / Telegram / email remain available.
- Content language: Russian.
- Production hostname target: `cnd05.ru` (preview may run on Vercel until DNS is switched).

## Brand Commitments

- Public name: «Недвижимость Дагестана» / CND / ЦНД (site cnd05.ru).
- Contact email in use: cndnedvizhka05@gmail.com.

## Evidence on Hand

- Canonical content: `content/site.json` (18 ЖК across Махачкала, Каспийск, Дербент).
- Project PDF mapping: `content/project-pdfs.json` (some files still unassigned).
- Design system: `DESIGN.md` (forest / brass sales site).
- Team includes founder Алиметов Мустафа and regional managers.
- Do not invent testimonials, prices, or claims beyond `site.json` and approved assets.

## Product Principles

1. Path is sequential: discover ЖК → request → call; do not bury any of the three.
2. Trust comes from real objects, photos, contacts, and the team — not invented social proof.
3. Scope stays new builds and deal support; do not present as secondary-market brokerage.
4. Keep factual content (ЖК list, contacts, photos) accurate when the visual system changes.
