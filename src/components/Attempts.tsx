import type { CountryGuess } from "@/game/types"
import { DirectionArrow } from "@/components/DirectionArrow"
import { DogRow } from "@/components/DogRow"
import { normalize } from "@/game/geo"

const cell = "flex h-11 items-center justify-center rounded-xl border px-2 text-sm"
const empty = "h-11 rounded-xl bg-muted"
const green = "border-green-600 bg-green-500/10 text-green-700 dark:text-green-400"
const red = "border-red-600 bg-red-500/10 text-red-700 dark:text-red-400"

export function CountryAttempts({
  guesses,
  max,
  loadingMs,
  targetCode,
  failed,
}: {
  guesses: CountryGuess[]
  max: number
  loadingMs?: number
  targetCode?: string
  failed?: boolean
}) {
  return (
    <ul className="flex flex-col gap-1">
      {Array.from({ length: max }, (_, i) => {
        const g = guesses[i]
        if (g) {
          const ok = g.country.code === targetCode
          const isLastFail = failed && i === guesses.length - 1
          const c = ok ? `${cell} ${green}` : isLastFail ? `${cell} ${red}` : cell
          return (
            <li key={g.country.code} className={`flex gap-1 ${ok ? "pop" : ""}`}>
              <span className={`${c} flex-1`}>{g.country.name}</span>
              <span className={`${c} w-24`}>{g.distanceKm} km</span>
              <span className={`${c} w-12`}>
                {ok ? "✓" : <DirectionArrow bearing={g.bearing} />}
              </span>
              <span className={`${c} w-14`}>{g.proximity}%</span>
            </li>
          )
        }
        if (i === guesses.length && loadingMs !== undefined) {
          return <DogRow key="dog" durationMs={loadingMs} />
        }
        return <li key={`empty-${i}`} className={empty} aria-hidden="true" />
      })}
    </ul>
  )
}

export function CapitalAttempts({
  guesses,
  max,
  loadingMs,
  targetCapital,
  failed,
}: {
  guesses: string[]
  max: number
  loadingMs?: number
  targetCapital?: string
  failed?: boolean
}) {
  return (
    <ul className="flex flex-col gap-1">
      {Array.from({ length: max }, (_, i) => {
        const g = guesses[i]
        if (g) {
          const ok =
            targetCapital !== undefined &&
            normalize(g) === normalize(targetCapital)
          const isLastFail = failed && i === guesses.length - 1
          return (
            <li
              key={g}
              className={`${cell} ${ok ? `pop ${green}` : isLastFail ? red : ""}`}
            >
              {g}
              {ok ? " ✓" : ""}
            </li>
          )
        }
        if (i === guesses.length && loadingMs !== undefined) {
          return <DogRow key="dog" durationMs={loadingMs} />
        }
        return <li key={`empty-${i}`} className={empty} aria-hidden="true" />
      })}
    </ul>
  )
}