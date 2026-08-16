import { useEffect, useRef, useState } from "react";
import { usePerfTier } from "@/hooks/useReveal";
import { sfx } from "@/lib/sfx";

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

export function Ending() {
  const wrap = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [step, setStep] = useState(0);
  const activeRef = useRef(false);
  const tier = usePerfTier();

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let fired = false;
    const io = new IntersectionObserver(
      (e) => {
        activeRef.current = !!e[0]?.isIntersecting;
        if (e[0]?.isIntersecting && !fired) {
          fired = true;
          [1600, 3200, 5200, 6800].forEach((t, i) =>
            window.setTimeout(() => {
              setStep(i + 1);
              if (i === 1) sfx.reveal();
            }, t),
          );
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    let w = 0;
    let h = 0;
    let pts: { x: number; y: number; tx: number; ty: number; s: number; seed: number }[] =
      [];

    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sw = Math.min(w * 0.8, 380);
      const sh = sw * 0.78;
      const off = document.createElement("canvas");
      off.width = Math.floor(sw);
      off.height = Math.floor(sh);
      const oc = off.getContext("2d");
      if (!oc) return;
      oc.fillStyle = "#fff";
      oc.beginPath();
      GAZELLE.forEach(([x, y], i) => {
        const px = x * off.width;
        const py = y * off.height;
        if (i === 0) oc.moveTo(px, py);
        else oc.lineTo(px, py);
      });
      oc.closePath();
      oc.fill();
      const data = oc.getImageData(0, 0, off.width, off.height).data;
      const step = tier === "low" ? 9 : 7;
      pts = [];
      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          if (data[(y * off.width + x) * 4 + 3]! > 130) {
            const tx = (w - sw) / 2 + x;
            const ty = (h - sh) / 2 + y;
            pts.push({
              x: tx + (Math.random() - 0.5) * 160,
              y: ty + (Math.random() - 0.5) * 160,
              tx,
              ty,
              s: 0.8 + Math.random() * 1.2,
              seed: Math.random() * 1000,
            });
          }
        }
      }
    };
    build();
    window.addEventListener("resize", build);

    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, w, h);
      if (!activeRef.current) return;
      ctx.globalCompositeOperation = "lighter";
      for (const p of pts) {
        const wob = Math.sin(now / 700 + p.seed) * 2.6;
        p.x += (p.tx + wob - p.x) * 0.035;
        p.y += (p.ty + wob * 0.5 - p.y) * 0.035;
        const r = p.s * 2.6;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, "rgba(150,230,255,0.5)");
        g.addColorStop(1, "rgba(150,230,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
    };
  }, [tier]);

  const line = (i: number) => ({
    opacity: step >= i ? 1 : 0,
    transform: step >= i ? "none" : "translateY(12px)",
    transition: "opacity 1.2s ease, transform 1.2s cubic-bezier(.16,1,.3,1)",
  });

  return (
    <section
      id="end"
      ref={wrap}
      className="relative mx-auto flex min-h-[100svh] max-w-3xl flex-col items-center justify-center px-5 py-24 text-center"
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full opacity-90"
      />
      <div className="relative">
        <p className="font-display text-2xl sm:text-3xl" style={line(1)}>
          شكرًا يا غزال...
        </p>
        <p className="mt-4 text-base text-muted-foreground" style={line(2)}>
          على كل تفاعل خلّى المعلومة تثبت.
        </p>
        <p
          className="text-cyan-grad mt-14 font-display text-4xl font-black sm:text-5xl"
          style={line(3)}
        >
          مستر عمرو جمال 🦌
        </p>
        <p className="mt-3 text-sm text-silver" style={line(4)}>
          الغزال... بتاع كيميا ⚗️
        </p>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            "linear-gradient(to top, oklch(0.1 0.01 250), transparent)",
        }}
      />
    </section>
  );
}
