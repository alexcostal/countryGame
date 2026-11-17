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

export interface DoneInfo {
  at?: string
  countryTries?: number
  capitalTries?: number
}

export interface CountryRecord {
  fails: number
  done?: DoneInfo
}

export type Records = Record<string, CountryRecord>

export interface GameState {
  target: Country | null
  phase: Phase
  countryGuesses: CountryGuess[]
  capitalGuesses: string[]
  records: Records
}

export type GameAction =
  | { type: "GUESS_COUNTRY"; guess: Country }
  | { type: "TO_CAPITAL" }
  | { type: "GUESS_CAPITAL"; guess: string; today: string }
  | { type: "NEXT"; target: Country | null }