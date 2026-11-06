import { useRef } from 'react'

/** Segmented digit input (national ID 1-4-5-2-1, phone 3-3-4 …): auto-advance, backspace goes back, paste fills all boxes */
export default function DigitBoxes({ value, groups, onChange, label, invalid }: { value: string; groups: number[]; onChange: (v: string) => void; label: string; invalid?: boolean }) {
  const total = groups.reduce((a, b) => a + b, 0)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(total, ' ').slice(0, total).split('')
  const set = (i: number, d: string) => {
    const next = digits.slice()
    next[i] = d || ' '
    onChange(next.join('').replace(/\s+$/g, ''))
  }
  let idx = 0
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-[4px]">
      {groups.map((g, gi) => (
        <div key={gi} className="flex items-center gap-[4px]">
          {gi > 0 && <span className="px-[2px] text-gray-20">-</span>}
          {Array.from({ length: g }, () => {
            const i = idx++
            return (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el
                }}
                aria-label={`${label} หลักที่ ${i + 1}`}
                inputMode="numeric"
                maxLength={1}
                value={digits[i].trim()}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, '').slice(-1)
                  set(i, d)
                  if (d && i < total - 1) refs.current[i + 1]?.focus()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !digits[i].trim() && i > 0) refs.current[i - 1]?.focus()
                  if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
                  if (e.key === 'ArrowRight' && i < total - 1) refs.current[i + 1]?.focus()
                }}
                onPaste={(e) => {
                  const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, total)
                  if (!t) return
                  e.preventDefault()
                  onChange(t)
                  refs.current[Math.min(t.length, total - 1)]?.focus()
                }}
                className={`h-[34px] w-[24px] rounded-[6px] border bg-white text-center text-[14px] outline-none transition-colors focus:border-blue-00 ${invalid ? 'border-red-00' : 'border-gray-line'}`}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
