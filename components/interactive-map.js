export default class InteractiveMap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._cam = { x: 0, y: 0, s: 1 };
    this._drag = { active: false, startX: 0, startY: 0, camStartX: 0, camStartY: 0, moved: false };
    this._pinch = { active: false, dist: 0, midX: 0, midY: 0, camStartX: 0, camStartY: 0, startS: 1 };
    this._destinos = [];
    this._svgPaths = {};
    this._provincias = {
      CRG:  { nombre: 'Guanacaste', color: '#D4841A', cx: 300, cy: 180, zoom: 2.8 },
      CRA:  { nombre: 'Alajuela',   color: '#2E86DE', cx: 500, cy: 160, zoom: 3.0 },
      CRH:  { nombre: 'Heredia',    color: '#8E44AD', cx: 620, cy: 185, zoom: 4.5 },
      CRSJ: { nombre: 'San José',   color: '#27AE60', cx: 590, cy: 310, zoom: 3.5 },
      CRC:  { nombre: 'Cartago',    color: '#E85D4A', cx: 680, cy: 280, zoom: 4.0 },
      CRL:  { nombre: 'Limón',      color: '#1ABC9C', cx: 780, cy: 280, zoom: 2.2 },
      CRP:  { nombre: 'Puntarenas', color: '#E67E22', cx: 420, cy: 400, zoom: 1.6 },
    };
  }

  async connectedCallback() {
    const [paths, destinos] = await Promise.all([
      fetch('./data/map-paths.json').then(r => r.json()),
      fetch('./data/destinos.json').then(r => r.json()),
    ]);
    this._svgPaths = paths;
    this._destinos = destinos;

    this.shadowRoot.innerHTML = `<style>${this._css()}</style>${this._html()}`;
    this._bindAll();
  }

  _html() {
    // Province path elements
    let provPaths = '';
    for (const [key, d] of Object.entries(this._svgPaths)) {
      if (d) provPaths += `<path class="prov" data-p="${key}" d="${d}"/>`;
    }

    // Province labels
    const labels = {
      CRG: [290, 175], CRA: [500, 150], CRH: [625, 178],
      CRSJ: [580, 295], CRC: [680, 270], CRL: [780, 280], CRP: [420, 400]
    };
    let provLabels = '';
    for (const [key, [x, y]] of Object.entries(labels)) {
      const p = this._provincias[key];
      if (p) provLabels += `<text class="pl" data-l="${key}" x="${x}" y="${y}">${p.nombre}</text>`;
    }

    // Pin markers
    let pins = this._destinos.map(d => {
      const c = this._provincias[d.region]?.color || '#a8d5a2';
      return `<g class="pin" data-id="${d.id}" data-p="${d.region}">
        <circle class="pin-ring" cx="${d.cx}" cy="${d.cy}" r="12" stroke="${c}" style="animation-delay:${(Math.random()*2).toFixed(1)}s"/>
        <circle class="pin-dot" cx="${d.cx}" cy="${d.cy}" r="5" fill="${c}"/>
        <text class="pin-lbl" x="${d.cx}" y="${d.cy - 14}">${d.nombre}</text>
      </g>`;
    }).join('');

    return `
      <div class="wrap">
        <div class="vp" id="vp">
          <div class="cam" id="cam">
            <svg id="m" viewBox="0 0 1000 560" xmlns="http://www.w3.org/2000/svg">
              <rect width="1000" height="560" fill="#0a1f14"/>
              <text class="ol" x="820" y="50">Mar Caribe</text>
              <text class="ol" x="60" y="540">Océano Pacífico</text>
              <g>${provPaths}</g>
              <g>${provLabels}</g>
              <g>${pins}</g>
            </svg>
          </div>
        </div>
      </div>
    `;
  }

  _css() {
    return `
      :host { display: block; width: 100%; border-radius: var(--radius-xl, 16px); overflow: hidden; }
      .wrap { position: relative; width: 100%; height: min(560px, 56vw); min-height: 240px; background: #0a1f14; }
      @media (max-width: 700px) { .wrap { height: min(400px, 75vw); } }
      .vp { width: 100%; height: 100%; cursor: grab; overflow: hidden; touch-action: none; user-select: none; }
      .vp.dragging { cursor: grabbing; }
      .cam { width: 100%; height: 100%; transform-origin: 0 0; transition: transform 0.5s cubic-bezier(0.2, 0, 0, 1); }
      .cam.no-transition { transition: none; }
      svg { width: 100%; height: 100%; display: block; }
      .prov { fill: #1e5a34; stroke: rgba(168,213,162,.2); stroke-width: 1; transition: fill .4s, stroke .4s; cursor: pointer; }
      @media (hover: hover) {
        .prov:hover { fill: #2a7a48; stroke: rgba(168,213,162,.45); }
      }
      .prov:focus  { outline: none; }
      .prov        { -webkit-tap-highlight-color: transparent; }
      .prov.active { stroke: rgba(94,196,160,.6); stroke-width: 2; filter: brightness(1.25) drop-shadow(0 0 12px rgba(94,196,160,.35)); }
      .pl { font-family: 'DM Sans', system-ui, sans-serif; font-size: 11px; font-weight: 600; fill: rgba(168,213,162,.35); pointer-events: none; text-anchor: middle; letter-spacing: .06em; text-transform: uppercase; transition: fill .4s; }
      .pl.active { fill: rgba(232,239,227,.85); }
      .ol { font-family: 'DM Sans', system-ui, sans-serif; font-size: 10px; font-weight: 500; fill: rgba(94,196,160,.12); letter-spacing: .25em; text-transform: uppercase; pointer-events: none; }
      .pin { cursor: pointer; }
      .pin-dot { stroke: #0a1f14; stroke-width: 1.5; transition: r .25s; }
      .pin-ring { fill: none; stroke-width: 1.5; opacity: 0; animation: rp 2.8s ease-in-out infinite; }
      @keyframes rp { 0%,100%{r:10;opacity:0} 40%{r:16;opacity:.35} 80%{r:22;opacity:0} }
      .pin-lbl { font-family: 'DM Sans', system-ui, sans-serif; font-size: 9.5px; font-weight: 500; fill: #e8efe3; text-anchor: middle; pointer-events: none; opacity: 0; transition: opacity .3s; paint-order: stroke; stroke: #0a1f14; stroke-width: 3px; }
      .pin:hover .pin-lbl { opacity: 1; }
      .pin:hover .pin-dot { r: 7; }
    `;
  }

  _clampCam() {
    const vp = this.shadowRoot.getElementById('vp');
    const cam = this.shadowRoot.getElementById('cam');
    if (!vp || !cam) return;

    const cW = vp.clientWidth;
    const cH = vp.clientHeight;
    const s  = this._cam.s;

    // The SVG is styled width:100% height:100% inside .cam, so at scale=1
    // it fills the container exactly. Actual rendered map size = container * scale.
    const scaledW = cW * s;
    const scaledH = cH * s;

    // --- Horizontal axis ---
    if (scaledW <= cW) {
      // Map fits (or equals) container width — center and lock
      this._cam.x = (cW - scaledW) / (2 * s);
    } else {
      // Map is wider than container: clamp so neither edge goes out of view
      // translateX is in pre-scale space; screen position = x * s
      // Right edge must stay >= 0:   x*s + scaledW >= cW  →  x >= (cW-scaledW)/s
      // Left  edge must stay <= 0:   x*s <= 0             →  x <= 0
      const minX = (cW - scaledW) / s;
      const maxX = 0;
      this._cam.x = Math.min(maxX, Math.max(minX, this._cam.x));
    }

    // --- Vertical axis ---
    if (scaledH <= cH) {
      // Map fits (or equals) container height — center and lock
      this._cam.y = (cH - scaledH) / (2 * s);
    } else {
      const minY = (cH - scaledH) / s;
      const maxY = 0;
      this._cam.y = Math.min(maxY, Math.max(minY, this._cam.y));
    }
  }

  _applyCam(animate = true) {
    const cam = this.shadowRoot.getElementById('cam');
    if (!animate) cam.classList.add('no-transition');
    else cam.classList.remove('no-transition');
    // transform order: translate first (in unscaled space), then scale from origin
    cam.style.transform = `scale(${this._cam.s}) translate(${this._cam.x}px, ${this._cam.y}px)`;
  }

  _bindAll() {
    const R = this.shadowRoot;
    const vp = R.getElementById('vp');

    vp.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      this._drag = { active: true, startX: e.clientX, startY: e.clientY, camStartX: this._cam.x, camStartY: this._cam.y, moved: false };
      vp.classList.add('dragging');
      vp.setPointerCapture(e.pointerId);
      R.getElementById('cam').classList.add('no-transition');
    });

    vp.addEventListener('pointermove', e => {
      if (!this._drag.active) return;
      const dx = e.clientX - this._drag.startX;
      const dy = e.clientY - this._drag.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this._drag.moved = true;
      this._cam.x = this._drag.camStartX + dx / this._cam.s;
      this._cam.y = this._drag.camStartY + dy / this._cam.s;
      this._clampCam();
      this._applyCam(false);
    });

    vp.addEventListener('pointerup', e => {
      this._drag.active = false;
      vp.classList.remove('dragging');
      vp.releasePointerCapture(e.pointerId);
      R.getElementById('cam').classList.remove('no-transition');
    });

    vp.addEventListener('wheel', e => {
      e.preventDefault();
      const oldS = this._cam.s;
      const newS = e.deltaY > 0 ? Math.max(1, oldS * 0.88) : Math.min(6, oldS * 1.14);
      if (newS === oldS) return;

      // Mouse position relative to the viewport element
      const rect = vp.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;   // pixels from vp left edge
      const mouseY = e.clientY - rect.top;    // pixels from vp top edge

      // Convert mouse position into the map's coordinate space (pre-scale)
      // With transform: scale(s) translate(x, y), a screen point maps to:
      //   mapX = mouseX / s - x
      //   mapY = mouseY / s - y
      const mapX = mouseX / oldS - this._cam.x;
      const mapY = mouseY / oldS - this._cam.y;

      // After scale change, adjust translation so mapX/mapY stays under the cursor:
      //   mouseX = (mapX + newX) * newS  →  newX = mouseX / newS - mapX
      this._cam.x = mouseX / newS - mapX;
      this._cam.y = mouseY / newS - mapY;
      this._cam.s = newS;

      this._clampCam();
      this._applyCam(false);
      setTimeout(() => R.getElementById('cam').classList.remove('no-transition'), 100);
    }, { passive: false });

    // ─── Touch interaction ─────────────────────────────────────────────────────
    //
    // Modes:
    //   1 finger  → pan   (touch1 state)
    //   2 fingers → pinch (this._pinch state)
    //
    // Guard: after a pinch ends, pan is DISABLED until a fresh 1-finger
    // touchstart arrives.  This prevents the coordinate-mismatch jump that
    // occurs when the remaining finger's position is stale relative to the
    // camera snapshot taken at the start of the pan gesture.

    let touch1          = { active: false, startX: 0, startY: 0, camStartX: 0, camStartY: 0 };
    let postPinchGuard  = false;   // true = ignore next touchmove until fresh touchstart

    const getTouchDist = (t1, t2) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchMid = (t1, t2, rect) => ({
      x: ((t1.clientX + t2.clientX) / 2) - rect.left,
      y: ((t1.clientY + t2.clientY) / 2) - rect.top,
    });

    // ── touchstart ────────────────────────────────────────────────────────────
    vp.addEventListener('touchstart', e => {

      if (e.touches.length === 1 && !this._pinch.active) {
        // Fresh single-finger contact → start pan
        const t = e.touches[0];
        touch1 = {
          active:    true,
          startX:    t.clientX,
          startY:    t.clientY,
          camStartX: this._cam.x,
          camStartY: this._cam.y,
        };
        postPinchGuard       = false;   // clear guard: this is a legitimate new gesture
        this._drag.moved     = false;
        R.getElementById('cam').classList.add('no-transition');

      } else if (e.touches.length === 2) {
        // Two fingers → enter pinch mode
        touch1.active = false;          // kill any ongoing single-finger pan
        postPinchGuard = false;

        const t1 = e.touches[0], t2 = e.touches[1];
        const rect = vp.getBoundingClientRect();
        const mid  = getTouchMid(t1, t2, rect);

        this._pinch = {
          active:    true,
          dist:      getTouchDist(t1, t2),
          midX:      mid.x,
          midY:      mid.y,
          camStartX: this._cam.x,
          camStartY: this._cam.y,
          startS:    this._cam.s,
        };
        this._drag.active = false;
        vp.classList.remove('dragging');
        R.getElementById('cam').classList.add('no-transition');
        e.preventDefault();
      }
    }, { passive: false });

    // ── touchmove ─────────────────────────────────────────────────────────────
    vp.addEventListener('touchmove', e => {
      e.preventDefault();

      // ── Pinch path (2 fingers) ──
      if (this._pinch.active && e.touches.length >= 2) {
        const t1 = e.touches[0], t2 = e.touches[1];
        const rect = vp.getBoundingClientRect();

        const newDist = getTouchDist(t1, t2);
        const ratio   = newDist / this._pinch.dist;
        const newS    = Math.min(6, Math.max(1, this._pinch.startS * ratio));

        const mid  = getTouchMid(t1, t2, rect);
        const mapX = this._pinch.midX / this._pinch.startS - this._pinch.camStartX;
        const mapY = this._pinch.midY / this._pinch.startS - this._pinch.camStartY;

        this._cam.x = mid.x / newS - mapX;
        this._cam.y = mid.y / newS - mapY;
        this._cam.s = newS;

        this._clampCam();
        this._applyCam(false);
        return;
      }

      // ── Pan path (1 finger) ──
      // Blocked while guard is raised (post-pinch cooldown) or touch1 inactive
      if (postPinchGuard || !touch1.active || e.touches.length !== 1) return;

      const t  = e.touches[0];
      const dx = t.clientX - touch1.startX;
      const dy = t.clientY - touch1.startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this._drag.moved = true;

      this._cam.x = touch1.camStartX + dx / this._cam.s;
      this._cam.y = touch1.camStartY + dy / this._cam.s;

      this._clampCam();
      this._applyCam(false);
    }, { passive: false });

    // ── touchend / touchcancel ────────────────────────────────────────────────
    vp.addEventListener('touchend', e => {
      if (e.touches.length < 2 && this._pinch.active) {
        // Pinch just ended (went from 2 → 1 or 0 fingers)
        this._pinch.active = false;
        touch1.active      = false;   // invalidate stale pan origin
        postPinchGuard     = true;    // block pan until a fresh touchstart
        R.getElementById('cam').classList.remove('no-transition');
      }
      if (e.touches.length === 0) {
        touch1.active = false;
        R.getElementById('cam').classList.remove('no-transition');
      }
    }, { passive: true });

    vp.addEventListener('touchcancel', () => {
      this._pinch.active = false;
      touch1.active      = false;
      postPinchGuard     = true;    // treat cancel as post-pinch too
      R.getElementById('cam').classList.remove('no-transition');
    }, { passive: true });

    // Province click highlights
    R.querySelectorAll('.prov').forEach(p => {
      p.addEventListener('click', () => {
        if (this._drag.moved) return;
        const id = p.dataset.p;
        R.querySelectorAll('.prov').forEach(el => {
          el.classList.toggle('active', el.dataset.p === id);
        });
        R.querySelectorAll('.pl').forEach(l => l.classList.toggle('active', l.dataset.l === id));
        this.dispatchEvent(new CustomEvent('region-selected', { detail: { region: id }, bubbles: true, composed: true }));
      });
    });

    // Click on empty SVG background resets
    R.getElementById('m').addEventListener('click', e => {
      if (this._drag.moved) return;
      if (!e.target.closest('.prov') && !e.target.closest('.pin')) {
        R.querySelectorAll('.prov').forEach(el => el.classList.remove('active'));
        R.querySelectorAll('.pl').forEach(l => l.classList.remove('active'));
      }
    });
  }
}

customElements.define('interactive-map', InteractiveMap);
