import { useMemo } from "react"
import { buildShape, type Geometry } from "@/game/shapes"

interface Props {
  geometry: Geometry
  className?: string
  marker?: { lat: number; lng: number }
}

export function CountrySilhouette({ geometry, className, marker }: Props) {
  const shape = useMemo(() => buildShape(geometry), [geometry])
  const dot = marker ? shape.project(marker.lng, marker.lat) : null
  const r = Math.max(shape.width, shape.height) * 0.035

  return (
    <svg
      viewBox={`0 0 ${shape.width} ${shape.height}`}
      className={className}
      role="img"
      aria-label="Silueta del país"
      fill="currentColor"
    >
      <path d={shape.d} fillRule="evenodd" />
      {dot && (
        <circle
          cx={dot.x}
          cy={dot.y}
          r={r}
          fill="#ffffff"
          stroke="#111111"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  )
}