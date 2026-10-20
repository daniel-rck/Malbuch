<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Malbuch</title>
<style>
:root{
  --sky:#BFE0FF; --dot:#A8D1FA; --tray:#24306E; --tray-2:#33428F;
  --sun:#FFD23F; --paper:#FFFFFF; --shadow:#8BBDEB; --on-tray:#FFFFFF;
  box-sizing:border-box;
  padding-top:env(safe-area-inset-top,0px);
  padding-bottom:env(safe-area-inset-bottom,0px);
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --sky:#11183D; --dot:#1A2454; --tray:#1D2860; --tray-2:#2C3B85; --shadow:#060A20;
  }
}
:root[data-theme="dark"]{ --sky:#11183D; --dot:#1A2454; --tray:#1D2860; --tray-2:#2C3B85; --shadow:#060A20; }
*,*::before,*::after{box-sizing:inherit}
html{height:100%;scroll-padding-top:env(safe-area-inset-top,0px)}
body{
  height:100%; margin:0; overscroll-behavior:none;
  font-family:ui-rounded,"SF Pro Rounded",system-ui,sans-serif;
  background:var(--sky);
  background-image:radial-gradient(var(--dot) 2.5px, transparent 3px);
  background-size:28px 28px;
  -webkit-user-select:none; user-select:none; -webkit-tap-highlight-color:transparent;
}
button{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
button:focus-visible{outline:4px solid var(--sun);outline-offset:3px}

.app{height:100%;display:grid;grid-template-rows:auto minmax(0,1fr) auto}

.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px 4px}
.pages{display:flex;gap:10px}
.thumb{
  width:48px;height:60px;padding:0;border:3px solid transparent;border-radius:12px;
  background:var(--paper);box-shadow:0 4px 0 var(--shadow);overflow:hidden;
  transition:transform .15s;
}
.thumb svg{width:100%;height:100%;display:block}
.thumb[aria-pressed="true"]{border-color:var(--sun);transform:translateY(-3px) rotate(-3deg)}
.actions{display:flex;gap:10px}
.round{
  width:52px;height:52px;border-radius:50%;border:none;display:grid;place-items:center;
  background:var(--tray);color:var(--on-tray);box-shadow:0 4px 0 var(--shadow);
}
.round:active{transform:translateY(2px);box-shadow:0 2px 0 var(--shadow)}
.round:disabled{opacity:.4}
.round svg,.tool svg{width:26px;height:26px}

.stage{min-height:0;display:grid;place-items:center;padding:8px 12px 14px}
.paper{
  position:relative;background:var(--paper);border:4px solid var(--tray);border-radius:22px;
  box-shadow:0 8px 0 var(--shadow);overflow:hidden;touch-action:none;
}
.paper canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}

.tray{
  background:var(--tray);color:var(--on-tray);border-radius:28px 28px 0 0;
  padding:14px 14px 16px;display:grid;gap:14px;
}
.tools{display:flex;align-items:center;justify-content:space-between;gap:10px}
.toolset,.sizes{display:flex;gap:8px}
.tool{
  width:52px;height:52px;border:none;border-radius:16px;display:grid;place-items:center;
  background:var(--tray-2);color:var(--on-tray);
}
.tool[aria-pressed="true"]{background:var(--sun);color:var(--tray)}
.size{
  width:44px;height:44px;border:none;border-radius:50%;display:grid;place-items:center;
  background:var(--tray-2);
}
.size[aria-pressed="true"]{background:var(--sun)}
.size i{display:block;border-radius:50%;background:var(--current);box-shadow:inset 0 0 0 2px rgba(0,0,0,.18)}
.is-eraser .size i{background:#fff;box-shadow:inset 0 0 0 2px #9aa3c7}

.colors{display:grid;grid-template-columns:repeat(8,1fr);gap:9px}
.blob{
  aspect-ratio:1;border:none;padding:0;background:var(--c);
  border-radius:47% 53% 44% 56% / 56% 42% 58% 44%;
  box-shadow:inset -4px -5px 0 rgba(0,0,0,.2), inset 3px 3px 0 rgba(255,255,255,.35);
  transition:transform .15s;
}
.blob:nth-child(3n+1){border-radius:55% 45% 52% 48% / 46% 56% 44% 54%}
.blob:nth-child(3n+2){border-radius:42% 58% 60% 40% / 52% 48% 52% 48%}
.blob[aria-pressed="true"]{transform:scale(1.2) rotate(-8deg);outline:4px solid var(--sun);outline-offset:2px}

@media (min-width:760px) and (min-aspect-ratio:1/1){
  .app{grid-template-columns:minmax(0,1fr) 320px;grid-template-rows:auto minmax(0,1fr)}
  .top{grid-column:1}
  .stage{grid-column:1;grid-row:2}
  .tray{grid-column:2;grid-row:1 / span 2;align-self:center;margin:16px;border-radius:28px}
  .tools{flex-direction:column;align-items:stretch}
  .toolset,.sizes{justify-content:space-between}
  .colors{grid-template-columns:repeat(4,1fr);gap:14px}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>
<div class="app">
  <header class="top">
    <nav class="pages" id="pages" aria-label="Bild wählen"></nav>
    <div class="actions">
      <button class="round" id="undo" aria-label="Rückgängig" disabled>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5L4 10l5 5"/><path d="M4 10h10a5 5 0 010 10h-3"/></svg>
      </button>
      <button class="round" id="clear" aria-label="Alles wegmachen">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/></svg>
      </button>
    </div>
  </header>

  <main class="stage" id="stage">
    <div class="paper" id="paper">
      <canvas id="paint" width="800" height="1000"></canvas>
      <canvas id="live" width="800" height="1000"></canvas>
      <canvas id="lines" width="800" height="1000"></canvas>
    </div>
  </main>

  <section class="tray" id="tray">
    <div class="tools">
      <div class="toolset" role="group" aria-label="Werkzeug">
        <button class="tool" data-tool="pen" aria-label="Stift" aria-pressed="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round"><path d="M4 20l1.4-4.6L16 4.8a2.1 2.1 0 013 3L8.4 18.6z"/><path d="M14 6.8l3.2 3.2"/></svg>
        </button>
        <button class="tool" data-tool="fill" aria-label="Farbeimer" aria-pressed="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round"><path d="M5.5 10.5L12 4l7 7-6.6 6.6a2 2 0 01-2.8 0l-4.1-4.2a2 2 0 010-2.9z"/><path d="M5 11h14"/><path d="M20.5 15s-2 2.3-2 3.6a2 2 0 004 0c0-1.3-2-3.6-2-3.6z" fill="currentColor"/></svg>
        </button>
        <button class="tool" data-tool="eraser" aria-label="Radiergummi" aria-pressed="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round"><path d="M9 20h11"/><path d="M4.6 14.4l9.2-9.2a2 2 0 012.8 0l3.2 3.2a2 2 0 010 2.8L12 19H8.8z"/><path d="M9.5 9.5l5 5"/></svg>
        </button>
      </div>
      <div class="sizes" id="sizes" role="group" aria-label="Stiftgröße"></div>
    </div>
    <div class="colors" id="colors" role="group" aria-label="Farbe"></div>
  </section>
</div>

<script>
(() => {
const W = 800, H = 1000, N = W * H;

/* ---------- Ausmalbilder (eigene Zeichnungen) ---------- */
const star = (cx, cy, r1, r2) => {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1;
    p.push((cx + Math.cos(a) * r).toFixed(1) + ',' + (cy + Math.sin(a) * r).toFixed(1));
  }
  return `<polygon points="${p.join(' ')}"/>`;
};
const rays = (cx, cy, r1, r2, n) => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = i * 2 * Math.PI / n;
    s += `<path fill="none" d="M${cx + Math.cos(a) * r1} ${cy + Math.sin(a) * r1} L${cx + Math.cos(a) * r2} ${cy + Math.sin(a) * r2}"/>`;
  }
  return s;
};
const petals = (cx, cy) => {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
    s += `<circle cx="${cx + Math.cos(a) * 22}" cy="${cy + Math.sin(a) * 22}" r="17"/>`;
  }
  return s + `<circle cx="${cx}" cy="${cy}" r="13"/>`;
};
const say = (x, y, size, t) =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" font-weight="700" font-family="Arial, Helvetica, sans-serif" fill="#222" stroke="none">${t}</text>`;

const PAGES = [
{ id: 'drache', name: 'Drache', art: `
<rect x="20" y="20" width="760" height="960" rx="28"/>
<path fill="none" d="M20 820 Q230 770 420 805 T780 795"/>
${rays(130, 140, 72, 100, 10)}
<circle cx="130" cy="140" r="55"/>
<path d="M440 120 Q440 50 595 50 Q750 50 750 120 Q750 190 610 190 L560 190 L505 255 L520 188 Q440 182 440 120 Z"/>
${say(595, 142, 62, 'Hallo!')}
<path fill="none" d="M110 812 Q100 770 110 742"/>
<path d="M106 790 Q78 772 72 792 Q92 804 106 790 Z"/>
${petals(110, 718)}
<path d="M500 640 Q640 660 640 560 L615 545 L665 490 L700 565 L672 560 Q690 720 500 710 Z"/>
<path d="M280 540 Q150 470 170 360 Q215 420 250 420 Q235 370 270 350 Q290 420 330 460 Z"/>
<path d="M480 540 Q610 470 590 360 Q545 420 510 420 Q525 370 490 350 Q470 420 430 460 Z"/>
<ellipse cx="380" cy="625" rx="165" ry="160"/>
<ellipse cx="380" cy="655" rx="95" ry="112"/>
<path fill="none" d="M288 612 Q380 630 472 612"/>
<path fill="none" d="M285 662 Q380 680 475 662"/>
<path fill="none" d="M297 712 Q380 728 463 712"/>
<ellipse cx="300" cy="795" rx="65" ry="32"/>
<ellipse cx="460" cy="795" rx="65" ry="32"/>
<ellipse cx="240" cy="600" rx="30" ry="52" transform="rotate(35 240 600)"/>
<ellipse cx="520" cy="600" rx="30" ry="52" transform="rotate(-35 520 600)"/>
<polygon points="322,300 300,212 360,282"/>
<polygon points="438,300 460,212 400,282"/>
<circle cx="380" cy="390" r="120"/>
<ellipse cx="380" cy="448" rx="72" ry="44"/>
<circle cx="358" cy="436" r="6" fill="#222"/>
<circle cx="402" cy="436" r="6" fill="#222"/>
<path fill="none" d="M348 468 Q380 492 412 468"/>
<circle cx="335" cy="356" r="30"/><circle cx="425" cy="356" r="30"/>
<circle cx="342" cy="362" r="13" fill="#222"/><circle cx="432" cy="362" r="13" fill="#222"/>
<circle cx="347" cy="356" r="4" fill="#fff" stroke="none"/><circle cx="437" cy="356" r="4" fill="#fff" stroke="none"/>
`},
{ id: 'roboter', name: 'Roboter und Katze', art: `
<rect x="20" y="20" width="760" height="960" rx="28"/>
<path fill="none" d="M20 800 L780 800"/>
<rect x="50" y="60" width="110" height="110" rx="10"/>
<path fill="none" d="M105 60 L105 170 M50 115 L160 115"/>
${star(78, 88, 14, 6)}
<path fill="none" d="M300 150 L300 108"/>
<circle cx="300" cy="90" r="18"/>
<rect x="180" y="210" width="30" height="60" rx="8"/>
<rect x="390" y="210" width="30" height="60" rx="8"/>
<rect x="200" y="150" width="200" height="160" rx="30"/>
<circle cx="255" cy="220" r="26"/><circle cx="345" cy="220" r="26"/>
<circle cx="255" cy="222" r="10" fill="#222"/><circle cx="345" cy="222" r="10" fill="#222"/>
<rect x="245" y="258" width="110" height="30" rx="10"/>
<path fill="none" d="M272 258 L272 288 M300 258 L300 288 M327 258 L327 288"/>
<rect x="270" y="305" width="60" height="30"/>
<rect x="130" y="360" width="50" height="170" rx="25"/>
<rect x="420" y="360" width="50" height="170" rx="25"/>
<circle cx="155" cy="555" r="28"/><circle cx="445" cy="555" r="28"/>
<rect x="215" y="595" width="55" height="150"/>
<rect x="330" y="595" width="55" height="150"/>
<rect x="170" y="330" width="260" height="270" rx="30"/>
<rect x="215" y="380" width="170" height="110" rx="14"/>
<circle cx="250" cy="435" r="18"/><circle cx="300" cy="435" r="18"/><circle cx="350" cy="435" r="18"/>
<rect x="215" y="515" width="170" height="50" rx="12"/>
<path fill="none" d="M255 515 L255 565 M300 515 L300 565 M345 515 L345 565"/>
<rect x="195" y="740" width="95" height="60" rx="20"/>
<rect x="310" y="740" width="95" height="60" rx="20"/>
<circle cx="95" cy="752" r="48"/>
<path fill="none" d="M62 718 Q96 758 70 796 M120 709 Q100 754 132 788"/>
<path d="M680 770 Q790 760 760 640 Q752 612 728 626 Q748 715 670 740 Z"/>
<ellipse cx="610" cy="705" rx="95" ry="95"/>
<ellipse cx="610" cy="725" rx="52" ry="62"/>
<ellipse cx="575" cy="798" rx="30" ry="15"/><ellipse cx="645" cy="798" rx="30" ry="15"/>
<polygon points="545,555 548,470 600,520"/>
<polygon points="675,555 672,470 620,520"/>
<circle cx="610" cy="575" r="78"/>
<circle cx="610" cy="664" r="12"/>
<ellipse cx="582" cy="566" rx="14" ry="19"/><ellipse cx="638" cy="566" rx="14" ry="19"/>
<ellipse cx="584" cy="569" rx="6" ry="11" fill="#222"/><ellipse cx="640" cy="569" rx="6" ry="11" fill="#222"/>
<polygon points="602,598 618,598 610,609" fill="#222"/>
<path fill="none" d="M610 609 Q602 624 590 617 M610 609 Q618 624 630 617"/>
<path fill="none" d="M560 600 L512 590 M560 612 L510 616 M660 600 L708 590 M660 612 L710 616"/>
<path d="M500 320 Q500 250 625 250 Q750 250 750 320 Q750 390 640 390 L620 390 L590 455 L585 388 Q500 385 500 320 Z"/>
${say(625, 342, 60, 'Miau!')}
`},
{ id: 'weltraum', name: 'Weltraum', art: `
<rect x="20" y="20" width="760" height="470" rx="24"/>
<rect x="20" y="510" width="760" height="470" rx="24"/>
<rect x="40" y="40" width="210" height="64" rx="10"/>
${say(145, 86, 40, '3, 2, 1 …')}
${star(120, 200, 30, 13)}${star(700, 80, 22, 10)}${star(480, 425, 20, 9)}${star(110, 385, 18, 8)}${star(470, 95, 16, 7)}
<path d="M262 380 Q300 470 338 380 Z"/>
<path d="M282 380 Q300 428 318 380 Z"/>
<polygon points="245,300 195,385 255,370"/>
<polygon points="355,300 405,385 345,370"/>
<path d="M300 70 Q370 150 360 300 L355 380 L245 380 L240 300 Q230 150 300 70 Z"/>
<path fill="none" d="M253 155 Q300 177 347 155"/>
<path fill="none" d="M243 340 L357 340"/>
<circle cx="300" cy="235" r="38"/><circle cx="300" cy="235" r="25"/>
<ellipse fill="none" cx="600" cy="270" rx="160" ry="38" transform="rotate(-15 600 270)"/>
<circle cx="600" cy="260" r="95"/>
<path fill="none" d="M440 270 A160 38 0 0 0 760 270" transform="rotate(-15 600 270)"/>
<circle cx="570" cy="215" r="18"/><circle cx="635" cy="300" r="12"/>
${star(110, 580, 18, 8)}${star(200, 665, 12, 5)}${star(725, 700, 16, 7)}
<path fill="none" d="M20 880 Q200 830 400 870 T780 860"/>
<ellipse cx="140" cy="930" rx="50" ry="14"/>
<ellipse cx="620" cy="935" rx="60" ry="16"/>
<path fill="none" d="M560 875 L560 640"/>
<polygon points="560,640 680,668 560,700"/>
<rect x="285" y="875" width="46" height="62" rx="18"/>
<rect x="349" y="875" width="46" height="62" rx="18"/>
<rect x="268" y="770" width="144" height="115" rx="40"/>
<rect x="312" y="815" width="56" height="38" rx="8"/>
<circle cx="328" cy="834" r="6"/><circle cx="352" cy="834" r="6"/>
<ellipse cx="262" cy="820" rx="24" ry="46" transform="rotate(25 262 820)"/>
<ellipse cx="418" cy="820" rx="24" ry="46" transform="rotate(-25 418 820)"/>
<ellipse cx="305" cy="592" rx="22" ry="58" transform="rotate(-10 305 592)"/>
<ellipse cx="305" cy="592" rx="9" ry="38" transform="rotate(-10 305 592)"/>
<ellipse cx="375" cy="592" rx="22" ry="58" transform="rotate(10 375 592)"/>
<ellipse cx="375" cy="592" rx="9" ry="38" transform="rotate(10 375 592)"/>
<circle cx="340" cy="705" r="95"/>
<path fill="none" d="M275 668 Q290 630 325 616"/>
<circle cx="340" cy="712" r="62"/>
<circle cx="318" cy="700" r="9" fill="#222"/><circle cx="362" cy="700" r="9" fill="#222"/>
<ellipse cx="340" cy="722" rx="8" ry="6" fill="#222"/>
<path fill="none" d="M340 728 Q330 744 320 736 M340 728 Q350 744 360 736"/>
<circle cx="302" cy="728" r="10"/><circle cx="378" cy="728" r="10"/>
<path d="M480 575 Q480 528 618 528 Q756 528 756 575 Q756 622 618 622 L520 622 L440 650 L490 615 Q480 600 480 575 Z"/>
${say(618, 590, 44, 'Hallo Mond!')}
`}
];

const svgFor = (art, sized) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000"${sized ? ' width="800" height="1000"' : ''}>` +
  `<g fill="#fff" stroke="#222" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">${art}</g></svg>`;

const COLORS = [
  ['#E53935','Rot'],['#FB8C00','Orange'],['#FDD835','Gelb'],['#8BC34A','Hellgrün'],
  ['#2E7D32','Grün'],['#26C6DA','Türkis'],['#1E88E5','Blau'],['#283593','Dunkelblau'],
  ['#8E24AA','Lila'],['#F06292','Rosa'],['#F7D0B0','Hell'],['#C68642','Hellbraun'],
  ['#6D4C41','Braun'],['#9E9E9E','Grau'],['#212121','Schwarz'],['#FFFFFF','Weiß']
];
const SIZES = [[8,8,'Dünn'],[16,14,'Mittel'],[30,22,'Dick'],[52,30,'Ganz dick']];

const state = { tool: 'pen', color: COLORS[0][0], size: 30, page: PAGES[0].id };

/* ---------- Canvas-Setup ---------- */
const $ = id => document.getElementById(id);
const paper = $('paper'), stage = $('stage');
const paintCtx = $('paint').getContext('2d', { willReadFrequently: true });
const liveCtx = $('live').getContext('2d');
const linesCtx = $('lines').getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const strokeCv = mk(), strokeCtx = strokeCv.getContext('2d');
const maskCv = mk(), maskCtx = maskCv.getContext('2d');
const mImg = maskCtx.createImageData(W, H);
const mbuf = new Uint8Array(N);
let lab = new Int32Array(N), bx0 = [], by0 = [], bx1 = [], by1 = [];
let maskId = -1, prevBox = null;

function fit() {
  const r = stage.getBoundingClientRect();
  const cs = getComputedStyle(stage);
  const cw = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const ch = r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const w = Math.max(120, Math.min(cw, ch * 0.8));
  paper.style.width = w + 'px';
  paper.style.height = (w * 1.25) + 'px';
}
new ResizeObserver(fit).observe(stage);

/* ---------- Linienbild laden + Flächen erkennen ---------- */
function loadArt(page) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const c = mk(), x = c.getContext('2d', { willReadFrequently: true });
      x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(img, 0, 0, W, H);
      const src = x.getImageData(0, 0, W, H).data;
      const out = linesCtx.createImageData(W, H), o = out.data;
      lab = new Int32Array(N);
      for (let i = 0; i < N; i++) {
        const j = i * 4;
        const dark = 255 - (src[j] * 0.299 + src[j + 1] * 0.587 + src[j + 2] * 0.114);
        o[j] = 30; o[j + 1] = 34; o[j + 2] = 56; o[j + 3] = Math.min(255, dark * 1.25);
        if (dark > 110) lab[i] = -1;
      }
      linesCtx.putImageData(out, 0, 0);
      labelRegions();
      maskId = -1; prevBox = null; mbuf.fill(0); mImg.data.fill(0);
      res();
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgFor(page.art, true));
  });
}

function labelRegions() {
  const st = new Int32Array(N);
  bx0 = [0]; by0 = [0]; bx1 = [0]; by1 = [0];
  let id = 0;
  for (let s = 0; s < N; s++) {
    if (lab[s] !== 0) continue;
    id++;
    let sp = 0, minx = W, miny = H, maxx = 0, maxy = 0;
    st[sp++] = s; lab[s] = id;
    while (sp) {
      const p = st[--sp], x = p % W, y = (p / W) | 0;
      if (x < minx) minx = x; if (x > maxx) maxx = x;
      if (y < miny) miny = y; if (y > maxy) maxy = y;
      if (x > 0 && lab[p - 1] === 0) { lab[p - 1] = id; st[sp++] = p - 1; }
      if (x < W - 1 && lab[p + 1] === 0) { lab[p + 1] = id; st[sp++] = p + 1; }
      if (p >= W && lab[p - W] === 0) { lab[p - W] = id; st[sp++] = p - W; }
      if (p + W < N && lab[p + W] === 0) { lab[p + W] = id; st[sp++] = p + W; }
    }
    bx0.push(minx); by0.push(miny); bx1.push(maxx); by1.push(maxy);
  }
}

function regionAt(x, y) {
  x |= 0; y |= 0;
  for (let r = 0; r <= 18; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const l = lab[yy * W + xx];
        if (l > 0) return l;
      }
  return 0;
}

/* Maske = Fläche + angrenzender Linienrand, damit keine weißen Ritzen bleiben */
function buildMask(id) {
  if (id === maskId) return;
  const md = mImg.data;
  if (prevBox) {
    const [a, b, c, d] = prevBox;
    for (let y = b; y <= d; y++) for (let x = a; x <= c; x++) { const i = y * W + x; mbuf[i] = 0; md[i * 4 + 3] = 0; }
  }
  const P = 9;
  const x0 = Math.max(0, bx0[id] - P), y0 = Math.max(0, by0[id] - P);
  const x1 = Math.min(W - 1, bx1[id] + P), y1 = Math.min(H - 1, by1[id] + P);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * W + x; mbuf[i] = lab[i] === id ? 1 : 0; }
  for (let k = 1; k <= P; k++) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * W + x;
      if (mbuf[i] || lab[i] !== -1) continue;
      let v;
      if ((x > 0 && (v = mbuf[i - 1]) && v <= k) || (x < W - 1 && (v = mbuf[i + 1]) && v <= k) ||
          (y > 0 && (v = mbuf[i - W]) && v <= k) || (y < H - 1 && (v = mbuf[i + W]) && v <= k)) mbuf[i] = k + 1;
    }
  }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * W + x; md[i * 4 + 3] = mbuf[i] ? 255 : 0; }
  maskCtx.putImageData(mImg, 0, 0);
  prevBox = [x0, y0, x1, y1]; maskId = id;
}

/* ---------- Rückgängig + Speichern ---------- */
const undoStack = [];
function pushUndo() {
  undoStack.push(paintCtx.getImageData(0, 0, W, H));
  if (undoStack.length > 10) undoStack.shift();
  $('undo').disabled = false;
}
let saveT;
function save() {
  clearTimeout(saveT);
  const key = 'malbuch-v1:' + state.page;
  saveT = setTimeout(() => {
    try { localStorage.setItem(key, $('paint').toDataURL('image/png')); } catch (e) {}
  }, 500);
}
function restore() {
  paintCtx.clearRect(0, 0, W, H);
  let data = null;
  try { data = localStorage.getItem('malbuch-v1:' + state.page); } catch (e) {}
  if (!data) return;
  const img = new Image();
  img.onload = () => paintCtx.drawImage(img, 0, 0);
  img.src = data;
}

/* ---------- Malen ---------- */
let active = null, last = null, clipped = true, dirty = false;

function toPt(e) {
  const r = paper.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
function seg(ctx, a, b, w) {
  ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x + 0.01, b.y); ctx.stroke();
}
function compose() {
  dirty = false;
  liveCtx.globalCompositeOperation = 'copy';
  liveCtx.drawImage(strokeCv, 0, 0);
  if (clipped) {
    liveCtx.globalCompositeOperation = 'destination-in';
    liveCtx.drawImage(maskCv, 0, 0);
  }
  liveCtx.globalCompositeOperation = 'source-over';
}
function schedule() { if (!dirty) { dirty = true; requestAnimationFrame(compose); } }

function prepClip(p) {
  const id = regionAt(p.x, p.y);
  clipped = id > 0;
  if (clipped) buildMask(id);
}

paper.addEventListener('pointerdown', e => {
  if (active !== null) return;
  e.preventDefault();
  const p = toPt(e);
  if (state.tool === 'fill') {
    prepClip(p);
    if (!clipped) return;
    pushUndo();
    strokeCtx.globalCompositeOperation = 'copy';
    strokeCtx.fillStyle = state.color; strokeCtx.fillRect(0, 0, W, H);
    strokeCtx.globalCompositeOperation = 'source-over';
    compose();
    paintCtx.drawImage($('live'), 0, 0);
    liveCtx.clearRect(0, 0, W, H); strokeCtx.clearRect(0, 0, W, H);
    save();
    return;
  }
  active = e.pointerId; last = p;
  paper.setPointerCapture(e.pointerId);
  pushUndo();
  if (state.tool === 'eraser') {
    paintCtx.globalCompositeOperation = 'destination-out';
    paintCtx.strokeStyle = '#000';
    seg(paintCtx, p, p, state.size * 1.4);
    paintCtx.globalCompositeOperation = 'source-over';
  } else {
    prepClip(p);
    strokeCtx.clearRect(0, 0, W, H);
    strokeCtx.strokeStyle = state.color;
    seg(strokeCtx, p, p, state.size);
    schedule();
  }
});

paper.addEventListener('pointermove', e => {
  if (e.pointerId !== active) return;
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const ev of (evs.length ? evs : [e])) {
    const p = toPt(ev);
    if (state.tool === 'eraser') {
      paintCtx.globalCompositeOperation = 'destination-out';
      seg(paintCtx, last, p, state.size * 1.4);
      paintCtx.globalCompositeOperation = 'source-over';
    } else {
      seg(strokeCtx, last, p, state.size);
    }
    last = p;
  }
  if (state.tool !== 'eraser') schedule();
});

function finish(e) {
  if (e.pointerId !== active) return;
  active = null;
  if (state.tool !== 'eraser') {
    compose();
    paintCtx.drawImage($('live'), 0, 0);
    liveCtx.clearRect(0, 0, W, H);
    strokeCtx.clearRect(0, 0, W, H);
  }
  save();
}
paper.addEventListener('pointerup', finish);
paper.addEventListener('pointercancel', finish);

/* ---------- Bedienelemente ---------- */
function press(group, el) {
  group.querySelectorAll('[aria-pressed]').forEach(b => b.setAttribute('aria-pressed', String(b === el)));
}

const colorsEl = $('colors');
COLORS.forEach(([c, name], i) => {
  const b = document.createElement('button');
  b.className = 'blob'; b.style.setProperty('--c', c);
  b.setAttribute('aria-label', name); b.setAttribute('aria-pressed', String(i === 0));
  b.onclick = () => {
    state.color = c; press(colorsEl, b);
    document.documentElement.style.setProperty('--current', c);
    if (state.tool === 'eraser') setTool('pen');
  };
  colorsEl.appendChild(b);
});
document.documentElement.style.setProperty('--current', state.color);

const sizesEl = $('sizes');
SIZES.forEach(([s, d, name]) => {
  const b = document.createElement('button');
  b.className = 'size'; b.setAttribute('aria-label', name);
  b.setAttribute('aria-pressed', String(s === state.size));
  b.innerHTML = `<i style="width:${d}px;height:${d}px"></i>`;
  b.onclick = () => { state.size = s; press(sizesEl, b); };
  sizesEl.appendChild(b);
});

const toolset = document.querySelector('.toolset');
function setTool(t) {
  state.tool = t;
  press(toolset, toolset.querySelector(`[data-tool="${t}"]`));
  $('tray').classList.toggle('is-eraser', t === 'eraser');
}
toolset.querySelectorAll('.tool').forEach(b => b.onclick = () => setTool(b.dataset.tool));

$('undo').onclick = () => {
  const s = undoStack.pop();
  if (s) { paintCtx.putImageData(s, 0, 0); save(); }
  $('undo').disabled = undoStack.length === 0;
};
$('clear').onclick = () => { pushUndo(); paintCtx.clearRect(0, 0, W, H); save(); };
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); $('undo').click(); }
});

const pagesEl = $('pages');
async function openPage(page) {
  state.page = page.id;
  undoStack.length = 0; $('undo').disabled = true;
  liveCtx.clearRect(0, 0, W, H); strokeCtx.clearRect(0, 0, W, H);
  await loadArt(page);
  restore();
}
PAGES.forEach((pg, i) => {
  const b = document.createElement('button');
  b.className = 'thumb'; b.setAttribute('aria-label', pg.name);
  b.setAttribute('aria-pressed', String(i === 0));
  b.innerHTML = svgFor(pg.art, false);
  b.onclick = () => { if (state.page === pg.id) return; press(pagesEl, b); openPage(pg); };
  pagesEl.appendChild(b);
});

fit();
openPage(PAGES[0]);
})();
</script>
</body>
</html>
