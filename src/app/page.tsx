import { PROFILE } from "@/data/profile";
import { ScrambleText } from "@/components/motion/ScrambleText";
import { LiquidButton } from "@/components/motion/LiquidButton";
import { LiveStatus } from "@/components/hud/Hud";
import { RobotCanvas } from "@/components/3d/RobotCanvas";

export default function HomePage() {
  const { hero } = PROFILE;

  return (
    <main className="relative flex min-h-screen flex-col bg-black overflow-hidden select-none">
      {/* HUD technical crosshairs & frame lines */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {/* Corner coordinates */}
        <div className="absolute top-20 left-6 font-mono text-[0.5625rem] tracking-[0.25em] text-zinc-600 hidden sm:block">
          SYS.LOC // 23.8103° N, 90.4125° E
        </div>
        <div className="absolute top-20 right-6 font-mono text-[0.5625rem] tracking-[0.25em] text-zinc-600 hidden sm:block">
          SYS.STATUS // ONLINE [R_T_FIBER]
        </div>

        {/* Technical corner brackets */}
        <div className="absolute top-24 left-10 w-3 h-3 border-t border-l border-zinc-700/60 hidden lg:block" />
        <div className="absolute top-24 right-10 w-3 h-3 border-t border-r border-zinc-700/60 hidden lg:block" />
        <div className="absolute bottom-24 left-10 w-3 h-3 border-b border-l border-zinc-700/60 hidden lg:block" />
        <div className="absolute bottom-24 right-10 w-3 h-3 border-b border-r border-zinc-700/60 hidden lg:block" />
      </div>

      {/* Main Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* 3D WebGL Robot Centerpiece */}
        <div aria-hidden="true" className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="relative aspect-square w-[100vmin] lg:aspect-auto lg:h-full lg:w-full">
            <RobotCanvas />
          </div>
        </div>

        {/* Top-Left / Middle-Left HUD status: Live Time + Building Status */}
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
        <div className="absolute bottom-12 left-6 z-10 sm:left-auto sm:right-10 pointer-events-auto">
          <LiquidButton href="/about#contact" aria-label={hero.ctaLabel}>
            {hero.ctaLabel}
          </LiquidButton>
        </div>
      </section>
    </main>
  );
}
