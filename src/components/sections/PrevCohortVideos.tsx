import { useRef, useState } from "react";
import { sfx } from "@/lib/sfx";
import { testimonialVideos } from "@/lib/media";

export function PrevCohortVideos() {
  return (
    <section
      id="videos"
      className="relative mx-auto max-w-3xl px-5 py-24"
      aria-labelledby="videos-title"
    >
      <p className="label-mono reveal">شهادات</p>
      <h2 id="videos-title" className="reveal mt-3 text-2xl sm:text-3xl">
        ومن الدفعة اللي قبلنا... ❤️
      </h2>

      <div className="mt-12 space-y-14">
        {testimonialVideos.map((v, i) => (
          <div key={i}>
            <VideoCard {...v} />
            {i === 0 && (
              <div aria-hidden className="relative mt-14 h-6">
                <span
                  className="absolute inset-x-8 top-1/2 h-px"
                  style={{
                    background:
                      "linear-gradient(to left, transparent, oklch(0.8 0.13 205 / .45), transparent)",
                  }}
                />
                <span className="absolute inset-x-0 -top-1 text-center font-accent text-[0.65rem] text-primary/60">
                  ⇌
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function VideoCard({
  src,
  ratio,
  label,
}: {
  src: string | null;
  ratio: "9/16" | "1/1";
  label: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    const el = ref.current;
    if (!el) return;
    sfx.tap();
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  return (
    <figure className="reveal-scale mx-auto w-full max-w-sm">
      <div
        className="surface-glass relative overflow-hidden rounded-[1.5rem]"
        style={{ boxShadow: "var(--shadow-deep), var(--glow-cyan)" }}
      >
        <div className="relative w-full" style={{ aspectRatio: ratio }}>
          {src ? (
            <video
              ref={ref}
              src={src}
              playsInline
              preload="none"
              controls={playing}
              onEnded={() => setPlaying(false)}
              className="size-full object-contain bg-void"
            />
          ) : (
            <div className="grid size-full place-items-center bg-secondary/30 px-6 text-center">
              <div>
                <p aria-hidden className="text-3xl">
                  🎞️
                </p>
                <p className="mt-2 text-sm text-silver">مكان فيديو الطالب</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  النسبة {ratio === "9/16" ? "٩:١٦ رأسي" : "١:١ مربع"} — في
                  انتظار رفع الفيديو
                </p>
              </div>
            </div>
          )}

          {src && !playing && (
            <button
              type="button"
              onClick={play}
              aria-label="تشغيل الفيديو"
              className="press absolute inset-0 grid place-items-center bg-void/35 backdrop-blur-[2px]"
            >
              <span className="anim-pulse-ring grid size-16 place-items-center rounded-full border border-primary/40 bg-card/70 text-2xl">
                ▶
              </span>
            </button>
          )}
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted-foreground">
        {label}
      </figcaption>
    </figure>
  );
}
