import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { COUNTRIES } from "@/data/countries"
import {
  exportProgress,
  loadCompleted,
  parseProgress,
  saveCompleted,
} from "@/game/storage"

const btn =
  "h-12 w-full rounded-xl bg-white/10 px-4 text-base font-semibold active:bg-white/20"
const box =
  "w-full resize-none rounded-xl border border-white/15 bg-black/20 p-3 text-base text-white placeholder:text-white/40"
const title = "text-sm font-semibold text-sky-200/80"

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [completed, setCompleted] = useState<string[]>(loadCompleted)
  const [importText, setImportText] = useState("")
  const [message, setMessage] = useState("")
  const [confirmReset, setConfirmReset] = useState(false)

  const exportText = exportProgress(completed)
  const total = COUNTRIES.length
  const pct = total ? Math.round((completed.length / total) * 100) : 0

  async function copy() {
    try {
      await navigator.clipboard.writeText(exportText)
      setMessage("Copiado. Guárdalo en un sitio seguro, por ejemplo en Notas.")
    } catch {
      setMessage("No se pudo copiar solo. Selecciona el texto y cópialo a mano.")
    }
  }

  function importProgress() {
    const codes = parseProgress(importText)
    if (!codes) {
      setMessage("Ese texto no es una partida válida.")
      return
    }
    const valid = codes.filter((c) => COUNTRIES.some((x) => x.code === c))
    const merged = [...new Set([...completed, ...valid])]
    const added = merged.length - completed.length
    saveCompleted(merged)
    setCompleted(merged)
    setImportText("")
    setMessage(
      added > 0 ? `Importados ${added} países nuevos.` : "Ya los tenías todos.",
    )
  }

  function reset() {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    saveCompleted([])
    setCompleted([])
    setConfirmReset(false)
    setMessage("Progreso borrado.")
  }

  return (
    <main className="min-h-dvh bg-[#0e2250] px-5 pt-[calc(env(safe-area-inset-top)_+_1rem)] pb-[calc(env(safe-area-inset-bottom)_+_1.5rem)] text-white">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 active:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">Ajustes</h1>
        </header>

        {message && (
          <p role="status" className="text-sm text-sky-200">
            {message}
          </p>
        )}

        <section className="flex flex-col gap-2">
          <h2 className={title}>Tu progreso</h2>
          <p>
            {completed.length} de {total} países completados
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#7ee8b4]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className={title}>Guardar partida</h2>
          <p className="text-sm text-white/60">
            Copia este texto y guárdalo donde quieras. Sirve para pasar tu
            progreso a otro móvil o recuperarlo.
          </p>
          <textarea
            readOnly
            rows={3}
            value={exportText}
            onFocus={(e) => e.currentTarget.select()}
            className={box}
          />
          <button type="button" onClick={copy} className={btn}>
            Copiar
          </button>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className={title}>Recuperar partida</h2>
          <p className="text-sm text-white/60">
            Pega el texto guardado. Se suma a lo que ya tengas.
          </p>
          <textarea
            rows={3}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="countrygame1:ES,FR,JP"
            className={box}
          />
          <button type="button" onClick={importProgress} className={btn}>
            Importar
          </button>
        </section>

        <section>
          <button
            type="button"
            onClick={reset}
            className="h-12 w-full rounded-xl border border-red-400/40 bg-red-500/10 px-4 text-base font-semibold text-red-300 active:bg-red-500/20"
          >
            {confirmReset ? "Pulsa otra vez para borrar todo" : "Borrar progreso"}
          </button>
        </section>
      </div>
    </main>
  )
}