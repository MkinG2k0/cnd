---
name: ЦНД — Недвижимость Дагестана
description: Forest-green sales site where brand name and real ЖК photography lead.
colors:
  forest: "#193e35"
  forest-deep: "#123128"
  forest-hover: "#28594b"
  brass: "#b39b65"
  focus-brass: "#aa8032"
  ink: "#202d28"
  muted: "#68736d"
  pale: "#f3f5f2"
  line: "#dce2dc"
  surface: "#ffffff"
  hero-mist: "#d4dfd8"
  error: "#a72e20"
typography:
  display:
    fontFamily: "Golos Text, Arial, sans-serif"
    fontSize: "clamp(44px, 5.15vw, 76px)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.065em"
  headline:
    fontFamily: "Golos Text, Arial, sans-serif"
    fontSize: "46px"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.045em"
  title:
    fontFamily: "Golos Text, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Golos Text, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Golos Text, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "6px"
  control: "7px"
  card: "10px"
  panel: "18px"
  hero: "20px"
  pill: "40px"
  full: "9999px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "22px"
  lg: "28px"
  xl: "48px"
  section-y: "86px"
  wrap-gutter: "48px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "16px 24px"
    height: "54px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.forest-hover}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "16px 24px"
    height: "54px"
  button-light:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.forest}"
    rounded: "{rounded.control}"
    padding: "16px 24px"
    height: "54px"
  button-light-hover:
    backgroundColor: "#e5eee8"
    textColor: "{colors.forest}"
    rounded: "{rounded.control}"
    padding: "16px 24px"
    height: "54px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.forest}"
    rounded: "{rounded.control}"
    padding: "16px 24px"
    height: "54px"
  button-outline-hover:
    backgroundColor: "#e7ede7"
    textColor: "{colors.forest}"
    rounded: "{rounded.control}"
    padding: "16px 24px"
    height: "54px"
  city-tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  city-tab-active:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "9px 13px"
    width: "285px"
  property-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "23px"
  quiz-option:
    backgroundColor: "{colors.pale}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "13px 16px"
  contacts-panel:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "56px"
---

# Design System: ЦНД — Недвижимость Дагестана

## Overview

**Creative North Star: "The Forest Listing Desk"**

ЦНД is a clear forest-green sales floor for Dagestan new-builds. The brand mark and name sit at hero scale; every listing is a real ЖК photograph with a readable price. Surfaces stay mineral and quiet — white paper for listings, pale ground for the catalog band, deep green for conversion panels — so geography, photos, and contact paths stay primary.

Density is commercial and scannable: compact header, two-column green hero, then a three-column photo catalog. Typography is a single Golos Text family with tight negative tracking on display sizes. Depth comes from tonal planes and rounded green panels, not decorative concept skins.

Confirmed visual rejections: invented awards, decorative mountain illustrations, atmospheric concept skins unrelated to real objects, and purple/glow marketing tropes.

**Key Characteristics:**
- Forest green (`#193e35`) as the dominant brand plane on hero and contacts
- Real ЖК photography as the visual lead; mineral pale (`#f3f5f2`) catalog ground
- Single face: Golos Text for brand, display, body, and UI
- Rounded green panels (hero ~20px, contacts ~18px) and white listing cards (~10px)
- Three-column property grid collapsing to two, then one

## Colors

A forest-and-mineral palette: deep green sales planes, pale catalog ground, brass reserved for focus/accent, ink and muted for text hierarchy.

### Primary
- **Forest Green** (`#193e35`): Brand plane for hero panel, primary buttons, active city tabs, progress fill, and contacts band. Also brand wordmark and footer name.
- **Forest Deep** (`#123128`): Declared deep companion to forest; used for night-leaning overlays and dialog backdrop tone (`#0c251bcc`).
- **Forest Hover** (`#28594b`): Primary button hover and social chip hover lift on green.

### Secondary
- **Brass** (`#b39b65`): Declared accent (`--gold`) for mineral warmth against forest.
- **Focus Brass** (`#aa8032`): Focus-visible outline on interactive controls (`3px` solid, `4px` offset).

### Neutral
- **Ink** (`#202d28`): Default body text on white.
- **Muted** (`#68736d`): Supporting copy, meta, captions, and quieter links.
- **Pale** (`#f3f5f2`): Catalog section ground and soft quiz option fill.
- **Line** (`#dce2dc`): Hairline borders, brand divider, search stroke.
- **Surface** (`#ffffff`): Page canvas and listing card faces.
- **Hero Mist** (`#d4dfd8`): Supporting copy on green hero.
- **Error** (`#a72e20`): Form validation text.

### Named Rules
**The Forest Plane Rule.** Large green surfaces (hero, contacts) carry conversion; listing cards stay white on pale ground so photos and prices remain the scan targets.

**The Real Photo Rule.** Listing and hero media show actual ЖК photography. Do not substitute decorative landscapes, invented awards, or concept atmospheres for object photos.

## Typography

**Display Font:** Golos Text (with Arial, sans-serif)
**Body Font:** Golos Text (with Arial, sans-serif)

**Character:** One confident geometric sans for Cyrillic sales copy — medium weight display with tight tracking, quieter muted body for descriptions.

### Hierarchy
- **Display** (500, `clamp(44px, 5.15vw, 76px)`, 1.04, `-0.065em`): Hero brand/title only.
- **Headline** (500, `46px`, 1.12, `-0.045em`): Section titles (scales down at 1150 / 560).
- **Title** (500, `24px`, 1.12, `-0.035em`): Property names, contact office title, team names near this band.
- **Body** (400, `16px`, 1.55): Default page text; hero support ~15px / 1.7 on mist.
- **Label** (400, `11–13px`): Meta, city tags, toolbar, search, captions.

### Named Rules
**The One Face Rule.** Do not introduce a second display family. Golos Text carries brand, headlines, and controls.

## Layout

Content lives in a centered wrap (`max-width: 1392px`, side gutters `48px` desktop → `28px` at 1150 → `16px` at 560). Header is a compact horizontal bar (~112px → 82px). Hero is a two-column grid inside a rounded green panel; geography is a four-column row below. Catalog uses a three-column property grid (`gap: 28px 22px`) → two columns at 800 → one at 560. Section vertical rhythm is generous (`~86–88px` padding). About and founder use two-column editorial splits that stack on small screens. Contacts is a two-column green panel that stacks at 560.

### Named Rules
**The Catalog Scan Rule.** The property grid is the commercial heart: photo, city, name, short description, price, then detail — three columns whenever width allows.

## Elevation & Depth

Mostly flat tonal layering: white cards on pale, green panels on white, soft photo gradient only on the hero caption edge. Shadows appear for modal and mobile nav overlays, not for resting listing cards.

### Shadow Vocabulary
- **Modal lift** (`box-shadow: 0 20px 90px #0004`): Property and quiz dialogs.
- **Mobile nav** (`box-shadow: 0 20px 40px #15352920`): Open header menu panel.
- **Dialog veil** (`background: #0c251bcc` + `backdrop-filter: blur(4px)`): Modal backdrop.

### Named Rules
**The Flat Listing Rule.** Property cards use a `1px` mineral border, not drop shadows. Lift belongs to dialogs and temporary overlays.

## Shapes

Rounded commercial panels: hero `20px` (→ `12px` on small), contacts `18px` (→ `12px`), listing cards `10px`, controls `6–7px`, city count badge pill `40px`, circular photo/detail affordances. Borders are soft mineral greens (`#e5e9e2`, `#bac8bd`, `#dce2dc`), not hard black rules.

### Named Rules
**The Rounded Green Panel Rule.** Brand conversion surfaces (hero, contacts) are large rounded green rectangles; listing interaction stays on white cards with gentler `10px` corners.

## Components

### Buttons
- **Shape:** Soft control radius (`7px`), min-height `54px`, padding `16px 24px`, weight 500, ~14px type.
- **Primary:** Forest fill + forest border, white label; hover forest-hover (`#28594b`).
- **Light:** White fill on green hero, forest text; hover `#e5eee8`.
- **Outline:** Transparent with `#bac8bd` border, forest text; hover `#e7ede7`.
- **Focus:** Brass outline `3px #aa8032` / `4px` offset on buttons, links, and fields.

### Chips / Tabs
- **City tabs:** Transparent resting; hover pale wash `#e6ece5`; active forest fill + white text; radius `6px`.
- **Count badge:** Pill outline `#cbd4cb`, forest text, ~28px tall.
- **City tag on photo:** White translucent chip, `4px` radius, `10px` type.
- **Social chips:** On green contacts — thin `#708477` border, `5px` radius; hover `#35604c`.

### Cards / Containers
- **Property card:** White, `10px` radius, `1px #e5e9e2` border; image aspect ~1.46 with slight hover scale; body padding ~23px; price row separated by top hairline.
- **Hero panel:** Forest fill, `20px` radius, two columns — copy left, real photo right with bottom gradient caption.
- **Contacts panel:** Forest fill, `18px` radius, two-column phone/office layout.

### Inputs / Fields
- **Search:** White field, `1px` line border, `6px` radius, ~285px wide on desktop (full width when wrapped).
- **Quiz / contact fields:** White, `#ccd6cb` border, `6px` radius, `14px` padding.
- **Quiz option:** Pale fill + line border; checked state `#e1eadf` with forest border; radio/checkbox accent forest.

### Navigation
- Compact header: logo + ЦНД wordmark in forest, text links `14px`, phone block right. Hover links soften to `#739380`. Below 560, hamburger opens a bordered white panel with column links.

### Signature: Property modal & quiz
- Dialogs: `16px` radius, heavy soft shadow, blurred green veil. Property modal ~870px max with full-bleed photo; quiz modal ~640px with 3px progress track filling forest from the left.

## Do's and Don'ts

### Do:
- **Do** lead with the ЦНД name and a real ЖК photograph in the first viewport.
- **Do** keep listing cards white on pale ground with photo, city, name, and price scannable in three columns when space allows.
- **Do** use forest green for hero and contacts conversion planes, and Golos Text for all UI type.
- **Do** honor `prefers-reduced-motion` by disabling transitions and smooth scroll.

### Don't:
- **Don't** invent awards, testimonials, or decorative mountain/atmosphere skins in place of object photography.
- **Don't** introduce a second display typeface or a purple/glow marketing theme.
- **Don't** drop-shadow resting property cards; reserve elevation for dialogs and temporary menus.
- **Don't** bury the path browse → detail → quiz/WhatsApp or phone.
