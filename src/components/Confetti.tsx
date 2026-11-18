import { useState, type CSSProperties } from "react"

const COLORS = ["#009999", "#7ee8b4", "#ffd166", "#ef476f", "#118ab2", "#a78bfa"]

interface Piece {
  left: number
  delay: number
  duration: number
  size: number
  color: string
  drift: number
  rotate: number
}

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.6 + Math.random() * 1.3,
    size: 7 + Math.random() * 7,
    color: COLORS[i % COLORS.length],
    drift: (Math.random() - 0.5) * 140,
    rotate: 360 + Math.random() * 540,
  }))
}

export function Confetti({ count = 60 }: { count?: number }) {
  const [pieces] = useState(() => makePieces(count))

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.6,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--drift": `${p.drift}px`,
              "--rot": `${p.rotate}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}