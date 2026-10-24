# SmartWaste AI — Design System

**Direction:** a premium dark "environmental command center". Deep forest black, glass panels, emerald light. It should feel like mission control for a living campus: calm, precise and expensive. It should not look like an admin template.

**Principles**
1. **Data is the hero.** Big monospaced numbers, quiet chrome.
2. **Light comes from the data.** Glow is used only for meaning (hover, focus, primary actions, live values).
3. **Depth through layers.** Background → orbs → grid → glass surfaces → content.
4. **Restraint.** One primary colour (emerald), one accent (lime), with amber and red kept for meaning.

---

## 1. Colour Tokens

### Base
| Token | Value | Use |
|---|---|---|
| `--bg` | `#06100C` | Page background (near-black forest) |
| `--surface-1` | `#0B1912` | Cards, sidebar |
| `--surface-2` | `#0F2219` | Raised elements: inputs, popovers, table header, hover rows |
| `--border` | `rgba(255,255,255,0.06)` | Default hairline borders |
| `--border-strong` | `rgba(255,255,255,0.12)` | Focused / hovered borders, dividers that need to be visible |

### Text
| Token | Value | Use |
|---|---|---|
| `--text` | `#ECFDF5` | Primary text, numbers |
| `--text-muted` | `#94A3A0` | Labels, secondary text |
| `--text-faint` | `#7B8C87` | Placeholders, axis ticks, captions (≥ 4.5:1 on every surface; was `#5B6B66`, which failed WCAG AA) |

### Brand & semantic
| Token | Value | Use |
|---|---|---|
| `--primary` | `#10B981` (emerald) | Primary buttons, active nav, recycled values, focus rings |
| `--primary-glow` | `rgba(16,185,129,0.35)` | Hover/focus glow |
| `--accent` | `#A3E635` (lime) | Highlights, positive deltas, forecast line, "live" badges |
| `--warning` | `#F59E0B` (amber) | Landfill values, warnings |
| `--danger` | `#EF4444` | Errors, destructive actions, negative deltas |

**Delta colours:** less waste or a higher recycling % is good (`--accent`); more waste or more landfill is bad (`--danger`). Colour follows whether the change is good, not whether it is up or down.

### Waste categories (fixed, used everywhere)
| Category | Token | Value |
|---|---|---|
| Organic | `--cat-organic` | `#22C55E` |
| Plastic | `--cat-plastic` | `#38BDF8` |
| Paper | `--cat-paper` | `#FACC15` |
| Metal | `--cat-metal` | `#94A3B8` |
| Other | `--cat-other` | `#A78BFA` |

### Disposal
| Disposal | Colour |
|---|---|
| Recycled | `--primary` `#10B981` |
| Composted | `--cat-organic` `#22C55E` |
| Landfill | `--warning` `#F59E0B` |

### Building type
| Type | Colour |
|---|---|
| Hostel | `--primary` `#10B981` |
| Academic | `--cat-plastic` `#38BDF8` |

### Tailwind mapping (`tailwind.config.js` → `theme.extend.colors`)
```js
colors: {
  bg: '#06100C',
  surface: { 1: '#0B1912', 2: '#0F2219' },
  primary: { DEFAULT: '#10B981', glow: 'rgba(16,185,129,0.35)' },
  accent: '#A3E635',
  warning: '#F59E0B',
  danger: '#EF4444',
  cat: {
    organic: '#22C55E', plastic: '#38BDF8', paper: '#FACC15',
    metal: '#94A3B8', other: '#A78BFA',
  },
  ink: { DEFAULT: '#ECFDF5', muted: '#94A3A0', faint: '#5B6B66' },
},
borderColor: { hair: 'rgba(255,255,255,0.06)', strong: 'rgba(255,255,255,0.12)' },
```
Keep one source of truth: export the same values from `src/lib/theme.js` for Recharts, which needs raw hex values.

---

## 2. Typography

Loaded from Google Fonts in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
```

| Role | Font | Tailwind |
|---|---|---|
| Headings, nav, card titles | **Sora** | `font-display` |
| Body, labels, forms, tables | **Plus Jakarta Sans** | `font-sans` (default) |
| KPI numbers, chart values, kg figures | **JetBrains Mono** | `font-mono` + `tabular-nums` |

```js
fontFamily: {
  display: ['Sora', 'sans-serif'],
  sans: ['"Plus Jakarta Sans"', 'sans-serif'],
  mono: ['"JetBrains Mono"', 'monospace'],
},
```

### Scale
| Use | Size / weight | Notes |
|---|---|---|
| Page title | 28px / Sora 700 | `tracking-tight` |
| Section title | 18px / Sora 600 | |
| Card title / label | 12px / Jakarta 600 | UPPERCASE, `tracking-[0.12em]`, `--text-muted` |
| Body | 14px / Jakarta 400–500 | |
| KPI number | 36–44px / Mono 700 | `tabular-nums`, unit (`kg`, `%`) at 50% size in `--text-muted` |
| Table numbers | 13px / Mono 500 | right-aligned |

On mobile, KPI numbers are 28–32px and the page title is 17px (22px from `sm`).

### Type tokens (Tailwind, defined in `src/index.css` `@theme`)
Use these instead of arbitrary `text-[Npx]` sizes. Only one-off display sizes (hero, KPI, 404) stay arbitrary.

| Class | Size | Use |
|---|---|---|
| `text-micro` | 11px | Badges, axis ticks, overlines |
| `text-caption` | 12px | Labels, captions, chips |
| `text-small` | 13px | Table cells, buttons, secondary body |
| `text-body` | 14px | Body text, inputs |
| `text-title` | 16px | Card titles |
| `text-heading` | 18px | Modal and empty-state titles |

---

## 3. Layout & Spacing

- 4px base grid. Common gaps: 8 / 12 / 16 / 24 / 32.
- **Radius:** `16px` for cards and modals (`rounded-2xl`), `10px` for inputs and buttons (`rounded-[10px]`), full for pills and badges.
- **Desktop (≥1024px):** fixed left sidebar (240px, collapsible to 72px), content max-width 1440px, 24–32px padding.
- **Tablet (640–1023px):** sidebar collapses to icons, 2-column KPI grid.
- **Mobile (<640px):** top bar + bottom tab nav, 1-column stack, 16px padding, tables become card lists, filters move into a bottom sheet.
- **Dashboard grid:** KPI row (4 → 2 → 1 columns) · daily chart (2/3) + category donut (1/3) · weekly chart · buildings · forecast · insights.

---

## 4. Surfaces

### Glass card (the core component)
```css
.glass {
  background: linear-gradient(180deg, rgba(15,34,25,0.72), rgba(11,25,18,0.72));
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.04),       /* top highlight */
    inset 0 0 24px rgba(16,185,129,0.04),       /* soft inner glow */
    0 10px 30px -12px rgba(0,0,0,0.6);          /* depth */
  transition: border-color .25s, box-shadow .25s, transform .25s;
}
.glass:hover {
  border-color: rgba(16,185,129,0.28);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.06),
    inset 0 0 24px rgba(16,185,129,0.06),
    0 0 0 1px rgba(16,185,129,0.10),
    0 12px 40px -12px rgba(16,185,129,0.35);    /* emerald glow */
  transform: translateY(-2px);
}
```
- Keep the blur subtle (≤16px). It is there to give depth over the orbs, not to look frosted.
- Optional thin gradient top-edge line on featured cards: `linear-gradient(90deg, transparent, #10B981, transparent)` at 40% opacity, 1px tall.

### Page background (three layers)
1. **Base:** solid `#06100C` on `body`.
2. **Gradient orbs:** 3 large blurred circles, fixed position, `pointer-events-none`, `-z-10`:
   - Emerald `#10B981` at 18% opacity, 600px, top-left
   - Lime `#A3E635` at 10% opacity, 500px, right-centre
   - Teal `#14B8A6` at 12% opacity, 700px, bottom
   - `filter: blur(120px)`, each drifting slowly (`20–30s ease-in-out infinite alternate`, translate ±40px, scale 1 → 1.1)
3. **Grid overlay:** fine 32px grid lines, faded at the edges:
   ```css
   .grid-overlay {
     background-image:
       linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
       linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
     background-size: 32px 32px;
     mask-image: radial-gradient(ellipse at center, black 40%, transparent 85%);
   }
   ```

---

## 5. Components

| Component | Spec |
|---|---|
| **KPI card** | Glass card. Icon tile (36px, `rounded-[10px]`, tinted bg at 12% of the semantic colour) + uppercase label · big mono number with count-up · delta pill (▲/▼ %, good/bad colour) + "vs prev. period" · optional mini sparkline at the bottom |
| **Primary button** | `bg-primary text-bg font-semibold`, 40px tall, hover: brighter + `0 0 20px var(--primary-glow)` |
| **Secondary button** | Transparent, `border-strong`, `text-ink`, hover: `bg-surface-2` |
| **Danger button** | `bg-danger/10 text-danger border border-danger/30`, solid red only inside the confirm dialog |
| **Input / select** | `bg-surface-2`, hairline border, 40px tall, focus: `border-primary` + `ring-2 ring-primary/25`. Error: `border-danger` + 12px message below |
| **Badge / pill** | Rounded-full, 11–12px, tinted bg (colour at 12%) + coloured text + 6px dot. Used for category, disposal, building type |
| **Table** | Sticky `surface-2` header, uppercase 11px labels, 52px rows, hairline row dividers, hover row `surface-2/60`, numbers right-aligned in mono |
| **Modal / drawer** | Glass at higher opacity (0.92), backdrop `rgba(0,0,0,0.6)` + blur(4px). Drawer from the right on desktop, bottom sheet on mobile |
| **Toast** | Bottom-right (desktop) / top-centre (mobile). Glass with a 3px left bar: emerald = success, red = error, amber = warning. Auto-dismiss after 4s |
| **Skeleton** | `surface-2` block with a shimmer gradient sweep (1.6s loop) matching the final layout |
| **Empty state** | Centred lucide icon in a 56px glowing ring, Sora title, muted one-liner, primary CTA |
| **"Estimate" tag** | Lime outline pill with a `Sparkles` icon: "AI estimate". Required on every forecast value |

---

## 6. Charts (Recharts)

- Transparent background; grid `strokeDasharray="3 3"` at `rgba(255,255,255,0.05)`, horizontal lines only
- Axis ticks 11px `--text-faint`, no axis lines
- Lines: 2px, `type="monotone"`, no dots until hover (active dot 5px with a glow)
- Area fills: a vertical gradient from the series colour at 35% opacity to 0%
- Bars: `radius={[6,6,0,0]}`, max bar width 28px
- Tooltip: glass card, Sora label, mono values with coloured dots
- **Series colours:** total = `#ECFDF5` (or emerald), recycled = `#10B981`, landfill = `#F59E0B`, categories use the category tokens
- **Forecast chart:** history = solid emerald line; prediction = **dashed** lime line (`strokeDasharray="6 4"`); confidence band = lime area at 12% between lower and upper; a vertical `ReferenceLine` labelled "Today" separates past from future

---

## 7. Motion (Framer Motion)

| Pattern | Spec |
|---|---|
| Card entrance | `initial={{ opacity: 0, y: 16 }}` → `animate={{ opacity: 1, y: 0 }}`, `duration: 0.5`, ease `[0.22, 1, 0.36, 1]` |
| Stagger | Parent `staggerChildren: 0.06` for KPI rows and grids |
| Count-up numbers | 0 → value over 1.2s, ease-out, `useMotionValue` + `animate`, keep decimals fixed (1 dp for kg, 1 dp for %) |
| Hover | Card lifts 2px + glow (CSS transition, 250ms) |
| Modal | Fade backdrop; panel scales 0.96 → 1 + fade, 200ms |
| Page / route change | Fade + 8px slide, 250ms |
| Background orbs | Slow CSS keyframe drift, 20–30s |

**Accessibility:** respect `prefers-reduced-motion`. Turn off orb drift, set count-ups to show the final value immediately, and replace slides with fades.

---

## 8. Icons (lucide-react only)

Stroke width 1.75, 18px in nav, 16px inline, 20px in KPI tiles.

| Concept | Icon |
|---|---|
| Dashboard | `LayoutDashboard` |
| Records | `ClipboardList` |
| Buildings | `Building2` |
| Hostel | `BedDouble` |
| Analytics | `BarChart3` |
| Forecast | `TrendingUp` / `Sparkles` |
| Total waste | `Trash2` |
| Recycled | `Recycle` |
| Landfill | `Mountain` |
| Recycling % | `Leaf` |
| Add | `Plus` · Edit `Pencil` · Delete `Trash` |
| Filter | `SlidersHorizontal` · Date `CalendarDays` |
| Success / Error | `CheckCircle2` / `AlertTriangle` |

---

## 9. Accessibility

- Text contrast ≥ 4.5:1 against surfaces (`--text-muted` on `--surface-1` passes; don't use `--text-faint` for essential info)
- Visible focus on everything interactive: a global `:focus-visible` outline (2px emerald, 2px offset) that follows each element's radius; inputs use `focus:` + `focus-within:` rings (Chromium date inputs move focus into internal segments)
- Skip-to-content link, focus trapped in modals and the mobile drawer, focus restored on close
- Framer Motion wrapped in `<MotionConfig reducedMotion="user">`
- Never rely on colour alone: deltas have ▲/▼ arrows, and chart series have legends
- Touch targets ≥ 40px on mobile
