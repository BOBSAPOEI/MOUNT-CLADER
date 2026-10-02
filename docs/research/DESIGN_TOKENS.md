# Design tokens (mont-fort.com, measured at 1440×900)

## Colour
| Token | Value | Use |
| --- | --- | --- |
| navy | `#2d628c` | Primary ink on light backdrops, link underline, counter badge |
| navy-2 | `#81a0bb` | Headline colour before it is scrubbed to navy, footer legal links |
| navy-3 | `#a9bfd2` | Chapter diamond, tab underline, hairlines |
| navy-4 | `#d1dde8` | Link-block track |
| sky | `#8cb4d5` | Secondary accents |
| azure | `#008ae0` | Division accent (capital) |
| scene light | `#e8ecef` | Sky / cloud light colour |
| scene dark | `#5c7283` | Storm sky / cloud dark colour |
| night | `#09192a` | Backdrop of the sustainability chapters |

## Typography
- Body and headings: **Century Gothic** (400 / 700, regular + italic). Hero titles: **Josefin Sans** 300.
- Scale (mobile → ≥1024px): `fs-h2` 36 → 50px (lh 1.4, ls .09 → .14rem); `fs-h3` 28 → 40px; `fs-h4` 12 → 20px;
  `fs-s1` 20 → 24px (ls .03rem); `fs-body` 16px (ls .08rem); `fs-body-s` 12px (ls .06rem);
  `fs-label` 12px bold; `fs-cta-s` 12px (ls .03rem), uppercase.

## Layout
- Breakpoints: tablet 768, desktop 1024, medium-large 1280, large 1680 (`tb`, `dk`, `ml`, `wide` in Tailwind).
- Grid: 4 columns (10px gap) below 1024px, 24 columns (20px gap) from 1024px, 32px side margin, max 1920px.
- `--header-padding`: 1rem → 2rem (≥1024px) → 3rem (≥1280px).
- Viewport units use `lvh`/`svh` through `--lvh` / `--svh`.

## Motion
- Easing used throughout: `cubic-bezier(.4, 0, .1, 1)`; dot/cursor easing `cubic-bezier(.9, 0, .4, 1)`.
- Link block: arrow swaps sides in 0.7s; underline draws in 0.4s.
