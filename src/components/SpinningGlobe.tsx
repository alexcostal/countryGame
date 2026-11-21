import { useEffect, useMemo, useRef } from "react"
import {
  geoArea,
  geoCentroid,
  geoContains,
  geoDistance,
  geoOrthographic,
  geoPath,
} from "d3-geo"
import type { MultiPolygon as GeoMultiPolygon } from "geojson"
import type { Geometry } from "@/game/shapes"

const DONE = "#009999"
const EMPTY = "#ffffff"
const HILITE = "#f59e0b"
const STEP = 0.35
const SKIP = new Set(["AQ"])
const SPEED = 9
const TILT = -18
const START = 15
const FRAME_MS = 32
const MAX_TILT = 70
const FRICTION = 2.5
const MAX_VEL = 400
const TAP_PX = 8
const TAP_MS = 500
const SMALL_SR = 0.0006
const NEAR_RAD = 0.06

type Pos = number[]
type Poly = Pos[][]

interface Shape {
  code: string
  object: GeoMultiPolygon
  centroid: [number, number]
  small: boolean
}

function thin(ring: Pos[]): Pos[] {
  if (ring.length < 60) return ring
  const out = [ring[0]]
  let last = ring[0]
  for (let i = 1; i < ring.length - 1; i++) {
    const p = ring[i]
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= STEP) {
      out.push(p)
      last = p
    }
  }
  out.push(ring[ring.length - 1])
  return out.length >= 4 ? out : ring
}

function fixPolygon(poly: Poly): Poly {
  const thinned = poly.map(thin)
  const area = geoArea({ type: "Polygon", coordinates: thinned })
  return area > 2 * Math.PI ? thinned.map((ring) => [...ring].reverse()) : thinned
}

function prepare(geometries: Record<string, Geometry>): Shape[] {
  const out: Shape[] = []
  for (const [code, g] of Object.entries(geometries)) {
    if (SKIP.has(code)) continue
    const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates
    const object: GeoMultiPolygon = {
      type: "MultiPolygon",
      coordinates: polys.map(fixPolygon),
    }
    out.push({
      code,
      object,
      centroid: geoCentroid(object),
      small: geoArea(object) < SMALL_SR,
    })
  }
  return out
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))

interface Props {
  geometries: Record<string, Geometry>
  completed: string[]
  className?: string
  interactive?: boolean
  selected?: string | null
  onSelect?: (code: string | null) => void
}

export function SpinningGlobe({
  geometries,
  completed,
  className,
  interactive = false,
  selected = null,
  onSelect,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const rot = useRef({ lon: START, lat: TILT, vel: 0 })
  const selectedRef = useRef<string | null>(null)
  const onSelectRef = useRef(onSelect)
  const drawRef = useRef<(() => void) | null>(null)
  const shapes = useMemo(() => prepare(geometries), [geometries])
  const done = useMemo(() => new Set(completed), [completed])

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    selectedRef.current = selected
    drawRef.current?.()
  }, [selected])

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const size = canvas.clientWidth || 300
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const radius = size / 2 - 6
    const projection = geoOrthographic()
      .translate([size / 2, size / 2])
      .scale(radius)
      .clipAngle(90)
      .precision(1)
    const path = geoPath(projection, ctx)

    const ocean = ctx.createRadialGradient(
      size * 0.35,
      size * 0.3,
      0,
      size * 0.5,
      size * 0.5,
      radius * 1.1,
    )
    ocean.addColorStop(0, "#6fd6ff")
    ocean.addColorStop(0.55, "#1f93e6")
    ocean.addColorStop(1, "#0b5aa8")

    const shade = ctx.createRadialGradient(
      size * 0.38,
      size * 0.32,
      0,
      size * 0.5,
      size * 0.5,
      radius * 1.05,
    )
    shade.addColorStop(0, "rgba(255,255,255,0.28)")
    shade.addColorStop(0.45, "rgba(255,255,255,0)")
    shade.addColorStop(1, "rgba(3,20,71,0.5)")

    function draw() {
      if (!ctx) return
      projection.rotate([rot.current.lon, rot.current.lat, 0])
      ctx.clearRect(0, 0, size, size)

      ctx.beginPath()
      path({ type: "Sphere" })
      ctx.fillStyle = ocean
      ctx.fill()

      ctx.lineWidth = 0.5
      ctx.lineJoin = "round"
      ctx.strokeStyle = "rgba(0,0,0,0.55)"
      for (const s of shapes) {
        ctx.beginPath()
        path(s.object)
        ctx.fillStyle = done.has(s.code) ? DONE : EMPTY
        ctx.fill()
        ctx.stroke()
      }

      ctx.beginPath()
      path({ type: "Sphere" })
      ctx.fillStyle = shade
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = "rgba(255,255,255,0.55)"
      ctx.stroke()

      const chosen = selectedRef.current
      if (chosen) {
        const s = shapes.find((x) => x.code === chosen)
        if (s) {
          ctx.beginPath()
          path(s.object)
          ctx.lineWidth = 3
          ctx.lineJoin = "round"
          ctx.strokeStyle = HILITE
          ctx.stroke()
        }
      }
    }

    drawRef.current = draw

    function pick(clientX: number, clientY: number) {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const x = ((clientX - rect.left) / rect.width) * size
      const y = ((clientY - rect.top) / rect.height) * size

      if (Math.hypot(x - size / 2, y - size / 2) > radius) {
        onSelectRef.current?.(null)
        return
      }

      projection.rotate([rot.current.lon, rot.current.lat, 0])
      const ll = projection.invert?.([x, y])
      if (!ll || !Number.isFinite(ll[0]) || !Number.isFinite(ll[1])) {
        onSelectRef.current?.(null)
        return
      }

      let code: string | null = null
      for (const s of shapes) {
        if (geoContains(s.object, ll)) {
          code = s.code
          break
        }
      }
      if (!code) {
        let best = NEAR_RAD
        for (const s of shapes) {
          if (!s.small) continue
          const d = geoDistance(ll, s.centroid)
          if (d < best) {
            best = d
            code = s.code
          }
        }
      }
      onSelectRef.current?.(code)
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let dragging = false
    let pid = -1
    let lastX = 0
    let lastY = 0
    let lastT = 0
    let startX = 0
    let startY = 0
    let startT = 0
    let travel = 0

    const down = (e: PointerEvent) => {
      if (dragging) return
      dragging = true
      pid = e.pointerId
      lastX = e.clientX
      lastY = e.clientY
      lastT = performance.now()
      startX = e.clientX
      startY = e.clientY
      startT = lastT
      travel = 0
      rot.current.vel = 0
      canvas.setPointerCapture(e.pointerId)
    }

    const move = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pid) return
      const now = performance.now()
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      const dt = Math.max(1, now - lastT) / 1000
      const k = 180 / (Math.PI * radius)
      const r = rot.current
      travel = Math.max(travel, Math.hypot(e.clientX - startX, e.clientY - startY))
      r.lon += dx * k
      r.lat = clamp(r.lat - dy * k, -MAX_TILT, MAX_TILT)
      r.vel = clamp(0.6 * r.vel + 0.4 * ((dx * k) / dt), -MAX_VEL, MAX_VEL)
      lastX = e.clientX
      lastY = e.clientY
      lastT = now
      if (reduced) draw()
    }

    const up = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pid) return
      dragging = false
      pid = -1
      const now = performance.now()
      if (travel < TAP_PX && now - startT < TAP_MS) {
        rot.current.vel = 0
        pick(e.clientX, e.clientY)
      } else if (reduced || now - lastT > 100) {
        rot.current.vel = 0
      }
    }

    const cancel = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pid) return
      dragging = false
      pid = -1
      rot.current.vel = 0
    }

    if (interactive) {
      canvas.addEventListener("pointerdown", down)
      canvas.addEventListener("pointermove", move)
      canvas.addEventListener("pointerup", up)
      canvas.addEventListener("pointercancel", cancel)
    }

    const cleanup = () => {
      canvas.removeEventListener("pointerdown", down)
      canvas.removeEventListener("pointermove", move)
      canvas.removeEventListener("pointerup", up)
      canvas.removeEventListener("pointercancel", cancel)
      drawRef.current = null
    }

    if (reduced) {
      draw()
      return cleanup
    }

    let frame = 0
    let lastTime = 0
    let lastDraw = 0
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const dt = lastTime ? Math.min(0.1, (now - lastTime) / 1000) : 0
      lastTime = now
      if (!dragging) {
        const r = rot.current
        const base = selectedRef.current ? 0 : SPEED
        r.lon = (r.lon + (base + r.vel) * dt) % 360
        r.vel *= Math.exp(-FRICTION * dt)
        r.lat += (TILT - r.lat) * Math.min(1, dt * 1.2)
      }
      if (!dragging && now - lastDraw < FRAME_MS) return
      lastDraw = now
      draw()
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      cleanup()
    }
  }, [shapes, done, interactive])

  return (
    <canvas
      ref={ref}
      className={className}
      style={interactive ? { touchAction: "none", cursor: "grab" } : undefined}
      role="img"
      aria-label="Globo terráqueo con los países que has completado en verde"
    />
  )
}