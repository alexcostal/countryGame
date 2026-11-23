export interface Frame {
  lon: number
  half: number
  latMin: number
  latMax: number
}

export const CONTINENTS = [
  "Europa",
  "Asia",
  "África",
  "América",
  "Oceanía",
] as const

export const FRAMES: Record<string, Frame> = {
  "Europa": { lon: 8, half: 35, latMin: 33, latMax: 71 },
  "Asia": { lon: 108, half: 87, latMin: -11, latMax: 66 },
  "África": { lon: 20, half: 45, latMin: -36, latMax: 38 },
  "América": { lon: -80, half: 62, latMin: -56, latMax: 70 },
  "Oceanía": { lon: 165, half: 57, latMin: -48, latMax: 20 },
}