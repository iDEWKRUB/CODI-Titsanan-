import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '../components/app/AppShell'
import NewsReader from '../components/app/NewsReader'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { blankNews, checkNews, newsCats, type News } from '../data/codiApp'
import { news, useAppRole } from '../lib/codiAppStore'

const lab = 'text-[12px] font-semibold text-black'
const ctl = 'h-[42px] w-full rounded-[10px] border bg-white px-[12px] text-[13px] font-light outline-none transition-colors focus:border-blue-00'

/** shrink a picked image to a small JPEG data URL so it fits in localStorage */
const shrink = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader()
    r.onerror = () => rej(new Error('read'))
    r.onload = () => {
      const img = new Image()
      img.onerror = () => rej(new Error('img'))
      img.onload = () => {
        const k = Math.min(1, 960 / img.width)
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * k)
        c.height = Math.round(img.height * k)
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
        res(c.toDataURL('image/jpeg', 0.8))
      }
      img.src = String(r.result)
    }
    r.readAsDataURL(file)
  })

/** เพิ่ม/แก้ไขข่าวสาร (book 3 fig 2-4) — 2.1.1.4 */
export default function NewsEditPage() {
  const role = useAppRole()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const [toast, show] = useToast()
  const area = useRef<HTMLTextAreaElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const id = Number(sp.get('id')) || 0
  const init = useMemo<News>(() => (id && news.get(id) ? { ...news.get(id)! } : blankNews()), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [v, setV] = useState<News>(init)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<News>()
  const set = (x: Partial<News>) => setV((s) => ({ ...s, ...x }))
  const admin = role === 'admin'
  const cls = (k: string) => `${ctl} ${errors[k] ? 'border-red-00' : 'border-gray-line'}`

  const wrap = (a: string, b = a) => {
    const t = area.current
    if (!t) return
    const s = t.selectionStart, e = t.selectionEnd
    const sel = v.body.slice(s, e) || 'ข้อความ'
    set({ body: `${v.body.slice(0, s)}${a}${sel}${b}${v.body.slice(e)}` })
    requestAnimationFrame(() => { t.focus(); t.setSelectionRange(s + a.length, s + a.length + sel.length) })
  }
  const line = (mark: string) => {
    const t = area.current
    const s = t ? t.selectionStart : v.body.length
    const ls = v.body.lastIndexOf('\n', s - 1) + 1
    set({ body: `${v.body.slice(0, ls)}${mark}${v.body.slice(ls)}` })
  }
  const pickFile = async (f?: File) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return show('รองรับเฉพาะไฟล์รูปภาพ')
    try {
      set({ cover: await shrink(f) })
      setErrors((e) => ({ ...e, cover: '' }))
    } catch (err) {
      show('อ่านไฟล์รูปภาพไม่สำเร็จ (' + (err as Error).message + ')')
    }
  }
  const save = (status: News['status'], then: 'back' | 'preview' | 'stay') => {
    if (!admin) return show('ต้องเป็นผู้ดูแลระบบ')
    const e = checkNews(v, status === 'published')
    setErrors(e)
    if (Object.values(e).some(Boolean)) return show('กรุณาตรวจสอบข้อมูลที่ไม่ถูกต้อง')
    const rec: News = { ...v, status, id: v.id || news.next() }
    news.save(rec)
    setV(rec)
    show(status === 'published' ? 'บันทึกและเผยแพร่ข่าวสารแล้ว' : status === 'draft' ? 'บันทึกฉบับร่างแล้ว' : 'ยกเลิกการเผยแพร่แล้ว')
    if (then === 'preview') setPreview(rec)
    if (then === 'back') setTimeout(() => navigate('/app/news/manage'), 900)
  }
  const tool = 'flex h-[30px] min-w-[30px] items-center justify-center rounded-[6px] px-[8px] text-[12px] text-gray-30 hover:bg-blue-bg hover:text-blue-00'

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[860px] flex-col gap-[14px]">
        <div className="flex items-center gap-[10px]">
          <Link to="/app/news/manage" aria-label="ย้อนกลับ" className="flex size-[30px] items-center justify-center rounded-[8px] bg-blue-bg text-blue-00 hover:bg-blue-20"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg></Link>
          <h1 className="text-[22px] font-semibold text-blue-dark">{id ? 'แก้ไขข่าวสาร' : 'เพิ่มข่าวสาร'}</h1>
        </div>
        {!admin && <p role="status" className="rounded-[10px] border border-[#e3b341] bg-[#fffbea] px-[14px] py-[10px] text-[12px] text-[#8a6100]">หน้านี้ใช้ได้เฉพาะ <b className="font-semibold">ผู้ดูแลระบบ</b> — สลับสิทธิ์ที่หน้า “จัดการข่าวสาร”</p>}

        <section className="flex flex-col gap-[14px] rounded-[16px] border border-gray-line-2 bg-white p-[22px] max-sm:p-[14px]">
          <label className="flex flex-col gap-[6px]"><span className={lab}>หัวข้อข่าว <span className="text-red-00">*</span></span>
            <input aria-label="หัวข้อข่าว" placeholder="หัวข้อข่าว" disabled={!admin} className={cls('title')} value={v.title} onChange={(e) => set({ title: e.target.value })} />
            {errors.title && <span role="alert" className="text-[11px] text-red-00">{errors.title}</span>}
          </label>
          <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
            <div className="flex flex-col gap-[6px]"><span className={lab}>ประเภทข่าวสาร <span className="text-red-00">*</span></span>
              <Select label="ประเภทข่าวสาร" value={v.cat} placeholder="เลือกประเภท" options={newsCats.map((c) => ({ value: c, label: c }))} onChange={(c) => set({ cat: c })} />
              {errors.cat && <span role="alert" className="text-[11px] text-red-00">{errors.cat}</span>}
            </div>
            <label className="flex flex-col gap-[6px]"><span className={lab}>วันที่เผยแพร่</span>
              <input type="date" aria-label="วันที่เผยแพร่" disabled={!admin} className={cls('date')} value={v.date} onChange={(e) => set({ date: e.target.value })} />
              {errors.date && <span role="alert" className="text-[11px] text-red-00">{errors.date}</span>}
            </label>
          </div>
          <div className="flex flex-col gap-[6px]">
            <span className={lab}>เนื้อหาข่าวสาร</span>
            <div className="flex flex-wrap items-center gap-[2px] rounded-[10px] border border-gray-line bg-gray-bg p-[4px]" role="toolbar" aria-label="จัดรูปแบบเนื้อหา">
              <button type="button" aria-label="หัวข้อย่อย" onClick={() => line('## ')} className={tool}>หัวข้อ</button>
              <button type="button" aria-label="ตัวหนา" onClick={() => wrap('**')} className={`${tool} font-bold`}>B</button>
              <button type="button" aria-label="ตัวเอียง" onClick={() => wrap('_')} className={`${tool} italic`}>I</button>
              <button type="button" aria-label="เพิ่มลิงก์" onClick={() => wrap('[', '](https://)')} className={tool}>ลิงก์</button>
            </div>
            <textarea ref={area} aria-label="เนื้อหาข่าวสาร" placeholder="เนื้อหาข่าวสาร" disabled={!admin} className={`min-h-[200px] w-full resize-y rounded-[10px] border bg-white px-[12px] py-[10px] text-[13px] leading-[1.7] font-light outline-none focus:border-blue-00 ${errors.body ? 'border-red-00' : 'border-gray-line'}`} value={v.body} onChange={(e) => set({ body: e.target.value })} />
            {errors.body && <span role="alert" className="text-[11px] text-red-00">{errors.body}</span>}
          </div>
          <div className="flex flex-col gap-[6px]">
            <span className={lab}>รูปภาพหน้าปก</span>
            <input ref={file} type="file" accept="image/*" hidden aria-label="เลือกไฟล์รูปภาพหน้าปก" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = '' }} />
            <div className="flex flex-wrap items-center gap-[12px]">
              <button type="button" disabled={!admin} onClick={() => file.current?.click()} className="h-[40px] rounded-[10px] border border-blue-00 px-[16px] text-[13px] font-medium text-blue-00 hover:bg-blue-bg disabled:opacity-40">{v.cover ? 'เปลี่ยนรูปภาพหน้าปก' : '+ เพิ่มรูปภาพหน้าปก'}</button>
              {v.cover && <><img src={v.cover} alt="ตัวอย่างหน้าปก" className="h-[64px] w-[104px] rounded-[8px] object-cover" /><button type="button" disabled={!admin} onClick={() => set({ cover: '' })} className="text-[12px] text-[#c13232] hover:underline">ลบรูป</button></>}
            </div>
            {errors.cover && <span role="alert" className="text-[11px] text-red-00">{errors.cover}</span>}
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-[10px]">
          <button type="button" onClick={() => navigate('/app/news/manage')} className="h-[40px] rounded-[10px] border border-gray-line bg-white px-[18px] text-[13px] hover:border-gray-10">ยกเลิก</button>
          {v.status === 'published' && <button type="button" disabled={!admin} onClick={() => save('unpublished', 'back')} className="h-[40px] rounded-[10px] border border-[#e5484d] bg-white px-[18px] text-[13px] font-medium text-[#c13232] hover:bg-[#fff1f1] disabled:opacity-40">ยกเลิกเผยแพร่</button>}
          <button type="button" disabled={!admin} onClick={() => save('draft', 'preview')} className="h-[40px] rounded-[10px] border border-blue-00 bg-white px-[18px] text-[13px] font-medium text-blue-00 hover:bg-blue-bg disabled:opacity-40">บันทึกฉบับร่างและแสดงตัวอย่าง</button>
          <button type="button" disabled={!admin} onClick={() => save('published', 'back')} className="h-[40px] rounded-[10px] bg-blue-00 px-[20px] text-[13px] font-medium text-white hover:brightness-110 disabled:opacity-40">บันทึกและเผยแพร่</button>
        </div>
      </div>
      <NewsReader item={preview} onClose={() => setPreview(undefined)} />
      {toast}
    </AppShell>
  )
}
