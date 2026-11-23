const KEY = "countrygame:trips"

export function loadTrips(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== "object") return []
    const list = (data as { visited?: unknown }).visited
    if (!Array.isArray(list)) return []
    return [
      ...new Set(
        list.filter(
          (c): c is string => typeof c === "string" && /^[A-Z]{2}$/.test(c),
        ),
      ),
    ]
  } catch {
    return []
  }
}

export function saveTrips(codes: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, visited: codes }))
  } catch {
    // sin espacio o almacenamiento bloqueado: se ignora
  }
}