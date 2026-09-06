import { PROFILE } from "@/data/profile";
import { PROJECTS } from "@/data/projects";
import { ACHIEVEMENTS } from "@/data/achievements";
import { ScrambleText } from "@/components/motion/ScrambleText";
import { LiquidButton } from "@/components/motion/LiquidButton";
import { LiveStatus } from "@/components/hud/Hud";
import { RobotCanvas } from "@/components/3d/RobotCanvas";
import { Footer } from "@/components/footer/Footer";
import {
  ArrowDown,
  GraduationCap,
  Briefcase,
  Terminal,
  ExternalLink,
  Github,
  ArrowUpRight,
  Trophy,
  Award,
  BookOpen,
  Users,
} from "lucide-react";

export default function HomePage() {
  const { hero, about, career } = PROFILE;

  return (
    <main className="relative flex min-h-screen flex-col bg-black">
      {/* HUD technical crosshairs & frame lines */}
      <div className="pointer-events-none absolute inset-0 z-20 h-screen overflow-hidden">
        <div className="absolute top-20 left-6 font-mono text-[0.5625rem] tracking-[0.25em] text-zinc-600 hidden sm:block">
          SYS.LOC // 23.8103° N, 90.4125° E
        </div>
        <div className="absolute top-20 right-6 font-mono text-[0.5625rem] tracking-[0.25em] text-zinc-600 hidden sm:block">
          SYS.STATUS // ONLINE [R_T_FIBER]
        </div>

        <div className="absolute top-24 left-10 w-3 h-3 border-t border-l border-zinc-700/60 hidden lg:block" />
        <div className="absolute top-24 right-10 w-3 h-3 border-t border-r border-zinc-700/60 hidden lg:block" />
        <div className="absolute bottom-24 left-10 w-3 h-3 border-b border-l border-zinc-700/60 hidden lg:block" />
        <div className="absolute bottom-24 right-10 w-3 h-3 border-b border-r border-zinc-700/60 hidden lg:block" />
      </div>

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* 3D WebGL Robot Centerpiece */}
        <div aria-hidden="true" className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="relative aspect-square w-[100vmin] lg:aspect-auto lg:h-full lg:w-full">
            <RobotCanvas />
          </div>
        </div>

        {/* Top-Left / Middle-Left HUD status */}
        <div className="absolute left-6 top-[calc(env(safe-area-inset-top)+6.5rem)] z-10 max-w-[calc(100%-3rem)] sm:left-10 sm:top-1/2 sm:max-w-none sm:-translate-y-1/2">
          <LiveStatus
            statusWords={hero.hud.statusWords}
            locationLabel={hero.hud.locationLabel}
            timeZone={hero.hud.timeZone}
          />
        </div>

        {/* Right HUD tagline */}
        <div className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 text-right font-mono text-[0.6875rem] uppercase leading-relaxed tracking-[0.2em] text-zinc-500 sm:right-10 sm:block">
          <span className="block text-zinc-300 font-semibold">{hero.tagline.primary}</span>
          <span className="block text-zinc-500">{hero.tagline.secondary}</span>
          <span className="block text-[0.5625rem] text-zinc-600 mt-2">
            CODING SINCE {hero.hud.codingSinceYear}
          </span>
        </div>

        {/* Bottom-Left Name & Title with Text Scramble */}
        <div className="absolute bottom-32 left-6 z-10 text-left sm:bottom-12 sm:left-10 pointer-events-auto">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-blue-400">
            <ScrambleText entrance="auto">{hero.eyebrow}</ScrambleText>
          </p>
          <h1 className="mt-3 font-mono font-extrabold text-5xl uppercase leading-[0.92] tracking-[0.02em] text-white sm:text-7xl lg:text-8xl">
            <ScrambleText className="block tracking-tighter" entrance="auto">
              Zihan
            </ScrambleText>
            <ScrambleText className="block tracking-tighter" entrance="auto">
              Fakir
            </ScrambleText>
          </h1>
        </div>

        {/* Bottom-Right Liquid Button: Get in touch */}
        <div className="absolute bottom-12 left-6 z-10 sm:left-auto sm:right-10 pointer-events-auto flex items-center gap-4">
          <LiquidButton href="#about" aria-label={hero.ctaLabel}>
            {hero.ctaLabel}
          </LiquidButton>
        </div>

        {/* Scroll down indicator */}
        <a
          href="#about"
          aria-label="Scroll down"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
        >
          <span>Scroll</span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce text-blue-400" />
        </a>
      </section>

      {/* ===================== ABOUT & SKILLS SECTION ===================== */}
      <section id="about" className="relative z-10 border-t border-zinc-900 bg-black pt-28 pb-20 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6 sm:px-12">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-zinc-900 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-zinc-500">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-zinc-300">Open for opportunities</span>
            </div>
            <div>{hero.hud.locationLabel}</div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span>Section 01 // Overview</span>
            </div>
          </div>

          {/* Headline */}
          <div className="py-16 sm:py-20">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-mono font-bold uppercase tracking-tight leading-[1.05]">
              <span className="block text-zinc-200">
                <ScrambleText entrance="observer">A full-stack dev</ScrambleText>
              </span>
              <span className="block mt-2">
                <span>fueled by </span>
                <span className="text-blue-400 glow-text-blue">code</span>
                <span className="text-zinc-500"> & </span>
                <span className="text-emerald-400">craft</span>
              </span>
            </h2>

            <p className="mt-8 text-base sm:text-xl text-zinc-400 leading-relaxed max-w-3xl font-sans">
              {about.bio}
            </p>
          </div>

          {/* Skills Grid */}
          <div className="pt-8 pb-16 border-t border-zinc-900">
            <div className="mb-10">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-blue-400">
                <ScrambleText entrance="observer">{about.skillsEyebrow}</ScrambleText>
              </span>
              <h3 className="mt-2 text-2xl font-mono font-bold uppercase tracking-wider text-white">
                Technical Capabilities
              </h3>
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
          </div>

          {/* Education */}
          <div className="pt-12 pb-16 border-t border-zinc-900">
            <div className="mb-10">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-blue-400">
                <ScrambleText entrance="observer">— Academic Background</ScrambleText>
              </span>
              <h3 className="mt-2 text-2xl font-mono font-bold uppercase tracking-wider text-white">
                Education & Studies
              </h3>
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
                      <h4 className="text-lg sm:text-xl font-mono font-semibold text-white">
                        {edu.degree}
                      </h4>
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
          </div>
        </div>
      </section>

      {/* ===================== PROJECTS SECTION ===================== */}
      <section id="projects" className="relative z-10 border-t border-zinc-900 bg-black pt-28 pb-20 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-12">
          <div className="mb-16">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-blue-400">
              <ScrambleText entrance="observer">/ Selected Work</ScrambleText>
            </span>
            <h2 className="mt-3 text-4xl sm:text-6xl font-mono font-bold uppercase tracking-tight text-white">
              Projects
            </h2>
            <p className="mt-4 font-mono text-sm text-zinc-500 uppercase tracking-widest">
              — Systems, software architecture & interactive applications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PROJECTS.map((proj) => (
              <article
                key={proj.num}
                className="group relative flex flex-col justify-between p-8 rounded-2xl border border-zinc-850 bg-zinc-950/70 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/40"
              >
                <div>
                  <div className="flex items-center justify-between pb-6 border-b border-zinc-900">
                    <span
                      className="font-mono text-xs font-bold px-2.5 py-1 rounded"
                      style={{
                        color: proj.accent,
                        backgroundColor: `${proj.accent}15`,
                      }}
                    >
                      {proj.num}
                    </span>
                    <span className="font-mono text-xs text-zinc-500 tracking-wider">
                      {proj.year}
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-mono font-bold text-white group-hover:text-blue-400 transition-colors flex items-center justify-between">
                    <span>{proj.name}</span>
                    <ArrowUpRight className="w-5 h-5 text-zinc-600 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-blue-400" />
                  </h3>

                  <div className="mt-1 font-mono text-xs text-zinc-500 uppercase tracking-wider">
                    {proj.role}
                  </div>

                  <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                    {proj.description}
                  </p>
                </div>

                <div className="pt-8 mt-8 border-t border-zinc-900/80">
                  <div className="flex flex-wrap gap-2 mb-6">
                    {proj.stack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded text-[0.6875rem] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl.startsWith("http") ? proj.liveUrl : `https://${proj.liveUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.15em] text-white hover:text-blue-400 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Site</span>
                      </a>
                    )}

                    {proj.repo && (
                      <a
                        href={proj.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.15em] text-zinc-400 hover:text-white transition-colors"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Source Code</span>
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CAREER SECTION ===================== */}
      <section id="career" className="relative z-10 border-t border-zinc-900 bg-black pt-28 pb-20 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6 sm:px-12">
          <div className="mb-14">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-blue-400">
              <ScrambleText entrance="observer">{career.eyebrow}</ScrambleText>
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-mono font-bold uppercase tracking-wider text-white">
              Experience & Trajectory
            </h2>
          </div>

          <div className="relative pl-6 sm:pl-10 space-y-12 before:absolute before:top-2 before:bottom-2 before:left-[11px] sm:before:left-[15px] before:w-[2px] before:bg-gradient-to-b before:from-blue-500 before:via-emerald-500/50 before:to-zinc-800">
            {career.items.map((job, idx) => (
              <div key={idx} className="relative group">
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
        </div>
      </section>

      {/* ===================== ACHIEVEMENTS SECTION ===================== */}
      <section id="achievements" className="relative z-10 border-t border-zinc-900 bg-black pt-28 pb-20 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-12">
          <div className="mb-12">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-blue-400">
              <ScrambleText entrance="observer">/ Credentials</ScrambleText>
            </span>
            <h2 className="mt-3 text-4xl sm:text-5xl font-mono font-bold uppercase tracking-tight text-white">
              Achievements
            </h2>
            <p className="mt-4 font-mono text-sm text-zinc-500 uppercase tracking-widest">
              — Certificates, hackathons & community milestones
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ACHIEVEMENTS.map((item) => (
              <article
                key={item.id + item.title}
                className="group flex flex-col justify-between p-6 rounded-xl border border-zinc-850 bg-zinc-950/70 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/40"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-900 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      {item.category === "Hackathons" && <Trophy className="w-4 h-4 text-amber-400" />}
                      {item.category === "Courses" && <Award className="w-4 h-4 text-blue-400" />}
                      {item.category === "Research" && <BookOpen className="w-4 h-4 text-emerald-400" />}
                      {item.category === "Volunteering" && <Users className="w-4 h-4 text-purple-400" />}
                      <span className="text-zinc-400 uppercase tracking-wider">{item.category}</span>
                    </div>
                    <span className="text-zinc-500">{item.year}</span>
                  </div>

                  <h3 className="mt-4 font-mono text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>

                  <div className="mt-1 font-mono text-xs text-blue-400/80">
                    {item.issuer}
                  </div>

                  {item.description && (
                    <p className="mt-3 text-xs text-zinc-400 leading-relaxed font-sans">
                      {item.description}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FOOTER & CONTACT ===================== */}
      <Footer />
    </main>
  );
}
