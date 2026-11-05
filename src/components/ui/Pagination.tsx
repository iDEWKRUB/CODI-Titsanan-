import caretLeftActive from '../../assets/survey/icon-caret-left-active.svg'
import caretLeft from '../../assets/survey/icon-caret-left.svg'
import caretRightDisabled from '../../assets/survey/icon-caret-right-disabled.svg'
import caretRight from '../../assets/survey/icon-caret-right.svg'

type Props = { page: number; pageCount: number; onChange: (page: number) => void }

/** 1 2 3 … 16 — first 3, current ±1 and last page, with gaps collapsed to "…" */
function pageItems(page: number, count: number): (number | 'gap')[] {
  const keep = new Set([1, 2, 3, page - 1, page, page + 1, count])
  const out: (number | 'gap')[] = []
  for (let p = 1; p <= count; p++) {
    if (keep.has(p)) out.push(p)
    else if (out[out.length - 1] !== 'gap') out.push('gap')
  }
  return out
}

const pageBtn =
  'flex h-[28px] w-[30px] items-center justify-center rounded-[7px] font-urbanist text-[10px] leading-none font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-00'

/** Figma Resource/Component › Pagination (114:6176), version Default. */
export default function Pagination({ page, pageCount, onChange }: Props) {
  const canPrev = page > 1
  const canNext = page < pageCount
  return (
    <nav aria-label="เลือกหน้า" className="flex items-center gap-[8px]">
      <button
        type="button"
        aria-label="หน้าก่อนหน้า"
        disabled={!canPrev}
        onClick={() => onChange(page - 1)}
        className={`flex rounded-[7px] p-[7px] transition-colors ${canPrev ? 'bg-blue-bg hover:bg-blue-20' : 'cursor-not-allowed bg-[#eeeeef]'}`}
      >
        <img src={canPrev ? caretLeftActive : caretLeft} alt="" width={14} height={14} />
      </button>
      {pageItems(page, pageCount).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} aria-hidden="true" className={`${pageBtn} px-[2px] text-blue-00`}>
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? 'page' : undefined}
            aria-label={`หน้า ${p}`}
            onClick={() => onChange(p)}
            className={`${pageBtn} ${p === page ? 'bg-blue-00 text-white-soft' : 'bg-blue-bg text-blue-00 hover:bg-blue-20'}`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        aria-label="หน้าถัดไป"
        disabled={!canNext}
        onClick={() => onChange(page + 1)}
        className={`flex rounded-[7px] p-[7px] transition-colors ${canNext ? 'bg-blue-bg hover:bg-blue-20' : 'cursor-not-allowed bg-[#eeeeef]'}`}
      >
        <img src={canNext ? caretRight : caretRightDisabled} alt="" width={14} height={14} />
      </button>
    </nav>
  )
}
