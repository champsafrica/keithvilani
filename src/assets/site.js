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

  /* ---------- the living background: warm fluid light (domain-warped noise) ---------- */
  const FLUID = `precision mediump float;
uniform vec2 R;uniform float T;uniform vec2 M;uniform float I;uniform float K;uniform float P;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
 vec2 p=(gl_FragCoord.xy-.5*R)/R.y;p+=M*.06;p.y+=P*.35;
 float t=T*.05;
 vec2 q=vec2(fbm(p*1.3+t),fbm(p*1.3-t+3.1));
 vec2 r=vec2(fbm(p*1.5+q*2.4+vec2(1.7,9.2)+t*1.4),fbm(p*1.5+q*2.4+vec2(8.3,2.8)-t));
 float f=fbm(p*1.1+r*2.8);
 vec3 c=vec3(.66,.09,.05)*smoothstep(.38,.78,f)*1.15;
 c+=vec3(1.,.42,.13)*pow(smoothstep(.52,.88,f),2.)*1.35;
 c+=vec3(1.,.8,.58)*pow(smoothstep(.7,.95,f),4.)*1.1;
 c+=vec3(.32,.07,.48)*smoothstep(.55,.95,r.y)*smoothstep(.3,.7,f)*.45;
 float v=smoothstep(1.35,.15,length(p*vec2(.75,1.)-vec2(0.,.08)));
 c*=v*I*K;
 gl_FragColor=vec4(c,1.);}`;

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

  const fluidCv = $('#fluid'), F = glProgram(fluidCv, FLUID, {alpha: false, antialias: false, preserveDrawingBuffer: OG});
  const orbCv = $('#orb'), O = orbCv ? glProgram(orbCv, ORB, {alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: OG}) : null;
  if (!F) root.classList.add('no-gl');
  if (orbCv && !O) orbCv.remove();

  let fq = innerWidth < 700 ? .35 : .5, oq = innerWidth < 700 ? .8 : 1;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    fluidCv.width = Math.round(innerWidth * fq); fluidCv.height = Math.round(innerHeight * fq);
    if (F) F.gl.viewport(0, 0, fluidCv.width, fluidCv.height);
    if (O) { const r = orbCv.getBoundingClientRect(); orbCv.width = Math.round(r.width * dpr * oq); orbCv.height = Math.round(r.height * dpr * oq); O.gl.viewport(0, 0, orbCv.width, orbCv.height); }
  }

  const st = {mx: 0, my: 0, I: 0, burst: 0, K: 1};
  const mouse = {x: 0, y: 0};
  addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1; }, {passive: true});
  addEventListener('deviceorientation', e => { if (e.gamma != null && !fine) { mouse.x = Math.max(-1, Math.min(1, e.gamma / 30)); mouse.y = Math.max(-1, Math.min(1, (e.beta - 50) / 30)); } });
  let orbVisible = true;
  if (orbCv) new IntersectionObserver(es => { orbVisible = es[0].isIntersecting; }).observe(orbCv);

  const t0 = performance.now();
  let last = t0, ft = 16, slow = 0, lit = false;
  function frame(now) {
    const raw = now - last, dt = Math.min(50, raw) / 16.67; last = now;
    ft += (raw - ft) * .05;
    const T = reduce ? 6 : (now - t0) / 1000;
    st.mx += (mouse.x - st.mx) * .04 * dt; st.my += (mouse.y - st.my) * .04 * dt;
    st.I += ((lit ? 1 : 0) - st.I) * .025 * dt;
    st.burst *= Math.pow(.94, dt);
    const sc = scrollY / innerHeight;
    st.K += ((sc < .6 ? 1 : .5) - st.K) * .05 * dt;
    if (F && !d.hidden) {
      const {gl, u} = F;
      gl.uniform2f(u.R, fluidCv.width, fluidCv.height); gl.uniform1f(u.T, T); gl.uniform2f(u.M, st.mx, -st.my);
      gl.uniform1f(u.I, OG ? 1 : Math.min(1.6, st.I + st.burst)); gl.uniform1f(u.K, OG ? 1 : st.K); gl.uniform1f(u.P, Math.min(sc, 3) * .2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (O && orbVisible && !d.hidden) {
      const {gl, u} = O;
      gl.uniform2f(u.R, orbCv.width, orbCv.height); gl.uniform1f(u.T, T); gl.uniform2f(u.M, st.mx, -st.my); gl.uniform1f(u.D, 1);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (!OG && ft > 26 && ++slow > 60) { fq = Math.max(.22, fq * .8); oq = Math.max(.5, oq * .85); resize(); slow = 0; } else if (ft <= 26) slow = 0;
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

  /* ---------- boot: the first three seconds ---------- */
  resize();
  let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(resize, 150); });
  requestAnimationFrame(frame);
  const start = () => { root.classList.add('go', 'lit'); lit = true; };
  if (OG) { st.I = 1; start(); }
  else Promise.race([d.fonts.ready, new Promise(r => setTimeout(r, 900))]).then(() => requestAnimationFrame(start));
})();
