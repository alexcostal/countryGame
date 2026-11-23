import { useMemo, useState } from "react"
import { ChevronRight, Plus, X } from "lucide-react"
import { COUNTRIES } from "@/data/countries"
import { CONTINENTS, FRAMES } from "@/data/continentFrames"
import { ContinentMap } from "@/components/ContinentMap"
import { InteractiveContinentMap } from "@/components/InteractiveContinentMap"
import { normalize } from "@/game/geo"
import type { Geometry } from "@/game/shapes"
import { prepareShapes } from "@/game/sphere"
import { loadTrips, saveTrips } from "@/game/trips"
import type { Country } from "@/game/types"

const MEMBERSHIP: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c.continent]),
)
const NAMES: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c.name]),
)

const BY_CONTINENT: Record<string, Country[]> = {}
for (const c of COUNTRIES) (BY_CONTINENT[c.continent] ??= []).push(c)
for (const list of Object.values(BY_CONTINENT)) {
  list.sort((a, b) => a.name.localeCompare(b.name, "es"))
}

function Ring({ pct }: { pct: number }) {
  const r = 36
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-[84px] w-[84px] shrink-0">
      <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="8"
        />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke="#7ee8b4"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          transform="rotate(-90 42 42)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold leading-none">{pct}%</span>
        <span className="mt-0.5 text-[10px] text-white/60">visitado</span>
      </div>
    </div>
  )
}

export function TripsPanel({
  geometries,
}: {
  geometries: Record<string, Geometry>
}) {
  const shapes = useMemo(() => prepareShapes(geometries), [geometries])
  const [visitedList, setVisitedList] = useState<string[]>(loadTrips)
  const visited = useMemo(() => new Set(visitedList), [visitedList])
  const [open, setOpen] = useState<string | null>(CONTINENTS[0])
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState("")

  function update(next: string[]) {
    setVisitedList(next)
    saveTrips(next)
  }

  function add(code: string) {
    if (!visited.has(code)) update([...visitedList, code])
  }

  function remove(code: string) {
    update(visitedList.filter((c) => c !== code))
  }

  function flip(code: string) {
    if (visited.has(code)) remove(code)
    else add(code)
  }

  function toggle(name: string) {
    setOpen(open === name ? null : name)
    setAdding(false)
    setQuery("")
  }

  const stats = CONTINENTS.map((name) => {
    const all = BY_CONTINENT[name] ?? []
    const seen = all.filter((c) => visited.has(c.code))
    const pct = all.length ? Math.round((seen.length / all.length) * 100) : 0
    return { name, all, seen, pct }
  })
  const total = COUNTRIES.length
  const totalSeen = stats.reduce((s, c) => s + c.seen.length, 0)
  const totalPct = total ? Math.round((totalSeen / total) * 100) : 0

  return (
    <div className="flex flex-col gap-2 pb-2">
      <div className="px-1 pb-1">
        <p className="text-xl font-semibold">
          {totalSeen} de {total}
        </p>
        <p className="text-sm text-white/60">
          países visitados · {totalPct}% del mundo
        </p>
      </div>

      {stats.map(({ name, all, seen, pct }) => {
        const isOpen = open === name
        const q = normalize(query)
        const candidates =
          isOpen && adding
            ? all.filter(
                (c) =>
                  !visited.has(c.code) && (!q || normalize(c.name).includes(q)),
              )
            : []

        return (
          <section
            key={name}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            <button
              type="button"
              onClick={() => toggle(name)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 p-3 text-left"
            >
              <ContinentMap
                shapes={shapes}
                membership={MEMBERSHIP}
                continent={name}
                frame={FRAMES[name]}
                visited={visited}
                variant="thumb"
                className="h-12 w-12 shrink-0 rounded-lg"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{name}</span>
                <span className="block text-xs text-white/60">
                  {seen.length} de {all.length}
                </span>
                <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/15">
                  <span
                    className="block h-full rounded-full bg-[#7ee8b4]"
                    style={{ width: `${pct}%` }}
                  />
                </span>
              </span>
              <ChevronRight
                className={`h-4 w-4 shrink-0 transition-transform ${
                  isOpen ? "rotate-90" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-3 pb-3">
                <InteractiveContinentMap
                  shapes={shapes}
                  membership={MEMBERSHIP}
                  continent={name}
                  frame={FRAMES[name]}
                  visited={visited}
                  names={NAMES}
                  onToggle={flip}
                />
                <p className="mt-2 text-xs text-white/50">
                  Toca un país para marcarlo o quitarlo. Mantén el dedo para ver
                  su nombre.
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    {seen.length === 0 ? (
                      <p className="text-sm text-white/60">
                        Aún no has marcado ningún país.
                      </p>
                    ) : (
                      <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto text-sm">
                        {seen.map((c) => (
                          <li key={c.code} className="flex items-center gap-2">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#7ee8b4]" />
                            <span className="flex-1 truncate">{c.name}</span>
                            <button
                              type="button"
                              aria-label={`Quitar ${c.name}`}
                              onClick={() => remove(c.code)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 active:bg-white/10"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Ring pct={pct} />
                </div>

                {!adding ? (
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/20 text-sm font-medium active:bg-white/10"
                  >
                    <Plus className="h-4 w-4" />
                    Añadir por nombre
                  </button>
                ) : (
                  <div className="mt-3 rounded-xl border border-white/15 bg-black/20 p-2">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={`Buscar en ${name}…`}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      className="h-11 w-full rounded-lg bg-white/10 px-3 text-base text-white outline-none placeholder:text-white/40"
                    />
                    <ul className="mt-2 flex max-h-56 flex-col gap-1 overflow-y-auto">
                      {candidates.length === 0 && (
                        <li className="px-2 py-2 text-sm text-white/50">
                          {q ? "Ningún país con ese nombre." : "No quedan países."}
                        </li>
                      )}
                      {candidates.map((c) => (
                        <li key={c.code}>
                          <button
                            type="button"
                            onClick={() => add(c.code)}
                            className="w-full rounded-lg px-3 py-3 text-left text-base active:bg-white/10"
                          >
                            {c.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => {
                        setAdding(false)
                        setQuery("")
                      }}
                      className="mt-2 h-10 w-full rounded-lg text-sm text-white/70 active:bg-white/10"
                    >
                      Cerrar
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}