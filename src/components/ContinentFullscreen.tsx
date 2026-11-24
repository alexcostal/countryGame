import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import type { PointerEvent as RPointerEvent, WheelEvent as RWheelEvent } from "react"
import { Minus, Plus, X } from "lucide-react"
import { ContinentMap } from "@/components/ContinentMap"
import type { Frame } from "@/data/continentFrames"
import type { SphereShape } from "@/game/sphere"

const W = 400
const H = 240
const MAX_Z = 10
const TAP_PX = 10
const HOLD_MS = 300
const TOAST_MS = 1400

interface Pt {
  x: number
  y: number
}
interface View {
  cx: number
  cy: number
  z: number
}
type Mode = "idle" | "pending" | "pan" | "peek" | "pinch"

interface Press {
  mode: Mode
  start: Pt
  last: Pt
  t: number
  code: string | null
  view: View
  pinchMid: Pt
  pinchDist: number
  pinchView: View
  timer: number | null
  touch: boolean
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))
const midOf = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
const distOf = (a: Pt, b: Pt) => Math.max(1, Math.hypot(a.x - b.x, a.y - b.y))

function clampView(v: View, w: number, h: number): View {
  const z = clamp(v.z, 1, MAX_Z)
  const vw = W / z
  const vh = (vw * h) / w
  const cx = vw >= W ? W / 2 : clamp(v.cx, vw / 2, W - vw / 2)
  const cy = vh >= H ? H / 2 : clamp(v.cy, vh / 2, H - vh / 2)
  return { cx, cy, z }
}

function toMap(v: View, w: number, h: number, p: Pt): Pt {
  const vw = W / v.z
  const vh = (vw * h) / w
  return { x: v.cx - vw / 2 + (p.x / w) * vw, y: v.cy - vh / 2 + (p.y / h) * vh }
}

function anchored(m: Pt, p: Pt, z: number, w: number, h: number): View {
  const vw = W / z
  const vh = (vw * h) / w
  return { cx: m.x - (p.x / w - 0.5) * vw, cy: m.y - (p.y / h - 0.5) * vh, z }
}

const zoomBtn =
  "flex h-11 w-11 items-center justify-center rounded-xl bg-[#16306e] text-white shadow-md active:bg-[#1d3d8a]"

interface Props {
  shapes: SphereShape[]
  membership: Record<string, string>
  continent: string
  frame: Frame
  visited: ReadonlySet<string>
  names: Record<string, string>
  seen: number
  total: number
  pct: number
  onToggle: (code: string) => void
  onClose: () => void
}

interface Label {
  code: string
  x: number
  y: number
  touch: boolean
}

export function ContinentFullscreen({
  shapes,
  membership,
  continent,
  frame,
  visited,
  names,
  seen,
  total,
  pct,
  onToggle,
  onClose,
}: Props) {
  const box = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const view = useRef<View>({ cx: W / 2, cy: H / 2, z: 1 })
  const ptrs = useRef(new Map<number, Pt>())
  const press = useRef<Press>({
    mode: "idle",
    start: { x: 0, y: 0 },
    last: { x: 0, y: 0 },
    t: 0,
    code: null,
    view: { cx: W / 2, cy: H / 2, z: 1 },
    pinchMid: { x: 0, y: 0 },
    pinchDist: 1,
    pinchView: { cx: W / 2, cy: H / 2, z: 1 },
    timer: null,
    touch: false,
  })
  const closeRef = useRef(onClose)
  const toastTimer = useRef<number | null>(null)
  const [label, setLabel] = useState<Label | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    closeRef.current = onClose
  })

  const size = useCallback(() => {
    const r = box.current?.getBoundingClientRect()
    return {
      w: r?.width ?? 0,
      h: r?.height ?? 0,
      left: r?.left ?? 0,
      top: r?.top ?? 0,
    }
  }, [])

  const apply = useCallback(
    (next: View) => {
      const s = svg.current
      const { w, h } = size()
      if (!s || w === 0 || h === 0) return
      const v = clampView(next, w, h)
      view.current = v
      const vw = W / v.z
      const vh = (vw * h) / w
      s.setAttribute("viewBox", `${v.cx - vw / 2} ${v.cy - vh / 2} ${vw} ${vh}`)
    },
    [size],
  )

  useLayoutEffect(() => {
    apply(view.current)
    const onResize = () => apply(view.current)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [apply])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const stop = (e: Event) => e.preventDefault()
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current()
    }
    document.addEventListener("gesturestart", stop)
    document.addEventListener("gesturechange", stop)
    window.addEventListener("keydown", key)
    const st = press.current
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("gesturestart", stop)
      document.removeEventListener("gesturechange", stop)
      window.removeEventListener("keydown", key)
      if (st.timer !== null) window.clearTimeout(st.timer)
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current)
    }
  }, [])

  function rel(e: { clientX: number; clientY: number }): Pt {
    const { left, top } = size()
    return { x: e.clientX - left, y: e.clientY - top }
  }

  function codeAt(x: number, y: number): string | null {
    const el = document.elementFromPoint(x, y)?.closest("[data-code]")
    const code = el?.getAttribute("data-code") ?? null
    return code && names[code] ? code : null
  }

  function showLabel(cx: number, cy: number, touch: boolean) {
    const { left, top } = size()
    const code = codeAt(cx, cy)
    setLabel(code ? { code, x: cx - left, y: cy - top, touch } : null)
  }

  function clearTimer() {
    const st = press.current
    if (st.timer !== null) {
      window.clearTimeout(st.timer)
      st.timer = null
    }
  }

  function flip(code: string) {
    const was = visited.has(code)
    onToggle(code)
    setToast(`${names[code]} ${was ? "quitado" : "marcado"}`)
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS)
  }

  function onDown(e: RPointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = rel(e)
    ptrs.current.set(e.pointerId, p)
    const st = press.current
    clearTimer()

    if (ptrs.current.size === 1) {
      st.mode = "pending"
      st.start = p
      st.last = { x: e.clientX, y: e.clientY }
      st.t = Date.now()
      st.code = codeAt(e.clientX, e.clientY)
      st.view = view.current
      st.touch = e.pointerType !== "mouse"
      st.timer = window.setTimeout(() => {
        st.timer = null
        if (st.mode === "pending") {
          st.mode = "peek"
          showLabel(st.last.x, st.last.y, st.touch)
        }
      }, HOLD_MS)
    } else if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()]
      st.mode = "pinch"
      st.pinchMid = midOf(a, b)
      st.pinchDist = distOf(a, b)
      st.pinchView = view.current
      setLabel(null)
    }
  }

  function onMove(e: RPointerEvent<HTMLDivElement>) {
    const st = press.current
    if (!ptrs.current.has(e.pointerId)) {
      if (e.pointerType === "mouse") showLabel(e.clientX, e.clientY, false)
      return
    }
    const p = rel(e)
    ptrs.current.set(e.pointerId, p)
    st.last = { x: e.clientX, y: e.clientY }
    const { w, h } = size()
    if (w === 0 || h === 0) return

    if (st.mode === "pinch" && ptrs.current.size >= 2) {
      const [a, b] = [...ptrs.current.values()]
      const z = clamp(st.pinchView.z * (distOf(a, b) / st.pinchDist), 1, MAX_Z)
      apply(anchored(toMap(st.pinchView, w, h, st.pinchMid), midOf(a, b), z, w, h))
    } else if (st.mode === "pending") {
      if (Math.hypot(p.x - st.start.x, p.y - st.start.y) > TAP_PX) {
        clearTimer()
        st.mode = "pan"
        st.start = p
        st.view = view.current
        setLabel(null)
      }
    } else if (st.mode === "pan") {
      const u = W / st.view.z / w
      apply({
        cx: st.view.cx - (p.x - st.start.x) * u,
        cy: st.view.cy - (p.y - st.start.y) * u,
        z: st.view.z,
      })
    } else if (st.mode === "peek") {
      showLabel(e.clientX, e.clientY, st.touch)
    }
  }

  function onUp(e: RPointerEvent<HTMLDivElement>) {
    const st = press.current
    if (!ptrs.current.delete(e.pointerId)) return
    clearTimer()

    if (ptrs.current.size === 0) {
      const wasTap = st.mode === "pending"
      st.mode = "idle"
      setLabel(null)
      if (wasTap && st.code) flip(st.code)
    } else if (ptrs.current.size === 1) {
      const [q] = [...ptrs.current.values()]
      st.mode = "pan"
      st.start = q
      st.view = view.current
      setLabel(null)
    }
  }

  function onCancel() {
    ptrs.current.clear()
    clearTimer()
    press.current.mode = "idle"
    setLabel(null)
  }

  function onLeave(e: RPointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && ptrs.current.size === 0) setLabel(null)
  }

  function zoomAt(p: Pt, factor: number) {
    const { w, h } = size()
    if (w === 0 || h === 0) return
    const v = view.current
    const z = clamp(v.z * factor, 1, MAX_Z)
    apply(anchored(toMap(v, w, h, p), p, z, w, h))
  }

  function onWheel(e: RWheelEvent<HTMLDivElement>) {
    zoomAt(rel(e), Math.exp(-e.deltaY * 0.0025))
  }

  function zoomBy(factor: number) {
    const { w, h } = size()
    zoomAt({ x: w / 2, y: h / 2 }, factor)
  }

  const width = box.current?.clientWidth ?? 320
  const labelX = label ? clamp(label.x, 70, Math.max(70, width - 70)) : 0
  const labelY = label ? Math.max(label.y - (label.touch ? 52 : 16), 36) : 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Mapa de ${continent}`}
      className="fixed inset-0 z-50 flex touch-none select-none flex-col bg-[#0e2250] text-white [-webkit-touch-callout:none]"
    >
      <header className="flex items-center gap-3 px-4 pb-3 pt-[calc(env(safe-area-inset-top)_+_0.75rem)]">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 items-center gap-2 rounded-full bg-white/10 pl-3 pr-4 text-sm font-medium active:bg-white/20"
        >
          <X className="h-4 w-4" />
          Cerrar
        </button>
        <div className="min-w-0">
          <p className="truncate font-medium">{continent}</p>
          <p className="text-xs text-white/60">
            {seen} de {total} · {pct}%
          </p>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={box}
          className="h-full w-full"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onCancel}
          onPointerLeave={onLeave}
          onWheel={onWheel}
          onContextMenu={(e) => e.preventDefault()}
        >
          <ContinentMap
            svgRef={svg}
            shapes={shapes}
            membership={membership}
            continent={continent}
            frame={frame}
            visited={visited}
            interactive
            active={label?.code ?? null}
            className="block h-full w-full"
          />
          {label && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white shadow-lg"
              style={{ left: labelX, top: labelY }}
            >
              {names[label.code]}
              {visited.has(label.code) ? " ✓" : ""}
            </div>
          )}
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

        {toast && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <div className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-white shadow-lg">
              {toast}
            </div>
          </div>
        )}
      </div>

      <p className="px-4 pb-[calc(env(safe-area-inset-bottom)_+_0.75rem)] pt-3 text-center text-xs text-white/50">
        Pellizca para ampliar · arrastra para mover · toca para marcar · mantén el
        dedo para ver el nombre
      </p>
    </div>
  )
}