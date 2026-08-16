import { useEffect, useState } from "react";
import { isSoundOn, onSoundChange, toggleSound } from "@/lib/sfx";

export function SoundToggle({ className = "" }: { className?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => onSoundChange(setOn), []);
  useEffect(() => setOn(isSoundOn()), []);

  return (
    <button
      type="button"
      onClick={() => toggleSound()}
      aria-label={on ? "إيقاف الصوت" : "تشغيل الصوت"}
      aria-pressed={on}
      className={`press grid size-11 place-items-center rounded-full border border-border bg-card/70 text-base backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className}`}
    >
      <span aria-hidden>{on ? "🔊" : "🔇"}</span>
    </button>
  );
}
