import type { CSSProperties } from "react"
import { DOG_ASPECT, DOG_FRAMES } from "@/data/dogSprite"

const DOG_H = 40
const DOG_W = Math.round(DOG_H * DOG_ASPECT)
const SRC = `${import.meta.env.BASE_URL}perro-strip.png`

export function DogRow({ durationMs }: { durationMs: number }) {
  return (
    <li
      role="status"
      aria-label="Comprobando…"
      className="relative h-11 overflow-hidden rounded-xl border bg-background"
    >
      <div
        className="dog-run absolute bottom-0.5"
        style={
          {
            width: DOG_W,
            height: DOG_H,
            "--dog-w": `${DOG_W}px`,
            animationDuration: `${durationMs}ms`,
          } as CSSProperties
        }
      >
        <div
          className="dog-sprite h-full w-full"
          style={
            {
              backgroundImage: `url(${SRC})`,
              backgroundSize: `${DOG_FRAMES * 100}% 100%`,
              "--dog-n": DOG_FRAMES,
            } as CSSProperties
          }
        />
      </div>
    </li>
  )
}