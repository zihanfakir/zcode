import { PROJECTS } from "@/data/projects";
import { ScrambleText } from "@/components/motion/ScrambleText";
import { Footer } from "@/components/footer/Footer";
import { ExternalLink, Github, ArrowUpRight } from "lucide-react";

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-black text-white pt-28 sm:pt-36">
      <div className="max-w-6xl mx-auto px-6 sm:px-12">
        {/* Header */}
        <div className="mb-16">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-blue-400">
            <ScrambleText entrance="observer">/ Selected Work</ScrambleText>
          </span>
          <h1 className="mt-3 text-4xl sm:text-6xl font-mono font-bold uppercase tracking-tight text-white">
            Projects
          </h1>
          <p className="mt-4 font-mono text-sm text-zinc-500 uppercase tracking-widest">
            — Systems, software architecture & interactive applications
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-24">
          {PROJECTS.map((proj) => (
            <article
              key={proj.num}
              className="group relative flex flex-col justify-between p-8 rounded-2xl border border-zinc-850 bg-zinc-950/70 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/40"
            >
              {/* Top Meta Bar */}
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

                {/* Project Title */}
                <h2 className="mt-6 text-2xl font-mono font-bold text-white group-hover:text-blue-400 transition-colors flex items-center justify-between">
                  <span>{proj.name}</span>
                  <ArrowUpRight className="w-5 h-5 text-zinc-600 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-blue-400" />
                </h2>

                <div className="mt-1 font-mono text-xs text-zinc-500 uppercase tracking-wider">
                  {proj.role}
                </div>

                <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                  {proj.description}
                </p>
              </div>

              {/* Bottom Stack & Links */}
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

      <Footer />
    </main>
  );
}
