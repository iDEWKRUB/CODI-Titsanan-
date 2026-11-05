import { useState, type ReactNode } from 'react'
import iconXChip from '../../assets/builder/icon-x-chip.svg'
import radioOff from '../../assets/builder/radio-off.svg'
import { generalFieldLabel, type GeneralField, type SurveyDraft } from '../../data/surveyBuilder'
import Checkbox from '../ui/Checkbox'
import { DateInput } from '../ui/DateTimeInputs'
import Select from '../ui/Select'
import Toggle from '../ui/Toggle'
import { Board, CardFooter, cardBase, inputBase, InlineText } from './parts'

type General = SurveyDraft['general']
const order = Object.keys(generalFieldLabel) as GeneralField[]

const Star = () => <span className="ml-[4px] align-top text-[12px] text-red-00">*</span>

function Label({ children, required, width = 'w-[101px]' }: { children: string; required?: boolean; width?: string }) {
  return (
    <span className={`${width} shrink-0 text-[14px] font-medium whitespace-nowrap text-black max-md:w-full`}>
      {children}
      {required && <Star />}
    </span>
  )
}

/** Digit boxes for phone / citizen id previews, e.g. [3,3,4] → ▢▢▢ - ▢▢▢ - ▢▢▢▢ */
function DigitBoxes({ groups, label }: { groups: number[]; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-[6px]">
      {groups.map((n, g) => (
        <span key={g} className="flex items-center gap-[6px]">
          {g > 0 && <span className="w-[18px] text-center text-[14px] text-gray-20">-</span>}
          {Array.from({ length: n }, (_, i) => (
            <input key={i} aria-label={`${label} หลักที่ ${i + 1}`} maxLength={1} inputMode="numeric" className={`${inputBase} w-[30px] px-0 text-center`} />
          ))}
        </span>
      ))}
    </div>
  )
}

export function FieldPreview({ field, required }: { field: GeneralField; required: boolean }) {
  const [birth, setBirth] = useState('')
  const [same, setSame] = useState(false)
  const [prefix, setPrefix] = useState('')
  const row = (label: string, body: ReactNode, width?: string) => (
    <div className="flex items-center gap-[28px] max-md:flex-col max-md:items-start max-md:gap-[12px]">
      <Label required={required} width={width}>
        {label}
      </Label>
      {body}
    </div>
  )
  switch (field) {
    case 'name':
      return row(
        'ชื่อ-นามสกุล',
        <div className="grid min-w-0 flex-1 grid-cols-3 gap-[28px] max-md:w-full max-md:grid-cols-1 max-md:gap-[12px]">
          <Select label="คำนำหน้า" placeholder="เลือกคำนำหน้า" value={prefix} onChange={setPrefix} options={['นาย', 'นาง', 'นางสาว'].map((v) => ({ value: v, label: v }))} />
          <input placeholder="ชื่อ" aria-label="ชื่อ" className={`${inputBase} w-full`} />
          <input placeholder="นามสกุล" aria-label="นามสกุล" className={`${inputBase} w-full`} />
        </div>,
        'w-[77px]',
      )
    case 'phone':
      return row('เบอร์โทรศัพท์', <DigitBoxes groups={[3, 3, 4]} label="เบอร์โทรศัพท์" />, 'w-[77px]')
    case 'citizenId':
      return row('เลขบัตรประชาชน', <DigitBoxes groups={[1, 4, 5, 2, 1]} label="เลขบัตรประชาชน" />, 'w-[114px]')
    case 'birthDate':
      return row(
        'วัน เดือน ปีเกิด',
        <div className="w-[234px] max-md:w-full">
          <DateInput value={birth} onChange={setBirth} label="วันเดือนปีเกิด" placeholder="ว/ด/ป (พ.ศ.)" />
        </div>,
      )
    case 'gender':
      return row(
        'เพศ',
        <div className="flex flex-wrap gap-[24px]">
          {['ชาย', 'หญิง', 'อื่นๆ'].map((g) => (
            <span key={g} className="flex items-center gap-[8px] text-[14px] font-light text-black">
              <img src={radioOff} alt="" width={24} height={24} className="opacity-40" />
              {g}
            </span>
          ))}
        </div>,
        'w-[77px]',
      )
    case 'age':
      return row(
        'อายุ',
        <span className="flex items-center gap-[12px]">
          <input aria-label="อายุ" inputMode="numeric" className={`${inputBase} w-[120px]`} />
          <span className="text-[14px] font-light text-black">ปี</span>
        </span>,
        'w-[77px]',
      )
    case 'address':
      return (
        <div className="flex flex-col gap-[24px]">
          <Label required={required} width="w-auto">
            ที่อยู่ปัจจุบันตรงกับทะเบียนบ้าน
          </Label>
          <div className="grid grid-cols-4 gap-[12px] max-md:grid-cols-2">
            {['เลขที่', 'หมู่', 'ซอย', 'ถนน'].map((p) => (
              <input key={p} placeholder={p} aria-label={p} className={`${inputBase} w-full`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-[12px] max-md:grid-cols-1">
            {['จังหวัด', 'เขต', 'แขวง'].map((p) => (
              <Select key={p} label={p} placeholder={p} value="" onChange={() => {}} options={[{ value: '-', label: `เลือก${p}` }]} />
            ))}
          </div>
          <label className="flex items-center gap-[24px] text-[14px] font-light text-black">
            <Checkbox size="big" checked={same} onChange={setSame} label="ที่อยู่ปัจจุบันตรงกับทะเบียนบ้าน" />
            ที่อยู่ปัจจุบันตรงกับทะเบียนบ้าน
          </label>
        </div>
      )
  }
}

export default function GeneralInfo({ value, onChange }: { value: General; onChange: (g: General) => void }) {
  const [open, setOpen] = useState(true)
  const missing = order.filter((f) => !value.fields.includes(f))
  const removeField = (f: GeneralField) => onChange({ ...value, fields: value.fields.filter((x) => x !== f) })

  return (
    <Board
      title="คำถามข้อมูลทั่วไป"
      leading={
        <span className="flex w-[48px] justify-center">
          <Toggle checked={value.enabled} onChange={(enabled) => onChange({ ...value, enabled })} label="เปิดใช้คำถามข้อมูลทั่วไป" />
        </span>
      }
      open={open && value.enabled}
      onToggle={() => setOpen((v) => !v)}
    >
      <div className={`${cardBase} gap-[8px] px-[24px] pt-[36px] pb-[24px] max-sm:px-[16px]`}>
        <InlineText value={value.title} onChange={(title) => onChange({ ...value, title })} placeholder="หัวข้อ..." label="หัวข้อข้อมูลทั่วไป" />
        <InlineText value={value.description} onChange={(description) => onChange({ ...value, description })} placeholder="รายละเอียด (ถ้ามี)" label="รายละเอียดข้อมูลทั่วไป" variant="detail" />
        <Select<GeneralField>
          label="เพิ่มคำถามข้อมูลทั่วไป"
          placeholder={missing.length ? 'เลือกคำถาม' : 'เพิ่มครบทุกคำถามแล้ว'}
          value=""
          options={missing.map((f) => ({ value: f, label: generalFieldLabel[f] }))}
          onChange={(f) => onChange({ ...value, fields: order.filter((x) => x === f || value.fields.includes(x)) })}
        />
        <ul className="flex flex-wrap gap-[8px] py-[12px]">
          {value.fields.map((f) => (
            <li key={f} className="flex items-center gap-[2px] rounded-[7px] bg-blue-bg px-[8px] py-[6px]">
              <span className="px-[2px] pt-[2px] pb-[3px] text-[10px] font-light whitespace-nowrap text-blue-00">{generalFieldLabel[f]}</span>
              <button type="button" aria-label={`เอา ${generalFieldLabel[f]} ออก`} onClick={() => removeField(f)} className="rounded-[4px] py-[2px] hover:bg-blue-20">
                <img src={iconXChip} alt="" width={12} height={12} />
              </button>
            </li>
          ))}
        </ul>
        <CardFooter
          required={value.fields.length > 0 && value.fields.every((f) => value.required[f])}
          onRequired={(on) => onChange({ ...value, required: Object.fromEntries(value.fields.map((f) => [f, on])) })}
          onDelete={() => onChange({ ...value, enabled: false })}
        />
      </div>

      {value.fields.map((f) => (
        <div key={f} className={`${cardBase} gap-[24px] px-[24px] pt-[36px] pb-[24px] max-sm:px-[16px]`}>
          <FieldPreview field={f} required={!!value.required[f]} />
          <CardFooter
            required={!!value.required[f]}
            onRequired={(on) => onChange({ ...value, required: { ...value.required, [f]: on } })}
            onDelete={() => removeField(f)}
          />
        </div>
      ))}
    </Board>
  )
}
