import { useMemo, useState } from "react"
import { COUNTRIES } from "@/data/countries"
import { CONTINENTS, FRAMES, type Frame } from "@/data/continentFrames"
import { ContinentMap } from "@/components/ContinentMap"
import { prepareShapes } from "@/game/sphere"
import { useGeometries } from "@/game/useGeometries"

const VISITED = new Set([
  "ES", "FR", "IT", "PT", "DE", "GR", "NL",
  "JP", "TH", "IN", "TR",
  "EG", "MA",
  "MX", "AR", "US", "CU", "PE",
  "AU", "NZ",
])

const MEMBERSHIP: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c.continent]),
)

type Key = keyof Frame

const CONTROLS: {
  key: Key
  label: string
  step: number
  min: number
  max: number
}[] = [
  { key: "lon", label: "Centro (longitud)", step: 5, min: -180, max: 180 },
  { key: "half", label: "Mitad del ancho", step: 5, min: 5, max: 175 },
  { key: "latMin", label: "Límite sur (latitud)", step: 2, min: -80, max: 80 },
  { key: "latMax", label: "Límite norte (latitud)", step: 2, min: -80, max: 80 },
]

const btn = "h-9 w-9 rounded-lg border text-lg active:bg-neutral-100"

export default function ContinentLab() {
  const geometries = useGeometries()
  const shapes = useMemo(
    () => (geometries ? prepareShapes(geometries) : []),
    [geometries],
  )
  const [frames, setFrames] = useState<Record<string, Frame>>(FRAMES)
  const [current, setCurrent] = useState<string>(CONTINENTS[0])

  function change(key: Key, delta: number, min: number, max: number) {
    setFrames((all) => {
      const f = all[current]
      const value = Math.min(max, Math.max(min, f[key] + delta))
      const next: Frame = { ...f, [key]: value }
      if (next.latMax - next.latMin < 4) return all
      return { ...all, [current]: next }
    })
  }

  const text = `export const FRAMES: Record<string, Frame> = {\n${CONTINENTS.map(
    (c) => {
      const f = frames[c]
      return `  "${c}": { lon: ${f.lon}, half: ${f.half}, latMin: ${f.latMin}, latMax: ${f.latMax} },`
    },
  ).join("\n")}\n}`

  if (geometries === null) return <p className="p-4">Cargando…</p>

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Encuadre de continentes</h1>

      <div className="flex flex-wrap gap-2">
        {CONTINENTS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCurrent(c)}
            className={`h-9 rounded-full border px-4 text-sm ${
              c === current ? "bg-neutral-900 text-white" : "active:bg-neutral-100"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <ContinentMap
        shapes={shapes}
        membership={MEMBERSHIP}
        continent={current}
        frame={frames[current]}
        visited={VISITED}
        className="aspect-[5/3] w-full rounded-lg border"
      />

      <div className="flex flex-col gap-2">
        {CONTROLS.map(({ key, label, step, min, max }) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span className="flex-1">{label}</span>
            <button
              type="button"
              className={btn}
              onClick={() => change(key, -step, min, max)}
            >
              −
            </button>
            <span className="w-12 text-center tabular-nums">
              {frames[current][key]}
            </span>
            <button
              type="button"
              className={btn}
              onClick={() => change(key, step, min, max)}
            >
              +
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {CONTINENTS.map((c) => (
          <figure key={c} className="flex flex-col items-center gap-1">
            <ContinentMap
              shapes={shapes}
              membership={MEMBERSHIP}
              continent={c}
              frame={frames[c]}
              visited={VISITED}
              variant="thumb"
              className="h-24 w-24 rounded-lg border"
            />
            <figcaption className="text-xs">{c}</figcaption>
          </figure>
        ))}
      </div>

      <textarea
        readOnly
        rows={8}
        value={text}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full rounded-lg border p-2 font-mono text-xs"
      />
    </main>
  )
}