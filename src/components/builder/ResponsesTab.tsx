import { useMemo, useState } from 'react'
import iconEye from '../../assets/builder/icon-eye-sm.svg'
import type { SurveyDraft } from '../../data/surveyBuilder'
import { mockResults, realResults, type TextSummary } from '../../data/surveyResults'
import type { SurveyResponse } from '../../lib/surveyStore'
import { surveyStatusLabel, type SurveyStatus } from '../../data/surveys'
import ResultChart from './ResultChart'

const badge: Record<SurveyStatus, string> = {
  published: 'bg-[#44b4ff] text-white',
  draft: 'bg-blue-20 text-blue-00',
  closed: 'bg-gray-10 text-gray-bg',
}

export const countQuestions = (d: SurveyDraft) =>
  (d.general.enabled ? d.general.fields.length : 0) + d.sections.reduce((n, s) => n + s.questions.filter((q) => q.type !== 'title' && q.type !== 'image').length, 0)

/** Short / paragraph answers — same card as the charts, latest first */
function TextAnswers({ t }: { t: TextSummary }) {
  const [all, setAll] = useState(false)
  const list = [...t.values].reverse()
  const shown = all ? list : list.slice(0, 5)
  return (
    <article aria-labelledby={`text-${t.key}`} className="flex min-w-0 flex-col gap-[12px] rounded-[12px] border border-gray-line bg-white py-[24px] break-inside-avoid">
      <div className="flex items-center gap-[12px] px-[24px]">
        <h3 id={`text-${t.key}`} className="flex-1 text-[14px] leading-[normal] font-semibold text-blue-title">
          {t.title}
        </h3>
        <span className="text-[10px] font-light text-gray-20">{t.values.length.toLocaleString('th-TH')} คำตอบ</span>
      </div>
      {list.length === 0 ? (
        <p className="px-[24px] text-[12px] font-light text-gray-20">ยังไม่มีคำตอบ</p>
      ) : (
        <ul className="flex flex-col px-[24px]">
          {shown.map((v, i) => (
            <li key={i} className="border-b border-gray-line-2 py-[10px] text-[12px] font-light break-words whitespace-pre-line text-gray-30 last:border-0">
              {v}
            </li>
          ))}
        </ul>
      )}
      {list.length > 5 && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mx-[24px] self-start rounded-[7px] px-[2px] py-[4px] text-[12px] font-medium text-blue-00 hover:underline print:hidden">
          {all ? 'แสดงน้อยลง' : `ดูทั้งหมด (${list.length.toLocaleString('th-TH')})`}
        </button>
      )}
    </article>
  )
}

type Props = { draft: SurveyDraft; status: SurveyStatus; responses: number; sheets: SurveyResponse[]; onPreview: () => void }

/** Figma Create-Responses (114:10222, no answers yet) and Result-Responses (123:6106, with answers) */
export default function ResponsesTab({ draft, status, responses, sheets, onPreview }: Props) {
  // Real answer sheets once any were submitted; seeded demo surveys keep the Figma mock breakdown
  const { charts, texts } = useMemo(() => (sheets.length ? realResults(draft, sheets) : { charts: mockResults(responses), texts: [] }), [draft, sheets, responses])
  const closed = status === 'closed'
  const fmtDate = (d: string) => d || '-'

  return (
    <section className="flex flex-col gap-[24px] rounded-[12px] bg-gray-bg p-[12px] print:bg-white print:p-0">
      <div className="flex items-start gap-[24px] rounded-[12px] bg-white p-[24px] max-sm:flex-col max-sm:p-[16px]">
        <div className="flex flex-1 flex-col gap-[12px]">
          <div className="flex items-center gap-[10px]">
            <h2 className="text-[20px] leading-[1.2] font-semibold text-blue-00">สถานะ</h2>
            <span className={`rounded-[6px] px-[8px] py-[4px] text-[12px] font-light ${badge[status]}`}>{surveyStatusLabel[status]}</span>
          </div>
          <p className="flex items-center gap-[12px]">
            <span className="text-[14px] font-medium text-black">จำนวนผู้ตอบกลับ</span>
            <span className="font-urbanist text-[20px] leading-[1.2] font-extrabold text-blue-00">{responses.toLocaleString('th-TH')}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onPreview}
          className={`flex items-center gap-[4px] rounded-[8px] px-[12px] py-[10px] transition-colors print:hidden ${closed ? 'bg-blue-10/75 hover:bg-blue-10' : 'bg-blue-bg hover:bg-blue-20'}`}
        >
          <img src={iconEye} alt="" width={16} height={16} className={`my-px ${closed ? 'brightness-0 invert' : ''}`} />
          <span className={`p-[2px] text-[14px] font-medium ${closed ? 'text-white' : 'text-blue-00'}`}>แสดงตัวอย่าง</span>
        </button>
      </div>

      {responses === 0 ? (
        <div className="flex items-center justify-center rounded-[12px] bg-white px-[24px] py-[36px]">
          <p className="text-[14px] font-light text-gray-20">ยังไม่มีข้อมูลผู้ตอบกลับ</p>
        </div>
      ) : (
        <div id="survey-summary" className="flex flex-col gap-[24px] rounded-[12px] bg-white p-[24px] max-sm:p-[16px]">
          <h2 className="text-[20px] leading-[1.2] font-semibold text-blue-00">สรุปผล</h2>
          <dl className="flex flex-col gap-[4px] text-[12px] leading-[normal]">
            {[
              ['เรื่อง', draft.title || '-'],
              ['ผู้ตอบแบบสอบถาม', `${responses.toLocaleString('th-TH')}  คน`],
              ['คำถาม', `${countQuestions(draft)}  ข้อ`],
              ['ระยะเวลาตอบแบบสอบถาม', `${fmtDate(draft.settings.startDate)}  ถึง  ${fmtDate(draft.settings.endDate)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-wrap gap-x-[10px]">
                <dt className="font-semibold text-black">{k}</dt>
                <dd className="font-light whitespace-pre text-gray-30">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="grid grid-cols-2 items-start gap-[24px] max-md:grid-cols-1 print:grid-cols-2">
            {charts.map((s) => (
              <ResultChart key={s.key} s={s} />
            ))}
            {texts.map((t) => (
              <TextAnswers key={t.key} t={t} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
