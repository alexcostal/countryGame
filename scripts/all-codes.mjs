import { readFileSync } from "node:fs"

const text = readFileSync("src/data/countries.ts", "utf8")
const codes = [...text.matchAll(/"code":"([A-Z]{2})"/g)].map((m) => m[1])
console.log("countrygame1:" + codes.join(","))