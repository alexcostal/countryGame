import { DIRECTION_LABELS, octant } from "@/game/geo"

export function DirectionArrow({ bearing }: { bearing: number }) {
  const i = octant(bearing)
  return (
    <span
      role="img"
      aria-label={DIRECTION_LABELS[i]}
      className="inline-block text-lg leading-none"
      style={{ transform: `rotate(${i * 45}deg)` }}
    >
      ↑
    </span>
  )
}