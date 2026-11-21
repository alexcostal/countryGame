import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { PointerEvent as RPointerEvent, WheelEvent as RWheelEvent } from "react"
import { ArrowLeft, Minus, Plus } from "lucide-react"
import { COUNTRIES } from "@/data/countries"
import { CountrySheet } from "@/components/CountrySheet"
import { SpinningGlobe } from "@/components/SpinningGlobe"
import { WorldMap } from "@/components/WorldMap"
import { completedCodes, loadRecords } from "@/game/storage"
import { useGeometries } from "@/game/useGeometries"

const OCEAN = "#cfe3f1"
const MAP_W = 360
const MAP_Y = 6
const MAP_H = 142
const MAX_Z = 24
const TAP_PX = 8
const TAP_MS = 500
const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]))

type Mode = "globe" | "flat"

interface View {
  cx: number
  cy: number
  z: number
}
interface Pt {
  x: number
  y: number
}
type Gesture =
  | { kind: "drag"; start: Pt; view: View; t: number; moved: boolean }
  | { kind: "pinch"; mid: Pt; dist: number; view: View }

const midOf = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
const distOf = (a: Pt, b: Pt) => Math.max(1, Math.hypot(a.x - b.x, a.y - b.y))

function clampView(v: View, w: number, h: number): View {
  const z = Math.min(MAX_Z, Math.max(1, v.z))
  const vw = MAP_W / z
  const vh = (vw * h) / w
  const cx = Math.min(MAP_W - vw / 2, Math.max(vw / 2, v.cx))
  const cy =
    vh >= MAP_H
      ? MAP_Y + MAP_H / 2
      : Math.min(MAP_Y + MAP_H - vh / 2, Math.max(MAP_Y + vh / 2, v.cy))
  return { cx, cy, z }
}

function toMap(v: View, w: number, h: number, p: Pt): Pt {
  const vw = MAP_W / v.z
  const vh = (vw * h) / w
  return { x: v.cx - vw / 2 + (p.x / w) * vw, y: v.cy - vh / 2 + (p.y / h) * vh }
}

function anchored(mapPt: Pt, p: Pt, z: number, w: number, h: number): View {
  const vw = MAP_W / z
  const vh = (vw * h) / w
  return {
    cx: mapPt.x - (p.x / w - 0.5) * vw,
    cy: mapPt.y - (p.y / h - 0.5) * vh,
    z,
  }
}

const zoomBtn =
  "flex h-11 w-11 items-center justify-center rounded-xl bg-[#0e2250] text-white shadow-md active:bg-[#16306e]"

function tab(active: boolean) {
  return `h-10 flex-1 rounded-full text-sm font-medium ${active ? "bg-white text-[#0e2250]" : "text-white/80 active:bg-white/10"
    }`
}

export default function MapScreen({ onBack }: { onBack: () => void }) {
  const geometries = useGeometries()
  const [records] = useState(loadRecords)
  const completed = useMemo(() => completedCodes(records), [records])
  const [selected, setSelected] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>("flat")

  const box = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const view = useRef<View>({ cx: MAP_W / 2, cy: MAP_Y + MAP_H / 2, z: 1 })
  const pointers = useRef(new Map<number, Pt>())
  const gesture = useRef<Gesture | null>(null)

  const failed = geometries !== null && Object.keys(geometries).length === 0
  const ready = geometries !== null && !failed

  const size = useCallback(() => {
    const r = box.current?.getBoundingClientRect()
    return { w: r?.width ?? 0, h: r?.height ?? 0, left: r?.left ?? 0, top: r?.top ?? 0 }
  }, [])

  const apply = useCallback(
    (next: View) => {
      const s = svg.current
      const { w, h } = size()
      if (!s || w === 0 || h === 0) return
      const v = clampView(next, w, h)
      view.current = v
      const vw = MAP_W / v.z
      const vh = (vw * h) / w
      s.setAttribute("viewBox", `${v.cx - vw / 2} ${v.cy - vh / 2} ${vw} ${vh}`)
    },
    [size],
  )

  useEffect(() => {
    if (mode !== "flat") return
    apply(view.current)
    const onResize = () => apply(view.current)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [apply, geometries, mode])

  function switchMode(next: Mode) {
    pointers.current.clear()
    gesture.current = null
    setSelected(null)
    setMode(next)
  }

  function rel(e: { clientX: number; clientY: number }): Pt {
    const { left, top } = size()
    return { x: e.clientX - left, y: e.clientY - top }
  }

  function beginDrag(p: Pt, moved: boolean) {
    gesture.current = { kind: "drag", start: p, view: view.current, t: Date.now(), moved }
  }

  function beginPinch() {
    const [a, b] = [...pointers.current.values()]
    gesture.current = {
      kind: "pinch",
      mid: midOf(a, b),
      dist: distOf(a, b),
      view: view.current,
    }
  }

  function pick(x: number, y: number) {
    const hit = document.elementFromPoint(x, y)?.closest("[data-code]")
    const code = hit?.getAttribute("data-code") ?? null
    setSelected(code && BY_CODE.has(code) ? code : null)
  }

  function onPointerDown(e: RPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, rel(e))
    if (pointers.current.size === 1) beginDrag(rel(e), false)
    else if (pointers.current.size === 2) beginPinch()
  }

  function onPointerMove(e: RPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return
    const p = rel(e)
    pointers.current.set(e.pointerId, p)
    const g = gesture.current
    const { w, h } = size()
    if (!g || w === 0 || h === 0) return

    if (g.kind === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const z = Math.min(MAX_Z, Math.max(1, g.view.z * (distOf(a, b) / g.dist)))
      apply(anchored(toMap(g.view, w, h, g.mid), midOf(a, b), z, w, h))
    } else if (g.kind === "drag" && pointers.current.size === 1) {
      const dx = p.x - g.start.x
      const dy = p.y - g.start.y
      if (!g.moved && Math.hypot(dx, dy) > TAP_PX) g.moved = true
      if (g.moved) {
        const u = MAP_W / g.view.z / w
        apply({ cx: g.view.cx - dx * u, cy: g.view.cy - dy * u, z: g.view.z })
      }
    }
  }

  function endPointer(e: RPointerEvent<HTMLDivElement>, cancelled: boolean) {
    const g = gesture.current
    pointers.current.delete(e.pointerId)
    if (
      !cancelled &&
      g?.kind === "drag" &&
      !g.moved &&
      pointers.current.size === 0 &&
      Date.now() - g.t < TAP_MS
    ) {
      pick(e.clientX, e.clientY)
    }
    if (pointers.current.size === 0) gesture.current = null
    else if (pointers.current.size === 1) {
      const [q] = [...pointers.current.values()]
      beginDrag(q, true)
    } else beginPinch()
  }

  function zoomAt(p: Pt, factor: number) {
    const { w, h } = size()
    if (w === 0 || h === 0) return
    const v = view.current
    const z = Math.min(MAX_Z, Math.max(1, v.z * factor))
    apply(anchored(toMap(v, w, h, p), p, z, w, h))
  }

  function onWheel(e: RWheelEvent<HTMLDivElement>) {
    zoomAt(rel(e), Math.exp(-e.deltaY * 0.0025))
  }

  function zoomBy(factor: number) {
    const { w, h } = size()
    zoomAt({ x: w / 2, y: h / 2 }, factor)
  }

  const country = selected ? BY_CODE.get(selected) : undefined

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

      <div className="flex gap-1 rounded-full border border-white/15 p-1">
        <button
          type="button"
          onClick={() => switchMode("flat")}
          className={tab(mode === "flat")}
        >
          Mapa
        </button>
        <button
          type="button"
          onClick={() => switchMode("globe")}
          className={tab(mode === "globe")}
        >
          Globo
        </button>
      </div>

      {geometries === null && (
        <p className="p-4 text-sm text-sky-200/80">Cargando mapa…</p>
      )}
      {failed && (
        <p className="p-4 text-sm text-sky-200/80">No se pudo cargar el mapa.</p>
      )}

      {ready && mode === "globe" && (
        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
          <div className="aspect-square w-[min(92vw,420px)]">
            <SpinningGlobe
              geometries={geometries}
              completed={completed}
              interactive
              selected={selected}
              onSelect={(code) => setSelected(code && BY_CODE.has(code) ? code : null)}
              className="block aspect-square w-full"
            />
          </div>
          {!country && (
            <p className="text-xs text-white/50">
              Arrastra para girar · toca un país para ver su ficha
            </p>
          )}
          {country && selected && (
            <CountrySheet
              country={country}
              record={records[selected]}
              onClose={() => setSelected(null)}
            />
          )}
        </div>
      )}

      {ready && mode === "flat" && (
        <div className="relative min-h-0 flex-1">
          <div
            ref={box}
            className="h-full touch-none select-none overflow-hidden rounded-xl"
            style={{ backgroundColor: OCEAN }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => endPointer(e, false)}
            onPointerCancel={(e) => endPointer(e, true)}
            onWheel={onWheel}
          >
            <WorldMap
              svgRef={svg}
              geometries={geometries}
              completed={completed}
              selected={selected}
              className="block h-full w-full"
            />
          </div>

          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <button
              type="button"
              aria-label="Acercar"
              className={zoomBtn}
              onClick={() => zoomBy(1.6)}
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Alejar"
              className={zoomBtn}
              onClick={() => zoomBy(1 / 1.6)}
            >
              <Minus className="h-5 w-5" />
            </button>
          </div>

          {country && selected && (
            <CountrySheet
              country={country}
              record={records[selected]}
              onClose={() => setSelected(null)}
            />
          )}
        </div>
      )}
    </main>
  )
}