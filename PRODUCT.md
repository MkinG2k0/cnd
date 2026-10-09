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
- Existing stack: Next.js app currently serving a Tilda mirror (`public/mirror/index.html`, `public/tilda/`).
- Content language: Russian.
- Undecided: whether the multi-step quiz remains the primary conversion path after redesign (lead capture + call remain required).

## Brand Commitments

- Public name: «Недвижимость Дагестана» / CND (site cnd05.ru).
- Contact email in use: cndnedvizhka05@gmail.com.

## Evidence on Hand

- Mirrored page copy and structure: `public/mirror/index.html`.
- Meta: `content/tilda-meta.json`.
- Listed ЖК examples in current content: Московский, Новый Горизонт, Высота, Флагман, Гранд Эра (Makhachkala districts/addresses).
- Team mention: Алиметов Мустафа (менеджер).
- Image assets referenced under `/tilda/images/`; local completeness may be partial — future work must not invent testimonials, prices, or claims not already on the site.

## Product Principles

1. Path is sequential: discover ЖК → request → call; do not bury any of the three.
2. Trust comes from real objects, photos, contacts, and the team — not invented social proof.
3. Scope stays new builds and deal support; do not present as secondary-market brokerage.
4. Keep factual content (ЖК list, contacts, photos) accurate when the visual system changes.
