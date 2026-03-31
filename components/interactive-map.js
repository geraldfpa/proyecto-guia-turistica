export default class InteractiveMap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._cam = { x: 0, y: 0, s: 1 };
    this._drag = { active: false, startX: 0, startY: 0, camStartX: 0, camStartY: 0, moved: false };
    this._pinch = { active: false, dist: 0, midX: 0, midY: 0, camStartX: 0, camStartY: 0, startS: 1 };
    this._destinos = [];
    this._activePin = null;
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
        <div class="tt-backdrop" id="tt-backdrop"></div>
        <div class="tt" id="tt" role="dialog" aria-modal="true" aria-label="Destino">
          <button class="tt-close" id="tt-close" aria-label="Cerrar">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="tt-img-wrap">
            <img class="tt-img" id="tt-img" src="" alt="" loading="lazy"/>
            <div class="tt-img-overlay"></div>
          </div>
          <div class="tt-body">
            <p class="tt-name" id="tt-name"></p>
            <p class="tt-region" id="tt-region"></p>
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
      .cam { width: 100%; height: 100%; transform-origin: 0 0; transition: transform 0.4s ease; }
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
      .pin { cursor: pointer; -webkit-tap-highlight-color: transparent; }
      .pin-dot { stroke: #0a1f14; stroke-width: 1.5; transition: r .25s; }
      .pin-ring { fill: none; stroke-width: 1.5; opacity: 0; animation: rp 2.8s ease-in-out infinite; }
      @keyframes rp { 0%,100%{r:10;opacity:0} 40%{r:16;opacity:.35} 80%{r:22;opacity:0} }
      .pin-lbl { font-family: 'DM Sans', system-ui, sans-serif; font-size: 9.5px; font-weight: 500; fill: #e8efe3; text-anchor: middle; pointer-events: none; opacity: 0; transition: opacity .3s; paint-order: stroke; stroke: #0a1f14; stroke-width: 3px; }
      .pin:hover .pin-lbl, .pin.active .pin-lbl { opacity: 1; }
      .pin:hover .pin-dot, .pin.active .pin-dot { r: 7; }
      .pin.active .pin-ring { animation: none; opacity: .55; r: 16; }

      /* ── Backdrop ─────────────────────────────────────────── */
      .tt-backdrop {
        position: absolute; inset: 0;
        background: transparent;
        z-index: 9;
        display: none;
        pointer-events: none;
      }
      .tt-backdrop.visible { display: block; pointer-events: auto; }

      /* ── Tooltip card ─────────────────────────────────────── */
      .tt {
        position: absolute;
        z-index: 10;
        width: 200px;
        background: rgba(10, 24, 16, 0.92);
        backdrop-filter: blur(16px) saturate(1.5);
        -webkit-backdrop-filter: blur(16px) saturate(1.5);
        border: 1px solid rgba(94, 196, 160, 0.2);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0,0,0,.55), 0 0 0 1px rgba(94,196,160,.08);
        opacity: 0;
        pointer-events: none;
        transform: translateY(6px) scale(0.96);
        transform-origin: bottom center;
        transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.2, 0, 0, 1);
      }
      .tt.visible {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0) scale(1);
      }

      /* Close button */
      .tt-close {
        position: absolute;
        top: 8px; right: 8px;
        width: 28px; height: 28px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        font-size: 14px;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        transition: transform 0.2s ease;
        z-index: 2;
        padding: 0;
      }
      .tt-close:hover { 
        transform: scale(1.1);
      }

      /* Image */
      .tt-img-wrap {
        position: relative;
        width: 100%; height: 110px;
        overflow: hidden;
        background: #0a1f14;
      }
      .tt-img {
        width: 100%; height: 100%;
        object-fit: cover;
        display: block;
        transition: transform .4s ease;
      }
      .tt:hover .tt-img { transform: scale(1.04); }
      .tt-img-overlay {
        position: absolute; inset: 0;
        background: linear-gradient(to bottom, transparent 50%, rgba(10,24,16,.8) 100%);
      }

      /* Body */
      .tt-body {
        padding: 8px 10px 10px;
      }
      .tt-name {
        margin: 0;
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 12px;
        font-weight: 700;
        color: #e8efe3;
        letter-spacing: .02em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tt-region {
        margin: 3px 0 0;
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 10px;
        font-weight: 500;
        color: rgba(94,196,160,.7);
        letter-spacing: .07em;
        text-transform: uppercase;
      }

      /* Tail / arrow pointing down to the marker */
      .tt::after {
        content: '';
        position: absolute;
        bottom: -7px;
        left: 50%;
        transform: translateX(-50%);
        width: 0; height: 0;
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
        border-top: 7px solid rgba(94,196,160,.25);
        filter: drop-shadow(0 2px 4px rgba(0,0,0,.4));
        pointer-events: none;
      }
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

    // ─── Pointer tracking ──────────────────────────────────────────────────────
    // We track displacement ourselves so each pin can read an accurate
    // "did this gesture move?" value at pointerup time.
    // CLICK threshold: < 5px total movement → treat as click, not drag.
    const CLICK_THRESHOLD = 8;   // px — tolerates normal desktop mouse micro-movement

    vp.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      this._drag = {
        active:    true,
        startX:    e.clientX,
        startY:    e.clientY,
        camStartX: this._cam.x,
        camStartY: this._cam.y,
        moved:     false,
        dist:      0,       // accumulated Euclidean distance
      };
      vp.classList.add('dragging');
      vp.setPointerCapture(e.pointerId);
      R.getElementById('cam').classList.add('no-transition');
    });

    vp.addEventListener('pointermove', e => {
      if (!this._drag.active) return;
      const dx = e.clientX - this._drag.startX;
      const dy = e.clientY - this._drag.startY;
      this._drag.dist = Math.sqrt(dx * dx + dy * dy);
      if (this._drag.dist > CLICK_THRESHOLD) this._drag.moved = true;
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
      // Clear moved flag AFTER the current event cycle so the 'click'
      // event (which fires synchronously after pointerup) can still read it,
      // but province/SVG background clicks that fire in the SAME frame are
      // also guarded by checking dist at click time.
      // We reset it one rAF later — by then 'click' has already fired.
      requestAnimationFrame(() => { this._drag.moved = false; });
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

    // ─── Pin interaction ──────────────────────────────────────────────────────
    R.querySelectorAll('.pin').forEach(pin => {
      let startX = 0, startY = 0;

      pin.addEventListener('pointerdown', e => {
        e.stopPropagation(); // crucial: prevents vp from capturing pointer!
        startX = e.clientX;
        startY = e.clientY;
      });

      pin.addEventListener('pointerup', e => {
        e.stopPropagation();
        const dist = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));
        
        // If distance < 5px -> this is a CLICK
        if (dist < 5) {
          console.log("Marker clicked on desktop/mobile!", pin.dataset.id);
          const id = pin.dataset.id;
          const destino = this._destinos.find(d => d.id === id);
          if (destino) this._handleMarkerClick(destino);
        }
      });

      // Maintain fallback click prevention
      pin.addEventListener('click', e => { e.stopPropagation(); });
    });

    // Close tooltip
    const closeTooltip = () => {
      const tt = R.getElementById('tt');
      const bd = R.getElementById('tt-backdrop');
      tt.classList.remove('visible');
      bd.classList.remove('visible');
      if (this._activePin) {
        R.querySelector(`.pin[data-id="${this._activePin}"]`)?.classList.remove('active');
        this._activePin = null;
      }
    };

    R.getElementById('tt-close').addEventListener('click', e => {
      e.stopPropagation();
      closeTooltip();
    });

    R.getElementById('tt-backdrop').addEventListener('click', closeTooltip);

    // Click on empty SVG background resets
    R.getElementById('m').addEventListener('click', e => {
      if (this._drag.moved) return;
      // Pins call stopPropagation() so this only runs for non-pin clicks
      if (!e.target.closest('.prov')) {
        R.querySelectorAll('.prov').forEach(el => el.classList.remove('active'));
        R.querySelectorAll('.pl').forEach(l => l.classList.remove('active'));
        closeTooltip();
      }
    });
  }

  // ─── Single entry point for marker interaction ────────────────────────────
  _handleMarkerClick(destino) {
    // Always show the tooltip, then optionally move the camera.
    // These are fully independent — a focus failure cannot block the tooltip.
    try { this._focusMarker(destino); } catch(err) { /* focus failed, ignore */ }
    // _focusMarker already calls _showTooltip at the right moment.
    // But if the camera didn't move, _showTooltip is called immediately inside
    // _focusMarker itself, so nothing extra is needed here.
  }

  // ─── Focus marker + show tooltip ──────────────────────────────────────────
  _focusMarker(destino) {
    const R   = this.shadowRoot;
    const vp  = R.getElementById('vp');
    const cam = R.getElementById('cam');

    const vpW = vp.clientWidth;
    const vpH = vp.clientHeight;
    const s   = this._cam.s;

    // Convert SVG viewBox coords → unscaled cam-space pixels
    const pinCamX = destino.cx / 1000 * vpW;
    const pinCamY = destino.cy / 560  * vpH;

    // ── 1. Pan to center the marker ────────────────────────────────────────
    // Target: pin appears at (50%, 55%) of viewport
    const targetX = vpW * 0.5 / s - pinCamX;
    const targetY = vpH * 0.55 / s - pinCamY;

    const prevX = this._cam.x;
    const prevY = this._cam.y;

    this._cam.x = targetX;
    this._cam.y = targetY;
    this._clampCam();

    const camMoved = Math.abs(this._cam.x - prevX) > 0.5 ||
                     Math.abs(this._cam.y - prevY) > 0.5;

    this._applyCam(true);   // always animate (smooth even if tiny move)

    // ── 2. Mark active pin ─────────────────────────────────────────────────
    R.querySelectorAll('.pin').forEach(el => el.classList.remove('active'));
    R.querySelector(`.pin[data-id="${destino.id}"]`)?.classList.add('active');
    this._activePin = destino.id;

    // ── 3. Hide current tooltip immediately ────────────────────────────────
    R.getElementById('tt').classList.remove('visible');

    // ── 4. Show tooltip (after cam settles, or immediately if no move) ─────
    // Cancel any pending tooltip timer from a previous call
    if (this._ttTimer) { clearTimeout(this._ttTimer); this._ttTimer = null; }
    if (this._ttTransitionHandler) {
      cam.removeEventListener('transitionend', this._ttTransitionHandler);
      this._ttTransitionHandler = null;
    }

    // Populate content
    R.getElementById('tt-img').src  = destino.imagen_portada || '';
    R.getElementById('tt-img').alt  = destino.nombre;
    R.getElementById('tt-name').textContent   = destino.nombre;
    R.getElementById('tt-region').textContent =
      this._provincias[destino.region]?.nombre || destino.region;

    const showTooltip = () => this._showTooltip(destino, pinCamX, pinCamY);

    if (camMoved) {
      // Wait for the CSS transition (~500ms) to finish, then place tooltip.
      // Fallback timeout in case transitionend doesn't fire.
      this._ttTransitionHandler = (ev) => {
        if (ev.propertyName !== 'transform') return;
        cam.removeEventListener('transitionend', this._ttTransitionHandler);
        this._ttTransitionHandler = null;
        if (this._ttTimer) { clearTimeout(this._ttTimer); this._ttTimer = null; }
        showTooltip();
      };
      cam.addEventListener('transitionend', this._ttTransitionHandler);
      this._ttTimer = setTimeout(() => {
        if (this._ttTransitionHandler) {
          cam.removeEventListener('transitionend', this._ttTransitionHandler);
          this._ttTransitionHandler = null;
        }
        showTooltip();
      }, 450);
    } else {
      // Camera didn't move → show tooltip right away
      showTooltip();
    }
  }

  // ─── Position + reveal the tooltip ────────────────────────────────────────
  _showTooltip(destino, pinCamX, pinCamY) {
    const R  = this.shadowRoot;
    const vp = R.getElementById('vp');
    const tt = R.getElementById('tt');
    const vpW = vp.clientWidth;
    const vpH = vp.clientHeight;
    const s   = this._cam.s;

    const ttW = tt.offsetWidth  || 200;
    const ttH = tt.offsetHeight || 155;
    const GAP = 16;

    // Actual screen position of the pin after the camera settled
    const pinSX = s * (this._cam.x + pinCamX);
    const pinSY = s * (this._cam.y + pinCamY);

    let left = pinSX - ttW / 2;
    let top  = pinSY - ttH - GAP;

    const MARGIN = 8;
    left = Math.max(MARGIN, Math.min(vpW - ttW - MARGIN, left));

    if (top < MARGIN) top = pinSY + GAP + 14;   // flip below pin
    top = Math.min(vpH - ttH - MARGIN, top);

    tt.style.left = `${left}px`;
    tt.style.top  = `${top}px`;

    tt.classList.add('visible');
    R.getElementById('tt-backdrop').classList.add('visible');
  }
}

customElements.define('interactive-map', InteractiveMap);
