import iconDrag from '../../assets/builder/icon-drag.svg'
import iconPlusBlue from '../../assets/builder/icon-plus-blue.svg'
import iconPlusXs from '../../assets/builder/icon-plus-xs.svg'
import iconStar from '../../assets/builder/icon-star.svg'
import iconStarSm from '../../assets/builder/icon-star-sm.svg'
import iconTypeCheckbox from '../../assets/builder/icon-type-checkbox.svg'
import iconTypeParagraph from '../../assets/builder/icon-type-paragraph.svg'
import iconTypeRadio from '../../assets/builder/icon-type-radio-sm.svg'
import iconTypeScale from '../../assets/builder/icon-type-scale.svg'
import iconTypeShort from '../../assets/builder/icon-type-short.svg'
import iconUpload from '../../assets/builder/icon-upload.svg'
import iconX from '../../assets/builder/icon-x-gray.svg'
import radioOff from '../../assets/builder/radio-off.svg'
import { uid, type Option, type Question, type QuestionType, type Section, type SubQuestion } from '../../data/surveyBuilder'
import Checkbox from '../ui/Checkbox'
import Select, { type SelectOption } from '../ui/Select'
import { AnswerLine, CardFooter, cardActive, cardBase, ImagePicker, inputBase, InlineText, KebabMenu, type MenuItem } from './parts'

type TypeValue = QuestionType | 'import'
// Figma Elements › Question/Type/Dropdown (114:13181)
export const typeOptions: SelectOption<TypeValue>[] = [
  { value: 'short', label: 'ตอบสั้น', icon: iconTypeShort },
  { value: 'paragraph', label: 'ตอบหลายบรรทัด', icon: iconTypeParagraph },
  { value: 'single', label: 'เลือกตอบได้ 1 ข้อ', icon: iconTypeRadio },
  { value: 'multi', label: 'เลือกตอบได้มากกว่า 1 ข้อ', icon: iconTypeCheckbox },
  { value: 'scale', label: 'สเกลการให้คะแนน', icon: iconTypeScale },
  { value: 'rating', label: 'Rating', icon: iconStarSm },
  { value: 'import', label: 'นำเข้าไฟล์', icon: iconUpload, divider: true },
]

type Props = {
  q: Question
  index: number
  active: boolean
  sections: Section[]
  onActivate: () => void
  onChange: (q: Question) => void
  onDuplicate: () => void
  onDelete: () => void
  onImport: () => void
  drag: { onDragStart: () => void; onDragOver: (e: React.DragEvent) => void; onDrop: () => void; onDragEnd: () => void; dragging: boolean }
}

const smallBtn =
  'flex shrink-0 items-center gap-[4px] rounded-[7px] border border-gray-line bg-white py-[6px] pr-[10px] pl-[8px] transition-colors hover:border-blue-10 focus-visible:outline-2 focus-visible:outline-blue-00'

function SubQuestionPanel({ sq, onChange, onRemove }: { sq: SubQuestion; onChange: (s: SubQuestion) => void; onRemove: () => void }) {
  return (
    <div className="pl-[48px] max-sm:pl-[16px]">
      <div className="flex gap-[12px] rounded-[8px] bg-gray-subtle py-[12px] pr-[4px] pl-[12px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[24px]">
          <div className="flex gap-[24px] max-md:flex-col max-md:gap-[12px]">
            <input value={sq.title} onChange={(e) => onChange({ ...sq, title: e.target.value })} placeholder="คำถามย่อย" aria-label="คำถามย่อย" className={`${inputBase} w-full`} />
            <Select
              className="w-[280px] shrink-0 max-md:w-full"
              label="ประเภทคำถามย่อย"
              value={sq.type}
              options={typeOptions.filter((o) => o.value === 'short' || o.value === 'paragraph') as SelectOption<'short' | 'paragraph'>[]}
              onChange={(type) => onChange({ ...sq, type })}
            />
          </div>
          <div className="flex items-center gap-[24px] max-md:flex-wrap max-md:gap-[12px]">
            <AnswerLine className="min-w-0 flex-1 max-md:basis-full" />
            <input value={sq.unit} onChange={(e) => onChange({ ...sq, unit: e.target.value })} placeholder="หน่วย" aria-label="หน่วย" className={`${inputBase} w-[154px] shrink-0`} />
          </div>
        </div>
        <KebabMenu items={[{ label: 'ลบคำถามย่อย', onSelect: onRemove, danger: true }]} label="ตัวเลือกคำถามย่อย" />
      </div>
    </div>
  )
}

function OptionsEditor({ q, sections, onChange }: { q: Question; sections: Section[]; onChange: (q: Question) => void }) {
  const multi = q.type === 'multi'
  const setOption = (o: Option) => onChange({ ...q, options: q.options.map((x) => (x.id === o.id ? o : x)) })
  const marker = (label: string) =>
    multi ? (
      <Checkbox size="big" checked={false} onChange={() => {}} label={label} disabled />
    ) : (
      <span className="flex size-[48px] shrink-0 items-center justify-center opacity-40">
        <img src={radioOff} alt="" width={24} height={24} />
      </span>
    )
  const goToOptions: SelectOption<string>[] = [
    { value: 'next', label: 'ไปยังส่วนถัดไป' },
    ...sections.map((s, i) => ({ value: s.id, label: `ไปยังส่วนที่ ${i + 1}` })),
    { value: 'submit', label: 'ส่งแบบสอบถาม' },
  ]

  return (
    <div className="flex flex-col gap-[24px]">
      {q.options.map((o, i) => (
        <div key={o.id} className="flex flex-col gap-[24px]">
          <div className={`flex min-h-[48px] items-center ${multi ? 'gap-[24px]' : 'gap-[24px]'} max-sm:flex-wrap max-sm:gap-[12px]`}>
            {marker(`ตัวเลือกที่ ${i + 1}`)}
            <input
              value={o.label}
              onChange={(e) => setOption({ ...o, label: e.target.value })}
              placeholder={`ตัวเลือกที่ ${i + 1}`}
              aria-label={`ตัวเลือกที่ ${i + 1}`}
              className="h-[48px] min-w-0 flex-1 rounded-[6px] border-b border-transparent bg-transparent text-[14px] font-medium text-black outline-none hover:border-gray-line focus:border-blue-00"
            />
            {q.skipLogic && (
              <Select className="w-[200px] shrink-0" label={`ไปยังหลังเลือก ${o.label}`} value={o.goTo ?? 'next'} options={goToOptions} onChange={(goTo) => setOption({ ...o, goTo })} />
            )}
            {q.options.length > 1 && (
              <button
                type="button"
                aria-label={`ลบตัวเลือก ${o.label}`}
                onClick={() => onChange({ ...q, options: q.options.filter((x) => x.id !== o.id) })}
                className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] hover:bg-gray-subtle"
              >
                <img src={iconX} alt="" width={24} height={24} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOption({ ...o, subQuestions: [...o.subQuestions, { id: uid('sq'), title: '', type: 'short', unit: '' }] })}
              className={smallBtn}
            >
              <img src={iconPlusXs} alt="" width={12} height={12} className="my-[2px]" />
              <span className="px-[2px] pt-[2px] pb-[3px] text-[10px] font-light whitespace-nowrap text-blue-00">เพิ่มคำถามย่อย</span>
            </button>
          </div>
          {o.subQuestions.map((sq) => (
            <SubQuestionPanel
              key={sq.id}
              sq={sq}
              onChange={(s) => setOption({ ...o, subQuestions: o.subQuestions.map((x) => (x.id === s.id ? s : x)) })}
              onRemove={() => setOption({ ...o, subQuestions: o.subQuestions.filter((x) => x.id !== sq.id) })}
            />
          ))}
        </div>
      ))}

      {q.hasOther && (
        <div className="flex h-[48px] items-center gap-[24px]">
          {marker('อื่นๆ')}
          <AnswerLine placeholder="อื่นๆ..." className="min-w-0 flex-1" />
          <button type="button" aria-label="ลบตัวเลือกอื่นๆ" onClick={() => onChange({ ...q, hasOther: false })} className="flex size-[24px] items-center justify-center rounded-[6px] hover:bg-gray-subtle">
            <img src={iconX} alt="" width={24} height={24} />
          </button>
        </div>
      )}

      <div className="flex h-[48px] items-center gap-[24px] max-sm:gap-[12px]">
        {marker('เพิ่มตัวเลือก')}
        <button
          type="button"
          onClick={() => onChange({ ...q, options: [...q.options, { id: uid('o'), label: '', subQuestions: [] }] })}
          className="text-[14px] font-medium whitespace-nowrap text-gray-20 transition-colors hover:text-blue-00"
        >
          เพิ่มคำตอบ หรือ
        </button>
        {!q.hasOther && (
          <button type="button" onClick={() => onChange({ ...q, hasOther: true })} className="flex items-center gap-[4px] rounded-[8px] px-[2px] py-[10px] transition-opacity hover:opacity-80">
            <img src={iconPlusBlue} alt="" width={16} height={16} />
            <span className="p-[2px] text-[14px] font-medium whitespace-nowrap text-blue-00">เพิ่ม “อื่นๆ”</span>
          </button>
        )}
      </div>
    </div>
  )
}

function ScaleEditor({ q, onChange }: { q: Question; onChange: (q: Question) => void }) {
  const num = (v: string) => ({ value: v, label: v })
  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex h-[48px] items-center gap-[24px]">
        <Select className="w-[80px]" label="ค่าเริ่มต้น" value={String(q.scaleMin)} options={['0', '1'].map(num)} onChange={(v) => onChange({ ...q, scaleMin: Number(v) as 0 | 1 })} />
        <span className="text-[14px] font-medium text-black">ถึง</span>
        <Select className="w-[80px]" label="ค่าสูงสุด" value={String(q.scaleMax)} options={['2', '3', '4', '5', '6', '7', '8', '9', '10'].map(num)} onChange={(v) => onChange({ ...q, scaleMax: Number(v) })} />
      </div>
      {(
        [
          [q.scaleMin, 'minLabel'],
          [q.scaleMax, 'maxLabel'],
        ] as const
      ).map(([n, key]) => (
        <div key={key} className="flex h-[48px] items-center gap-[24px]">
          <span className="w-[12px] text-[14px] font-medium text-gray-20">{n}</span>
          <input
            value={q[key]}
            onChange={(e) => onChange({ ...q, [key]: e.target.value })}
            placeholder="ระบุข้อความกำกับ (ถ้ามี)"
            aria-label={`ข้อความกำกับ ${n}`}
            className="h-[48px] w-[360px] max-w-full border-b border-dashed border-gray-20 bg-transparent text-[14px] font-light text-black outline-none placeholder:text-gray-20 focus:border-solid focus:border-blue-00"
          />
        </div>
      ))}
    </div>
  )
}

function RatingEditor({ q, onChange }: { q: Question; onChange: (q: Question) => void }) {
  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex h-[48px] items-center gap-[24px]">
        <Select
          className="w-[80px]"
          label="จำนวนระดับ"
          value={String(q.ratingMax)}
          options={['3', '4', '5', '6', '7', '8', '9', '10'].map((v) => ({ value: v, label: v }))}
          onChange={(v) => onChange({ ...q, ratingMax: Number(v) })}
        />
        <Select className="w-[96px]" label="สัญลักษณ์" value="star" options={[{ value: 'star', label: ' ', icon: iconStarSm }]} onChange={() => {}} />
      </div>
      <div className="flex justify-center gap-[24px] overflow-x-auto pb-[24px] md:px-[64px]">
        {Array.from({ length: q.ratingMax }, (_, i) => (
          <div key={i} className="flex min-w-[48px] flex-1 flex-col items-center gap-[24px]">
            <span className="text-[14px] font-medium text-gray-20">{i + 1}</span>
            <span className="relative size-[24px]">
              <img src={iconStar} alt="" className="absolute inset-[8.53%_10.16%_13.34%_8.59%] block max-w-none" />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function QuestionCard({ q, index, active, sections, onActivate, onChange, onDuplicate, onDelete, onImport, drag }: Props) {
  const isChoice = q.type === 'single' || q.type === 'multi'
  const isBlock = q.type === 'title' || q.type === 'image'
  const menu: MenuItem[] = isBlock
    ? []
    : [
        { label: 'เพิ่มหมายเหตุ', checked: q.showNote, onSelect: () => onChange({ ...q, showNote: !q.showNote }) },
        ...(q.type === 'single'
          ? [{ label: 'ตั้งเงื่อนไขการข้ามคำถาม', checked: q.skipLogic, onSelect: () => onChange({ ...q, skipLogic: !q.skipLogic }) }]
          : []),
        ...(isChoice ? [{ label: 'การสุ่มลำดับตัวเลือก', checked: q.shuffle, onSelect: () => onChange({ ...q, shuffle: !q.shuffle }) }] : []),
      ]

  const changeType = (t: TypeValue) => {
    if (t === 'import') return onImport()
    const next = { ...q, type: t }
    if ((t === 'single' || t === 'multi') && q.options.length === 0) next.options = [{ id: uid('o'), label: 'คำตอบ', subQuestions: [] }]
    if (t !== 'single') next.skipLogic = false
    onChange(next)
  }

  return (
    <article
      aria-label={`คำถามที่ ${index + 1}`}
      onFocusCapture={onActivate}
      onPointerDown={onActivate}
      onDragOver={drag.onDragOver}
      onDrop={drag.onDrop}
      className={`${cardBase} gap-[24px] px-[24px] pt-[6px] pb-[24px] max-sm:px-[16px] ${active ? cardActive : ''} ${drag.dragging ? 'opacity-50' : ''}`}
    >
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          drag.onDragStart()
        }}
        onDragEnd={drag.onDragEnd}
        aria-hidden="true"
        title="ลากเพื่อจัดลำดับ"
        className={`mx-auto flex h-[32px] w-[48px] cursor-grab items-center justify-center rounded-[6px] hover:bg-gray-subtle active:cursor-grabbing ${active ? '' : 'invisible'}`}
      >
        <img src={iconDrag} alt="" width={32} height={32} />
      </div>

      {q.type === 'title' ? (
        <div className="flex flex-col gap-[8px]">
          <InlineText value={q.title} onChange={(title) => onChange({ ...q, title })} placeholder="หัวข้อ..." label="หัวข้อ" />
          <InlineText value={q.description} onChange={(description) => onChange({ ...q, description })} placeholder="รายละเอียด (ถ้ามี)" label="รายละเอียด" variant="detail" />
        </div>
      ) : q.type === 'image' ? (
        <div className="flex flex-col gap-[12px]">
          <InlineText value={q.title} onChange={(title) => onChange({ ...q, title })} placeholder="คำอธิบายรูปภาพ" label="คำอธิบายรูปภาพ" variant="detail" />
          {q.imageUrl && <img src={q.imageUrl} alt={q.title || 'รูปภาพ'} className="max-h-[320px] w-full rounded-[8px] object-contain" />}
          <ImagePicker value={q.imageUrl} onChange={(imageUrl) => onChange({ ...q, imageUrl })} label="รูปภาพประกอบ" />
        </div>
      ) : (
        <>
          <div className="flex gap-[24px] max-md:flex-col max-md:gap-[12px]">
            <input
              value={q.title}
              onChange={(e) => onChange({ ...q, title: e.target.value })}
              placeholder="คำถาม"
              aria-label="คำถาม"
              className={`${inputBase} w-full`}
            />
            <Select<TypeValue>
              className={`${q.type === 'multi' ? 'w-[280px]' : 'w-[260px]'} shrink-0 max-md:w-full`}
              label="ประเภทคำถาม"
              value={q.type}
              options={typeOptions}
              onChange={changeType}
            />
          </div>

          {q.type === 'short' && <AnswerLine />}
          {q.type === 'paragraph' && (
            <div className="flex flex-col gap-[24px]">
              <AnswerLine />
              <div aria-hidden="true" className="mx-auto h-[24px] w-[360px] max-w-full border-b border-dashed border-gray-20" />
            </div>
          )}
          {isChoice && <OptionsEditor q={q} sections={sections} onChange={onChange} />}
          {q.type === 'scale' && <ScaleEditor q={q} onChange={onChange} />}
          {q.type === 'rating' && <RatingEditor q={q} onChange={onChange} />}

          {q.showNote && (
            <textarea
              value={q.note}
              onChange={(e) => onChange({ ...q, note: e.target.value })}
              placeholder="หมายเหตุ"
              aria-label="หมายเหตุ"
              rows={2}
              className="w-full resize-y rounded-[8px] border border-gray-line bg-gray-subtle px-[16px] py-[12px] text-[12px] font-light text-gray-30 outline-none focus:border-blue-00"
            />
          )}
        </>
      )}

      <CardFooter
        onCopy={onDuplicate}
        onDelete={onDelete}
        required={q.required}
        onRequired={isBlock ? undefined : (required) => onChange({ ...q, required })}
        menu={menu}
      />
    </article>
  )
}
