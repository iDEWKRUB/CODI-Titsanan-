import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import iconArrowLeft from '../assets/builder/icon-arrow-left.svg'
import iconChat from '../assets/meeting/a-chat.svg'
import iconCheck from '../assets/meeting/a-check.svg'
import iconFile from '../assets/meeting/a-file.svg'
import iconGear from '../assets/meeting/a-gear.svg'
import iconLine from '../assets/meeting/a-line.svg'
import iconPause from '../assets/meeting/a-pause.svg'
import iconRecord from '../assets/meeting/a-record.svg'
import iconVoice from '../assets/meeting/a-voice.svg'
import iconX from '../assets/meeting/a-x.svg'
import Toggle from '../components/ui/Toggle'
import useDismiss from '../components/ui/useDismiss'
import { sampleSummary, voteLabel, type Agenda, type Meeting, type VoteChoice } from '../data/meetings'
import { updateMeeting, useMeetings } from '../lib/meetingStore'
import useSpeech, { speechSupported } from '../lib/useSpeech'
import { placeText, whenText } from './MeetingDetailPage'

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

const voteStyle: Record<VoteChoice, { bg: string; text: string; icon?: string }> = {
  approve: { bg: 'bg-green', text: 'text-green-bg', icon: iconCheck },
  reject: { bg: 'bg-red-00', text: 'text-red-20', icon: iconX },
  abstain: { bg: 'bg-yellow', text: 'text-[#faf9d8]' },
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="text-[14px] text-ink opacity-90">
      <span className="font-medium">{label} : </span>
      <span className="font-light">{children}</span>
    </p>
  )
}

function Files({ files }: { files: string[] }) {
  if (!files.length) return null
  return (
    <div className="flex flex-col gap-[4px]">
      <p className="text-[14px] font-medium text-ink opacity-90">ไฟล์ประกอบ</p>
      {files.map((f) => (
        <span key={f} className="flex items-center gap-[10px]">
          <span className="flex rounded-[5px] p-[3px]">
            <img src={iconFile} alt="" width={18} height={18} />
          </span>
          <span className="text-[12px] font-light text-ink opacity-90">{f}</span>
        </span>
      ))}
    </div>
  )
}

function AgendaSection({ m, a, index }: { m: Meeting; a: Agenda; index: number }) {
  const [writing, setWriting] = useState(false)
  const [text, setText] = useState('')
  const patch = (fn: (x: Agenda) => Agenda) => updateMeeting(m.id, (mm) => ({ ...mm, agendas: mm.agendas.map((g) => (g.id === a.id ? fn(g) : g)) }))
  const vote = (choice: VoteChoice) =>
    patch((g) => {
      const votes = { ...g.votes }
      if (g.myVote) votes[g.myVote] = Math.max(0, votes[g.myVote] - 1)
      if (g.myVote === choice) return { ...g, votes, myVote: undefined } // tap again = withdraw
      votes[choice] += 1
      return { ...g, votes, myVote: choice }
    })
  const total = a.votes.approve + a.votes.reject + a.votes.abstain
  const canceled = m.status === 'canceled'

  return (
    <section id={`agenda-${a.id}`} className="flex scroll-mt-[24px] flex-col gap-[12px] p-[24px] max-sm:px-0">
      <h2 className="flex min-h-[48px] items-center text-[24px] leading-[1.1] font-medium text-blue-00 max-sm:text-[20px]">
        <span>
          ระเบียบวาระที่ {index + 1} <span className="text-gray-30">{a.title}</span>
        </span>
      </h2>
      {a.subItems.length > 0 && (
        <ul className="flex flex-col gap-[2px] text-[14px] font-light text-ink opacity-90">
          {a.subItems.map((s, i) => (
            <li key={s}>
              {index + 1}.{i + 1} {s}
            </li>
          ))}
        </ul>
      )}
      {a.detail && (
        <div className="flex flex-col gap-[4px]">
          <p className="text-[14px] font-medium text-ink opacity-90">รายละเอียดวาระ</p>
          <p className="max-w-[812px] text-[14px] leading-[1.6] font-light text-ink opacity-90">{a.detail}</p>
        </div>
      )}
      {a.owners.length > 0 && (
        <div className="flex flex-col gap-[4px]">
          <p className="text-[14px] font-medium text-ink opacity-90">ผู้รับผิดชอบ</p>
          <ol className="list-decimal ps-[21px] text-[14px] font-light text-ink opacity-90">
            {a.owners.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ol>
        </div>
      )}
      <Files files={a.files} />

      <label className="flex w-fit cursor-pointer items-center gap-[10px]">
        <span className="flex w-[48px] justify-center">
          <Toggle checked={a.vote} onChange={(v) => patch((g) => ({ ...g, vote: v }))} label={`ลงมติโหวตวาระที่ ${index + 1}`} />
        </span>
        <span className="text-[14px] font-medium text-ink opacity-90">ลงมติโหวต</span>
      </label>
      {a.vote && (
        <div className="flex flex-col gap-[8px]">
          <div role="group" aria-label={`ลงมติวาระที่ ${index + 1}`} className="flex gap-[24px] max-sm:flex-col max-sm:gap-[10px]">
            {(['approve', 'reject', 'abstain'] as const).map((c) => {
              const st = voteStyle[c]
              const mine = a.myVote === c
              return (
                <button
                  key={c}
                  type="button"
                  disabled={canceled}
                  aria-pressed={mine}
                  onClick={() => vote(c)}
                  className={`flex h-[45px] flex-1 items-center justify-center gap-[4px] rounded-[8px] px-[12px] transition max-sm:flex-none ${st.bg} ${a.myVote && !mine ? 'opacity-40 hover:opacity-70' : 'hover:brightness-105'} ${mine ? 'ring-2 ring-offset-2 ring-blue-dark' : ''} disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {st.icon && <img src={st.icon} alt="" width={16} height={16} />}
                  <span className={`p-[2px] text-[14px] font-medium ${st.text}`}>{voteLabel[c]}</span>
                </button>
              )
            })}
          </div>
          <p className="text-[12px] font-light text-gray-20">
            {a.myVote ? `คุณลงมติ “${voteLabel[a.myVote]}” · กดอีกครั้งเพื่อยกเลิก · ` : ''}ลงมติแล้ว {total} เสียง (เห็นชอบ {a.votes.approve} · ไม่เห็นชอบ {a.votes.reject} · งดออกเสียง {a.votes.abstain})
          </p>
        </div>
      )}

      <div className="flex flex-col gap-[8px]">
        <p className="text-[14px] font-medium text-ink opacity-90">ความคิดเห็น ({a.comments.length} รายการ)</p>
        {a.comments.length > 0 && (
          <ul className="flex max-w-[812px] flex-col gap-[6px]">
            {a.comments.map((c, i) => (
              <li key={i} className="rounded-[10px] bg-gray-subtle px-[14px] py-[10px] text-[13px] leading-[1.6] font-light text-gray-30">
                {c}
              </li>
            ))}
          </ul>
        )}
        {writing ? (
          <form
            className="flex max-w-[812px] flex-col gap-[8px]"
            onSubmit={(e) => {
              e.preventDefault()
              if (!text.trim()) return
              patch((g) => ({ ...g, comments: [...g.comments, text.trim()] }))
              setText('')
              setWriting(false)
            }}
          >
            <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="พิมพ์ความคิดเห็น..." aria-label={`ความคิดเห็นวาระที่ ${index + 1}`} className="w-full resize-y rounded-[8px] border border-gray-line px-[14px] py-[10px] text-[14px] font-light outline-none placeholder:text-gray-20 focus:border-blue-00" />
            <div className="flex justify-end gap-[8px]">
              <button type="button" onClick={() => setWriting(false)} className="rounded-[8px] px-[12px] py-[8px] text-[13px] font-medium text-gray-30 hover:bg-gray-subtle">
                ยกเลิก
              </button>
              <button type="submit" disabled={!text.trim()} className="rounded-[8px] bg-blue-00 px-[16px] py-[8px] text-[13px] font-medium text-white-soft hover:brightness-110 disabled:bg-gray-10">
                ส่งความคิดเห็น
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setWriting(true)} className="flex w-[236px] items-center justify-center gap-[4px] rounded-[8px] bg-blue-bg px-[12px] py-[10px] transition-colors hover:bg-blue-20 max-sm:w-full">
            <img src={iconChat} alt="" width={16} height={16} className="my-px" />
            <span className="p-[2px] text-[14px] font-medium text-blue-00">แสดงความคิดเห็น</span>
          </button>
        )}
      </div>
    </section>
  )
}

/** Figma OSS-Meeting/Detail/Document-Admin (194:14380) at /meeting/:id/agenda */
export default function MeetingAgendaPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const m = useMeetings().find((x) => x.id === Number(id))
  const [lang, setLang] = useState('th-TH')
  const [settings, setSettings] = useState(false)
  const [active, setActive] = useState('info')
  const settingsRoot = useRef<HTMLDivElement>(null)
  const closeSettings = useCallback(() => setSettings(false), [])
  useDismiss(settings, settingsRoot, closeSettings)
  const transcriptBox = useRef<HTMLDivElement>(null)

  const onFinal = useCallback((text: string) => m && updateMeeting(m.id, (x) => ({ ...x, transcript: [...x.transcript, text] })), [m])
  const speech = useSpeech(lang, onFinal)

  // keep the newest line in view
  useEffect(() => {
    transcriptBox.current?.scrollTo({ top: transcriptBox.current.scrollHeight, behavior: 'smooth' })
  }, [m?.transcript.length, speech.interim])

  // highlight the agenda in the contents list while scrolling
  useEffect(() => {
    if (!m) return
    const els = ['info', ...m.agendas.map((a) => a.id)].map((k) => document.getElementById(`agenda-${k}`)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver((entries) => {
      const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (top) setActive(top.target.id.replace('agenda-', ''))
    }, { rootMargin: '-10% 0px -60% 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [m])

  if (!m)
    return (
      <div className="flex flex-col items-center gap-[12px] px-[24px] py-[80px] text-center">
        <h1 className="text-[20px] font-semibold text-blue-00">ไม่พบการประชุม</h1>
        <Link to="/meeting" className="text-[14px] font-medium text-blue-00 hover:underline">
          กลับไปปฏิทินการประชุม
        </Link>
      </div>
    )

  const recording = speech.state === 'recording'
  const go = (key: string) => document.getElementById(`agenda-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const finish = () => {
    speech.stop()
    // the AI summary itself is still sample text (UI only); it shows on the สรุปการประชุม tab
    updateMeeting(m.id, (x) => ({ ...x, summary: x.summary || sampleSummary }))
  }
  const tocItem = (key: string, children: ReactNode, sub = false) => (
    <button
      key={key + (sub ? '-sub' : '')}
      type="button"
      onClick={() => go(key)}
      className={`flex w-full items-center gap-[14px] px-[14px] text-left text-[14px] font-light text-ink transition-colors hover:bg-blue-bg ${sub ? '' : 'h-[46px] pt-[8px] pb-[2px]'} ${!sub && active === key ? 'bg-blue-bg' : ''}`}
    >
      {children}
    </button>
  )

  return (
    <div className="mx-auto flex w-full max-w-[1243px] flex-col gap-[12px] px-[24px] pb-[55px] max-sm:px-[12px]">
      <div className="flex items-center gap-[10px] pb-[12px]">
        <button type="button" aria-label="กลับไปรายละเอียดการประชุม" onClick={() => navigate(`/meeting/${m.id}`)} className="flex shrink-0 rounded-[8px] bg-blue-gray p-[8px] transition-colors hover:bg-blue-20">
          <img src={iconArrowLeft} alt="" width={16} height={16} />
        </button>
        <h1 className="truncate text-[20px] leading-[1.2] font-semibold text-blue-00">วาระการประชุม</h1>
      </div>

      <div className="flex items-start gap-[12px] max-lg:flex-col">
        {/* Left: recorder, contents, transcript */}
        <aside className="sticky top-[12px] flex w-[323px] shrink-0 flex-col gap-[12px] max-lg:static max-lg:w-full">
          <div className="flex items-stretch gap-[12px]">
            <div ref={settingsRoot} className="relative">
              <button type="button" aria-label="ตั้งค่าการบันทึก" aria-expanded={settings} onClick={() => setSettings((v) => !v)} className="flex rounded-[8px] border border-gray-line bg-white p-[10px] transition-colors hover:bg-blue-bg">
                <img src={iconGear} alt="" width={18} height={18} />
              </button>
              {settings && (
                <div role="dialog" aria-label="ตั้งค่าการบันทึก" className="absolute top-[calc(100%+6px)] left-0 z-30 flex w-[240px] animate-[menu-in_120ms_ease-out] flex-col gap-[10px] rounded-[12px] bg-white p-[14px] drop-shadow-[0px_4px_10px_rgba(0,0,0,0.15)]">
                  <p className="text-[12px] font-medium text-ink">ภาษาที่พูด</p>
                  <div className="flex gap-[6px]">
                    {[
                      ['th-TH', 'ไทย'],
                      ['en-US', 'English'],
                    ].map(([v, l]) => (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={lang === v}
                        disabled={speech.state !== 'idle'}
                        onClick={() => setLang(v)}
                        className={`flex-1 rounded-[8px] px-[10px] py-[6px] text-[12px] font-medium transition-colors disabled:opacity-50 ${lang === v ? 'bg-blue-00 text-white-soft' : 'bg-blue-bg text-blue-00'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={!m.transcript.length}
                    onClick={() => {
                      updateMeeting(m.id, (x) => ({ ...x, transcript: [] }))
                      speech.reset()
                      setSettings(false)
                    }}
                    className="self-start text-[12px] font-medium text-red-00 hover:underline disabled:text-gray-10 disabled:no-underline"
                  >
                    ล้างคำบรรยายทั้งหมด
                  </button>
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-[4px] rounded-[8px] border border-gray-line bg-white px-[4px]">
              <button
                type="button"
                aria-label={recording ? 'หยุดบันทึกชั่วคราว' : 'เริ่มบันทึกเสียง'}
                onClick={() => (recording ? speech.pause() : speech.start())}
                disabled={m.status === 'canceled'}
                className="flex rounded-[6px] p-[5px] transition-colors hover:bg-blue-bg disabled:opacity-40"
              >
                <img src={recording ? iconPause : iconRecord} alt="" width={22} height={22} />
              </button>
              <span className="flex flex-1 items-center gap-[10px]">
                <span className="flex rounded-[5px] p-[3px]">
                  <img src={iconVoice} alt="" width={18} height={18} className={recording ? 'animate-pulse' : ''} />
                </span>
                <span className="flex-1 font-urbanist text-[12px] font-light text-ink opacity-90">
                  {mmss(speech.seconds)}
                  {speech.state === 'idle' && speech.seconds === 0 && <span className="ml-[6px] font-sans text-gray-20">กดเพื่อเริ่มบันทึก</span>}
                  {speech.state === 'paused' && <span className="ml-[6px] font-sans text-gray-20">หยุดชั่วคราว</span>}
                </span>
                <span className="flex size-[20px] items-center justify-center p-[2px]" aria-hidden="true">
                  <span className={`size-[10px] rounded-full ${recording ? 'animate-pulse bg-red' : 'bg-gray-10'}`} />
                </span>
              </span>
            </div>
          </div>
          {speech.error && <p className="rounded-[8px] bg-red-subtle px-[12px] py-[8px] text-[12px] font-light text-red-00">{speech.error}</p>}
          {!speechSupported() && !speech.error && <p className="rounded-[8px] bg-gray-bg px-[12px] py-[8px] text-[12px] font-light text-gray-20">ใช้ Chrome หรือ Edge เพื่อแปลงเสียงเป็นข้อความ</p>}
          {speech.state !== 'idle' && (
            <button type="button" onClick={finish} className="self-start text-[12px] font-medium text-blue-00 hover:underline">
              จบการบันทึก และสร้างสรุปการประชุม
            </button>
          )}

          <nav aria-label="สารบัญ" className="flex max-h-[375px] flex-col gap-[10px] rounded-[12px] bg-blue-20 p-[12px] max-lg:max-h-none">
            <p className="text-[16px] font-medium text-black">สารบัญ</p>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[12px] bg-white px-[4px] py-[12px]">
              {tocItem('info', 'รายละเอียดการประชุม')}
              {m.agendas.map((a, i) => [
                tocItem(a.id, <span className="truncate">{`${i + 1}. ${a.title}`}</span>),
                ...a.subItems.map((s, k) => (
                  <button key={`${a.id}-${k}`} type="button" onClick={() => go(a.id)} className="flex w-full items-center gap-[14px] px-[14px] text-left text-[14px] font-light text-ink hover:bg-blue-bg">
                    <img src={iconLine} alt="" width={30} height={46} className="shrink-0" />
                    <span className="truncate">
                      {i + 1}.{k + 1} {s}
                    </span>
                  </button>
                )),
              ])}
              {m.agendas.length === 0 && <p className="px-[14px] py-[8px] text-[12px] font-light text-gray-20">ยังไม่มีวาระ · เพิ่มได้ที่หน้าแก้ไขการประชุม</p>}
            </div>
          </nav>

          <section className="flex flex-col gap-[10px] rounded-[12px] bg-blue-gray p-[12px]">
            <h2 className="flex h-[24px] items-center justify-between text-[16px] font-medium text-black">
              คำบรรยาย
              <span className="text-[11px] font-light text-gray-20">{m.transcript.length} ประโยค</span>
            </h2>
            <div ref={transcriptBox} aria-live="polite" className="flex max-h-[320px] flex-col gap-[12px] overflow-y-auto rounded-[12px] bg-white px-[8px] py-[12px]">
              {m.transcript.length === 0 && !speech.interim && <p className="px-[4px] text-[13px] font-light text-gray-20">คำบรรยายจะแสดงที่นี่เมื่อเริ่มบันทึกเสียง</p>}
              {m.transcript.map((t, i) => {
                const last = i === m.transcript.length - 1 && !speech.interim
                return (
                  <p key={i} className={`px-[4px] text-[14px] leading-[1.5] font-light text-ink opacity-90 ${last ? 'rounded-[4px] bg-blue-bg py-[8px]' : ''}`}>
                    {t}
                  </p>
                )
              })}
              {speech.interim && <p className="rounded-[4px] bg-blue-bg px-[4px] py-[8px] text-[14px] leading-[1.5] font-light text-gray-20 italic">{speech.interim}…</p>}
            </div>
          </section>
        </aside>

        {/* Right: meeting details + agenda items */}
        <div className="flex min-w-0 flex-1 flex-col">
          <section id="agenda-info" className="flex scroll-mt-[24px] flex-col gap-[12px] p-[24px] max-sm:px-0">
            <h2 className="flex min-h-[48px] items-center text-[24px] leading-[1.1] font-medium text-blue-00 max-sm:text-[20px]">รายละเอียดการประชุม</h2>
            <Field label="เรื่อง">{m.title}</Field>
            <Field label="วันที่">{whenText(m)}</Field>
            <Field label="สถานที่ประชุม">{placeText(m) || '-'}</Field>
            {m.note && <Field label="หมายเหตุ">{m.note}</Field>}
            <Files files={m.documents} />
          </section>
          {m.agendas.map((a, i) => (
            <div key={a.id}>
              <hr className="mx-[24px] border-gray-line max-sm:mx-0" />
              <AgendaSection m={m} a={a} index={i} />
            </div>
          ))}
          {m.summary && (
            <>
              <hr className="mx-[24px] border-gray-line max-sm:mx-0" />
              <Link to={`/meeting/${m.id}?tab=summary`} className="mx-[24px] mt-[16px] self-start text-[14px] font-medium text-blue-00 hover:underline max-sm:mx-0">
                ดูสรุปการประชุม →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
