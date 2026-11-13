import { useEffect, useState } from "react"
import type { Geometry } from "./shapes"

interface Feature {
  properties: Record<string, unknown>
  geometry: Geometry
}

export function useGeometries() {
  const [geometries, setGeometries] = useState<Record<string, Geometry> | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}data/countries.geo.json`)
      .then((r) => r.json())
      .then((data: { features: Feature[] }) => {
        if (cancelled) return
        const map: Record<string, Geometry> = {}
        for (const f of data.features) {
          const code = [f.properties.ISO_A2_EH, f.properties.ISO_A2].find(
            (c): c is string => typeof c === "string" && c !== "-99",
          )
          if (code) map[code] = f.geometry
        }
        setGeometries(map)
      })
      .catch(() => {
        if (!cancelled) setGeometries({})
      })
    return () => {
      cancelled = true
    }
  }, [])

  return geometries
}