(() => {
  const d = document, root = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const OG = /[?&]og\b/.test(location.search);
  const $ = (s, r = d) => r.querySelector(s);
  const $$ = (s, r = d) => [...r.querySelectorAll(s)];
  const local = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  let toastT;
  const toast = (msg) => { const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200); };

  /* ---------- menu ---------- */
  const menuBtn = $('#menuBtn');
  menuBtn.addEventListener('click', () => { const open = !root.classList.contains('menu-open'); root.classList.toggle('menu-open', open); menuBtn.setAttribute('aria-expanded', open); menuBtn.textContent = open ? 'Close' : 'Menu'; $('#menu').toggleAttribute('inert', !open); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('menu-open')) menuBtn.click(); });
  $$('#menu a').forEach(a => a.addEventListener('click', () => { if (root.classList.contains('menu-open')) menuBtn.click(); }));
  const onScroll = () => root.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, {passive: true}); onScroll();

  /* ---------- shared GL helper ---------- */
  function glProgram(canvas, frag, opts) {
    let gl = null;
    try { gl = canvas.getContext('webgl', opts); } catch (e) {}
    if (!gl) return null;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(pr)); return null; }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const pl = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(pl); gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0);
    const u = new Proxy({}, {get: (c, k) => c[k] || (c[k] = gl.getUniformLocation(pr, k))});
    return {gl, u};
  }

  /* ---------- the planet: a glossy black sphere with a burning ring, ray-marched ---------- */
  const ORB = `precision highp float;
uniform vec2 R;uniform float T;uniform vec2 M;uniform float D;
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec3 ringP(vec3 p){vec3 q=p;q.yz*=rot(1.18+M.y*.25);q.xy*=rot(-.38+M.x*.25);q.xz*=rot(T*.25);return q;}
float ringD(vec3 p){vec3 q=ringP(p);return length(vec2(length(q.xz)-1.58,q.y))-.065;}
float map(vec3 p){return min(length(p)-1.,ringD(p));}
vec3 nrm(vec3 p){vec2 e=vec2(.001,-.001);return normalize(e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx));}
vec3 env(vec3 d){d.xz*=rot(M.x*.6+T*.05);vec3 c=vec3(.01);
 c+=vec3(1.,.42,.14)*smoothstep(.15,.9,d.y)*1.3;
 c+=vec3(1.,.86,.72)*pow(max(0.,1.-abs(d.x-.55)*4.),3.)*smoothstep(-.3,.6,d.y)*2.;
 c+=vec3(.95,.22,.08)*pow(max(0.,1.-abs(d.x+.7)*3.),2.)*smoothstep(-.5,.5,d.y)*1.1;
 c+=vec3(.45,.1,.6)*smoothstep(0.,-.9,d.y)*.35;return c;}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;
 vec3 ro=vec3(0,0,6.),rd=normalize(vec3(uv,-1.5));
 float t=3.6,md=9.;bool hit=false;
 for(int i=0;i<90;i++){float dd=map(ro+rd*t);md=min(md,dd);if(dd<.001){hit=true;break;}t+=dd;if(t>8.6)break;}
 vec3 col=vec3(0.);float a=0.;
 if(hit){vec3 p=ro+rd*t,n=nrm(p),r=reflect(rd,n);float fr=pow(1.-max(dot(n,-rd),0.),4.);
  if(length(p)-1.<ringD(p)){
   col=env(r)*(.1+.9*fr)+vec3(1.,.55,.25)*pow(max(dot(r,normalize(vec3(.6,.7,.4))),0.),60.)*1.8;
   float band=smoothstep(.06,.0,abs(p.y+.05-.12*sin(p.x*2.)))*.0;col+=band;
  }else{
   col=env(r)*vec3(1.,.62,.36)*(.7+.5*fr)+vec3(1.,.4,.1)*.55;
  }
  col=col/(1.+col);col=pow(col,vec3(.9));a=1.;}
 else if(md<.01){a=1.-smoothstep(0.,.01,md);col=vec3(.9,.4,.15)*a*.6;}
 float glow=exp(-max(md,0.)*14.)*.14*(1.-a)*smoothstep(.48,.3,length(uv));
 gl_FragColor=vec4(col+vec3(1.,.42,.14)*glow,a)*D;}`;

  const orbCv = $('#orb'), O = orbCv ? glProgram(orbCv, ORB, {alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: OG}) : null;
  if (orbCv && !O) orbCv.remove();

  let oq = innerWidth < 700 ? .8 : 1;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (O) { const r = orbCv.getBoundingClientRect(); orbCv.width = Math.round(r.width * dpr * oq); orbCv.height = Math.round(r.height * dpr * oq); O.gl.viewport(0, 0, orbCv.width, orbCv.height); }
  }

  const st = {mx: 0, my: 0, burst: 0, dim: -1};
  const mouse = {x: 0, y: 0};
  addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1; }, {passive: true});
  addEventListener('deviceorientation', e => { if (e.gamma != null && !fine) { mouse.x = Math.max(-1, Math.min(1, e.gamma / 30)); mouse.y = Math.max(-1, Math.min(1, (e.beta - 50) / 30)); } });
  let orbVisible = true;
  if (orbCv) new IntersectionObserver(es => { orbVisible = es[0].isIntersecting; }).observe(orbCv);

  const t0 = performance.now();
  let last = t0, ft = 16, slow = 0;
  function frame(now) {
    const raw = now - last, dt = Math.min(50, raw) / 16.67; last = now;
    ft += (raw - ft) * .05;
    const T = reduce ? 6 : (now - t0) / 1000;
    st.mx += (mouse.x - st.mx) * .04 * dt; st.my += (mouse.y - st.my) * .04 * dt;
    st.burst *= Math.pow(.94, dt);
    // the wallpaper dims as you read further down the page
    const dim = Math.min(.8, (d.body.dataset.dim ? +d.body.dataset.dim : .42) + scrollY / innerHeight * .28);
    if (Math.abs(dim - st.dim) > .004) { st.dim = dim; root.style.setProperty('--dim', dim.toFixed(3)); }
    if (O && orbVisible && !d.hidden) {
      const {gl, u} = O;
      gl.uniform2f(u.R, orbCv.width, orbCv.height); gl.uniform1f(u.T, T); gl.uniform2f(u.M, st.mx, -st.my); gl.uniform1f(u.D, 1);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (!OG && ft > 26 && ++slow > 60) { oq = Math.max(.5, oq * .85); resize(); slow = 0; } else if (ft <= 26) slow = 0;
    requestAnimationFrame(frame);
  }

  /* ---------- reveals ---------- */
  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), {threshold: .12});
  $$('.reveal').forEach(el => rio.observe(el));
  if (OG) $$('.reveal').forEach(el => el.classList.add('in'));

  /* ---------- the fact: out of every 100 ---------- */
  const people = $('#people');
  if (people) {
    const OUT = +people.dataset.out || 47, num = $('#factNum');
    for (let i = 0; i < 100; i++) people.appendChild(d.createElement('i'));
    const dots = $$('i', people);
    // a fixed, scattered order so the pattern feels human, not a progress bar
    let sd = 7; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const order = dots.map((_, i) => i).sort(() => rnd() - .5).slice(0, OUT);
    let timers = [];
    const play = () => {
      timers.forEach(clearTimeout); timers = [];
      dots.forEach(x => x.classList.remove('out')); num.textContent = '0';
      order.forEach((idx, k) => timers.push(setTimeout(() => { dots[idx].classList.add('out'); num.textContent = k + 1; if (k === OUT - 1) st.burst = .25; }, reduce ? 0 : 500 + k * 45)));
    };
    let played = false;
    new IntersectionObserver(es => { if (es[0].isIntersecting && !played) { played = true; play(); } }, {threshold: .45}).observe(people);
    $('#factAgain').addEventListener('click', play);
    if (OG) { order.forEach(i => dots[i].classList.add('out')); num.textContent = OUT; }
  }

  /* ---------- build the bridge ---------- */
  const range = $('#bridgeRange');
  if (range) {
    const planks = $$('.plank'), deck = $$('.deck i'), built = $('#built'), hint = $('.slider .hint');
    let lastN = 0;
    const upd = () => {
      const v = +range.value, n = Math.min(6, Math.floor(v / 100 * 6 + .02));
      planks.forEach((p, i) => p.classList.toggle('on', i < n)); deck.forEach((p, i) => p.classList.toggle('on', i < n));
      if (n > lastN && navigator.vibrate && !reduce) navigator.vibrate(12);
      if (n === 6 && lastN < 6) { built.classList.add('on'); st.burst = .6; }
      if (n < 6) built.classList.remove('on');
      if (v > 2 && hint) hint.style.opacity = 0;
      range.setAttribute('aria-valuetext', `${n} of 6 ventures in place`);
      lastN = n;
    };
    range.addEventListener('input', upd); upd();
    if (OG) { range.value = 100; upd(); }
  }

  /* ---------- six bridges: a rail you can swipe, drag or step through ---------- */
  const rail = $('#rail');
  if (rail) {
    const step = () => (rail.querySelector('.vcard')?.offsetWidth || 320) + 20;
    $('#railPrev').addEventListener('click', () => rail.scrollBy({left: -step(), behavior: 'smooth'}));
    $('#railNext').addEventListener('click', () => rail.scrollBy({left: step(), behavior: 'smooth'}));
    if (fine) {
      let down = false, sx = 0, sl = 0, moved = false;
      rail.addEventListener('pointerdown', e => { down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; });
      addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) { moved = true; rail.classList.add('drag'); } rail.scrollLeft = sl - dx; });
      addEventListener('pointerup', () => { if (!down) return; down = false; rail.classList.remove('drag'); });
      rail.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    }
  }

  /* ---------- make it yours: a shareable poster, drawn live ---------- */
  const poster = $('#poster');
  if (poster) {
    const pc = poster.getContext('2d'), PW = 1080, PH = 1350;
    poster.width = PW; poster.height = PH;
    const nameI = $('#posterName'), cityI = $('#posterCity');
    nameI.value = local.get('kv-name') || ''; cityI.value = local.get('kv-city') || '';
    const grad = (x0, x1) => { const g = pc.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#e9512b'); g.addColorStop(.55, '#ff7a3a'); g.addColorStop(1, '#ffad6b'); return g; };
    const fit = (txt, weight, size, max) => { pc.font = `${weight} ${size}px Outfit, sans-serif`; const w = pc.measureText(txt).width; if (w > max) pc.font = `${weight} ${Math.floor(size * max / w)}px Outfit, sans-serif`; };
    function draw() {
      pc.fillStyle = '#050505'; pc.fillRect(0, 0, PW, PH);
      pc.save(); pc.globalCompositeOperation = 'lighter';
      try { pc.filter = 'blur(40px)'; } catch (e) {}
      [[820, 260, 520, 'rgba(240,80,42,.85)'], [300, 120, 420, 'rgba(200,37,26,.7)'], [980, 760, 420, 'rgba(255,138,61,.45)'], [160, 1250, 520, 'rgba(110,30,200,.35)'], [640, 520, 300, 'rgba(255,190,120,.25)']].forEach(([x, y, r, c]) => {
        const g = pc.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); pc.fillStyle = g; pc.fillRect(0, 0, PW, PH);
      });
      pc.restore(); pc.filter = 'none';
      // the ring mark
      pc.save(); pc.translate(110, 120); pc.strokeStyle = '#fff'; pc.lineWidth = 9; pc.setLineDash([17, 11]); pc.beginPath(); pc.arc(0, 0, 30, 0, Math.PI * 2); pc.stroke(); pc.restore();
      pc.fillStyle = '#fff'; pc.font = '600 34px Outfit, sans-serif'; pc.textBaseline = 'middle'; pc.fillText('keith vilani', 166, 122);
      pc.textBaseline = 'alphabetic';
      pc.font = '200 84px Outfit, sans-serif'; pc.fillStyle = '#fff'; pc.fillText('talent is', 80, 520);
      try { pc.letterSpacing = '-8px'; } catch (e) {} fit('everywhere.', 800, 196, 930);
      const wg = pc.createLinearGradient(0, 520, 0, 720); wg.addColorStop(0, '#ffffff'); wg.addColorStop(1, '#bdb8b2');
      pc.fillStyle = wg; pc.fillText('everywhere.', 62, 700);
      fit('opportunity', 800, 150, 930); pc.fillStyle = grad(80, 980); pc.fillText('opportunity', 70, 880); pc.fillText('isn’t.', 70, 1020);
      try { pc.letterSpacing = '0px'; } catch (e) {}
      const name = nameI.value.trim().slice(0, 28), city = cityI.value.trim().slice(0, 28);
      pc.font = '300 44px Outfit, sans-serif'; pc.fillStyle = '#e8e2da';
      pc.fillText(name ? `signed, ${name}${city ? ' · ' + city : ''}` : 'pass it on.', 80, 1130);
      pc.fillStyle = 'rgba(255,255,255,.14)'; pc.fillRect(80, 1190, 920, 2);
      pc.font = '400 32px Outfit, sans-serif'; pc.fillStyle = '#a19b93'; pc.fillText('so let’s build the bridge.', 80, 1262);
      pc.textAlign = 'right'; pc.fillStyle = '#fff'; pc.font = '500 32px Outfit, sans-serif'; pc.fillText('keithvilani.co.za', 1000, 1262); pc.textAlign = 'left';
    }
    let raf = 0;
    const redraw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { draw(); local.set('kv-name', nameI.value); local.set('kv-city', cityI.value); }); };
    nameI.addEventListener('input', redraw); cityI.addEventListener('input', redraw);
    Promise.all(['200', '300', '400', '500', '600', '800'].map(w => d.fonts.load(`${w} 40px Outfit`))).catch(() => {}).then(draw);
    draw();
    const blob = () => new Promise(r => poster.toBlob(r, 'image/png'));
    const save = async () => { const b = await blob(); const a = d.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'talent-is-everywhere.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
    $('#posterDownload').addEventListener('click', async () => { await save(); toast('Saved. Post it anywhere.'); st.burst = .4; });
    $('#posterShare').addEventListener('click', async () => {
      const b = await blob(), file = new File([b], 'talent-is-everywhere.png', {type: 'image/png'});
      const data = {files: [file], title: 'Talent is everywhere. Opportunity isn’t.', text: 'Talent is everywhere. Opportunity isn’t. keithvilani.co.za'};
      if (navigator.canShare && navigator.canShare(data)) { try { await navigator.share(data); st.burst = .4; } catch (e) {} }
      else { await save(); toast('Saved. Sharing from this browser isn’t supported, so post the image anywhere.'); }
    });
  }

  /* ---------- page transitions ---------- */
  d.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || reduce || OG) return;
    const a = e.target.closest('a[href]'); if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href.startsWith('/') || href.startsWith('//')) return;
    const u = new URL(href, location.href);
    if (u.pathname === location.pathname) return;
    e.preventDefault(); root.classList.add('leaving'); st.burst = .5;
    setTimeout(() => { location.href = u.pathname + u.search + u.hash; }, 380);
  });
  addEventListener('pageshow', e => { if (e.persisted) root.classList.remove('leaving'); });

  /* ---------- the background is the visitor's own device ----------
     Browsers can't read a device's wallpaper, so every page wears a wallpaper in the style of the visitor's
     own system, and one tap lets them use their real wallpaper photo (kept on their device only). */
  const wall = $('#wall');
  const ua = navigator.userAgent, plat = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  const forcedDevice = new URLSearchParams(location.search).get('device');
  const device = forcedDevice || (/iPhone|iPad|iPod/.test(ua) || (/Mac/.test(plat) && navigator.maxTouchPoints > 1) ? 'ios' : /Android/.test(ua) ? 'android' : /Mac/.test(plat) ? 'mac' : /Win/.test(plat) ? 'windows' : /Linux|CrOS/.test(plat + ua) ? 'linux' : 'other');
  root.dataset.device = device;
  const NAMES = {ios: 'iPhone', android: 'Android', mac: 'Mac', windows: 'Windows', linux: 'Linux'};
  $$('[data-device-name]').forEach(el => el.textContent = NAMES[device] || 'device');

  function setAccent(h) {
    if (h == null) { ['--o1', '--o2', '--grad'].forEach(k => root.style.removeProperty(k)); return; }
    root.style.setProperty('--o1', `hsl(${h} 92% 64%)`);
    root.style.setProperty('--o2', `hsl(${h} 78% 52%)`);
    root.style.setProperty('--grad', `linear-gradient(100deg,hsl(${h - 10} 78% 50%) 0%,hsl(${h} 90% 60%) 55%,hsl(${h + 14} 95% 74%) 100%)`);
  }
  // the most vivid colour family in the image becomes the site's accent
  function hueOf(img) {
    const c = d.createElement('canvas'); c.width = c.height = 48;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, 48, 48);
    const px = x.getImageData(0, 0, 48, 48).data, bins = new Array(24).fill(0), sums = new Array(24).fill(0);
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), dl = mx - mn;
      if (mx < .25 || dl / mx < .3) continue;
      let h = mx === r ? ((g - b) / dl) % 6 : mx === g ? (b - r) / dl + 2 : (r - g) / dl + 4; h = (h * 60 + 360) % 360;
      const k = Math.floor(h / 15), wgt = dl * mx; bins[k] += wgt; sums[k] += h * wgt;
    }
    let best = -1, bw = 0; bins.forEach((v, i) => { if (v > bw) { bw = v; best = i; } });
    return best < 0 || bw < 6 ? null : Math.round(sums[best] / bins[best]);
  }
  const mirror = $('#wallMirror'), phoneClock = $('#phoneClock');
  const syncMirror = () => { if (mirror) { const cs = getComputedStyle(wall); mirror.style.backgroundImage = cs.backgroundImage; mirror.style.backgroundSize = 'cover'; mirror.style.backgroundPosition = 'center'; } };
  if (phoneClock) { const pt = () => phoneClock.textContent = new Intl.DateTimeFormat(undefined, {hour: '2-digit', minute: '2-digit', hour12: false}).format(new Date()); pt(); setInterval(pt, 15000); }
  function applyOwn(url, hue) {
    wall.style.backgroundImage = `url("${url}")`; root.classList.add('own-wall'); setAccent(hue); syncMirror();
  }
  function resetWall() {
    wall.style.backgroundImage = ''; root.classList.remove('own-wall'); setAccent(null); syncMirror();
    try { localStorage.removeItem('kv-wall'); localStorage.removeItem('kv-wall-hue'); } catch (e) {}
    toast(`Back to the ${NAMES[device] || 'device'} wallpaper.`);
  }
  const saved = !OG && local.get('kv-wall');
  if (saved) { const h = local.get('kv-wall-hue'); applyOwn(saved, h === '' || h == null ? null : +h); } else syncMirror();

  const picker = d.createElement('input');
  picker.type = 'file'; picker.accept = 'image/*'; picker.hidden = true; d.body.appendChild(picker);
  $$('[data-wallpaper]').forEach(b => b.addEventListener('click', () => { if (root.classList.contains('menu-open')) menuBtn.click(); picker.click(); }));
  $$('[data-wallpaper-reset]').forEach(b => b.addEventListener('click', resetWall));
  picker.addEventListener('change', () => {
    const f = picker.files && picker.files[0]; if (!f) return;
    const img = new Image(), src = URL.createObjectURL(f);
    img.onload = () => {
      const max = 1800, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = d.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const url = c.toDataURL('image/jpeg', .84), hue = hueOf(c);
      URL.revokeObjectURL(src);
      applyOwn(url, hue); st.burst = .5;
      local.set('kv-wall', url); local.set('kv-wall-hue', hue == null ? '' : String(hue));
      hideHint(true);
      toast(local.get('kv-wall') ? 'Done. Every page now wears your wallpaper.' : 'Done for this visit. Your browser wouldn’t let the site remember it.');
    };
    img.onerror = () => { URL.revokeObjectURL(src); toast('That image couldn’t be opened. Try a JPG or PNG.'); };
    img.src = src; picker.value = '';
  });

  // a gentle invitation, once
  const hint = $('#wallHint');
  function hideHint(remember) { if (hint) hint.classList.remove('show'); if (remember) local.set('kv-wall-hint', '1'); }
  if (hint) {
    $('#wallHintClose').addEventListener('click', () => hideHint(true));
    if (!OG && !saved && !local.get('kv-wall-hint')) setTimeout(() => hint.classList.add('show'), 5200);
  }

  /* ---------- boot: the first three seconds ---------- */
  resize();
  let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(resize, 150); });
  requestAnimationFrame(frame);
  const start = () => root.classList.add('go');
  if (OG) start();
  else Promise.race([d.fonts.ready, new Promise(r => setTimeout(r, 900))]).then(() => requestAnimationFrame(start));
})();
