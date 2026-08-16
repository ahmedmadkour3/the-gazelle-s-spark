import { useRef, useState } from "react";
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
                ارفعها وضيفها في <span dir="ltr">src/lib/media.ts</span> ←{" "}
                <span dir="ltr">studentShots</span>
              </p>
            </div>
          ) : (
            <>
              <div
                ref={trackRef}
                className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {studentShots.map((s, i) => (
                  <button
                    key={s.src}
                    type="button"
                    onClick={() => {
                      sfx.tap();
                      setZoom(i);
                    }}
                    className="press w-[78vw] shrink-0 snap-center overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-deep)] sm:w-[42%]"
                  >
                    <img
                      src={s.src}
                      alt={s.alt}
                      loading="lazy"
                      className="h-auto w-full object-contain"
                    />
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                اسحب لليمين أو الشمال • اضغط على الصورة لتكبيرها
              </p>
            </>
          )}
        </div>
      )}

      {zoom !== null && studentShots[zoom] && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-void/95 p-4 animate-[fade-in_.3s_ease-out] backdrop-blur-sm"
          onClick={() => setZoom(null)}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={studentShots[zoom]!.src}
            alt={studentShots[zoom]!.alt}
            className="max-h-[86svh] w-auto max-w-full rounded-xl"
          />
          <button
            type="button"
            onClick={() => setZoom(null)}
            className="press mt-5 rounded-full border border-border bg-card px-6 py-3 text-sm"
          >
            إغلاق
          </button>
        </div>
      )}
    </section>
  );
}
