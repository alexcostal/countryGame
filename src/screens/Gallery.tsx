import { COUNTRIES } from "@/data/countries"
import { CountrySilhouette } from "@/components/CountrySilhouette"
import { useGeometries } from "@/game/useGeometries"
import { NO_MARKER } from "@/game/markers"

export default function Gallery() {
  const geometries = useGeometries()
  const param = new URLSearchParams(window.location.search).get("galeria")
  const codes = param ? param.toUpperCase().split(",") : null
  const list = codes ? COUNTRIES.filter((c) => codes.includes(c.code)) : COUNTRIES

  if (geometries === null) return <p className="p-4">Cargando…</p>

  return (
    <main className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4 lg:grid-cols-6">
      {list.map((c) => {
        const geometry = geometries[c.code]
        const point = { lat: c.capitalLat, lng: c.capitalLng }
        return (
          <figure
            key={c.code}
            className="flex flex-col items-center gap-1 rounded-lg border p-2"
          >
            <div className="h-28 w-full">
              {geometry ? (
                <CountrySilhouette
                  geometry={geometry}
                  focus={point}
                  marker={NO_MARKER.has(c.code) ? undefined : point}
                  className="h-full w-full"
                />
              ) : (
                <p className="text-xs text-red-600">Sin silueta</p>
              )}
            </div>
            <figcaption className="text-center text-xs">
              {c.name}
              <br />
              <span className="text-muted-foreground">{c.capital}</span>
            </figcaption>
          </figure>
        )
      })}
    </main>
  )
}