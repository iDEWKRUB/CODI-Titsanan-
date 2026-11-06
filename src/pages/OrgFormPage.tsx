import { useState } from 'react'
import { Block, ExcelUpload, FormLayout, FRow, PhoneBoxes, RepeatRows, SubHead, Upload, ta, inp, bad, validateAddr, blankAddr, AddressBlock, type Addr } from '../components/community/FormKit'
import { softBtn, useToast } from '../components/leader/Parts'
import { DateInput } from '../components/ui/DateTimeInputs'
import Select from '../components/ui/Select'

const opt = (xs: string[]) => xs.map((x) => ({ value: x, label: x }))
const people = [
  { name: 'นายกราณต์ วาจาอุทัย', pos: 'ประธาน', phone: '0854339889', email: 'karn.v@gmail.com' },
  { name: 'นางสมศรี แก้วมณี', pos: 'เหรัญญิก', phone: '0812345678', email: 'somsri@example.com' },
  { name: 'นายประเสริฐ ศรีสุข', pos: 'เลขานุการ', phone: '0899876543', email: 'prasert@example.com' },
]

type Org = {
  name: string; moNo: string; kind: string; area: string; founded: string; objective: string
  addr: Addr; coord: string; coordPos: string; phone: string; email: string; fax: string
  excel: string; doc: string
  members: { year: string; type: string; count: string }[]
  fund: { year: string; source: string; amount: string }[]
  plans: { name: string; period: string; detail: string }[]
  highlights: string; problems: string
  files: string[]
}
const blank = (): Org => ({
  name: '', moNo: '', kind: 'องค์กรชุมชน', area: 'ชนบท', founded: '', objective: '',
  addr: blankAddr(), coord: '', coordPos: '', phone: '', email: '', fax: '',
  excel: '', doc: '',
  members: [{ year: '', type: '', count: '' }], fund: [], plans: [], highlights: '', problems: '', files: [],
})

const toc = [
  { id: 'upload', label: 'อัปโหลดข้อมูล' },
  { id: 'general', label: 'ข้อมูลทั่วไป' },
  { id: 'address', label: 'ที่ตั้งองค์กร' },
  { id: 'contact', label: 'ข้อมูลการติดต่อ' },
  { id: 'members', label: 'จำนวนสมาชิก' },
  { id: 'fund', label: 'เงินทุนแรกก่อตั้ง' },
  { id: 'plans', label: 'แผนงาน/กิจกรรม' },
  { id: 'highlight', label: 'จุดเด่น/ผลสำเร็จ' },
  { id: 'problem', label: 'ปัญหาและอุปสรรค' },
  { id: 'files', label: 'แฟ้มข้อมูล' },
]

/** OSS-Area › เพิ่ม/แก้ไขข้อมูลองค์กรชุมชน (Figma 324:20532) — 2.2.2.9 */
export default function OrgFormPage() {
  const [o, setO] = useState<Org>(blank)
  const [tried, setTried] = useState(false)
  const [pick, setPick] = useState(false)
  const [toast, show] = useToast()
  const set = (x: Partial<Org>) => setO((s) => ({ ...s, ...x }))
  const setAddr = (x: Partial<Addr>) => setO((s) => ({ ...s, addr: { ...s.addr, ...x } }))

  const errors: Record<string, string> = {}
  if (!o.name.trim()) errors.name = 'กรุณาระบุชื่อองค์กร'
  if (o.moNo && !/^\d{1,13}$/.test(o.moNo)) errors.moNo = 'เลข พม. ต้องเป็นตัวเลข'
  if (!o.founded) errors.founded = 'กรุณาระบุวันที่ก่อตั้ง'
  if (!o.objective.trim()) errors.objective = 'กรุณาระบุวัตถุประสงค์องค์กร'
  if (!o.coord.trim()) errors.coord = 'กรุณาระบุผู้ประสานงาน'
  if (o.phone.length !== 10) errors.phone = 'เบอร์โทรศัพท์ต้องครบ 10 หลัก'
  if (o.email && !/^\S+@\S+\.\S+$/.test(o.email)) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
  validateAddr(o.addr, errors)
  const e = tried ? errors : {}
  const save = () => {
    setTried(true)
    if (Object.keys(errors).length) return show('กรุณากรอกข้อมูลที่จำเป็นให้ครบและถูกต้อง')
    show(`บันทึกข้อมูลองค์กร ${o.name} แล้ว`)
  }

  return (
    <>
      <FormLayout title="เพิ่ม/แก้ไขข้อมูลองค์กรชุมชน" back="/community/map" toc={toc} onSave={save}>
        <Block id="upload" title="อัปโหลดข้อมูล">
          <div className="flex flex-col gap-[6px]">
            <p className="text-[14px] font-medium text-black">อัปโหลดเอกสารในรูปแบบไฟล์/ภาพถ่าย</p>
            <Upload label="อัปโหลดไฟล์ หรือ ภาพถ่าย" hint="PDF, DOCX, PNG, JPG, JPEG ขนาดไม่เกิน 20 MB" accept=".pdf,.docx,.png,.jpg,.jpeg" value={o.doc} onChange={(v) => set({ doc: v })} />
          </div>
          <div className="flex flex-col gap-[6px]">
            <p className="text-[14px] font-medium text-black">อัปโหลดข้อมูลในรูปแบบไฟล์ Excel</p>
            <ExcelUpload value={o.excel} onChange={(v) => set({ excel: v })} />
            {o.excel && <div><button type="button" onClick={() => { set({ name: 'กลุ่มออมทรัพย์บ้านแม่นาจร', moNo: '5001234567', founded: '2012-06-15', objective: 'ส่งเสริมการออมและสวัสดิการสมาชิกในชุมชน' }); show('นำเข้าข้อมูลจากไฟล์ Excel แล้ว (ตัวอย่าง)') }} className={`${softBtn} px-[12px] py-[7px] text-[12px]`}>นำเข้าข้อมูล</button></div>}
          </div>
        </Block>

        <Block id="general" title="ข้อมูลทั่วไป">
          <FRow label="ชื่อองค์กร" req err={e.name} wide><input aria-label="ชื่อองค์กร" className={`${inp} ${e.name ? bad : ''}`} value={o.name} onChange={(x) => set({ name: x.target.value })} /></FRow>
          <FRow label="เลข พม." err={e.moNo} wide><input aria-label="เลข พม." inputMode="numeric" className={`${inp} max-w-[260px] ${e.moNo ? bad : ''}`} value={o.moNo} onChange={(x) => set({ moNo: x.target.value.replace(/\D/g, '') })} /></FRow>
          <FRow label="ประเภทองค์กร" req wide>
            <div className="flex gap-[8px]" role="radiogroup" aria-label="ประเภทองค์กร">
              {['องค์กรชุมชน', 'สวัสดิการชุมชน'].map((k) => (
                <button key={k} type="button" role="radio" aria-checked={o.kind === k} onClick={() => set({ kind: k })} className={`rounded-full border px-[14px] py-[6px] text-[12px] transition-colors ${o.kind === k ? 'border-blue-00 bg-blue-bg font-medium text-blue-00' : 'border-gray-line text-gray-30 hover:border-gray-10'}`}>{k}</button>
              ))}
            </div>
          </FRow>
          <FRow label="องค์กรเมือง / ชนบท" req wide>
            <div className="flex gap-[8px]" role="radiogroup" aria-label="องค์กรเมือง / ชนบท">
              {['องค์กรเมือง', 'ชนบท'].map((k) => (
                <button key={k} type="button" role="radio" aria-checked={o.area === k} onClick={() => set({ area: k })} className={`rounded-full border px-[14px] py-[6px] text-[12px] transition-colors ${o.area === k ? 'border-blue-00 bg-blue-bg font-medium text-blue-00' : 'border-gray-line text-gray-30 hover:border-gray-10'}`}>{k}</button>
              ))}
            </div>
          </FRow>
          <FRow label="วันที่ก่อตั้ง" req err={e.founded} wide><div className="max-w-[260px]"><DateInput label="วันที่ก่อตั้ง" value={o.founded} onChange={(v) => set({ founded: v })} /></div></FRow>
          <FRow label="วัตถุประสงค์องค์กร" req err={e.objective} wide><textarea aria-label="วัตถุประสงค์องค์กร" className={`${ta} ${e.objective ? bad : ''}`} value={o.objective} onChange={(x) => set({ objective: x.target.value })} /></FRow>
        </Block>

        <Block id="address" title="ที่ตั้งองค์กร">
          <AddressBlock a={o.addr} set={setAddr} err={e} idp="of" />
        </Block>

        <Block
          id="contact"
          title="ข้อมูลการติดต่อ"
          action={
            <div className="relative">
              <button type="button" aria-expanded={pick} onClick={() => setPick((v) => !v)} className={`${softBtn} px-[12px] py-[7px] text-[12px]`}>ดึงข้อมูลบุคคล</button>
              {pick && (
                <ul role="listbox" aria-label="เลือกบุคคล" className="absolute top-[calc(100%+6px)] right-0 z-20 w-[280px] overflow-hidden rounded-[10px] border border-gray-line-2 bg-white p-[4px] shadow-lg">
                  {people.map((p) => (
                    <li key={p.name}>
                      <button type="button" role="option" aria-selected="false" onClick={() => { set({ coord: p.name, coordPos: p.pos, phone: p.phone, email: p.email }); setPick(false); show(`ดึงข้อมูล ${p.name} เข้ามาแล้ว`) }} className="flex w-full flex-col rounded-[8px] px-[10px] py-[8px] text-left hover:bg-blue-bg">
                        <span className="text-[13px] text-black">{p.name}</span>
                        <span className="text-[11px] font-light text-gray-20">{p.pos} · {p.phone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          }
        >
          <FRow label="ผู้ประสานงาน" req err={e.coord}><input aria-label="ผู้ประสานงาน" className={`${inp} max-w-[420px] ${e.coord ? bad : ''}`} value={o.coord} onChange={(x) => set({ coord: x.target.value })} /></FRow>
          <FRow label="ตำแหน่ง"><div className="max-w-[260px]"><Select label="ตำแหน่ง" value={o.coordPos} placeholder="เลือกตำแหน่ง" options={opt(['ประธาน', 'รองประธาน', 'เลขานุการ', 'เหรัญญิก', 'กรรมการ'])} onChange={(v) => set({ coordPos: v })} /></div></FRow>
          <FRow label="เบอร์โทรศัพท์" req err={e.phone}><PhoneBoxes value={o.phone} onChange={(v) => set({ phone: v })} label="เบอร์โทรศัพท์" invalid={!!e.phone} /></FRow>
          <FRow label="Email" err={e.email}><input aria-label="Email" className={`${inp} max-w-[320px] ${e.email ? bad : ''}`} value={o.email} onChange={(x) => set({ email: x.target.value })} /></FRow>
          <FRow label="โทรสาร"><PhoneBoxes value={o.fax} onChange={(v) => set({ fax: v })} label="โทรสาร" groups={[2, 3, 4]} /></FRow>
        </Block>

        <Block id="members" title="จำนวนสมาชิก" fold>
          <RepeatRows rows={o.members} onChange={(r) => set({ members: r })} blank={{ year: '', type: '', count: '' }} addLabel="เพิ่มปี" min={1} cols={[{ key: 'year', label: 'ปี พ.ศ.', width: '120px', type: 'number', placeholder: '2568' }, { key: 'type', label: 'ประเภทสมาชิก', placeholder: 'เช่น สามัญ' }, { key: 'count', label: 'จำนวน (คน)', width: '140px', type: 'number' }]} />
        </Block>
        <Block id="fund" title="เงินทุนแรกก่อตั้ง" fold defaultOpen={false}>
          <RepeatRows rows={o.fund} onChange={(r) => set({ fund: r })} blank={{ year: '', source: '', amount: '' }} addLabel="เพิ่มรายการเงินทุน" cols={[{ key: 'year', label: 'ปี พ.ศ.', width: '120px', type: 'number' }, { key: 'source', label: 'แหล่งที่มา' }, { key: 'amount', label: 'จำนวนเงิน (บาท)', width: '170px', type: 'number' }]} />
        </Block>
        <Block id="plans" title="แผนงาน/กิจกรรมที่กลุ่มจะดำเนินต่อ" fold defaultOpen={false}>
          <RepeatRows rows={o.plans} onChange={(r) => set({ plans: r })} blank={{ name: '', period: '', detail: '' }} addLabel="เพิ่มแผนงาน" cols={[{ key: 'name', label: 'แผนงาน/กิจกรรม' }, { key: 'period', label: 'ช่วงเวลา', width: '150px' }, { key: 'detail', label: 'รายละเอียด' }]} />
        </Block>
        <Block id="highlight" title="จุดเด่น/ผลสำเร็จ" fold defaultOpen={false}>
          <textarea aria-label="จุดเด่น/ผลสำเร็จ" className={ta} value={o.highlights} onChange={(x) => set({ highlights: x.target.value })} />
        </Block>
        <Block id="problem" title="ปัญหาและอุปสรรคของกลุ่ม" fold defaultOpen={false}>
          <textarea aria-label="ปัญหาและอุปสรรคของกลุ่ม" className={ta} value={o.problems} onChange={(x) => set({ problems: x.target.value })} />
        </Block>
        <Block id="files" title="แฟ้มข้อมูล" fold defaultOpen={false}>
          <SubHead>เอกสารแนบ</SubHead>
          <div className="flex flex-col gap-[8px]">
            {o.files.map((f, i) => (
              <div key={i} className="flex items-center gap-[8px] rounded-[8px] bg-blue-bg px-[12px] py-[8px] text-[12px] text-blue-dark">
                <span className="min-w-0 flex-1 truncate">{f}</span>
                <button type="button" aria-label={`ลบ ${f}`} onClick={() => set({ files: o.files.filter((_, j) => j !== i) })} className="text-gray-30 hover:text-red-00">×</button>
              </div>
            ))}
            <Upload label="เพิ่มไฟล์แนบ" hint="ไม่เกิน 20 MB ต่อไฟล์" value="" onChange={(n) => n && set({ files: [...o.files, n] })} />
          </div>
        </Block>
      </FormLayout>
      {toast}
    </>
  )
}
