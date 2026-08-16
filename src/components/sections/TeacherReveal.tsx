import { portraitHero } from "@/lib/media";

export function TeacherReveal() {
  return (
    <section
      id="hero"
      className="relative mx-auto max-w-3xl px-5 py-24 sm:py-32"
      aria-labelledby="hero-title"
    >
      <div className="reveal-scale relative">
        <div
          aria-hidden
          className="anim-breathe absolute -inset-8 -z-10 rounded-[3rem]"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 30%, oklch(0.8 0.13 205 / .22), transparent 70%)",
          }}
        />
        <figure className="surface-glass relative overflow-hidden rounded-[1.75rem]">
          <div className="relative aspect-[4/5] w-full">
            {portraitHero ? (
              <img
                src={portraitHero}
                alt="مستر عمرو جمال"
                loading="lazy"
                className="size-full object-cover"
              />
            ) : (
              <PortraitSlot n={1} />
            )}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, oklch(0.13 0.012 250) 4%, transparent 55%)",
              }}
            />
          </div>
          <figcaption className="relative -mt-16 px-6 pb-7 text-center">
            <h1
              id="hero-title"
              className="font-display text-4xl font-black tracking-tight sm:text-5xl"
            >
              عمرو جمال
            </h1>
            <div className="mt-3 flex items-center justify-center gap-2 text-sm">
              <span className="rounded-full border border-border bg-card/70 px-3 py-1 text-primary">
                الغزال 🦌
              </span>
              <span className="rounded-full border border-border bg-card/70 px-3 py-1 text-silver">
                بتاع كيميا ⚗️
              </span>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

export function PortraitSlot({ n }: { n: number }) {
  return (
    <div className="grid size-full place-items-center bg-secondary/40 text-center">
      <div className="px-6">
        <p className="text-3xl" aria-hidden>
          🦌
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          مكان صورة المستر رقم {n}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          حطّها في src/assets واربطها من src/lib/media.ts
        </p>
      </div>
    </div>
  );
}
