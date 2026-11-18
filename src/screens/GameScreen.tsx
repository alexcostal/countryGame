import { useEffect, useState } from "react"
import { COUNTRIES } from "@/data/countries"
import { Button } from "@/components/ui/button"
import { AutocompleteInput } from "@/components/AutocompleteInput"
import { CapitalAttempts, CountryAttempts } from "@/components/Attempts"
import { Confetti } from "@/components/Confetti"
import { CountrySilhouette } from "@/components/CountrySilhouette"
import { FailBanner } from "@/components/FailBanner"
import { MAX_CAPITAL_ATTEMPTS, MAX_COUNTRY_ATTEMPTS } from "@/game/gameReducer"
import { normalize } from "@/game/geo"
import { NO_MARKER, SHOW_ALL } from "@/game/markers"
import { loadRecords } from "@/game/storage"
import type { Country } from "@/game/types"
import { useGame } from "@/game/useGame"
import { useGeometries } from "@/game/useGeometries"

const DOG_MS = 2600

type Pending =
  | { kind: "country"; country: Country }
  | { kind: "capital"; name: string }

const byName = (a: string, b: string) => a.localeCompare(b, "es")
const COUNTRY_NAMES = COUNTRIES.map((c) => c.name).sort(byName)
const CAPITAL_NAMES = [...new Set(COUNTRIES.map((c) => c.capital))].sort(byName)

export default function GameScreen({ onHome }: { onHome: () => void }) {
  const [saved] = useState(loadRecords)
  const game = useGame(COUNTRIES, saved)
  const geometries = useGeometries()
  const { state, guessCountry, guessCapital } = game
  const [pending, setPending] = useState<Pending | null>(null)
  const geometry = state.target ? geometries?.[state.target.code] : undefined

  useEffect(() => {
    if (!pending) return
    const id = window.setTimeout(() => {
      if (pending.kind === "country") guessCountry(pending.country)
      else guessCapital(pending.name)
      setPending(null)
    }, DOG_MS)
    return () => window.clearTimeout(id)
  }, [pending, guessCountry, guessCapital])

  function submitCountry(name: string) {
    if (pending) return
    const country = COUNTRIES.find((c) => c.name === name)
    if (!country) return
    if (state.countryGuesses.some((g) => g.country.code === country.code)) return
    setPending({ kind: "country", country })
  }

  function submitCapital(name: string) {
    if (pending) return
    if (state.capitalGuesses.some((g) => normalize(g) === normalize(name))) return
    setPending({ kind: "capital", name })
  }

  const showCapital =
    state.capitalGuesses.length > 0 ||
    state.phase === "capital" ||
    state.phase === "solved"

  if (state.phase === "complete") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4">
        <p>Los tienes todos.</p>
        <Button onClick={onHome}>Inicio</Button>
      </div>
    )
  }

  const celebrate = state.phase === "countryDone" || state.phase === "solved"
  const failed = state.phase === "failed"
  const failedCapital = failed && state.capitalGuesses.length > 0

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-3 px-3 pt-[calc(env(safe-area-inset-top)_+_0.75rem)] pb-[calc(env(safe-area-inset-bottom)_+_0.75rem)] select-none cursor-default">
      {(state.phase === "countryDone" || state.phase === "solved") && (
        <Confetti key={`${state.target?.code}-${state.phase}`} count={60} />
      )}

      {failed && state.target && (
        <FailBanner
          key={state.target.code}
          title={
            failedCapital
              ? `La capital era ${state.target.capital}`
              : `Era ${state.target.name}`
          }
          detail={
            failedCapital
              ? `Fallaste la capital de ${state.target.name}`
              : "Fallaste el país"
          }
        />
      )}

      <button
        type="button"
        onClick={onHome}
        className="self-start text-sm text-muted-foreground"
      >
        ← Inicio
      </button>

      <div className="flex flex-1 flex-col justify-end gap-3">
        <div className="flex h-[30dvh] items-center justify-center">
          {geometry ? (
            <CountrySilhouette
              geometry={geometry}
              showAll={state.target ? SHOW_ALL.has(state.target.code) : false}
              className={`h-full w-full ${celebrate ? "pop" : ""} ${failed ? "shake" : ""}`}
              focus={
                state.target
                  ? { lat: state.target.capitalLat, lng: state.target.capitalLng }
                  : undefined
              }
              marker={
                showCapital && state.target && !NO_MARKER.has(state.target.code)
                  ? { lat: state.target.capitalLat, lng: state.target.capitalLng }
                  : undefined
              }
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {geometries === null ? "Cargando mapa…" : "Sin silueta para este país."}
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Prueba: {state.target?.name} / {state.target?.capital} · Pendientes:{" "}
          {game.pendingCount}
        </p>

        {showCapital ? (
          <CapitalAttempts
            guesses={state.capitalGuesses}
            max={MAX_CAPITAL_ATTEMPTS}
            loadingMs={pending?.kind === "capital" ? DOG_MS : undefined}
            targetCapital={state.target?.capital}
            failed={failed}
          />
        ) : (
          <CountryAttempts
            guesses={state.countryGuesses}
            max={MAX_COUNTRY_ATTEMPTS}
            loadingMs={pending?.kind === "country" ? DOG_MS : undefined}
            targetCode={state.target?.code}
            failed={failed}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        {state.phase === "country" && (
          <AutocompleteInput
            options={COUNTRY_NAMES}
            placeholder="País o territorio…"
            submitLabel="Adivinar"
            onSubmit={submitCountry}
          />
        )}

        {state.phase === "countryDone" && (
          <Button onClick={game.toCapital}>Siguiente</Button>
        )}

        {state.phase === "capital" && (
          <AutocompleteInput
            options={CAPITAL_NAMES}
            placeholder="Capital…"
            submitLabel="Adivinar capital"
            onSubmit={submitCapital}
          />
        )}

        {(state.phase === "solved" || state.phase === "failed") && (
          <>
            <p>
              {state.phase === "solved" ? "Acertado" : "Fallado"}:{" "}
              {state.target?.name} ({state.target?.capital})
            </p>
            <Button
              onClick={game.next}
              className={
                state.phase === "solved" ? "bg-green-600 text-white hover:bg-green-700" : ""
              }
            >
              Otro país
            </Button>
          </>
        )}
      </div>
    </div>
  )
}