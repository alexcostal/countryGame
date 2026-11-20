import { useEffect, useMemo, useRef } from "react"
import { geoArea, geoOrthographic, geoPath } from "d3-geo"
import type { MultiPolygon as GeoMultiPolygon } from "geojson"
import type { Geometry } from "@/game/shapes"

const DONE = "#009999"
const EMPTY = "#ffffff"
const STEP = 0.35
const SKIP = new Set(["AQ"])
const SPEED = 9
const TILT = -18
const START = 15
const FRAME_MS = 32

type Pos = number[]
type Poly = Pos[][]

interface Shape {
  code: string
  object: GeoMultiPolygon
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
    out.push({
      code,
      object: { type: "MultiPolygon", coordinates: polys.map(fixPolygon) },
    })
  }
  return out
}

interface Props {
  geometries: Record<string, Geometry>
  completed: string[]
  className?: string
}

export function SpinningGlobe({ geometries, completed, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const shapes = useMemo(() => prepare(geometries), [geometries])
  const done = useMemo(() => new Set(completed), [completed])

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

    function draw(rotation: number) {
      if (!ctx) return
      projection.rotate([rotation, TILT, 0])
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
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw(START)
      return
    }

    let frame = 0
    let startTime: number | null = null
    let lastDraw = 0
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      if (now - lastDraw < FRAME_MS) return
      lastDraw = now
      if (startTime === null) startTime = now
      draw(START + ((now - startTime) / 1000) * SPEED)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [shapes, done])

  return (
    <canvas
      ref={ref}
      className={className}
      role="img"
      aria-label="Globo terráqueo girando con todos los países en verde"
    />
  )
}