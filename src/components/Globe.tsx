import { LAND_PATH } from "@/data/land"

const S = 1.2516
const TX = -76.5
const TY = 36.1

export function Globe() {
  return (
    <svg viewBox="0 0 260 260" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="ocean" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#6fd6ff" />
          <stop offset="55%" stopColor="#1f93e6" />
          <stop offset="100%" stopColor="#0b5aa8" />
        </radialGradient>
        <radialGradient id="shade" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#031447" stopOpacity="0.55" />
        </radialGradient>
        <clipPath id="globe-clip">
          <circle cx="130" cy="130" r="94" />
        </clipPath>
        <path id="land" d={LAND_PATH} />
      </defs>

      <circle cx="130" cy="130" r="126" fill="#4aa8ff" fillOpacity="0.1" />
      <circle cx="130" cy="130" r="112" fill="#4aa8ff" fillOpacity="0.12" />
      <ellipse
        cx="130"
        cy="136"
        rx="128"
        ry="30"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.28"
        strokeWidth="1.5"
        transform="rotate(-14 130 136)"
      />
      <circle cx="130" cy="130" r="100" fill="#e8f4ff" fillOpacity="0.9" />
      <circle cx="130" cy="130" r="94" fill="url(#ocean)" />

      <g clipPath="url(#globe-clip)">
        <g transform={`translate(${TX} ${TY}) scale(${S})`}>
          <g className="earth-map">
            <use
              href="#land"
              fill="#9be04b"
              stroke="#9be04b"
              strokeWidth="0.5"
              strokeLinejoin="round"
              fillRule="evenodd"
            />
            <use
              href="#land"
              x="360"
              fill="#9be04b"
              stroke="#9be04b"
              strokeWidth="0.5"
              strokeLinejoin="round"
              fillRule="evenodd"
            />
          </g>
        </g>
        <circle cx="130" cy="130" r="94" fill="url(#shade)" />
      </g>
    </svg>
  )
}