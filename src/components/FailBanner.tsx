import { useEffect, useState } from "react"
import { X } from "lucide-react"

interface Props {
  title: string
  detail: string
  durationMs?: number
}

export function FailBanner({ title, detail, durationMs = 3000 }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), durationMs)
    return () => window.clearTimeout(id)
  }, [durationMs])

  if (!visible) return null

  return (
    <div
      role="alert"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)_+_0.75rem)]"
    >
      <div
        className="banner-rise flex w-full max-w-md items-center gap-3 rounded-xl border border-red-600 bg-background p-3 shadow-lg"
        style={{ animationDuration: `${durationMs}ms` }}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-600">
          <X className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-red-700 dark:text-red-400">
            {title}
          </p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
  )
}