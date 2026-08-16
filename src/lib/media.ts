/**
 * MEDIA SLOTS — put the real assets here.
 *
 * 1) Drop the files in `src/assets/` (portraits + screenshots) and
 *    `public/media/` (videos), then fill the entries below.
 * 2) Portraits / screenshots: `import p1 from "@/assets/amr-1.jpg"` and use it.
 * Every section degrades gracefully while a slot is empty.
 */

export type Shot = { src: string; alt: string };

/** First portrait — used in the cinematic teacher reveal. */
export const portraitHero: string | null = null;

/** Second portrait — used in the dedication section. */
export const portraitMessage: string | null = null;

/** Current-cohort student feedback screenshots (inside the chemical vault). */
export const studentShots: Shot[] = [];

/** Previous-cohort testimonial videos. */
export const testimonialVideos: {
  src: string | null;
  ratio: "9/16" | "1/1";
  label: string;
}[] = [
  { src: null, ratio: "9/16", label: "شهادة طالب — الدفعة اللي قبلنا" },
  { src: null, ratio: "1/1", label: "شهادة طالب — الدفعة اللي قبلنا" },
];
