import { useMemo, type CSSProperties } from "react"
import type { Geometry } from "@/game/shapes"
import { buildWorldPaths } from "@/game/worldMap"

const DONE = "#009999"
const EMPTY = "#ffffff"

interface Props {
  geometries: Record<string, Geometry>
  completed: string[]
  className?: string
  style?: CSSProperties
}

export function WorldMap({ geometries, completed, className, style }: Props) {
  const paths = useMemo(() => buildWorldPaths(geometries), [geometries])
  const done = useMemo(() => new Set(completed), [completed])

  return (
    <svg
      viewBox="0 6 360 142"
      className={className}
      style={style}
      role="img"
      aria-label="Mapamundi político"
    >
      {paths.map(({ code, d }) => (
        <path
          key={code}
          d={d}
          fill={done.has(code) ? DONE : EMPTY}
          fillRule="evenodd"
          stroke="#000000"
          strokeWidth={0.7}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}