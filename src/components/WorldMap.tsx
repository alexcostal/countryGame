import { memo, useMemo, type CSSProperties, type Ref } from "react"
import type { Geometry } from "@/game/shapes"
import { buildWorldPaths } from "@/game/worldMap"

const DONE = "#009999"
const EMPTY = "#ffffff"

interface Props {
  geometries: Record<string, Geometry>
  completed: string[]
  selected?: string | null
  svgRef?: Ref<SVGSVGElement>
  className?: string
  style?: CSSProperties
}

export const WorldMap = memo(function WorldMap({
  geometries,
  completed,
  selected,
  svgRef,
  className,
  style,
}: Props) {
  const paths = useMemo(() => buildWorldPaths(geometries), [geometries])
  const done = useMemo(() => new Set(completed), [completed])
  const chosen = paths.find((p) => p.code === selected)

  return (
    <svg
      ref={svgRef}
      viewBox="0 6 360 142"
      className={className}
      style={style}
      role="img"
      aria-label="Mapamundi político"
    >
      {paths.map(({ code, d }) => (
        <path
          key={code}
          data-code={code}
          d={d}
          fill={done.has(code) ? DONE : EMPTY}
          fillRule="evenodd"
          stroke="#000000"
          strokeWidth={0.7}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {paths
        .filter((p) => p.small)
        .map(({ code, d }) => (
          <path
            key={`hit-${code}`}
            data-code={code}
            d={d}
            fill="none"
            stroke="transparent"
            strokeWidth={14}
            vectorEffect="non-scaling-stroke"
            pointerEvents="stroke"
          />
        ))}
      {chosen && (
        <path
          d={chosen.d}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2.5}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      )}
    </svg>
  )
})