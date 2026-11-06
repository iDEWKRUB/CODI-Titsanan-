import AppShell from '../components/app/AppShell'

const rows = [
  { t: 'ศูนย์ช่วยเหลือ (Helpdesk)', d: 'ปัญหาการใช้งานระบบและบัญชีผู้ใช้', v: '02-378-8300 ต่อ 1111', s: 'จันทร์–ศุกร์ 08.30–16.30 น.' },
  { t: 'IT Support / Admin', d: 'แจ้งปัญหาระบบ สิทธิ์การเข้าใช้งาน', v: 'itsupport@codi.or.th', s: 'ตอบกลับภายใน 1 วันทำการ' },
  { t: 'สำนักเทคโนโลยีสารสนเทศ', d: 'การเชื่อมต่อระบบและข้อมูล', v: '02-378-8300 ต่อ 2201', s: 'จันทร์–ศุกร์ 08.30–16.30 น.' },
  { t: 'งานสารบรรณกลาง', d: 'หนังสือเข้า-ออก การลงนามอิเล็กทรอนิกส์', v: 'saraban@codi.co.th', s: 'จันทร์–ศุกร์ 08.30–16.30 น.' },
]

/** ช่องทางการติดต่อ (nav "ช่องทางการติดต่อ" of CODI APP) */
export default function AppContactPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-[16px]">
        <h1 className="text-[22px] font-semibold text-blue-dark">ช่องทางการติดต่อ</h1>
        <div className="grid grid-cols-2 gap-[14px] max-md:grid-cols-1">
          {rows.map((r) => (
            <section key={r.t} className="flex flex-col gap-[4px] rounded-[16px] border border-gray-line-2 bg-white p-[18px]">
              <h2 className="text-[15px] font-semibold">{r.t}</h2>
              <p className="text-[12px] font-light text-gray-20">{r.d}</p>
              <p className="mt-[6px] font-urbanist text-[15px] font-semibold text-blue-00">{r.v}</p>
              <p className="text-[11px] font-light text-gray-30">{r.s}</p>
            </section>
          ))}
        </div>
        <section className="rounded-[16px] border border-gray-line-2 bg-white p-[18px]">
          <h2 className="mb-[6px] text-[15px] font-semibold">ที่ตั้งสำนักงาน</h2>
          <p className="text-[13px] leading-[1.8] font-light text-gray-30">สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน) เลขที่ 912 ถนนนวมินทร์ แขวงนวมินทร์ เขตบึงกุ่ม กรุงเทพฯ 10240</p>
        </section>
      </div>
    </AppShell>
  )
}
