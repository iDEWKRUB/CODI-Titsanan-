import { Link } from 'react-router-dom'
import iconSort from '../assets/dashboard/icon-sort.svg'
import divider from '../assets/profile/divider.svg'
import iconCaretDown from '../assets/profile/icon-caret-down.svg'
import iconGearBlue from '../assets/profile/icon-gear-blue.svg'
import iconGear from '../assets/profile/icon-gear.svg'
import iconMapPin from '../assets/profile/icon-map-pin.svg'
import iconNotePencil from '../assets/profile/icon-note-pencil.svg'
import iconPin from '../assets/profile/icon-push-pin.svg'
import iconPlus from '../assets/profile/icon-plus.svg'
import { loginHistory, profile } from '../data/profile'

const panel = 'flex min-w-0 flex-col gap-[12px] rounded-[12px] bg-blue-gray p-[12px]'
const panelTitle = 'text-[16px] leading-[normal] font-medium text-[#000]'
const card = 'rounded-[12px] border border-gray-line-2 bg-white'

function Field({ label, value }: { label: string; value: string }) {
  const id = `field-${label}`
  return (
    <div className="flex min-w-0 flex-col">
      <label htmlFor={id} className="pb-[12px] text-[14px] leading-[normal] font-medium text-black">
        {label}
      </label>
      <input
        id={id}
        readOnly
        value={value}
        className="h-[46px] w-full rounded-[8px] border border-gray-line bg-[#fbfbfc] px-[16px] text-[14px] leading-[normal] font-light text-black outline-none focus-visible:border-blue-00"
      />
    </div>
  )
}

const pinned = [
  { label: 'ยื่นคำขอจดทะเบียนสภาองค์กร', icon: iconNotePencil },
  { label: 'จัดการสถานการณ์โครงการ', icon: iconGear },
  { label: 'จัดการพื้นที่สำรวจ', icon: iconMapPin },
]

const deviceBadge = { Desktop: 'bg-yellow', Mobile: 'bg-green' }
const columns = ['วันที่', 'แพลตฟอร์ม', 'เบราว์เซอร์', 'อุปกรณ์']
// 4-column table on ≥sm; each row becomes a 2×2 card on phones
const historyGrid = 'grid grid-cols-2 items-center gap-x-[20px] px-[10px] sm:grid-cols-4'
const cell = 'flex min-w-0 flex-col gap-[4px]'
const mobileLabel = 'text-[10px] text-gray-20 sm:hidden'

export default function ProfilePage() {
  return (
    <div className="flex flex-col px-[24px] max-sm:px-[12px]">
      <div className="flex items-center gap-[10px]">
        <img src={iconGearBlue} alt="" width={24} height={24} />
        <h1 className="text-[20px] leading-[1.2] font-semibold text-blue-00">ตั้งค่าผู้ใช้งาน</h1>
      </div>

      <nav aria-label="Breadcrumb" className="mt-[24px] flex gap-[6px] text-[12px] whitespace-nowrap">
        <Link to="/dashboard" className="leading-[normal] font-light text-gray-10 transition-colors hover:text-blue-00">
          หน้าแรก
        </Link>
        <span aria-hidden="true" className="leading-[1.3] text-gray-line">
          /
        </span>
        <span aria-current="page" className="leading-[normal] font-light text-gray-10">
          ตั้งค่าผู้ใช้งาน
        </span>
      </nav>

      <div className="mt-[24px] grid grid-cols-1 items-start gap-[12px] lg:grid-cols-2">
        {/* ข้อมูลผู้ใช้งาน */}
        <section aria-labelledby="profile-info" className={panel}>
          <h2 id="profile-info" className={panelTitle}>
            ข้อมูลผู้ใช้งาน
          </h2>
          <div className={`${card} grid grid-cols-1 gap-[12px] p-[24px] sm:grid-cols-2 max-sm:p-[16px]`}>
            <Field label="ชื่อ" value={profile.firstName} />
            <Field label="นามสกุล" value={profile.lastName} />
            <Field label="วันเกิด" value={profile.birthDate} />
          </div>
          <div className={`${card} grid grid-cols-1 gap-[12px] p-[24px] sm:grid-cols-2 max-sm:p-[16px]`}>
            <Field label="ตำแหน่ง" value={profile.position} />
            <Field label="สำนัก" value={profile.office} />
          </div>
        </section>

        {/* ปักหมุดระบบที่ใช้งานประจำ */}
        <section aria-labelledby="profile-pins" className={panel}>
          <h2 id="profile-pins" className={panelTitle}>
            ปักหมุดระบบที่ใช้งานประจำ
          </h2>
          <ul className={`${card} flex flex-col gap-[10px] p-[24px] max-sm:p-[16px]`}>
            {pinned.map((p, i) => (
              <li key={p.label} className="flex flex-col gap-[10px]">
                {i > 0 && <img src={divider} alt="" aria-hidden="true" className="block h-[16px] w-full" />}
                <div className="flex items-center gap-[10px]">
                  <div className="flex h-[46px] min-w-0 flex-1 items-center gap-[14px] px-[14px] pt-[8px] pb-[2px]">
                    <img src={p.icon} alt="" width={18} height={18} className="shrink-0" />
                    <span className="truncate text-[14px] leading-[normal] font-light text-black">{p.label}</span>
                  </div>
                  <button
                    type="button"
                    aria-label={`ปักหมุด ${p.label}`}
                    className="flex size-[38px] shrink-0 items-center justify-center rounded-[5px] p-[4px] transition-colors hover:bg-gray-subtle focus-visible:outline-2 focus-visible:outline-blue-00"
                  >
                    <img src={iconPin} alt="" width={28} height={28} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="flex h-[46px] w-full items-center gap-[14px] rounded-[8px] border border-gray-line-2 bg-white px-[14px] py-[12px] text-left transition-colors hover:border-gray-line focus-visible:outline-2 focus-visible:outline-blue-00"
          >
            <img src={iconPlus} alt="" width={18} height={18} />
            <span className="flex-1 text-[14px] leading-[normal] font-light text-black">เพิ่มรายการ</span>
            <img src={iconCaretDown} alt="" width={18} height={18} />
          </button>
        </section>
      </div>

      {/* ประวัติการเข้าใช้งาน */}
      <section aria-labelledby="profile-history" className={`${panel} mt-[24px]`}>
        <h2 id="profile-history" className={panelTitle}>
          ประวัติการเข้าใช้งาน
        </h2>
        <div className={`${card} p-[24px] max-sm:p-[12px]`}>
          <div role="table" aria-labelledby="profile-history" className="flex flex-col gap-[12px]">
            <div role="row" className={`${historyGrid} py-[12px] max-sm:hidden`}>
              {columns.map((c) => (
                <button key={c} type="button" role="columnheader" className="flex w-fit items-end text-[10px] leading-[normal] font-light text-gray-20 hover:text-gray-30">
                  {c}
                  <img src={iconSort} alt="" width={12} height={12} />
                </button>
              ))}
            </div>
            {loginHistory.map((h, i) => (
              <div
                key={h.id}
                role="row"
                className={`${historyGrid} border-t border-gray-line py-[16px] text-[12px] leading-[normal] font-light text-black max-sm:gap-y-[14px] ${i === 0 ? "max-sm:border-t-0 max-sm:pt-[4px]" : ""}`}
              >
                <span role="cell" className={cell}>
                  <span className={mobileLabel}>{columns[0]}</span>
                  {h.date}
                </span>
                <span role="cell" className={cell}>
                  <span className={mobileLabel}>{columns[1]}</span>
                  <span className="flex flex-col gap-[6px]">
                    {h.platform}
                    <span className="text-[10px] text-gray-20">{h.time}</span>
                  </span>
                </span>
                <span role="cell" className={cell}>
                  <span className={mobileLabel}>{columns[2]}</span>
                  {h.browser}
                </span>
                <span role="cell" className={cell}>
                  <span className={mobileLabel}>{columns[3]}</span>
                  <span className={`block w-full max-w-[233px] rounded-[6px] px-[16px] py-[4px] text-[12px] text-[#f2f3f4] ${deviceBadge[h.device]}`}>
                    {h.device}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
