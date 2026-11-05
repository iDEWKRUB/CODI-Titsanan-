import iconStar from '../../assets/builder/icon-star.svg'
import radioOff from '../../assets/builder/radio-off.svg'
import radioOn from '../../assets/builder/radio-on.svg'
import type { Question } from '../../data/surveyBuilder'
import Checkbox from '../ui/Checkbox'

export type Answers = Record<string, unknown>

const line =
  'h-[48px] w-[359px] max-w-full border-b border-dashed border-gray-20 bg-transparent text-[14px] font-light text-black outline-none placeholder:text-gray-20 focus:border-solid focus:border-blue-00'

export function isAnswered(q: Question, a: Answers) {
  const v = a[q.id]
  if (q.type === 'multi') return Array.isArray(v) && v.length > 0
  return v !== undefined && v !== '' && v !== null
}

function Radio({ checked, onSelect, label, name }: { checked: boolean; onSelect: () => void; label: string; name: string }) {
  return (
    <label className="flex min-h-[48px] cursor-pointer items-center gap-[24px] rounded-[8px] pr-[8px] transition-colors hover:bg-gray-subtle">
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="peer sr-only" />
      <span className="flex size-[48px] shrink-0 items-center justify-center rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-blue-00">
        <img src={checked ? radioOn : radioOff} alt="" width={24} height={24} />
      </span>
      <span className="text-[14px] font-medium text-black">{label}</span>
    </label>
  )
}

function StarFilled() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.6l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5-4.9-4.5 6.6-.8z" fill="#f2bb07" stroke="#f2bb07" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

/** One question card as the respondent sees it (Figma OSS-Survey/Answer/*) */
export default function AnswerQuestion({
  q,
  number,
  answers,
  onAnswer,
  error,
}: {
  q: Question
  number: number
  answers: Answers
  onAnswer: (key: string, v: unknown) => void
  error?: boolean
}) {
  const v = answers[q.id]
  const name = `q-${q.id}`

  if (q.type === 'title') {
    return (
      <div className="rounded-[12px] bg-white px-[24px] py-[16px]">
        <h3 className="text-[18px] font-semibold text-gray-30">{q.title}</h3>
        {q.description && <p className="mt-[4px] text-[12px] font-light text-gray-20">{q.description}</p>}
      </div>
    )
  }
  if (q.type === 'image') {
    return (
      <figure className="flex flex-col gap-[8px] rounded-[12px] bg-white p-[24px]">
        {q.imageUrl && <img src={q.imageUrl} alt={q.title || 'รูปภาพประกอบ'} className="max-h-[360px] w-full rounded-[8px] object-contain" />}
        {q.title && <figcaption className="text-[12px] font-light text-gray-20">{q.title}</figcaption>}
      </figure>
    )
  }

  const options = q.options
  return (
    <fieldset
      id={name}
      aria-invalid={error || undefined}
      className={`flex scroll-mt-[24px] flex-col gap-[12px] rounded-[12px] bg-white p-[24px] max-sm:p-[16px] ${error ? 'ring-2 ring-red-00/60' : ''}`}
    >
      <legend className="float-left w-full text-[16px] leading-[1.5] font-medium text-black">
        {number}. {q.title || 'คำถาม'}
        {q.required && <span className="ml-[6px] align-top text-[12px] text-red-00">*</span>}
      </legend>
      {q.description && <p className="text-[12px] font-light text-gray-20">{q.description}</p>}

      {q.type === 'short' && (
        <input aria-label={q.title} value={(v as string) ?? ''} onChange={(e) => onAnswer(q.id, e.target.value)} placeholder="พิมพ์คำตอบ..." className={line} />
      )}
      {q.type === 'paragraph' && (
        <textarea
          aria-label={q.title}
          rows={3}
          value={(v as string) ?? ''}
          onChange={(e) => onAnswer(q.id, e.target.value)}
          placeholder="พิมพ์คำตอบ..."
          className="w-full resize-y border-b border-dashed border-gray-20 bg-transparent py-[12px] text-[14px] font-light text-black outline-none placeholder:text-gray-20 focus:border-solid focus:border-blue-00"
        />
      )}

      {q.type === 'single' && (
        <div className="flex flex-col">
          {options.map((o) => (
            <Radio key={o.id} name={name} label={o.label} checked={v === o.id} onSelect={() => onAnswer(q.id, o.id)} />
          ))}
          {q.hasOther && (
            <div className="flex flex-wrap items-center gap-x-[12px]">
              <Radio name={name} label="อื่น ๆ" checked={v === 'other'} onSelect={() => onAnswer(q.id, 'other')} />
              {v === 'other' && <input autoFocus aria-label="ระบุอื่น ๆ" value={(answers[`${q.id}:other`] as string) ?? ''} onChange={(e) => onAnswer(`${q.id}:other`, e.target.value)} placeholder="โปรดระบุ" className={`${line} w-[300px]`} />}
            </div>
          )}
        </div>
      )}

      {q.type === 'multi' && (
        <div className="flex flex-col gap-[8px]">
          {[...options, ...(q.hasOther ? [{ id: 'other', label: 'อื่น ๆ', subQuestions: [] }] : [])].map((o) => {
            const list = (v as string[]) ?? []
            const on = list.includes(o.id)
            return (
              <div key={o.id} className="flex flex-col gap-[8px]">
                <label className="flex min-h-[48px] cursor-pointer items-center gap-[24px] rounded-[8px] hover:bg-gray-subtle">
                  <Checkbox size="big" label={o.label} checked={on} onChange={(c) => onAnswer(q.id, c ? [...list, o.id] : list.filter((x) => x !== o.id))} />
                  <span className="text-[14px] font-medium text-black">{o.label}</span>
                </label>
                {on && o.id === 'other' && (
                  <input aria-label="ระบุอื่น ๆ" value={(answers[`${q.id}:other`] as string) ?? ''} onChange={(e) => onAnswer(`${q.id}:other`, e.target.value)} placeholder="โปรดระบุ" className={`${line} ml-[46px]`} />
                )}
                {on &&
                  o.subQuestions.map((sq) => (
                    <div key={sq.id} className="pl-[48px] max-sm:pl-[16px]">
                      <label className="flex flex-wrap items-center gap-x-[24px] gap-y-[4px] rounded-[8px] bg-gray-subtle px-[12px] py-[12px]">
                        <span className="text-[14px] font-medium text-black">{sq.title || 'คำถามย่อย'}</span>
                        <input
                          value={(answers[`${q.id}:${sq.id}`] as string) ?? ''}
                          onChange={(e) => onAnswer(`${q.id}:${sq.id}`, e.target.value)}
                          placeholder="พิมพ์คำตอบ..."
                          inputMode={sq.unit ? 'decimal' : undefined}
                          className={`${line} w-[289px]`}
                        />
                        {sq.unit && <span className="text-[14px] font-light text-black">{sq.unit}</span>}
                      </label>
                    </div>
                  ))}
              </div>
            )
          })}
        </div>
      )}

      {q.type === 'scale' && (
        <div className="flex flex-col gap-[8px]">
          <div role="radiogroup" aria-label={q.title} className="flex items-end justify-center gap-[8px] overflow-x-auto py-[8px]">
            {q.minLabel && <span className="pb-[12px] text-[12px] font-light text-gray-20">{q.minLabel}</span>}
            {Array.from({ length: q.scaleMax - q.scaleMin + 1 }, (_, i) => q.scaleMin + i).map((n) => (
              <label key={n} className="flex min-w-[48px] cursor-pointer flex-col items-center gap-[4px]">
                <span className="text-[14px] font-medium text-gray-20">{n}</span>
                <input type="radio" name={name} checked={v === n} onChange={() => onAnswer(q.id, n)} className="peer sr-only" />
                <span className="flex size-[48px] items-center justify-center rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-blue-00">
                  <img src={v === n ? radioOn : radioOff} alt="" width={24} height={24} />
                </span>
              </label>
            ))}
            {q.maxLabel && <span className="pb-[12px] text-[12px] font-light text-gray-20">{q.maxLabel}</span>}
          </div>
        </div>
      )}

      {q.type === 'rating' && (
        <div role="radiogroup" aria-label={q.title} className="flex justify-center gap-[24px] overflow-x-auto pb-[12px] md:px-[104px]">
          {Array.from({ length: q.ratingMax }, (_, i) => i + 1).map((n) => (
            <label key={n} className="group flex min-w-[48px] flex-1 cursor-pointer flex-col items-center gap-[24px]">
              <span className="text-[14px] font-medium text-gray-20">{n}</span>
              <input type="radio" name={name} checked={v === n} onChange={() => onAnswer(q.id, n)} className="peer sr-only" />
              <span className="flex size-[32px] items-center justify-center rounded-full transition-transform group-hover:scale-110 peer-focus-visible:outline-2 peer-focus-visible:outline-blue-00">
                {typeof v === 'number' && n <= v ? <StarFilled /> : (
                  <span className="relative size-[24px]">
                    <img src={iconStar} alt="" className="absolute inset-[8.53%_10.16%_13.34%_8.59%] block max-w-none" />
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      )}

      {q.showNote && q.note && <p className="rounded-[8px] bg-gray-subtle px-[12px] py-[8px] text-[12px] font-light text-gray-30">หมายเหตุ: {q.note}</p>}
      {error && (
        <p role="alert" className="text-[12px] text-red-00">
          กรุณาตอบคำถามนี้
        </p>
      )}
    </fieldset>
  )
}
