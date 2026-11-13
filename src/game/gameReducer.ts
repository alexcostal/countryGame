import type { GameAction, GameState } from "./types"
import { bearingDeg, distanceKm, normalize, proximityPct } from "./geo"

export const MAX_COUNTRY_ATTEMPTS = 7
export const MAX_CAPITAL_ATTEMPTS = 5

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
      return {
        ...state,
        countryGuesses,
        phase: countryGuesses.length >= MAX_COUNTRY_ATTEMPTS ? "failed" : "country",
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
        return {
          ...state,
          capitalGuesses,
          phase: "solved",
          completed: [...state.completed, target.code],
        }
      }
      return {
        ...state,
        capitalGuesses,
        phase: capitalGuesses.length >= MAX_CAPITAL_ATTEMPTS ? "failed" : "capital",
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