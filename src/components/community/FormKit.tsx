import { useEffect, useRef, useState, type ReactNode } from 'react'
import iconSave from '../../assets/meeting/d-check-sm.svg'
import { BackTitle, primaryBtn, softBtn } from '../leader/Parts'
import { field } from '../meeting/FormParts'
import Select from '../ui/Select'
import { regions } from '../../data/leader'
import { aptOptions, allPoints } from '../../data/orgMap'
import { provinceCenters } from '../../data/provinceCenters'
import { mapProvinces } from '../../data/thaiMap'
import DigitBoxes from './DigitBoxes'
import PinMap from './PinMap'
import { reverseGeocode } from './geo'

export const ta = `${field} h-auto min-h-[88px] resize-y py-[10px] leading-[1.6]`
export const inp = `${field} h-[36px] text-[12px]`
export const bad = 'border-red-00'

export type Addr = { houseNo: string; moo: string; soi: string; road: string; region: string; province: string; district: string; subdistrict: string; apt: string; zip: string; lat: number; lng: number }
export const blankAddr = (): Addr => ({ houseNo: '', moo: '', soi: '', road: '', region: '', province: '', district: '', subdistrict: '', apt: '', zip: '', lat: 18.7883, lng: 98.9853 })

const districts = [...new Set(allPoints.map((p) => p.district))].sort((a, b) => a.localeCompare(b, 'th'))
const subdistricts = [...new Set(allPoints.map((p) => p.subdistrict))].sort((a, b) => a.localeCompare(b, 'th'))

/** Label + control + error in the OSS form grid (Figma OSS-Area forms) */
export function FRow({ label, req, children, err, wide }: { label: string; req?: boolean; children: ReactNode; err?: string; wide?: boolean }) {
  return (
    <div className={`grid items-start gap-x-[10px] gap-y-[2px] ${wide ? 'grid-cols-[132px_minmax(0,1fr)]' : 'grid-cols-[120px_minmax(0,1fr)]'} max-sm:grid-cols-1`}>
      <span className="pt-[9px] text-[12px] font-semibold text-black max-sm:pt-0">
        {label}
        {req && <span className="text-red-00"> *</span>}
      </span>
      <div className="flex min-w-0 flex-col gap-[2px]">
        {children}
        {err && <span role="alert" className="text-[11px] text-red-00">{err}</span>}
      </div>
    </div>
  )
}

/** White card on the blue-gray board, with an optional fold-away body */
export function Block({ id, title, children, fold, defaultOpen = true, action }: { id?: string; title: string; children: ReactNode; fold?: boolean; defaultOpen?: boolean; action?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section id={id} className="scroll-mt-[16px] rounded-[12px] bg-blue-gray p-[8px]">
      <div className="rounded-[12px] bg-white">
        <div className="flex items-center gap-[10px] px-[24px] py-[16px] max-sm:px-[14px]">
          {fold && (
            <button type="button" aria-expanded={open} aria-label={open ? `ย่อ ${title}` : `ขยาย ${title}`} onClick={() => setOpen((v) => !v)} className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-blue-00 hover:bg-blue-bg">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden="true">
                <path d="m6 3 5 5-5 5" />
              </svg>
            </button>
          )}
          <h2 className="min-w-0 flex-1 text-[18px] leading-[1.3] font-semibold text-blue-00">{title}</h2>
          {action}
        </div>
        {(!fold || open) && <div className="flex flex-col gap-[14px] px-[24px] pb-[24px] max-sm:px-[14px]">{children}</div>}
      </div>
    </section>
  )
}

export function SubHead({ children }: { children: ReactNode }) {
  return <h3 className="border-b border-gray-line-2 pb-[6px] text-[14px] font-semibold text-blue-dark">{children}</h3>
}

/** Simulated file picker: shows the chosen file name, nothing is uploaded */
export function Upload({ label, hint, accept, value, onChange, error }: { label: string; hint: string; accept?: string; value: string; onChange: (name: string) => void; error?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[6px]">
      <input ref={ref} type="file" accept={accept} className="sr-only" aria-label={label} onChange={(e) => onChange(e.target.files?.[0]?.name ?? '')} />
      <button type="button" onClick={() => ref.current?.click()} className={`${softBtn} px-[12px] py-[7px] text-[12px]`}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 11V3m0 0L5 6m3-3 3 3M3 11v1.5A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V11" />
        </svg>
        {value ? 'เปลี่ยนไฟล์' : label}
      </button>
      {value ? (
        <span className="flex items-center gap-[6px] rounded-full bg-blue-bg px-[10px] py-[3px] text-[12px] text-blue-dark">
          {value}
          <button type="button" aria-label={`ลบไฟล์ ${value}`} onClick={() => onChange('')} className="text-gray-30 hover:text-red-00">×</button>
        </span>
      ) : (
        <span className="text-[11px] font-light text-gray-20">{hint}</span>
      )}
      {error && <span role="alert" className="basis-full text-[11px] text-red-00">{error}</span>}
    </div>
  )
}

/** Excel import with a progress bar that fills after choosing a file (UI only) */
export function ExcelUpload({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [pct, setPct] = useState(value ? 100 : 0)
  useEffect(() => {
    if (!value) return setPct(0)
    if (pct >= 100) return
    const t = setTimeout(() => setPct((p) => Math.min(100, p + 20)), 140)
    return () => clearTimeout(t)
  }, [value, pct])
  return (
    <div className="flex flex-col gap-[8px]">
      <Upload label="อัปโหลดไฟล์" hint="XLSX ขนาดไม่เกิน 20 MB" accept=".xlsx" value={value} onChange={(n) => { setPct(0); onChange(n) }} />
      {value && (
        <div className="flex max-w-[420px] items-center gap-[10px]">
          <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-gray-bg" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-blue-00 transition-[width]" style={{ width: pct + '%' }} />
          </div>
          <span className="font-urbanist text-[11px] text-gray-20">{pct >= 100 ? 'อัปโหลดแล้ว' : `${pct}%`}</span>
        </div>
      )}
    </div>
  )
}

export function PhoneBoxes({ value, onChange, label, groups = [3, 3, 4], invalid }: { value: string; onChange: (v: string) => void; label: string; groups?: number[]; invalid?: boolean }) {
  return <DigitBoxes value={value} groups={groups} onChange={onChange} label={label} invalid={invalid} />
}

/** Repeatable table-ish rows (work history, members per year …) */
export function RepeatRows<T extends Record<string, string>>({ rows, onChange, cols, blank, addLabel, min = 0 }: { rows: T[]; onChange: (r: T[]) => void; cols: { key: keyof T & string; label: string; placeholder?: string; width?: string; type?: 'text' | 'number' | 'date' }[]; blank: T; addLabel: string; min?: number }) {
  return (
    <div className="flex flex-col gap-[8px]">
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-separate border-spacing-y-[6px] text-left">
            <thead>
              <tr>
                {cols.map((c) => (
                  <th key={c.key} className="px-[4px] text-[11px] font-semibold text-gray-30">{c.label}</th>
                ))}
                <th className="w-[32px]" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {cols.map((c) => (
                    <td key={c.key} className="px-[4px]" style={c.width ? { width: c.width } : undefined}>
                      <input
                        aria-label={`${c.label} แถว ${i + 1}`}
                        type={c.type === 'date' ? 'date' : 'text'}
                        inputMode={c.type === 'number' ? 'numeric' : undefined}
                        placeholder={c.placeholder}
                        className={inp}
                        value={r[c.key]}
                        onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, [c.key]: c.type === 'number' ? e.target.value.replace(/\D/g, '') : e.target.value } : x)))}
                      />
                    </td>
                  ))}
                  <td>
                    <button type="button" aria-label={`ลบแถว ${i + 1}`} disabled={rows.length <= min} onClick={() => onChange(rows.filter((_, j) => j !== i))} className="flex size-[28px] items-center justify-center rounded-[6px] text-gray-30 hover:bg-blue-bg hover:text-red-00 disabled:opacity-30">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div>
        <button type="button" onClick={() => onChange([...rows, { ...blank }])} className={`${softBtn} px-[12px] py-[7px] text-[12px]`}>
          + {addLabel}
        </button>
      </div>
    </div>
  )
}

/** Address + draggable pin; moving the pin fills province / district / sub-district from OpenStreetMap */
export function AddressBlock({ a, set, err, idp }: { a: Addr; set: (p: Partial<Addr>) => void; err: Record<string, string>; idp: string }) {
  const [note, setNote] = useState('')
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = setTimeout(async () => {
      const p = await reverseGeocode(a.lat, a.lng)
      const patch: Partial<Addr> = {}
      if (p.province) patch.province = p.province
      if (p.region) patch.region = p.region
      if (p.district) patch.district = p.district
      if (p.subdistrict) patch.subdistrict = p.subdistrict
      if (p.postcode) patch.zip = p.postcode
      if (Object.keys(patch).length) {
        set(patch)
        setNote('เติมจังหวัด อำเภอ ตำบล และรหัสไปรษณีย์จากตำแหน่งหมุดให้แล้ว (แก้ไขได้)')
      } else setNote('')
    }, 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.lat, a.lng])

  const t = (k: 'houseNo' | 'moo' | 'soi' | 'road', ph: string) => <input aria-label={ph} className={`${inp} ${err[k] ? bad : ''}`} value={a[k]} onChange={(e) => set({ [k]: e.target.value })} />
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-[24px] max-lg:grid-cols-1">
      <div className="flex flex-col gap-[10px]">
        <FRow label="เลขที่">{t('houseNo', 'เลขที่')}</FRow>
        <FRow label="หมู่ที่" req err={err.moo}>{t('moo', 'หมู่ที่')}</FRow>
        <FRow label="ซอย">{t('soi', 'ซอย')}</FRow>
        <FRow label="ถนน">{t('road', 'ถนน')}</FRow>
        <FRow label="ภาค" req err={err.region}><Select label="ภาค" value={a.region} options={regions.map((r) => ({ value: r, label: r }))} onChange={(v) => set({ region: v })} /></FRow>
        <FRow label="จังหวัด" req err={err.province}>
          <Select
            label="จังหวัด"
            value={a.province}
            options={mapProvinces.map((p) => ({ value: p.name, label: p.name }))}
            onChange={(v) => {
              const c = provinceCenters[v]
              set({ province: v, region: mapProvinces.find((x) => x.name === v)?.region ?? a.region, ...(c ? { lat: c[0], lng: c[1] } : {}) })
            }}
          />
        </FRow>
        <FRow label="อำเภอ/เขต" req err={err.district}>
          <input aria-label="อำเภอ/เขต" list={`${idp}-d`} className={`${inp} ${err.district ? bad : ''}`} value={a.district} onChange={(e) => set({ district: e.target.value })} />
          <datalist id={`${idp}-d`}>{districts.map((s) => <option key={s} value={s} />)}</datalist>
        </FRow>
        <FRow label="ตำบล/แขวง" req err={err.subdistrict}>
          <input aria-label="ตำบล/แขวง" list={`${idp}-s`} className={`${inp} ${err.subdistrict ? bad : ''}`} value={a.subdistrict} onChange={(e) => set({ subdistrict: e.target.value })} />
          <datalist id={`${idp}-s`}>{subdistricts.map((s) => <option key={s} value={s} />)}</datalist>
        </FRow>
        <FRow label="อปท." req err={err.apt}><Select label="อปท." value={a.apt} options={aptOptions.map((o) => ({ value: o, label: o }))} onChange={(v) => set({ apt: v })} /></FRow>
        <FRow label="รหัสไปรษณีย์" req err={err.zip}>
          <input aria-label="รหัสไปรษณีย์" inputMode="numeric" maxLength={5} className={`${inp} max-w-[160px] ${err.zip ? bad : ''}`} value={a.zip} onChange={(e) => set({ zip: e.target.value.replace(/\D/g, '') })} />
        </FRow>
      </div>
      <div className="flex flex-col gap-[8px]">
        <h4 className="text-[12px] font-semibold text-blue-00">ปักหมุดตำแหน่ง</h4>
        <PinMap lat={a.lat} lng={a.lng} onChange={(lat, lng) => set({ lat, lng })} height={300} />
        {note && <p role="status" className="rounded-[8px] bg-blue-bg px-[10px] py-[6px] text-[11px] leading-[1.5] font-light text-blue-00">{note}</p>}
      </div>
    </div>
  )
}

export function validateAddr(a: Addr, e: Record<string, string>) {
  if (!a.moo.trim()) e.moo = 'กรุณาระบุหมู่ที่'
  if (!a.province) e.province = 'กรุณาเลือกจังหวัด'
  if (!a.district.trim()) e.district = 'กรุณาระบุอำเภอ/เขต'
  if (!a.subdistrict.trim()) e.subdistrict = 'กรุณาระบุตำบล/แขวง'
  if (!a.apt || a.apt === 'ไม่ระบุ') e.apt = 'กรุณาเลือก อปท.'
  if (!/^\d{5}$/.test(a.zip)) e.zip = 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก'
}

/** Two-column page: sticky "สารบัญ" on the left, form blocks on the right (Figma OSS-Area forms) */
export function FormLayout({ title, back, toc, children, onSave, saveLabel = 'บันทึกข้อมูล', aside }: { title: string; back: string; toc: { id: string; label: string }[]; children: ReactNode; onSave: () => void; saveLabel?: string; aside?: ReactNode }) {
  const [active, setActive] = useState(toc[0]?.id)
  useEffect(() => {
    const els = toc.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((x) => x.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (vis) setActive(vis.target.id)
      },
      { rootMargin: '-10% 0px -70% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [toc])
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return (
    <div className="flex w-full flex-col gap-[12px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]">
      <BackTitle title={title} to={back} />
      <div className="grid grid-cols-[260px_minmax(0,1fr)] items-start gap-[16px] max-lg:grid-cols-1">
        <nav aria-label="สารบัญ" className="sticky top-[16px] flex flex-col gap-[2px] rounded-[12px] bg-blue-gray p-[8px] max-lg:hidden">
          <div className="rounded-[12px] bg-white p-[10px]">
            <p className="px-[8px] pb-[6px] text-[14px] font-semibold text-blue-dark">สารบัญ</p>
            {toc.map((t) => (
              <button key={t.id} type="button" onClick={() => go(t.id)} aria-current={active === t.id ? 'true' : undefined} className={`block w-full rounded-[8px] px-[10px] py-[8px] text-left text-[13px] transition-colors ${active === t.id ? 'bg-blue-bg font-medium text-blue-00' : 'font-light text-gray-30 hover:bg-gray-bg'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </nav>
        <div className="flex min-w-0 flex-col gap-[12px]">
          {aside}
          {children}
          <div className="flex justify-end gap-[8px]">
            <button type="button" onClick={onSave} className={`${primaryBtn} px-[18px] py-[10px] text-[13px]`}>
              <img src={iconSave} alt="" width={14} height={14} className="brightness-0 invert" />
              {saveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
