import type { GameAction, GameState, Records } from "./types"
import { bearingDeg, distanceKm, normalize, proximityPct } from "./geo"

export const MAX_COUNTRY_ATTEMPTS = 7
export const MAX_CAPITAL_ATTEMPTS = 5

function bumpFails(records: Records, code: string): Records {
  const current = records[code]
  return { ...records, [code]: { ...current, fails: (current?.fails ?? 0) + 1 } }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "GUESS_COUNTRY": {
      const { target } = state
      if (!target || state.phase !== "country") return state
      if (state.countryGuesses.some((g) => g.country.code === action.guess.code)) {
        return state
      }

      const km = Math.round(distanceKm(action.guess, target))
      const countryGuesses = [
        ...state.countryGuesses,
        {
          country: action.guess,
          distanceKm: km,
          bearing: Math.round(bearingDeg(action.guess, target)),
          proximity: proximityPct(km),
        },
      ]

      if (action.guess.code === target.code) {
        return { ...state, countryGuesses, phase: "countryDone" }
      }

      const lost = countryGuesses.length >= MAX_COUNTRY_ATTEMPTS
      return {
        ...state,
        countryGuesses,
        phase: lost ? "failed" : "country",
        records: lost ? bumpFails(state.records, target.code) : state.records,
      }
    }

    case "TO_CAPITAL": {
      if (state.phase !== "countryDone") return state
      return { ...state, phase: "capital" }
    }

    case "GUESS_CAPITAL": {
      const { target } = state
      if (!target || state.phase !== "capital") return state
      const guess = action.guess.trim()
      if (!guess) return state
      if (state.capitalGuesses.some((g) => normalize(g) === normalize(guess))) {
        return state
      }

      const capitalGuesses = [...state.capitalGuesses, guess]

      if (normalize(guess) === normalize(target.capital)) {
        const previous = state.records[target.code]
        return {
          ...state,
          capitalGuesses,
          phase: "solved",
          records: {
            ...state.records,
            [target.code]: {
              fails: previous?.fails ?? 0,
              done: {
                at: action.today,
                countryTries: state.countryGuesses.length,
                capitalTries: capitalGuesses.length,
              },
            },
          },
        }
      }

      const lost = capitalGuesses.length >= MAX_CAPITAL_ATTEMPTS
      return {
        ...state,
        capitalGuesses,
        phase: lost ? "failed" : "capital",
        records: lost ? bumpFails(state.records, target.code) : state.records,
      }
    }

    case "NEXT":
      return {
        ...state,
        target: action.target,
        phase: action.target ? "country" : "complete",
        countryGuesses: [],
        capitalGuesses: [],
      }
  }
}