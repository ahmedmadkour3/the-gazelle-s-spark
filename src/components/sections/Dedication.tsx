import { portraitMessage } from "@/lib/media";
import { PortraitSlot } from "./TeacherReveal";

type Block = { text: string; emphasis?: boolean; strong?: boolean };

const BLOCKS: Block[] = [
  { text: "يا مستر عمرو ❤️🦌", emphasis: true },
  {
    text: "بجد مهما حاولنا نوصفلك قد إيه إحنا مقدرين تعبك معانا، مش هنقدر نوفيك حقك.",
  },
  {
    text: "إنت مش مجرد مدرس كيمياء بنحضر عنده درس ونمشي، إنت اخ كبير لينا وحاسس بينا وبضغطنا وخوفنا من السنة دي، ودايمًا بتحاول تطلع مننا أحسن نسخة حتى في أصعب الأوقات.",
    emphasis: true,
  },
  {
    text: "حابين نشكرك من قلبنا على كل اللي بتعمله عشانا، وعلى إحساسك بينا وبالضغط والتعب اللي بنمر بيه إحنا وأهلنا، وعلى خوفك الدائم إننا نوصل للي نفسنا فيه ونحقق أحلامنا.",
  },
  {
    text: "وإن شاء الله تعبك معانا مش هيروح هدر، وهتلاقينا عند حسن ظنك. هنشد حيلنا ونبذل كل اللي نقدر عليه، وإن شاء الله نعدّي تالتة ثانوي سوا، خطوة بخطوة، ونفرح كلنا في آخر السنة بالنتيجة اللي نستحقها.",
    emphasis: true,
  },
  {
    text: "ربنا يباركلك في تعبك ومجهودك معانا، ويجعل السنة دي سنة خير ونجاح علينا كلنا، ويقدرنا نرد جزء بسيط من تعبك معانا بالنجاح والفرحة اللي نفسك تشوفها فينا.",
  },
  {
    text: "شكرًا على كل مرة شرحتلنا فيها لحد ما نفهم، وعلى كل مرة طمنتنا لما كنا قلقانين، وعلى صبرك ومجهودك واهتمامك بينا.",
  },
  {
    text: "يمكن إحنا ساعات منعرفش نعبر عن ده، ويمكن هزارنا يخليك تحس إننا مش مقدرين 😂، لكن الحقيقة إن جوا كل واحد فينا تقدير كبير ليك، وإن شاء الله تعبك معانا عمره ما يضيع.",
  },
  {
    text: "وإحنا داخلين على سنة مهمة، نفسنا نعديها سوا ونفرح بالنتيجة اللي تليق بكل التعب اللي بذلته معانا.",
  },
  {
    text: "وإن شاء الله في آخر السنة نفتكر كل لحظة تعبنا فيها ونقول: الحمد لله إن الغزال كان معانا في الرحلة دي. 🦌❤️",
    emphasis: true,
  },
  { text: "شكرًا يا مستر عمرو....." },
  {
    text: "شكرًا لأنك كنت دايمًا بتحاول، وبتتعب، وبتخاف على مصلحتنا كأن نجاحنا جزء من نجاحك.",
  },
  {
    text: "شكرًا يا مستر على إنك مؤمن بينا وخايف على مستقبلنا… وإن شاء الله نكون قد الثقة، ونوصل سوا لآخر الطريق ❤️🙏",
  },
  { text: "من طلابك اللي بجد بيحبوك😍❤️" },
  { text: "شكرا يا غزال ❤️🦌", strong: true },
];

export function Dedication() {
  return (
    <section
      id="message"
      className="relative mx-auto max-w-2xl px-5 py-24"
      aria-labelledby="msg-title"
    >
      <p className="label-mono reveal">الرسالة</p>
      <h2 id="msg-title" className="reveal mt-3 text-2xl sm:text-3xl">
        رسالة مننا للغزال ❤️
      </h2>

      <figure className="reveal-scale mt-10 overflow-hidden rounded-[1.5rem] border border-border shadow-[var(--shadow-deep)]">
        <div className="relative aspect-[4/3] w-full">
          {portraitMessage ? (
            <img
              src={portraitMessage}
              alt="مستر عمرو جمال مع طلابه"
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <PortraitSlot n={2} />
          )}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, oklch(0.13 0.012 250 / .9), transparent 60%)",
            }}
          />
        </div>
      </figure>

      <div className="mt-12 space-y-8">
        {BLOCKS.map((b, i) => (
          <p
            key={i}
            data-delay={i % 3 === 0 ? 0 : 80}
            className={
              b.strong
                ? "reveal-scale text-cyan-grad py-6 text-center font-display text-3xl font-black sm:text-4xl"
                : b.emphasis
                  ? "reveal border-s-2 border-primary/50 ps-4 font-display text-lg font-semibold leading-loose text-silver sm:text-xl"
                  : "reveal text-[1.02rem] leading-loose text-muted-foreground"
            }
          >
            {b.text}
          </p>
        ))}
      </div>
    </section>
  );
}
