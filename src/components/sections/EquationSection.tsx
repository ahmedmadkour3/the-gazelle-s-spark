import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";

const TERMS = [
  {
    key: "كيمياء",
    icon: "⚗️",
    note: "معادلات، جزيئات، وتفاعل بيفهّم.",
    kind: "chem" as const,
  },
  {
    key: "رشاقة",
    icon: "🦌",
    note: "خطوة خفيفة بين أصعب المسائل.",
    kind: "grace" as const,
  },
  {
    key: "سرعة",
    icon: "⚡",
    note: "الحل قبل ما تلحق تسأل.",
    kind: "speed" as const,
  },
];

export function EquationSection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState(0);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e[0]?.isIntersecting && !fired.current) {
          fired.current = true;
          [1, 2, 3, 4, 5].forEach((s, i) =>
            window.setTimeout(
              () => {
                setStep(s);
                if (s <= 3) sfx.equation();
                if (s === 5) sfx.reveal();
              },
              700 + i * 850,
            ),
          );
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="equation"
      ref={ref}
      className="relative mx-auto flex min-h-[92svh] max-w-3xl flex-col justify-center px-4 py-24"
    >
      <p className="label-mono reveal">المعادلة</p>
      <h2 className="reveal mt-3 text-2xl leading-snug sm:text-3xl">
        كل حاجة فيه بتتجمع في معادلة واحدة
      </h2>

      {/* Single horizontal scientific formula — stays on one line on mobile */}
      <div
        dir="rtl"
        className="surface-glass mt-10 flex items-center justify-center gap-1.5 overflow-hidden rounded-2xl px-2 py-6 sm:gap-3 sm:px-5 sm:py-8"
      >
        {TERMS.map((t, i) => {
          const on = step > i;
          return (
            <div key={t.key} className="flex items-center gap-1.5 sm:gap-3">
              <span
                className="flex flex-col items-center transition-all duration-700"
                style={{
                  opacity: on ? 1 : 0.18,
                  transform: on ? "none" : "translateY(10px)",
                }}
              >
                <span
                  aria-hidden
                  className="text-lg leading-none sm:text-2xl"
                  style={{
                    filter: on ? "none" : "grayscale(1)",
                  }}
                >
                  {t.icon}
                </span>
                <span className="mt-1 font-display text-sm font-black leading-none sm:text-xl">
                  {t.key}
                </span>
              </span>
              {i < TERMS.length - 1 && (
                <span
                  className="font-display text-lg text-primary/70 transition-opacity duration-700 sm:text-2xl"
                  style={{ opacity: step > i + 1 ? 1 : 0.2 }}
                >
                  +
                </span>
              )}
            </div>
          );
        })}

        <span
          className="font-display text-lg text-primary transition-opacity duration-700 sm:text-2xl"
          style={{ opacity: step >= 4 ? 1 : 0.15 }}
        >
          =
        </span>

        <span
          className="flex flex-col items-center transition-all duration-1000"
          style={{
            opacity: step >= 5 ? 1 : 0,
            transform: step >= 5 ? "none" : "scale(.8)",
            filter: step >= 5 ? "blur(0)" : "blur(8px)",
          }}
        >
          <span aria-hidden className="text-lg leading-none sm:text-2xl">
            🦌
          </span>
          <span className="text-cyan-grad mt-1 font-display text-base font-black leading-none sm:text-2xl">
            الغزال
          </span>
        </span>
      </div>

      {/* short note that reinforces the formula without stacking it */}
      <p
        className="mt-6 text-center text-sm text-muted-foreground transition-opacity duration-1000"
        style={{ opacity: step >= 5 ? 1 : 0 }}
      >
        كيمياء + رشاقة + سرعة = عمرو جمال، الغزال بتاع كيميا.
      </p>
    </section>
  );
}
