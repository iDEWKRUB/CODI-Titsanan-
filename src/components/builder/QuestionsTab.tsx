import { useRef, useState } from 'react'
import checkWhite from '../../assets/builder/icon-check-white.svg'
import check from '../../assets/builder/icon-check.svg'
import iconImageSquare from '../../assets/builder/icon-image-square.svg'
import iconPlusSquare from '../../assets/builder/icon-plus-square.svg'
import iconSection from '../../assets/builder/icon-section.svg'
import iconText from '../../assets/builder/icon-text.svg'
import iconUpload from '../../assets/builder/icon-upload.svg'
import { newQuestion, newSection, surveyTypes, themeBackgrounds, themeColors, uid, type Question, type Section, type SurveyDraft } from '../../data/surveyBuilder'
import Modal from '../ui/Modal'
import Select from '../ui/Select'
import GeneralInfo from './GeneralInfo'
import { Board, cardBase, ImagePicker, InlineText, KebabMenu } from './parts'
import QuestionCard from './QuestionCard'

type Props = {
  draft: SurveyDraft
  onChange: (d: SurveyDraft) => void
  /** Open the respondent page at a section index (null = last page) */
  onOpenAnswer: (sectionIndex: number | null) => void
}

const clone = (q: Question): Question => ({
  ...structuredClone(q),
  id: uid('q'),
  options: q.options.map((o) => ({ ...structuredClone(o), id: uid('o'), subQuestions: o.subQuestions.map((s) => ({ ...s, id: uid('sq') })) })),
})

/** Plain description → formatted view: short lines become bold headings, "1. …" lines become a list. */
export function FormattedDescription({ text }: { text: string }) {
  return (
    <div className="text-[12px] leading-[1.5] font-light text-gray-30">
      {text.split('\n').map((line, i) =>
        /^\d+\.\s/.test(line) ? (
          <p key={i} className="pl-[18px] -indent-[12px]">
            {line}
          </p>
        ) : line.length <= 40 && !/[.…]$/.test(line) ? (
          <p key={i} className="font-bold">
            {line}
          </p>
        ) : (
          <p key={i}>{line}</p>
        ),
      )}
    </div>
  )
}

function Swatch({ color, selected, onSelect, label, dark }: { color: string; selected: boolean; onSelect: () => void; label: string; dark?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onSelect}
      style={{ background: color }}
      className={`flex size-[20px] shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-00 ${dark ? '' : 'border border-gray-line'}`}
    >
      {selected && <img src={dark ? checkWhite : check} alt="" width={14} height={14} />}
    </button>
  )
}

export default function QuestionsTab({ draft, onChange, onOpenAnswer }: Props) {
  const [themeOpen, setThemeOpen] = useState(true)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [active, setActive] = useState<string | null>(null)
  const [editingDesc, setEditingDesc] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<string>()
  const dragFrom = useRef<{ section: string; index: number } | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const customColor = useRef<HTMLInputElement>(null)

  const set = (patch: Partial<SurveyDraft>) => onChange({ ...draft, ...patch })
  const afterLabel = (s: Section) =>
    s.after === 'submit' ? 'ส่งแบบสอบถาม' : s.after === 'next' ? 'ไปยังส่วนถัดไป' : `ไปยังส่วนที่ ${draft.sections.findIndex((x) => x.id === s.after) + 1}`
  /** Section index the link opens (null = end of survey) */
  const afterTarget = (s: Section, si: number): number | null =>
    s.after === 'submit' ? null : s.after === 'next' ? (si + 1 < draft.sections.length ? si + 1 : null) : draft.sections.findIndex((x) => x.id === s.after)
  const setSection = (s: Section) => set({ sections: draft.sections.map((x) => (x.id === s.id ? s : x)) })
  const activeSection = draft.sections.find((s) => s.questions.some((q) => q.id === active)) ?? draft.sections.find((s) => s.id === active) ?? draft.sections[draft.sections.length - 1]

  const insertAfterActive = (q: Question) => {
    const s = activeSection
    const i = s.questions.findIndex((x) => x.id === active)
    const questions = [...s.questions]
    questions.splice(i < 0 ? questions.length : i + 1, 0, q)
    setSection({ ...s, questions })
    setActive(q.id)
  }
  const addSection = () => {
    const s = newSection()
    set({ sections: [...draft.sections, s] })
    setActive(s.id)
    requestAnimationFrame(() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }))
  }

  const toolbar = (
    <div role="toolbar" aria-label="เพิ่มเนื้อหา" className="mx-auto -mt-[8px] flex gap-[4px] rounded-[12px] bg-white p-[12px] drop-shadow-[0px_4px_10px_rgba(0,0,0,0.15)]">
      {[
        { icon: iconPlusSquare, label: 'เพิ่มคำถาม', run: () => insertAfterActive(newQuestion('short')) },
        { icon: iconText, label: 'เพิ่มหัวข้อและคำอธิบาย', run: () => insertAfterActive(newQuestion('title')) },
        { icon: iconImageSquare, label: 'เพิ่มรูปภาพ', run: () => insertAfterActive(newQuestion('image')) },
        { icon: iconSection, label: 'เพิ่มส่วน', run: addSection },
      ].map((b) => (
        <button
          key={b.label}
          type="button"
          aria-label={b.label}
          title={b.label}
          onClick={b.run}
          className="flex size-[40px] items-center justify-center rounded-[24px] p-[8px] transition-colors hover:bg-blue-bg focus-visible:outline-2 focus-visible:outline-blue-00"
        >
          <img src={b.icon} alt="" width={24} height={24} />
        </button>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col gap-[12px]">
      {/* ประเภทแบบสอบถาม / ไปยัง */}
      <section className="rounded-[12px] bg-blue-10 p-[12px]">
        <div className="flex items-center gap-[12px] rounded-[12px] bg-white px-[24px] py-[12px] max-md:flex-col max-md:items-stretch max-sm:px-[16px]">
          <label className="flex min-w-0 flex-1 items-center gap-[12px] max-sm:flex-col max-sm:items-stretch">
            <span className="text-[16px] font-medium whitespace-nowrap text-black">ประเภทแบบสอบถาม</span>
            <Select className="min-w-0 flex-1" label="ประเภทแบบสอบถาม" value={draft.type} options={surveyTypes.map((t) => ({ value: t, label: t }))} onChange={(type) => set({ type })} />
          </label>
          <label className="flex min-w-0 flex-1 items-center justify-end gap-[12px] max-sm:flex-col max-sm:items-stretch">
            <span className="text-[16px] font-medium whitespace-nowrap text-black">ไปยัง</span>
            <Select
              className="w-[280px] max-md:w-full"
              label="ไปยังหน้า"
              value=""
              placeholder="คำถามหน้าที่ 1"
              options={[...draft.sections.map((s, i) => ({ value: s.id, label: `คำถามหน้าที่ ${i + 1}` })), { value: 'add', label: '+  เพิ่มหน้า', divider: true }]}
              onChange={(v) => (v === 'add' ? addSection() : document.getElementById(v)?.scrollIntoView({ behavior: 'smooth' }))}
            />
          </label>
        </div>
      </section>

      {/* ธีมของแบบสอบถาม */}
      <Board title="ธีมของแบบสอบถาม" open={themeOpen} onToggle={() => setThemeOpen((v) => !v)}>
        <div className={`${cardBase} p-[24px] max-sm:p-[16px]`}>
          <div className="grid grid-cols-2 gap-[24px] max-md:grid-cols-1">
            <div className="flex items-center gap-[12px]">
              <span className="text-[14px] font-medium text-black">Logo</span>
              <ImagePicker value={draft.theme.logo} onChange={(logo) => set({ theme: { ...draft.theme, logo } })} label="โลโก้" />
            </div>
            <div className="flex items-center gap-[12px]">
              <span className="text-[14px] font-medium whitespace-nowrap text-black">ปรับแต่งพื้นหลัง</span>
              <ImagePicker value={draft.theme.backgroundImage} onChange={(backgroundImage) => set({ theme: { ...draft.theme, backgroundImage } })} label="ภาพพื้นหลัง" />
            </div>
            <div className="flex flex-wrap items-center gap-[12px]">
              <span className="text-[14px] font-medium text-black">Background</span>
              {themeBackgrounds.map((c) => (
                <Swatch key={c} color={c} label={`พื้นหลัง ${c}`} selected={draft.theme.background === c} onSelect={() => set({ theme: { ...draft.theme, background: c } })} />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-[12px]">
              <span className="text-[14px] font-medium text-black">Color</span>
              {[...themeColors, ...(themeColors.includes(draft.theme.color) ? [] : [draft.theme.color])].map((c) => (
                <Swatch key={c} dark color={c} label={`สี ${c}`} selected={draft.theme.color === c} onSelect={() => set({ theme: { ...draft.theme, color: c } })} />
              ))}
              <button
                type="button"
                aria-label="เลือกสีเอง"
                onClick={() => customColor.current?.click()}
                className="flex size-[20px] items-center justify-center rounded-full bg-gray-line text-[14px] leading-none text-white hover:brightness-95"
              >
                +
              </button>
              <input ref={customColor} type="color" aria-label="สีที่กำหนดเอง" className="sr-only" onChange={(e) => set({ theme: { ...draft.theme, color: e.target.value } })} />
            </div>
          </div>
        </div>

        <div className={`${cardBase} flex-row gap-[24px] px-[24px] pt-[36px] pb-[24px] max-sm:px-[16px]`} style={{ borderTop: `6px solid ${draft.theme.color}` }}>
          <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
            {draft.theme.logo && <img src={draft.theme.logo} alt="โลโก้แบบสอบถาม" className="mb-[8px] h-[48px] w-fit object-contain" />}
            <InlineText value={draft.title} onChange={(title) => set({ title })} placeholder="ชื่อแบบสอบถาม" label="ชื่อแบบสอบถาม" />
            {editingDesc ? (
              <textarea
                autoFocus
                value={draft.description}
                onChange={(e) => set({ description: e.target.value })}
                onBlur={() => setEditingDesc(false)}
                rows={Math.max(4, draft.description.split('\n').length)}
                aria-label="คำอธิบายแบบสอบถาม"
                className="w-full resize-y rounded-[8px] border border-gray-line px-[12px] py-[8px] text-[12px] leading-[1.5] font-light text-gray-30 outline-none focus:border-blue-00"
              />
            ) : (
              <button type="button" onClick={() => setEditingDesc(true)} className="rounded-[6px] text-left hover:bg-gray-subtle" aria-label="แก้ไขคำอธิบายแบบสอบถาม">
                {draft.description ? <FormattedDescription text={draft.description} /> : <span className="text-[12px] font-light text-gray-20">คำอธิบาย (ถ้ามี)</span>}
              </button>
            )}
          </div>
          <KebabMenu
            items={[
              { label: 'แก้ไขคำอธิบาย', onSelect: () => setEditingDesc(true) },
              { label: 'ล้างคำอธิบาย', onSelect: () => set({ description: '' }), danger: true },
            ]}
          />
        </div>

        <div className="flex gap-[12px] max-md:flex-col" aria-label="ข้อมูลอ้างอิงที่ผู้ตอบต้องกรอก">
          <div className="flex flex-1 gap-[12px]">
            {['รหัสจังหวัด', 'เลขที่ชุมชน'].map((l) => (
              <Select key={l} className="flex-1" tone="subtle" label={l} placeholder={l} value="" onChange={() => {}} options={[{ value: '-', label: `ผู้ตอบเลือก${l}` }]} />
            ))}
          </div>
          <input disabled placeholder="ลำดับครัวเรือน" aria-label="ลำดับครัวเรือน" className="h-[46px] flex-1 rounded-[8px] border border-gray-line bg-gray-subtle px-[16px] text-[14px] font-light placeholder:text-gray-20" />
        </div>
      </Board>

      <GeneralInfo value={draft.general} onChange={(general) => set({ general })} />

      {draft.sections.map((s, si) => {
        const open = !collapsed.has(s.id)
        const count = s.questions.filter((q) => q.type !== 'title' && q.type !== 'image').length
        const showToolbarHere = activeSection.id === s.id
        return (
          <Board
            key={s.id}
            id={s.id}
            title={`ส่วนที่ ${si + 1}`}
            open={open}
            onToggle={() =>
              setCollapsed((prev) => {
                const n = new Set(prev)
                if (n.has(s.id)) n.delete(s.id)
                else n.add(s.id)
                return n
              })
            }
          >
            <div className={`${cardBase} flex-row gap-[24px] px-[24px] pt-[36px] pb-[24px] max-sm:px-[16px]`} onPointerDown={() => setActive(s.id)}>
              <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
                <InlineText value={s.title} onChange={(title) => setSection({ ...s, title })} placeholder="หัวข้อ..." label={`หัวข้อส่วนที่ ${si + 1}`} />
                <InlineText value={s.description} onChange={(description) => setSection({ ...s, description })} placeholder="รายละเอียด (ถ้ามี)" label={`รายละเอียดส่วนที่ ${si + 1}`} variant="detail" />
              </div>
              <KebabMenu
                items={[
                  { label: 'ทำสำเนาส่วนนี้', onSelect: () => set({ sections: [...draft.sections.slice(0, si + 1), { ...s, id: uid('s'), questions: s.questions.map(clone) }, ...draft.sections.slice(si + 1)] }) },
                  ...(draft.sections.length > 1 ? [{ label: 'ลบส่วนนี้', danger: true, onSelect: () => set({ sections: draft.sections.filter((x) => x.id !== s.id) }) }] : []),
                  // "หลังจากส่วนนี้" branching
                  { label: 'หลังจบส่วนนี้: ไปยังส่วนถัดไป', checked: s.after === 'next', onSelect: () => setSection({ ...s, after: 'next' }) },
                  ...draft.sections
                    .map((x, xi) => ({ x, xi }))
                    .filter(({ x }) => x.id !== s.id)
                    .map(({ x, xi }) => ({ label: `หลังจบส่วนนี้: ไปยังส่วนที่ ${xi + 1}`, checked: s.after === x.id, onSelect: () => setSection({ ...s, after: x.id }) })),
                  { label: 'หลังจบส่วนนี้: ส่งแบบสอบถาม', checked: s.after === 'submit', onSelect: () => setSection({ ...s, after: 'submit' }) },
                ]}
              />
            </div>

            {s.questions.map((q, qi) => (
              <div key={q.id} className="flex flex-col gap-[24px]">
                <QuestionCard
                  q={q}
                  index={qi}
                  active={active === q.id}
                  sections={draft.sections}
                  onActivate={() => setActive(q.id)}
                  onChange={(nq) => setSection({ ...s, questions: s.questions.map((x) => (x.id === nq.id ? nq : x)) })}
                  onDuplicate={() => {
                    const c = clone(q)
                    const questions = [...s.questions]
                    questions.splice(qi + 1, 0, c)
                    setSection({ ...s, questions })
                    setActive(c.id)
                  }}
                  onDelete={() => setSection({ ...s, questions: s.questions.filter((x) => x.id !== q.id) })}
                  onImport={() => setImportOpen(true)}
                  drag={{
                    dragging: dragging === q.id,
                    onDragStart: () => {
                      dragFrom.current = { section: s.id, index: qi }
                      setDragging(q.id)
                    },
                    onDragOver: (e) => dragFrom.current?.section === s.id && e.preventDefault(),
                    onDrop: () => {
                      const from = dragFrom.current
                      if (!from || from.section !== s.id || from.index === qi) return
                      const questions = [...s.questions]
                      const [moved] = questions.splice(from.index, 1)
                      questions.splice(qi, 0, moved)
                      setSection({ ...s, questions })
                    },
                    onDragEnd: () => {
                      dragFrom.current = null
                      setDragging(null)
                    },
                  }}
                />
                {showToolbarHere && active === q.id && toolbar}
              </div>
            ))}
            {showToolbarHere && !s.questions.some((q) => q.id === active) && toolbar}

            <div className="flex flex-col gap-[4px]">
              <p className="text-[11px] font-light text-black">คำถามในส่วนนี้ {count} คำถาม</p>
              <div className="flex flex-wrap items-center gap-[12px]">
                <span className="text-[12px] font-medium text-black">หลังจากส่วนที่ {si + 1}</span>
                {/* Figma: link text → opens the respondent page (Answer/FirstPage) at the target section */}
                <button
                  type="button"
                  onClick={() => onOpenAnswer(afterTarget(s, si))}
                  title="เปิดหน้าตอบแบบสอบถาม"
                  className="rounded-[4px] text-[12px] font-medium text-blue-00 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-blue-00"
                >
                  {afterLabel(s)}
                </button>
              </div>
            </div>
          </Board>
        )
      })}

      <Modal open={importOpen} title="นำเข้าไฟล์" onClose={() => setImportOpen(false)}>
        <div className="flex flex-col items-center gap-[24px] text-center">
          <label className="flex cursor-pointer items-center gap-[4px] rounded-[8px] bg-blue-00 px-[12px] py-[10px] transition hover:brightness-110">
            <img src={iconUpload} alt="" width={16} height={16} className="brightness-0 invert" />
            <span className="p-[2px] text-[14px] font-medium text-white-soft">{importFile ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}</span>
            <input type="file" accept=".xls,.xlsx,.csv" className="hidden" onChange={(e) => setImportFile(e.target.files?.[0]?.name)} />
          </label>
          {importFile && <p className="text-[14px] font-medium text-black">{importFile}</p>}
          <p className="text-[12px] font-light text-gray-30">ไฟล์ที่นำเข้าจะต้องเป็นนามสกุล XLS หรือ CSV ขนาดไฟล์ไม่เกิน 10 MB.</p>
        </div>
      </Modal>
    </div>
  )
}
