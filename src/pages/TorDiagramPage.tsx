import { useRef, useState } from 'react'
import iconTor from '../assets/tor/icon-clipboard-check.svg'
import highLevel from '../assets/tor/high-level.png'
import sitemap from '../assets/tor/sitemap.png'
import systemMap from '../assets/tor/system-map.png'
import TorTabs from '../components/tor/TorTabs'
import PageTitle from '../components/ui/PageTitle'

export type DiagramKind = 'high-level' | 'sitemap' | 'system-map'

const figma = 'https://www.figma.com/design/4guSo5NtZrEx3QuqYMlqku'

const diagrams: Record<DiagramKind, { title: string; image: string; size: [number, number]; lead: string; notes: string[] }> = {
  'high-level': {
    title: 'High Level',
    image: highLevel,
    size: [2000, 1260],
    lead: 'ภาพรวมระดับ PM ของ ERP พอช. ระยะที่ 1 แบ่งเป็นผู้ใช้งาน ระบบ ฐานข้อมูล และระบบภายนอก พร้อมสิ่งที่ผู้รับจ้างต้องส่งมอบตาม TOR',
    notes: [
      'เส้นทึบ = ระบุชัดใน TOR (SSO, ThaiD, e-MENSCR, ธนาคาร) · เส้นประ = ให้สำรวจตามข้อ 4.3(7) ยังไม่ยืนยัน',
      'Central Portal + SSO พัฒนาโดยอีกโครงการหนึ่ง ERP ต้องไม่ทำหน้า login รวมศูนย์ใหม่ (ข้อ 4.13)',
      'ระบบงานสนับสนุนอื่นอยู่ใน Phase 2 โดยใช้มาตรฐานกลางที่ส่งมอบใน Phase 1 (ข้อ 5.15)',
    ],
  },
  sitemap: {
    title: 'Sitemap',
    image: sitemap,
    size: [2600, 1588],
    lead: 'เมนูและหน้าย่อยของระบบ A–F ตามข้อ 4.7 ชิปตัวอักษรคือการเรียกใช้ระบบภายใน ชิปตัวเลขคือระบบภายนอก',
    notes: [
      'ชื่อเมนูและหน้าย่อยเป็นข้อเสนอที่แตกจากฟังก์ชันใน TOR ไม่ใช่ชื่อที่ TOR กำหนด ควรให้สำรวจกับสำนักเจ้าของกระบวนงานก่อนทำ Interactive UI (ข้อ 4.6)',
      'ทุกหน้าอนุมัติเรียกใช้ e-Signature (B) และทุกระบบมีแจ้งเตือน ส่งออกรายงาน และ Audit Log ร่วมกัน',
    ],
  },
  'system-map': {
    title: 'แผนผังระบบจาก TOR',
    image: systemMap,
    size: [2200, 1470],
    lead: 'แผนผังระบบและการเชื่อมโยง: Authentication, ระบบ A–F + บริการกลาง G–J, ฐานข้อมูล และระบบภายนอกหมายเลข 1–14',
    notes: [
      'การจับคู่ว่าระบบใดเชื่อมระบบภายนอกตัวใดเป็นการตีความ ไม่ได้เขียนตรง ๆ ใน TOR ยกเว้น SSO, ThaiD, e-MENSCR และไฟล์ตั้งจ่ายธนาคาร',
      'กลุ่มผู้ใช้งาน 4 กลุ่มสรุปจากเนื้อหา TOR ต้องยืนยัน Role จริงตอนเก็บ Requirement',
    ],
  },
}

const STEPS = [1, 1.5, 2, 3]

export default function TorDiagramPage({ kind }: { kind: DiagramKind }) {
  const d = diagrams[kind]
  const [zoom, setZoom] = useState(1)
  const box = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; l: number; t: number } | null>(null)

  const step = (dir: 1 | -1) => {
    const i = STEPS.indexOf(zoom)
    setZoom(STEPS[Math.min(STEPS.length - 1, Math.max(0, i + dir))])
  }
  const btn =
    'flex size-[32px] items-center justify-center rounded-[8px] border border-gray-line bg-white text-[16px] font-medium text-blue-00 transition-colors hover:bg-blue-bg disabled:opacity-40 disabled:hover:bg-white focus-visible:outline-2 focus-visible:outline-blue-10'
  const link =
    'flex h-[32px] items-center rounded-[8px] border border-gray-line bg-white px-[12px] text-[12px] font-medium whitespace-nowrap text-blue-00 hover:bg-blue-bg'

  return (
    <div className="flex flex-col gap-[16px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]">
      <TorTabs />
      <div className="flex flex-wrap items-center gap-[12px]">
        <div className="min-w-0 flex-1 max-sm:basis-full">
          <PageTitle icon={iconTor}>{d.title}</PageTitle>
          <p className="mt-[8px] text-[12px] leading-[1.6] font-light text-gray-20">{d.lead}</p>
        </div>
        <div className="flex items-center gap-[8px]">
          <button type="button" className={btn} onClick={() => step(-1)} disabled={zoom === STEPS[0]} aria-label="ย่อ">
            −
          </button>
          <span className="w-[44px] text-center font-urbanist text-[13px] font-medium text-gray-30">{Math.round(zoom * 100)}%</span>
          <button type="button" className={btn} onClick={() => step(1)} disabled={zoom === STEPS[STEPS.length - 1]} aria-label="ขยาย">
            +
          </button>
          <a href={d.image} target="_blank" rel="noreferrer" className={link}>
            เปิดภาพเต็ม
          </a>
          <a href={d.image} download={'CODI-ERP-' + kind + '.png'} className={link + ' max-sm:hidden'}>
            ดาวน์โหลด PNG
          </a>
          <a href={figma} target="_blank" rel="noreferrer" className="flex h-[32px] items-center rounded-[8px] bg-blue-00 px-[12px] text-[12px] font-medium whitespace-nowrap text-white hover:opacity-90 max-sm:hidden">
            เปิดใน Figma
          </a>
        </div>
      </div>

      <div
        ref={box}
        className={'max-h-[calc(100vh-260px)] min-h-[320px] overflow-auto rounded-[12px] border border-gray-line bg-white ' + (zoom > 1 ? 'cursor-grab active:cursor-grabbing' : '')}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse' || zoom === 1 || !box.current) return
          drag.current = { x: e.clientX, y: e.clientY, l: box.current.scrollLeft, t: box.current.scrollTop }
          box.current.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!drag.current || !box.current) return
          box.current.scrollLeft = drag.current.l - (e.clientX - drag.current.x)
          box.current.scrollTop = drag.current.t - (e.clientY - drag.current.y)
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <img
          src={d.image}
          alt={d.title}
          width={d.size[0]}
          height={d.size[1]}
          draggable={false}
          className="block h-auto max-w-none select-none"
          style={{ width: zoom * 100 + '%' }}
        />
      </div>
      <p className="text-[12px] font-light text-gray-20 sm:hidden">กดปุ่ม + เพื่อขยาย แล้วเลื่อนดูด้วยนิ้ว</p>

      <section className="rounded-[12px] bg-blue-bg p-[16px]">
        <h2 className="mb-[8px] text-[13px] font-medium text-blue-dark">หมายเหตุ</h2>
        <ul className="flex list-disc flex-col gap-[4px] pl-[18px] text-[13px] leading-[1.7] font-light text-gray-30">
          {d.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
