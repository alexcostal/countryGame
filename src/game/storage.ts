const KEY = "countrygame:progress"
const PREFIX = "countrygame1:"

function clean(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const codes = value.filter(
    (c): c is string => typeof c === "string" && /^[A-Z]{2}$/.test(c),
  )
  return [...new Set(codes)]
}

export function loadCompleted(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== "object") return []
    return clean((data as { completed?: unknown }).completed) ?? []
  } catch {
    return []
  }
}

export function saveCompleted(codes: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, completed: codes }))
  } catch {
    // sin espacio o almacenamiento bloqueado: se ignora
  }
}

export function exportProgress(codes: string[]): string {
  return PREFIX + codes.join(",")
}

export function parseProgress(text: string): string[] | null {
  const t = text.trim()
  if (!t.toLowerCase().startsWith(PREFIX)) return null
  const codes = t
    .slice(PREFIX.length)
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
  return clean(codes)
}