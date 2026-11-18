import { ArrowRight, Settings, Trophy } from "lucide-react"
import { COUNTRIES } from "@/data/countries"
import { Globe } from "@/components/Globe"

const TEXT = {
  tagline: "JUEGO DE GEOGRAFÍA",
  title: "Country",
  subtitle: "game",
  question: "¿Cuánto sabes del mundo?",
  play: "Comenzar partida",
  trophies: "Trofeos",
  settings: "Configuración",
}

const secondary =
  "flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white/70 text-sm font-medium text-neutral-800 active:bg-neutral-100"

export default function HomeScreen({
  onPlay,
  onSettings,
  onProgress,
}: {
  onPlay: () => void
  onSettings: () => void
  onProgress: () => void
}) {
  return (
    <main
      className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-[#fafaf8] px-6 pt-[calc(env(safe-area-inset-top)_+_1.25rem)] pb-[calc(env(safe-area-inset-bottom)_+_1rem)] text-neutral-900 select-none"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.045) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
      }}
    >
      <div className="flex w-full max-w-md flex-1 flex-col items-center">
        <p className="text-[11px] font-medium tracking-[0.25em] text-neutral-500">
          {TEXT.tagline}
        </p>

        <h1 className="mt-3 text-center text-6xl font-semibold leading-[0.95] tracking-[-0.03em]">
          <span className="block">{TEXT.title}</span>
          <span className="block text-[#009999]">{TEXT.subtitle}</span>
        </h1>

        <p className="mt-4 text-center text-sm text-neutral-500">
          {TEXT.question}
        </p>

        <div className="flex flex-1 items-center justify-center py-6">
          <div className="home-float aspect-square w-[min(66vw,280px)]">
            <Globe />
          </div>
        </div>

        <button
          type="button"
          onClick={onPlay}
          className="flex h-14 w-full items-center justify-between rounded-full bg-neutral-900 px-7 text-base font-medium text-white transition-transform active:scale-[0.98]"
        >
          {TEXT.play}
          <ArrowRight className="h-5 w-5" />
        </button>

        <div className="mt-3 flex w-full gap-3">
          <button type="button" onClick={onProgress} className={secondary}>
            <Trophy className="h-4 w-4" />
            {TEXT.trophies}
          </button>
          <button type="button" onClick={onSettings} className={secondary}>
            <Settings className="h-4 w-4" />
            {TEXT.settings}
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-neutral-400">
          {COUNTRIES.length} países · Sin límite de tiempo · Progreso local
        </p>
      </div>
    </main>
  )
}