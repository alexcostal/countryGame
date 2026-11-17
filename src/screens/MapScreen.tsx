import { useState } from "react"
import { ArrowLeft, Minus, Plus } from "lucide-react"
import { COUNTRIES } from "@/data/countries"
import { WorldMap } from "@/components/WorldMap"
import { loadCompleted } from "@/game/storage"
import { useGeometries } from "@/game/useGeometries"

const OCEAN = "#cfe3f1"
const ZOOMS = [1, 2, 3, 4, 6]

const zoomBtn =
  "flex h-11 w-11 items-center justify-center rounded-xl bg-[#0e2250] text-white shadow-md active:bg-[#16306e] disabled:opacity-40"

export default function MapScreen({ onBack }: { onBack: () => void }) {
  const geometries = useGeometries()
  const [completed] = useState(loadCompleted)
  const [zoomIndex, setZoomIndex] = useState(0)
  const zoom = ZOOMS[zoomIndex]

  const failed = geometries !== null && Object.keys(geometries).length === 0

  return (
    <main className="flex h-dvh flex-col gap-3 bg-[#0e2250] px-4 pt-[calc(env(safe-area-inset-top)_+_1rem)] pb-[calc(env(safe-area-inset-bottom)_+_1rem)] text-white">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 active:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Mapamundi</h1>
          <p className="text-sm text-sky-200/70">
            {completed.length} de {COUNTRIES.length} países
          </p>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          className="h-full overflow-auto overscroll-contain rounded-xl"
          style={{ backgroundColor: OCEAN }}
        >
          {geometries === null && (
            <p className="p-4 text-sm text-slate-700">Cargando mapa…</p>
          )}
          {failed && (
            <p className="p-4 text-sm text-slate-700">No se pudo cargar el mapa.</p>
          )}
          {geometries && !failed && (
            <div className="flex min-h-full min-w-full">
              <WorldMap
                geometries={geometries}
                completed={completed}
                className="m-auto block shrink-0"
                style={{ width: `${zoom * 100}%` }}
              />
            </div>
          )}
        </div>

        <div className="absolute bottom-3 right-3 flex flex-col gap-2">
          <button
            type="button"
            aria-label="Acercar"
            className={zoomBtn}
            disabled={zoomIndex === ZOOMS.length - 1}
            onClick={() => setZoomIndex((i) => i + 1)}
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Alejar"
            className={zoomBtn}
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex((i) => i - 1)}
          >
            <Minus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </main>
  )
}