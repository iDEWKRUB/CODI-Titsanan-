import { useEffect, useRef, useState, type PointerEvent } from 'react'
import iconPen from '../../assets/meeting/d-note-pencil.svg'
import Modal from '../ui/Modal'

/** "ลงชื่อเข้าประชุม": draw an e-signature (TOR 4.7-2 draw signature) */
export default function SignatureModal({ open, name, onClose, onSign }: { open: boolean; name: string; onClose: () => void; onSign: (png: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [empty, setEmpty] = useState(true)

  useEffect(() => {
    if (!open) return
    setEmpty(true)
    // size the bitmap to the element so strokes stay sharp
    requestAnimationFrame(() => {
      const c = canvas.current
      if (!c) return
      const r = c.getBoundingClientRect()
      c.width = r.width * devicePixelRatio
      c.height = r.height * devicePixelRatio
      const ctx = c.getContext('2d')!
      ctx.scale(devicePixelRatio, devicePixelRatio)
      ctx.lineWidth = 2.2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#00357d'
    })
  }, [open])

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top] as const
  }
  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    const ctx = e.currentTarget.getContext('2d')!
    const [x, y] = point(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 0.1, y + 0.1)
    ctx.stroke()
    setEmpty(false)
  }
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = e.currentTarget.getContext('2d')!
    const [x, y] = point(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }
  const clear = () => {
    const c = canvas.current
    if (!c) return
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    setEmpty(true)
  }

  return (
    <Modal open={open} title="ลงชื่อเข้าประชุม" onClose={onClose} icon={iconPen} width="max-w-[520px]">
      <div className="flex flex-col gap-[8px]">
        <p className="text-[14px] font-light text-gray-30">
          ลงลายมือชื่อในกรอบด้านล่างเพื่อยืนยันการเข้าร่วมประชุมในนาม <b className="font-medium">{name}</b>
        </p>
        <div className="relative">
          <canvas
            ref={canvas}
            aria-label="ช่องลงลายมือชื่อ"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={() => (drawing.current = false)}
            onPointerCancel={() => (drawing.current = false)}
            className="h-[180px] w-full cursor-crosshair touch-none rounded-[12px] border border-dashed border-gray-10 bg-gray-subtle"
          />
          {empty && <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[14px] font-light text-gray-10">เซ็นชื่อที่นี่</span>}
          <span aria-hidden="true" className="pointer-events-none absolute right-[24px] bottom-[36px] left-[24px] border-b border-gray-10" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-light text-gray-20">ลงชื่อเมื่อ {new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          <button type="button" onClick={clear} disabled={empty} className="text-[12px] font-medium text-blue-00 hover:underline disabled:text-gray-10 disabled:no-underline">
            ล้างลายเซ็น
          </button>
        </div>
      </div>
      <div className="flex justify-end gap-[12px]">
        <button type="button" onClick={onClose} className="h-[45px] w-[128px] rounded-[8px] border border-gray-line text-[14px] font-medium text-gray-30 outline-none hover:bg-gray-subtle focus-visible:ring-2 focus-visible:ring-blue-20">
          ยกเลิก
        </button>
        <button
          type="button"
          disabled={empty}
          onClick={() => canvas.current && onSign(canvas.current.toDataURL('image/png'))}
          className="h-[45px] w-[128px] rounded-[8px] bg-blue-00 text-[14px] font-medium text-white-soft hover:brightness-110 disabled:cursor-not-allowed disabled:bg-gray-10"
        >
          ยืนยันลงชื่อ
        </button>
      </div>
    </Modal>
  )
}
