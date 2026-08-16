import { useEffect, useRef } from "react";
import { usePerfTier } from "@/hooks/useReveal";

/** The site background: the atmosphere the intro's reaction dissolved into. */
export function AmbientParticles() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const tier = usePerfTier();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const n = tier === "low" ? 34 : 70;
    const pts = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.16,
      vy: -0.06 - Math.random() * 0.18,
      s: 0.6 + Math.random() * 1.8,
      a: 0.1 + Math.random() * 0.3,
    }));
    const pointer = { x: -999, y: -999 };
    const move = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    window.addEventListener("pointermove", move, { passive: true });

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of pts) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14000 && d2 > 1) {
          const f = (1 - d2 / 14000) * 0.35;
          p.vx += (dx / Math.sqrt(d2)) * f;
          p.vy += (dy / Math.sqrt(d2)) * f;
        }
        p.vx *= 0.985;
        p.vy = Math.max(-1.2, p.vy * 0.99 - 0.0006);
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -20) {
          p.y = h + 20;
          p.x = Math.random() * w;
        }
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        const r = p.s * 3.2;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, `rgba(140,215,240,${p.a})`);
        g.addColorStop(1, "rgba(140,215,240,0)");
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
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
    };
  }, [tier]);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: "var(--gradient-void)" }}
      aria-hidden
    >
      <canvas ref={ref} className="size-full opacity-80" />
    </div>
  );
}
