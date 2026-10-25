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
const RING = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="7 4.6"/></svg>';
const ext = (url) => url.startsWith('http') ? ' target="_blank" rel="noopener"' : '';

function layout({ path, title, description, body, crumbs, jsonld = [] }) {
  const url = SITE.url + path, og = `${SITE.url}/og/${ogKey(path)}.jpg`;
  const items = [{ href: '/', label: 'Statement' }, ...NAV.filter((n) => n.href !== '/notes/')];
  const cur = (h) => (h === '/' ? path === '/' : path.startsWith(h)) ? ' aria-current="page"' : '';
  const pill = items.map((n) => `<a href="${n.href}"${cur(n.href)}>${n.label}</a>`).join('');
  const menu = [...items, { href: '/notes/', label: 'Notes' }].map((n) => `<a href="${n.href}"${cur(n.href)}>${n.label.toLowerCase()}</a>`).join('');
  const graph = [PERSON, ...jsonld];
  if (crumbs) graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', href: '/' }, ...crumbs].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: SITE.url + (c.href || path) })) });
  const crumbHtml = crumbs ? `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Index</a>${crumbs.map((c) => `<span aria-hidden="true">/</span>${c.href ? `<a href="${c.href}">${esc(c.name)}</a>` : `<span aria-current="page">${esc(c.name)}</span>`}`).join('')}</nav>` : '';
  return `<!doctype html>
<html lang="en-ZA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#050505">
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
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${CSS}">
<script>document.documentElement.classList.add('js')</script>
${ld({ '@context': 'https://schema.org', '@graph': graph })}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div id="wall" aria-hidden="true"></div>
<header class="site-header">
  <a href="/" class="logo" aria-label="Keith Vilani, home"><span class="tab">${RING}</span><span class="word">keith vilani</span></a>
  <nav class="pill" aria-label="Main">${pill}<button class="wall-btn" type="button" data-wallpaper style="padding:9px 18px;border-radius:999px;font-size:13px"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="2" width="14" height="20" rx="3"/><path d="M5 16l4-4 3 3 2-2 5 5"/></svg>Wallpaper</button></nav>
  <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="menu">Menu</button>
</header>
<nav class="menu" id="menu" aria-label="Menu" inert>${menu}<button class="wall-btn" type="button" data-wallpaper><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="2" width="14" height="20" rx="3"/><path d="M5 16l4-4 3 3 2-2 5 5"/></svg>Use my wallpaper</button><p>${esc(SITE.email)} · ${esc(SITE.phone)}</p></nav>
<main id="main">
${crumbs ? body.replace('<!--crumbs-->', crumbHtml) : body}
</main>
${footer()}
<div class="wall-hint" id="wallHint" role="dialog" aria-label="Use your wallpaper"><span>This site wears your <span data-device-name>device</span>. Make it yours?</span><button class="btn" type="button" data-wallpaper>Use my wallpaper</button><button class="x" id="wallHintClose" type="button" aria-label="Dismiss">×</button></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="${JS}" defer></script>
</body>
</html>
`;
}

function footer() {
  return `<footer>
  <div class="wrap">
    <div class="foot">
      <div><h2>The statement</h2><p class="say">Talent is everywhere. <span class="o">Opportunity isn’t.</span></p><p style="margin-top:24px"><a class="link" href="mailto:${SITE.email}">${SITE.email}</a></p></div>
      <div><h2>Ventures</h2><ul>${VENTURES.map((v) => `<li><a href="${ventureUrl(v)}">${esc(v.name)}</a></li>`).join('')}</ul></div>
      <div><h2>Work</h2><ul>${WORK.map((w) => `<li><a href="${workUrl(w)}">${esc(w.name)}</a></li>`).join('')}</ul></div>
      <div><h2>Index</h2><ul><li><a href="/about/">About</a></li><li><a href="/ventures/">Ventures</a></li><li><a href="/work/">Work</a></li><li><a href="/notes/">Notes</a></li><li><a href="/contact/">Contact</a></li></ul></div>
    </div>
    <div class="foot-bar"><span>© ${new Date().getFullYear()} Keith Vilani</span><span>Cape Town, South Africa</span><span>Built by <a href="https://www.digitalxagency.io/" target="_blank" rel="noopener">Digitalx</a></span></div>
  </div>
</footer>`;
}

/* ---------- shared blocks ---------- */
const rows = (items = WORK) => `<ul class="rows reveal">${items.map((w, i) => `
  <li><a href="${workUrl(w)}" data-hover-form="orb"><span class="idx">${pad(i + 1)}</span><span class="n">${esc(w.name)}</span><span class="s">${esc(w.short)}</span><span class="l">${esc(w.location)}</span><span class="a" aria-hidden="true">→</span></a></li>`).join('')}
</ul>`;

function block(s) {
  const steps = /how it works|steps/i.test(s.h);
  const parts = [];
  (s.paras || []).forEach((p) => parts.push(`<p>${esc(p)}</p>`));
  if (s.items && s.items.length) parts.push(steps ? `<ol class="steps">${s.items.map((i) => `<li><span>${esc(i)}</span></li>`).join('')}</ol>` : `<ul class="list">${s.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`);
  if (s.cards) parts.push(`<div class="tiles">${s.cards.map(([h, p]) => `<div class="tile"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('')}</div>`);
  if (s.chips && s.chips.length) parts.push(`<ul class="chips">${s.chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`);
  return `<section class="block reveal"><h2>${esc(s.h)}</h2><div class="body">${parts.join('')}</div></section>`;
}
const facts = (r) => `<dl class="facts reveal">${r.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;

const closing = (h = 'let’s build the <em>bridge.</em>') => `<section class="closing">
    <div class="wrap">
      <p class="label reveal">What’s next</p>
      <h2 class="reveal" style="margin-top:20px">${h}</h2>
      <p class="lead reveal">Build a business with Digitalx, put a brand on the move with Go Ads, or help a young South African cross with the Foundation.</p>
      <div class="cta reveal"><a class="btn" href="mailto:${SITE.email}?subject=Let%27s%20build%20the%20bridge">${SITE.email}</a><a class="btn ghost" href="tel:${SITE.phoneIntl}">${SITE.phone}</a></div>
      <ul class="doors reveal">
        <li><a href="mailto:${SITE.email}?subject=New%20project"><span class="idx">01</span><strong>Build with me</strong><span class="p">A brand, a website, a system or a whole business.</span><span class="a" aria-hidden="true">→</span></a></li>
        <li><a href="/ventures/go-ads/"><span class="idx">02</span><strong>Put your brand on the move</strong><span class="p">Bikes, vehicles and fleets with Go Ads.</span><span class="a" aria-hidden="true">→</span></a></li>
        <li><a href="/ventures/keith-vilani-foundation/"><span class="idx">03</span><strong>Back the cause</strong><span class="p">Donate, volunteer or partner with the Foundation.</span><span class="a" aria-hidden="true">→</span></a></li>
      </ul>
    </div>
  </section>`;

const html = {};

/* ---------- home ---------- */
const VC = { digitalx: ['#ff8a3d', '#c8251a', '#6a1fd0'], heart: ['#ff5a4a', '#ff9a5a', '#8a1f3a'], shield: ['#ffc24a', '#ff6a2b', '#2a1a0a'], badge: ['#ff8a3d', '#ffd08a', '#3a2acc'], billboard: ['#ff6a2b', '#c8251a', '#ffb36b'], spark: ['#b06bff', '#ff7a3a', '#2a0f55'] };
const BRIDGE = [['Digitalx', 'businesses online'], ['Go Ads', 'brands on the street'], ['GetClient', 'trust you can check'], ['SANA', 'safer roads home'], ['The Foundation', 'students, skills, health'], ['Advera', 'AI ads for the small guy']];
const SHARE_URL = encodeURIComponent(`${SITE.url}/`), SHARE_TXT = encodeURIComponent('Talent is everywhere. Opportunity isn’t.');

html['/'] = layout({
  path: '/',
  title: 'Keith Vilani | Talent is everywhere. Opportunity isn’t.',
  description: 'Keith Vilani builds the bridge between South African talent and opportunity: Digitalx, Go Ads, the Keith Vilani Foundation, SANA, GetClient and Advera. A personal statement from Cape Town.',
  jsonld: [{ '@type': 'WebSite', name: 'Keith Vilani', url: `${SITE.url}/` }],
  body: `
  <section class="hero" id="top" aria-labelledby="statement">
    <div class="wrap">
      <h1 class="stage" id="statement" aria-label="Talent is everywhere. Opportunity isn’t.">
        <span class="small-top" aria-hidden="true">talent is</span>
        <span class="word-xl" aria-hidden="true">everywhere.</span>
        <span class="small-bot" aria-hidden="true">opportunity isn’t.</span>
      </h1>
      <canvas id="orb" aria-hidden="true"></canvas>
      <div class="hero-row">
        <div class="arch">
          <div class="art"></div><i class="dot" aria-hidden="true"></i>
          <b>47%</b>
          <span>of young South Africans who want work can’t find it.</span>
          <small>Stats SA, Q2 2026 · ages 15–34</small>
        </div>
        <a class="scroll-cue" href="#who"><i></i>scroll</a>
        <div class="hero-copy">
          <span class="ring">${RING}</span>
          <p>I’m Keith Vilani. I build the bridges between South African talent and the opportunities it deserves.</p>
          <a class="btn" href="#bridge">build the bridge</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="who">
    <div class="wrap who">
      <h2 class="reveal"><span class="o">who</span>i am</h2>
      <div class="who-copy reveal">
        <span class="thumb" aria-hidden="true"></span>
        <p>Founder and CEO of <a class="link" href="/ventures/digitalx/">Digitalx</a>. Founder of <a class="link" href="/ventures/go-ads/">Go Ads</a> and the <a class="link" href="/ventures/keith-vilani-foundation/">Keith Vilani Foundation</a>. The person behind SANA, GetClient and Advera. Building from Cape Town.</p>
        <ul class="chips"><li><b>06</b>ventures</li><li><b>06</b>client brands</li><li><b>10,000+</b>lives touched</li></ul>
      </div>
    </div>
  </section>

  <section class="section" id="fact" aria-labelledby="fact-title">
    <div class="wrap">
      <div class="fact">
        <div class="reveal">
          <p class="label">The number that keeps me building</p>
          <h2 id="fact-title" style="margin-top:18px">out of every <span class="o">100</span> young South Africans who want a job…</h2>
          <div class="count"><b id="factNum">47</b><span>can’t find one.</span></div>
          <p class="src">Youth (15–34) unemployment, 47.4%. <a href="https://www.statssa.gov.za/?p=19804" target="_blank" rel="noopener">Stats SA, Quarterly Labour Force Survey, Q2 2026</a>.</p>
          <button class="btn ghost again" id="factAgain" type="button">watch again</button>
        </div>
        <div class="people reveal" id="people" data-out="47" role="img" aria-label="100 dots: 47 go dark, one for every young South African in a hundred who wants work and can't find it."></div>
      </div>
      <p class="after reveal">talent isn’t the problem. <span class="o">access is.</span></p>
    </div>
  </section>

  <section class="section" id="bridge" aria-labelledby="bridge-title">
    <div class="wrap">
      <div class="bridge-head">
        <h2 class="sec-title reveal" id="bridge-title">so i build <em>bridges.</em></h2>
        <p class="label reveal">Drag across the gap.<br>Every plank is something I started.</p>
      </div>
      <div class="bridge reveal">
        <div class="planks" aria-hidden="true">${BRIDGE.map(([n, t]) => `<div class="plank"><b>${n}</b><span>${t}</span></div>`).join('')}</div>
        <div class="banks"><span>talent</span><span>opportunity</span></div>
        <div class="deck" aria-hidden="true">${BRIDGE.map(() => '<i></i>').join('')}</div>
        <div class="slider"><span class="hint">drag →</span><label for="bridgeRange" class="sr">Build the bridge</label><input id="bridgeRange" type="range" min="0" max="100" value="0" step="1"></div>
        <p class="built" id="built" role="status">bridge built. <span class="o">now cross it ↓</span></p>
      </div>
    </div>
  </section>

  <section class="section" id="ventures" aria-labelledby="v-title" style="padding-top:6vh">
    <div class="wrap rail-head">
      <h2 class="sec-title reveal" id="v-title">six <em>bridges</em></h2>
      <div class="rail-nav"><button id="railPrev" aria-label="Previous venture">←</button><button id="railNext" aria-label="Next venture">→</button></div>
    </div>
    <div class="rail" id="rail">${VENTURES.map((v, i) => { const [c1, c2, c3] = VC[v.scene] || VC.digitalx; return `
      <a class="vcard" href="${ventureUrl(v)}" style="--c1:${c1};--c2:${c2};--c3:${c3}">
        <div class="art"><b>${esc(v.name.replace(/^The /, '').replace('Keith Vilani ', '')[0])}</b></div>
        <div class="meta"><span>${pad(i + 1)}</span><span>${esc(v.role)}</span></div>
        <h3>${esc(v.name)}</h3>
        <p>${esc(v.tagline)}</p>
        <span class="go">the story →</span>
      </a>`; }).join('')}<span class="rail-pad"></span>
    </div>
  </section>

  <section class="section" aria-labelledby="w-title">
    <div class="wrap">
      <div class="section-top"><h2 class="sec-title reveal" id="w-title">built for <em>others</em></h2><p class="reveal">Brands designed, built and looked after with Digitalx, for founders across Cape Town and beyond.</p></div>
      ${rows()}
    </div>
  </section>

  <section class="section" id="share" aria-labelledby="s-title">
    <div class="wrap share">
      <div class="poster-wrap reveal"><canvas id="poster" role="img" aria-label="A poster that reads: talent is everywhere, opportunity isn't, signed with your name."></canvas></div>
      <div class="reveal">
        <p class="label">Your turn</p>
        <h2 class="sec-title" id="s-title" style="margin-top:16px">make it <em>yours.</em></h2>
        <p style="margin-top:22px;color:#d9d4cd;max-width:40ch">Sign the sentence and post it. If you believe talent is everywhere, say so where people can see it.</p>
        <form class="share-form" onsubmit="return false">
          <div class="field"><label class="label" for="posterName">Your name</label><input id="posterName" maxlength="28" autocomplete="given-name" placeholder="Thandi"></div>
          <div class="field"><label class="label" for="posterCity">Your city</label><input id="posterCity" maxlength="28" autocomplete="address-level2" placeholder="Durban"></div>
          <div class="share-actions"><button class="btn" id="posterShare" type="button">share the poster</button><button class="btn ghost" id="posterDownload" type="button">download</button></div>
        </form>
        <div class="quick"><a href="https://wa.me/?text=${SHARE_TXT}%20${SHARE_URL}" target="_blank" rel="noopener">WhatsApp</a><a href="https://twitter.com/intent/tweet?text=${SHARE_TXT}&url=${SHARE_URL}" target="_blank" rel="noopener">X</a><a href="https://www.linkedin.com/sharing/share-offsite/?url=${SHARE_URL}" target="_blank" rel="noopener">LinkedIn</a><a href="https://www.facebook.com/sharer/sharer.php?u=${SHARE_URL}" target="_blank" rel="noopener">Facebook</a></div>
      </div>
    </div>
  </section>

  <section class="section" id="wallpaper" aria-labelledby="wp-title">
    <div class="wrap wall-panel">
      <div class="reveal">
        <p class="label">Look behind the words</p>
        <h2 class="sec-title" id="wp-title" style="margin-top:16px">this site wears <em>your</em> screen.</h2>
        <p style="margin-top:22px;color:#d9d4cd;max-width:42ch">You’re seeing a wallpaper made for your <span data-device-name>device</span>. Choose the photo you use as your wallpaper and every page here becomes yours, colours and all. It never leaves your phone.</p>
        <div class="wall-actions"><button class="btn" type="button" data-wallpaper>use my wallpaper</button><button class="btn ghost" type="button" data-wallpaper-reset>reset</button></div>
      </div>
      <div class="phone reveal" aria-hidden="true"><div class="scr" id="wallMirror"></div><small>Talent is everywhere.</small><b id="phoneClock">09:41</b></div>
    </div>
  </section>

  ${closing()}`,
});

/* ---------- about ---------- */
html['/about/'] = layout({
  path: '/about/', crumbs: [{ name: 'About' }],
  title: 'About Keith Vilani | Founder and CEO of Digitalx, Cape Town',
  description: 'Who Keith Vilani is: the Cape Town founder and CEO of Digitalx, founder of Go Ads and the Keith Vilani Foundation, and the builder behind SANA, GetClient and Advera.',
  jsonld: [{ '@type': 'AboutPage', name: 'About Keith Vilani', url: `${SITE.url}/about/`, mainEntity: { '@id': `${SITE.url}/#keith` } }],
  body: `
  <section class="page-hero shape" data-form="liquid" data-pos="right"><div class="wrap"><div class="inner">
    <!--crumbs-->
    <h1>The builder <em>behind it</em></h1>
    <p class="lead">Keith Vilani is the founder and CEO of Digitalx, the Cape Town agency that builds the systems businesses need to launch, operate and grow. He also founded Go Ads and the Keith Vilani Foundation, and is the person behind SANA, GetClient and Advera.</p>
  </div></div></section>
  <section class="statement" data-form="orb" data-pos="corner"><div class="wrap">
    <p class="label reveal">Why</p>
    <p class="big" data-words style="margin-top:28px">Every business deserves to look, sell and grow like the biggest names. So I build the <em>systems</em> that make it possible, then turn the same tools toward the people who need them most. Profit and <em>purpose,</em> built by the same hands.</p>
  </div></section>
  <section class="article" data-form="orb" data-pos="corner"><div class="wrap">
    <section class="block reveal"><h2>Roles</h2><div class="body"><ul class="list">
      <li>Founder and Chief Executive Officer, <a class="link" href="/ventures/digitalx/">Digitalx</a></li>
      <li>Founder, <a class="link" href="/ventures/go-ads/">Go Ads</a></li>
      <li>Founder, <a class="link" href="/ventures/keith-vilani-foundation/">Keith Vilani Foundation</a></li>
      <li>Behind <a class="link" href="/ventures/sana/">SANA</a>, <a class="link" href="/ventures/getclient/">GetClient</a> and <a class="link" href="/ventures/advera/">Advera</a>, built through Digitalx</li>
    </ul></div></section>
    <section class="block reveal" style="border-bottom:0"><h2>How I work</h2><div class="body"><p>The same five principles run through every brand on this site.</p></div></section>
    <ol class="principles reveal">${PRINCIPLES.map(([h, p]) => `<li><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join('')}</ol>
  </div></section>
  <section class="page-hero short" data-form="mountain" data-pos="right"><div class="wrap"><div class="inner reveal">
    <p class="label">Home base</p>
    <h2 class="sec-title" style="margin:20px 0 22px">Built from <em>Cape Town</em></h2>
    <p class="lead">Digitalx works from Kuils River. The brands it builds reach from Blackheath, Bellville and Blue Downs to King William's Town, Pretoria, Zimbabwe and readers around the world.</p>
  </div></div></section>
  ${closing()}`,
});

/* ---------- ventures ---------- */
html['/ventures/'] = layout({
  path: '/ventures/', crumbs: [{ name: 'Ventures' }],
  title: 'Ventures | Digitalx, Go Ads, Keith Vilani Foundation, SANA, GetClient, Advera',
  description: 'The six ventures Keith Vilani has founded or built: Digitalx, Go Ads, the Keith Vilani Foundation, SANA, GetClient and Advera.',
  jsonld: [{ '@type': 'CollectionPage', name: 'Ventures', url: `${SITE.url}/ventures/` }],
  body: `
  <section class="page-hero short" data-form="liquid" data-pos="right"><div class="wrap"><div class="inner">
    <!--crumbs-->
    <h1>Six <em>ventures</em></h1>
    <p class="lead">A digital agency at the centre, and the businesses, products and causes it made possible. Hover one and the form becomes it.</p>
  </div></div></section>
  <section class="article" data-form="liquid" data-pos="right"><div class="wrap">
    <div class="cards">${VENTURES.map((v, i) => `
      <a class="card reveal" href="${ventureUrl(v)}" data-hover-form="${v.scene}">
        <span class="idx">${pad(i + 1)} · ${esc(v.role)}</span>
        <div><h3>${esc(v.name)}</h3><p>${esc(v.short)}</p></div>
        <span class="link">The story →</span>
      </a>`).join('')}
    </div>
  </div></section>
  ${closing()}`,
});

VENTURES.forEach((v, i) => {
  const next = VENTURES[(i + 1) % VENTURES.length], path = ventureUrl(v);
  const extra = v.slug === 'digitalx' ? `<section class="block reveal" style="border-bottom:0"><h2>Built by Digitalx</h2><div class="body"><p>Client brands Keith's team designed, built and still looks after.</p></div></section>${rows()}` : '';
  const stats = v.stats ? `<div class="stats reveal">${v.stats.map(([n, s, l]) => `<div><b>${Number(n).toLocaleString('en-ZA').replace(/\s/g, ',')}${s}</b><span>${esc(l)}</span></div>`).join('')}</div>` : '';
  html[path] = layout({
    path, crumbs: [{ name: 'Ventures', href: '/ventures/' }, { name: v.name }],
    title: `${v.name} | ${v.tagline.split('.')[0]} | Keith Vilani`,
    description: v.lead.slice(0, 158).replace(/\s\S*$/, '') + '.',
    jsonld: [{ '@type': v.slug === 'keith-vilani-foundation' ? 'NGO' : 'Organization', name: v.name, ...(v.url.startsWith('http') ? { url: v.url } : {}), description: v.short, slogan: v.tagline, founder: { '@id': `${SITE.url}/#keith` } }],
    body: `
  <section class="page-hero shape" data-form="${v.scene}" data-pos="right"><div class="wrap"><div class="inner">
    <!--crumbs-->
    <h1>${esc(v.name)}</h1>
    <p class="tag">${esc(v.tagline)}</p>
    <p class="lead">${esc(v.lead)}</p>
    <div class="actions">${v.url ? `<a class="btn" href="${v.url}"${ext(v.url)}>${v.url.startsWith('http') ? 'Visit ' : ''}${esc(v.urlLabel)}</a>` : `<span class="label">${esc(v.urlLabel)}</span>`}<span class="label">${esc(v.role)}</span></div>
  </div></div></section>
  <section class="article" data-form="${v.scene}" data-pos="corner"><div class="wrap">
    ${facts(v.facts)}${stats}
    ${v.sections.map(block).join('')}${extra}
    <a class="next" href="${ventureUrl(next)}" data-hover-form="${next.scene}"><span class="idx">Next venture</span><strong>${esc(next.name)}</strong></a>
  </div></section>`,
  });
});

/* ---------- work ---------- */
html['/work/'] = layout({
  path: '/work/', crumbs: [{ name: 'Work' }],
  title: 'Work | Brands Keith Vilani has built with Digitalx',
  description: 'Websites and systems Keith Vilani and Digitalx have built for Mbeki Healthcare, TechStep Academy, Unique Holistic, Delight Aluminum, VisaEase and author Kelvin Tadiwanashe.',
  jsonld: [{ '@type': 'CollectionPage', name: 'Work', url: `${SITE.url}/work/` }],
  body: `
  <section class="page-hero short" data-form="pebbles" data-pos="right"><div class="wrap"><div class="inner">
    <!--crumbs-->
    <h1>Built for <em>others</em></h1>
    <p class="lead">Six client brands, seven builds, all designed, built and looked after through Digitalx.</p>
  </div></div></section>
  <section class="article" data-form="orb" data-pos="corner"><div class="wrap">${rows()}</div></section>
  ${closing()}`,
});

WORK.forEach((w, i) => {
  const next = WORK[(i + 1) % WORK.length], path = workUrl(w);
  html[path] = layout({
    path, crumbs: [{ name: 'Work', href: '/work/' }, { name: w.name }],
    title: `${w.name} | ${w.scope} by Keith Vilani and Digitalx`,
    description: `${w.summary} ${w.tagline}.`.slice(0, 158).replace(/\s\S*$/, '') + '.',
    jsonld: [{ '@type': 'CreativeWork', name: `${w.fullName}: ${w.scope}`, description: w.summary, creator: { '@id': `${SITE.url}/#keith` }, ...(w.live ? { url: w.live } : {}) }],
    body: `
  <section class="page-hero short" data-form="pebbles" data-pos="right"><div class="wrap"><div class="inner">
    <!--crumbs-->
    <h1>${esc(w.name)}</h1>
    <p class="tag">${esc(w.tagline)}</p>
    <p class="lead">${esc(w.summary)}</p>
    <div class="actions">${w.live ? `<a class="btn" href="${w.live}" target="_blank" rel="noopener">Visit the live site</a>` : '<span class="label">Private system for staff</span>'}<span class="label">${esc(w.sector)}</span></div>
  </div></div></section>
  <section class="article" data-form="orb" data-pos="corner"><div class="wrap">
    ${facts([['Sector', w.sector], ['Where', w.location], ['What', w.scope]])}
    ${w.sections.map(block).join('')}
    <a class="next" href="${workUrl(next)}"><span class="idx">Next project</span><strong>${esc(next.name)}</strong></a>
  </div></section>`,
  });
});

/* ---------- notes, contact ---------- */
html['/notes/'] = layout({
  path: '/notes/', crumbs: [{ name: 'Notes' }],
  title: 'Leave Keith a note | Keith Vilani',
  description: 'Leave Keith Vilani a note: a thank-you, an idea or a word of encouragement.',
  body: `
  <section class="page-hero" data-form="liquid" data-pos="right"><div class="wrap"><div class="inner">
    <!--crumbs-->
    <h1>Leave a <em>note</em></h1>
    <p class="lead">A thank-you, an idea, a word of encouragement. It goes straight to Keith.</p>
    <form class="note-form" id="noteForm" name="notes" method="POST" data-netlify="true" netlify-honeypot="bot-field" autocomplete="off">
      <input type="hidden" name="form-name" value="notes">
      <p class="sr"><label>Leave empty <input name="bot-field" tabindex="-1"></label></p>
      <label for="note" class="sr">Your note</label>
      <input id="note" name="note" maxlength="160" required placeholder="Write something…">
      <button class="btn" type="submit">Send</button>
    </form>
    <p class="label" id="noteStatus" role="status"></p>
    <ul class="note-list" id="noteList" hidden></ul>
  </div></div></section>`,
});

html['/contact/'] = layout({
  path: '/contact/', crumbs: [{ name: 'Contact' }],
  title: 'Contact Keith Vilani | Build, partner or back the cause',
  description: `Contact Keith Vilani to build a brand, website or system through Digitalx, advertise with Go Ads or support the Keith Vilani Foundation. ${SITE.email}, ${SITE.phone}.`,
  jsonld: [{ '@type': 'ContactPage', name: 'Contact Keith Vilani', url: `${SITE.url}/contact/` }],
  body: `
  <section class="page-hero short" data-form="tree" data-pos="right"><div class="wrap"><div class="inner">
    <!--crumbs-->
    <h1>Let’s <em>talk</em></h1>
    <p class="lead">Email <a class="link" href="mailto:${SITE.email}">${SITE.email}</a> or call <a class="link" href="tel:${SITE.phoneIntl}">${SITE.phone}</a>. For the Foundation, write to <a class="link" href="mailto:${SITE.foundationEmail}">${SITE.foundationEmail}</a>.</p>
  </div></div></section>
  ${closing('Plant something that <em>outlives us.</em>')}`,
});

/* ---------- write ---------- */
for (const [path, out] of Object.entries(html)) {
  const file = join(OUT, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, out);
}
writeFileSync(join(OUT, '404.html'), layout({
  path: '/404/', title: 'Not found | Keith Vilani', description: 'This page does not exist.',
  body: `<section class="page-hero" data-form="pebbles" data-pos="right"><div class="wrap"><div class="inner">
    <p class="label">404</p><h1>Nothing <em>here</em></h1>
    <p class="lead">The page you were looking for has come apart. Start again from the index.</p>
    <div class="actions"><a class="btn" href="/">Back to the index</a></div>
  </div></div></section>`,
}).replace('<link rel="canonical" href="https://keithvilani.co.za/404/">', '<meta name="robots" content="noindex">'));

writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(html).map((p) => `  <url><loc>${SITE.url}${p}</loc><lastmod>${TODAY}</lastmod><priority>${p === '/' ? '1.0' : p.split('/').length > 3 ? '0.7' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
writeFileSync(new URL('./tools/pages.json', import.meta.url), JSON.stringify(Object.keys(html)));
console.log(`Built ${Object.keys(html).length} pages + 404 into public/`);
