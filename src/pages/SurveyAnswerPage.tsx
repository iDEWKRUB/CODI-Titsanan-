import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import hero from '../assets/answer/hero.webp'
import iconArrowLeft from '../assets/builder/icon-arrow-left.svg'
import iconSaveBlue from '../assets/builder/icon-save-blue.svg'
import iconSaveGray from '../assets/builder/icon-save.svg'
import iconSend from '../assets/builder/icon-send.svg'
import iconSquares from '../assets/dashboard/icon-squares-four-blue.svg'
import codiLogo from '../assets/login/logo-codi.webp'
import AnswerQuestion, { isAnswered, type Answers } from '../components/answer/AnswerQuestion'
import { FieldPreview } from '../components/builder/GeneralInfo'
import { FormattedDescription } from '../components/builder/QuestionsTab'
import AppFooter from '../components/dashboard/AppFooter'
import Select from '../components/ui/Select'
import type { SurveyDraft } from '../data/surveyBuilder'
import { currentUser } from '../lib/auth'
import { clearAnswers, findDraftBySlug, getSurvey, loadAnswers, loadDraft, recordResponse, saveAnswers } from '../lib/surveyStore'

const provinces = ['10 กรุงเทพมหานคร', '50 เชียงใหม่', '40 ขอนแก่น', '90 สงขลา', '20 ชลบุรี']
const communities = ['001', '002', '003', '004', '005']

function Closed({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-[12px] px-[24px] text-center">
      <img src={codiLogo} alt="CODI" width={64} height={64} />
      <h1 className="text-[20px] font-semibold text-blue-00">{title}</h1>
      <p className="max-w-[420px] text-[14px] font-light text-gray-30">{message}</p>
    </div>
  )
}

/**
 * Respondent view — Figma OSS-Survey/Answer/Preview (123:7943) and Answer/FirstPage (177:13160, 177:14806).
 * `preview` = opened by the survey owner from the builder; otherwise the public link /s/:slug.
 */
export default function SurveyAnswerPage({ preview = false, previewHeader = true }: { preview?: boolean; previewHeader?: boolean }) {
  const { id, slug } = useParams()
  const navigate = useNavigate()
  const draft: SurveyDraft | null = useMemo(() => (preview ? loadDraft(Number(id)) : slug ? findDraftBySlug(slug) : null), [preview, id, slug])
  const row = draft ? getSurvey(draft.id) : undefined
  const [answers, setAnswers] = useState<Answers>(() => (draft && !preview ? loadAnswers(draft.id) : {}))
  const [search] = useSearchParams()
  // ?section=N|end — opened from the builder's "หลังจากส่วนที่ N" link: page 1, scrolled to that section
  const sectionParam = search.get('section')
  /**
   * Pages follow Figma: หน้าที่ 1 = Answer/FirstPage 177:13160 (ทั่วไป + every section, "ถัดไป"),
   * หน้าที่ 2–3 = listed but not available yet, หน้าที่ 4 = 177:14806 (sections again, "ก่อนหน้า" + "ส่งคำตอบ").
   */
  const [pageNo, setPageNo] = useState<1 | 4>(1)
  const [errors, setErrors] = useState<Set<string>>(new Set())
  const [meta, setMeta] = useState({ province: '', community: '', household: '' })
  const [general, setGeneral] = useState<Record<string, string>>({})
  const generalRef = useRef<HTMLElement>(null)
  const [toast, setToast] = useState<string>()
  const [done, setDone] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setConfirming(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [confirming])
  const user = currentUser()

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(undefined), 2600)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!draft || sectionParam === null) return
    const n = sectionParam === 'end' ? draft.sections.length - 1 : Number(sectionParam)
    const target = draft.sections[n]
    if (target) requestAnimationFrame(() => document.getElementById(`section-${target.id}`)?.scrollIntoView({ behavior: 'smooth' }))
  }, [draft, sectionParam])

  if (!draft) return <Closed title="ไม่พบแบบสอบถาม" message="ลิงก์นี้อาจไม่ถูกต้อง หรือแบบสอบถามยังไม่ได้บันทึก/เผยแพร่" />
  if (!preview) {
    const s = draft.settings
    const now = new Date().toISOString().slice(0, 16)
    const before = s.scheduled && now < `${s.startDate}T${s.startTime}`
    const after = s.scheduled && now > `${s.endDate}T${s.endTime}`
    if (row?.status === 'draft') return <Closed title={draft.title} message="แบบสอบถามนี้ยังไม่เผยแพร่" />
    if (row?.status === 'closed' || !s.acceptResponses || after) return <Closed title={draft.title} message="แบบสอบถามนี้ปิดรับคำตอบแล้ว ขอบคุณที่ให้ความสนใจ" />
    if (before) return <Closed title={draft.title} message={`แบบสอบถามจะเปิดรับคำตอบวันที่ ${s.startDate} เวลา ${s.startTime} น.`} />
  }
  if (done) return <Closed title="ส่งคำตอบเรียบร้อย" message={`ขอบคุณที่ตอบ “${draft.title}” ข้อมูลของท่านถูกบันทึกแล้ว`} />

  const last = pageNo === 4
  const progress = pageNo === 1 ? 25 : 100
  const accent = draft.theme.color
  const showGeneral = pageNo === 1 && draft.general.enabled && draft.general.fields.length > 0
  const pageOptions = [1, 2, 3, 4].map((n) => ({ value: String(n), label: `คำถามหน้าที่ ${n}`, disabled: n === 2 || n === 3 }))

  const answer = (key: string, v: unknown) => {
    setAnswers((a) => ({ ...a, [key]: v }))
    setErrors((e) => {
      if (!e.has(key)) return e
      const n = new Set(e)
      n.delete(key)
      return n
    })
  }
  const validate = () => {
    const missing = draft.sections.flatMap((s) => s.questions).filter((q) => q.required && !isAnswered(q, answers)).map((q) => q.id)
    setErrors(new Set(missing))
    if (missing.length) {
      document.getElementById(`q-${missing[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setToast(`กรุณาตอบคำถามที่จำเป็นอีก ${missing.length} ข้อ`)
    }
    return missing.length === 0
  }
  const go = (n: 1 | 4) => {
    setPageNo(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  // ข้อมูลทั่วไป only renders on page 1, so its inputs are read before leaving it
  const readGeneral = () => {
    const out: Record<string, string> = {}
    generalRef.current?.querySelectorAll<HTMLInputElement>('input[aria-label]').forEach((el) => {
      const k = el.getAttribute('aria-label')!
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (el.checked) out[k] = 'ใช่'
      } else if (el.value) out[k] = (out[k] ?? '') + el.value // digit boxes share one label
    })
    return out
  }
  const next = () => {
    if (!validate()) return
    setGeneral((g) => ({ ...g, ...readGeneral() }))
    go(4)
  }
  const back = () => go(1)
  const pickPage = (v: string) => (v === '4' ? next() : go(1))
  const saveProgress = () => {
    if (preview) return setToast('โหมดตัวอย่าง: คำตอบจะไม่ถูกบันทึก')
    saveAnswers(draft.id, answers)
    setToast('บันทึกคำตอบไว้แล้ว กลับมาตอบต่อได้')
  }
  /** "ส่งคำตอบ" → validate → Figma Popup/Confirm → confirmSubmit */
  const submit = () => {
    if (!validate()) return
    setConfirming(true)
  }
  /** Sheet is kept in the browser (localStorage) for ดูผลลัพธ์ until the survey API exists. */
  const confirmSubmit = () => {
    setConfirming(false)
    recordResponse(draft.id, { email: user?.email, meta, general: { ...general, ...readGeneral() }, answers })
    clearAnswers(draft.id)
    // Owner testing from the builder goes straight back to the survey list; public respondents get a thank-you screen
    if (preview) return navigate('/survey', { state: { toast: `ส่งคำตอบ “${draft.title}” แล้ว` } })
    setDone(true)
    window.scrollTo({ top: 0 })
  }

  let number = 0
  const btn = 'flex items-center gap-[4px] rounded-[8px] px-[12px] py-[10px] text-[14px] font-medium transition-colors'

  return (
    <div className="relative min-h-svh overflow-x-clip" style={{ background: draft.theme.backgroundImage ? undefined : '#fff' }}>
      <img
        src={draft.theme.backgroundImage ?? hero}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[511px] w-full object-cover select-none"
      />
      <div className="relative mx-auto flex w-full max-w-[1100px] flex-col gap-[12px] px-[24px] pt-[24px] max-sm:px-[12px]">
        {preview && previewHeader && (
          <div className="flex items-center gap-[10px] pb-[12px]">
            <button type="button" aria-label="กลับไปแก้ไขแบบสอบถาม" onClick={() => navigate(`/survey/${draft.id}/edit`)} className="flex rounded-[8px] bg-blue-bg p-[8px] hover:bg-blue-20">
              <img src={iconArrowLeft} alt="" width={16} height={16} />
            </button>
            <h1 className="text-[20px] leading-[1.2] font-semibold text-blue-00">แสดงตัวอย่าง</h1>
          </div>
        )}

        {/* Header (glass) */}
        <section className="flex flex-col gap-[24px] rounded-[12px] bg-gray-bg/70 p-[12px] backdrop-blur-md" style={{ borderTop: `6px solid ${accent}` }}>
          <div className="flex gap-[24px] p-[24px] max-sm:flex-col-reverse max-sm:p-[12px]">
            <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
              <h2 className="text-[20px] leading-[1.2] font-semibold text-gray-30">{draft.title}</h2>
              {draft.description && <FormattedDescription text={draft.description} />}
            </div>
            <img src={draft.theme.logo ?? codiLogo} alt="โลโก้" className="size-[58px] shrink-0 object-contain" />
          </div>
          <div className="flex gap-[12px] max-md:flex-col">
            <div className="flex flex-1 gap-[12px]">
              <Select className="flex-1" label="รหัสจังหวัด" placeholder="รหัสจังหวัด" value={meta.province} onChange={(province) => setMeta((m) => ({ ...m, province }))} options={provinces.map((p) => ({ value: p, label: p }))} />
              <Select className="flex-1" label="เลขที่ชุมชน" placeholder="เลขที่ชุมชน" value={meta.community} onChange={(community) => setMeta((m) => ({ ...m, community }))} options={communities.map((c) => ({ value: c, label: c }))} />
            </div>
            <input aria-label="ลำดับครัวเรือน" placeholder="ลำดับครัวเรือน" inputMode="numeric" value={meta.household} onChange={(e) => setMeta((m) => ({ ...m, household: e.target.value }))} className="h-[46px] flex-1 rounded-[8px] border border-gray-line bg-white px-[16px] text-[14px] font-light text-black outline-none placeholder:text-gray-20 focus:border-blue-00" />
          </div>
        </section>

        {/* Respondent + progress */}
        <section className="rounded-[12px] p-[12px]" style={{ background: accent }}>
          <div className="flex flex-col gap-[4px] rounded-[12px] bg-white px-[24px] py-[12px] max-sm:px-[16px]">
            <div className="flex items-center gap-[12px]">
              <span className="truncate text-[12px] font-medium text-gray-10">{user?.email ?? 'youremail@emailaddress.com'}</span>
              {!preview && (
                <Link to="/login" className="rounded-[7px] px-[2px] py-[6px] text-[10px] font-light text-gray-20 hover:text-blue-00">
                  เปลี่ยนบัญชี
                </Link>
              )}
            </div>
            <div className="my-[7.5px] h-px bg-gray-line" />
            <div className="flex items-center gap-[12px] max-md:flex-col max-md:items-stretch">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-[12px]">
                <span className="text-[16px] font-medium text-gray-30">ประเภทแบบสอบถาม</span>
                <span className="rounded-[6px] bg-blue-20 px-[8px] py-[4px] text-[12px] font-light text-blue-00">{draft.type}</span>
              </div>
              <Select className="w-[260px] max-md:w-full" label="ไปยังหน้า" value={String(pageNo)} onChange={pickPage} options={pageOptions} />
            </div>
            <div className="flex items-center gap-[12px]">
              <span className="text-[16px] font-medium text-gray-30">ความคืบหน้า</span>
              <span className="text-[16px] font-medium text-blue-10">{progress}%</span>
              <span aria-hidden="true" className="h-[6px] max-w-[200px] flex-1 overflow-hidden rounded-full bg-blue-bg">
                <span className="block h-full rounded-full bg-blue-10 transition-[width] duration-500" style={{ width: `${progress}%` }} />
              </span>
            </div>
          </div>
        </section>

        {/* Current page */}
        {showGeneral && (
          <section ref={generalRef} className="flex flex-col gap-[24px] rounded-[12px] bg-gray-bg p-[12px]">
            <div>
              <h3 className="text-[16px] font-medium text-[#000]">{draft.general.title || (preview && previewHeader ? 'ข้อมูลทั่วไป' : 'ทั่วไป')}</h3>
              <p className="text-[11px] font-light text-black">คำถามในส่วนนี้ {draft.general.fields.length} คำถาม</p>
            </div>
            {draft.general.fields.map((f) => (
              <div key={f} className="rounded-[12px] bg-white px-[24px] py-[36px] max-sm:px-[16px] max-sm:py-[24px]">
                <FieldPreview field={f} required={!!draft.general.required[f]} />
              </div>
            ))}
          </section>
        )}
        {draft.sections.map((section, si) => (
          <section key={section.id} id={`section-${section.id}`} className="flex scroll-mt-[24px] flex-col gap-[12px] rounded-[12px] bg-gray-bg p-[12px]">
            <div>
              <h3 className="text-[16px] font-medium text-[#000]">ส่วนที่ {si + 1}</h3>
              <p className="text-[11px] font-light text-black">คำถามในส่วนนี้ {section.questions.filter((q) => q.type !== 'title' && q.type !== 'image').length} คำถาม</p>
            </div>
            {(section.title || section.description) && (
              <div className="rounded-[12px] px-[24px] py-[12px] text-white" style={{ background: accent }}>
                {section.title && <p className="text-[24px] leading-[1.45] font-semibold">{section.title}</p>}
                {section.description && <p className="text-[12px] font-light">{section.description}</p>}
              </div>
            )}
            {section.questions.map((q) => {
              if (q.type !== 'title' && q.type !== 'image') number++
              return <AnswerQuestion key={q.id} q={q} number={number} answers={answers} onAnswer={answer} error={errors.has(q.id)} />
            })}
            {section.questions.length === 0 && <p className="rounded-[12px] bg-white p-[24px] text-center text-[14px] font-light text-gray-20">ส่วนนี้ยังไม่มีคำถาม</p>}
          </section>
        ))}

        {/* Navigation */}
        <div className="flex flex-col gap-[24px] py-[24px]">
          <div className="flex items-center gap-[24px] max-sm:flex-wrap max-sm:gap-[12px]">
            <Select className="w-[260px] max-sm:w-full" label="หน้าคำถาม" value={String(pageNo)} onChange={pickPage} options={pageOptions} />
            {last && (
              <button type="button" onClick={back} className={`${btn} bg-blue-bg text-blue-00 hover:bg-blue-20`}>
                ← ก่อนหน้า
              </button>
            )}
            {!last && (
              <button type="button" onClick={next} className={`${btn} bg-blue-bg text-blue-00 hover:bg-blue-20`}>
                ถัดไป →
              </button>
            )}
            <span className="flex-1" />
            {/* Figma: grey on หน้าที่ 1, blue tonal on หน้าที่ 4 */}
            <button type="button" onClick={saveProgress} className={`${btn} ${last ? 'bg-blue-bg text-blue-00 hover:bg-blue-20' : 'bg-gray-bg text-gray-20 hover:bg-gray-line'}`}>
              <img src={last ? iconSaveBlue : iconSaveGray} alt="" width={16} height={16} className={last ? '' : 'brightness-0 opacity-50'} />
              บันทึกคำตอบ
            </button>
          </div>
          {last && (
            <div className="flex justify-end">
              <button type="button" onClick={submit} className={`${btn} bg-blue-00 text-white-soft hover:brightness-110`}>
                <img src={iconSend} alt="" width={16} height={16} />
                ส่งคำตอบ
              </button>
            </div>
          )}
        </div>
      </div>
      <AppFooter />

      {/* Figma Popup/Confirm */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[16px]" onClick={() => setConfirming(false)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-submit-title"
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-[456px] animate-[menu-in_120ms_ease-out] flex-col items-center gap-[24px] rounded-[12px] bg-white p-[24px] shadow-2xl"
          >
            <h2 id="confirm-submit-title" className="flex h-[24px] items-center gap-[10px] text-[20px] leading-[1.2] font-semibold text-blue-00">
              <img src={iconSquares} alt="" width={24} height={24} />
              ยืนยันการส่งคำตอบ
            </h2>
            <div className="flex w-full justify-center gap-[12px]">
              <button
                type="button"
                autoFocus
                onClick={() => setConfirming(false)}
                className="h-[45px] w-[128px] rounded-[8px] border border-gray-line bg-white text-[14px] font-medium text-blue-00 outline-none transition-colors hover:border-blue-10 focus-visible:border-blue-00 focus-visible:ring-2 focus-visible:ring-blue-20 max-sm:flex-1"
              >
                ยกเลิก
              </button>
              <button type="button" onClick={confirmSubmit} className="h-[45px] w-[128px] rounded-[8px] bg-blue-00 text-[14px] font-medium text-white-soft transition hover:brightness-110 max-sm:flex-1">
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
      <div aria-live="polite" className="pointer-events-none fixed bottom-[24px] left-1/2 z-50 -translate-x-1/2">
        {toast && <div className="animate-[menu-in_120ms_ease-out] rounded-[10px] bg-gray-30 px-[16px] py-[10px] text-[13px] text-white shadow-lg">{toast}</div>}
      </div>
    </div>
  )
}
