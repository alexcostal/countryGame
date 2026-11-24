import { useRef, useState } from "react"
import type { PointerEvent as RPointerEvent } from "react"
import { Maximize2 } from "lucide-react"
import { ContinentMap } from "@/components/ContinentMap"
import type { Frame } from "@/data/continentFrames"
import type { SphereShape } from "@/game/sphere"

const TAP_PX = 10
const LONG_PRESS_MS = 450
const LABEL_MIN_TOP = 34

interface Props {
  shapes: SphereShape[]
  membership: Record<string, string>
  continent: string
  frame: Frame
  visited: ReadonlySet<string>
  names: Record<string, string>
  onToggle: (code: string) => void
  onExpand?: () => void
}

interface Hover {
  code: string
  x: number
  y: number
}

interface Press {
  x: number
  y: number
  t: number
  code: string | null
  moved: boolean
}

export function InteractiveContinentMap({
  shapes,
  membership,
  continent,
  frame,
  visited,
  names,
  onToggle,
  onExpand,
}: Props) {
  const box = useRef<HTMLDivElement>(null)
  const press = useRef<Press | null>(null)
  const [hover, setHover] = useState<Hover | null>(null)

  function codeAt(x: number, y: number): string | null {
    const el = document.elementFromPoint(x, y)?.closest("[data-code]")
    const code = el?.getAttribute("data-code") ?? null
    return code && names[code] ? code : null
  }

  function show(e: RPointerEvent<HTMLDivElement>) {
    const r = box.current?.getBoundingClientRect()
    if (!r) return
    const code = codeAt(e.clientX, e.clientY)
    if (!code) {
      setHover(null)
      return
    }
    setHover({ code, x: e.clientX - r.left, y: e.clientY - r.top })
  }

  function onDown(e: RPointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    press.current = {
      x: e.clientX,
      y: e.clientY,
      t: Date.now(),
      code: codeAt(e.clientX, e.clientY),
      moved: false,
    }
    show(e)
  }

  function onMove(e: RPointerEvent<HTMLDivElement>) {
    const p = press.current
    if (p) {
      if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) > TAP_PX) {
        p.moved = true
      }
      show(e)
    } else if (e.pointerType === "mouse") {
      show(e)
    }
  }

  function onUp() {
    const p = press.current
    press.current = null
    setHover(null)
    if (p && !p.moved && p.code && Date.now() - p.t < LONG_PRESS_MS) {
      onToggle(p.code)
    }
  }

  function onCancel() {
    press.current = null
    setHover(null)
  }

  function onLeave(e: RPointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && !press.current) setHover(null)
  }

  const width = box.current?.clientWidth ?? 320
  const labelX = hover ? Math.min(Math.max(hover.x, 70), width - 70) : 0
  const labelY = hover ? Math.max(hover.y - 14, LABEL_MIN_TOP) : 0

  return (
    <div className="relative">
      <div
        ref={box}
        className="relative select-none [-webkit-touch-callout:none]"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
        onPointerLeave={onLeave}
        onContextMenu={(e) => e.preventDefault()}
      >
        <ContinentMap
          shapes={shapes}
          membership={membership}
          continent={continent}
          frame={frame}
          visited={visited}
          interactive
          active={hover?.code ?? null}
          className="aspect-[5/3] w-full rounded-xl"
        />
        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white shadow-lg"
            style={{ left: labelX, top: labelY }}
          >
            {names[hover.code]}
            {visited.has(hover.code) ? " ✓" : ""}
          </div>
        )}
      </div>

      {onExpand && (
        <button
          type="button"
          onClick={onExpand}
          className="absolute right-2 top-2 flex h-9 items-center gap-1.5 rounded-full bg-[#0e2250]/90 px-3 text-xs font-medium text-white active:bg-[#0e2250]"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Ampliar
        </button>
      )}
    </div>
  )
}