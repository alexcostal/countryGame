import { useMemo } from "react"
import { buildShape, placeMarker, type Geometry } from "@/game/shapes"

interface Point {
  lat: number
  lng: number
}

interface Props {
  geometry: Geometry
  className?: string
  marker?: Point
  focus?: Point
  showAll?: boolean
}

export function CountrySilhouette({
  geometry,
  className,
  marker,
  focus,
  showAll = false,
}: Props) {
  const focusLat = focus?.lat
  const focusLng = focus?.lng
  const markerLat = marker?.lat
  const markerLng = marker?.lng

  const shape = useMemo(
    () =>
      buildShape(
        geometry,
        focusLat === undefined || focusLng === undefined
          ? undefined
          : { lat: focusLat, lng: focusLng },
        showAll,
      ),
    [geometry, focusLat, focusLng, showAll],
  )

  const dot = useMemo(() => {
    if (markerLat === undefined || markerLng === undefined) return null
    const placed = placeMarker(
      shape.polygons,
      { lat: markerLat, lng: markerLng },
      shape.span,
    )
    return placed ? shape.project(placed.lng, placed.lat) : null
  }, [shape, markerLat, markerLng])

  const r = Math.max(shape.width, shape.height) * 0.035
  const pad = r * 1.3

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${shape.width + pad * 2} ${shape.height + pad * 2}`}
      className={className}
      role="img"
      aria-label="Silueta del país"
      fill="currentColor"
    >
      <path
        d={shape.d}
        fillRule="evenodd"
        stroke={showAll ? "currentColor" : "none"}
        strokeWidth={1.2}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
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