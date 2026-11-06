import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addDays, nPersonas, stamp, type Notice } from '../../data/erpNotify'
import { markRead, notices, nWho, useNPersona, useNotices } from '../../lib/notifyStore'
import { useToast } from '../leader/Parts'
import Modal from '../ui/Modal'
import { Ic, NI, SevPill, StPill } from './Parts'

/** view / edit / copy / delete shared by "รายการทั้งหมด" and "ของฉัน" */
export function useNoticeActions() {
  const all = useNotices()
  const me = useNPersona()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [open, setOpen] = useState<Notice>()
  const [del, setDel] = useState<Notice>()
  const mine = (n: Notice) => n.by === nPersonas[me].name
  const can = (n: Notice) => ({ edit: me === 'admin' || mine(n), del: me === 'admin' || mine(n) })
  const onView = (n: Notice) => { markRead(n.id); setOpen(n) }
  const onEdit = (n: Notice) => navigate(`/notify/settings?id=${n.id}`)
  const onCopy = (n: Notice) => {
    const at = stamp()
    notices.save({ ...n, id: notices.next(), title: `${n.title} (สำเนา)`, date: addDays(1), status: 'ตั้งเวลา', by: nWho(), createdAt: at, handledAt: undefined })
    show('คัดลอกการแจ้งเตือนแล้ว (ตั้งส่งพรุ่งนี้)')
  }
  const cur = open ? all.find((x) => x.id === open.id) ?? open : undefined
  const modals = (
    <>
      <Modal open={!!cur} onClose={() => setOpen(undefined)} title="รายละเอียดการแจ้งเตือน" width="max-w-[560px]">
        {cur && (
          <div className="flex max-h-[68vh] flex-col gap-[14px] overflow-y-auto pr-[4px]">
            <div><p className="text-[15px] leading-[1.4] font-semibold">{cur.title}</p><div className="mt-[6px] flex flex-wrap gap-[8px]"><SevPill s={cur.severity} /><StPill s={cur.status} /></div></div>
            <p className="text-[13px] leading-[1.7] font-light text-gray-30">{cur.detail}</p>
            <dl className="grid grid-cols-2 gap-x-[16px] gap-y-[8px] rounded-[12px] bg-gray-subtle p-[14px] text-[12px] max-sm:grid-cols-1">
              {[['แหล่งที่มา', cur.source], ['กำหนดแจ้งเตือน', `${cur.date.split('-').reverse().join('/').replace(/\/(\d{4})$/, (_, y) => `/${Number(y) + 543}`)} ${cur.time} น.`], ['รอบการแจ้ง', cur.repeat], ['ช่องทาง', cur.channels.join(', ')], ['ผู้รับ', cur.recipients.join(', ')], ['สร้างโดย', cur.by], ...(cur.handledAt ? [['ตอบสนองเมื่อ', cur.handledAt]] : [])].map(([k, v]) => <div key={k} className="flex flex-col"><dt className="text-[11px] font-light text-gray-20">{k}</dt><dd className="font-medium break-words">{v}</dd></div>)}
            </dl>
            <Link to={cur.to} className="flex h-[38px] w-fit items-center gap-[6px] rounded-[8px] border border-blue-00 px-[14px] text-[13px] font-medium text-blue-00 hover:bg-blue-bg"><Ic d={NI.eye} s={15} />ไปที่หน้าที่เกี่ยวข้อง ({cur.source})</Link>
          </div>
        )}
      </Modal>
      <Modal open={!!del} onClose={() => setDel(undefined)} title="ลบรายการแจ้งเตือน" width="max-w-[420px]">
        {del && (
          <div className="flex flex-col gap-[16px]">
            <p className="text-[13px] leading-[1.6] font-light text-gray-30">ต้องการลบ “{del.title}” ใช่หรือไม่ การลบไม่สามารถกู้คืนได้</p>
            <div className="flex justify-end gap-[8px]">
              <button type="button" onClick={() => setDel(undefined)} className="h-[38px] rounded-[8px] border border-gray-line px-[16px] text-[13px] hover:border-gray-10">ยกเลิก</button>
              <button type="button" onClick={() => { notices.remove(del.id); setDel(undefined); show('ลบรายการแจ้งเตือนแล้ว') }} className="h-[38px] rounded-[8px] bg-[#e5484d] px-[16px] text-[13px] font-medium text-white hover:brightness-110">ลบรายการ</button>
            </div>
          </div>
        )}
      </Modal>
      {toast}
    </>
  )
  return { all, me, can, onView, onEdit, onCopy, onDelete: setDel, modals, show, navigate }
}
