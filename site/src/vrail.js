// The side rail (owner, round 14: "a neon bar that gets extra light based on where we are on the site"; it replaced
// the viper of rounds 8–13). One neon tube down the left edge, red at the top and blue at the bottom like the studio's
// two neons. It always glows faintly; the stretch already scrolled through burns brighter, and where you are now it
// flares white-hot with a halo in the tube's own colour at that height. Each section is a station on the tube (bone
// ahead, lit once passed, ringed while you are in it); on desktop each is a button with its name.

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const RED = [255, 51, 70], VIOLET = [178, 60, 208], BLUE = [59, 124, 255]; // through violet: a straight mix goes muddy mauve
const lerp3 = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const mix = (t) => (t = clamp01(t)) < 0.5 ? lerp3(RED, VIOLET, t * 2) : lerp3(VIOLET, BLUE, t * 2 - 1);
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export function createNeonRail(root, { sections, mobile, reduced, scrollTo }) {
  const cv = root.querySelector("canvas");
  const list = root.querySelector("ol");
  const ctx = cv.getContext("2d");
  const X = mobile ? 9 : 20;               // the tube's centre line
  const CORE = mobile ? 1.6 : 2.2;         // the tube's lit core (px)
  const FLARE = mobile ? 46 : 84;          // half-length of the white-hot stretch where you are
  const HALO = mobile ? 15 : 32;           // radius of the halo around it
  let dpr = 1, w = 0, h = 0, top = 0, bottom = 0, marks = [], shown = 0, time = 0, last = performance.now();
  let tube = null;                         // the red → blue gradient, rebuilt at layout

  // section buttons (desktop: hover shows the name; phones: stations only, the edge stays free for the thumb)
  const items = sections.map((s) => {
    const li = document.createElement("li");
    li.className = "vrail-mark";
    li.innerHTML = `<button type="button" aria-label="Vai a: ${s.label}"><span class="vrail-dot"></span><span class="vrail-label">${s.label}</span></button>`;
    li.querySelector("button").addEventListener("click", () => scrollTo(s.el));
    list.appendChild(li);
    return li;
  });

  let maxS = 1; // the page's scroll length, measured at layout (reading it every frame forced a layout per frame)
  const yAt = (p) => top + clamp01(p) * (bottom - top);
  const tAt = (y) => (y - top) / Math.max(1, bottom - top); // 0 at the top of the tube, 1 at the bottom

  function layout() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = root.clientWidth; h = innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const nav = document.getElementById("nav");
    top = (nav ? nav.offsetHeight : 64) + 14;
    bottom = h - (mobile ? 18 : 26);
    maxS = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    marks = sections.map((s) => {
      const docTop = s.el.getBoundingClientRect().top + scrollY;
      return { p: clamp01(docTop / maxS), visible: !s.el.hidden && s.el.offsetHeight > 0 };
    });
    items.forEach((li, k) => {
      li.style.top = `${yAt(marks[k].p).toFixed(1)}px`;
      li.hidden = !marks[k].visible;
    });
    tube = (a) => { // the tube's colour from top to bottom at opacity a
      const g = ctx.createLinearGradient(0, top, 0, bottom);
      g.addColorStop(0, rgba(RED, a)); g.addColorStop(0.5, rgba(mix(0.5), a)); g.addColorStop(1, rgba(BLUE, a));
      return g;
    };
  }

  const line = (y0, y1, width, style) => {
    if (y1 - y0 < 0.5) return;
    ctx.beginPath(); ctx.moveTo(X, y0); ctx.lineTo(X, y1);
    ctx.lineWidth = width; ctx.strokeStyle = style; ctx.stroke();
  };

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "round";
    const y = yAt(shown), c = mix(tAt(y));
    // a neon hums: a slow breath and, now and then, a stutter (none with reduced motion)
    const hum = reduced ? 1 : 0.92 + 0.08 * Math.sin(time * 2.1) - (Math.sin(time * 13.7) > 0.985 ? 0.25 : 0);
    // 1. the whole tube, unlit: glass with a faint glow
    line(top, bottom, mobile ? 5 : 9, tube(0.05));
    line(top, bottom, CORE, tube(0.28));
    // 2. the stretch scrolled through: lit
    line(top, y, mobile ? 6 : 12, tube(0.1 * hum));
    line(top, y, mobile ? 3 : 5, tube(0.22 * hum));
    line(top, y, CORE, tube(0.85 * hum));
    // 3. where you are: a halo in the tube's colour at this height, then the white-hot flare along the tube
    const halo = ctx.createRadialGradient(X, y, 0, X, y, HALO);
    halo.addColorStop(0, rgba(c, 0.55 * hum)); halo.addColorStop(0.45, rgba(c, 0.2 * hum)); halo.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(X - HALO, y - HALO, HALO * 2, HALO * 2);
    const fl = (width, a, white) => {
      const g = ctx.createLinearGradient(0, y - FLARE, 0, y + FLARE);
      const mid = white ? `rgba(255,244,246,${a})` : rgba(c, a);
      g.addColorStop(0, rgba(c, 0)); g.addColorStop(0.5, mid); g.addColorStop(1, rgba(c, 0));
      line(Math.max(top, y - FLARE), Math.min(bottom, y + FLARE), width, g);
    };
    fl(mobile ? 7 : 14, 0.35 * hum, false);
    fl(CORE + 1.4, 0.95 * hum, true);
    // 4. the stations: one per section, on the tube
    marks.forEach((m, k) => {
      if (!m.visible) return;
      const my = yAt(m.p), passed = shown >= m.p - 0.002, mc = mix(tAt(my));
      ctx.beginPath(); ctx.arc(X, my, mobile ? 2.2 : 3.4, 0, Math.PI * 2);
      ctx.fillStyle = passed ? rgba(mc, 1) : "rgba(238,232,225,.55)";
      ctx.fill();
      if (items[k].classList.contains("on")) {
        ctx.lineWidth = 1.2; ctx.strokeStyle = rgba(mc, 0.9);
        ctx.beginPath(); ctx.arc(X, my, mobile ? 5 : 7, 0, Math.PI * 2); ctx.stroke();
      }
    });
  }

  let active = -1, drawnShown = -1, drawnAt = 0;
  const IDLE_MS = reduced ? Infinity : mobile ? 100 : 33; // when nothing moves, the hum redraws at 10 fps (phones) / 30 fps
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    time += dt;
    const p = clamp01(scrollY / maxS);
    shown += (p - shown) * (reduced ? 1 : 0.2);
    // the current section: the last station the flare has passed
    let k = -1;
    marks.forEach((m, i) => { if (m.visible && p >= m.p - 0.002) k = i; });
    if (k !== active) {
      items.forEach((li, i) => li.classList.toggle("on", i === k));
      active = k;
    }
    const moving = Math.abs(shown - drawnShown) > 0.00002;
    if (!moving && now - drawnAt < IDLE_MS) return;
    drawnShown = shown; drawnAt = now;
    draw();
  }

  layout();
  return { layout, frame };
}
