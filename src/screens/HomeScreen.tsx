import { Settings, Trophy } from "lucide-react"
import { Globe } from "@/components/Globe"

const TEXT = {
    tagline: "EXPLORA · JUEGA",
    title: "Country",
    subtitle: "game",
    question: "¿Cuánto sabes del mundo?",
    play: "Jugar",
    footer: "¿Listo para una nueva aventura?",
}

const display = { fontFamily: "'Fredoka Variable', system-ui, sans-serif" }

const iconBtn =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sky-100 active:bg-white/10"

function Sparkle({ className }: { className: string }) {
    return (
        <svg
            className={`home-twinkle absolute h-4 w-4 text-sky-200 ${className}`}
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M8 0 9.6 6.4 16 8 9.6 9.6 8 16 6.4 9.6 0 8 6.4 6.4Z" />
        </svg>
    )
}

function Cloud({ className }: { className: string }) {
    return (
        <svg
            className={`home-drift absolute ${className}`}
            viewBox="0 0 64 36"
            fill="white"
            aria-hidden="true"
        >
            <circle cx="16" cy="22" r="10" />
            <circle cx="32" cy="15" r="13" />
            <circle cx="49" cy="22" r="10" />
            <rect x="10" y="20" width="44" height="12" rx="6" />
        </svg>
    )
}

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
            className="relative flex min-h-dvh flex-col items-center overflow-hidden px-6 pt-[calc(env(safe-area-inset-top)_+_1rem)] pb-[calc(env(safe-area-inset-bottom)_+_1rem)] text-white select-none"
            style={{
                background:
                    "radial-gradient(120% 60% at 0% 30%, rgba(30,160,170,0.35), transparent 60%), radial-gradient(100% 70% at 100% 100%, rgba(70,60,200,0.45), transparent 60%), linear-gradient(180deg, #122c66 0%, #0e2250 55%, #151f5c 100%)",
            }}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                    backgroundSize: "36px 36px",
                }}
            />
            <Sparkle className="left-[14%] top-[22%]" />
            <Sparkle className="right-[12%] top-[34%]" />
            <Sparkle className="bottom-[28%] left-[9%]" />

            <div className="relative z-10 flex w-full max-w-md flex-1 flex-col items-center">
                <p className="text-[11px] font-semibold tracking-[0.3em] text-sky-300/70">
                    {TEXT.tagline}
                </p>

                <h1
                    style={display}
                    className="mt-2 text-center leading-[0.9] drop-shadow-[0_4px_0_rgba(8,20,60,0.55)]"
                >
                    <span className="block text-6xl font-bold text-white">{TEXT.title}</span>
                    <span className="block text-5xl font-bold text-[#7ee8b4]">
                        {TEXT.subtitle}
                    </span>
                </h1>

                <p className="mt-3 text-center text-sm font-semibold text-sky-200/60">
                    {TEXT.question}
                </p>

                <div className="flex flex-1 items-center justify-center py-6">
                    <div className="home-float relative aspect-square w-[min(70vw,300px)]">
                        <Globe />
                        <Cloud className="-left-6 top-[48%] w-20" />
                        <Cloud className="-right-1 bottom-[16%] w-14" />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onPlay}
                    style={{
                        ...display,
                        backgroundImage: "linear-gradient(180deg, #a6f3cf, #55d4b2)",
                    }}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-lg font-semibold text-[#0e2a4a] shadow-[0_6px_0_#2a9d84,0_12px_24px_rgba(0,0,0,0.3)] transition-transform active:translate-y-1 active:shadow-[0_2px_0_#2a9d84]"
                >
                    {TEXT.play}
                    <svg className="h-3 w-3" viewBox="0 0 10 12" fill="currentColor" aria-hidden="true">
                        <path d="M0 0 10 6 0 12Z" />
                    </svg>
                </button>

                <div className="mt-4 flex w-full items-center justify-between gap-3">
                    <button type="button" aria-label="Progreso" onClick={onProgress} className={iconBtn}>
                        <Trophy className="h-5 w-5" />
                    </button>
                    <p className="text-center text-xs text-sky-200/60">{TEXT.footer}</p>
                    <button type="button" aria-label="Ajustes" onClick={onSettings} className={iconBtn}>
                        <Settings className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </main>
    )
}