import Modal from '../ui/Modal'
import { thDate } from '../../data/erpProject'
import type { News } from '../../data/codiApp'
import { Md } from './md'

/** full text of a news item ("อ่านต่อ") */
export default function NewsReader({ item, onClose }: { item?: News; onClose: () => void }) {
  return (
    <Modal open={!!item} onClose={onClose} title={item?.title ?? ''} width="max-w-[620px]">
      {item && (
        <article className="flex flex-col gap-[12px]">
          {item.cover && <img src={item.cover} alt="" className="max-h-[280px] w-full rounded-[10px] object-cover" />}
          <p className="flex flex-wrap items-center gap-[8px] text-[11px] text-gray-20"><b className="rounded-full bg-blue-bg px-[10px] py-[2px] font-medium text-blue-00">{item.cat}</b><span>{`เผยแพร่ ${thDate(item.date)} · โดย ${item.creator} · อ่านแล้ว ${item.views} ครั้ง`}</span></p>
          <div className="flex flex-col gap-[8px] text-[13px] leading-[1.8] font-light text-gray-30"><Md text={item.body} /></div>
        </article>
      )}
    </Modal>
  )
}
