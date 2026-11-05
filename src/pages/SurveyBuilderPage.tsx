import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import iconArrowClockwise from '../assets/builder/icon-arrow-clockwise.svg'
import iconArrowLeft from '../assets/builder/icon-arrow-left.svg'
import iconCopy from '../assets/builder/icon-copy.svg'
import iconEyeSm from '../assets/builder/icon-eye-sm.svg'
import iconEye from '../assets/builder/icon-eye.svg'
import iconSaveBlue from '../assets/builder/icon-save-blue.svg'
import iconSave from '../assets/builder/icon-save.svg'
import iconSend from '../assets/builder/icon-send.svg'
import iconTrash from '../assets/builder/icon-trash.svg'
import iconPdf from '../assets/results/icon-pdf.svg'
import iconSearchWhite from '../assets/results/icon-search-white.svg'
import iconSendGray from '../assets/results/icon-send-gray.svg'
import iconTrashBlue from '../assets/results/icon-trash-blue.svg'
import iconXls from '../assets/results/icon-xls.svg'
import QuestionsTab from '../components/builder/QuestionsTab'
import ResponsesTab, { countQuestions } from '../components/builder/ResponsesTab'
import SettingsTab from '../components/builder/SettingsTab'
import { newDraft, scheduleInvalid, uid, type SurveyDraft } from '../data/surveyBuilder'
import { mockResults, realResults, responseRows } from '../data/surveyResults'
import { deleteSurvey, getSurvey, loadDraft, loadResponses, nextSurveyId, saveDraft, useSurveys } from '../lib/surveyStore'

type Tab = 'questions' | 'responses' | 'settings'
const tabs: { key: Tab; label: string }[] = [
  { key: 'questions', label: 'คำถาม' },
  { key: 'responses', label: 'ดูผลลัพธ์' },
  { key: 'settings', label: 'ตั้งค่า' },
]

const iconBtn =
  'flex shrink-0 items-center justify-center rounded-[8px] border border-gray-line bg-white p-[10px] transition-colors hover:border-blue-10 hover:bg-blue-bg focus-visible:outline-2 focus-visible:outline-blue-00'
const btnPrimary = 'flex items-center gap-[4px] rounded-[8px] bg-blue-00 px-[12px] py-[10px] transition hover:brightness-110 active:brightness-95'
const btnText = 'p-[2px] text-[14px] leading-[normal] font-medium whitespace-nowrap'

/** Figma OSS-Survey/Create-Question (114:7383), Create-Responses (114:10222), Create-Setting (114:10583) */
export default function SurveyBuilderPage() {
  const params = useParams()
  const navigate = useNavigate()
  const editingId = params.id ? Number(params.id) : null
  const isNew = editingId === null
  const initial = useMemo(() => (isNew ? newDraft(nextSurveyId()) : loadDraft(editingId)), [isNew, editingId])
  const [draft, setDraft] = useState<SurveyDraft>(initial)
  const [tab, setTab] = useState<Tab>('questions')
  const [toast, setToast] = useState<string>()
  const [confirm, setConfirm] = useState<'clear' | 'delete' | null>(null)
  const [dirty, setDirty] = useState(false)
  const row = useSurveys().find((s) => s.id === draft.id)

  useEffect(() => setDraft(initial), [initial])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(undefined), 2600)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const update = (d: SurveyDraft) => {
    setDraft(d)
    setDirty(true)
  }
  const save = (status?: 'draft' | 'published', msg = 'บันทึกแบบร่างแล้ว') => {
    if (!draft.title.trim()) {
      setTab('questions')
      setToast('กรุณาตั้งชื่อแบบสอบถามก่อนบันทึก')
      return
    }
    if (scheduleInvalid(draft.settings)) {
      setTab('settings')
      setToast('วันเวลาสิ้นสุดต้องหลังวันเวลาเริ่มการเผยแพร่')
      return
    }
    saveDraft(draft, status)
    setDirty(false)
    setToast(msg)
    if (isNew) navigate(`/survey/${draft.id}/edit`, { replace: true })
  }
  const duplicate = () => {
    const id = nextSurveyId()
    const copy: SurveyDraft = { ...structuredClone(draft), id, title: `${draft.title} (สำเนา)`, settings: { ...draft.settings, slug: `survey-${String(id).padStart(3, '0')}` } }
    copy.sections = copy.sections.map((s) => ({ ...s, id: uid('s') }))
    saveDraft(copy, 'draft')
    setToast('ทำสำเนาแล้ว')
    navigate(`/survey/${id}/edit`)
  }
  const preview = () => navigate(`/survey/${draft.id}/preview`)
  /**
   * "หลังจากส่วนที่ N › ไปยังส่วนถัดไป" link: save, then open the respondent page (Answer/FirstPage) at that section.
   * Published surveys open the real link; drafts open the preview (an unpublished survey can't be answered).
   */
  const openAnswer = (sectionIndex: number | null) => {
    if (!draft.title.trim()) return setToast('กรุณาตั้งชื่อแบบสอบถามก่อน')
    saveDraft(draft)
    setDirty(false)
    const q = `?section=${sectionIndex ?? 'end'}`
    // so browser Back returns to this saved survey, not a fresh /survey/create
    if (isNew) navigate(`/survey/${draft.id}/edit`, { replace: true })
    navigate(row?.status === 'published' ? `/s/${draft.settings.slug}${q}` : `/survey/${draft.id}/answer${q}`)
  }
  const responses = row?.responses ?? 0
  // answer sheets kept in the browser; re-read when the count changes
  const sheets = useMemo(() => (responses ? loadResponses(draft.id) : []), [draft.id, responses])
  const status = row?.status ?? 'draft'
  const showResults = tab === 'responses' && responses > 0

  // "XLS" export: UTF-8 CSV (opens in Excel) of the summary tables
  const exportCsv = () => {
    const lines = [
      ['เรื่อง', draft.title],
      ['ผู้ตอบแบบสอบถาม', String(responses)],
      ['คำถาม', String(countQuestions(draft))],
      ['ระยะเวลาตอบแบบสอบถาม', `${draft.settings.startDate} ถึง ${draft.settings.endDate}`],
      [],
      ...(sheets.length ? realResults(draft, sheets).charts : mockResults(responses)).flatMap((r) => [
        [r.title, `จำนวน (${r.unit})`, 'ร้อยละ'],
        ...r.items.map((i) => [i.label, String(i.value), ((i.value / responses) * 100).toFixed(2)]),
        [],
      ]),
      // then every stored answer sheet, one row per respondent
      ...(sheets.length ? [['คำตอบรายบุคคล'], ...responseRows(draft, sheets)] : []),
    ]
    const cell = (c: string) => `"${c.replace(/"/g, '""')}"`
    const csv = '﻿' + lines.map((l) => l.map(cell).join(',')).join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `ผลแบบสอบถาม-${draft.settings.slug}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    setToast('ส่งออกไฟล์แล้ว')
  }

  return (
    <div className="flex w-full flex-col px-[24px] pb-[55px] max-sm:px-[12px]">
      {/* Title row */}
      <div className="flex items-center gap-[12px] pb-[12px]">
        <div className="flex min-w-0 flex-1 items-center gap-[10px]">
          <button type="button" aria-label="กลับไปหน้าจัดการแบบสำรวจ" onClick={() => navigate('/survey')} className="flex shrink-0 rounded-[8px] bg-blue-bg p-[8px] transition-colors hover:bg-blue-20">
            <img src={iconArrowLeft} alt="" width={16} height={16} />
          </button>
          <h1 className="truncate text-[20px] leading-[1.2] font-semibold text-blue-00">{showResults ? draft.title || 'ชื่อเรื่อง' : isNew || !getSurvey(draft.id) ? 'สร้างแบบสอบถาม' : 'แก้ไขแบบสอบถาม'}</h1>
          {dirty && <span className="shrink-0 rounded-[4px] bg-gray-bg px-[6px] py-[2px] text-[10px] text-gray-20">ยังไม่ได้บันทึก</span>}
        </div>
        <button type="button" aria-label="แสดงตัวอย่าง" title="แสดงตัวอย่าง" onClick={preview} className={iconBtn}>
          <img src={iconEye} alt="" width={18} height={18} />
        </button>
        <button type="button" aria-label="ทำสำเนาแบบสอบถาม" title="ทำสำเนา" onClick={duplicate} className={iconBtn}>
          <img src={iconCopy} alt="" width={18} height={18} />
        </button>
        {showResults ? (
          <button
            type="button"
            disabled={status !== 'draft'}
            onClick={() => save('published', 'เผยแพร่แบบสอบถามแล้ว')}
            title={status === 'draft' ? 'เผยแพร่' : 'เผยแพร่แล้ว'}
            className="flex shrink-0 items-center gap-[4px] rounded-[8px] bg-gray-bg px-[12px] py-[10px] enabled:bg-blue-00 disabled:cursor-not-allowed"
          >
            <img src={status === 'draft' ? iconSend : iconSendGray} alt="" width={16} height={16} className="my-px" />
            <span className={`${btnText} ${status === 'draft' ? 'text-white-soft' : 'text-gray-20'}`}>เผยแพร่</span>
          </button>
        ) : (
          <button type="button" aria-label="ลบแบบสอบถาม" title="ลบ" onClick={() => setConfirm('delete')} className={iconBtn}>
            <img src={iconTrash} alt="" width={18} height={18} />
          </button>
        )}
      </div>

      {/* Segmented tabs */}
      <div className="pb-[12px]">
        <div role="tablist" aria-label="ส่วนของแบบสอบถาม" className="flex gap-[2px] rounded-[8px] bg-blue-bg">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-[8px] px-[12px] py-[10px] text-[12px] leading-[normal] font-medium transition-colors ${
                tab === t.key ? 'bg-blue-00 text-white-soft' : 'text-blue-00 hover:bg-blue-20/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action row */}
      {tab === 'questions' && (
        <div className="flex items-center gap-[12px] pb-[12px] max-sm:flex-wrap">
          <button type="button" onClick={() => setConfirm('clear')} className="flex items-center gap-[4px] rounded-[8px] px-[2px] py-[10px] hover:opacity-80">
            <img src={iconArrowClockwise} alt="" width={16} height={16} className="my-px" />
            <span className={`${btnText} text-blue-00`}>ล้างข้อมูล</span>
          </button>
          <span className="flex-1" />
          <button type="button" onClick={preview} className="flex items-center gap-[4px] rounded-[8px] border border-gray-line bg-white px-[12px] py-[10px] transition-colors hover:border-blue-10">
            <img src={iconEyeSm} alt="" width={16} height={16} className="my-px" />
            <span className={`${btnText} text-blue-00`}>แสดงตัวอย่าง</span>
          </button>
          <button type="button" onClick={() => save()} className={btnPrimary}>
            <img src={iconSave} alt="" width={16} height={16} className="my-px" />
            <span className={`${btnText} text-white-soft`}>บันทึกแบบร่าง</span>
          </button>
        </div>
      )}
      {showResults && (
        <div className="flex items-center gap-[24px] pb-[12px] max-md:flex-wrap max-md:gap-[12px] print:hidden">
          <button type="button" onClick={() => setConfirm('delete')} className="flex items-center gap-[4px] rounded-[8px] border border-gray-line bg-white px-[12px] py-[10px] transition-colors hover:border-blue-10">
            <img src={iconTrashBlue} alt="" width={16} height={16} className="my-px" />
            <span className={`${btnText} text-blue-00`}>ลบแบบสอบถาม</span>
          </button>
          <div className="flex flex-1 items-center justify-end gap-[12px] max-sm:flex-wrap">
            <span className="text-[12px] font-light whitespace-nowrap text-black">ส่งออกผลการทำแบบสอบถาม</span>
            <button type="button" aria-label="ส่งออกเป็นไฟล์ Excel (CSV)" title="ส่งออก XLS" onClick={exportCsv} className="flex rounded-[8px] bg-blue-bg p-[10px] transition-colors hover:bg-blue-20">
              <img src={iconXls} alt="" width={18} height={18} />
            </button>
            <button type="button" aria-label="พิมพ์หรือบันทึกเป็น PDF" title="ส่งออก PDF" onClick={() => window.print()} className="flex rounded-[8px] bg-blue-bg p-[10px] transition-colors hover:bg-blue-20">
              <img src={iconPdf} alt="" width={18} height={18} />
            </button>
            <button type="button" onClick={() => navigate(`/survey/${draft.id}/report`)} className={btnPrimary}>
              <img src={iconSearchWhite} alt="" width={16} height={16} className="my-px" />
              <span className={`${btnText} text-white-soft`}>รายงานสรุปผล</span>
            </button>
          </div>
        </div>
      )}
      {tab === 'settings' && (
        <div className="flex justify-end gap-[12px] pb-[12px]">
          <button type="button" onClick={() => save(undefined, 'บันทึกการตั้งค่าแล้ว')} className="flex items-center gap-[4px] rounded-[8px] bg-blue-bg px-[12px] py-[10px] transition-colors hover:bg-blue-20">
            <img src={iconSaveBlue} alt="" width={16} height={16} className="my-px" />
            <span className={`${btnText} text-blue-00`}>บันทึกการตั้งค่า</span>
          </button>
          <button type="button" onClick={() => save('published', 'เผยแพร่แบบสอบถามแล้ว')} className={btnPrimary}>
            <img src={iconSend} alt="" width={16} height={16} className="my-px" />
            <span className={`${btnText} text-white-soft`}>เผยแพร่</span>
          </button>
        </div>
      )}

      <div role="tabpanel" aria-label={tabs.find((t) => t.key === tab)?.label}>
        {tab === 'questions' && <QuestionsTab draft={draft} onChange={update} onOpenAnswer={openAnswer} />}
        {tab === 'responses' && <ResponsesTab draft={draft} status={status} responses={responses} sheets={sheets} onPreview={preview} />}
        {tab === 'settings' && <SettingsTab value={draft.settings} onChange={(settings) => update({ ...draft, settings })} onToast={setToast} />}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[16px]" onClick={() => setConfirm(null)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()} className="flex w-full max-w-[400px] animate-[menu-in_120ms_ease-out] flex-col gap-[16px] rounded-[12px] bg-white p-[24px] shadow-2xl">
            <h2 id="confirm-title" className="text-[16px] font-medium text-black">
              {confirm === 'clear' ? 'ล้างข้อมูลแบบสอบถาม?' : 'ลบแบบสอบถาม?'}
            </h2>
            <p className="text-[14px] leading-[1.5] font-light text-gray-30">
              {confirm === 'clear' ? 'คำถามและการตั้งค่าทั้งหมดจะกลับเป็นค่าเริ่มต้น' : `“${draft.title || 'แบบสอบถามนี้'}” จะถูกลบออกจากรายการ`}
            </p>
            <div className="flex justify-end gap-[8px]">
              <button type="button" autoFocus onClick={() => setConfirm(null)} className="rounded-[8px] bg-gray-bg px-[14px] py-[8px] text-[12px] font-medium text-gray-30 hover:bg-gray-line">
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm === 'clear') {
                    const blank = newDraft(draft.id)
                    update({ ...blank, title: '', description: '', sections: [{ ...blank.sections[0], questions: [] }] })
                  } else {
                    deleteSurvey(draft.id)
                    navigate('/survey', { replace: true })
                  }
                  setConfirm(null)
                }}
                className="rounded-[8px] bg-red-00 px-[14px] py-[8px] text-[12px] font-medium text-white-soft hover:brightness-110"
              >
                {confirm === 'clear' ? 'ล้างข้อมูล' : 'ลบ'}
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
