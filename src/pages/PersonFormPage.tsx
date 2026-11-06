import { useState } from 'react'
import DigitBoxes from '../components/community/DigitBoxes'
import { Block, ExcelUpload, FormLayout, FRow, PhoneBoxes, RepeatRows, SubHead, Upload, inp, bad, validateAddr, blankAddr, AddressBlock, type Addr } from '../components/community/FormKit'
import { softBtn, useToast } from '../components/leader/Parts'
import { DateInput } from '../components/ui/DateTimeInputs'
import Select from '../components/ui/Select'

const opt = (xs: string[]) => xs.map((x) => ({ value: x, label: x }))
const orgs = ['กลุ่มออมทรัพย์บ้านแม่นาจร', 'สภาองค์กรชุมชนตำบลแม่แฝก', 'เครือข่ายผู้นำชุมชนภาคเหนือ', 'ชุมชนบ้านมั่นคงริมคลอง', 'กองทุนสวัสดิการชุมชนบ้านโป่ง']
const jobs = ['เกษตรกร', 'ค้าขาย/ธุรกิจส่วนตัว', 'รับจ้างทั่วไป', 'ข้าราชการ/พนักงานรัฐ', 'พนักงานเอกชน', 'อื่น ๆ']

type Person = {
  prefix: string; first: string; last: string; idType: string; idNo: string; photo: string; gender: string; birth: string; status: string
  addr: Addr; phone: string; email: string; fax: string; job: string; org: string; position: string; joined: string
  excel: string; doc: string
  skills: { name: string; detail: string }[]
  works: { place: string; role: string; from: string; to: string }[]
  edu: { school: string; level: string; year: string }[]
  awards: { name: string; year: string; detail: string }[]
  trainings: { course: string; year: string; place: string }[]
  files: { name: string; type: string }[]
}
const blank = (): Person => ({
  prefix: '', first: '', last: '', idType: 'บัตรประชาชน', idNo: '', photo: '', gender: '', birth: '', status: 'มีชีวิต',
  addr: blankAddr(), phone: '', email: '', fax: '', job: '', org: '', position: '', joined: '',
  excel: '', doc: '',
  skills: [], works: [], edu: [], awards: [], trainings: [], files: [],
})

const toc = [
  { id: 'upload', label: 'อัปโหลดข้อมูล' },
  { id: 'general', label: 'ข้อมูลทั่วไป' },
  { id: 'address', label: 'ที่อยู่อาศัยปัจจุบัน' },
  { id: 'contact', label: 'ข้อมูลการติดต่อ' },
  { id: 'job', label: 'ข้อมูลอาชีพและองค์กร' },
  { id: 'skills', label: 'ความเชี่ยวชาญ' },
  { id: 'works', label: 'ประวัติการทำงาน' },
  { id: 'edu', label: 'ประวัติการศึกษา' },
  { id: 'awards', label: 'ผลงาน/เกียรติคุณ' },
  { id: 'trainings', label: 'ประวัติการอบรมหลักสูตร' },
  { id: 'files', label: 'แฟ้มข้อมูล' },
]

/** OSS-Area › เพิ่ม/แก้ไขข้อมูลบุคคล (Figma 320:20436) — 2.2.2.8 */
export default function PersonFormPage() {
  const [p, setP] = useState<Person>(blank)
  const [tried, setTried] = useState(false)
  const [toast, show] = useToast()
  const set = (x: Partial<Person>) => setP((s) => ({ ...s, ...x }))
  const setAddr = (x: Partial<Addr>) => setP((s) => ({ ...s, addr: { ...s.addr, ...x } }))

  const errors: Record<string, string> = {}
  if (!p.first.trim() || !p.last.trim()) errors.name = 'กรุณาระบุชื่อและนามสกุล'
  if (p.idType === 'บัตรประชาชน' && p.idNo.length !== 13) errors.idNo = 'เลขบัตรประชาชนต้องครบ 13 หลัก'
  if (p.idType !== 'บัตรประชาชน' && !p.idNo.trim()) errors.idNo = 'กรุณาระบุเลขที่เอกสาร'
  if (!p.gender) errors.gender = 'กรุณาเลือกเพศ'
  if (!p.birth) errors.birth = 'กรุณาระบุวันเกิด'
  if (p.phone.length !== 10) errors.phone = 'เบอร์โทรศัพท์ต้องครบ 10 หลัก'
  if (!/^\S+@\S+\.\S+$/.test(p.email)) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
  validateAddr(p.addr, errors)
  const e = tried ? errors : {}

  const readCard = () => {
    set({ prefix: 'นาย', first: 'สมชาย', last: 'ใจดี', idType: 'บัตรประชาชน', idNo: '1509900123456', gender: 'ชาย', birth: '1978-04-12', addr: { ...p.addr, houseNo: '118', moo: '10', province: 'เชียงใหม่', region: 'ภาคเหนือ', district: 'แม่แตง', subdistrict: 'แม่แฝก', zip: '50150', apt: p.addr.apt } })
    show('อ่านข้อมูลจากบัตรประชาชนแล้ว (ตัวอย่าง) ตรวจสอบและแก้ไขได้')
  }
  const save = () => {
    setTried(true)
    if (Object.keys(errors).length) return show('กรุณากรอกข้อมูลที่จำเป็นให้ครบและถูกต้อง')
    show(`บันทึกข้อมูลบุคคล ${p.prefix}${p.first} ${p.last} แล้ว`)
  }

  return (
    <>
      <FormLayout title="เพิ่ม/แก้ไขข้อมูลบุคคล" back="/community/map" toc={toc} onSave={save}>
        <Block id="upload" title="อัปโหลดข้อมูล">
          <div className="flex flex-col gap-[6px]">
            <p className="text-[14px] font-medium text-black">อัปโหลดเอกสารในรูปแบบไฟล์/ภาพถ่าย</p>
            <Upload label="อัปโหลดไฟล์ หรือ ภาพถ่าย" hint="PDF, DOCX, PNG, JPG, JPEG ขนาดไม่เกิน 20 MB" accept=".pdf,.docx,.png,.jpg,.jpeg" value={p.doc} onChange={(v) => set({ doc: v })} />
          </div>
          <div className="flex flex-col gap-[6px]">
            <p className="text-[14px] font-medium text-black">อัปโหลดข้อมูลในรูปแบบไฟล์ Excel</p>
            <ExcelUpload value={p.excel} onChange={(v) => set({ excel: v })} />
            {p.excel && <div><button type="button" onClick={() => { set({ prefix: 'นาง', first: 'สมศรี', last: 'แก้วมณี', idNo: '3501200456789', gender: 'หญิง', birth: '1982-09-03', phone: '0854339889', email: 'somsri@example.com' }); show('นำเข้าข้อมูลจากไฟล์ Excel แล้ว (ตัวอย่าง)') }} className={`${softBtn} px-[12px] py-[7px] text-[12px]`}>นำเข้าข้อมูล</button></div>}
          </div>
        </Block>

        <Block id="general" title="ข้อมูลทั่วไป" action={<button type="button" onClick={readCard} className={`${softBtn} px-[12px] py-[7px] text-[12px]`}>เพิ่มข้อมูลจากบัตรประชาชน</button>}>
          <FRow label="ชื่อ-นามสกุล" req err={e.name} wide>
            <div className="grid grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] gap-[8px] max-md:grid-cols-1">
              <Select label="คำนำหน้า" value={p.prefix} placeholder="คำนำหน้า" options={opt(['นาย', 'นาง', 'นางสาว', 'ดร.', 'อื่น ๆ'])} onChange={(v) => set({ prefix: v })} />
              <input aria-label="ชื่อ" placeholder="ชื่อ" className={`${inp} ${e.name ? bad : ''}`} value={p.first} onChange={(x) => set({ first: x.target.value })} />
              <input aria-label="นามสกุล" placeholder="นามสกุล" className={`${inp} ${e.name ? bad : ''}`} value={p.last} onChange={(x) => set({ last: x.target.value })} />
            </div>
          </FRow>
          <FRow label="ประเภทบัตร" req wide><div className="max-w-[260px]"><Select label="ประเภทบัตร" value={p.idType} options={opt(['บัตรประชาชน', 'หนังสือเดินทาง (Passport)', 'บัตรคนต่างด้าว'])} onChange={(v) => set({ idType: v, idNo: '' })} /></div></FRow>
          <FRow label="เลขบัตร" req err={e.idNo} wide>
            {p.idType === 'บัตรประชาชน' ? <DigitBoxes value={p.idNo} groups={[1, 4, 5, 2, 1]} onChange={(v) => set({ idNo: v })} label="เลขบัตรประชาชน" invalid={!!e.idNo} /> : <input aria-label="เลขที่เอกสาร" className={`${inp} max-w-[260px] ${e.idNo ? bad : ''}`} value={p.idNo} onChange={(x) => set({ idNo: x.target.value })} />}
          </FRow>
          <FRow label="รูปประจำตัว" wide><Upload label="อัปโหลดไฟล์" hint="JPG, JPEG, GIF, PNG ขนาดไม่เกิน 10 MB (H: 120 x W: 120 px)" accept="image/*" value={p.photo} onChange={(v) => set({ photo: v })} /></FRow>
          <FRow label="เพศ" req err={e.gender} wide><div className="max-w-[260px]"><Select label="เพศ" value={p.gender} placeholder="เลือกเพศ" options={opt(['ชาย', 'หญิง', 'ไม่ระบุ'])} onChange={(v) => set({ gender: v })} /></div></FRow>
          <FRow label="วัน เดือน ปีเกิด" req err={e.birth} wide><div className="max-w-[260px]"><DateInput label="วัน เดือน ปีเกิด" value={p.birth} onChange={(v) => set({ birth: v })} /></div></FRow>
          <FRow label="สถานะบุคคล" wide><div className="max-w-[260px]"><Select label="สถานะบุคคล" value={p.status} options={opt(['มีชีวิต', 'เสียชีวิต', 'ไม่ทราบ'])} onChange={(v) => set({ status: v })} /></div></FRow>
        </Block>

        <Block id="address" title="ที่อยู่อาศัยปัจจุบัน">
          <AddressBlock a={p.addr} set={setAddr} err={e} idp="pf" />
        </Block>

        <Block id="contact" title="ข้อมูลการติดต่อ">
          <FRow label="เบอร์โทรศัพท์" req err={e.phone}><PhoneBoxes value={p.phone} onChange={(v) => set({ phone: v })} label="เบอร์โทรศัพท์" invalid={!!e.phone} /></FRow>
          <FRow label="Email" req err={e.email}><input aria-label="Email" className={`${inp} max-w-[320px] ${e.email ? bad : ''}`} value={p.email} onChange={(x) => set({ email: x.target.value })} /></FRow>
          <FRow label="โทรสาร"><PhoneBoxes value={p.fax} onChange={(v) => set({ fax: v })} label="โทรสาร" groups={[2, 3, 4]} /></FRow>
        </Block>

        <Block id="job" title="ข้อมูลอาชีพและองค์กร">
          <SubHead>ข้อมูลอาชีพ</SubHead>
          <FRow label="กลุ่มอาชีพ"><div className="max-w-[320px]"><Select label="กลุ่มอาชีพ" value={p.job} placeholder="เลือกกลุ่มอาชีพ" options={opt(jobs)} onChange={(v) => set({ job: v })} /></div></FRow>
          <SubHead>องค์กร</SubHead>
          <FRow label="ชื่อองค์กร"><div className="max-w-[420px]"><Select label="ชื่อองค์กร" value={p.org} placeholder="ค้นหา/เลือกองค์กร" options={opt(orgs)} onChange={(v) => set({ org: v })} /></div></FRow>
          <FRow label="ตำแหน่ง"><div className="max-w-[320px]"><Select label="ตำแหน่ง" value={p.position} placeholder="เลือกตำแหน่ง" options={opt(['ประธาน', 'รองประธาน', 'เลขานุการ', 'เหรัญญิก', 'กรรมการ', 'สมาชิก'])} onChange={(v) => set({ position: v })} /></div></FRow>
          <FRow label="วันที่เข้าร่วม พอช."><div className="max-w-[260px]"><DateInput label="วันที่เข้าร่วม พอช." value={p.joined} onChange={(v) => set({ joined: v })} /></div></FRow>
        </Block>

        <Block id="skills" title="ความเชี่ยวชาญ" fold defaultOpen={false}>
          <RepeatRows rows={p.skills} onChange={(r) => set({ skills: r })} blank={{ name: '', detail: '' }} addLabel="เพิ่มความเชี่ยวชาญ" cols={[{ key: 'name', label: 'ความเชี่ยวชาญ', width: '40%' }, { key: 'detail', label: 'รายละเอียด' }]} />
        </Block>
        <Block id="works" title="ประวัติการทำงาน" fold defaultOpen={false}>
          <RepeatRows rows={p.works} onChange={(r) => set({ works: r })} blank={{ place: '', role: '', from: '', to: '' }} addLabel="เพิ่มประวัติการทำงาน" cols={[{ key: 'place', label: 'หน่วยงาน/สถานที่' }, { key: 'role', label: 'ตำแหน่ง' }, { key: 'from', label: 'ตั้งแต่ปี', width: '110px', type: 'number' }, { key: 'to', label: 'ถึงปี', width: '110px', type: 'number' }]} />
        </Block>
        <Block id="edu" title="ประวัติการศึกษา" fold defaultOpen={false}>
          <RepeatRows rows={p.edu} onChange={(r) => set({ edu: r })} blank={{ school: '', level: '', year: '' }} addLabel="เพิ่มประวัติการศึกษา" cols={[{ key: 'school', label: 'สถานศึกษา' }, { key: 'level', label: 'ระดับ/วุฒิ' }, { key: 'year', label: 'ปีที่จบ', width: '110px', type: 'number' }]} />
        </Block>
        <Block id="awards" title="ผลงาน/เกียรติคุณ" fold defaultOpen={false}>
          <RepeatRows rows={p.awards} onChange={(r) => set({ awards: r })} blank={{ name: '', year: '', detail: '' }} addLabel="เพิ่มผลงาน/เกียรติคุณ" cols={[{ key: 'name', label: 'ชื่อผลงาน/รางวัล' }, { key: 'year', label: 'ปี', width: '110px', type: 'number' }, { key: 'detail', label: 'รายละเอียด' }]} />
        </Block>
        <Block id="trainings" title="ประวัติการอบรมหลักสูตร" fold defaultOpen={false}>
          <RepeatRows rows={p.trainings} onChange={(r) => set({ trainings: r })} blank={{ course: '', year: '', place: '' }} addLabel="เพิ่มหลักสูตร" cols={[{ key: 'course', label: 'หลักสูตร' }, { key: 'year', label: 'ปี', width: '110px', type: 'number' }, { key: 'place', label: 'หน่วยงานที่จัด' }]} />
        </Block>
        <Block id="files" title="แฟ้มข้อมูล" fold defaultOpen={false}>
          <div className="flex flex-col gap-[8px]">
            {p.files.map((f, i) => (
              <div key={i} className="flex items-center gap-[8px] rounded-[8px] bg-blue-bg px-[12px] py-[8px] text-[12px] text-blue-dark">
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <button type="button" aria-label={`ลบ ${f.name}`} onClick={() => set({ files: p.files.filter((_, j) => j !== i) })} className="text-gray-30 hover:text-red-00">×</button>
              </div>
            ))}
            <Upload label="เพิ่มไฟล์แนบ" hint="ไม่เกิน 20 MB ต่อไฟล์" value="" onChange={(n) => n && set({ files: [...p.files, { name: n, type: '' }] })} />
          </div>
        </Block>
      </FormLayout>
      {toast}
    </>
  )
}
