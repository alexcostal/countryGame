import { X } from "lucide-react"
import type { Country, CountryRecord } from "@/game/types"

interface Props {
  country: Country
  record?: CountryRecord
  onClose: () => void
}

function formatDate(iso?: string) {
  if (!iso) return null
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

export function CountrySheet({ country, record, onClose }: Props) {
  const done = record?.done
  const known = done !== undefined
  const date = formatDate(done?.at)

  return (
    <div
      role="dialog"
      aria-label="Ficha del país"
      className="absolute inset-x-0 bottom-0 z-20 rounded-t-2xl bg-white p-4 text-neutral-900 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-neutral-500">
            {known ? "Completado" : "Aún por descubrir"}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {known ? country.name : "???"}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 active:bg-neutral-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-neutral-500">Capital</dt>
          <dd className="font-medium">{known ? country.capital : "???"}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Continente</dt>
          <dd className="font-medium">{known ? country.continent : "???"}</dd>
        </div>
      </dl>

      {record && done && (
        <p className="mt-3 text-xs text-neutral-500">
          {date ? `Acertado el ${date}` : "Acertado"}
          {done.countryTries !== undefined &&
            done.capitalTries !== undefined &&
            ` · país en ${done.countryTries} y capital en ${done.capitalTries} intentos`}
          {record.fails > 0 &&
            ` · ${record.fails} ${record.fails === 1 ? "fallo" : "fallos"}`}
        </p>
      )}
    </div>
  )
}