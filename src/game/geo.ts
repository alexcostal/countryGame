interface Point {
  lat: number
  lng: number
}

const EARTH_RADIUS_KM = 6371
const toRad = (d: number) => (d * Math.PI) / 180
const toDeg = (r: number) => (r * 180) / Math.PI

export function distanceKm(a: Point, b: Point): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

export function bearingDeg(from: Point, to: Point): number {
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)
  const dLng = toRad(to.lng - from.lng)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

export function proximityPct(km: number): number {
  return Math.round(Math.max(0, 1 - km / 20000) * 100)
}

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

}

export const DIRECTION_LABELS = [
  "norte",
  "noreste",
  "este",
  "sureste",
  "sur",
  "suroeste",
  "oeste",
  "noroeste",
]

export function octant(bearing: number): number {
  return Math.round(bearing / 45) % 8
}
