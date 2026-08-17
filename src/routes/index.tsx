import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CinematicIntro } from "@/components/intro/CinematicIntro";
import { AmbientParticles } from "@/components/AmbientParticles";
import { SectionNav } from "@/components/SectionNav";
import { SoundToggle } from "@/components/SoundToggle";
import { EquationSection } from "@/components/sections/EquationSection";
import { TeacherReveal } from "@/components/sections/TeacherReveal";
import { Dedication } from "@/components/sections/Dedication";
import { StudentVault } from "@/components/sections/StudentVault";
import { PrevCohortVideos } from "@/components/sections/PrevCohortVideos";
import { ChemFun } from "@/components/sections/ChemFun";
import { Ending } from "@/components/sections/Ending";
import { useReveal } from "@/hooks/useReveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "الغزال 🦌 — إهداء لمستر عمرو جمال | بتاع كيميا ⚗️" },
      {
        name: "description",
        content:
          "تجربة تفاعلية سينمائية من تفاعل كيميائي لغزال… إهداء من طلاب مستر عمرو جمال، الغزال بتاع كيميا.",
      },
      {
        property: "og:title",
        content: "الغزال 🦌 — إهداء لمستر عمرو جمال",
      },
      {
        property: "og:description",
        content:
          "كيمياء ⚗️ + رشاقة 🦌 + سرعة ⚡ = الغزال. رسالة شكر من طلابه.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [intro, setIntro] = useState(true);
  useReveal();

  useEffect(() => {
    // Respect users returning within the same session.
    if (sessionStorage.getItem("ghazal-intro-seen") === "1") setIntro(false);
  }, []);

  const done = () => {
    sessionStorage.setItem("ghazal-intro-seen", "1");
    setIntro(false);
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <AmbientParticles />
      {intro && <CinematicIntro onDone={done} />}

      <main className="relative overflow-x-hidden">
        <div
          className="fixed z-30"
          style={{
            top: "max(1rem, env(safe-area-inset-top))",
            left: "1rem",
          }}
        >
          <SoundToggle />
        </div>

        <EquationSection />
        <TeacherReveal />

        <Dedication />
        <StudentVault />
        <PrevCohortVideos />
        <ChemFun />
        <Ending />
        <div className="h-24" aria-hidden />
      </main>

      {!intro && <SectionNav />}
    </>
  );
}
