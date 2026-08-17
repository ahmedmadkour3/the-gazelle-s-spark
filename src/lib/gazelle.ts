/**
 * Realistic gazelle silhouette, drawn in a 200x150 design space and scaled.
 * Composed from anatomically-proportioned body masses + tapered legs + horns,
 * so it reads as a real animal shadow rather than an icon.
 * Facing left.
 */

const DW = 200;
const DH = 150;

type Ctx = CanvasRenderingContext2D;

function ell(c: Ctx, x: number, y: number, rx: number, ry: number, rot = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, (rot * Math.PI) / 180, 0, Math.PI * 2);
  c.fill();
}

function poly(c: Ctx, pts: [number, number][]) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}

function limb(c: Ctx, pts: [number, number][], w: number) {
  c.lineJoin = "round";
  c.lineCap = "round";
  for (let i = 0; i < pts.length - 1; i++) {
    const t = i / (pts.length - 1);
    c.lineWidth = w * (1 - t * 0.45);
    c.beginPath();
    c.moveTo(pts[i]![0], pts[i]![1]);
    c.lineTo(pts[i + 1]![0], pts[i + 1]![1]);
    c.stroke();
  }
}

/** Draws the gazelle filling a w x h box with the given paint color. */
export function drawGazelle(c: Ctx, w: number, h: number, color = "#fff") {
  const k = Math.min(w / DW, h / DH);
  c.save();
  c.translate((w - DW * k) / 2, (h - DH * k) / 2);
  c.scale(k, k);
  c.fillStyle = color;
  c.strokeStyle = color;

  // ---- hind legs (drawn first: far side slightly thinner)
  limb(c, [[133, 84], [142, 106], [129, 121], [134, 140], [130, 145]], 5.2);
  limb(c, [[139, 83], [148, 105], [135, 121], [140, 141], [136, 146]], 6.2);
  // ---- front legs
  limb(c, [[80, 82], [77, 106], [81, 126], [79, 145]], 5);
  limb(c, [[87, 81], [85, 105], [89, 126], [87, 146]], 5.8);

  // ---- torso masses
  ell(c, 106, 71, 36, 19, -4); // barrel
  ell(c, 133, 72, 17, 17, 0); // hindquarters
  ell(c, 82, 73, 16, 17, 8); // chest / shoulder
  // belly tuck
  poly(c, [
    [82, 84],
    [104, 88],
    [128, 85],
    [128, 78],
    [84, 78],
  ]);
  // back line to withers
  poly(c, [
    [72, 63],
    [96, 54],
    [124, 55],
    [146, 63],
    [140, 72],
    [80, 74],
  ]);

  // ---- neck (tapered, arched)
  poly(c, [
    [73, 66],
    [64, 40],
    [55, 27],
    [47, 28],
    [53, 44],
    [60, 68],
  ]);

  // ---- head + muzzle
  ell(c, 45, 27, 11.5, 6.4, -22);
  ell(c, 34, 34, 6.6, 4.2, -26);
  poly(c, [
    [29, 36],
    [33, 31],
    [38, 33],
    [34, 39],
  ]);

  // ---- ear
  poly(c, [
    [53, 22],
    [64, 14],
    [60, 24],
    [54, 26],
  ]);

  // ---- horns (ridged, swept back)
  c.lineCap = "round";
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(49, 21);
  c.bezierCurveTo(60, 10, 66, 2, 63, -6);
  c.stroke();
  c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(52, 20);
  c.bezierCurveTo(63, 11, 70, 4, 68, -3);
  c.stroke();

  // ---- tail
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(147, 62);
  c.bezierCurveTo(153, 68, 153, 76, 149, 81);
  c.stroke();
  ell(c, 149, 83, 2.6, 3.4);

  c.restore();
}
