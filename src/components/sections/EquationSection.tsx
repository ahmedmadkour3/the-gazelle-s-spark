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
      className="relative mx-auto flex min-h-[92svh] max-w-3xl flex-col justify-center px-5 py-24"
    >
      <p className="label-mono reveal">المعادلة</p>
      <h2 className="reveal mt-3 text-2xl leading-snug sm:text-3xl">
        كل حاجة فيه بتتجمع في معادلة واحدة
      </h2>

      <div className="mt-10 space-y-4">
        {TERMS.map((t, i) => {
          const on = step > i;
          return (
            <div
              key={t.key}
              className="surface-glass relative overflow-hidden rounded-2xl px-5 py-5 transition-all duration-700"
              style={{
                opacity: on ? 1 : 0.18,
                transform: on ? "none" : "translateY(14px)",
                borderColor: on ? "var(--color-ring)" : undefined,
                boxShadow: on ? "var(--shadow-cinematic)" : "none",
              }}
            >
              <TermVisual kind={t.kind} active={on} />
              <div className="relative flex items-baseline gap-3">
                <span className="font-display text-2xl font-black sm:text-3xl">
                  {t.key}
                </span>
                <span aria-hidden className="text-xl">
                  {t.icon}
                </span>
                {i < TERMS.length - 1 && (
                  <span className="ms-auto font-display text-2xl text-primary/70">
                    +
                  </span>
                )}
              </div>
              <p className="relative mt-1 text-sm text-muted-foreground">
                {t.note}
              </p>
            </div>
          );
        })}
      </div>

      <div
        className="mt-8 text-center transition-all duration-700"
        style={{ opacity: step >= 4 ? 1 : 0.15 }}
      >
        <span className="font-display text-4xl text-primary">=</span>
      </div>

      <div
        className="mt-6 text-center transition-all duration-1000"
        style={{
          opacity: step >= 5 ? 1 : 0,
          transform: step >= 5 ? "none" : "scale(.92)",
          filter: step >= 5 ? "blur(0)" : "blur(10px)",
        }}
      >
        <h3 className="text-cyan-grad font-display text-5xl font-black sm:text-6xl">
          الغزال 🦌
        </h3>
        <p className="mt-3 text-lg text-silver">عمرو جمال</p>
      </div>
    </section>
  );
}

function TermVisual({
  kind,
  active,
}: {
  kind: "chem" | "grace" | "speed";
  active: boolean;
}) {
  if (!active) return null;
  if (kind === "chem")
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {["H₂O", "O₂", "NaCl", "CO₂"].map((t, i) => (
          <span
            key={t}
            className="absolute font-accent text-[0.65rem] text-primary/60"
            style={{
              left: `${12 + i * 21}%`,
              bottom: 0,
              animation: `drift-up ${5 + i}s ${i * 0.7}s ease-out infinite`,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    );
  if (kind === "grace")
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute h-px w-1/2 origin-right"
            style={{
              top: `${28 + i * 22}%`,
              right: "6%",
              background:
                "linear-gradient(to left, transparent, oklch(0.8 0.13 205 / .5), transparent)",
              animation: `shimmer-line ${2.4 + i * 0.6}s ${i * 0.3}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
    );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="absolute h-[2px] w-16 rounded-full"
          style={{
            top: `${18 + i * 20}%`,
            right: "-20%",
            background:
              "linear-gradient(to left, oklch(0.9 0.1 200 / .8), transparent)",
            animation: `shimmer-line ${1 + i * 0.25}s ${i * 0.18}s linear infinite`,
          }}
        />
      ))}
    </div>
  );
}
