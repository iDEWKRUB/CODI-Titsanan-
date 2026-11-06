import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import thaidLogo from '../../assets/login/thaid.webp'
import codiLogo from '../../assets/login/logo-codi.webp'
import { THAID_DEMO } from '../../lib/auth'

/**
 * "เข้าสู่ระบบด้วย ThaiD" — demo of the real ThaiD (DOPA) OpenID Connect flow:
 * QR / app hand-off → consent + PIN on the phone → code exchange → staff account match → into CODI APP.
 * Nothing leaves the browser; the phone is simulated inside the card.
 */
type Step = 'connecting' | 'qr' | 'opening' | 'consent' | 'pin' | 'verify' | 'done' | 'denied'

const QR_TTL = 300 // seconds, ThaiD QR sessions expire after 5 minutes
const N = 29

const Ic = ({ d, s = 18, w = 1.8 }: { d: string; s?: number; w?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
const ICON = {
  x: 'M6 6l12 12M18 6 6 18',
  qr: 'M4 4h6v6H4ZM14 4h6v6h-6ZM4 14h6v6H4ZM14 14h2v2h-2ZM18 18h2v2h-2ZM18 14h2M14 18v2',
  phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM11 18h2',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  check: 'M5 12l5 5 9-10',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6Z M9 12l2 2 4-4',
  lock: 'M6 11h12v10H6ZM8 11V8a4 4 0 0 1 8 0v3',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  back: 'M15 5l-7 7 7 7',
  del: 'M9 5h11v14H9l-6-7ZM12 9l5 6M17 9l-5 6',
}

/** QR-looking matrix (seeded) with the three finder patterns — not a decodable code, only a mock */
function useQr(seed: number) {
  return useMemo(() => {
    let s = seed
    const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
    const cells: [number, number][] = []
    const finder = (x: number, y: number) => x < 8 && y < 8 ? [x, y] : x >= N - 8 && y < 8 ? [x - (N - 7), y] : x < 8 && y >= N - 8 ? [x, y - (N - 7)] : null
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const f = finder(x, y)
      if (f) continue
      if (x > 10 && x < 18 && y > 10 && y < 18) continue // logo hole
      if ((x === 6 || y === 6) ? (x + y) % 2 === 0 : rnd() > 0.52) cells.push([x, y])
    }
    return cells
  }, [seed])
}

function Qr({ seed, dim }: { seed: number; dim: boolean }) {
  const cells = useQr(seed)
  const F = ({ x, y }: { x: number; y: number }) => <g><rect x={x} y={y} width="7" height="7" rx="1.6" fill="#0b1f45" /><rect x={x + 1} y={y + 1} width="5" height="5" rx="1.1" fill="#fff" /><rect x={x + 2} y={y + 2} width="3" height="3" rx=".8" fill="#0b1f45" /></g>
  return (
    <div className={`relative transition-[filter,opacity] duration-300 ${dim ? 'opacity-25 blur-[3px]' : ''}`}>
      <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} className="size-[208px]" role="img" aria-label="QR Code สำหรับสแกนด้วยแอป ThaiD">
        <rect x="-1" y="-1" width={N + 2} height={N + 2} fill="#fff" />
        {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x + 0.08} y={y + 0.08} width=".84" height=".84" rx=".22" fill="#0b1f45" />)}
        <F x={0} y={0} /><F x={N - 7} y={0} /><F x={0} y={N - 7} />
      </svg>
      <img src={thaidLogo} alt="" className="absolute top-1/2 left-1/2 size-[46px] -translate-1/2 rounded-[11px] shadow-[0_0_0_4px_#fff]" />
    </div>
  )
}

const mask = (pid: string) => `${pid[0]}-${pid.slice(1, 5)}-XXXXX-${pid.slice(10, 12)}-${pid[12]}`
const scopes = ['เลขประจำตัวประชาชน', 'ชื่อ-นามสกุล (ภาษาไทยและภาษาอังกฤษ)', 'วันเดือนปีเกิด']

export default function ThaiDConnect({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<Step>('connecting')
  const [left, setLeft] = useState(QR_TTL)
  const [seed, setSeed] = useState(() => Date.now() % 100000)
  const [pin, setPin] = useState('')
  const [pinErr, setPinErr] = useState('')
  const [checks, setChecks] = useState(0)
  const [progress, setProgress] = useState(0)
  const [mobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
  const [tab, setTab] = useState<'qr' | 'app'>(mobile ? 'app' : 'qr')
  const timers = useRef<number[]>([])
  const later = useCallback((ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }, [])
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const state = useMemo(() => Math.random().toString(36).slice(2, 10), [seed]) // eslint-disable-line react-hooks/exhaustive-deps

  // open → "redirect" to ThaiD
  useEffect(() => {
    if (!open) return
    clear()
    setStep('connecting'); setPin(''); setPinErr(''); setChecks(0); setProgress(0); setLeft(QR_TTL); setSeed(Date.now() % 100000)
    later(1100, () => setStep('qr'))
    return clear
  }, [open, later])

  // QR countdown
  useEffect(() => {
    if (!open || step !== 'qr') return
    const t = window.setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000)
    return () => clearInterval(t)
  }, [open, step])

  // verification chain → success → into the app
  useEffect(() => {
    if (step !== 'verify') return
    setChecks(0)
    later(700, () => setChecks(1)); later(1500, () => setChecks(2)); later(2300, () => setChecks(3))
    later(2900, () => setStep('done'))
  }, [step, later])
  useEffect(() => {
    if (step !== 'done') return
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => { const p = Math.min(1, (t - t0) / 1800); setProgress(p); if (p < 1) raf = requestAnimationFrame(tick); else onSuccess() }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step, onSuccess])

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'verify' && step !== 'done') onClose()
      if (step === 'pin' && /^\d$/.test(e.key)) press(e.key)
      if (step === 'pin' && e.key === 'Backspace') setPin((p) => p.slice(0, -1))
    }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  })

  const press = (d: string) => {
    setPinErr('')
    setPin((p) => {
      const n = (p + d).slice(0, 6)
      if (n.length === 6) later(350, () => {
        // demo rule: a PIN of one repeated digit (000000, 111111 …) is rejected, any other is accepted
        if (/^(\d)\1{5}$/.test(n)) { setPinErr('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่'); setPin('') }
        else setStep('verify')
      })
      return n
    })
  }
  const refresh = () => { setSeed(Date.now() % 100000); setLeft(QR_TTL) }
  const scan = () => { setStep('opening'); later(1300, () => setStep('consent')) }

  if (!open) return null
  const expired = step === 'qr' && left === 0
  const mm = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`
  const busy = step === 'verify' || step === 'done'

  /* --------------------------------------------------------- the phone (simulated ThaiD app) */
  const phone = (
    <div className="relative mx-auto h-[452px] w-[226px] shrink-0 rounded-[38px] bg-[#0d1424] p-[9px] shadow-[0_24px_50px_rgba(5,20,60,0.35),inset_0_0_0_2px_#2a3550]">
      <div className="absolute top-[16px] left-1/2 z-10 h-[18px] w-[70px] -translate-x-1/2 rounded-full bg-[#0d1424]" />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[30px] bg-[#f4f7fc]">
        <div className="flex items-center justify-between px-[18px] pt-[10px] font-urbanist text-[9px] font-semibold text-[#0d1424]"><span>9:41</span><span className="flex items-center gap-[3px]"><span className="h-[6px] w-[12px] rounded-[2px] border border-[#0d1424]" /></span></div>
        <div className="flex items-center gap-[8px] px-[14px] pt-[18px] pb-[10px]">
          <img src={thaidLogo} alt="" className="size-[24px] rounded-[6px]" />
          <span className="text-[12px] font-semibold text-[#0b1f45]">ThaiD</span>
          <span className="ml-auto flex items-center gap-[3px] rounded-full bg-[#e3f6ec] px-[7px] py-[2px] text-[8px] font-medium text-[#0f8a63]"><Ic d={ICON.lock} s={9} w={2.2} />ปลอดภัย</span>
        </div>

        {step === 'opening' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-[12px] px-[16px] text-center">
            <span className="size-[34px] animate-spin rounded-full border-[3px] border-[#d6e2f5] border-t-[#1650c8]" />
            <p className="text-[11px] font-medium text-[#0b1f45]">{tab === 'qr' ? 'สแกนสำเร็จ' : 'กำลังเปิดแอป ThaiD'}</p>
            <p className="text-[9.5px] font-light text-[#5d6b82]">กำลังโหลดคำขอยืนยันตัวตน</p>
          </div>
        )}

        {step === 'consent' && (
          <div className="flex flex-1 flex-col gap-[10px] px-[14px] pb-[14px]">
            <div className="flex flex-col items-center gap-[6px] rounded-[16px] bg-white p-[12px] text-center shadow-[0_2px_10px_rgba(10,30,80,0.06)]">
              <img src={codiLogo} alt="" className="size-[38px] object-contain" />
              <p className="text-[11px] leading-[1.35] font-semibold text-[#0b1f45]">CODI Portal</p>
              <p className="text-[8.5px] leading-[1.4] font-light text-[#5d6b82]">สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน) ขอยืนยันตัวตนและเข้าถึงข้อมูลของคุณ</p>
            </div>
            <div className="rounded-[14px] bg-white p-[10px] shadow-[0_2px_10px_rgba(10,30,80,0.06)]">
              <p className="mb-[6px] text-[9px] font-semibold text-[#0b1f45]">ข้อมูลที่จะแบ่งปัน</p>
              {scopes.map((s) => <p key={s} className="flex items-start gap-[6px] py-[3px] text-[8.5px] leading-[1.35] text-[#33405a]"><span className="mt-[1px] flex size-[11px] shrink-0 items-center justify-center rounded-full bg-[#1650c8] text-white"><Ic d={ICON.check} s={8} w={3} /></span>{s}</p>)}
            </div>
            <p className="px-[2px] text-[7.5px] leading-[1.45] font-light text-[#7a879c]">ข้อมูลจะถูกส่งให้ผู้ให้บริการเพื่อยืนยันตัวตนเท่านั้น ตามนโยบายคุ้มครองข้อมูลส่วนบุคคล</p>
            <div className="mt-auto flex flex-col gap-[6px]">
              <button type="button" onClick={() => setStep('pin')} className="h-[34px] rounded-full bg-[#1650c8] text-[11px] font-semibold text-white shadow-[0_6px_14px_rgba(22,80,200,0.35)] transition hover:brightness-110 active:scale-[0.98]">ยินยอม</button>
              <button type="button" onClick={() => setStep('denied')} className="h-[30px] rounded-full text-[10.5px] font-medium text-[#5d6b82] hover:bg-[#e8edf6]">ไม่ยินยอม</button>
            </div>
          </div>
        )}

        {step === 'pin' && (
          <div className="flex flex-1 flex-col items-center px-[14px] pb-[12px]">
            <span className="mt-[6px] flex size-[34px] items-center justify-center rounded-full bg-[#e6edfb] text-[#1650c8]"><Ic d={ICON.lock} s={17} /></span>
            <p className="mt-[8px] text-[11px] font-semibold text-[#0b1f45]">กรอกรหัส PIN</p>
            <p className="text-[8.5px] font-light text-[#5d6b82]">เพื่อยืนยันการให้ข้อมูลกับ CODI Portal</p>
            <div className={`mt-[12px] flex gap-[9px] ${pinErr ? 'animate-[shake_.35s]' : ''}`} aria-label={`กรอกแล้ว ${pin.length} จาก 6 หลัก`}>
              {Array.from({ length: 6 }, (_, i) => <span key={i} className={`size-[10px] rounded-full transition-colors ${i < pin.length ? 'bg-[#1650c8]' : 'border border-[#b8c4da] bg-white'}`} />)}
            </div>
            <p role="alert" className="mt-[6px] h-[12px] text-[8px] text-[#d63b3b]">{pinErr}</p>
            <div className="mt-auto grid w-full grid-cols-3 gap-[6px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) => k === '' ? <span key="sp" /> : (
                <button key={k} type="button" aria-label={k === 'del' ? 'ลบ' : k} onClick={() => (k === 'del' ? setPin((p) => p.slice(0, -1)) : press(k))} disabled={pin.length >= 6 && k !== 'del'} className="flex h-[34px] items-center justify-center rounded-[12px] font-urbanist text-[15px] font-semibold text-[#0b1f45] transition hover:bg-[#e3e9f4] active:scale-95">{k === 'del' ? <Ic d={ICON.del} s={15} /> : k}</button>
              ))}
            </div>
          </div>
        )}

        {(step === 'verify' || step === 'done') && (
          <div className="flex flex-1 flex-col items-center justify-center gap-[10px] px-[16px] text-center">
            <span className="flex size-[46px] items-center justify-center rounded-full bg-[#17a673] text-white shadow-[0_0_0_8px_#dff5e8]"><Ic d={ICON.check} s={24} w={2.6} /></span>
            <p className="text-[11px] font-semibold text-[#0b1f45]">ยืนยันตัวตนสำเร็จ</p>
            <p className="text-[8.5px] font-light text-[#5d6b82]">กลับไปที่หน้าจอคอมพิวเตอร์เพื่อใช้งานต่อ</p>
          </div>
        )}

        {step === 'denied' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-[10px] px-[16px] text-center">
            <span className="flex size-[46px] items-center justify-center rounded-full bg-[#fde3e3] text-[#d63b3b]"><Ic d={ICON.x} s={22} w={2.4} /></span>
            <p className="text-[11px] font-semibold text-[#0b1f45]">ยกเลิกการให้ข้อมูลแล้ว</p>
          </div>
        )}
        <div className="mx-auto mb-[6px] h-[4px] w-[80px] rounded-full bg-[#0d1424]/80" />
      </div>
    </div>
  )

  /* --------------------------------------------------------- left side (the browser) */
  const verifyRows = ['รับรหัสยืนยันจาก ThaiD', 'ตรวจสอบตัวตนกับกรมการปกครอง', `จับคู่บัญชีเจ้าหน้าที่ พอช. (${THAID_DEMO.staffCode})`]
  const side = (() => {
    if (step === 'connecting') return (
      <div className="flex flex-1 flex-col items-center justify-center gap-[16px] py-[40px] text-center">
        <div className="flex items-center gap-[14px]">
          <img src={codiLogo} alt="" className="size-[48px] object-contain" />
          <span className="flex gap-[5px]">{[0, 1, 2].map((i) => <span key={i} style={{ animationDelay: `${i * 0.15}s` }} className="size-[7px] animate-[pulse-dot_0.9s_ease-in-out_infinite] rounded-full bg-[#1650c8]" />)}</span>
          <img src={thaidLogo} alt="" className="size-[48px] rounded-[12px]" />
        </div>
        <p className="text-[15px] font-semibold text-[#0b1f45]">กำลังเชื่อมต่อกับ ThaiD</p>
        <p className="text-[12px] font-light text-[#5d6b82]">กรุณารอสักครู่ ระบบกำลังสร้างคำขอยืนยันตัวตนแบบปลอดภัย</p>
      </div>
    )
    if (step === 'verify' || step === 'done') return (
      <div className="flex flex-1 flex-col justify-center gap-[18px] py-[24px]">
        {step === 'verify' ? (
          <>
            <div><p className="text-[18px] font-semibold text-[#0b1f45]">กำลังตรวจสอบข้อมูล</p><p className="mt-[2px] text-[12px] font-light text-[#5d6b82]">อย่าปิดหน้าต่างนี้</p></div>
            <ol className="flex flex-col gap-[12px]" aria-live="polite">
              {verifyRows.map((r, i) => (
                <li key={r} className="flex items-center gap-[12px]">
                  {checks > i ? <span className="flex size-[26px] items-center justify-center rounded-full bg-[#17a673] text-white"><Ic d={ICON.check} s={14} w={2.6} /></span> : checks === i ? <span className="size-[26px] animate-spin rounded-full border-[3px] border-[#d6e2f5] border-t-[#1650c8]" /> : <span className="size-[26px] rounded-full border-2 border-[#d6e2f5]" />}
                  <span className={`text-[13px] ${checks > i ? 'text-[#0b1f45]' : checks === i ? 'font-medium text-[#1650c8]' : 'font-light text-[#9aa5b8]'}`}>{r}</span>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <div className="flex flex-col items-center gap-[12px] text-center" aria-live="polite">
            <span className="relative flex size-[76px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#1650c8,#3dc2fb)] text-[24px] font-semibold text-white shadow-[0_10px_30px_rgba(22,80,200,0.35)]">PJ<span className="absolute -right-[2px] -bottom-[2px] flex size-[26px] items-center justify-center rounded-full bg-[#17a673] text-white ring-[3px] ring-white"><Ic d={ICON.check} s={14} w={2.8} /></span></span>
            <div><p className="text-[12px] font-light text-[#5d6b82]">ยินดีต้อนรับ</p><p className="text-[19px] font-semibold text-[#0b1f45]">{THAID_DEMO.name}</p></div>
            <div className="grid w-full max-w-[300px] grid-cols-[auto_1fr] gap-x-[14px] gap-y-[4px] rounded-[12px] bg-[#f4f7fc] px-[14px] py-[10px] text-left text-[11.5px]">
              <span className="font-light text-[#5d6b82]">เลขประจำตัวประชาชน</span><span className="text-right font-urbanist font-medium text-[#0b1f45]">{mask(THAID_DEMO.pid)}</span>
              <span className="font-light text-[#5d6b82]">รหัสพนักงาน</span><span className="text-right font-urbanist font-medium text-[#0b1f45]">{THAID_DEMO.staffCode}</span>
              <span className="font-light text-[#5d6b82]">ยืนยันตัวตนระดับ</span><span className="text-right font-medium text-[#0b1f45]">IAL 2.3</span>
            </div>
            <div className="w-full max-w-[300px]">
              <div className="h-[6px] overflow-hidden rounded-full bg-[#e3e9f4]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#1650c8,#3dc2fb)]" style={{ width: `${progress * 100}%` }} /></div>
              <p className="mt-[6px] text-[11px] font-light text-[#5d6b82]">กำลังเข้าสู่ CODI APP…</p>
            </div>
          </div>
        )}
      </div>
    )
    if (step === 'denied') return (
      <div className="flex flex-1 flex-col items-center justify-center gap-[12px] py-[30px] text-center">
        <span className="flex size-[56px] items-center justify-center rounded-full bg-[#fde3e3] text-[#d63b3b]"><Ic d={ICON.alert} s={26} /></span>
        <p className="text-[16px] font-semibold text-[#0b1f45]">ไม่ได้รับความยินยอมจากผู้ใช้</p>
        <p className="max-w-[300px] text-[12px] font-light text-[#5d6b82]">คุณเลือก “ไม่ยินยอม” ในแอป ThaiD ระบบจึงไม่สามารถยืนยันตัวตนได้</p>
        <div className="flex gap-[8px]">
          <button type="button" onClick={() => { refresh(); setStep('qr') }} className="h-[40px] rounded-[10px] bg-[#1650c8] px-[18px] text-[13px] font-medium text-white hover:brightness-110">ลองอีกครั้ง</button>
          <button type="button" onClick={onClose} className="h-[40px] rounded-[10px] border border-[#d6e2f5] px-[18px] text-[13px] text-[#33405a] hover:bg-[#f4f7fc]">กลับไปหน้าเข้าสู่ระบบ</button>
        </div>
      </div>
    )
    // qr / opening / consent / pin
    const waiting = step !== 'qr'
    return (
      <div className="flex flex-1 flex-col gap-[16px]">
        <div role="tablist" aria-label="วิธียืนยันตัวตน" className="grid grid-cols-2 gap-[4px] rounded-[12px] bg-[#eef2f9] p-[4px]">
          {([['qr', 'สแกน QR Code', ICON.qr], ['app', 'แอปบนมือถือนี้', ICON.phone]] as const).map(([k, l, ic]) => (
            <button key={k} role="tab" type="button" aria-selected={tab === k} disabled={waiting} onClick={() => setTab(k)} className={`flex h-[36px] items-center justify-center gap-[6px] rounded-[9px] text-[12.5px] transition ${tab === k ? 'bg-white font-semibold text-[#1650c8] shadow-[0_1px_4px_rgba(10,30,80,0.12)]' : 'text-[#5d6b82] hover:text-[#1650c8]'} disabled:cursor-default`}><Ic d={ic} s={15} />{l}</button>
          ))}
        </div>

        {tab === 'qr' ? (
          <div className="flex flex-col items-center gap-[12px]">
            <div className="relative rounded-[20px] border border-[#e3e9f4] bg-white p-[14px] shadow-[0_8px_24px_rgba(10,30,80,0.08)]">
              <Qr seed={seed} dim={waiting || expired} />
              {expired && <button type="button" onClick={refresh} className="absolute inset-0 m-auto flex h-[44px] w-[150px] items-center justify-center gap-[6px] rounded-full bg-[#1650c8] text-[12.5px] font-medium text-white shadow-[0_6px_16px_rgba(22,80,200,0.35)] hover:brightness-110"><Ic d={ICON.refresh} s={15} />สร้าง QR ใหม่</button>}
              {waiting && <span className="absolute inset-0 m-auto flex h-[34px] w-[176px] items-center justify-center gap-[6px] rounded-full bg-white/95 text-[11.5px] font-medium text-[#1650c8] shadow-[0_4px_14px_rgba(10,30,80,0.15)]"><span className="size-[12px] animate-spin rounded-full border-2 border-[#d6e2f5] border-t-[#1650c8]" />รอการยืนยันบนมือถือ</span>}
            </div>
            {!waiting && (
              <p className={`flex items-center gap-[6px] text-[12px] ${expired ? 'text-[#d63b3b]' : 'text-[#5d6b82]'}`} aria-live="polite">
                {expired ? 'QR Code หมดอายุแล้ว' : <>QR Code จะหมดอายุใน <b className={`font-urbanist font-semibold ${left < 60 ? 'text-[#d63b3b]' : 'text-[#0b1f45]'}`}>{mm}</b> นาที</>}
              </p>
            )}
            <ol className="w-full space-y-[8px] rounded-[14px] bg-[#f4f7fc] p-[14px] text-[12px] text-[#33405a]">
              {['เปิดแอป ThaiD บนโทรศัพท์มือถือ', 'แตะ “สแกน QR Code” แล้วส่องกล้องที่รหัสด้านบน', 'ตรวจสอบข้อมูล กด “ยินยอม” และกรอกรหัส PIN'].map((t, i) => <li key={t} className="flex gap-[10px]"><span className="flex size-[20px] shrink-0 items-center justify-center rounded-full bg-[#1650c8] font-urbanist text-[11px] font-semibold text-white">{i + 1}</span>{t}</li>)}
            </ol>
            {!waiting && !expired && <button type="button" onClick={scan} className="flex h-[40px] w-full items-center justify-center gap-[8px] rounded-[10px] border border-dashed border-[#9db6e6] text-[12.5px] font-medium text-[#1650c8] hover:bg-[#f0f5ff]"><Ic d={ICON.phone} s={16} />จำลองการสแกนด้วยมือถือ</button>}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-[14px] py-[10px] text-center">
            <img src={thaidLogo} alt="" className="size-[72px] rounded-[18px] shadow-[0_10px_24px_rgba(10,30,80,0.18)]" />
            <p className="text-[15px] font-semibold text-[#0b1f45]">ยืนยันตัวตนผ่านแอป ThaiD</p>
            <p className="max-w-[300px] text-[12px] font-light text-[#5d6b82]">ระบบจะเปิดแอป ThaiD บนเครื่องนี้ เมื่อยืนยันแล้วจะกลับมาที่ CODI Portal อัตโนมัติ</p>
            <button type="button" disabled={waiting} onClick={scan} className="flex h-[48px] w-full max-w-[300px] items-center justify-center gap-[10px] rounded-[12px] bg-[#1650c8] text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(22,80,200,0.35)] transition hover:brightness-110 disabled:opacity-60">{waiting ? <><span className="size-[16px] animate-spin rounded-full border-2 border-white/40 border-t-white" />รอการยืนยันในแอป</> : 'เปิดแอป ThaiD'}</button>
            <p className="text-[11px] font-light text-[#7a879c]">ยังไม่มีแอป? ดาวน์โหลด ThaiD ได้จาก App Store และ Google Play</p>
          </div>
        )}
      </div>
    )
  })()

  const showPhone = ['opening', 'consent', 'pin', 'verify', 'done', 'denied'].includes(step)
  const inApp = ['opening', 'consent', 'pin'].includes(step) // phones: the app takes over the screen, like a real app switch
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[#061633]/60 p-[12px] backdrop-blur-[3px] max-sm:items-start" onClick={() => !busy && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="เข้าสู่ระบบด้วย ThaiD" onClick={(e) => e.stopPropagation()} className="my-auto w-full max-w-[880px] animate-[menu-in_160ms_ease-out] overflow-hidden rounded-[24px] bg-white shadow-[0_30px_80px_rgba(0,20,70,0.4)]">
        {/* address bar: makes the hand-off to the identity provider visible */}
        <div className="flex items-center gap-[10px] border-b border-[#e3e9f4] bg-[#f6f8fc] px-[16px] py-[10px]">
          <span className="flex gap-[6px]" aria-hidden="true"><span className="size-[10px] rounded-full bg-[#ff5f57]" /><span className="size-[10px] rounded-full bg-[#febc2e]" /><span className="size-[10px] rounded-full bg-[#28c840]" /></span>
          <span className="flex min-w-0 flex-1 items-center gap-[6px] truncate rounded-full bg-white px-[12px] py-[5px] font-urbanist text-[11px] text-[#5d6b82] ring-1 ring-[#e3e9f4]"><span className="text-[#17a673]"><Ic d={ICON.lock} s={11} w={2.2} /></span><span className="truncate">{`thaid-auth.demo/authorize?client_id=codi-portal&scope=openid+pid+name+birthdate&state=${state}`}</span></span>
          <button type="button" aria-label="ปิด" disabled={busy} onClick={onClose} className="flex size-[30px] shrink-0 items-center justify-center rounded-full text-[#5d6b82] hover:bg-[#e8edf6] disabled:opacity-30"><Ic d={ICON.x} s={16} /></button>
        </div>

        <div className="flex items-center gap-[12px] px-[24px] pt-[20px] max-sm:px-[16px]">
          <img src={thaidLogo} alt="ThaiD" className="size-[40px] rounded-[10px]" />
          <div className="min-w-0 flex-1"><h2 className="text-[18px] leading-[1.3] font-semibold text-[#0b1f45]">ยืนยันตัวตนด้วย ThaiD</h2><p className="text-[12px] font-light text-[#5d6b82]">เข้าสู่ระบบ CODI Portal โดยไม่ต้องใช้รหัสผ่าน</p></div>
          <span className="flex items-center gap-[5px] rounded-full bg-[#e3f6ec] px-[10px] py-[4px] text-[11px] font-medium text-[#0f8a63] max-sm:hidden"><Ic d={ICON.shield} s={13} />เชื่อมต่อแบบเข้ารหัส</span>
        </div>

        <div className={`grid gap-[28px] px-[24px] pt-[18px] pb-[20px] max-sm:px-[16px] ${showPhone ? 'md:grid-cols-[1fr_auto]' : ''}`}>
          <div className={`min-h-[420px] flex-col ${inApp ? 'hidden md:flex' : 'flex'}`}>{side}</div>
          {showPhone && <div className="flex flex-col items-center gap-[8px] md:border-l md:border-[#eef2f9] md:pl-[28px]"><span className="text-[11px] font-light text-[#7a879c]">{inApp ? <><span className="md:hidden">กำลังใช้งานแอป ThaiD</span><span className="max-md:hidden">หน้าจอบนมือถือของคุณ</span></> : 'หน้าจอบนมือถือของคุณ'}</span>{phone}</div>}
        </div>

        <div className="flex flex-wrap items-center gap-x-[14px] gap-y-[4px] border-t border-[#eef2f9] bg-[#fafbfd] px-[24px] py-[10px] text-[10.5px] font-light text-[#7a879c] max-sm:px-[16px]">
          <span className="rounded-[4px] bg-[#fff4d6] px-[6px] py-[1px] font-medium text-[#8a6100]">โหมดสาธิต</span>
          <span className="min-w-0 flex-1">จำลองขั้นตอน ThaiD (OpenID Connect) — ระบบจริงเชื่อมต่อบริการยืนยันตัวตนของกรมการปกครอง ไม่มีการส่งข้อมูลออกจากเครื่อง</span>
        </div>
      </div>
    </div>
  ,
    document.body,
  )
}
