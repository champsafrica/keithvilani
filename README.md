# keithvilani.co.za

The personal website of **Keith Vilani**: founder and CEO of Digitalx, founder of Go Ads and the Keith Vilani Foundation,
and the person behind SANA, GetClient and Advera.

## The idea
A personal statement, not a portfolio. The whole site argues one sentence:

> **Talent is everywhere. Opportunity isn't.**

- **First 3 seconds:** the sentence fills the screen and resolves from blur, while a glossy black planet with a burning
  ring drops in front of "everywhere" and warm fluid light blooms behind it (both real-time WebGL shaders).
- **Next 10 seconds:** 100 lights, one for each young South African who wants work; 47 go dark (Stats SA youth
  unemployment, Q2 2026). Then *"so I build bridges"*: drag across the gap and each of Keith's ventures snaps in as a plank.
- **Six bridges:** a swipeable rail of arched cards, one per venture.
- **The shareable moment:** visitors sign the sentence with their name and city, and the site draws a 1080x1350 poster
  they can share straight to their phone's share sheet or download.
- Every page keeps the same fluid light; the planet and the interactive pieces live on the home page.
- Respects reduced motion, lowers resolution automatically on slow devices, and works without WebGL.

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
