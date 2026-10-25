(() => {
  const d = document, root = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const OG = /[?&]og\b/.test(location.search);
  const $ = (s, r = d) => r.querySelector(s);
  const $$ = (s, r = d) => [...r.querySelectorAll(s)];
  const store = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const first = root.classList.contains('first');

  /* ---------- small things ---------- */
  const clock = $('#clock');
  const tick = () => { if (clock) clock.textContent = 'Cape Town ' + new Intl.DateTimeFormat('en-ZA', {hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg', hour12: false}).format(new Date()); };
  tick(); setInterval(tick, 15000);
  let toastT;
  const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3400); };
  const menuBtn = $('#menuBtn');
  menuBtn.addEventListener('click', () => { const open = !root.classList.contains('menu-open'); root.classList.toggle('menu-open', open); menuBtn.setAttribute('aria-expanded', open); $('#menu').toggleAttribute('inert', !open); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('menu-open')) menuBtn.click(); });

  /* ---------- the sky: everything Keith has built ---------- */
  const STARS = [
    {k: 'Digitalx', href: '/ventures/digitalx/', x: .52, y: .46, w: 3.2, hub: 1},
    {k: 'Keith Vilani Foundation', href: '/ventures/keith-vilani-foundation/', x: .18, y: .18, w: 2},
    {k: 'Go Ads', href: '/ventures/go-ads/', x: .56, y: .06, w: 1.3},
    {k: 'SANA', href: '/ventures/sana/', x: .88, y: .16, w: 1.4, left: 1},
    {k: 'Unique Holistic', href: '/work/unique-holistic/', x: .02, y: .4, w: .7, minor: 1},
    {k: 'Kelvin Tadiwanashe', href: '/work/kelvin-tadiwanashe/', x: .27, y: .52, w: .6, left: 1, minor: 1},
    {k: 'Mbeki Healthcare', href: '/work/mbeki-healthcare/', x: .1, y: .68, w: 1, minor: 1},
    {k: 'GetClient', href: '/ventures/getclient/', x: .9, y: .5, w: 1.4, left: 1},
    {k: 'TechStep Academy', href: '/work/techstep-academy/', x: .3, y: .88, w: 1, minor: 1},
    {k: 'VisaEase', href: '/work/visaease/', x: .52, y: .99, w: .6, minor: 1},
    {k: 'Advera', href: '/ventures/advera/', x: .74, y: .78, w: 1.2},
    {k: 'Delight Aluminum', href: '/work/delight-aluminum/', x: .96, y: .93, w: .7, left: 1, minor: 1},
  ];

  const cv = $('#field'), ov = $('#overlay'), octx = ov.getContext('2d');
  let gl = null, ctx = null;
  try { gl = cv.getContext('webgl', {alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: OG}); } catch (e) {}
  if (!gl) ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1;
  const mouse = {x: -9999, y: -9999, down: false};
  const isSmall = () => innerWidth < 900;
  const COUNT = reduce ? 1600 : gl ? (innerWidth < 600 ? 3600 : innerWidth < 1100 ? 6000 : 9000) : (innerWidth < 600 ? 2400 : innerWidth < 1100 ? 3800 : 5200);
  const P = new Float32Array(COUNT * 6); // x, y, vx, vy, tx, ty
  const seed = new Float32Array(COUNT), tone = new Uint8Array(COUNT);
  const PAL = [[1, .71, .25], [1, .89, .64], [.88, .38, .23], [.61, .77, .62]];
  const HEX = ['#f4b63f', '#ffe3a3', '#e0603a', '#9bc59d'];
  for (let i = 0; i < COUNT; i++) { seed[i] = Math.random(); const r = Math.random(); tone[i] = r < .62 ? 0 : r < .84 ? 1 : r < .94 ? 2 : 3; }

  /* WebGL: soft glowing points, additive blending */
  let posBuf, prog, uRes, uDpr, uGain, gpu, gain = 1;
  if (gl) {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec3 p;attribute vec3 c;uniform vec2 r;uniform float dpr;varying vec3 vc;void main(){vec2 z=p.xy/r*2.-1.;gl_Position=vec4(z.x,-z.y,0.,1.);gl_PointSize=p.z*dpr;vc=c;}'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec3 vc;uniform float g;void main(){vec2 q=gl_PointCoord-.5;float d=dot(q,q)*4.;float a=exp(-d*16.)+exp(-d*3.5)*.28;gl_FragColor=vec4(vc*a*g,1.);}'));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { gl = null; ctx = cv.getContext('2d'); }
  }
  if (gl) {
    gl.useProgram(prog);
    uRes = gl.getUniformLocation(prog, 'r'); uDpr = gl.getUniformLocation(prog, 'dpr'); uGain = gl.getUniformLocation(prog, 'g');
    gpu = new Float32Array(COUNT * 3);
    posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferData(gl.ARRAY_BUFFER, gpu, gl.DYNAMIC_DRAW);
    const pl = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(pl); gl.vertexAttribPointer(pl, 3, gl.FLOAT, false, 0, 0);
    const col = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) { const c = PAL[tone[i]], b = .55 + seed[i] * .45; col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b; }
    const cb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cb); gl.bufferData(gl.ARRAY_BUFFER, col, gl.STATIC_DRAW);
    const cl = gl.getAttribLocation(prog, 'c'); gl.enableVertexAttribArray(cl); gl.vertexAttribPointer(cl, 3, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.clearColor(11 / 255, 9 / 255, 7 / 255, 1);
  }

  /* ---------- shapes the lights can become ---------- */
  const SHAPES = {
    digitalx(o, w, h) {
      o.lineWidth = w * .15;
      o.beginPath(); o.moveTo(w * .26, h * .26); o.lineTo(w * .74, h * .74); o.moveTo(w * .74, h * .26); o.lineTo(w * .26, h * .74); o.stroke();
      o.lineWidth = w * .012; o.beginPath(); o.ellipse(w * .5, h * .5, w * .47, h * .2, -.5, 0, 7); o.stroke();
    },
    heart(o, w, h) {
      o.beginPath();
      for (let t = 0; t <= Math.PI * 2 + .01; t += .02) {
        const x = 16 * Math.pow(Math.sin(t), 3), y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        t === 0 ? o.moveTo(w / 2 + x * w * .026, h * .47 + y * h * .026) : o.lineTo(w / 2 + x * w * .026, h * .47 + y * h * .026);
      }
      o.fill();
      o.globalCompositeOperation = 'destination-out'; o.lineWidth = w * .03;
      o.beginPath(); o.moveTo(w * .14, h * .48); o.lineTo(w * .36, h * .48); o.lineTo(w * .42, h * .36); o.lineTo(w * .5, h * .62); o.lineTo(w * .57, h * .42); o.lineTo(w * .62, h * .48); o.lineTo(w * .86, h * .48); o.stroke();
    },
    shield(o, w, h) {
      o.beginPath(); o.moveTo(w * .5, h * .06); o.lineTo(w * .86, h * .19); o.lineTo(w * .86, h * .5);
      o.bezierCurveTo(w * .86, h * .75, w * .68, h * .88, w * .5, h * .96); o.bezierCurveTo(w * .32, h * .88, w * .14, h * .75, w * .14, h * .5);
      o.lineTo(w * .14, h * .19); o.closePath(); o.fill();
      o.globalCompositeOperation = 'destination-out';
      o.beginPath(); o.moveTo(w * .44, h * .2); o.lineTo(w * .56, h * .2); o.lineTo(w * .7, h * .86); o.lineTo(w * .3, h * .86); o.closePath(); o.fill();
      o.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 5; i++) { const hw = w * (.008 + i * .004); o.fillRect(w * .5 - hw, h * (.24 + i * .12), hw * 2, h * (.05 + i * .008)); }
    },
    badge(o, w, h) {
      o.beginPath();
      for (let i = 0; i <= 240; i++) { const a = i / 240 * Math.PI * 2, r = w * (.38 + .035 * Math.cos(a * 12)); i ? o.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r) : o.moveTo(w / 2 + r, h / 2); }
      o.fill();
      o.globalCompositeOperation = 'destination-out'; o.lineWidth = w * .075;
      o.beginPath(); o.moveTo(w * .33, h * .52); o.lineTo(w * .45, h * .64); o.lineTo(w * .68, h * .38); o.stroke();
    },
    spark(o, w, h) {
      const star = (cx, cy, r) => { o.beginPath(); o.moveTo(cx, cy - r); o.quadraticCurveTo(cx, cy, cx + r, cy); o.quadraticCurveTo(cx, cy, cx, cy + r); o.quadraticCurveTo(cx, cy, cx - r, cy); o.quadraticCurveTo(cx, cy, cx, cy - r); o.fill(); };
      star(w * .44, h * .54, w * .36); star(w * .8, h * .2, w * .12); star(w * .82, h * .78, w * .07);
    },
    billboard(o, w, h) {
      // a delivery bike carrying a billboard box, with speed lines
      o.beginPath(); o.roundRect ? o.roundRect(w * .4, h * .2, w * .44, h * .36, w * .03) : o.rect(w * .4, h * .2, w * .44, h * .36); o.fill();
      o.globalCompositeOperation = 'destination-out';
      o.font = `700 ${h * .2}px "Space Grotesk", system-ui, sans-serif`; o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillText('GO', w * .62, h * .39);
      o.globalCompositeOperation = 'source-over';
      o.lineWidth = w * .028;
      o.beginPath(); o.arc(w * .3, h * .76, w * .1, 0, 7); o.stroke();
      o.beginPath(); o.arc(w * .76, h * .76, w * .1, 0, 7); o.stroke();
      o.beginPath(); o.moveTo(w * .3, h * .76); o.lineTo(w * .42, h * .6); o.lineTo(w * .7, h * .6); o.lineTo(w * .76, h * .76); o.moveTo(w * .42, h * .6); o.lineTo(w * .36, h * .4); o.lineTo(w * .3, h * .38); o.stroke();
      o.lineWidth = w * .014;
      [[.04, .3, .24], [.0, .44, .22], [.06, .58, .14]].forEach(([x, y, l]) => { o.beginPath(); o.moveTo(w * x, h * y); o.lineTo(w * (x + l), h * y); o.stroke(); });
    },
    tree(o, w, h) {
      const branch = (x, y, len, ang, wd, dep) => {
        const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
        o.lineWidth = wd; o.beginPath(); o.moveTo(x, y); o.lineTo(x2, y2); o.stroke();
        if (dep === 0) { o.beginPath(); o.arc(x2, y2, w * (.02 + Math.random() * .03), 0, 7); o.fill(); return; }
        branch(x2, y2, len * .74, ang - .42 - Math.random() * .12, wd * .68, dep - 1);
        branch(x2, y2, len * .74, ang + .38 + Math.random() * .12, wd * .68, dep - 1);
      };
      branch(w * .5, h * .95, h * .25, -Math.PI / 2, w * .045, 7);
      o.fillRect(w * .15, h * .95, w * .7, h * .012);
    },
    mountain(o, w, h) {
      // Table Mountain, Devil's Peak and Lion's Head over the sea
      const pts = [[0, .78], [.06, .7], [.12, .52], [.17, .4], [.22, .47], [.27, .38], [.29, .36], [.71, .36], [.74, .4], [.78, .56], [.82, .52], [.86, .44], [.89, .4], [.92, .46], [.96, .62], [1, .74], [1, .8], [0, .8]];
      o.beginPath(); pts.forEach(([x, y], i) => i ? o.lineTo(w * x, h * y) : o.moveTo(w * x, h * y)); o.closePath(); o.fill();
      o.lineWidth = h * .006;
      for (let i = 0; i < 4; i++) { o.beginPath(); o.moveTo(w * (.1 + i * .05), h * (.86 + i * .035)); o.lineTo(w * (.9 - i * .05), h * (.86 + i * .035)); o.stroke(); }
      o.beginPath(); o.arc(w * .82, h * .16, w * .045, 0, 7); o.fill();
    },
  };

  let scene = null, beat = 0, grow = 1, burstUntil = 0, labelA = 0, override = null;
  let cache = {}, starPx = [];

  function sample(draw, box) {
    const oc = d.createElement('canvas'), k = .5;
    oc.width = Math.max(1, Math.ceil(box.w * k)); oc.height = Math.max(1, Math.ceil(box.h * k));
    const o = oc.getContext('2d');
    o.scale(k, k); o.fillStyle = '#fff'; o.strokeStyle = '#fff'; o.lineCap = 'round'; o.lineJoin = 'round';
    draw(o, box.w, box.h);
    const px = o.getImageData(0, 0, oc.width, oc.height).data, pts = [];
    for (let y = 0; y < oc.height; y++) for (let x = 0; x < oc.width; x++) if (px[(y * oc.width + x) * 4 + 3] > 120) pts.push(box.x + x / k, box.y + y / k);
    const out = new Float32Array(COUNT * 2), n = pts.length / 2;
    if (!n) return out;
    for (let i = 0; i < COUNT; i++) { const j = (Math.random() * n) | 0; out[i * 2] = pts[j * 2] + (Math.random() - .5) * 2.4; out[i * 2 + 1] = pts[j * 2 + 1] + (Math.random() - .5) * 2.4; }
    return out;
  }
  const shapeBox = () => {
    if (isSmall()) { const s = Math.min(W * .86, H * .42); return {x: (W - s) / 2, y: H * .09, w: s, h: s}; }
    const s = Math.min(W * .42, H * .74);
    return {x: W * .72 - s / 2, y: (H - s) / 2 + 24, w: s, h: s};
  };
  const skyBox = () => isSmall() ? {x: W * .1, y: H * .14, w: W * .8, h: H * .24} : {x: W * .42, y: H * .14, w: W * .52, h: H * .46};
  const text = (str, box, maxW = .9, weight = 300) => sample((o, w, h) => {
    let fs = h * .9; o.font = `${weight} ${fs}px Fraunces, Georgia, serif`;
    const m = o.measureText(str); if (m.width > w * maxW) { fs *= (w * maxW) / m.width; o.font = `${weight} ${fs}px Fraunces, Georgia, serif`; }
    o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillText(str, w / 2, h / 2);
  }, box);

  function targetsFor(name) {
    if (cache[name]) return cache[name];
    let t;
    const [kind, arg] = name.split(':');
    if (kind === 'constellation') {
      const sb = skyBox(), total = STARS.reduce((a, s) => a + s.w, 0), dust = Math.floor(COUNT * .18);
      starPx = STARS.map(s => ({...s, px: sb.x + s.x * sb.w, py: sb.y + s.y * sb.h}));
      t = new Float32Array(COUNT * 2); let i = 0;
      starPx.forEach(s => {
        const n = Math.floor((COUNT - dust) * s.w / total), R = (isSmall() ? 9 : 16) * Math.sqrt(s.w);
        for (let j = 0; j < n && i < COUNT; j++, i++) { const a = Math.random() * 6.283, r = R * Math.pow(Math.random(), 1.6); t[i * 2] = s.px + Math.cos(a) * r; t[i * 2 + 1] = s.py + Math.sin(a) * r; }
      });
      for (; i < COUNT; i++) { t[i * 2] = Math.random() * W; t[i * 2 + 1] = Math.random() * H; }
    } else if (kind === 'drift') {
      t = new Float32Array(COUNT * 2);
      for (let i = 0; i < COUNT; i++) { const arm = i % 3, r = Math.pow(Math.random(), .6) * Math.max(W, H) * .62, a = arm * 2.094 + r * .006 + (Math.random() - .5) * .9; t[i * 2] = W / 2 + Math.cos(a) * r; t[i * 2 + 1] = H / 2 + Math.sin(a) * r * .6; }
    } else if (kind === 'dust') {
      t = new Float32Array(COUNT * 2);
      for (let i = 0; i < COUNT; i++) { t[i * 2] = Math.random() * W; t[i * 2 + 1] = Math.random() * H; }
    } else if (kind === 'big') {
      t = text(arg, isSmall() ? {x: 0, y: H * .3, w: W, h: H * .28} : {x: W * .04, y: H * .28, w: W * .92, h: H * .44}, .5);
    } else if (kind === 'mark') {
      t = text(arg, isSmall() ? {x: 0, y: H * .08, w: W, h: H * .3} : {x: W * .5, y: H * .1, w: W * .48, h: H * .8}, .86);
    } else if (kind === 'mono') {
      t = text(arg, isSmall() ? {x: 0, y: H * .06, w: W, h: H * .26} : {x: W * .56, y: H * .14, w: W * .38, h: H * .3}, .7);
    } else if (SHAPES[kind]) {
      t = sample(SHAPES[kind], shapeBox());
    }
    return cache[name] = t;
  }

  function apply(name) {
    const t = targetsFor(name); if (!t) return;
    for (let i = 0; i < COUNT; i++) { P[i * 6 + 4] = t[i * 2]; P[i * 6 + 5] = t[i * 2 + 1]; }
  }
  function setScene(name, force) {
    if (!name || (name === scene && !force)) return;
    if (name === 'tree' && scene !== 'tree' && !force) grow = .15;
    scene = name; if (!override) apply(name);
    sound.chord(name.split(':')[0]);
  }
  function setOverride(name) { override = name; apply(name || scene); }

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR; ov.width = W * DPR; ov.height = H * DPR;
    octx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (gl) { gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(uRes, W, H); gl.uniform1f(uDpr, DPR); }
    else ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cache = {}; targetsFor('constellation');
    if (scene) apply(override || scene);
  }

  /* lights travel between pages: positions are kept for the session */
  function saveLights() {
    const q = new Uint16Array(COUNT * 2);
    for (let i = 0; i < COUNT; i++) { q[i * 2] = Math.max(0, Math.min(65535, P[i * 6] / W * 65535)); q[i * 2 + 1] = Math.max(0, Math.min(65535, P[i * 6 + 1] / H * 65535)); }
    const b = new Uint8Array(q.buffer); let s = '';
    for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
    store.set('kv-lights', COUNT + '|' + btoa(s));
  }
  function loadLights() {
    const v = store.get('kv-lights'); if (!v) return false;
    const [n, b64] = v.split('|'); if (+n !== COUNT) return false;
    try {
      const s = atob(b64), b = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
      const q = new Uint16Array(b.buffer);
      for (let i = 0; i < COUNT; i++) { P[i * 6] = q[i * 2] / 65535 * W; P[i * 6 + 1] = q[i * 2 + 1] / 65535 * H; P[i * 6 + 2] = P[i * 6 + 3] = 0; }
      return true;
    } catch (e) { return false; }
  }
  addEventListener('pagehide', saveLights);
  d.addEventListener('click', e => { const a = e.target.closest('a[href^="/"]'); if (a) saveLights(); }, true);

  function initBurst() {
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * 6.283, r = Math.random() * 6;
      P[i * 6] = W / 2 + Math.cos(a) * r; P[i * 6 + 1] = H / 2 + Math.sin(a) * r;
      P[i * 6 + 2] = Math.cos(a) * (2 + Math.random() * 14); P[i * 6 + 3] = Math.sin(a) * (2 + Math.random() * 14);
    }
  }

  function hotStar() {
    if (scene !== 'constellation' || override) return null;
    return starPx.find(s => Math.hypot(mouse.x - s.px, mouse.y - s.py) < 60) || null;
  }

  function drawOverlay(t, hot) {
    labelA += ((scene === 'constellation' && !override ? 1 : 0) - labelA) * .06;
    octx.clearRect(0, 0, W, H);
    if (labelA < .01) return;
    const hub = starPx.find(s => s.hub), small = isSmall();
    octx.lineWidth = 1;
    octx.setLineDash([2, 6]); octx.lineDashOffset = -t * 12;
    starPx.forEach(s => {
      if (s.hub) return;
      octx.strokeStyle = `rgba(244,182,63,${labelA * (s === hot ? .6 : .14)})`;
      octx.beginPath(); octx.moveTo(hub.px, hub.py); octx.lineTo(s.px, s.py); octx.stroke();
    });
    octx.setLineDash([]);
    starPx.forEach(s => {
      const near = s === hot;
      if (small && s.minor && !near) return;
      const a = labelA * (s.hub || near ? 1 : small ? .7 : .5);
      octx.font = `${s.hub ? 600 : 500} ${small ? (s.hub ? 12 : 9) : (s.hub ? 15 : 11)}px "Space Grotesk", system-ui, sans-serif`;
      octx.fillStyle = near || s.hub ? `rgba(244,182,63,${a})` : `rgba(245,239,230,${a})`;
      octx.textAlign = s.left ? 'right' : 'left';
      const off = (small ? 10 : 16) * Math.sqrt(s.w) + 8;
      octx.fillText(s.k.toUpperCase(), s.px + (s.left ? -off : off), s.py + 4);
      if (near && fine) { octx.font = '500 10px "Space Grotesk", system-ui, sans-serif'; octx.fillStyle = `rgba(245,239,230,${labelA * .6})`; octx.fillText('CLICK TO OPEN', s.px + (s.left ? -off : off), s.py + 20); }
    });
  }

  let last = performance.now(), scrollV = 0, lastY = scrollY, ringHot = false;
  function frame(now) {
    const dt = Math.min(2, (now - last) / 16.67); last = now;
    scrollV += ((scrollY - lastY) - scrollV) * .2; lastY = scrollY;
    const cur = override || scene || 'drift', kind = cur.split(':')[0];
    beat = kind === 'heart' ? Math.pow(Math.max(0, Math.sin(now * .0042)), 12) : 0;
    if (kind === 'tree') grow += (1 - grow) * .02 * dt;
    const t = now * .001, hot = hotStar();
    drawOverlay(t, hot);
    if (fine && !!hot !== ringHot) { ringHot = !!hot; ring.classList.toggle('hot', ringHot); ringLabel.textContent = hot ? 'Open' : ''; }

    gain += ((kind === 'dust' ? .42 : 1) - gain) * .05;
    if (gl) gl.uniform1f(uGain, gain);
    const spring = kind === 'drift' || kind === 'dust' ? .006 : .028, damp = .86, mr = fine ? 110 : 70, mr2 = mr * mr;
    const rot = kind === 'drift' ? t * .04 : 0, cr = Math.cos(rot), sr = Math.sin(rot);
    const bursting = now < burstUntil;
    const b = shapeBox(), pcx = b.x + b.w / 2, pcy = b.y + b.h * .47, pby = b.y + b.h * .95;
    if (gl) gl.clear(gl.COLOR_BUFFER_BIT);
    else { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = reduce ? 'rgb(11,9,7)' : 'rgba(11,9,7,.3)'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter'; }

    for (let i = 0; i < COUNT; i++) {
      const k = i * 6;
      let tx = P[k + 4], ty = P[k + 5];
      if (kind === 'drift') { const dx = tx - W / 2, dy = ty - H / 2; tx = W / 2 + dx * cr - dy * sr; ty = H / 2 + dx * sr + dy * cr; }
      else if (kind === 'heart') { const s = 1 + beat * .07; tx = pcx + (tx - pcx) * s; ty = pcy + (ty - pcy) * s; }
      else if (kind === 'tree') { tx = pcx + (tx - pcx) * grow; ty = pby + (ty - pby) * grow; }
      else if (hot) { const dx = tx - hot.px, dy = ty - hot.py; if (dx * dx + dy * dy < 3600) { tx = hot.px + dx * 1.9; ty = hot.py + dy * 1.9; } }
      const sd = seed[i];
      tx += Math.sin(t * (.6 + sd) + sd * 40) * 2.2; ty += Math.cos(t * (.5 + sd) + sd * 30) * 2.2 - scrollV * sd * 1.2;
      let vx = P[k + 2], vy = P[k + 3];
      if (!bursting) { vx += (tx - P[k]) * spring * dt; vy += (ty - P[k + 1]) * spring * dt; }
      if (!hot) {
        const dx = P[k] - mouse.x, dy = P[k + 1] - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < mr2) { const f = (1 - d2 / mr2) * (mouse.down ? -2.4 : 3.2), dd = Math.sqrt(d2) || 1; vx += dx / dd * f; vy += dy / dd * f; }
      }
      vx *= damp; vy *= damp;
      P[k] += vx * dt; P[k + 1] += vy * dt; P[k + 2] = vx; P[k + 3] = vy;
      const tw = .85 + Math.sin(t * 3 + sd * 60) * .5 + (sd > .985 ? 1.2 : 0);
      if (gl) { gpu[i * 3] = P[k]; gpu[i * 3 + 1] = P[k + 1]; gpu[i * 3 + 2] = (tone[i] === 1 ? 4.5 : 6.5) * tw; }
    }
    if (gl) {
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, gpu);
      gl.drawArrays(gl.POINTS, 0, COUNT);
    } else {
      for (let c = 0; c < 4; c++) {
        ctx.fillStyle = HEX[c]; ctx.globalAlpha = gain;
        for (let i = 0; i < COUNT; i++) { if (tone[i] !== c) continue; const k = i * 6, sz = (c === 1 ? 1.1 : 1.6) * (.9 + Math.sin(t * 3 + seed[i] * 60) * .6); ctx.fillRect(P[k] - sz / 2, P[k + 1] - sz / 2, sz, sz); }
      }
    }
    requestAnimationFrame(frame);
  }

  function burst(power = 22) {
    burstUntil = performance.now() + 380;
    const cx = mouse.x > 0 ? mouse.x : W / 2, cy = mouse.y > 0 ? mouse.y : H / 2;
    for (let i = 0; i < COUNT; i++) {
      const k = i * 6, dx = P[k] - cx, dy = P[k + 1] - cy, dd = Math.hypot(dx, dy) || 1, f = power * (.4 + Math.random()) * Math.min(1, 260 / dd + .25);
      P[k + 2] += dx / dd * f; P[k + 3] += dy / dd * f;
    }
  }

  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, {passive: true});
  addEventListener('pointerdown', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.down = true; });
  addEventListener('pointerup', () => { mouse.down = false; if (!fine) setTimeout(() => { mouse.x = mouse.y = -9999; }, 1600); });
  d.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(resize, 200); });
  // click a star to open its page
  addEventListener('click', e => {
    if (e.target.closest('a,button,input,label,textarea,form')) return;
    const s = hotStar(); if (s) { saveLights(); location.href = s.href; }
  });

  /* ---------- scenes follow the scroll; some elements take over on hover ---------- */
  const vis = new Map();
  const sio = new IntersectionObserver(es => {
    es.forEach(e => vis.set(e.target, e.intersectionRatio));
    let best = null, bv = 0;
    vis.forEach((v, el) => { if (v > bv) { bv = v; best = el; } });
    if (best && bv > 0) setScene(best.dataset.scene);
  }, {threshold: [0, .15, .3, .45, .6, .75, .9], rootMargin: '-20% 0px -20% 0px'});
  $$('[data-hover-scene]').forEach(el => {
    const on = () => { setOverride(el.dataset.hoverScene); sound.chime(.35); };
    const off = () => setOverride(null);
    el.addEventListener('pointerenter', on); el.addEventListener('focus', on);
    el.addEventListener('pointerleave', off); el.addEventListener('blur', off);
  });

  /* ---------- reveal and counters ---------- */
  const fmt = n => n.toLocaleString('en-ZA').replace(/ |\s/g, ',');
  function count(el) {
    if (el.dataset.done) return; el.dataset.done = 1;
    const end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = reduce ? 1 : 2200;
    const step = now => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(Math.round(end * e)) + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  const rio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); $$('[data-count]', e.target).forEach(count); rio.unobserve(e.target);
  }), {threshold: .15});

  /* ---------- hero letters swell toward the cursor ---------- */
  const chars = [];
  $$('[data-split] .ln').forEach((ln, li) => {
    const txt = ln.textContent; ln.textContent = '';
    [...txt].forEach((c, ci) => { const s = d.createElement('span'); s.className = 'ch'; s.textContent = c === ' ' ? ' ' : c; s.style.transitionDelay = (li * .14 + ci * .04) + 's'; ln.appendChild(s); chars.push(s); });
  });
  let rects = [];
  const measure = () => rects = chars.map(c => { const r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2 + scrollY]; });
  if (fine && !reduce && chars.length) {
    let raf = 0;
    addEventListener('pointermove', () => {
      if (raf || scrollY > innerHeight) return;
      raf = requestAnimationFrame(() => { raf = 0; chars.forEach((c, i) => { const [x, y] = rects[i] || [0, 0], dd = Math.hypot(x - mouse.x, y - scrollY - mouse.y); c.style.setProperty('--w', Math.round(300 + 600 * Math.max(0, 1 - dd / 300))); }); });
    }, {passive: true});
  }

  /* ---------- words light up with the scroll ---------- */
  $$('[data-words]').forEach(mt => {
    mt.innerHTML = mt.innerHTML.split(/\s+/).map(w => /^<em>.*<\/em>[.,]?$/.test(w) ? `<span class="w gold">${w.replace(/<\/?em>/g, '')}</span>` : `<span class="w">${w}</span>`).join(' ');
    const words = $$('.w', mt);
    const upd = () => { const r = mt.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (r.height + innerHeight * .35))), n = Math.round(p * words.length); words.forEach((w, i) => w.classList.toggle('lit', i < n)); };
    addEventListener('scroll', upd, {passive: true}); upd();
  });

  /* ---------- cursor ---------- */
  const ring = $('.cursor-ring'), ringLabel = $('span', ring);
  if (fine) {
    d.body.classList.add('has-cursor');
    const dot = $('.cursor'); let rx = -9999, ry = -9999;
    const loop = () => { if (rx < -999) { rx = mouse.x; ry = mouse.y; } rx += (mouse.x - rx) * .16; ry += (mouse.y - ry) * .16; dot.style.transform = `translate(${mouse.x - 4}px,${mouse.y - 4}px)`; ring.style.transform = `translate(${rx - ring.offsetWidth / 2}px,${ry - ring.offsetHeight / 2}px)`; requestAnimationFrame(loop); };
    loop();
    d.addEventListener('pointerover', e => { const a = e.target.closest('a,button,.lantern'); ring.classList.toggle('hot', !!a); ringLabel.textContent = a && a.dataset.cursor ? a.dataset.cursor : ''; });
  }
  $$('.v-card').forEach(c => c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) / r.width * 100 + '%'); c.style.setProperty('--my', (e.clientY - r.top) / r.height * 100 + '%'); }));

  /* ---------- the night sky of notes ---------- */
  const sky = $('#sky');
  if (sky) {
    const KEY = 'kv-notes';
    let mine = [];
    try { mine = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}
    const lantern = (x, y, msg, own) => {
      const l = d.createElement('span');
      l.className = 'lantern' + (own ? ' mine' : '');
      l.style.left = x + '%'; l.style.top = y + '%';
      l.style.setProperty('--s', (own ? 22 : 4 + Math.random() * 10) + 'px');
      l.style.setProperty('--d', (6 + Math.random() * 8) + 's');
      l.style.animationDelay = (-Math.random() * 10) + 's';
      if (msg) { const m = d.createElement('span'); m.className = 'msg'; m.textContent = msg; l.appendChild(m); l.tabIndex = 0; }
      sky.insertBefore(l, sky.firstChild); return l;
    };
    for (let i = 0; i < 70; i++) lantern(4 + Math.random() * 92, 8 + Math.random() * 64);
    mine.forEach(m => lantern(m.x, m.y, m.msg, true));
    const upd = () => $('#skyCount').textContent = `${$$('.lantern', sky).length} lights in the sky`;
    upd();
    $('#noteForm').addEventListener('submit', e => {
      e.preventDefault();
      const inp = $('#note'), msg = inp.value.trim(); if (!msg) return;
      const x = 10 + Math.random() * 80, y = 12 + Math.random() * 50, l = lantern(x, 96, msg, true);
      l.classList.add('show');
      l.animate([{top: '96%', opacity: 0}, {top: y + '%', opacity: 1}], {duration: reduce ? 1 : 2400, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards'});
      setTimeout(() => l.classList.remove('show'), 4000);
      mine.push({x, y, msg}); try { localStorage.setItem(KEY, JSON.stringify(mine.slice(-20))); } catch (err) {}
      fetch('/', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams(new FormData(e.target)).toString()}).catch(() => {});
      inp.value = ''; upd(); sound.chime(); burst(10); toast('Your light is in the sky. Keith will see it.');
    });
  }

  /* ---------- hold to plant ---------- */
  const hold = $('#hold');
  if (hold) {
    const prog = $('#holdProg'), HOLD = 1600, CIRC = 452;
    let hStart = 0, hRaf = 0, planted = false;
    const loopH = now => { const p = Math.min(1, (now - hStart) / HOLD); prog.style.strokeDashoffset = CIRC * (1 - p); grow = .15 + p * .85; if (p >= 1) return finish(); hRaf = requestAnimationFrame(loopH); };
    const start = e => { e.preventDefault(); if (planted) { burst(16); return; } hold.classList.add('pressing'); setScene('tree'); grow = .15; hStart = performance.now(); hRaf = requestAnimationFrame(loopH); sound.swell(); };
    const end = () => { hold.classList.remove('pressing'); cancelAnimationFrame(hRaf); if (!planted) prog.style.strokeDashoffset = CIRC; };
    const finish = () => { planted = true; hold.classList.remove('pressing'); $('.core', hold).textContent = 'Grown'; $('#plantHint').hidden = true; $('#planted').classList.add('show'); burst(18); sound.chime(); setTimeout(() => setScene('tree', true), 420); };
    hold.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => hold.addEventListener(ev, end));
    hold.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); });
    hold.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') end(); });
  }

  /* ---------- generated ambient sound (opt-in, remembered for the session) ---------- */
  const sound = (() => {
    let ac = null, master = null, on = false; const pad = [];
    const NOTES = {constellation: [220, 277.18, 329.63], big: [246.94, 311.13, 369.99], drift: [196, 246.94, 293.66], digitalx: [261.63, 329.63, 392], heart: [220, 261.63, 329.63], shield: [293.66, 369.99, 440], badge: [174.61, 220, 261.63], spark: [329.63, 415.3, 493.88], billboard: [293.66, 349.23, 440], tree: [196, 246.94, 329.63], mono: [164.81, 207.65, 246.94], mark: [220, 293.66, 369.99], mountain: [174.61, 233.08, 293.66]};
    const init = () => {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(master);
      for (let i = 0; i < 3; i++) { const o = ac.createOscillator(), g = ac.createGain(); o.type = i ? 'sine' : 'triangle'; g.gain.value = .05; o.connect(g); g.connect(lp); o.start(); pad.push(o); }
    };
    return {
      get on() { return on; },
      toggle() { if (!ac) init(); on = !on; ac.resume(); master.gain.setTargetAtTime(on ? .5 : 0, ac.currentTime, .6); if (on) this.chord((scene || 'drift').split(':')[0]); store.set('kv-sound', on ? '1' : ''); return on; },
      chord(n) { if (!on || !NOTES[n]) return; NOTES[n].forEach((f, i) => pad[i].frequency.setTargetAtTime(f / (i ? 1 : 2), ac.currentTime, .8)); },
      chime(v = 1) { if (!on) return; const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 880 + Math.random() * 440; g.gain.setValueAtTime(.18 * v, ac.currentTime); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + 2.4); o.connect(g); g.connect(master); o.start(); o.stop(ac.currentTime + 2.5); },
      swell() { if (!on) return; const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(110, ac.currentTime); o.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 1.6); g.gain.setValueAtTime(0, ac.currentTime); g.gain.linearRampToValueAtTime(.12, ac.currentTime + 1.4); g.gain.linearRampToValueAtTime(0, ac.currentTime + 1.9); o.connect(g); g.connect(master); o.start(); o.stop(ac.currentTime + 2); },
    };
  })();
  const sb = $('#sound');
  sb.addEventListener('click', () => { const on = sound.toggle(); sb.classList.toggle('on', on); sb.setAttribute('aria-pressed', on); });
  if (store.get('kv-sound')) {
    // browsers need a gesture before audio: resume on the first one
    const resume = () => { if (!sound.on) sb.click(); removeEventListener('pointerdown', resume); removeEventListener('keydown', resume); };
    addEventListener('pointerdown', resume); addEventListener('keydown', resume);
  }
  $$('.door').forEach(dr => dr.addEventListener('pointerenter', () => sound.chime()));

  /* ---------- secrets: type "keith" or "build"; double-click to scatter ---------- */
  let typed = '';
  addEventListener('keydown', e => {
    if (e.target.matches('input,textarea')) return;
    typed = (typed + e.key.toLowerCase()).slice(-5);
    if (typed === 'keith' || typed === 'build') { setOverride('mono:KV'); burst(30); sound.chime(); toast('You found the builder. Now let’s build something.'); setTimeout(() => setOverride(null), 4000); }
  });
  addEventListener('dblclick', e => { if (!e.target.closest('a,button,input')) burst(24); });

  /* ---------- boot ---------- */
  async function boot() {
    resize();
    const carried = loadLights();
    if (!carried) initBurst();
    setScene(d.body.dataset.scene || 'drift', true);
    requestAnimationFrame(frame);
    if (d.fonts.status !== 'loaded') Promise.race([d.fonts.ready, new Promise(r => setTimeout(r, 2500))]).then(() => { cache = {}; targetsFor('constellation'); apply(override || scene); }).catch(() => {});
    if (first) {
      const lines = ['Gathering the lights', 'Digitalx', 'The Foundation', 'Go Ads', 'SANA', 'GetClient', 'Advera', 'and every brand between'];
      const ll = $('#loaderLine'), lb = $('#loaderBar'), t0 = performance.now(), dur = reduce ? 200 : 2600;
      await new Promise(res => { const step = now => { const p = Math.min(1, (now - t0) / dur); ll.textContent = lines[Math.min(lines.length - 1, Math.floor(p * lines.length))]; lb.style.width = (1 - Math.pow(1 - p, 3)) * 100 + '%'; p < 1 ? requestAnimationFrame(step) : res(); }; requestAnimationFrame(step); });
      $('#loader').classList.add('done'); store.set('kv-seen', '1');
      setTimeout(() => { root.classList.remove('first'); $('#loader').remove(); }, 1300);
    }
    $$('.hero').forEach(h => h.classList.add('go'));
    setTimeout(measure, 1600); addEventListener('resize', () => setTimeout(measure, 300));
    $$('[data-scene]').forEach(el => { if (el !== d.body) sio.observe(el); });
    $$('.reveal').forEach(el => rio.observe(el));
    if (OG) $$('.reveal').forEach(el => el.classList.add('in'));
  }
  boot();
})();
