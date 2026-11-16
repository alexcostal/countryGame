import { useCallback, useEffect, useMemo, useReducer } from "react"
import type { Country, GameState } from "./types"
import {
  MAX_CAPITAL_ATTEMPTS,
  MAX_COUNTRY_ATTEMPTS,
  gameReducer,
} from "./gameReducer"
import { saveCompleted } from "./storage"

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

export function useGame(countries: Country[], savedCompleted: string[] = []) {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    (): GameState => {
      const completed = savedCompleted.filter((code) =>
        countries.some((c) => c.code === code),
      )
      const target = pickRandom(countries, completed)
      return {
        target,
        phase: target ? "country" : "complete",
        countryGuesses: [],
        capitalGuesses: [],
        completed,
      }
    },
  )

  useEffect(() => {
    saveCompleted(state.completed)
  }, [state.completed])

  const pendingCount = useMemo(
    () => countries.filter((c) => !state.completed.includes(c.code)).length,
    [countries, state.completed],
  )

  const guessCountry = useCallback(
    (guess: Country) => dispatch({ type: "GUESS_COUNTRY", guess }),
    [],
  )

  const guessCapital = useCallback(
    (guess: string) => dispatch({ type: "GUESS_CAPITAL", guess }),
    [],
  )

  const toCapital = useCallback(() => dispatch({ type: "TO_CAPITAL" }), [])

  const next = useCallback(
    () =>
      dispatch({
        type: "NEXT",
        target: pickRandom(countries, state.completed, state.target?.code),
      }),
    [countries, state.completed, state.target],
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