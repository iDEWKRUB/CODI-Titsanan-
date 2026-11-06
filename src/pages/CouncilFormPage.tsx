import { useState } from 'react'
import { Block, FormLayout, FRow, PhoneBoxes, RepeatRows, Upload, ta, inp, bad, validateAddr, blankAddr, AddressBlock, type Addr } from '../components/community/FormKit'
import { useToast } from '../components/leader/Parts'
import { DateInput } from '../components/ui/DateTimeInputs'
import Select from '../components/ui/Select'

const opt = (xs: string[]) => xs.map((x) => ({ value: x, label: x }))
const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const years = Array.from({ length: 8 }, (_, i) => String(2568 - i))

type Council = {
  name: string; founded: string; month: string; year: string; phone: string; fax: string; email: string; website: string
  addr: Addr; contact: string; contactPos: string; cPhone: string; cEmail: string; cFax: string
  communities: { code: string; joined: string; stopped: string }[]
  members: string
  activities: { type: string; detail: string }[]
  docs: string[]; form02: string
}
const blank = (): Council => ({
  name: '', founded: '', month: '', year: '', phone: '', fax: '', email: '', website: '',
  addr: blankAddr(), contact: '', contactPos: '', cPhone: '', cEmail: '', cFax: '',
  communities: [{ code: '', joined: '', stopped: '' }, { code: '', joined: '', stopped: '' }],
  members: '', activities: [{ type: '', detail: '' }], docs: [], form02: '',
})

const toc = [
  { id: 'general', label: 'ข้อมูลทั่วไป' },
  { id: 'address', label: 'ที่ตั้งของสภาองค์กรชุมชน' },
  { id: 'contact', label: 'ข้อมูลการติดต่อ' },
  { id: 'communities', label: 'ชุมชนที่จดแจ้ง' },
  { id: 'members', label: 'สมาชิกสภาองค์กรชุมชน' },
  { id: 'activities', label: 'งาน/กิจกรรมที่จะดำเนินการ' },
  { id: 'docs', label: 'แนบเอกสาร (จช. 02)' },
]

/** OSS-Area › เพิ่มสภาองค์กรชุมชน, แบบ จส. 02 / จช. 02 (Figma 331:21984) — 2.2.2.11 */
export default function CouncilFormPage() {
  const [c, setC] = useState<Council>(blank)
  const [tried, setTried] = useState(false)
  const [toast, show] = useToast()
  const set = (x: Partial<Council>) => setC((s) => ({ ...s, ...x }))
  const setAddr = (x: Partial<Addr>) => setC((s) => ({ ...s, addr: { ...s.addr, ...x } }))

  const errors: Record<string, string> = {}
  if (!c.name.trim()) errors.name = 'กรุณาระบุชื่อสภาองค์กรชุมชน'
  if (!c.founded) errors.founded = 'กรุณาระบุวันที่ก่อตั้ง'
  if (c.phone.length !== 10) errors.phone = 'เบอร์โทรศัพท์ต้องครบ 10 หลัก'
  if (c.email && !/^\S+@\S+\.\S+$/.test(c.email)) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
  if (!c.contact.trim()) errors.contact = 'กรุณาระบุผู้ติดต่อ'
  if (c.cPhone.length !== 10) errors.cPhone = 'เบอร์โทรศัพท์ต้องครบ 10 หลัก'
  const filled = c.communities.filter((x) => x.code.trim() && x.joined).length
  if (filled < 2) errors.communities = 'ต้องมีชุมชนที่จดแจ้งอย่างน้อย 2 ชุมชน (กรอกรหัส/ชื่อชุมชน และวันที่เป็นสมาชิก)'
  if (!/^[1-9]\d*$/.test(c.members)) errors.members = 'กรุณาระบุจำนวนสมาชิก'
  validateAddr(c.addr, errors)
  const e = tried ? errors : {}
  const save = () => {
    setTried(true)
    if (Object.keys(errors).length) return show('กรุณากรอกข้อมูลที่จำเป็นให้ครบและถูกต้อง')
    show(`บันทึกสภาองค์กรชุมชน ${c.name} แล้ว`)
  }

  return (
    <>
      <FormLayout
        title="เพิ่มสภาองค์กรชุมชน"
        back="/community/map"
        toc={toc}
        onSave={save}
        aside={
          <div className="flex items-center gap-[10px] rounded-[12px] bg-blue-bg px-[16px] py-[12px]">
            <span className="rounded-[6px] bg-blue-00 px-[8px] py-[2px] font-urbanist text-[13px] font-semibold text-white">จส. 02</span>
            <span className="text-[13px] font-light text-blue-dark">แบบแจ้งการจัดตั้งสภาองค์กรชุมชน · เอกสารแนบใช้แบบ จช. 02</span>
          </div>
        }
      >
        <Block id="general" title="ข้อมูลทั่วไป">
          <FRow label="ชื่อสภาองค์กรชุมชน" req err={e.name} wide><input aria-label="ชื่อสภาองค์กรชุมชน" className={`${inp} ${e.name ? bad : ''}`} value={c.name} onChange={(x) => set({ name: x.target.value })} /></FRow>
          <FRow label="วันที่ก่อตั้ง" req err={e.founded} wide><div className="max-w-[260px]"><DateInput label="วันที่ก่อตั้ง" value={c.founded} onChange={(v) => set({ founded: v })} /></div></FRow>
          <FRow label="ผลการดำเนินงาน" wide>
            <div className="grid max-w-[460px] grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-[8px] max-sm:grid-cols-1">
              <span className="text-[12px] text-gray-30">เดือน :</span>
              <Select label="เดือน" value={c.month} placeholder="เลือกเดือน" options={opt(months)} onChange={(v) => set({ month: v })} />
              <span className="text-[12px] text-gray-30">ปี :</span>
              <Select label="ปี" value={c.year} placeholder="เลือกปี" options={opt(years)} onChange={(v) => set({ year: v })} />
            </div>
          </FRow>
          <FRow label="เบอร์โทรศัพท์" req err={e.phone} wide><PhoneBoxes value={c.phone} onChange={(v) => set({ phone: v })} label="เบอร์โทรศัพท์" invalid={!!e.phone} /></FRow>
          <FRow label="โทรสาร" wide><PhoneBoxes value={c.fax} onChange={(v) => set({ fax: v })} label="โทรสาร" groups={[2, 3, 4]} /></FRow>
          <FRow label="Email" err={e.email} wide><input aria-label="Email" className={`${inp} max-w-[320px] ${e.email ? bad : ''}`} value={c.email} onChange={(x) => set({ email: x.target.value })} /></FRow>
          <FRow label="Website" wide><input aria-label="Website" placeholder="https://" className={`${inp} max-w-[420px]`} value={c.website} onChange={(x) => set({ website: x.target.value })} /></FRow>
        </Block>

        <Block id="address" title="ที่ตั้งของสภาองค์กรชุมชน">
          <AddressBlock a={c.addr} set={setAddr} err={e} idp="cf" />
        </Block>

        <Block id="contact" title="ข้อมูลการติดต่อ">
          <FRow label="ผู้ติดต่อ" req err={e.contact}><input aria-label="ผู้ติดต่อ" className={`${inp} max-w-[420px] ${e.contact ? bad : ''}`} value={c.contact} onChange={(x) => set({ contact: x.target.value })} /></FRow>
          <FRow label="ตำแหน่ง"><div className="max-w-[260px]"><Select label="ตำแหน่ง" value={c.contactPos} placeholder="เลือกตำแหน่ง" options={opt(['ประธานสภา', 'รองประธานสภา', 'เลขานุการ', 'กรรมการ'])} onChange={(v) => set({ contactPos: v })} /></div></FRow>
          <FRow label="เบอร์โทรศัพท์" req err={e.cPhone}><PhoneBoxes value={c.cPhone} onChange={(v) => set({ cPhone: v })} label="เบอร์โทรศัพท์ผู้ติดต่อ" invalid={!!e.cPhone} /></FRow>
          <FRow label="Email"><input aria-label="Email ผู้ติดต่อ" className={`${inp} max-w-[320px]`} value={c.cEmail} onChange={(x) => set({ cEmail: x.target.value })} /></FRow>
          <FRow label="โทรสาร"><PhoneBoxes value={c.cFax} onChange={(v) => set({ cFax: v })} label="โทรสารผู้ติดต่อ" groups={[2, 3, 4]} /></FRow>
        </Block>

        <Block id="communities" title="ชุมชนที่จดแจ้ง ฯ (อย่างน้อย 2 ชุมชน)">
          <RepeatRows rows={c.communities} onChange={(r) => set({ communities: r })} blank={{ code: '', joined: '', stopped: '' }} addLabel="เพิ่มชุมชน" min={2} cols={[{ key: 'code', label: 'รหัส/ชื่อ ชุมชน', placeholder: 'เช่น 5001-บ้านแม่นาจร' }, { key: 'joined', label: 'วันที่เป็นสมาชิก', width: '170px', type: 'date' }, { key: 'stopped', label: 'วันที่หยุดดำเนินการ', width: '170px', type: 'date' }]} />
          <p className={`text-[11px] ${e.communities ? 'text-red-00' : 'font-light text-gray-20'}`} role={e.communities ? 'alert' : undefined}>{e.communities ?? `กรอกครบแล้ว ${filled} ชุมชน`}</p>
        </Block>

        <Block id="members" title="สมาชิกสภาองค์กรชุมชน">
          <FRow label="จำนวนสมาชิก" err={e.members} wide>
            <div className="flex items-center gap-[8px]">
              <input aria-label="จำนวนสมาชิก" inputMode="numeric" className={`${inp} max-w-[160px] ${e.members ? bad : ''}`} value={c.members} onChange={(x) => set({ members: x.target.value.replace(/\D/g, '') })} />
              <span className="text-[12px] text-gray-20">คน</span>
            </div>
          </FRow>
        </Block>

        <Block id="activities" title="งาน/กิจกรรม ที่จะดำเนินการ">
          <RepeatRows rows={c.activities} onChange={(r) => set({ activities: r })} blank={{ type: '', detail: '' }} addLabel="เพิ่มกิจกรรม" min={1} cols={[{ key: 'type', label: 'ประเภทกิจกรรม', width: '38%' }, { key: 'detail', label: 'รายละเอียด' }]} />
        </Block>

        <Block id="docs" title="แนบเอกสาร (จช. 02)">
          <div className="flex flex-col gap-[8px]">
            {c.docs.map((f, i) => (
              <div key={i} className="flex items-center gap-[8px] rounded-[8px] bg-blue-bg px-[12px] py-[8px] text-[12px] text-blue-dark">
                <span className="min-w-0 flex-1 truncate">{f}</span>
                <button type="button" aria-label={`ลบ ${f}`} onClick={() => set({ docs: c.docs.filter((_, j) => j !== i) })} className="text-gray-30 hover:text-red-00">×</button>
              </div>
            ))}
            <Upload label="อัปโหลดไฟล์" hint="ขนาดไม่เกิน 20 MB ต่อไฟล์" value="" onChange={(n) => n && set({ docs: [...c.docs, n] })} />
          </div>
          <textarea aria-label="หมายเหตุ" placeholder="หมายเหตุ (ถ้ามี)" className={ta} value={c.form02} onChange={(x) => set({ form02: x.target.value })} />
        </Block>
      </FormLayout>
      {toast}
    </>
  )
}
