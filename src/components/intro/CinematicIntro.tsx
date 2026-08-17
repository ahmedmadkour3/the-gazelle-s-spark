import { useCallback, useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";
import { SoundToggle } from "@/components/SoundToggle";
import { usePerfTier } from "@/hooks/useReveal";
import { drawGazelle } from "@/lib/gazelle";

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
  ord: number; // 0 (head) .. 1 (hooves) — drives gradual formation
  leg: number; // 0..1 how "leg-like" (lower body) — drives stride during run
  seed: number;
};

const EQUATIONS = [
  "H₂ + O₂ → H₂O",
  "2H₂ + O₂ → 2H₂O",
  "CO₂ + H₂O ⇌ H₂CO₃",
  "Na + Cl → NaCl",
];

/**
 * Samples a filled/painted shape into scatter points by reading the alpha
 * channel of an offscreen canvas. Returns points in the offscreen space.
 */
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
      if (data[i]! > 120) pts.push([x, y]);
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

    const MAX = tier === "low" ? 320 : 640;
    const parts: P[] = [];
    const equations: { text: string; x: number; y: number; born: number }[] = [];
    const pointer = { x: -999, y: -999, active: false };
    const drop = { y: 0, falling: false, landed: false };
    let ripple = 0;
    let shapePts: [number, number][] = [];
    let shapeMinY = 0;
    let shapeMaxY = 1;
    let runOffset = 0;
    let bob = 0;
    let raf = 0;
    const start = performance.now();
    stageAt.current = start;

    const flask = () => {
      const r = Math.min(w, h) * (w < 520 ? 0.16 : 0.12);
      return { cx: w / 2, cy: h * 0.6, r };
    };

    // Build a realistic, anatomically-proportioned gazelle silhouette and
    // sample it into scatter targets. Points carry an "ord" (head->hooves)
    // so the body assembles gradually rather than appearing at once.
    const buildGazelle = () => {
      const sw = Math.min(w * 0.82, h * 0.62);
      const sh = sw * 0.75;
      const raw = samplePath(
        (c, cw, ch) => drawGazelle(c, cw, ch, "#fff"),
        sw,
        sh,
        tier === "low" ? 6 : 5,
      );
      const cx = w / 2;
      const topY = h * 0.24;
      shapePts = raw.map(([x, y]) => [cx - sw / 2 + x, topY + y]) as [
        number,
        number,
      ][];
      shapeMinY = Math.min(...shapePts.map((p) => p[1]));
      shapeMaxY = Math.max(...shapePts.map((p) => p[1]));
    };

    const buildTextPts = () => {
      const fs = Math.min(w * 0.22, 150);
      return samplePath(
        (c, cw, ch) => {
          c.fillStyle = "#fff";
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.direction = "rtl";
          c.font = `900 ${fs}px Cairo, sans-serif`;
          c.fillText("عمرو جمال", cw / 2, ch / 2);
        },
        w,
        fs * 1.8,
        tier === "low" ? 6 : 4,
      ).map(([x, y]) => [x, h * 0.52 - fs * 0.9 + y]) as [number, number][];
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
      ord: 0,
      leg: 0,
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
            x: f.cx + (Math.random() - 0.5) * f.r * 0.8,
            y: f.cy - f.r * 0.4,
            vx: (Math.random() - 0.5) * 0.22,
            vy: -0.3 - Math.random() * 0.45,
            s: 1.4 + Math.random() * 2.6,
            a: 0.1 + Math.random() * 0.16,
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
            x: f.cx + (Math.random() - 0.5) * f.r * 1.2,
            y: f.cy + f.r * 0.5,
            vx: (Math.random() - 0.5) * 0.12,
            vy: -0.45 - Math.random() * 0.55,
            s: 0.7 + Math.random() * 1.5,
            a: 0.35 + Math.random() * 0.35,
            max: 1400,
          }),
        );
      }
    };

    // Convert the rising gas into shape particles that will home onto the
    // gazelle silhouette gradually (head first, then body, then legs).
    const assignShape = () => {
      if (!shapePts.length) buildGazelle();
      const f = flask();
      const want = Math.min(shapePts.length, MAX);
      const span = Math.max(1, shapeMaxY - shapeMinY);
      for (let i = 0; i < want; i++) {
        const t = shapePts[Math.floor((i / want) * shapePts.length)]!;
        const ord = (t[1] - shapeMinY) / span; // 0 top(head) -> 1 bottom(legs)
        parts.push(
          spawn({
            role: "shape",
            x: f.cx + (Math.random() - 0.5) * f.r,
            y: f.cy - f.r * 0.5,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -0.8 - Math.random() * 1.4,
            bx: t[0],
            by: t[1],
            tx: t[0],
            ty: t[1],
            ord,
            leg: Math.max(0, (ord - 0.55) / 0.45), // lower body = more stride
            s: 1 + Math.random() * 1.3,
            a: 0.55 + Math.random() * 0.35,
            max: Infinity,
          }),
        );
      }
    };

    const toText = () => {
      const textPts = buildTextPts();
      const shapes = parts.filter((p) => p.role === "shape");
      shapes.forEach((p, i) => {
        const t = textPts.length ? textPts[i % textPts.length]! : [w / 2, h / 2];
        p.bx = t[0]!;
        p.by = t[1]!;
        p.tx = t[0]!;
        p.ty = t[1]!;
        p.ord = 0;
        p.leg = 0;
        const ang = Math.random() * Math.PI * 2;
        const sp = 5 + Math.random() * 10;
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
        sfx.whoosh();
      }
      if (s === "gazelle") {
        assignShape();
      }
      if (s === "run") sfx.whoosh();
      if (s === "burst") {
        sfx.burst();
        toText();
      }
      if (s === "name") {
        sfx.reveal();
        setNameStep(1);
        window.setTimeout(() => setNameStep(2), 1200);
        window.setTimeout(() => setNameStep(3), 2400);
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

    // ---------- realistic bright-lab glass flask ----------
    const drawFlask = (alpha: number, glow: number) => {
      const f = flask();
      const { cx, cy, r } = f;
      const neckH = r * 1.9;
      const neckW = r * 0.32;
      ctx.save();
      ctx.globalAlpha = alpha;

      // soft contact shadow on the lab surface
      ctx.save();
      const sh = ctx.createRadialGradient(cx, cy + r * 1.02, 0, cx, cy + r * 1.02, r * 1.5);
      sh.addColorStop(0, "rgba(70,90,110,0.28)");
      sh.addColorStop(1, "rgba(70,90,110,0)");
      ctx.fillStyle = sh;
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 1.02, r * 1.4, r * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const a0 = Math.asin(neckW / r);
      const outline = new Path2D();
      outline.arc(cx, cy, r, -Math.PI / 2 + a0, -Math.PI / 2 - a0, false);
      outline.moveTo(cx - neckW, cy - r * Math.cos(a0));
      outline.lineTo(cx - neckW, cy - neckH);
      outline.moveTo(cx + neckW, cy - r * Math.cos(a0));
      outline.lineTo(cx + neckW, cy - neckH);

      // glass body — faint cool tint so it reads as real transparent glass
      ctx.save();
      const bodyPath = new Path2D();
      bodyPath.arc(cx, cy, r * 0.99, 0, Math.PI * 2);
      ctx.clip(bodyPath);
      const glass = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      glass.addColorStop(0, "rgba(255,255,255,0.34)");
      glass.addColorStop(0.5, "rgba(214,230,240,0.14)");
      glass.addColorStop(1, "rgba(150,180,200,0.22)");
      ctx.fillStyle = glass;
      ctx.fill(bodyPath);

      // liquid with a curved meniscus surface
      const surfaceY = cy - r * 0.18;
      const liq = ctx.createLinearGradient(cx, surfaceY, cx, cy + r);
      liq.addColorStop(0, `rgba(120,205,225,${0.5 + glow * 0.35})`);
      liq.addColorStop(1, `rgba(38,120,160,${0.7 + glow * 0.2})`);
      ctx.fillStyle = liq;
      ctx.beginPath();
      ctx.moveTo(cx - r, surfaceY + 3);
      ctx.quadraticCurveTo(cx, surfaceY - r * 0.09, cx + r, surfaceY + 3);
      ctx.lineTo(cx + r, cy + r);
      ctx.lineTo(cx - r, cy + r);
      ctx.closePath();
      ctx.fill();

      // liquid surface highlight
      ctx.strokeStyle = "rgba(230,250,255,0.5)";
      ctx.lineWidth = Math.max(1, r * 0.03);
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.85, surfaceY + 2);
      ctx.quadraticCurveTo(cx, surfaceY - r * 0.08, cx + r * 0.85, surfaceY + 2);
      ctx.stroke();

      // ripples on the surface after impact
      if (ripple > 0.01) {
        for (let i = 0; i < 3; i++) {
          const rr = r * (0.15 + (1 - ripple) * 0.7) + i * r * 0.14;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255,255,255,${ripple * 0.4 - i * 0.1})`;
          ctx.lineWidth = 1.2;
          ctx.ellipse(cx, surfaceY, rr, rr * 0.2, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // condensation dots on the inner glass
      for (let i = 0; i < (tier === "low" ? 8 : 16); i++) {
        const ang = (i / 16) * Math.PI * 2 + i;
        const rad = r * (0.55 + (i % 3) * 0.14);
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad * 0.9, 0.9 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // refraction / rim — subtle dark edge + bright specular (real glass)
      ctx.lineWidth = Math.max(1.2, r * 0.05);
      ctx.strokeStyle = "rgba(120,150,175,0.5)";
      ctx.stroke(outline);
      ctx.lineWidth = Math.max(1, r * 0.055);
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.82, Math.PI * 1.02, Math.PI * 1.32);
      ctx.stroke();
      // secondary highlight on the neck
      ctx.lineWidth = Math.max(1, r * 0.04);
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.moveTo(cx - neckW * 0.4, cy - r * 0.8);
      ctx.lineTo(cx - neckW * 0.4, cy - neckH * 0.9);
      ctx.stroke();

      ctx.restore();
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const s = stageRef.current;
      const st = now - stageAt.current;
      const total = now - start;

      // ---- stage timeline
      if (s === "dark" && st > 900) setStageInternal("flask");
      if (s === "flask" && st > 1700) setStageInternal("drop");
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
            y: f.cy - f.r * (1.5 + (eqIdx % 3) * 0.5),
            born: now,
          });
          eqIdx++;
          sfx.equation();
        }
        if (st > 4600) setStageInternal("gas");
      }
      if (s === "gas") {
        emitVapor(tier === "low" ? 2 : 3);
        if (st > 2400) setStageInternal("gazelle");
      }
      if (s === "gazelle") {
        if (Math.random() < 0.5) emitVapor(1);
        if (st > 6000) setStageInternal("run");
      }
      if (s === "run") {
        runOffset -= (0.9 + st / 1100) * (w < 520 ? 1.1 : 1.7);
        bob = Math.abs(Math.sin(st / 95)) * 8;
        if (now - lastHoof > 250) {
          lastHoof = now;
          sfx.hoof();
          const f = flask();
          for (let i = 0; i < (tier === "low" ? 4 : 9); i++) {
            parts.push(
              spawn({
                role: "spark",
                x: f.cx + runOffset * 0.25 + (Math.random() - 0.3) * 50,
                y: h * 0.6 + Math.random() * 12,
                vx: 1.4 + Math.random() * 3,
                vy: -0.5 - Math.random() * 1.5,
                s: 1 + Math.random() * 1.6,
                a: 0.5,
                max: 900,
              }),
            );
          }
        }
        if (st > 3200) setStageInternal("burst");
      }
      if (s === "burst" && st > 1100) setStageInternal("name");
      if (s === "name" && st > 5400) setStageInternal("out");

      // ---- drop physics
      if (s === "drop" || s === "react") {
        const f = flask();
        if (!drop.landed) {
          if (!drop.falling) {
            drop.y = f.cy - f.r * 3 + Math.sin(now / 700) * 4;
          } else {
            drop.y += Math.max(2, (f.cy - drop.y) * 0.06) + 1.4;
            if (drop.y >= f.cy - f.r * 0.16) {
              drop.landed = true;
              ripple = 1;
            }
          }
        }
      }
      ripple *= 0.972;

      // ================= RENDER (bright lab) =================
      ctx.clearRect(0, 0, w, h);

      // base bright lab gradient
      const base = ctx.createLinearGradient(0, 0, 0, h);
      base.addColorStop(0, "#eef4f8");
      base.addColorStop(0.55, "#e3ebf1");
      base.addColorStop(1, "#d3dce5");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      // soft-box window light from top-center
      const key = ctx.createRadialGradient(w / 2, h * 0.1, 0, w / 2, h * 0.1, Math.max(w, h) * 0.75);
      key.addColorStop(0, "rgba(255,255,255,0.85)");
      key.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = key;
      ctx.fillRect(0, 0, w, h);

      // subtle cyan atmosphere that intensifies with the reaction
      const react = s === "react" || s === "gas" ? 0.5 : s === "gazelle" ? 0.35 : 0.14;
      const atm = ctx.createRadialGradient(w / 2, h * 0.6, 0, w / 2, h * 0.6, Math.max(w, h) * 0.6);
      atm.addColorStop(0, `rgba(150,210,230,${react * 0.4})`);
      atm.addColorStop(1, "rgba(150,210,230,0)");
      ctx.fillStyle = atm;
      ctx.fillRect(0, 0, w, h);

      // lab counter band (depth) lower third
      const counter = ctx.createLinearGradient(0, h * 0.72, 0, h);
      counter.addColorStop(0, "rgba(180,195,210,0)");
      counter.addColorStop(1, "rgba(150,168,186,0.45)");
      ctx.fillStyle = counter;
      ctx.fillRect(0, h * 0.72, w, h * 0.28);

      // atmospheric floating dust (soft, source-over so it reads on light bg)
      const dust = tier === "low" ? 22 : 46;
      for (let i = 0; i < dust; i++) {
        const px = ((i * 97.13 + total * 0.006 * ((i % 5) + 1)) % (w + 40)) - 20;
        const py = ((i * 53.7 + total * 0.004 * ((i % 3) + 1)) % (h + 40)) - 20;
        ctx.fillStyle =
          i % 2 === 0
            ? `rgba(255,255,255,${0.14 + (i % 4) * 0.03})`
            : `rgba(120,140,160,${0.05 + (i % 3) * 0.02})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.1 + (i % 3) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      const flaskAlpha =
        s === "dark"
          ? 0
          : s === "flask"
            ? Math.min(1, st / 2000)
            : s === "run" || s === "burst" || s === "name" || s === "out"
              ? Math.max(0, 1 - st / 900)
              : 1;
      if (flaskAlpha > 0.01) drawFlask(flaskAlpha, ripple * 0.5);

      // falling drop
      if ((s === "drop" || (s === "react" && !drop.landed)) && flaskAlpha > 0) {
        const f = flask();
        ctx.save();
        const dg = ctx.createRadialGradient(f.cx, drop.y, 0, f.cx, drop.y, 12);
        dg.addColorStop(0, "rgba(120,205,235,0.9)");
        dg.addColorStop(1, "rgba(120,205,235,0)");
        ctx.fillStyle = dg;
        ctx.beginPath();
        ctx.arc(f.cx, drop.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(70,150,185,0.95)";
        ctx.beginPath();
        ctx.ellipse(f.cx, drop.y, 3, 4.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath();
        ctx.arc(f.cx - 1, drop.y - 1.4, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // equations — dark ink with a faint cyan glow so they read on light bg
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = `600 ${Math.max(13, Math.min(w * 0.04, 21))}px system-ui, "Segoe UI", Arial, sans-serif`;
      for (let i = equations.length - 1; i >= 0; i--) {
        const e = equations[i]!;
        const age = now - e.born;
        if (age > 3600) {
          equations.splice(i, 1);
          continue;
        }
        const k = age / 3600;
        const a = k < 0.2 ? k / 0.2 : k > 0.7 ? (1 - k) / 0.3 : 1;
        ctx.globalAlpha = Math.max(0, a);
        ctx.shadowColor = "rgba(120,205,230,0.7)";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "rgba(30,70,95,0.92)";
        ctx.fillText(e.text, e.x, e.y - k * 26);
      }
      ctx.restore();

      // ---- particles
      const formT = s === "gazelle" ? Math.min(1, st / 3600) : 1; // formation progress
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]!;
        p.life += 16.7;
        if (p.life > p.max) {
          parts.splice(i, 1);
          continue;
        }

        let a = p.a;
        let sizeMul = 1;
        let tint = "255,255,255";
        let composite: GlobalCompositeOperation = "source-over";

        if (p.role === "shape") {
          // gradual formation: a particle only homes once formation time
          // passes its ordinal (head -> body -> legs).
          const gate = Math.min(1, Math.max(0, (formT - p.ord * 0.9) / 0.18));
          let tx = p.bx;
          let ty = p.by;

          if (s === "run") {
            tx += runOffset;
            ty += bob;
            // fake gallop: legs stride out of phase with the body
            const phase = p.bx > w / 2 ? 0 : Math.PI;
            ty += Math.sin(st / 90 + phase) * 5 * p.leg;
            if (tx < -80) tx += w + 160;
          } else if (s === "gazelle") {
            // head gently tracks the pointer for a "living" silhouette
            const headness = Math.max(0, 1 - p.ord * 2);
            const dx = (pointer.active ? pointer.x : w / 2) - w / 2;
            const dy = (pointer.active ? pointer.y : h * 0.35) - h * 0.35;
            tx += dx * 0.03 * headness;
            ty += dy * 0.025 * headness;
          }

          const wob = Math.sin(now / 640 + p.seed) * (s === "run" ? 2.6 : 1.8);
          const homing = s === "burst" || s === "name" ? 0.055 : 0.11;
          if (s === "gazelle" && gate <= 0) {
            // not yet part of the body — drift upward like gas
            p.vy -= 0.01;
            p.vx += Math.sin(now / 800 + p.seed) * 0.02;
            a = 0.14;
          } else {
            p.vx += (tx + wob - p.x) * homing;
            p.vy += (ty + wob * 0.5 - p.y) * homing;
            p.vx *= 0.8;
            p.vy *= 0.8;
            a = p.a * (s === "gazelle" ? 0.35 + gate * 0.65 : 1);
          }
          // gazelle reads as a dark cinematic shadow on the bright lab
          tint = "34,48,64";
          sizeMul = 1.05;
        } else if (p.role === "spark") {
          p.vy += 0.02;
          tint = "90,180,210";
          composite = "source-over";
        } else {
          // vapor / bubbles rise and cool
          p.vy -= p.role === "vapor" ? 0.004 : 0.008;
          p.vx += Math.sin(now / 900 + p.seed) * 0.01;
          if (p.role === "vapor") {
            tint = "255,255,255";
            sizeMul = 1.7;
          } else {
            tint = "255,255,255";
          }
        }

        // pointer repels loose (non-shape) particles for tactility
        if (pointer.active && p.role !== "shape") {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 9000 && d2 > 1) {
            const f = (1 - d2 / 9000) * 0.6;
            p.vx += (dx / Math.sqrt(d2)) * f;
            p.vy += (dy / Math.sqrt(d2)) * f;
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        const lifeK = p.max === Infinity ? 1 : 1 - Math.min(1, p.life / p.max);
        if (p.role !== "shape") a *= lifeK;
        if (s === "out") a *= Math.max(0, 1 - st / 900);
        if (a <= 0.01) continue;

        const size = p.s * (p.role === "vapor" ? 1.6 : 1.15) * sizeMul;
        ctx.globalCompositeOperation = composite;
        if (p.role === "bubble") {
          // bubbles as tiny translucent rings for realism
          ctx.strokeStyle = `rgba(255,255,255,${a})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 1.6, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          const rg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2.2);
          rg.addColorStop(0, `rgba(${tint},${a})`);
          rg.addColorStop(1, `rgba(${tint},0)`);
          ctx.fillStyle = rg;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
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
      <div className="fixed inset-0 z-50 grid place-items-center bg-[#eef4f8] px-6 text-center text-[#22303f]">
        <div>
          <h1 className="text-3xl font-black">مستر عمرو جمال</h1>
          <p className="mt-2 text-lg text-[#1c7ba0]">الغزال 🦌</p>
          <p className="text-[#5a7185]">بتاع كيميا ⚗️</p>
          <button
            onClick={finish}
            className="press mt-8 rounded-full border border-[#c3d1dd] bg-white px-6 py-3 text-sm"
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
      className="fixed inset-0 z-50 touch-none"
      data-stage={stage}
      style={{
        transition: "opacity .9s ease",
        opacity: stage === "out" ? 0 : 1,
        background: "linear-gradient(180deg,#eef4f8 0%,#e3ebf1 55%,#d3dce5 100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full"
        onPointerDown={() => tapRef.current()}
        aria-label="مقدمة تفاعلية: تفاعل كيميائي واقعي"
      />

      {prompt && (
        <button
          type="button"
          onClick={() => tapRef.current()}
          className="anim-breathe absolute inset-x-0 top-[14%] mx-auto w-fit rounded-full border border-[#bcd0dd] bg-white/70 px-6 py-3 text-sm tracking-wide text-[#1d3345] shadow-lg backdrop-blur-sm"
        >
          {prompt}
        </button>
      )}

      {/* particle-born name reveal — kept crisp with real DOM text so
          "مستر عمرو جمال" is razor sharp and never covered by particles */}
      <div className="pointer-events-none absolute inset-x-0 top-[40%] px-5 text-center">
        <h1
          className="font-display font-black leading-tight text-[#132433] transition-all duration-700"
          style={{
            fontSize: "clamp(2.4rem, 13vw, 5rem)",
            opacity: nameStep >= 1 ? 1 : 0,
            transform: `translateY(${nameStep >= 1 ? 0 : 18}px) scale(${nameStep >= 1 ? 1 : 0.92})`,
            textShadow: "0 2px 30px rgba(120,205,230,0.55), 0 1px 2px rgba(255,255,255,0.9)",
          }}
        >
          مستر عمرو جمال
        </h1>
        <p
          className="mt-3 font-display text-2xl font-bold text-[#0f7ba1] transition-all duration-700 sm:text-3xl"
          style={{
            opacity: nameStep >= 2 ? 1 : 0,
            transform: `translateY(${nameStep >= 2 ? 0 : 14}px)`,
          }}
        >
          الغزال 🦌
        </p>
        <p
          className="mt-1 text-base text-[#43596b] transition-all duration-700 sm:text-lg"
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
          className="press rounded-full border border-[#c3d1dd] bg-white/70 px-5 py-3 text-xs text-[#43596b] backdrop-blur-md"
        >
          تخطي المقدمة
        </button>
      </div>
    </div>
  );
}
