import { useCallback, useMemo, useReducer } from "react"
import type { Country } from "./types"
import {
  MAX_CAPITAL_ATTEMPTS,
  MAX_COUNTRY_ATTEMPTS,
  gameReducer,
} from "./gameReducer"

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

export function useGame(countries: Country[], initialCompleted: string[] = []) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => {
    const target = pickRandom(countries, initialCompleted)
    return {
      target,
      phase: target ? ("country" as const) : ("complete" as const),
      countryGuesses: [],
      capitalGuesses: [],
      completed: initialCompleted,
    }
  })

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
