import { useMemo, useRef, useState } from 'react'
import { Btn, Crumbs, Row, Title, ctl, err, page, ta } from '../components/strategic/Parts'
import { Ic } from '../components/asset/Parts'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import { PASS, accessLevels, addDays, categories, courseMinutes, courses, fileTone, fileTypeOf, kPersonas, score, stamp, suggest, thDate, type Access, type Category, type Course, type Enroll, type KDoc, type KPersona } from '../data/erpCkb'
import { docs, enrolls, kWho, newVersion, nextCert, setKPersona, useDocs, useEnrolls, useKPersona } from '../lib/ckbStore'

const I = {
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  doc: 'M7 3h7l4 4v14H7ZM14 3v4h4M10 12h5M10 16h5',
  dl: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  edit: 'M4 20h4L19 9l-4-4L4 16ZM13 7l4 4',
  refresh: 'M4 4v6h6M20 20v-6h-6M20 10a8 8 0 0 0-14-3M4 14a8 8 0 0 0 14 3',
  check: 'M5 12l5 5 9-10',
  lock: 'M6 11h12v9H6ZM8 11V8a4 4 0 0 1 8 0v3',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2ZM19 19v2H6',
  cap: 'M2 9l10-5 10 5-10 5ZM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5',
  play: 'M7 4l12 8-12 8Z',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
}
const daysTo = (iso: string) => Math.round((+new Date(iso) - +new Date(addDays(0))) / 86400000)
const dueOf = (d: KDoc) => { const n = daysTo(d.reviewBy); return n < 0 ? 'เลยกำหนดทบทวน' : n <= 30 ? `ครบทบทวนใน ${n} วัน` : '' }
const accessTone: Record<Access, string> = { ทุกคน: 'bg-[#dff5e8] text-[#0f8a63]', เจ้าหน้าที่: 'bg-[#e0efff] text-[#2057c9]', ผู้ดูแลระบบ: 'bg-[#fff1d6] text-[#a8650b]' }
const saveText = (name: string, text: string, type = 'text/plain') => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: `${type};charset=utf-8` })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500) }

function certificateSvg(name: string, course: string, date: string, no: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1123" height="794" viewBox="0 0 1123 794"><rect width="1123" height="794" fill="#fff"/><rect x="24" y="24" width="1075" height="746" fill="none" stroke="#1f5ac8" stroke-width="6"/><rect x="44" y="44" width="1035" height="706" fill="none" stroke="#9cc7f5" stroke-width="2"/><text x="561" y="150" text-anchor="middle" font-family="Prompt,sans-serif" font-size="26" fill="#1f5ac8">สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน)</text><text x="561" y="250" text-anchor="middle" font-family="Prompt,sans-serif" font-size="58" font-weight="700" fill="#0b1f45">ใบประกาศนียบัตร</text><text x="561" y="330" text-anchor="middle" font-family="Prompt,sans-serif" font-size="24" fill="#555">ขอมอบให้ไว้เพื่อแสดงว่า</text><text x="561" y="420" text-anchor="middle" font-family="Prompt,sans-serif" font-size="46" font-weight="600" fill="#1f5ac8">${name}</text><text x="561" y="500" text-anchor="middle" font-family="Prompt,sans-serif" font-size="24" fill="#555">ได้ผ่านการเรียนและผ่านเกณฑ์การประเมินหลักสูตร</text><text x="561" y="560" text-anchor="middle" font-family="Prompt,sans-serif" font-size="32" font-weight="600" fill="#0b1f45">${course}</text><text x="561" y="660" text-anchor="middle" font-family="Prompt,sans-serif" font-size="20" fill="#777">วันที่ ${date} · เลขที่ ${no} · ใบประกาศอิเล็กทรอนิกส์ (ตัวอย่างระบบจำลอง)</text></svg>`
}

type Quiz = { kind: 'pre' | 'post'; picks: number[]; result?: number }

/** หน้าหลักของคลังความรู้ พอช. — คลังเอกสารกลาง + e-Learning (book 3 §2.4.1; process book 1 §2.5.2) */
export default function CkbHomePage() {
  const all = useDocs()
  const enr = useEnrolls()
  const me = useKPersona()
  const admin = me === 'admin'
  const [toast, show] = useToast()
  const [tab, setTab] = useState<'docs' | 'learn'>('docs')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [ft, setFt] = useState('')
  const [view, setView] = useState<number>()
  const [imp, setImp] = useState<{ open: boolean; edit?: KDoc; file?: string; size: string; type?: KDoc['fileType']; title: string; category: Category; tags: string; access: Access; err: string }>({ open: false, size: '', title: '', category: categories[4], tags: '', access: 'เจ้าหน้าที่', err: '' })
  const [upd, setUpd] = useState<{ d?: KDoc; file: string; note: string; err: string }>({ file: '', note: '', err: '' })
  const [cq, setCq] = useState('')
  const [room, setRoom] = useState<number>() // enrollment id
  const [quiz, setQuiz] = useState<Quiz>()
  const [certOf, setCertOf] = useState<number>()
  const pick = useRef<HTMLInputElement>(null)
  const updPick = useRef<HTMLInputElement>(null)

  const visible = useMemo(() => all.filter((d) => admin || d.access !== 'ผู้ดูแลระบบ'), [all, admin])
  const rows = useMemo(() => {
    const k = q.trim().toLowerCase()
    return visible.filter((d) => (!cat || d.category === cat) && (!ft || d.fileType === ft) && (!k || `${d.title} ${d.tags.join(' ')} ${d.summary} ${d.category}`.toLowerCase().includes(k))).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [visible, q, cat, ft])
  const due = visible.filter((d) => dueOf(d))
  const myEnr = enr
  const done = myEnr.filter((e) => e.status === 'เรียนจบ')
  const minutes = myEnr.reduce((s, e) => { const c = courses.find((x) => x.id === e.courseId)!; return s + c.lessons.slice(0, e.done).reduce((a, l) => a + l.minutes, 0) }, 0)
  const curDoc = all.find((d) => d.id === view)
  const curEnr = enr.find((e) => e.id === room)
  const curCourse = curEnr ? courses.find((c) => c.id === curEnr.courseId) : undefined
  const certEnr = enr.find((e) => e.id === certOf)
  const certCourse = certEnr ? courses.find((c) => c.id === certEnr.courseId) : undefined

  const onFile = (list: FileList | null) => {
    const f = list?.[0]
    if (!f) return
    const t = fileTypeOf(f.name)
    if (!t) { setImp((s) => ({ ...s, err: 'รองรับเฉพาะไฟล์ PDF, Word หรือ Excel' })); return }
    if (f.size > 20 * 1024 * 1024) { setImp((s) => ({ ...s, err: 'ไฟล์ต้องมีขนาดไม่เกิน 20 MB' })); return }
    const sg = suggest(f.name)
    setImp((s) => ({ ...s, file: f.name, type: t, size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`, title: s.title || f.name.replace(/\.[^.]+$/, ''), category: sg.category, tags: sg.tags.join(', '), err: '' }))
  }
  const saveImport = () => {
    if (!imp.edit && !imp.file) { setImp({ ...imp, err: 'กรุณาเลือกไฟล์ที่จะนำเข้า' }); return }
    if (!imp.title.trim()) { setImp({ ...imp, err: 'กรุณาระบุชื่อเอกสาร' }); return }
    const tags = imp.tags.split(',').map((t) => t.trim()).filter(Boolean)
    if (!tags.length) { setImp({ ...imp, err: 'กรุณาระบุแท็กอย่างน้อย 1 รายการ' }); return }
    const e = imp.edit
    if (e) {
      docs.save({ ...e, title: imp.title.trim(), category: imp.category, tags, access: imp.access, history: [...e.history, { v: e.version, at: stamp(), by: kWho(), note: `แก้ไขหมวดหมู่/แท็ก/สิทธิ์การเข้าถึง (${imp.category} · ${imp.access})` }] })
      show('บันทึกการแก้ไขหมวดหมู่และสิทธิ์แล้ว')
    } else {
      docs.save({ id: docs.next(), title: imp.title.trim(), category: imp.category, tags, fileType: imp.type!, size: imp.size, version: 1, access: imp.access, owner: kPersonas[me].short, updatedAt: addDays(0), reviewBy: addDays(180), summary: `นำเข้าจากไฟล์ ${imp.file}`, history: [{ v: 1, at: stamp(), by: kWho(), note: 'นำเข้าเอกสารครั้งแรก' }] })
      show('นำเข้าเอกสารเข้าคลังแล้ว')
    }
    setImp({ ...imp, open: false })
  }
  const download = (d: KDoc) => saveText(`${d.title}.txt`, `${d.title}\nหมวดหมู่: ${d.category}\nแท็ก: ${d.tags.join(', ')}\nเวอร์ชัน: ${d.version}\nอัปเดตล่าสุด: ${d.updatedAt}\n\n(ไฟล์ตัวอย่างจากระบบจำลอง — ไฟล์จริงจะเป็น ${d.fileType})`)
  const exportCsv = () => saveText('คลังเอกสารกลาง.csv', ['ชื่อเอกสาร,หมวดหมู่,แท็ก,ประเภทไฟล์,เวอร์ชัน,สิทธิ์,อัปเดตล่าสุด'].concat(rows.map((d) => [d.title, d.category, d.tags.join(' | '), d.fileType, d.version, d.access, d.updatedAt].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))).join('\n'), 'text/csv')

  const enroll = (c: Course) => { enrolls.save({ id: enrolls.next(), courseId: c.id, done: 0, status: 'กำลังเรียน', at: addDays(0) }); show(`ลงทะเบียนเรียน “${c.title}” แล้ว`) }
  const setE = (e: Enroll, patch: Partial<Enroll>) => enrolls.save({ ...e, ...patch })
  const submitQuiz = () => {
    if (!quiz || !curEnr || !curCourse) return
    const s = score(curCourse, quiz.picks)
    setQuiz({ ...quiz, result: s })
    if (quiz.kind === 'pre') setE(curEnr, { pre: s })
    else if (s >= PASS) setE(curEnr, { post: s, status: 'เรียนจบ', completedAt: addDays(0), certNo: curEnr.certNo ?? nextCert() })
    else setE(curEnr, { post: s })
  }

  const learn = courses.filter((c) => !cq.trim() || `${c.title} ${c.desc} ${c.category}`.toLowerCase().includes(cq.trim().toLowerCase()))

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1100px] flex-col gap-[14px]">
        <Title right={
          <label className="flex items-center gap-[8px] rounded-[8px] bg-blue-bg px-[10px] py-[4px] text-[11px] text-gray-30"><span className="font-light max-sm:hidden">ดูในฐานะ</span>
            <select aria-label="ดูในฐานะผู้ใช้งาน" value={me} onChange={(e) => setKPersona(e.target.value as KPersona)} className="cursor-pointer bg-transparent py-[4px] text-[12px] font-medium text-blue-00 outline-none">{(Object.keys(kPersonas) as KPersona[]).map((p) => <option key={p} value={p}>{kPersonas[p].short}</option>)}</select>
          </label>}>คลังความรู้กลาง (CKB)</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/ckb' }, { label: 'คลังความรู้ พอช.' }]} />

        <section aria-label="หน้าหลักคลังความรู้" className="flex flex-col gap-[14px] rounded-[20px] bg-[linear-gradient(120deg,#c6dbf8,#e4dcf6_55%,#f8d2c4)] p-[20px] max-sm:p-[14px]">
          <div><h2 className="text-[19px] font-semibold text-blue-dark">คลังความรู้ พอช.</h2><p className="text-[12px] font-light text-gray-30">รวมเอกสารสำคัญและบทเรียนขององค์กรไว้ในที่เดียว ค้นหา เรียนรู้ และพัฒนาตนเองได้ทุกที่ทุกเวลา</p></div>
          <label className="flex items-center gap-[10px] rounded-full bg-white p-[6px] pl-[16px] shadow-[0_4px_18px_rgba(31,90,200,0.12)] focus-within:ring-2 focus-within:ring-blue-00">
            <span className="text-gray-20"><Ic d={I.search} /></span>
            <input aria-label="ค้นหาในคลังความรู้" value={tab === 'docs' ? q : cq} onChange={(e) => (tab === 'docs' ? setQ(e.target.value) : setCq(e.target.value))} placeholder={tab === 'docs' ? 'ค้นหาเอกสาร ชื่อ แท็ก หรือเนื้อหา เช่น พัสดุ PDPA แบบฟอร์ม' : 'ค้นหาคอร์สเรียน เช่น แผนชุมชน PDPA Excel'} className="min-w-0 flex-1 bg-transparent py-[8px] text-[14px] outline-none" />
          </label>
          <div className="grid grid-cols-4 gap-[10px] max-lg:grid-cols-2 max-sm:grid-cols-1" aria-label="สรุปคลังความรู้">
            {[['เอกสารในคลัง', visible.length, 'ฉบับ', I.doc], ['ครบวาระทบทวน', due.length, 'ฉบับ', I.alert], ['คอร์สที่ลงทะเบียน', myEnr.length, `เรียนจบ ${done.length}`, I.cap], ['เวลาเรียนสะสม', (minutes / 60).toFixed(1), 'ชั่วโมง', I.clock]].map(([l, v, s, ic]) => (
              <div key={String(l)} className="flex items-center gap-[12px] rounded-[14px] bg-white/90 p-[12px] shadow-sm"><span className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] bg-blue-bg text-blue-00"><Ic d={String(ic)} s={18} /></span><span className="flex flex-col"><span className="text-[11px] font-light text-gray-30">{l}</span><span className="font-urbanist text-[20px] leading-[1.15] font-semibold text-blue-dark">{v}</span><span className="text-[10px] font-light text-gray-20">{s}</span></span></div>
            ))}
          </div>
        </section>

        <div role="tablist" aria-label="หมวดคลังความรู้" className="grid w-full max-w-[420px] grid-cols-2 gap-[4px] rounded-[12px] bg-blue-bg p-[4px]">
          {([['docs', 'คลังเอกสารกลาง'], ['learn', 'e-Learning']] as const).map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`h-[36px] rounded-[9px] text-[13px] font-medium transition ${tab === k ? 'bg-white text-blue-00 shadow-sm' : 'text-gray-30 hover:text-blue-00'}`}>{l}</button>)}
        </div>

        {tab === 'docs' ? (
          <section aria-label="คลังเอกสารกลาง" className="flex flex-col gap-[12px]">
            {due.length > 0 && (
              <p role="note" className="flex items-start gap-[10px] rounded-[12px] border border-[#f1d28b] bg-[#fffbea] px-[14px] py-[10px] text-[12px] leading-[1.6] text-[#7a5600]"><span className="mt-[2px] shrink-0"><Ic d={I.alert} s={16} /></span><span>มีเอกสาร <b className="font-semibold">{due.length} ฉบับ</b> ครบวาระทบทวนหรือใกล้ครบ — {due.slice(0, 2).map((d) => `“${d.title}”`).join(' และ ')}{due.length > 2 ? ' ...' : ''} ผู้รับผิดชอบควรอัปเดตข้อมูลให้เป็นปัจจุบัน</span></p>
            )}
            <div className="flex flex-wrap items-center gap-[8px]">
              <select aria-label="หมวดหมู่" value={cat} onChange={(e) => setCat(e.target.value)} className="h-[38px] rounded-[8px] border border-gray-line bg-white px-[10px] text-[13px]"><option value="">ทุกหมวดหมู่</option>{categories.map((c) => <option key={c}>{c}</option>)}</select>
              <select aria-label="ประเภทไฟล์" value={ft} onChange={(e) => setFt(e.target.value)} className="h-[38px] rounded-[8px] border border-gray-line bg-white px-[10px] text-[13px]"><option value="">ทุกประเภทไฟล์</option><option>PDF</option><option>Word</option><option>Excel</option></select>
              <span className="flex-1" />
              <button type="button" onClick={exportCsv} className="flex h-[38px] items-center gap-[6px] rounded-[8px] border border-gray-line bg-white px-[14px] text-[12px] hover:border-gray-10"><Ic d={I.dl} s={14} />ส่งออกรายการ (CSV)</button>
              {admin && <button type="button" onClick={() => setImp({ open: true, size: '', title: '', category: categories[4], tags: '', access: 'เจ้าหน้าที่', err: '' })} className="flex h-[38px] items-center gap-[6px] rounded-[8px] bg-blue-00 px-[16px] text-[12px] font-medium text-white hover:brightness-110"><Ic d={I.upload} s={15} />นำเข้าข้อมูลความรู้</button>}
            </div>
            <ul className="flex flex-col gap-[10px]">
              {rows.map((d) => (
                <li key={d.id} className="flex items-start gap-[12px] rounded-[14px] border border-gray-line-2 bg-white p-[14px] max-sm:flex-wrap">
                  <span className={`mt-[2px] flex size-[40px] shrink-0 items-center justify-center rounded-[11px] text-[11px] font-bold ${fileTone[d.fileType]}`}>{d.fileType}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] leading-[1.4] font-semibold">{d.title}</p>
                    <p className="line-clamp-1 text-[12px] font-light text-gray-30">{d.summary}</p>
                    <div className="mt-[6px] flex flex-wrap items-center gap-[6px]">
                      <span className="rounded-full bg-blue-bg px-[8px] py-[2px] text-[11px] text-blue-dark">{d.category}</span>
                      {d.tags.map((t) => <span key={t} className="rounded-full bg-gray-bg px-[8px] py-[2px] text-[11px] text-gray-30">#{t}</span>)}
                      <span className={`flex items-center gap-[4px] rounded-full px-[8px] py-[2px] text-[11px] ${accessTone[d.access]}`}><Ic d={I.lock} s={10} />{d.access}</span>
                      {dueOf(d) && <span className="rounded-full bg-[#fff1d6] px-[8px] py-[2px] text-[11px] font-medium text-[#a8650b]">{dueOf(d)}</span>}
                    </div>
                    <p className="mt-[4px] text-[11px] font-light text-gray-20">เวอร์ชัน {d.version} · {d.size} · อัปเดต {thDate(d.updatedAt)} · {d.owner}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-[6px] max-sm:w-full max-sm:justify-end">
                    <button type="button" aria-label={`ดูรายละเอียด ${d.title}`} title="ดูรายละเอียดและประวัติเวอร์ชัน" onClick={() => setView(d.id)} className="flex size-[32px] items-center justify-center rounded-[8px] border border-gray-line-2 text-gray-30 hover:border-blue-20 hover:text-blue-00"><Ic d={I.eye} s={15} /></button>
                    <button type="button" aria-label={`ดาวน์โหลด ${d.title}`} title="ดาวน์โหลด" onClick={() => { download(d); show('ดาวน์โหลดไฟล์ตัวอย่างแล้ว') }} className="flex size-[32px] items-center justify-center rounded-[8px] border border-gray-line-2 text-gray-30 hover:border-blue-20 hover:text-blue-00"><Ic d={I.dl} s={15} /></button>
                    <button type="button" aria-label={`อัปเดตเอกสาร ${d.title}`} title="อัปเดตเอกสาร (เวอร์ชันใหม่)" onClick={() => setUpd({ d, file: '', note: '', err: '' })} className="flex size-[32px] items-center justify-center rounded-[8px] border border-gray-line-2 text-gray-30 hover:border-blue-20 hover:text-blue-00"><Ic d={I.refresh} s={15} /></button>
                    {admin && <button type="button" aria-label={`แก้ไขหมวดหมู่และสิทธิ์ ${d.title}`} title="แก้ไขหมวดหมู่/แท็ก/สิทธิ์" onClick={() => setImp({ open: true, edit: d, size: d.size, title: d.title, category: d.category, tags: d.tags.join(', '), access: d.access, err: '' })} className="flex size-[32px] items-center justify-center rounded-[8px] border border-gray-line-2 text-gray-30 hover:border-blue-20 hover:text-blue-00"><Ic d={I.edit} s={15} /></button>}
                  </div>
                </li>
              ))}
              {!rows.length && <li className="rounded-[14px] border border-dashed border-gray-line py-[30px] text-center text-[13px] font-light text-gray-20">ไม่พบเอกสารตามเงื่อนไขที่ค้นหา</li>}
            </ul>
            <p className="text-[11px] font-light text-gray-20">แสดง {rows.length} จาก {visible.length} ฉบับ · เอกสารที่ตั้งสิทธิ์ “ผู้ดูแลระบบ” จะมองเห็นเฉพาะผู้ดูแลระบบ</p>
          </section>
        ) : (
          <section aria-label="e-Learning" className="flex flex-col gap-[14px]">
            <div className="flex flex-col gap-[10px] rounded-[14px] border border-gray-line-2 bg-white p-[16px]" aria-label="ภาพรวมการเรียนรู้">
              <h2 className="text-[15px] font-semibold">ภาพรวมการเรียนรู้ของฉัน</h2>
              {myEnr.length === 0 && <p className="text-[12px] font-light text-gray-30">ยังไม่ได้ลงทะเบียนคอร์สใด เลือกคอร์สด้านล่างเพื่อเริ่มเรียน</p>}
              {myEnr.map((e) => { const c = courses.find((x) => x.id === e.courseId)!; const pct = Math.round((e.done / c.lessons.length) * 100); return (
                <div key={e.id} className="grid grid-cols-[minmax(0,1fr)_160px_auto] items-center gap-[12px] max-sm:grid-cols-1">
                  <p className="truncate text-[13px] font-medium">{c.title}</p>
                  <div className="flex items-center gap-[8px]"><span className="h-[8px] flex-1 rounded-full bg-[#eef3fb]"><span className={`block h-full rounded-full ${e.status === 'เรียนจบ' ? 'bg-[#17a673]' : 'bg-blue-00'}`} style={{ width: `${pct}%` }} /></span><span className="w-[34px] text-right font-urbanist text-[12px] font-semibold">{pct}%</span></div>
                  <span className={`w-fit rounded-full px-[10px] py-[2px] text-[11px] font-medium ${e.status === 'เรียนจบ' ? 'bg-[#dff5e8] text-[#0f8a63]' : 'bg-[#fff1d6] text-[#a8650b]'}`}>{e.status}{e.post != null ? ` · ผลสอบ ${e.post}%` : ''}</span>
                </div>) })}
            </div>
            <div className="grid grid-cols-2 gap-[12px] max-md:grid-cols-1">
              {learn.map((c) => {
                const e = enr.find((x) => x.courseId === c.id)
                return (
                  <article key={c.id} aria-label={c.title} className="flex flex-col gap-[8px] rounded-[14px] border border-gray-line-2 bg-white p-[14px]">
                    <div className="flex items-start gap-[10px]"><span className="flex size-[40px] shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-[#6a55e8] to-[#1f5ac8] text-white"><Ic d={I.book} s={18} /></span><div className="min-w-0"><p className="text-[14px] leading-[1.4] font-semibold">{c.title}</p><p className="text-[12px] font-light text-gray-30">{c.desc}</p></div></div>
                    <div className="flex flex-wrap gap-[6px] text-[11px]"><span className="rounded-full bg-blue-bg px-[8px] py-[2px] text-blue-dark">{c.category}</span><span className="rounded-full bg-gray-bg px-[8px] py-[2px] text-gray-30">{c.level}</span><span className="rounded-full bg-gray-bg px-[8px] py-[2px] text-gray-30">{c.lessons.length} บทเรียน · {courseMinutes(c)} นาที</span></div>
                    <div className="mt-auto flex flex-wrap gap-[8px]">
                      {!e ? <button type="button" aria-label={`ลงทะเบียนเรียน ${c.title}`} onClick={() => enroll(c)} className="h-[34px] rounded-[8px] bg-blue-00 px-[16px] text-[12px] font-medium text-white hover:brightness-110">ลงทะเบียนเรียน</button>
                        : <><button type="button" aria-label={`เข้าเรียน ${c.title}`} onClick={() => { setRoom(e.id); setQuiz(undefined) }} className="flex h-[34px] items-center gap-[6px] rounded-[8px] bg-blue-00 px-[16px] text-[12px] font-medium text-white hover:brightness-110"><Ic d={I.play} s={11} />{e.status === 'เรียนจบ' ? 'ทบทวนบทเรียน' : 'เข้าเรียน'}</button>
                          {e.status === 'เรียนจบ' && <button type="button" aria-label={`ดาวน์โหลดใบประกาศ ${c.title}`} onClick={() => setCertOf(e.id)} className="flex h-[34px] items-center gap-[6px] rounded-[8px] border border-[#17a673] px-[14px] text-[12px] font-medium text-[#0f8a63] hover:bg-[#e7f7ef]"><Ic d={I.cap} s={14} />ใบประกาศนียบัตร</button>}</>}
                    </div>
                  </article>
                )
              })}
              {!learn.length && <p className="col-span-2 rounded-[14px] border border-dashed border-gray-line py-[30px] text-center text-[13px] font-light text-gray-20 max-md:col-span-1">ไม่พบคอร์สที่ค้นหา</p>}
            </div>
          </section>
        )}
      </div>

      {/* document detail */}
      <Modal open={!!curDoc} onClose={() => setView(undefined)} title="รายละเอียดเอกสาร" width="max-w-[620px]">
        {curDoc && (
          <div className="flex max-h-[68vh] flex-col gap-[12px] overflow-y-auto pr-[4px]">
            <p className="text-[15px] leading-[1.4] font-semibold">{curDoc.title}</p>
            <p className="text-[13px] font-light text-gray-30">{curDoc.summary}</p>
            <dl className="grid grid-cols-2 gap-x-[16px] gap-y-[8px] rounded-[12px] bg-gray-subtle p-[14px] text-[12px] max-sm:grid-cols-1">
              {[['หมวดหมู่', curDoc.category], ['แท็ก', curDoc.tags.map((t) => `#${t}`).join(' ')], ['สิทธิ์การเข้าถึง', curDoc.access], ['เจ้าของเอกสาร', curDoc.owner], ['ไฟล์', `${curDoc.fileType} · ${curDoc.size}`], ['ครบวาระทบทวน', thDate(curDoc.reviewBy)]].map(([k, v]) => <div key={k} className="flex flex-col"><dt className="text-[11px] font-light text-gray-20">{k}</dt><dd className="font-medium">{v}</dd></div>)}
            </dl>
            <div><p className="mb-[8px] text-[13px] font-semibold">ประวัติเวอร์ชันและการแก้ไข</p>
              <ol className="relative flex flex-col gap-[10px] border-l-2 border-blue-20 pl-[16px]">
                {[...curDoc.history].reverse().map((h, i) => <li key={i} className="relative"><span className={`absolute top-[4px] -left-[22px] size-[10px] rounded-full ring-4 ring-white ${i === 0 ? 'bg-blue-00' : 'bg-blue-20'}`} /><p className="text-[12px] font-medium">เวอร์ชัน {h.v} <span className="font-light text-gray-30">· {h.by}</span></p><p className="text-[11px] font-light text-gray-20">{h.at}</p><p className="text-[12px] font-light text-gray-30">{h.note}</p></li>)}
              </ol></div>
          </div>
        )}
      </Modal>

      {/* import / edit metadata (admin) */}
      <Modal open={imp.open} onClose={() => setImp({ ...imp, open: false })} title={imp.edit ? 'แก้ไขหมวดหมู่ / แท็ก / สิทธิ์' : 'นำเข้าข้อมูลความรู้'} width="max-w-[580px]">
        <div className="flex max-h-[68vh] flex-col gap-[12px] overflow-y-auto pr-[4px]">
          {!imp.edit && (
            <>
              <button type="button" aria-label="เลือกไฟล์ความรู้" onClick={() => pick.current?.click()} className="flex flex-col items-center gap-[6px] rounded-[14px] border-2 border-dashed border-blue-20 p-[22px] text-[12px] font-light text-gray-30 hover:bg-blue-bg/50"><span className="text-blue-00"><Ic d={I.upload} s={26} /></span><span className="text-[13px] font-medium text-blue-00">{imp.file ?? 'คลิกเพื่อเลือกไฟล์'}</span><span>PDF, Word หรือ Excel ขนาดไม่เกิน 20 MB</span></button>
              <input ref={pick} type="file" hidden aria-label="ไฟล์ที่นำเข้า" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv" onChange={(e) => { onFile(e.target.files); e.target.value = '' }} />
              {imp.file && <p role="status" className="rounded-[8px] bg-[#e7f7ef] px-[10px] py-[6px] text-[12px] text-[#0f8a63]">ระบบจัดหมวดหมู่และติดแท็กให้อัตโนมัติ (คำแนะนำ) กรุณาตรวจสอบก่อนยืนยัน</p>}
            </>
          )}
          <Row label="ชื่อเอกสาร" req><input aria-label="ชื่อเอกสาร" value={imp.title} onChange={(e) => setImp({ ...imp, title: e.target.value })} className={ctl} /></Row>
          <Row label="หมวดหมู่" req><select aria-label="หมวดหมู่เอกสาร" value={imp.category} onChange={(e) => setImp({ ...imp, category: e.target.value as Category })} className={ctl}>{categories.map((c) => <option key={c}>{c}</option>)}</select></Row>
          <Row label="แท็ก" req hint="คั่นด้วยเครื่องหมายจุลภาค (,)"><input aria-label="แท็ก" value={imp.tags} onChange={(e) => setImp({ ...imp, tags: e.target.value })} className={ctl} /></Row>
          <Row label="สิทธิ์การเข้าถึง" req><select aria-label="สิทธิ์การเข้าถึง" value={imp.access} onChange={(e) => setImp({ ...imp, access: e.target.value as Access })} className={ctl}>{accessLevels.map((a) => <option key={a}>{a}</option>)}</select></Row>
          {imp.err && <p role="alert" className="text-[12px] text-red-00">{imp.err}</p>}
          <div className="flex justify-end gap-[8px]"><Btn kind="ghost" onClick={() => setImp({ ...imp, open: false })}>ยกเลิก</Btn><Btn onClick={saveImport}>{imp.edit ? 'บันทึก' : 'ยืนยันนำเข้า'}</Btn></div>
        </div>
      </Modal>

      {/* update a document → new version */}
      <Modal open={!!upd.d} onClose={() => setUpd({ ...upd, d: undefined })} title="อัปเดตเอกสาร (เวอร์ชันใหม่)" width="max-w-[520px]">
        {upd.d && (
          <div className="flex flex-col gap-[12px]">
            <p className="text-[13px] font-medium">{upd.d.title} <span className="font-light text-gray-30">— ปัจจุบันเวอร์ชัน {upd.d.version}</span></p>
            <button type="button" aria-label="เลือกไฟล์เวอร์ชันใหม่" onClick={() => updPick.current?.click()} className="rounded-[12px] border-2 border-dashed border-blue-20 p-[16px] text-[12px] text-gray-30 hover:bg-blue-bg/50">{upd.file || 'เลือกไฟล์เวอร์ชันใหม่ (ไม่บังคับ)'}</button>
            <input ref={updPick} type="file" hidden aria-label="ไฟล์เวอร์ชันใหม่" onChange={(e) => { const f = e.target.files?.[0]; if (f) setUpd({ ...upd, file: f.name }); e.target.value = '' }} />
            <Row label="สิ่งที่แก้ไข" req error={upd.err}><textarea aria-label="สิ่งที่แก้ไข" value={upd.note} onChange={(e) => setUpd({ ...upd, note: e.target.value, err: '' })} placeholder="อธิบายสิ่งที่ปรับปรุงในเวอร์ชันนี้" className={`${ta} !min-h-[72px] ${upd.err ? err : ''}`} /></Row>
            <div className="flex justify-end gap-[8px]"><Btn kind="ghost" onClick={() => setUpd({ ...upd, d: undefined })}>ยกเลิก</Btn><Btn onClick={() => { if (upd.note.trim().length < 5) { setUpd({ ...upd, err: 'กรุณาอธิบายสิ่งที่แก้ไขอย่างน้อย 5 ตัวอักษร' }); return } newVersion(upd.d!, {}, `${upd.note.trim()}${upd.file ? ` (ไฟล์ ${upd.file})` : ''}`); setUpd({ ...upd, d: undefined }); show('บันทึกเวอร์ชันใหม่และต่อวาระทบทวนแล้ว') }}>บันทึกเวอร์ชันใหม่</Btn></div>
          </div>
        )}
      </Modal>

      {/* online classroom */}
      <Modal open={!!curEnr && !!curCourse} onClose={() => { setRoom(undefined); setQuiz(undefined) }} title={curCourse?.title ?? ''} width="max-w-[760px]">
        {curEnr && curCourse && (
          <div className="flex max-h-[70vh] flex-col gap-[12px] overflow-y-auto pr-[4px]">
            {!quiz ? (
              <>
                <div className="flex aspect-video items-center justify-center rounded-[12px] bg-gradient-to-br from-[#14264f] to-[#1f5ac8] text-white"><div className="text-center"><span className="mx-auto flex size-[52px] items-center justify-center rounded-full bg-white/20"><Ic d={I.play} s={22} /></span><p className="mt-[8px] text-[13px]">{curEnr.done < curCourse.lessons.length ? `บทที่ ${curEnr.done + 1}: ${curCourse.lessons[curEnr.done].title}` : 'เรียนครบทุกบทแล้ว'}</p><p className="text-[11px] opacity-70">พื้นที่เล่นวิดีโอ (ตัวอย่างระบบจำลอง)</p></div></div>
                <ol aria-label="บทเรียน" className="flex flex-col gap-[6px]">
                  {curCourse.lessons.map((l, i) => (
                    <li key={l.title} className="flex items-center gap-[10px] rounded-[10px] border border-gray-line-2 px-[12px] py-[8px] text-[13px]">
                      <span className={`flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] ${i < curEnr.done ? 'bg-[#17a673] text-white' : 'bg-gray-bg text-gray-30'}`}>{i < curEnr.done ? <Ic d={I.check} s={12} w={2.6} /> : i + 1}</span>
                      <span className="min-w-0 flex-1">{l.title}</span><span className="text-[11px] font-light text-gray-20">{l.minutes} นาที</span>
                      {i === curEnr.done && curEnr.status !== 'เรียนจบ' && <button type="button" onClick={() => setE(curEnr, { done: curEnr.done + 1 })} className="h-[28px] rounded-[8px] bg-blue-00 px-[12px] text-[11px] font-medium text-white hover:brightness-110">เรียนจบบทนี้</button>}
                    </li>
                  ))}
                </ol>
                <div className="flex flex-wrap items-center gap-[8px] rounded-[12px] bg-gray-subtle p-[12px] text-[12px]">
                  <span>แบบทดสอบก่อนเรียน: <b className="font-semibold">{curEnr.pre != null ? `${curEnr.pre}%` : 'ยังไม่ทำ'}</b></span><span className="text-gray-20">·</span>
                  <span>หลังเรียน: <b className="font-semibold">{curEnr.post != null ? `${curEnr.post}%` : 'ยังไม่ทำ'}</b> (ผ่านเมื่อ ≥ {PASS}%)</span>
                  <span className="flex-1" />
                  <button type="button" onClick={() => setQuiz({ kind: 'pre', picks: [] })} className="h-[32px] rounded-[8px] border border-blue-00 px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg">ทำแบบทดสอบก่อนเรียน</button>
                  <button type="button" disabled={curEnr.done < curCourse.lessons.length || curEnr.status === 'เรียนจบ'} onClick={() => setQuiz({ kind: 'post', picks: [] })} className="h-[32px] rounded-[8px] bg-blue-00 px-[12px] text-[12px] font-medium text-white hover:brightness-110 disabled:opacity-40">ทำแบบทดสอบหลังเรียน</button>
                </div>
                {curEnr.status === 'เรียนจบ' && <p className="rounded-[10px] bg-[#e7f7ef] px-[12px] py-[8px] text-[12px] text-[#0f8a63]">เรียนจบหลักสูตรแล้ว ({thDate(curEnr.completedAt!)}) — เลขที่ใบประกาศ {curEnr.certNo}</p>}
              </>
            ) : (
              <>
                <p className="text-[14px] font-semibold">{quiz.kind === 'pre' ? 'แบบทดสอบก่อนเรียน' : 'แบบทดสอบหลังเรียน'}</p>
                {curCourse.quiz.map((q, qi) => (
                  <fieldset key={q.q} className="flex flex-col gap-[6px] rounded-[12px] border border-gray-line-2 p-[12px]" disabled={quiz.result != null}>
                    <legend className="px-[4px] text-[13px] font-medium">{qi + 1}. {q.q}</legend>
                    {q.options.map((o, oi) => (
                      <label key={o} className={`flex cursor-pointer items-center gap-[8px] rounded-[8px] px-[10px] py-[6px] text-[13px] ${quiz.result != null && oi === q.answer ? 'bg-[#e7f7ef]' : quiz.result != null && quiz.picks[qi] === oi ? 'bg-[#ffe9e9]' : 'hover:bg-blue-bg/50'}`}>
                        <input type="radio" name={`q${qi}`} checked={quiz.picks[qi] === oi} onChange={() => { const p = [...quiz.picks]; p[qi] = oi; setQuiz({ ...quiz, picks: p }) }} className="accent-[#1f5ac8]" />{o}
                      </label>
                    ))}
                  </fieldset>
                ))}
                {quiz.result != null ? (
                  <div className={`flex flex-wrap items-center gap-[10px] rounded-[12px] p-[12px] ${quiz.kind === 'post' && quiz.result < PASS ? 'bg-[#fff1d6]' : 'bg-[#e7f7ef]'}`}>
                    <p className="min-w-0 flex-1 text-[13px] font-medium">ได้คะแนน {quiz.result}% {quiz.kind === 'post' ? (quiz.result >= PASS ? '— ผ่านเกณฑ์ เรียนจบหลักสูตรแล้ว' : `— ยังไม่ผ่านเกณฑ์ ${PASS}% ลองทบทวนบทเรียนแล้วทำใหม่`) : '— บันทึกผลก่อนเรียนแล้ว'}</p>
                    <Btn onClick={() => setQuiz(undefined)}>กลับไปห้องเรียน</Btn>
                  </div>
                ) : <div className="flex justify-end gap-[8px]"><Btn kind="ghost" onClick={() => setQuiz(undefined)}>ยกเลิก</Btn><Btn disabled={quiz.picks.filter((p) => p != null).length < curCourse.quiz.length} onClick={submitQuiz}>ส่งคำตอบ</Btn></div>}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* certificate */}
      <Modal open={!!certEnr && !!certCourse} onClose={() => setCertOf(undefined)} title="ใบประกาศนียบัตร" width="max-w-[720px]">
        {certEnr && certCourse && (
          <div className="flex flex-col gap-[12px]">
            <div className="rounded-[12px] border-[3px] border-blue-00 bg-white p-[20px] text-center" aria-label="ตัวอย่างใบประกาศ">
              <p className="text-[12px] text-blue-00">สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน)</p>
              <p className="my-[6px] text-[24px] font-bold text-blue-dark">ใบประกาศนียบัตร</p>
              <p className="text-[12px] text-gray-30">ขอมอบให้ไว้เพื่อแสดงว่า</p>
              <p className="my-[6px] text-[20px] font-semibold text-blue-00">{kPersonas.staff.name}</p>
              <p className="text-[12px] text-gray-30">ได้ผ่านการเรียนและผ่านเกณฑ์การประเมินหลักสูตร</p>
              <p className="my-[6px] text-[15px] font-semibold">{certCourse.title}</p>
              <p className="text-[11px] text-gray-20">วันที่ {thDate(certEnr.completedAt!)} · เลขที่ {certEnr.certNo}</p>
            </div>
            <div className="flex justify-end gap-[8px]"><Btn kind="ghost" onClick={() => setCertOf(undefined)}>ปิด</Btn><Btn onClick={() => { saveText(`${certEnr.certNo}.svg`, certificateSvg(kPersonas.staff.name, certCourse.title, thDate(certEnr.completedAt!), certEnr.certNo!), 'image/svg+xml'); show('ดาวน์โหลดใบประกาศแล้ว') }}>ดาวน์โหลดใบประกาศ (SVG)</Btn></div>
          </div>
        )}
      </Modal>
      {toast}
    </div>
  )
}
