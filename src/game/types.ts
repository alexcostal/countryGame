export interface Country {
  code: string
  name: string
  capital: string
  capitalLat: number
  capitalLng: number
  continent: string
  lat: number
  lng: number
}

export type Phase =
  | "country"
  | "countryDone"
  | "capital"
  | "solved"
  | "failed"
  | "complete"

export interface CountryGuess {
  country: Country
  distanceKm: number
  bearing: number
  proximity: number
}

export interface GameState {
  target: Country | null
  phase: Phase
  countryGuesses: CountryGuess[]
  capitalGuesses: string[]
  completed: string[]
}

export type GameAction =
  | { type: "GUESS_COUNTRY"; guess: Country }
  | { type: "TO_CAPITAL" }
  | { type: "GUESS_CAPITAL"; guess: string }
  | { type: "NEXT"; target: Country | null }