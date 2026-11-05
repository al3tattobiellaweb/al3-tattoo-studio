// The viper of the side rail (round 8, drawn from scratch; round 13, owner: "inspired by this attached viper look", his
// painted skateboard viper, then "rimuoviamo la testa": body only). One continuous silhouette per frame, no slices, no
// seams, tapering to a point at both ends alike; glossy black, shaded by nested ribbons that lean toward the light, hard
// white highlights down the back, chunky bone slabs stacked down the side that faces the page, a bold outline with a
// thin red rim.
//
//   viperPath(ctrl, step)      Catmull-Rom through control points, resampled every `step` px
//   drawViper(ctx, pts, o)     draw it; o = { W, reveal, stencil, spark, layer, front }

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;
const INK = "#0b0909", STENCIL = "rgba(150,118,255,.92)";
const LIGHT = [-0.45, -0.89]; // light from the top left, in screen space

/* ── path ─────────────────────────────────────────────────────────────── */
export function viperPath(ctrl, step = 4) {
  const n = ctrl.length;
  if (n < 2) return ctrl.map((p) => [p[0], p[1]]);
  const P = [[2 * ctrl[0][0] - ctrl[1][0], 2 * ctrl[0][1] - ctrl[1][1]], ...ctrl, [2 * ctrl[n - 1][0] - ctrl[n - 2][0], 2 * ctrl[n - 1][1] - ctrl[n - 2][1]]];
  const dense = [];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const m = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 2));
    for (let j = 0; j < m; j++) {
      const t = j / m, t2 = t * t, t3 = t2 * t;
      dense.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  dense.push([ctrl[n - 1][0], ctrl[n - 1][1]]);
  const out = [dense[0]];
  let need = step;
  for (let i = 1; i < dense.length; i++) {
    let [ax, ay] = dense[i - 1];
    const [bx, by] = dense[i];
    let seg = Math.hypot(bx - ax, by - ay);
    while (seg >= need) {
      const t = need / seg;
      ax += (bx - ax) * t; ay += (by - ay) * t;
      out.push([ax, ay]);
      seg -= need; need = step;
    }
    need -= seg;
  }
  const last = dense[dense.length - 1], tail = out[out.length - 1];
  if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > step * 0.3) out.push(last);
  return out;
}

/* ── body geometry ───────────────────────────────────────────────────── */
// half-width along the body, s = 0 at the lower tip, 1 at the upper one: both ends taper alike (round 13, owner: the body
// "si chiude alla stessa maniera di come inizia")
const profile = (s) => { const t = Math.max(s, 1 - s); return t < 0.56 ? 1 : lerp(1, 0.035, Math.pow(smooth((t - 0.56) / 0.44), 0.85)); };

function frames(pts) {
  const n = pts.length, N = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 2)], b = pts[Math.min(n - 1, i + 2)];
    let dx = a[0] - b[0], dy = a[1] - b[1]; // towards the lower end
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    N[i] = [-dy, dx];
  }
  return N;
}
function through(ctx, arr) {
  for (let k = 1; k < arr.length - 1; k++) ctx.quadraticCurveTo(arr[k][0], arr[k][1], (arr[k][0] + arr[k + 1][0]) / 2, (arr[k][1] + arr[k + 1][1]) / 2);
  const l = arr[arr.length - 1];
  ctx.lineTo(l[0], l[1]);
}
// a closed smooth ribbon over points i0..i1, half-width hw·scale, centre shifted toward the light, pointed at both ends
function ribbon(ctx, pts, N, hw, i0, i1, scale, lean) {
  const L = [], R = [];
  for (let i = i0; i <= i1; i++) {
    const [nx, ny] = N[i], w = hw[i];
    const sh = lean * w * (nx * LIGHT[0] + ny * LIGHT[1]);
    const cx = pts[i][0] + nx * sh, cy = pts[i][1] + ny * sh;
    L.push([cx + nx * w * scale, cy + ny * w * scale]);
    R.push([cx - nx * w * scale, cy - ny * w * scale]);
  }
  ctx.moveTo(L[0][0], L[0][1]);
  through(ctx, L);
  const t = pts[i1], tb = pts[Math.max(i0, i1 - 1)];
  ctx.lineTo(t[0] + (t[0] - tb[0]) * 0.6, t[1] + (t[1] - tb[1]) * 0.6); // the tip at this end
  R.reverse();
  ctx.lineTo(R[0][0], R[0][1]);
  through(ctx, R);
  const f = pts[i0], fb = pts[Math.min(i1, i0 + 1)];
  ctx.lineTo(f[0] + (f[0] - fb[0]) * 0.6, f[1] + (f[1] - fb[1]) * 0.6); // and the tip at the other
  ctx.closePath();
}

// glossy black: nested ribbons from the black flanks to a charcoal crown, leaning toward the light
const RAMP = [[0, [8, 7, 8]], [0.5, [20, 18, 20]], [0.8, [52, 49, 52]], [1, [118, 114, 116]]];
const SHADES = Array.from({ length: 16 }, (_, k) => {
  const t = k / 15, sc = 1 - t * 0.9;
  let i = 0; while (i < RAMP.length - 2 && t > RAMP[i + 1][0]) i++;
  const [t0, c0] = RAMP[i], [t1, c1] = RAMP[i + 1], f = smooth((t - t0) / (t1 - t0));
  return [sc, `rgb(${c0.map((c, j) => Math.round(lerp(c, c1[j], f))).join(",")})`];
});
const RIM = "rgba(211,23,43,.62)", BONE = "#ebe7e3", BONE_DK = "#a19da7", SEAM = "#262124";

function drawBody(ctx, pts, N, hw, i0, W) {
  const i1 = pts.length - 1;
  if (i1 - i0 < 2) return;
  const ink = Math.max(1.4, W * 0.075);
  // a point at fractional index t, f half-widths out on the belly side (-N)
  const at = (t, f) => {
    const i = Math.max(0, Math.min(i1 - 1, Math.floor(t))), k = t - i;
    const px = lerp(pts[i][0], pts[i + 1][0], k), py = lerp(pts[i][1], pts[i + 1][1], k);
    const nx = lerp(N[i][0], N[i + 1][0], k), ny = lerp(N[i][1], N[i + 1][1], k), w = lerp(hw[i], hw[i + 1], k);
    return [px - nx * w * f, py - ny * w * f];
  };
  // the belly plates, as on the board: chunky slabs stacked down the side that faces the page, pale on top, shaded
  // grey on the side toward the tail, standing out past the outline; a smaller slab at the root of each, as the board's inner row
  const iB = Math.max(i0 + 2, Math.round(i1 * 0.93));
  const stepPx = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) || 3;
  const L = Math.max(2, (W * 0.62) / stepPx); // a plate's length, in points
  const slab = new Path2D(), shade = new Path2D(), knob = new Path2D();
  const quadTo = (path, c, e) => path.quadraticCurveTo(c[0], c[1], e[0], e[1]);
  for (let a = Math.max(i0 + 0.6, Math.round(i1 * 0.07)); a + L <= iB; a += L) { // clear of both tapered tips
    const s = a + L * 0.07, e = a + L * 0.93, r = L * 0.24, m = a + L * 0.5;
    const shape = (path, from) => { // the slab's outline from `from` to its tail end, rounded at the outer corners
      let q = at(from, 0.2); path.moveTo(q[0], q[1]);
      q = at(from, 1.12); path.lineTo(q[0], q[1]);
      if (from === s) { quadTo(path, at(s, 1.32), at(s + r, 1.32)); } else { q = at(from, 1.32); path.lineTo(q[0], q[1]); }
      q = at(e - r, 1.32); path.lineTo(q[0], q[1]);
      quadTo(path, at(e, 1.32), at(e, 1.12));
      q = at(e, 0.2); path.lineTo(q[0], q[1]); path.closePath();
    };
    shape(slab, s); shape(shade, m + L * 0.08);
    const k0 = a + L * 0.22, k1 = a + L * 0.78; // the inner row: a smaller slab at the root of each plate
    let q = at(k0, -0.06); knob.moveTo(q[0], q[1]); q = at(k1, -0.06); knob.lineTo(q[0], q[1]);
    q = at(k1, 0.3); knob.lineTo(q[0], q[1]); q = at(k0, 0.3); knob.lineTo(q[0], q[1]); knob.closePath();
  }
  // the red rim round the outline and round the plates, so the black body reads on the dark page
  ctx.beginPath(); ribbon(ctx, pts, N, hw, i0, i1, 1, 0);
  ctx.lineWidth = ink + 2.2; ctx.strokeStyle = RIM; ctx.stroke();
  ctx.lineWidth = ink + 2.2; ctx.stroke(slab);
  for (const [sc, col] of SHADES) {
    ctx.beginPath(); ribbon(ctx, pts, N, hw, i0, i1, sc, 0.55 * (1 - sc)); ctx.fillStyle = col; ctx.fill();
  }
  // the hard highlights along the back, as on the board: one bright streak and a fainter one beside it
  const iHi = Math.max(i0 + 2, Math.round(i1 * 0.9));
  ctx.beginPath(); ribbon(ctx, pts, N, hw, i0, iHi, 0.08, 0.95); ctx.fillStyle = "rgba(240,236,230,.85)"; ctx.fill();
  ctx.beginPath(); ribbon(ctx, pts, N, hw, i0, Math.round(iHi * 0.8), 0.04, 0.35); ctx.fillStyle = "rgba(240,236,230,.35)"; ctx.fill();
  ctx.beginPath(); ribbon(ctx, pts, N, hw, i0, i1, 1, 0);
  ctx.lineWidth = ink; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = "#bdb9c2"; ctx.fill(knob); ctx.lineWidth = Math.max(0.6, W * 0.04); ctx.strokeStyle = INK; ctx.stroke(knob);
  ctx.fillStyle = BONE; ctx.fill(slab);
  ctx.fillStyle = BONE_DK; ctx.fill(shade);
  ctx.lineWidth = Math.max(0.8, W * 0.06); ctx.strokeStyle = INK; ctx.stroke(slab);
}

/* ── the whole viper ─────────────────────────────────────────────────── */
export function drawViper(ctx, pts, o = {}) {
  const n = pts.length;
  if (n < 4) return;
  const W = o.W || 30;
  const N = frames(pts);
  const hw = pts.map((_, i) => (W / 2) * profile(i / (n - 1)));
  const reveal = clamp01(o.reveal ?? 1), stencil = clamp01(o.stencil ?? 1);
  const iInk = Math.round((1 - reveal) * (n - 1)), iSt = Math.round((1 - stencil) * (n - 1));

  const paint = () => {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (stencil > 0 && iSt < n - 2 && iSt < iInk) { // purple stencil runs ahead of the ink
      ctx.beginPath(); ribbon(ctx, pts, N, hw, iSt, n - 1, 1, 0);
      ctx.strokeStyle = STENCIL; ctx.lineWidth = Math.max(1, W * 0.035); ctx.stroke();
    }
    drawBody(ctx, pts, N, hw, iInk, W);
    if (o.spark && reveal > 0.003 && reveal < 0.997) { // the needle at the ink front
      const p = pts[iInk];
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], W * 0.9);
      g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(0.25, "rgba(255,90,110,.55)"); g.addColorStop(1, "rgba(211,23,43,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], W * 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  };

  if (o.layer === "front" && o.front) {
    // only the stretches that pass in front (of the title's letters): clip to generous ribbons around them
    ctx.save(); ctx.beginPath();
    const big = hw.map((w) => Math.max(w, W * 0.5) * 1.6);
    let run = -1;
    for (let i = 0; i <= n; i++) {
      const on = i < n && o.front(i);
      if (on && run < 0) run = i;
      if (!on && run >= 0) { if (i - 1 - run >= 1) ribbon(ctx, pts, N, big, run, i - 1, 1, 0); run = -1; }
    }
    ctx.clip(); paint(); ctx.restore();
  } else paint();
}
