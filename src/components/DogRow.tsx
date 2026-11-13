export function DogRow({ durationMs }: { durationMs: number }) {
  return (
    <li
      role="status"
      aria-label="Comprobando…"
      className="relative h-9 overflow-hidden rounded-md border bg-background"
    >
      <svg
        className="dog-run absolute top-0 h-9 w-14 text-foreground"
        style={{ animationDuration: `${durationMs}ms` }}
        viewBox="0 0 64 40"
        fill="currentColor"
        aria-hidden="true"
      >
        <path className="dog-tail" d="M15 18Q4 17 6 6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
        <rect className="dog-leg-a" x="17" y="22" width="4" height="14" rx="2" />
        <rect className="dog-leg-b" x="22" y="22" width="4" height="14" rx="2" />
        <ellipse cx="30" cy="20" rx="16" ry="8" />
        <rect className="dog-leg-b" x="36" y="22" width="4" height="14" rx="2" />
        <rect className="dog-leg-a" x="41" y="22" width="4" height="14" rx="2" />
        <path d="M44 14L46 3L51 10Z" />
        <circle cx="49" cy="13" r="6.5" />
        <ellipse cx="56" cy="15.5" rx="5.5" ry="3.4" />
        <circle cx="51" cy="11.5" r="1.2" fill="var(--background)" />
        <path d="M57 18.5Q58.5 23 55.5 22.5Z" fill="#e5484d" />
      </svg>
    </li>
  )
}