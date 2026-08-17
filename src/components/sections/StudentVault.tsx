import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";
import { studentShots } from "@/lib/media";

export function StudentVault() {
  const [open, setOpen] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const openVault = () => {
    if (open) return;
    setShaking(true);
    sfx.open();
    window.setTimeout(() => {
      setShaking(false);
      setOpen(true);
    }, 900);
  };

  return (
    <section
      id="students"
      className="relative mx-auto max-w-4xl px-5 py-24"
      aria-labelledby="students-title"
    >
      <p className="label-mono reveal">آراء الطلاب</p>
      <h2 id="students-title" className="reveal mt-3 text-2xl sm:text-3xl">
        آراء طلاب الغزال ❤️
      </h2>
      <p className="reveal mt-3 text-sm text-muted-foreground">
        كل كلمة هنا شهادة من طالب عاش التجربة بنفسه.
      </p>

      {!open && (
        <div className="reveal-scale mt-12 flex flex-col items-center">
          <button
            type="button"
            onClick={openVault}
            aria-label="اضغط واكتشف كلام طلاب الغزال"
            className="press relative grid size-56 place-items-center rounded-[2rem] border border-border sm:size-64"
            style={{
              background:
                "linear-gradient(160deg, oklch(0.26 0.02 240 / .8), oklch(0.15 0.014 250 / .9))",
              boxShadow: "var(--shadow-deep), var(--glow-cyan)",
              animation: shaking
                ? "breathe .28s ease-in-out infinite"
                : undefined,
            }}
          >
            <span
              aria-hidden
              className="anim-pulse-ring absolute inset-6 rounded-[1.5rem] border border-primary/25"
            />
            <span
              aria-hidden
              className="absolute inset-0 overflow-hidden rounded-[2rem]"
            >
              {["H₂", "O₂", "Na", "Cl", "CO₂", "K"].map((t, i) => (
                <span
                  key={t}
                  className="absolute font-accent text-[0.6rem] text-primary/50"
                  style={{
                    left: `${10 + i * 14}%`,
                    bottom: 0,
                    animation: `drift-up ${4 + i * 0.7}s ${i * 0.5}s ease-out infinite`,
                  }}
                >
                  {t}
                </span>
              ))}
            </span>
            <span className="relative text-center">
              <span aria-hidden className="block text-5xl">
                ⚗️
              </span>
              <span className="mt-3 block text-xs text-silver">
                {shaking ? "التفاعل بدأ…" : "اضغط واكتشف كلام طلاب الغزال"}
              </span>
            </span>
          </button>
        </div>
      )}

      {open && (
        <div className="mt-10 animate-[fade-in_.8s_ease-out]">
          {studentShots.length === 0 ? (
            <div className="surface-glass rounded-2xl p-8 text-center">
              <p className="text-sm text-silver">
                مكان صور آراء الطلاب (سكرين شوتس الدفعة الحالية)
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                في انتظار رفع الصور
              </p>
            </div>
          ) : (
            <>
              <div
                ref={trackRef}
                className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-6 pt-2 [perspective:1200px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {studentShots.map((s, i) => (
                  <FloatingSlide
                    key={s.src}
                    index={i}
                    dimmed={zoom !== null && zoom !== i}
                    onOpen={() => {
                      sfx.tap();
                      setZoom(i);
                    }}
                  >
                    <img
                      src={s.src}
                      alt={s.alt}
                      loading="lazy"
                      draggable={false}
                      className="pointer-events-none h-auto w-full select-none object-contain"
                    />
                  </FloatingSlide>
                ))}
              </div>
              <p className="mt-1 text-center text-xs text-muted-foreground">
                اسحب لليمين أو الشمال • اضغط على الصورة لتكبيرها
              </p>
            </>
          )}
        </div>
      )}

      {zoom !== null && studentShots[zoom] && (
        <Lightbox
          shots={studentShots}
          index={zoom}
          onIndex={setZoom}
          onClose={() => setZoom(null)}
        />
      )}
    </section>
  );
}

/**
 * A photographic slide that floats gently, casts a real shadow, and responds
 * to touch/drag with a subtle 3D tilt + parallax. Tapping lifts it before the
 * lightbox expands.
 */
function FloatingSlide({
  index,
  dimmed,
  onOpen,
  children,
}: {
  index: number;
  dimmed: boolean;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, active: false });
  const dragging = useRef<{ x: number; y: number; moved: number } | null>(null);
  const rot = (index % 2 === 0 ? 1 : -1) * (0.6 + (index % 3) * 0.4);

  const onDown = (e: React.PointerEvent) => {
    dragging.current = { x: e.clientX, y: e.clientY, moved: 0 };
    setTilt((t) => ({ ...t, active: true }));
  };
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    const d = dragging.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    if (d) d.moved += Math.abs(e.movementX) + Math.abs(e.movementY);
    setTilt({ rx: -py * 10, ry: px * 12, active: true });
  };
  const reset = () => {
    dragging.current = null;
    setTilt({ rx: 0, ry: 0, active: false });
  };
  const onUp = () => {
    const moved = dragging.current?.moved ?? 0;
    reset();
    if (moved < 8) onOpen(); // treat as a tap, not a drag
  };

  return (
    <button
      ref={ref}
      type="button"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={reset}
      onPointerCancel={reset}
      className={`float-slide press w-[78vw] shrink-0 snap-center overflow-hidden rounded-2xl border border-border bg-card sm:w-[44%] ${tilt.active ? "is-lift" : ""}`}
      style={
        {
          "--slide-rot": `${rot}deg`,
          animationDelay: `${index * 0.6}s`,
          transform: tilt.active
            ? `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(-6px) scale(1.02)`
            : undefined,
          transition: tilt.active ? "none" : "transform .5s cubic-bezier(.16,1,.3,1), opacity .4s ease",
          opacity: dimmed ? 0.35 : 1,
          filter: dimmed ? "blur(3px)" : "none",
          boxShadow:
            "0 26px 50px -30px oklch(0 0 0 / .85), 0 8px 20px -14px oklch(0.8 0.13 205 / .35)",
        } as React.CSSProperties
      }
    >
      {children}
    </button>
  );
}

/** Full-screen viewer with swipe prev/next, pinch/double-tap zoom, and close. */
function Lightbox({
  shots,
  index,
  onIndex,
  onClose,
}: {
  shots: { src: string; alt: string }[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const startX = useRef<number | null>(null);
  const dx = useRef(0);
  const [drag, setDrag] = useState(0);

  const go = (dir: number) => {
    const next = index + dir;
    if (next < 0 || next >= shots.length) return;
    sfx.tap();
    setZoomed(false);
    onIndex(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(1); // RTL: left = next
      if (e.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, shots.length]);

  const onDown = (e: React.PointerEvent) => {
    if (zoomed) return;
    startX.current = e.clientX;
    dx.current = 0;
  };
  const onMove = (e: React.PointerEvent) => {
    if (startX.current === null || zoomed) return;
    dx.current = e.clientX - startX.current;
    setDrag(dx.current);
  };
  const onUp = () => {
    if (startX.current === null) return;
    const d = dx.current;
    startX.current = null;
    setDrag(0);
    if (Math.abs(d) > 60) go(d < 0 ? 1 : -1); // swipe left (RTL) => next
  };

  const shot = shots[index]!;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-void/95 p-4 animate-[fade-in_.28s_ease-out] backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[86svh] w-full max-w-3xl touch-none items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <img
          src={shot.src}
          alt={shot.alt}
          onDoubleClick={() => setZoomed((z) => !z)}
          className="max-h-[82svh] w-auto max-w-full rounded-xl shadow-[var(--shadow-deep)]"
          style={{
            transform: `translateX(${drag}px) scale(${zoomed ? 1.9 : 1})`,
            transition: drag ? "none" : "transform .4s cubic-bezier(.16,1,.3,1)",
            cursor: zoomed ? "zoom-out" : "zoom-in",
          }}
        />
      </div>

      {/* prev / next */}
      {index < shots.length - 1 && (
        <button
          type="button"
          aria-label="التالي"
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          className="press absolute start-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/70 text-lg backdrop-blur-md"
        >
          ‹
        </button>
      )}
      {index > 0 && (
        <button
          type="button"
          aria-label="السابق"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          className="press absolute end-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/70 text-lg backdrop-blur-md"
        >
          ›
        </button>
      )}

      <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {index + 1} / {shots.length} • اسحب للتنقل • دبل-تاب للتكبير
        </span>
        <button
          type="button"
          onClick={onClose}
          className="press rounded-full border border-border bg-card px-6 py-3 text-sm"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}
