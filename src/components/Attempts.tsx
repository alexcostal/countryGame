import type { CountryGuess } from "@/game/types"
import { DirectionArrow } from "@/components/DirectionArrow"
import { DogRow } from "@/components/DogRow"

const cell = "flex h-9 items-center justify-center rounded-md border px-2 text-sm"
const empty = "h-9 rounded-md bg-muted"

export function CountryAttempts({
    guesses,
    max,
    loadingMs,
    targetCode,
}: {
    guesses: CountryGuess[]
    max: number
    loadingMs?: number
    targetCode?: string
}) {
    return (
        <ul className="flex flex-col gap-1">
            {Array.from({ length: max }, (_, i) => {
                const g = guesses[i]
                if (g) {
                    const ok = g.country.code === targetCode
                    const c = ok
                        ? `${cell} border-green-600 bg-green-500/10 text-green-700 dark:text-green-400`
                        : cell
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
}: {
    guesses: string[]
    max: number
    loadingMs?: number
}) {
    return (
        <ul className="flex flex-col gap-1">
            {Array.from({ length: max }, (_, i) => {
                if (guesses[i]) {
                    return (
                        <li key={guesses[i]} className={cell}>
                            {guesses[i]}
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