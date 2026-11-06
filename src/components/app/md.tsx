import type { ReactNode } from 'react'

/** tiny formatter for news bodies: ## heading, **bold**, _italic_, [text](https://link) — the editor toolbar inserts exactly these marks */
const inline = (s: string, key: string): ReactNode[] => {
  const out: ReactNode[] = []
  const re = /\*\*(.+?)\*\*|_(.+?)_|\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index))
    if (m[1]) out.push(<strong key={`${key}b${i}`} className="font-semibold text-black">{m[1]}</strong>)
    else if (m[2]) out.push(<em key={`${key}i${i}`}>{m[2]}</em>)
    else out.push(<a key={`${key}a${i}`} href={m[4]} target="_blank" rel="noreferrer" className="text-blue-00 underline">{m[3]}</a>)
    last = m.index + m[0].length
    i++
  }
  if (last < s.length) out.push(s.slice(last))
  return out
}

export function Md({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) =>
        line.startsWith('## ') ? <h4 key={i} className="mt-[6px] text-[15px] font-semibold text-black">{inline(line.slice(3), `h${i}`)}</h4> : line.trim() ? <p key={i}>{inline(line, `p${i}`)}</p> : <span key={i} className="block h-[4px]" />,
      )}
    </>
  )
}
