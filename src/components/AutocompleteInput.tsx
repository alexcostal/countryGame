import { useId, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { normalize } from "@/game/geo"

interface Props {
    options: string[]
    placeholder: string
    submitLabel: string
    onSubmit: (value: string) => void
}

export function AutocompleteInput({
    options,
    placeholder,
    submitLabel,
    onSubmit,
}: Props) {
    const [value, setValue] = useState("")
    const [open, setOpen] = useState(false)
    const [error, setError] = useState("")
    const listId = useId()

    const suggestions = useMemo(() => {
        const q = normalize(value)
        if (!q) return []
        const starts: string[] = []
        const contains: string[] = []
        for (const option of options) {
            const n = normalize(option)
            if (n.startsWith(q)) starts.push(option)
            else if (n.includes(q)) contains.push(option)
        }
        return [...starts, ...contains]
    }, [options, value])

    const showList = open && suggestions.length > 0

    function pick(option: string) {
        setValue(option)
        setOpen(false)
        setError("")
    }

    function submit() {
        const match = options.find((o) => normalize(o) === normalize(value))
        if (!match) {
            setError("Elige una opción de la lista.")
            return
        }
        onSubmit(match)
        setValue("")
        setOpen(false)
        setError("")
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="relative">
                {showList && (
                    <ul
                        id={listId}
                        role="listbox"
                        className="absolute bottom-full left-0 right-0 z-10 mb-1 flex max-h-72 flex-col gap-1 overflow-y-auto overscroll-contain rounded-md bg-muted p-1"
                    >
                        {suggestions.map((s) => (
                            <li key={s} role="option" aria-selected={false}>
                                <button
                                    type="button"
                                    className="w-full rounded-md border bg-background px-3 py-3 text-left text-base hover:bg-accent"
                                    onClick={() => pick(s)}
                                >
                                    {s}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <Input
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value)
                        setOpen(true)
                        setError("")
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") submit()
                    }}
                    placeholder={placeholder}
                    role="combobox"
                    aria-expanded={showList}
                    aria-controls={showList ? listId : undefined}
                    aria-autocomplete="list"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    enterKeyHint="go"
                    className="h-11 text-base select-text cursor-text"
                />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={submit}>{submitLabel}</Button>
        </div>
    )
}