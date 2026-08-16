import { useEffect, useState } from "react";
import { sfx } from "@/lib/sfx";

const SECTIONS = [
  { id: "hero", label: "البداية" },
  { id: "equation", label: "المعادلة" },
  { id: "message", label: "الرسالة" },
  { id: "students", label: "آراء الطلاب" },
  { id: "videos", label: "الدفعة السابقة" },
  { id: "end", label: "النهاية" },
];

export function SectionNav() {
  const [active, setActive] = useState("hero");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) setActive(vis.target.id);
      },
      { threshold: [0.25, 0.5] },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label="أقسام الموقع"
      className="fixed inset-x-0 z-30 flex justify-center px-4"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="surface-glass flex max-w-full items-center gap-1 rounded-full px-2 py-2">
        {open ? (
          <div className="flex max-w-[80vw] gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => {
                  sfx.tap();
                  setOpen(false);
                }}
                className={`press shrink-0 rounded-full px-3 py-2 text-xs ${
                  active === s.id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {s.label}
              </a>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              sfx.tap();
              setOpen(true);
            }}
            className="press flex items-center gap-2 rounded-full px-4 py-2 text-xs text-silver"
          >
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            {SECTIONS.find((s) => s.id === active)?.label ?? "البداية"}
          </button>
        )}
      </div>
    </nav>
  );
}
