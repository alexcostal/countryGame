import { useEffect, useState } from "react"
import { COUNTRIES } from "@/data/countries"
import { Confetti } from "@/components/Confetti"
import { SpinningGlobe } from "@/components/SpinningGlobe"
import { useGeometries } from "@/game/useGeometries"

interface Props {
  onMap: () => void
  onHome: () => void
}

const ALL = COUNTRIES.map((c) => c.code)
const DOG_MS = 3200
const DOG_SRC = `${import.meta.env.BASE_URL}perro.png`

const primary =
  "flex h-14 w-full items-center justify-center rounded-full bg-neutral-900 px-7 text-base font-medium text-white transition-transform active:scale-[0.98]"
const secondary =
  "flex h-12 w-full items-center justify-center rounded-full border border-neutral-300 bg-white/70 text-sm font-medium text-neutral-800 active:bg-neutral-100"

export default function CompleteScreen({ onMap, onHome }: Props) {
  const geometries = useGeometries()
  const ready = geometries !== null && Object.keys(geometries).length > 0

  const [stage, setStage] = useState<"dog" | "globe">(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "globe"
      : "dog",
  )
  const [dogLoaded, setDogLoaded] = useState(false)

  useEffect(() => {
    if (stage !== "dog" || !dogLoaded) return
    const id = window.setTimeout(() => setStage("globe"), DOG_MS)
    return () => window.clearTimeout(id)
  }, [stage, dogLoaded])

  return (
    <main
      className="relative flex min-h-dvh flex-col items-center gap-5 overflow-x-hidden bg-[#fafaf8] px-5 pt-[calc(env(safe-area-inset-top)_+_1.5rem)] pb-[calc(env(safe-area-inset-bottom)_+_1.5rem)] text-neutral-900 select-none"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.045) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
      }}
    >
      <Confetti count={70} />

      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-[-0.03em]">
          ¡Mundo <span className="text-[#009999]">completado</span>!
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Has acertado los {COUNTRIES.length} países y sus capitales.
        </p>
      </div>

      <div className="flex w-full flex-1 items-center justify-center">
        {stage === "dog" ? (
          <img
            src={DOG_SRC}
            alt=""
            draggable={false}
            onLoad={() => setDogLoaded(true)}
            onError={() => setStage("globe")}
            className="dog-turn pointer-events-none h-[min(46dvh,360px)] w-auto"
            style={{
              animationDuration: `${DOG_MS}ms`,
              animationPlayState: dogLoaded ? "running" : "paused",
            }}
          />
        ) : (
          <div className="reveal-in aspect-square w-[min(84vw,360px)]">
            {ready && (
              <SpinningGlobe
                geometries={geometries}
                completed={ALL}
                className="block aspect-square w-full"
              />
            )}
          </div>
        )}
      </div>

      <div
        className={`flex w-full max-w-md flex-col gap-3 ${
          stage === "dog" ? "invisible" : "reveal-in"
        }`}
      >
        <button type="button" onClick={onMap} className={primary}>
          Ver mapamundi
        </button>
        <button type="button" onClick={onHome} className={secondary}>
          Inicio
        </button>
      </div>
    </main>
  )
}