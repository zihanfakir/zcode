import { PROFILE } from "@/data/profile";
import { ScrambleText } from "@/components/motion/ScrambleText";
import { Footer } from "@/components/footer/Footer";
import { ArrowDown, GraduationCap, Briefcase, Terminal } from "lucide-react";

export default function AboutPage() {
  const { about, career, hero } = PROFILE;

  return (
    <main className="min-h-screen bg-black text-white pt-28 sm:pt-36">
      {/* Container */}
      <div className="max-w-5xl mx-auto px-6 sm:px-12">
        {/* Top Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-zinc-900 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-zinc-300">Open for opportunities</span>
          </div>
          <div>{hero.hud.locationLabel}</div>
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-400">
            <span>Scroll</span>
            <ArrowDown className="w-3 h-3 animate-bounce" />
          </div>
        </div>

        {/* Hero Narrative Heading */}
        <section className="py-16 sm:py-24">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-mono font-bold uppercase tracking-tight leading-[1.05]">
            <span className="block text-zinc-200">
              <ScrambleText entrance="observer">A full-stack dev</ScrambleText>
            </span>
            <span className="block mt-2">
              <span>fueled by </span>
              <span className="text-blue-400 glow-text-blue">code</span>
              <span className="text-zinc-500"> & </span>
              <span className="text-emerald-400">craft</span>
            </span>
          </h1>

          <p className="mt-8 text-base sm:text-xl text-zinc-400 leading-relaxed max-w-3xl font-sans">
            {about.bio}
          </p>
        </section>

        {/* Skills & Technologies Grid */}
        <section className="py-16 border-t border-zinc-900">
          <div className="mb-10">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-blue-400">
              <ScrambleText entrance="observer">{about.skillsEyebrow}</ScrambleText>
            </span>
            <h2 className="mt-2 text-2xl font-mono font-bold uppercase tracking-wider text-white">
              Technical Capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {about.skills.map((skillGroup, idx) => (
              <div
                key={idx}
                className="group relative p-6 rounded-xl border border-zinc-850 bg-zinc-950/60 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/40"
              >
                <div className="flex items-center gap-2 mb-4 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>{skillGroup.label}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillGroup.items.map((item, itemIdx) => (
                    <span
                      key={itemIdx}
                      className="px-3 py-1 rounded-md text-xs font-mono bg-zinc-900/90 text-zinc-300 border border-zinc-800 transition-colors group-hover:border-zinc-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Education Section */}
        <section className="py-16 border-t border-zinc-900">
          <div className="mb-10">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-blue-400">
              <ScrambleText entrance="observer">— Academic Background</ScrambleText>
            </span>
            <h2 className="mt-2 text-2xl font-mono font-bold uppercase tracking-wider text-white">
              Education & Studies
            </h2>
          </div>

          <div className="space-y-6">
            {about.education.map((edu, idx) => (
              <div
                key={idx}
                className="p-6 sm:p-8 rounded-xl border border-zinc-850 bg-zinc-950/60 backdrop-blur-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-blue-400 shrink-0" />
                    <h3 className="text-lg sm:text-xl font-mono font-semibold text-white">
                      {edu.degree}
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
                    {edu.period}
                  </span>
                </div>
                <div className="mt-2 font-mono text-xs text-zinc-400 uppercase tracking-wider">
                  {edu.institution}
                </div>
                <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                  {edu.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Career Timeline Section (#career) */}
        <section id="career" className="py-20 border-t border-zinc-900 scroll-mt-24">
          <div className="mb-14">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-blue-400">
              <ScrambleText entrance="observer">{career.eyebrow}</ScrambleText>
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-mono font-bold uppercase tracking-wider text-white">
              Experience & Trajectory
            </h2>
          </div>

          {/* Living Circuit Timeline Container */}
          <div className="relative pl-6 sm:pl-10 space-y-12 before:absolute before:top-2 before:bottom-2 before:left-[11px] sm:before:left-[15px] before:w-[2px] before:bg-gradient-to-b before:from-blue-500 before:via-emerald-500/50 before:to-zinc-800">
            {career.items.map((job, idx) => (
              <div key={idx} className="relative group">
                {/* Circuit Node Indicator */}
                <div className="absolute -left-[30px] sm:-left-[35px] top-1.5 w-3 h-3 rounded-full border-2 border-blue-400 bg-black transition-all duration-300 group-hover:scale-125 group-hover:border-emerald-400 group-hover:bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />

                <div className="p-6 sm:p-8 rounded-xl border border-zinc-850 bg-zinc-950/60 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/40">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2 font-mono text-lg font-bold text-white">
                      <Briefcase className="w-4 h-4 text-zinc-400" />
                      <span>{job.title}</span>
                    </div>
                    <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">
                      {job.period}
                    </span>
                  </div>

                  <div className="mt-1 font-mono text-xs text-blue-400 font-medium">
                    @{job.company}
                  </div>

                  <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                    {job.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Shared Footer & Contact */}
      <Footer />
    </main>
  );
}
