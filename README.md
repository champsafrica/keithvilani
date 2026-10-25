# keithvilani.co.za

The personal website of **Keith Vilani**: founder and CEO of Digitalx, founder of Go Ads and the Keith Vilani Foundation,
and the person behind SANA, GetClient and Advera.

## The idea
Up to 11,000 points of light live in a **3D WebGL scene** behind every page (fewer on phones, a 2D fallback without
WebGL, and an automatic step-down on slow devices). The camera follows the cursor, or the tilt of a phone. Out-of-focus
lights blur into bokeh, shapes turn like sculptures, and fast motion leaves light streaks.

- **Big bang intro** (first visit per session): the lights rush in from deep space to spell KEITH VILANI, hold, then
  explode into the constellation as the page appears.
- **The constellation**: everything Keith has built, with Digitalx at the hub. Hover a star to read it, click to open it.
- **Hyperspace**: every internal link streaks the stars past the viewer at light speed, flashes, and the next page
  arrives out of the depth.
- **Write your name in the sky**: visitors' names are spelled in light and become a star in Keith's constellation
  (stored on their own device).
- **The live Cape Town sky**: colours follow the time in Cape Town (night, golden hour, day), shown next to the clock.
- Reading sections switch to a dim, deep starfield so text stays easy to read.
- Preview any shape with `?scene=`, for example `/?scene=title:Hello` or `/?scene=billboard`.

| Page | The lights become |
| --- | --- |
| Home | The constellation, then 12, then each venture's symbol |
| Digitalx | A bold X in orbit |
| Keith Vilani Foundation | A beating heart with a pulse line |
| SANA | A shield with a road through it |
| GetClient | A verified badge |
| Go Ads | A delivery bike carrying a GO billboard |
| Advera | An AI spark |
| Work pages | The client brand's initials |
| About | KV, then Table Mountain |
| Contact | A tree you grow by pressing and holding |
| 404 | 404 |

Reading sections switch to a dim, even starfield so text stays easy to read.

## Pages (19 + 404)
`/`, `/about/`, `/ventures/` and one page per venture, `/work/` and one page per client project, `/notes/`, `/contact/`.
Every page is a folder with an `index.html`, so URLs are clean and never end in `.html`.

## Build
```bash
npm run build    # writes public/ (Node 18+, no dependencies)
npm run serve    # preview public/ at http://localhost:4321 with the live clean-URL rules
npm run og       # optional: renders a 1200x630 share image per page into public/og/ (needs Playwright)
```
Edit content in `src/data/site.mjs` (ventures, principles, contact) and `src/data/work.json` (client case studies, taken
from the Digitalx portfolio), then rebuild and commit both `src/` and `public/`.

## Deploy
Upload the contents of `public/` to the web root.
- **Apache / cPanel:** `public/.htaccess` forces HTTPS and no www, redirects any `.html` address to its clean URL,
  redirects the old Foundation pages (`/programs.html`, `/get-involved.html`, `/about.html`), serves `404.html`, and sets
  caching and security headers.
- **Netlify:** pretty URLs are automatic and `public/_redirects` covers the old Foundation pages. The **Notes** form is a
  Netlify form named `notes`; on other hosts notes stay in the visitor's browser only.

## SEO
Per-page titles, descriptions, canonical URLs, Open Graph and Twitter images, JSON-LD (`Person`, `Organization`/`NGO`,
`CreativeWork`, `BreadcrumbList`), `sitemap.xml` and `robots.txt`. All content is in the HTML, so pages read fine with
JavaScript off.

## Sources
Keith's role comes from Digitalx's own privacy policy. Ventures and client work come from the Digitalx portfolio and the
champsafrica repositories. Foundation figures come from the Keith Vilani Foundation site. Do not add invented results or
quotes.
