import { useCallback, useEffect, useMemo, useReducer } from "react"
import type { Country, GameState, Records } from "./types"
import {
  MAX_CAPITAL_ATTEMPTS,
  MAX_COUNTRY_ATTEMPTS,
  gameReducer,
} from "./gameReducer"
import { completedCodes, saveRecords } from "./storage"

function pickRandom(
  countries: Country[],
  completed: string[],
  excludeCode?: string,
): Country | null {
  const pending = countries.filter((c) => !completed.includes(c.code))
  const pool =
    pending.length > 1 ? pending.filter((c) => c.code !== excludeCode) : pending
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

function todayString(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

export function useGame(countries: Country[], savedRecords: Records = {}) {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    (): GameState => {
      const target = pickRandom(countries, completedCodes(savedRecords))
      return {
        target,
        phase: target ? "country" : "complete",
        countryGuesses: [],
        capitalGuesses: [],
        records: savedRecords,
      }
    },
  )

  useEffect(() => {
    saveRecords(state.records)
  }, [state.records])

  const pendingCount = useMemo(() => {
    const done = completedCodes(state.records)
    return countries.filter((c) => !done.includes(c.code)).length
  }, [countries, state.records])

  const guessCountry = useCallback(
    (guess: Country) => dispatch({ type: "GUESS_COUNTRY", guess }),
    [],
  )

  const guessCapital = useCallback(
    (guess: string) =>
      dispatch({ type: "GUESS_CAPITAL", guess, today: todayString() }),
    [],
  )

  const toCapital = useCallback(() => dispatch({ type: "TO_CAPITAL" }), [])

  const next = useCallback(
    () =>
      dispatch({
        type: "NEXT",
        target: pickRandom(
          countries,
          completedCodes(state.records),
          state.target?.code,
        ),
      }),
    [countries, state.records, state.target],
  )

  return {
    state,
    pendingCount,
    remainingCountryAttempts: MAX_COUNTRY_ATTEMPTS - state.countryGuesses.length,
    remainingCapitalAttempts: MAX_CAPITAL_ATTEMPTS - state.capitalGuesses.length,
    guessCountry,
    guessCapital,
    toCapital,
    next,
  }
}