import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";

const LINES = ["التفاعل بدأ.", "المعادلة اتظبطت.", "التركيز 100%.", "الناتج؟"];

export function ChemFun() {
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
          LINES.forEach((_, i) =>
            window.setTimeout(() => {
              setStep(i + 1);
              sfx.equation();
            }, 500 + i * 900),
          );
          window.setTimeout(
            () => {
              setStep(LINES.length + 1);
              sfx.reveal();
            },
            500 + LINES.length * 900,
          );
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="chem"
      ref={ref}
      className="relative mx-auto max-w-2xl px-5 py-24 text-center"
    >
      <p className="label-mono reveal">بتاع كيميا ⚗️</p>
      <div className="mt-8 space-y-4">
        {LINES.map((l, i) => (
          <p
            key={l}
            className="font-display text-xl transition-all duration-700 sm:text-2xl"
            style={{
              opacity: step > i ? 1 : 0.12,
              transform: step > i ? "none" : "translateY(10px)",
              color: step > i ? "var(--color-silver)" : undefined,
            }}
          >
            {l}
          </p>
        ))}
      </div>
      <div
        className="mt-10 transition-all duration-1000"
        style={{
          opacity: step > LINES.length ? 1 : 0,
          transform: step > LINES.length ? "none" : "scale(.9)",
          filter: step > LINES.length ? "blur(0)" : "blur(8px)",
        }}
      >
        <span className="text-cyan-grad font-display text-5xl font-black sm:text-6xl">
          نجاح 🦌
        </span>
      </div>
    </section>
  );
}
