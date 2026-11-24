import { readFileSync } from "node:fs"

const plain = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

const [continent = "oceania", skip = ""] = process.argv.slice(2)
const text = readFileSync("src/data/countries.ts", "utf8")
const list = text
  .split("\n")
  .filter((l) => l.trim().startsWith("{"))
  .map((l) => JSON.parse(l.trim().replace(/,$/, "")))

const codes = list
  .filter((c) => plain(c.continent) === plain(continent) && c.code !== skip)
  .map((c) => c.code)

console.log("countrygame2:|trips=" + codes.join(","))