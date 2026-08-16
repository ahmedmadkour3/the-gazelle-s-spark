import { useCallback, useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";
import { SoundToggle } from "@/components/SoundToggle";
import { usePerfTier } from "@/hooks/useReveal";

type Stage =
  | "dark"
  | "flask"
  | "drop"
  | "react"
  | "gas"
  | "gazelle"
  | "run"
  | "burst"
  | "name"
  | "out";

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number;
  a: number;
  life: number;
  max: number;
  role: "vapor" | "bubble" | "shape" | "spark";
  tx: number;
  ty: number;
  bx: number;
  by: number;
  seed: number;
};

const EQUATIONS = [
  "H₂ + O₂ → H₂O",
  "2H₂ + O₂ → 2H₂O",
  "CO₂ + H₂O ⇌ H₂CO₃",
  "Na + Cl → NaCl",
];

/** Leaping-gazelle silhouette, normalized 0..1 (facing right-to-left). */
const GAZELLE: [number, number][] = [
  [0.2, 0.03],
  [0.25, 0.17],
  [0.17, 0.2],
  [0.07, 0.29],
  [0.18, 0.33],
  [0.3, 0.42],
  [0.36, 0.53],
  [0.34, 0.63],
  [0.29, 0.8],
  [0.24, 0.96],
  [0.3, 0.95],
  [0.34, 0.79],
  [0.39, 0.62],
  [0.55, 0.61],
  [0.62, 0.73],
  [0.7, 0.88],
  [0.75, 0.97],
  [0.8, 0.95],
  [0.74, 0.79],
  [0.71, 0.66],
  [0.86, 0.51],
  [0.95, 0.42],
  [0.87, 0.44],
  [0.7, 0.43],
  [0.48, 0.4],
  [0.35, 0.31],
  [0.29, 0.22],
  [0.24, 0.06],
];

function samplePath(
  draw: (c: CanvasRenderingContext2D, w: number, h: number) => void,
  w: number,
  h: number,
  step: number,
): [number, number][] {
  const off = document.createElement("canvas");
  off.width = Math.max(1, Math.floor(w));
  off.height = Math.max(1, Math.floor(h));
  const c = off.getContext("2d");
  if (!c) return [];
  draw(c, off.width, off.height);
  const data = c.getImageData(0, 0, off.width, off.height).data;
  const pts: [number, number][] = [];
  for (let y = 0; y < off.height; y += step) {
    for (let x = 0; x < off.width; x += step) {
      const i = (y * off.width + x) * 4 + 3;
      if (data[i]! > 130) pts.push([x, y]);
    }
  }
  return pts;
}

export function CinematicIntro({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stage, setStage] = useState<Stage>("dark");
  const stageRef = useRef<Stage>("dark");
  const stageAt = useRef(0);
  const advanceRef = useRef<(s: Stage) => void>(() => {});
  const tapRef = useRef<() => void>(() => {});
  const tier = usePerfTier();
  const [nameStep, setNameStep] = useState(0);
  const [failed, setFailed] = useState(false);

  const finish = useCallback(() => {
    onDone();
  }, [onDone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      setFailed(true);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, tier === "low" ? 1.5 : 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const MAX = tier === "low" ? 260 : 520;
    const parts: P[] = [];
    const equations: { text: string; x: number; y: number; born: number }[] = [];
    const pointer = { x: -999, y: -999, active: false };
    let drop = { y: 0, falling: false, landed: false };
    let ripple = 0;
    let shapePts: [number, number][] = [];
    let textPts: [number, number][] = [];
    let runOffset = 0;
    let bob = 0;
    let raf = 0;
    let start = performance.now();
    stageAt.current = start;

    const flask = () => {
      const r = Math.min(w, h) * (w < 520 ? 0.17 : 0.13);
      return { cx: w / 2, cy: h * 0.63, r };
    };

    const buildGazelle = () => {
      const f = flask();
      const sw = Math.min(w * 0.78, h * 0.52);
      const sh = sw * 0.78;
      shapePts = samplePath(
        (c, cw, ch) => {
          c.fillStyle = "#fff";
          c.beginPath();
          GAZELLE.forEach(([x, y], i) => {
            const px = x * cw;
            const py = y * ch;
            if (i === 0) c.moveTo(px, py);
            else c.lineTo(px, py);
          });
          c.closePath();
          c.fill();
          c.lineWidth = Math.max(2, cw * 0.02);
          c.strokeStyle = "#fff";
          c.stroke();
        },
        sw,
        sh,
        tier === "low" ? 9 : 7,
      ).map(([x, y]) => [
        f.cx - sw / 2 + x,
        h * 0.34 - sh / 2 + y + 0,
      ]) as [number, number][];
    };

    const buildText = () => {
      const fs = Math.min(w * 0.16, 120);
      textPts = samplePath(
        (c, cw, ch) => {
          c.fillStyle = "#fff";
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.direction = "rtl";
          c.font = `900 ${fs}px Cairo, sans-serif`;
          c.fillText("عمرو جمال", cw / 2, ch / 2);
        },
        w,
        fs * 2.2,
        tier === "low" ? 6 : 4,
      ).map(([x, y]) => [x, h * 0.46 - fs * 1.1 + y]) as [number, number][];
    };

    const spawn = (p: Partial<P>): P => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      s: 1.4,
      a: 0.6,
      life: 0,
      max: 2000,
      role: "vapor",
      tx: 0,
      ty: 0,
      bx: 0,
      by: 0,
      seed: Math.random() * 1000,
      ...p,
    });

    const emitVapor = (n: number) => {
      const f = flask();
      for (let i = 0; i < n; i++) {
        if (parts.length > MAX) break;
        parts.push(
          spawn({
            role: "vapor",
            x: f.cx + (Math.random() - 0.5) * f.r * 0.7,
            y: f.cy - f.r * 0.5,
            vx: (Math.random() - 0.5) * 0.25,
            vy: -0.35 - Math.random() * 0.5,
            s: 1 + Math.random() * 2.2,
            a: 0.13 + Math.random() * 0.22,
            max: 2600 + Math.random() * 1800,
          }),
        );
      }
    };

    const emitBubbles = (n: number) => {
      const f = flask();
      for (let i = 0; i < n; i++) {
        if (parts.length > MAX) break;
        parts.push(
          spawn({
            role: "bubble",
            x: f.cx + (Math.random() - 0.5) * f.r * 1.3,
            y: f.cy + f.r * 0.55,
            vx: (Math.random() - 0.5) * 0.15,
            vy: -0.5 - Math.random() * 0.6,
            s: 0.8 + Math.random() * 1.6,
            a: 0.4 + Math.random() * 0.4,
            max: 1400,
          }),
        );
      }
    };

    const assignShape = () => {
      if (!shapePts.length) buildGazelle();
      const f = flask();
      const want = Math.min(shapePts.length, MAX);
      for (let i = 0; i < want; i++) {
        const t = shapePts[i % shapePts.length]!;
        parts.push(
          spawn({
            role: "shape",
            x: f.cx + (Math.random() - 0.5) * f.r,
            y: f.cy - f.r * 0.6,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -1 - Math.random() * 2,
            bx: t[0],
            by: t[1],
            tx: t[0],
            ty: t[1],
            s: 1 + Math.random() * 1.6,
            a: 0.5 + Math.random() * 0.45,
            max: Infinity,
          }),
        );
      }
    };

    const toText = () => {
      buildText();
      const shapes = parts.filter((p) => p.role === "shape");
      shapes.forEach((p, i) => {
        const t = textPts.length
          ? textPts[i % textPts.length]!
          : [w / 2, h / 2];
        p.bx = t[0]!;
        p.by = t[1]!;
        p.tx = t[0]!;
        p.ty = t[1]!;
        const ang = Math.random() * Math.PI * 2;
        const sp = 4 + Math.random() * 9;
        p.vx = Math.cos(ang) * sp;
        p.vy = Math.sin(ang) * sp;
      });
    };

    const setStageInternal = (s: Stage) => {
      stageRef.current = s;
      stageAt.current = performance.now();
      setStage(s);
      if (s === "react") {
        sfx.impact();
        sfx.reaction();
        ripple = 1;
      }
      if (s === "gas") {
        assignShape();
        sfx.whoosh();
      }
      if (s === "run") sfx.whoosh();
      if (s === "burst") {
        sfx.burst();
        toText();
      }
      if (s === "name") {
        sfx.reveal();
        setNameStep(1);
        window.setTimeout(() => setNameStep(2), 1100);
        window.setTimeout(() => setNameStep(3), 2200);
      }
      if (s === "out") {
        window.setTimeout(finish, 1000);
      }
    };
    advanceRef.current = setStageInternal;

    tapRef.current = () => {
      const s = stageRef.current;
      if (s === "drop") {
        drop.falling = true;
        sfx.drop();
      } else if (s === "gazelle") {
        setStageInternal("run");
      } else if (s === "name") {
        setStageInternal("out");
      }
    };

    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.x = -999;
      pointer.y = -999;
    };
    canvas.addEventListener("pointermove", onPointer, { passive: true });
    canvas.addEventListener("pointerdown", onPointer, { passive: true });
    canvas.addEventListener("pointerleave", onLeave);

    let lastBubble = 0;
    let lastEq = 0;
    let eqIdx = 0;
    let lastHoof = 0;

    const drawFlask = (alpha: number, glow: number) => {
      const f = flask();
      const { cx, cy, r } = f;
      const neckH = r * 1.85;
      const neckW = r * 0.3;
      const shoulderY = cy - r * 0.86;
      ctx.save();
      ctx.globalAlpha = alpha;

      // outline: neck + bowl in one continuous silhouette
      const outline = new Path2D();
      outline.moveTo(cx - neckW, cy - neckH);
      outline.lineTo(cx - neckW, shoulderY - r * 0.12);
      outline.quadraticCurveTo(cx - neckW, shoulderY, cx - r * 0.62, cy - r * 0.66);
      outline.arc(cx, cy, r, Math.PI * 1.24, Math.PI * -0.24, false);
      outline.quadraticCurveTo(cx + neckW, shoulderY, cx + neckW, shoulderY - r * 0.12);
      outline.lineTo(cx + neckW, cy - neckH);

      // liquid, clipped to the bowl
      ctx.save();
      const bowl = new Path2D();
      bowl.arc(cx, cy, r * 0.96, 0, Math.PI * 2);
      ctx.clip(bowl);
      const lg = ctx.createLinearGradient(cx, cy - r * 0.25, cx, cy + r);
      lg.addColorStop(0, `rgba(105,215,240,${0.2 + glow * 0.5})`);
      lg.addColorStop(1, `rgba(16,58,95,${0.55 + glow * 0.3})`);
      ctx.fillStyle = lg;
      ctx.fillRect(cx - r, cy - r * 0.22, r * 2, r * 2);
      ctx.restore();

      // glass
      ctx.lineWidth = Math.max(1, r * 0.045);
      ctx.strokeStyle = `rgba(196,228,242,${0.5 * alpha})`;
      ctx.shadowColor = `rgba(120,215,250,${0.35 * (0.3 + glow)})`;
      ctx.shadowBlur = r * 0.5;
      ctx.stroke(outline);
      ctx.shadowBlur = 0;

      // specular highlight
      ctx.lineWidth = Math.max(1, r * 0.06);
      ctx.strokeStyle = `rgba(255,255,255,${0.2 * alpha})`;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.8, Math.PI * 1.02, Math.PI * 1.28);
      ctx.stroke();

      if (ripple > 0.01) {
        for (let i = 0; i < 3; i++) {
          const rr = r * (0.2 + (1 - ripple) * 0.75) + i * r * 0.14;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(160,238,255,${ripple * 0.4 - i * 0.09})`;
          ctx.lineWidth = 1.2;
          ctx.ellipse(cx, cy - r * 0.12, rr, rr * 0.26, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    };


    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const s = stageRef.current;
      const st = now - stageAt.current;
      const total = now - start;

      // ---- stage timeline
      if (s === "dark" && st > 900) setStageInternal("flask");
      if (s === "flask" && st > 1800) setStageInternal("drop");
      if (s === "drop" && drop.landed) setStageInternal("react");
      if (s === "react") {
        if (now - lastBubble > 90) {
          lastBubble = now;
          emitBubbles(tier === "low" ? 2 : 4);
          if (Math.random() < 0.25) sfx.bubble();
        }
        emitVapor(tier === "low" ? 1 : 2);
        if (now - lastEq > 1000 && eqIdx < EQUATIONS.length) {
          lastEq = now;
          const f = flask();
          const side = eqIdx % 2 === 0 ? -1 : 1;
          equations.push({
            text: EQUATIONS[eqIdx]!,
            x: f.cx + side * Math.min(w * 0.24, 150),
            y: f.cy - f.r * (1.4 + (eqIdx % 3) * 0.55),
            born: now,
          });
          eqIdx++;
          sfx.equation();
        }
        if (st > 4600) setStageInternal("gas");
      }
      if (s === "gas") {
        emitVapor(tier === "low" ? 1 : 3);
        if (st > 3400) setStageInternal("gazelle");
      }
      if (s === "gazelle") {
        emitVapor(1);
        if (st > 11000) setStageInternal("run");
      }
      if (s === "run") {
        runOffset -= (0.9 + st / 1100) * (w < 520 ? 1 : 1.6);
        bob = Math.sin(st / 110) * 6;
        if (now - lastHoof > 260) {
          lastHoof = now;
          sfx.hoof();
          const f = flask();
          for (let i = 0; i < (tier === "low" ? 4 : 9); i++) {
            parts.push(
              spawn({
                role: "spark",
                x: f.cx + runOffset * 0.2 + (Math.random() - 0.5) * 40,
                y: h * 0.62 + Math.random() * 10,
                vx: 1.5 + Math.random() * 3,
                vy: -0.6 - Math.random() * 1.6,
                s: 1 + Math.random() * 1.8,
                a: 0.5,
                max: 900,
              }),
            );
          }
        }
        if (st > 3400) setStageInternal("burst");
      }
      if (s === "burst" && st > 1100) setStageInternal("name");
      if (s === "name" && st > 5200) setStageInternal("out");

      // ---- drop physics
      if (s === "drop" || s === "react") {
        const f = flask();
        if (!drop.landed) {
          if (!drop.falling) {
            drop.y = f.cy - f.r * 2.9 + Math.sin(now / 700) * 4;
          } else {
            drop.y += Math.max(2, (f.cy - drop.y) * 0.06) + 1.4;
            if (drop.y >= f.cy - f.r * 0.1) {
              drop.landed = true;
              ripple = 1;
            }
          }
        }
      }
      ripple *= 0.972;

      // ---- render
      ctx.clearRect(0, 0, w, h);
      const bgGlow =
        s === "dark" ? 0 : s === "flask" ? 0.12 : s === "drop" ? 0.2 : 0.45;
      const g = ctx.createRadialGradient(
        w / 2,
        h * 0.6,
        0,
        w / 2,
        h * 0.6,
        Math.max(w, h) * 0.7,
      );
      g.addColorStop(0, `rgba(30,90,120,${bgGlow * 0.5})`);
      g.addColorStop(1, "rgba(6,10,16,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // atmospheric dust
      ctx.globalCompositeOperation = "lighter";
      const dust = tier === "low" ? 26 : 54;
      for (let i = 0; i < dust; i++) {
        const px =
          ((i * 97.13 + total * 0.006 * ((i % 5) + 1)) % (w + 40)) - 20;
        const py = ((i * 53.7 + total * 0.004 * ((i % 3) + 1)) % (h + 40)) - 20;
        ctx.fillStyle = `rgba(160,200,225,${0.05 + (i % 4) * 0.014})`;
        ctx.fillRect(px, py, 1.2, 1.2);
      }
      ctx.globalCompositeOperation = "source-over";

      const flaskAlpha =
        s === "dark"
          ? 0
          : s === "flask"
            ? Math.min(1, st / 2200) * 0.85
            : s === "run" || s === "burst" || s === "name" || s === "out"
              ? Math.max(0, 1 - st / 900) * 0.6
              : 0.9;
      if (flaskAlpha > 0.01) drawFlask(flaskAlpha, ripple * 0.5);

      // falling drop
      if ((s === "drop" || (s === "react" && !drop.landed)) && flaskAlpha > 0) {
        const f = flask();
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const dg = ctx.createRadialGradient(f.cx, drop.y, 0, f.cx, drop.y, 16);
        dg.addColorStop(0, "rgba(200,250,255,0.95)");
        dg.addColorStop(1, "rgba(90,200,240,0)");
        ctx.fillStyle = dg;
        ctx.beginPath();
        ctx.arc(f.cx, drop.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(235,255,255,0.95)";
        ctx.beginPath();
        ctx.ellipse(f.cx, drop.y, 3.2, 4.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // equations
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = `500 ${Math.max(12, Math.min(w * 0.038, 20))}px "Reem Kufi", monospace`;
      for (let i = equations.length - 1; i >= 0; i--) {
        const e = equations[i]!;
        const age = now - e.born;
        if (age > 3600) {
          equations.splice(i, 1);
          continue;
        }
        const k = age / 3600;
        const a = k < 0.2 ? k / 0.2 : k > 0.7 ? (1 - k) / 0.3 : 1;
        ctx.globalAlpha = Math.max(0, a) * 0.85;
        ctx.fillStyle = "rgba(175,235,255,1)";
        ctx.shadowColor = "rgba(120,220,255,0.6)";
        ctx.shadowBlur = 12;
        ctx.fillText(e.text, e.x, e.y - k * 26);
      }
      ctx.restore();

      // particles
      ctx.globalCompositeOperation = "lighter";
      const shaping =
        s === "gas" || s === "gazelle" || s === "run" || s === "burst";
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]!;
        p.life += 16.7;
        if (p.life > p.max) {
          parts.splice(i, 1);
          continue;
        }
        if (p.role === "shape") {
          let tx = p.bx;
          let ty = p.by;
          if (s === "run") {
            tx += runOffset;
            ty += bob;
            if (tx < -60) tx += w + 120;
          }
          if (s === "gazelle") {
            // subtle head reaction to pointer
            const dx = (pointer.active ? pointer.x : w / 2) - w / 2;
            const dy = (pointer.active ? pointer.y : h * 0.4) - h * 0.4;
            const headness = Math.max(0, 1 - (p.by - h * 0.18) / (h * 0.2));
            tx += dx * 0.035 * headness;
            ty += dy * 0.025 * headness;
          }
          const wob =
            Math.sin(now / 620 + p.seed) * (s === "run" ? 3.4 : 2.2);
          const k = s === "burst" || s === "name" ? 0.055 : 0.09;
          p.vx += (tx + wob - p.x) * k;
          p.vy += (ty + wob * 0.6 - p.y) * k;
          p.vx *= 0.82;
          p.vy *= 0.82;
        } else {
          p.vy -= p.role === "vapor" ? 0.004 : 0.008;
          p.vx += Math.sin(now / 900 + p.seed) * 0.01;
        }

        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 9000 && d2 > 1) {
            const f = (1 - d2 / 9000) * 0.7;
            p.vx += (dx / Math.sqrt(d2)) * f;
            p.vy += (dy / Math.sqrt(d2)) * f;
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        const lifeK =
          p.max === Infinity ? 1 : 1 - Math.min(1, p.life / p.max);
        let a = p.a * (p.role === "shape" ? 1 : lifeK);
        if (s === "out") a *= Math.max(0, 1 - st / 900);
        if (p.role === "shape" && (s === "gas" || shaping)) {
          a *= Math.min(1, 0.35 + p.life / 900);
        }
        if (a <= 0.01) continue;
        const size = p.s * (p.role === "vapor" ? 1.5 : 1.15);
        const rg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2.2);
        const tint =
          p.role === "vapor"
            ? "150,205,230"
            : p.role === "bubble"
              ? "190,245,255"
              : "140,230,255";
        rg.addColorStop(0, `rgba(${tint},${a})`);
        rg.addColorStop(1, `rgba(${tint},0)`);
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [tier, finish]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (failed) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-void px-6 text-center">
        <div>
          <h1 className="text-3xl font-black">مستر عمرو جمال</h1>
          <p className="mt-2 text-lg text-primary">الغزال 🦌</p>
          <p className="text-muted-foreground">بتاع كيميا ⚗️</p>
          <button
            onClick={finish}
            className="press mt-8 rounded-full border border-border bg-card px-6 py-3 text-sm"
          >
            ادخل الموقع
          </button>
        </div>
      </div>
    );
  }

  const prompt =
    stage === "drop"
      ? "اضغط لبدء التفاعل"
      : stage === "gazelle"
        ? "خليه ينطلق."
        : null;

  return (
    <div
      className="fixed inset-0 z-50 touch-none bg-void"
      data-stage={stage}
      style={{ transition: "opacity .9s ease", opacity: stage === "out" ? 0 : 1 }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full"
        onPointerDown={() => tapRef.current()}
        aria-label="مقدمة تفاعلية: تفاعل كيميائي"
      />


      {prompt && (
        <button
          type="button"
          onClick={() => tapRef.current()}
          className="anim-breathe absolute inset-x-0 top-[16%] mx-auto w-fit rounded-full border border-border bg-card/40 px-6 py-3 text-sm tracking-wide text-silver backdrop-blur-sm"
        >
          {prompt}
        </button>
      )}

      {/* particle-born name reveal */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[24%] px-6 text-center">
        <p
          className="font-display text-lg font-bold text-primary transition-all duration-700"
          style={{
            opacity: nameStep >= 2 ? 1 : 0,
            transform: `translateY(${nameStep >= 2 ? 0 : 14}px)`,
          }}
        >
          الغزال 🦌
        </p>
        <p
          className="mt-1 text-sm text-muted-foreground transition-all duration-700"
          style={{
            opacity: nameStep >= 3 ? 1 : 0,
            transform: `translateY(${nameStep >= 3 ? 0 : 14}px)`,
          }}
        >
          بتاع كيميا ⚗️
        </p>
      </div>

      <div
        className="absolute inset-x-0 flex items-center justify-between px-5"
        style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <SoundToggle />
        <button
          type="button"
          onClick={() => advanceRef.current("out")}
          className="press rounded-full border border-border bg-card/60 px-5 py-3 text-xs text-muted-foreground backdrop-blur-md"
        >
          تخطي المقدمة
        </button>
      </div>
    </div>
  );
}
