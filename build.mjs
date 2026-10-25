// Static site generator for keithvilani.co.za (Node 18+, no dependencies).
// Every page is written as <path>/index.html so URLs are clean and never end in .html.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SITE, NAV, VENTURES, WORK, PRINCIPLES } from './src/data/site.mjs';

const OUT = new URL('./public/', import.meta.url).pathname;
const SRC = new URL('./src/', import.meta.url).pathname;
const TODAY = new Date().toISOString().slice(0, 10);

// keep generated share images between builds (made by tools/og.mjs)
const ogKeep = existsSync(join(OUT, 'og')) ? join(SRC, '.og-cache') : null;
if (ogKeep) { rmSync(ogKeep, { recursive: true, force: true }); cpSync(join(OUT, 'og'), ogKeep, { recursive: true }); }
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
if (ogKeep) { cpSync(ogKeep, join(OUT, 'og'), { recursive: true }); rmSync(ogKeep, { recursive: true, force: true }); }

/* ---------- assets, fingerprinted ---------- */
const asset = (name) => {
  const src = readFileSync(join(SRC, 'assets', name));
  const hash = createHash('sha1').update(src).digest('hex').slice(0, 8);
  const out = name.replace(/\.(\w+)$/, `.${hash}.$1`);
  mkdirSync(join(OUT, 'assets'), { recursive: true });
  writeFileSync(join(OUT, 'assets', out), src);
  return `/assets/${out}`;
};
const CSS = asset('site.css');
const JS = asset('site.js');
cpSync(join(SRC, 'static'), OUT, { recursive: true });

/* ---------- helpers ---------- */
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = (n) => String(n).padStart(2, '0');
const ogKey = (path) => (path === '/' ? 'home' : path.replace(/^\/|\/$/g, '').replace(/\//g, '-'));
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const PERSON = { '@type': 'Person', '@id': `${SITE.url}/#keith`, name: 'Keith Vilani', url: `${SITE.url}/`, jobTitle: 'Founder and Chief Executive Officer',
  worksFor: { '@type': 'Organization', name: 'Digitalx', url: 'https://www.digitalxagency.io/' }, homeLocation: { '@type': 'Place', name: SITE.city } };
const ventureUrl = (v) => `/ventures/${v.slug}/`;
const workUrl = (w) => `/work/${w.slug}/`;
const split = ([a, b]) => `${esc(a)}<em>${esc(b)}</em>`;
const pages = [];

function layout({ path, title, description, scene = 'drift', body, crumbs, jsonld = [] }) {
  const url = SITE.url + path, og = `${SITE.url}/og/${ogKey(path)}.jpg`;
  const nav = NAV.map((n) => `<a href="${n.href}"${path.startsWith(n.href) ? ' aria-current="page"' : ''}>${n.label}</a>`).join('');
  const graph = [PERSON, ...jsonld];
  if (crumbs) graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', href: '/' }, ...crumbs].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: SITE.url + (c.href || path) })) });
  const crumbHtml = crumbs ? `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a>${crumbs.map((c) => `<span aria-hidden="true">/</span>${c.href ? `<a href="${c.href}">${esc(c.name)}</a>` : `<span aria-current="page">${esc(c.name)}</span>`}`).join('')}</nav>` : '';
  pages.push({ path, scene });
  return `<!doctype html>
<html lang="en-ZA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#0b0907">
<meta name="author" content="Keith Vilani">
<meta property="og:type" content="${path === '/' ? 'profile' : 'website'}">
<meta property="og:site_name" content="Keith Vilani">
<meta property="og:locale" content="en_ZA">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${og}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,100..900,0..100;1,9..144,100..900,0..100&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${CSS}">
<script>document.documentElement.classList.add('js');try{if(!sessionStorage.getItem('kv-seen')&&!/[?&]og\\b/.test(location.search))document.documentElement.classList.add('first')}catch(e){}</script>
${ld({ '@context': 'https://schema.org', '@graph': graph })}
</head>
<body data-scene="${scene}">
<a class="skip" href="#main">Skip to content</a>
<canvas id="field" aria-hidden="true"></canvas>
<canvas id="overlay" aria-hidden="true"></canvas>
<div class="grain" aria-hidden="true"></div>
<div class="vignette" aria-hidden="true"></div>
<div class="cursor" aria-hidden="true"></div>
<div class="cursor-ring" aria-hidden="true"><span></span></div>
<div id="loader" aria-hidden="true"><p class="loader-line">Every star is something I built</p><div class="loader-bar"><i id="loaderBar"></i></div></div>
<header class="site-header">
  <a href="/" class="brand" aria-label="Keith Vilani, home"><span class="brand-mark">KV</span><span>Keith Vilani<small>Founder &middot; Builder</small></span></a>
  <nav class="nav-right" aria-label="Main">
    <div class="nav-links">${nav}</div>
    <span class="clock" id="clock" title="Keith's local time in Cape Town">Cape Town</span>
    <button class="sound" id="sound" aria-pressed="false" aria-label="Toggle ambient sound"><i><b></b><b></b><b></b><b></b></i><span>Sound</span></button>
    <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="menu" aria-label="Menu"><i></i></button>
  </nav>
</header>
<nav class="menu" id="menu" aria-label="Menu" inert><a href="/"${path === '/' ? ' aria-current="page"' : ''}>Home</a>${nav}<p>${esc(SITE.email)} &middot; ${esc(SITE.phone)}</p></nav>
<main id="main">
${crumbs ? body.replace('<!--crumbs-->', crumbHtml) : body}
</main>
${footer()}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="${JS}" defer></script>
</body>
</html>
`;
}

function footer() {
  return `<footer data-scene="mono:KV">
  <div class="wrap">
    <div class="foot-cta">
      <div><p class="eyebrow" style="margin-bottom:18px">Say hello</p><a class="mail" href="mailto:${SITE.email}" data-cursor="Write">${SITE.email}</a></div>
      <a class="btn" href="tel:${SITE.phoneIntl}">${SITE.phone}</a>
    </div>
    <div class="foot-cols">
      <div><h2>Ventures</h2><ul>${VENTURES.map((v) => `<li><a href="${ventureUrl(v)}">${esc(v.name)}</a></li>`).join('')}</ul></div>
      <div><h2>Built for others</h2><ul>${WORK.map((w) => `<li><a href="${workUrl(w)}">${esc(w.name)}</a></li>`).join('')}</ul></div>
      <div><h2>Keith</h2><ul><li><a href="/about/">About</a></li><li><a href="/ventures/">All ventures</a></li><li><a href="/work/">All work</a></li><li><a href="/notes/">Leave a note</a></li><li><a href="/contact/">Contact</a></li></ul></div>
      <div><h2>Live sites</h2><ul>${VENTURES.filter((v) => v.url.startsWith('http')).map((v) => `<li><a href="${v.url}" target="_blank" rel="noopener">${esc(v.urlLabel)} ↗</a></li>`).join('')}</ul></div>
    </div>
    <div class="giant" aria-hidden="true">Keith Vilani.</div>
    <div class="foot-bar">
      <span>© ${new Date().getFullYear()} Keith Vilani. Cape Town, South Africa.</span>
      <span>Designed and built by <a href="https://www.digitalxagency.io/" target="_blank" rel="noopener">Digitalx</a></span>
    </div>
  </div>
</footer>`;
}

/* ---------- shared blocks ---------- */
const workList = (items = WORK) => `<ul class="work-list reveal">${items.map((w, i) => `
  <li><a href="${workUrl(w)}" data-hover-scene="mark:${w.mark}" data-cursor="Read"><span class="i">${pad(i + 1)}</span><span class="n">${esc(w.name)}</span><span class="s">${esc(w.short)}</span><span class="l">${esc(w.location)}</span><span class="a" aria-hidden="true">→</span></a></li>`).join('')}
</ul>`;

const visit = (v) => v.url ? `<a class="visit" href="${v.url}"${v.url.startsWith('http') ? ' target="_blank" rel="noopener"' : ''} data-cursor="Visit">${esc(v.urlLabel)} <span aria-hidden="true">↗</span></a>` : `<span class="soon">${esc(v.urlLabel)}</span>`;

function block(s) {
  const steps = /how it works|steps/i.test(s.h);
  const parts = [];
  (s.paras || []).forEach((p) => parts.push(`<p>${esc(p)}</p>`));
  if (s.items && s.items.length) parts.push(steps ? `<ol class="steps">${s.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ol>` : `<ul class="list">${s.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`);
  if (s.cards) parts.push(`<div class="cards">${s.cards.map(([h, p]) => `<div class="card"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('')}</div>`);
  if (s.chips && s.chips.length) parts.push(`<ul class="chips">${s.chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`);
  return `<section class="block reveal"><h2>${esc(s.h)}</h2><div class="body">${parts.join('')}</div></section>`;
}
const facts = (rows) => `<dl class="facts reveal">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;

const contactBlock = (headline = 'Let’s build what <em>outlives us.</em>') => `<section class="contact" id="contact" data-scene="tree">
    <div class="wrap">
      <div class="contact-top">
        <div><p class="eyebrow reveal">What's next</p><h2 class="display reveal" style="margin-top:22px">${headline}</h2></div>
        <div class="plant reveal">
          <button class="hold" id="hold" aria-label="Press and hold to plant your idea">
            <svg viewBox="0 0 148 148" aria-hidden="true"><circle class="track" cx="74" cy="74" r="72"/><circle class="prog" id="holdProg" cx="74" cy="74" r="72"/></svg>
            <span class="core">Hold</span>
          </button>
          <div class="plant-copy">
            <p id="plantHint">Every brand in this sky started as one idea. Press and hold to plant yours.</p>
            <div class="planted" id="planted" role="status"><em>Planted. Now let's grow it.</em><a class="btn" href="mailto:${SITE.email}?subject=Let%27s%20build%20something%2C%20Keith">Tell Keith about it</a></div>
          </div>
        </div>
      </div>
      <div class="doors">
        <a class="door" href="mailto:${SITE.email}?subject=New%20project" data-cursor="Build"><span class="d-num">01</span><div><h3>Build with me</h3><p>A brand, a website, a system or a whole business. Through Digitalx.</p></div><span class="arr" aria-hidden="true">→</span></a>
        <a class="door" href="/ventures/keith-vilani-foundation/" data-cursor="Give"><span class="d-num">02</span><div><h3>Back the cause</h3><p>Donate, volunteer or partner with the Keith Vilani Foundation.</p></div><span class="arr" aria-hidden="true">→</span></a>
        <a class="door" href="/ventures/go-ads/" data-cursor="Move"><span class="d-num">03</span><div><h3>Put your brand on the move</h3><p>Bikes, vehicles and fleets that carry your brand through the streets with Go Ads.</p></div><span class="arr" aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>`;

/* ---------- pages ---------- */
const html = {};

html['/'] = layout({
  path: '/', scene: 'constellation',
  title: 'Keith Vilani | Founder of Digitalx, Go Ads and the Keith Vilani Foundation',
  description: 'Keith Vilani is the Cape Town founder behind Digitalx, Go Ads, the Keith Vilani Foundation, SANA, GetClient and Advera, and the websites and systems Digitalx builds for businesses across South Africa.',
  jsonld: [{ '@type': 'WebSite', name: 'Keith Vilani', url: `${SITE.url}/` }],
  body: `
  <section class="hero" data-scene="constellation">
    <p class="hint" aria-hidden="true">Every star is something I built.<br>Hover to read the sky, click to visit.</p>
    <div class="wrap">
      <p class="eyebrow kicker">Founder &amp; CEO, Digitalx &middot; Cape Town</p>
      <h1 class="display" data-split aria-label="Keith Vilani"><span class="ln" aria-hidden="true">Keith</span><span class="ln" aria-hidden="true">Vilani.</span></h1>
      <div class="hero-foot">
        <p>I build <b>brands, products and movements</b>: a digital agency, a moving-billboard network, a foundation, a road-safety initiative, a verified business directory, an AI ad platform, and the websites and systems behind businesses across South Africa.</p>
        <a href="#count" class="scroll-cue"><i></i>Read the sky</a>
      </div>
    </div>
  </section>

  <section class="count" id="count" data-scene="big:12">
    <div class="count-sticky wrap">
      <div><p class="eyebrow reveal">One person</p><h2 class="display reveal" style="margin-top:22px">Twelve brands. <em>One builder.</em></h2></div>
      <div class="stats reveal" role="list">
        <div class="stat" role="listitem"><b data-count="12">12</b><span>Brands built</span></div>
        <div class="stat" role="listitem"><b data-count="${VENTURES.length}">${VENTURES.length}</b><span>Ventures founded</span></div>
        <div class="stat" role="listitem"><b data-count="6">6</b><span>Client brands built</span></div>
        <div class="stat" role="listitem"><b data-count="10000" data-suffix="+">10,000+</b><span>Lives touched by the Foundation</span></div>
      </div>
    </div>
  </section>

  <div class="marquee"><div class="marquee-track">${[0, 1].map((k) => [...VENTURES.map((v) => [v.name, ventureUrl(v)]), ...WORK.filter((w) => w.slug !== 'mbeki-healthcare-clinic-system').map((w) => [w.name, workUrl(w)])].map(([n, u]) => `<a href="${u}"${k ? ' tabindex="-1" aria-hidden="true"' : ''}>${esc(n)}</a>`).join('')).join('')}</div></div>

  <section class="manifesto" data-scene="drift">
    <div class="wrap">
      <p class="eyebrow reveal">Why I build</p>
      <p class="big" data-words style="margin-top:32px">Every business deserves to look, sell and grow like the biggest names. So I build the <em>systems</em> that make it possible, then I turn those same tools toward the people and places that need them most. Profit and <em>purpose,</em> built by the same hands.</p>
      <p class="sign reveal">Keith</p>
      <p class="reveal" style="margin-top:32px"><a class="visit" href="/about/">More about Keith <span aria-hidden="true">→</span></a></p>
    </div>
  </section>

  <section aria-labelledby="v-title">
    <div class="wrap section-head" data-scene="drift"><p class="eyebrow reveal">Founded</p><h2 class="display reveal" id="v-title" style="margin-top:22px">Six <em>ventures.</em></h2></div>
    <div class="wrap">${VENTURES.map((v, i) => `
      <article class="chapter" data-scene="${v.scene}">
        <div class="chapter-in reveal">
          <span class="num">${pad(i + 1)} / ${pad(VENTURES.length)}</span><span class="role">${esc(v.role)}</span>
          <h3 class="display"><a href="${ventureUrl(v)}">${split(v.split)}</a></h3>
          <p class="tagline">${esc(v.tagline)}</p>
          <p>${esc(v.short)}</p>
          <ul class="tags">${v.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <div class="metric"><div><b${v.metric.count ? ` data-count="${v.metric.count}" data-suffix="${v.metric.suffix}"` : ''}>${esc(v.metric.value)}</b><span>${esc(v.metric.label)}</span></div><div class="chapter-links"><a class="visit" href="${ventureUrl(v)}" data-cursor="Read">The story <span aria-hidden="true">→</span></a>${v.url.startsWith('http') ? visit(v) : ''}</div></div>
        </div>
      </article>`).join('')}
    </div>
  </section>

  <section class="work" data-scene="drift">
    <div class="wrap">
      <div class="work-head">
        <div><p class="eyebrow reveal">Built for others</p><h2 class="display reveal" style="margin-top:22px">Their names. <em>My hands.</em></h2></div>
        <p class="reveal">Brands built with Digitalx for founders across Cape Town and beyond. Hover or tap a name and watch the lights spell it out.</p>
      </div>
      ${workList()}
    </div>
  </section>

  <section class="wall" data-scene="drift">
    <div class="wrap">
      <p class="eyebrow reveal">The night sky</p>
      <h2 class="display reveal" style="margin-top:22px">Leave Keith <em>a light.</em></h2>
      <p class="wall-lead reveal">A thank-you, an idea, a word of encouragement. Write it, release it, and it joins the sky.</p>
      <p class="reveal" style="margin-top:28px"><a class="btn" href="/notes/">Open the night sky</a></p>
    </div>
  </section>

  <section class="yourstar" data-scene="dust">
    <div class="wrap">
      <p class="eyebrow reveal">Your turn</p>
      <h2 class="display reveal" style="margin-top:22px">Write your name <em>in the sky.</em></h2>
      <form class="star-form reveal" id="starForm" autocomplete="off">
        <label for="starName" class="sr">Your name</label>
        <input id="starName" name="name" maxlength="14" required placeholder="Your name">
        <button class="btn" type="submit">Light it</button>
      </form>
      <p class="star-note reveal" id="starNote">The lights will spell it, then it becomes a star in Keith's constellation, next to everything he has built. It stays on this device.</p>
    </div>
  </section>

  ${contactBlock()}`,
});

html['/about/'] = layout({
  path: '/about/', scene: 'mark:KV', crumbs: [{ name: 'About' }],
  title: 'About Keith Vilani | Founder and CEO of Digitalx, Cape Town',
  description: 'Who Keith Vilani is: the Cape Town founder and CEO of Digitalx, founder of Go Ads and the Keith Vilani Foundation, and the builder behind SANA, GetClient and Advera.',
  jsonld: [{ '@type': 'AboutPage', name: 'About Keith Vilani', url: `${SITE.url}/about/`, mainEntity: { '@id': `${SITE.url}/#keith` } }],
  body: `
  <section class="page-hero shape" data-scene="mark:KV">
    <div class="wrap"><div class="inner">
      <!--crumbs-->
      <p class="eyebrow">About</p>
      <h1 class="display">The builder <em>behind the sky.</em></h1>
      <p class="lead">Keith Vilani is the founder and CEO of Digitalx, the Cape Town agency that builds the systems businesses need to launch, operate and grow. He is also the founder of Go Ads and the Keith Vilani Foundation, and the person behind SANA, GetClient and Advera.</p>
      <div class="actions"><a class="btn" href="/ventures/">See the ventures</a><a class="visit" href="/contact/">Get in touch <span aria-hidden="true">→</span></a></div>
    </div></div>
  </section>
  <section class="manifesto" data-scene="drift"><div class="wrap">
    <p class="eyebrow reveal">Why I build</p>
    <p class="big" data-words style="margin-top:32px">Every business deserves to look, sell and grow like the biggest names. So I build the <em>systems</em> that make it possible, then I turn those same tools toward the people and places that need them most. Profit and <em>purpose,</em> built by the same hands.</p>
    <p class="sign reveal">Keith</p>
  </div></section>
  <section class="article" data-scene="dust"><div class="wrap">
    <section class="block reveal"><h2>Roles</h2><div class="body"><ul class="list">
      <li>Founder and Chief Executive Officer, <a href="/ventures/digitalx/">Digitalx</a></li>
      <li>Founder, <a href="/ventures/go-ads/">Go Ads</a></li>
      <li>Founder, <a href="/ventures/keith-vilani-foundation/">Keith Vilani Foundation</a></li>
      <li>Behind <a href="/ventures/sana/">SANA</a>, <a href="/ventures/getclient/">GetClient</a> and <a href="/ventures/advera/">Advera</a>, built through Digitalx</li>
    </ul></div></section>
    <section class="block reveal"><h2>How I work</h2><div class="body"><p>The same principles run through every brand on this site.</p></div></section>
    <ol class="principles reveal">${PRINCIPLES.map(([h, p]) => `<li><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join('')}</ol>
  </div></section>
  <section class="page-hero short shape" data-scene="mountain"><div class="wrap"><div class="inner reveal">
    <p class="eyebrow">Home base</p>
    <h2 class="display" style="font-size:clamp(48px,7vw,112px);margin:16px 0 22px">Built from <em>Cape Town.</em></h2>
    <p class="lead">Digitalx works from Kuils River. The brands it builds reach from Blackheath, Bellville and Blue Downs to King William's Town, Pretoria, Zimbabwe and readers around the world.</p>
  </div></div></section>
  ${contactBlock()}`,
});

html['/ventures/'] = layout({
  path: '/ventures/', scene: 'constellation', crumbs: [{ name: 'Ventures' }],
  title: 'Ventures | Digitalx, Go Ads, Keith Vilani Foundation, SANA, GetClient, Advera',
  description: 'The six ventures Keith Vilani has founded or built: Digitalx, Go Ads, the Keith Vilani Foundation, SANA, GetClient and Advera.',
  jsonld: [{ '@type': 'CollectionPage', name: 'Ventures', url: `${SITE.url}/ventures/` }],
  body: `
  <section class="page-hero short" data-scene="constellation"><div class="wrap"><div class="inner">
    <!--crumbs-->
    <p class="eyebrow">Founded</p>
    <h1 class="display">Six <em>ventures.</em></h1>
    <p class="lead">A digital agency at the centre, and the businesses, products and causes it made possible. Hover a card and the lights take its shape.</p>
  </div></div></section>
  <section class="article" data-scene="dust"><div class="wrap">
    <div class="v-grid">${VENTURES.map((v) => `
      <a class="v-card reveal" href="${ventureUrl(v)}" data-hover-scene="${v.scene}" data-cursor="Open">
        <span class="role">${esc(v.role)}</span>
        <div><h3>${split(v.split)}</h3><p>${esc(v.short)}</p></div>
        <span class="go">The story →</span>
      </a>`).join('')}
    </div>
  </div></section>
  ${contactBlock()}`,
});

VENTURES.forEach((v, i) => {
  const next = VENTURES[(i + 1) % VENTURES.length];
  const path = ventureUrl(v);
  const extra = v.slug === 'digitalx' ? `<section class="block reveal"><h2>Built by Digitalx</h2><div class="body"><p>Client brands Keith's team has designed, built and still looks after.</p></div></section>${workList()}` : '';
  const stats = v.stats ? `<div class="stats reveal" role="list" style="margin-top:8vh">${v.stats.map(([n, s, l]) => `<div class="stat" role="listitem"><b data-count="${n}" data-suffix="${s}">${Number(n).toLocaleString('en-ZA').replace(/\s/g, ',')}${s}</b><span>${esc(l)}</span></div>`).join('')}</div>` : '';
  html[path] = layout({
    path, scene: v.scene, crumbs: [{ name: 'Ventures', href: '/ventures/' }, { name: v.name }],
    title: `${v.name} | ${v.tagline.split('.')[0]} | Keith Vilani`,
    description: `${v.lead}`.slice(0, 158).replace(/\s\S*$/, '') + '.',
    jsonld: [{ '@type': v.slug === 'keith-vilani-foundation' ? 'NGO' : 'Organization', name: v.name, ...(v.url.startsWith('http') ? { url: v.url } : {}), description: v.short, slogan: v.tagline, founder: { '@id': `${SITE.url}/#keith` } }],
    body: `
  <section class="page-hero shape" data-scene="${v.scene}"><div class="wrap"><div class="inner">
    <!--crumbs-->
    <span class="num">${pad(i + 1)} / ${pad(VENTURES.length)}</span><span class="role">${esc(v.role)}</span>
    <h1 class="display">${split(v.split)}</h1>
    <p class="tagline">${esc(v.tagline)}</p>
    <p class="lead">${esc(v.lead)}</p>
    <ul class="tags">${v.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    <div class="actions">${v.url ? (v.url.startsWith('http') ? `<a class="btn" href="${v.url}" target="_blank" rel="noopener">Visit ${esc(v.urlLabel)}</a>` : `<a class="btn" href="${v.url}">${esc(v.urlLabel)}</a>`) : `<span class="soon">${esc(v.urlLabel)}</span>`}<a class="visit" href="/ventures/">All ventures <span aria-hidden="true">→</span></a></div>
  </div></div></section>
  <section class="article" data-scene="dust"><div class="wrap">
    ${facts(v.facts)}${stats}
    <div style="margin-top:8vh">${v.sections.map(block).join('')}${extra}</div>
    <a class="next" href="${ventureUrl(next)}" data-hover-scene="${next.scene}" data-cursor="Next"><small>Next venture</small><strong>${esc(next.name)} →</strong></a>
  </div></section>`,
  });
});

html['/work/'] = layout({
  path: '/work/', scene: 'drift', crumbs: [{ name: 'Work' }],
  title: 'Work | Brands Keith Vilani has built with Digitalx',
  description: 'Websites and systems Keith Vilani and Digitalx have built for Mbeki Healthcare, TechStep Academy, Unique Holistic, Delight Aluminum, VisaEase and author Kelvin Tadiwanashe.',
  jsonld: [{ '@type': 'CollectionPage', name: 'Work', url: `${SITE.url}/work/` }],
  body: `
  <section class="page-hero short" data-scene="drift"><div class="wrap"><div class="inner">
    <!--crumbs-->
    <p class="eyebrow">Built for others</p>
    <h1 class="display">Their names. <em>My hands.</em></h1>
    <p class="lead">Six client brands, seven builds, all designed, built and looked after through Digitalx. Hover or tap a name and the lights spell it out.</p>
  </div></div></section>
  <section class="article" data-scene="dust"><div class="wrap">${workList()}</div></section>
  ${contactBlock()}`,
});

WORK.forEach((w, i) => {
  const next = WORK[(i + 1) % WORK.length];
  const path = workUrl(w);
  html[path] = layout({
    path, scene: `mark:${w.mark}`, crumbs: [{ name: 'Work', href: '/work/' }, { name: w.name }],
    title: `${w.name} | ${w.scope} by Keith Vilani and Digitalx`,
    description: `${w.summary} ${w.tagline}.`.slice(0, 158).replace(/\s\S*$/, '') + '.',
    jsonld: [{ '@type': 'CreativeWork', name: `${w.fullName}: ${w.scope}`, description: w.summary, creator: { '@id': `${SITE.url}/#keith` }, ...(w.live ? { url: w.live } : {}) }],
    body: `
  <section class="page-hero shape" data-scene="mark:${w.mark}"><div class="wrap"><div class="inner">
    <!--crumbs-->
    <span class="num">${pad(i + 1)} / ${pad(WORK.length)}</span><span class="role">${esc(w.sector)}</span>
    <h1 class="display">${esc(w.name)}</h1>
    <p class="tagline">${esc(w.tagline)}</p>
    <p class="lead">${esc(w.summary)}</p>
    <div class="actions">${w.live ? `<a class="btn" href="${w.live}" target="_blank" rel="noopener">Visit the live site</a>` : '<span class="soon">Private system for staff</span>'}<a class="visit" href="/work/">All work <span aria-hidden="true">→</span></a></div>
  </div></div></section>
  <section class="article" data-scene="dust"><div class="wrap">
    ${facts([['Sector', w.sector], ['Where', w.location], ['What', w.scope]])}
    <div style="margin-top:8vh">${w.sections.map(block).join('')}</div>
    <a class="next" href="${workUrl(next)}" data-hover-scene="mark:${next.mark}" data-cursor="Next"><small>Next project</small><strong>${esc(next.name)} →</strong></a>
  </div></section>`,
  });
});

html['/notes/'] = layout({
  path: '/notes/', scene: 'drift', crumbs: [{ name: 'Notes' }],
  title: 'Leave Keith a light | Notes for Keith Vilani',
  description: 'Leave Keith Vilani a note: a thank-you, an idea or a word of encouragement. Release it and it joins the night sky.',
  body: `
  <section class="wall" data-scene="drift" style="padding-top:140px"><div class="wrap">
    <!--crumbs-->
    <p class="eyebrow">The night sky</p>
    <h1 class="display" style="font-size:clamp(48px,8vw,128px);margin-top:22px;max-width:11ch">Leave Keith <em>a light.</em></h1>
    <p class="wall-lead">A thank-you, an idea, a word of encouragement. Write it, release it, and it joins the sky.</p>
    <div class="sky" id="sky">
      <span class="sky-count" id="skyCount">Lights in the sky</span>
      <form class="note-form" id="noteForm" name="notes" method="POST" data-netlify="true" netlify-honeypot="bot-field" autocomplete="off">
        <input type="hidden" name="form-name" value="notes">
        <p class="sr"><label>Leave empty <input name="bot-field" tabindex="-1"></label></p>
        <label for="note" class="sr">Your note</label>
        <input id="note" name="note" maxlength="120" required placeholder="Keith, the site you built for us...">
        <button class="btn" type="submit">Release</button>
      </form>
    </div>
  </div></section>`,
});

html['/contact/'] = layout({
  path: '/contact/', scene: 'tree', crumbs: [{ name: 'Contact' }],
  title: 'Contact Keith Vilani | Build, partner or back the cause',
  description: `Contact Keith Vilani to build a brand, website or system through Digitalx, advertise with Go Ads or support the Keith Vilani Foundation. ${SITE.email}, ${SITE.phone}.`,
  jsonld: [{ '@type': 'ContactPage', name: 'Contact Keith Vilani', url: `${SITE.url}/contact/` }],
  body: `
  <section class="page-hero short" data-scene="tree" style="min-height:auto;padding-bottom:0"><div class="wrap"><div class="inner">
    <!--crumbs-->
    <p class="eyebrow">Contact</p>
    <h1 class="display">Let's <em>talk.</em></h1>
    <p class="lead">Email <a class="visit" href="mailto:${SITE.email}">${SITE.email}</a> or call <a class="visit" href="tel:${SITE.phoneIntl}">${SITE.phone}</a>. For the Foundation, write to <a class="visit" href="mailto:${SITE.foundationEmail}">${SITE.foundationEmail}</a>.</p>
  </div></div></section>
  ${contactBlock('Plant something that <em>outlives us.</em>')}`,
});

/* ---------- write pages ---------- */
for (const [path, out] of Object.entries(html)) {
  const file = join(OUT, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, out);
}
// 404 lives at the root as a file (served by the host's error handler)
writeFileSync(join(OUT, '404.html'), layout({
  path: '/404/', scene: 'mark:404', title: 'Not found | Keith Vilani', description: 'This star has not been born yet.',
  body: `<section class="page-hero" data-scene="mark:404" style="align-items:flex-end"><div class="wrap"><div class="inner">
    <p class="eyebrow">404</p><h1 class="display">This star hasn't <em>been born yet.</em></h1>
    <p class="lead">The page you were looking for isn't in this sky. Head back and pick another light.</p>
    <div class="actions"><a class="btn" href="/">Back to the sky</a><a class="visit" href="/ventures/">Ventures <span aria-hidden="true">→</span></a></div>
  </div></div></section>`,
}).replace('<link rel="canonical" href="https://keithvilani.co.za/404/">', '<meta name="robots" content="noindex">'));
pages.pop();

writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(html).map((p) => `  <url><loc>${SITE.url}${p}</loc><lastmod>${TODAY}</lastmod><priority>${p === '/' ? '1.0' : p.split('/').length > 3 ? '0.7' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
writeFileSync(new URL('./tools/pages.json', import.meta.url), JSON.stringify(Object.keys(html)));
console.log(`Built ${Object.keys(html).length} pages + 404 into public/`);
