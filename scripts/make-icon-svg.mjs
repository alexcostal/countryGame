import { readFileSync, writeFileSync } from "node:fs"

const land = readFileSync("scripts/land-path.txt", "utf8")
const S = 2.37
const LON = -15
const LAT = 15
const tx = (256 - (LON + 180) * S).toFixed(2)
const ty = (256 - (90 - LAT) * S).toFixed(2)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="o" cx="35%" cy="30%" r="80%">
      <stop offset="0" stop-color="#6fd6ff"/>
      <stop offset="0.55" stop-color="#1f93e6"/>
      <stop offset="1" stop-color="#0b5aa8"/>
    </radialGradient>
    <radialGradient id="s" cx="38%" cy="32%" r="75%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="#031447" stop-opacity="0.55"/>
    </radialGradient>
    <clipPath id="c"><circle cx="256" cy="256" r="178"/></clipPath>
  </defs>
  <rect width="512" height="512" fill="#0e2250"/>
  <circle cx="256" cy="256" r="190" fill="#e8f4ff" fill-opacity="0.9"/>
  <circle cx="256" cy="256" r="178" fill="url(#o)"/>
  <g clip-path="url(#c)">
    <g transform="translate(${tx} ${ty}) scale(${S})">
      <path d="${land}" fill="#9be04b" stroke="#9be04b" stroke-width="0.5" stroke-linejoin="round" fill-rule="evenodd"/>
    </g>
    <circle cx="256" cy="256" r="178" fill="url(#s)"/>
  </g>
</svg>
`

writeFileSync("public/icon.svg", svg)
console.log("public/icon.svg generado")