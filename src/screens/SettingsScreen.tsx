import { useState } from "react"
import { ArrowLeft, Lock } from "lucide-react"
import { COUNTRIES } from "@/data/countries"
import {
  completedCodes,
  exportProgress,
  loadRecords,
  mergeRecords,
  parseProgress,
  saveRecords,
} from "@/game/storage"
import type { Records } from "@/game/types"

type UpdateResult = "reloading" | "latest" | "unsupported" | "offline"

const PENDING_WAIT_MS = 20000
const IDLE_WAIT_MS = 4000

function checkForUpdate(): Promise<UpdateResult> {
  return new Promise((resolve) => {
    if (!("serviceWorker" in navigator)) {
      resolve("unsupported")
      return
    }
    if (!navigator.onLine) {
      resolve("offline")
      return
    }
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (!reg) {
          resolve("unsupported")
          return
        }
        const onChange = () => {
          resolve("reloading")
          window.location.reload()
        }
        navigator.serviceWorker.addEventListener("controllerchange", onChange, {
          once: true,
        })
        reg
          .update()
          .then(() => {
            const pending = Boolean(reg.installing || reg.waiting)
            window.setTimeout(
              () => resolve("latest"),
              pending ? PENDING_WAIT_MS : IDLE_WAIT_MS,
            )
          })
          .catch(() => {
            navigator.serviceWorker.removeEventListener(
              "controllerchange",
              onChange,
            )
            resolve("offline")
          })
      })
      .catch(() => resolve("unsupported"))
  })
}

const UPDATE_MESSAGES: Record<UpdateResult, string> = {
  reloading: "Versión nueva encontrada. Recargando…",
  latest: "Ya tienes la última versión.",
  offline: "No se pudo comprobar. ¿Tienes conexión?",
  unsupported:
    "Aquí no hay modo sin conexión que actualizar. Funciona en la app publicada.",
}

const btn =
  "h-12 w-full rounded-xl bg-white/10 px-4 text-base font-semibold active:bg-white/20"
const box =
  "w-full resize-none rounded-xl border border-white/15 bg-black/20 p-3 text-base text-white placeholder:text-white/40"
const title = "text-sm font-semibold text-sky-200/80"
const danger =
  "h-12 w-full rounded-xl border border-red-400/40 bg-red-500/10 px-4 text-base font-semibold text-red-300 active:bg-red-500/20"

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [records, setRecords] = useState<Records>(loadRecords)
  const [importText, setImportText] = useState("")
  const [message, setMessage] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [checking, setChecking] = useState(false)

  const completed = completedCodes(records)
  const exportText = exportProgress(records)
  const total = COUNTRIES.length
  const doneCount = COUNTRIES.filter((c) => completed.includes(c.code)).length
  const allDone = total > 0 && doneCount === total
  const pct = total ? Math.round((doneCount / total) * 100) : 0

  async function copy() {
    try {
      await navigator.clipboard.writeText(exportText)
      setMessage("Copiado. Guárdalo en un sitio seguro, por ejemplo en Notas.")
    } catch {
      setMessage("No se pudo copiar solo. Selecciona el texto y cópialo a mano.")
    }
  }

  function importProgress() {
    const incoming = parseProgress(importText)
    if (!incoming) {
      setMessage("Ese texto no es una partida válida.")
      return
    }
    const valid: Records = {}
    for (const [code, record] of Object.entries(incoming)) {
      if (COUNTRIES.some((c) => c.code === code)) valid[code] = record
    }
    const merged = mergeRecords(records, valid)
    const added = completedCodes(merged).length - completed.length
    saveRecords(merged)
    setRecords(merged)
    setImportText("")
    setMessage(
      added > 0 ? `Importados ${added} países nuevos.` : "Ya los tenías todos.",
    )
  }

  function reset() {
    saveRecords({})
    setRecords({})
    setConfirming(false)
    setMessage("Progreso borrado. Ya puedes empezar de nuevo.")
  }

  async function update() {
    if (checking) return
    setChecking(true)
    setMessage("Buscando una versión nueva…")
    const result = await checkForUpdate()
    setMessage(UPDATE_MESSAGES[result])
    setChecking(false)
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
            {doneCount} de {total} países completados
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
            placeholder="countrygame2:ES:1:3:1:0:20261117"
            className={box}
          />
          <button type="button" onClick={importProgress} className={btn}>
            Importar
          </button>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className={title}>Empezar de nuevo</h2>

          {!allDone && (
            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/60">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Se desbloquea al completar todos los países ({doneCount} de{" "}
                {total}).
              </p>
            </div>
          )}

          {allDone && !confirming && (
            <>
              <p className="text-sm text-white/60">
                Has completado el mundo. Si quieres, puedes borrar tu progreso y
                volver a empezar desde cero.
              </p>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className={danger}
              >
                Empezar de nuevo
              </button>
            </>
          )}

          {allDone && confirming && (
            <div className="flex flex-col gap-2 rounded-xl border border-red-400/40 bg-red-500/10 p-3">
              <p className="text-sm text-red-200">
                Se borrarán todos tus países, tus intentos, tus fallos y las
                fechas. No se puede deshacer, salvo que antes copies tu partida
                y la recuperes después.
              </p>
              <button type="button" onClick={copy} className={btn}>
                Copiar mi partida antes
              </button>
              <button
                type="button"
                onClick={reset}
                className="h-12 w-full rounded-xl bg-red-500/80 px-4 text-base font-semibold active:bg-red-500"
              >
                Sí, borrar todo
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className={btn}
              >
                Cancelar
              </button>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className={title}>Actualizar la app</h2>
          <p className="text-sm text-white/60">
            Busca una versión nueva y recarga la app. Tu progreso no se borra.
            Necesitas conexión.
          </p>
          <button
            type="button"
            onClick={update}
            aria-busy={checking}
            className={btn}
          >
            {checking ? "Buscando…" : "Buscar actualización"}
          </button>
        </section>

        <p className="text-center text-xs text-white/40">
          Versión {__APP_VERSION__}
        </p>
      </div>
    </main>
  )
}