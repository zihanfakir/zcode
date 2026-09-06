"use client";

import { useState } from "react";
import { ACHIEVEMENTS } from "@/data/achievements";
import { ScrambleText } from "@/components/motion/ScrambleText";
import { Footer } from "@/components/footer/Footer";
import { Award, Trophy, BookOpen, Users, ExternalLink } from "lucide-react";

const CATEGORIES = ["All", "Hackathons", "Courses", "Research", "Volunteering"] as const;

export default function AchievementsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered = activeCategory === "All"
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter((item) => item.category === activeCategory);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Hackathons":
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case "Courses":
        return <Award className="w-4 h-4 text-blue-400" />;
      case "Research":
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case "Volunteering":
        return <Users className="w-4 h-4 text-purple-400" />;
      default:
        return <Award className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <main className="min-h-screen bg-black text-white pt-28 sm:pt-36">
      <div className="max-w-6xl mx-auto px-6 sm:px-12">
        {/* Header */}
        <div className="mb-12">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-blue-400">
            <ScrambleText entrance="observer">/ Credentials</ScrambleText>
          </span>
          <h1 className="mt-3 text-4xl sm:text-6xl font-mono font-bold uppercase tracking-tight text-white">
            Achievements
          </h1>
          <p className="mt-4 font-mono text-sm text-zinc-500 uppercase tracking-widest">
            — Certificates, research papers & community milestones
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 pb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full font-mono text-xs uppercase tracking-[0.15em] transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-white text-black font-semibold shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                  : "bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
          {filtered.map((item) => (
            <article
              key={item.id + item.title}
              className="group flex flex-col justify-between p-6 rounded-xl border border-zinc-850 bg-zinc-950/70 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/40"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-900 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(item.category)}
                    <span className="text-zinc-400 uppercase tracking-wider">{item.category}</span>
                  </div>
                  <span className="text-zinc-500">{item.year}</span>
                </div>

                <h2 className="mt-4 font-mono text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h2>

                <div className="mt-1 font-mono text-xs text-blue-400/80">
                  {item.issuer}
                </div>

                {item.description && (
                  <p className="mt-3 text-xs text-zinc-400 leading-relaxed font-sans">
                    {item.description}
                  </p>
                )}
              </div>

              {item.link && (
                <div className="pt-6 mt-4 border-t border-zinc-900/60">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                  >
                    <span>View Record</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
