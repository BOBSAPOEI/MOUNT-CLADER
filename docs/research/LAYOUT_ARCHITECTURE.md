# Page architecture (desktop 1440×900)

The page is a fixed WebGL backdrop (`#canvas-wrapper`) with transparent HTML chapters scrolling over it.
Section anchors below match the original exactly and are what the 3D camera is keyed to.

| Block | Top (px) | Height (px) | Notes |
| --- | ---: | ---: | --- |
| Hero | 0 | 1350 | 150lvh; logo + scroll prompt are `fixed` inside the first 100svh |
| Who we are | 1350 | 1190 | 160px padding top/bottom, headline then paragraph + link |
| What we do | 2540 | 4958 | headline, expandable intro, 4 divisions (row-gap 250px), then 100lvh + 212px tail |
| Global connectivity | 7498 | 2700 | 300lvh, content starts at 150lvh; city labels are `fixed` and projected from the globe |
| Sustainability | 10198 | 2274 | lead paragraph, chapter 1 |
| Solutions | 12472 | 1701 | chapter 2 with Environmental / Social / Governance tabs |
| Equality | 14173 | 850 | chapter 3 |
| Social | 15023 | 1780 | chapter 4, three-slide carousel |
| Footer | 16803 | 823 | white |

Total document height: 17626px. The camera rail covers the "top chapters" (0 → 10198 − viewport).

## Fixed UI
Header (hides on scroll down, shows on scroll up), menu overlay, scroll-to-top + sound buttons (bottom right), ring cursor.
