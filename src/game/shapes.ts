export type Position = number[]
export type Polygon = Position[][]
export type Geometry =
    | { type: "Polygon"; coordinates: Polygon }
    | { type: "MultiPolygon"; coordinates: Polygon[] }

interface Box {
    minX: number
    maxX: number
    minY: number
    maxY: number
}

function boxOf(polygons: Polygon[]): Box {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const polygon of polygons) {
        for (const [x, y] of polygon[0]) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
        }
    }
    return { minX, maxX, minY, maxY }
}

const area = (b: Box) => (b.maxX - b.minX) * (b.maxY - b.minY)

function mainPolygons(geometry: Geometry): Polygon[] {
    const all =
        geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates
    if (all.length <= 1) return all

    const boxes = all.map((p) => boxOf([p]))
    let main = 0
    boxes.forEach((b, i) => {
        if (area(b) > area(boxes[main])) main = i
    })

    const m = boxes[main]
    const reach = 1.5 * Math.max(m.maxX - m.minX, m.maxY - m.minY)
    const cx = (m.minX + m.maxX) / 2
    const cy = (m.minY + m.maxY) / 2

    return all.filter((_, i) => {
        const b = boxes[i]
        return (
            Math.abs((b.minX + b.maxX) / 2 - cx) <= reach &&
            Math.abs((b.minY + b.maxY) / 2 - cy) <= reach
        )
    })
}

export function buildShape(geometry: Geometry) {
    const polygons = mainPolygons(geometry)
    const { minX, maxX, minY, maxY } = boxOf(polygons)
    const k = Math.cos((((minY + maxY) / 2) * Math.PI) / 180)

    const d = polygons
        .flatMap((polygon) =>
            polygon.map(
                (ring) =>
                    ring
                        .map(
                            ([x, y], i) =>
                                `${i === 0 ? "M" : "L"}${((x - minX) * k).toFixed(3)} ${(maxY - y).toFixed(3)}`,
                        )
                        .join("") + "Z",
            ),
        )
        .join("")

    const project = (lng: number, lat: number) => ({
        x: (lng - minX) * k,
        y: maxY - lat,
    })

    return { d, width: (maxX - minX) * k, height: maxY - minY, project }
}