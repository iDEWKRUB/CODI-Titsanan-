import { useState } from 'react'
import iconSort from '../../assets/dashboard/icon-sort.svg'
import { alerts } from '../../data/dashboard'
import Checkbox from '../ui/Checkbox'

const columns = ['ส่วนงาน', 'เรื่อง', 'Title', 'Title']
const grid = 'grid grid-cols-[12px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_233px] items-center gap-x-[20px] px-[10px]'

export default function LatestAlerts() {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const allChecked = selected.size === alerts.length
  const toggle = (id: number, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <section className="flex flex-col gap-[12px] rounded-[12px] bg-blue-gray p-[12px]">
      <h2 className="text-[16px] leading-[normal] font-medium text-[#000]">แจ้งเตือนล่าสุด</h2>
      <div className="overflow-x-auto rounded-[12px] border border-gray-line-2 bg-white p-[12px]">
        <div role="table" aria-label="แจ้งเตือนล่าสุด" className="flex min-w-[720px] flex-col gap-[10px]">
          <div role="row" className={`${grid} py-[12px]`}>
            <Checkbox
              label="เลือกทั้งหมด"
              checked={allChecked}
              indeterminate={selected.size > 0 && !allChecked}
              onChange={(on) => setSelected(on ? new Set(alerts.map((a) => a.id)) : new Set())}
            />
            {columns.map((c, i) => (
              <button
                key={i}
                type="button"
                role="columnheader"
                className="flex w-fit items-end text-[10px] leading-[normal] font-light text-gray-20 hover:text-gray-30"
              >
                {c}
                <img src={iconSort} alt="" width={12} height={12} />
              </button>
            ))}
          </div>
          {alerts.map((a) => (
            <div key={a.id} role="row" className={`${grid} border-t border-gray-line py-[16px] text-[12px] leading-[normal] font-light text-black`}>
              <Checkbox label={`เลือก ${a.subject}`} checked={selected.has(a.id)} onChange={(on) => toggle(a.id, on)} />
              <span role="cell" className="truncate">{a.unit}</span>
              <span role="cell" className="truncate">{a.subject}</span>
              <span role="cell">{a.date}</span>
              <span role="cell">
                <span className="inline-flex w-[81px] justify-center rounded-[6px] bg-yellow px-[8px] py-[4px] text-[12px] text-[#f2f3f4]">
                  {a.status}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
