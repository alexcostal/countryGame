import type { CountryRecord, Records } from "./types"

const KEY = "countrygame:progress"
const PREFIX_V1 = "countrygame1:"
const PREFIX_V2 = "countrygame2:"
const CODE = /^[A-Z]{2}$/

function num(value: unknown, max: number): number | undefined {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= max
    ? value
    : undefined
}

function isoDate(value: unknown): string | undefined {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : undefined
}

function cleanRecord(value: unknown): CountryRecord | null {
  if (!value || typeof value !== "object") return null
  const r = value as { fails?: unknown; done?: unknown }
  const record: CountryRecord = { fails: num(r.fails, 9999) ?? 0 }
  if (r.done && typeof r.done === "object") {
    const d = r.done as {
      at?: unknown
      countryTries?: unknown
      capitalTries?: unknown
    }
    record.done = {
      at: isoDate(d.at),
      countryTries: num(d.countryTries, 99),
      capitalTries: num(d.capitalTries, 99),
    }
  }
  return record
}

function cleanRecords(value: unknown): Records {
  const out: Records = {}
  if (!value || typeof value !== "object") return out
  for (const [code, raw] of Object.entries(value)) {
    if (!CODE.test(code)) continue
    const record = cleanRecord(raw)
    if (record) out[code] = record
  }
  return out
}

export function completedCodes(records: Records): string[] {
  return Object.keys(records).filter((code) => records[code].done !== undefined)
}

export function loadRecords(): Records {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== "object") return {}
    const d = data as { v?: unknown; records?: unknown; completed?: unknown }
    if (d.v === 2) return cleanRecords(d.records)
    if (Array.isArray(d.completed)) {
      const out: Records = {}
      for (const c of d.completed) {
        if (typeof c === "string" && CODE.test(c)) out[c] = { fails: 0, done: {} }
      }
      return out
    }
    return {}
  } catch {
    return {}
  }
}

export function saveRecords(records: Records): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 2, records }))
  } catch {
    // sin espacio o almacenamiento bloqueado: se ignora
  }
}

export function loadCompleted(): string[] {
  return completedCodes(loadRecords())
}

export function exportProgress(records: Records): string {
  const parts = Object.keys(records)
    .sort()
    .map((code) => {
      const r = records[code]
      const d = r.done
      return [
        code,
        d ? 1 : 0,
        d?.countryTries ?? "",
        d?.capitalTries ?? "",
        r.fails,
        d?.at ? d.at.replace(/-/g, "") : "",
      ].join(":")
    })
  return PREFIX_V2 + parts.join(",")
}

const toNum = (s: string) => (s === "" ? undefined : Number(s))

export function parseProgress(text: string): Records | null {
  const t = text.trim()
  const lower = t.toLowerCase()
  const out: Records = {}

  if (lower.startsWith(PREFIX_V1)) {
    for (const part of t.slice(PREFIX_V1.length).split(",")) {
      const code = part.trim().toUpperCase()
      if (CODE.test(code)) out[code] = { fails: 0, done: {} }
    }
  } else if (lower.startsWith(PREFIX_V2)) {
    for (const part of t.slice(PREFIX_V2.length).split(",")) {
      const f = part.trim().split(":")
      if (f.length !== 6) continue
      const code = f[0].toUpperCase()
      if (!CODE.test(code)) continue
      const d = f[5]
      const record = cleanRecord({
        fails: Number(f[4]),
        done:
          f[1] === "1"
            ? {
                at:
                  d.length === 8
                    ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`
                    : undefined,
                countryTries: toNum(f[2]),
                capitalTries: toNum(f[3]),
              }
            : undefined,
      })
      if (record) out[code] = record
    }
  } else {
    return null
  }

  return Object.keys(out).length > 0 ? out : null
}

export function mergeRecords(local: Records, incoming: Records): Records {
  const out: Records = { ...local }
  for (const [code, inc] of Object.entries(incoming)) {
    const cur = out[code]
    if (!cur) {
      out[code] = inc
      continue
    }
    const done =
      cur.done && inc.done
        ? cur.done.at
          ? cur.done
          : inc.done
        : (cur.done ?? inc.done)
    out[code] = { fails: Math.max(cur.fails, inc.fails), done }
  }
  return out
}