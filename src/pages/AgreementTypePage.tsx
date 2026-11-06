import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Btn, ContractViewer, Crumbs, GI, GPersonaSwitch, Gate, Ic, Steps, Title, ctl, page } from '../components/agreement/Parts'
import { types, type TypeKey } from '../data/erpAgreement'
import { useGPersona } from '../lib/agreementStore'

/** สร้างสัญญาฉบับใหม่ — step 1: เลือกประเภทสัญญา + ตัวอย่างสัญญา (book 3 §2.3.1.2, fig 2-118) */
export default function AgreementTypePage() {
  const navigate = useNavigate()
  const me = useGPersona()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<TypeKey>('hire')
  const list = types.filter((t) => !q.trim() || `${t.label} ${t.desc} ${t.tag}`.toLowerCase().includes(q.trim().toLowerCase()))
  const cur = types.find((t) => t.key === sel)!

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1100px] flex-col gap-[12px]">
        <Title back="/agreement" right={<GPersonaSwitch />}>สร้างสัญญาฉบับใหม่</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/agreement' }, { label: 'งานบริหารจัดการสัญญา', to: '/agreement' }, { label: 'สร้างสัญญาฉบับใหม่' }]} />
        <Gate allowed={me === 'staff'} need="เจ้าหน้าที่ผู้รับผิดชอบ" />
        <Steps step={1} />

        <div className="grid grid-cols-[minmax(0,420px)_minmax(0,1fr)] items-start gap-[16px] max-lg:grid-cols-1">
          <section aria-label="เลือกประเภทสัญญา" className="flex flex-col gap-[12px] rounded-[14px] border border-gray-line-2 bg-white p-[16px]">
            <label className="flex h-[42px] items-center gap-[8px] rounded-[10px] border border-gray-line px-[12px] text-gray-20 focus-within:border-blue-00"><Ic d={GI.search} /><input aria-label="ค้นหาประเภทสัญญา" placeholder="ค้นหาประเภทสัญญา เช่น สัญญาจ้าง MOU" value={q} onChange={(e) => setQ(e.target.value)} className={`${ctl} !h-auto !border-0 !p-0 outline-none`} /></label>
            <div role="radiogroup" aria-label="ประเภทสัญญา" className="flex flex-col gap-[8px]">
              {list.map((t) => (
                <button key={t.key} type="button" role="radio" aria-checked={sel === t.key} onClick={() => setSel(t.key)} className={`flex items-start gap-[12px] rounded-[12px] border p-[12px] text-left transition ${sel === t.key ? 'border-blue-00 bg-blue-bg/60 shadow-[0_0_0_1px_var(--color-blue-00)]' : 'border-gray-line-2 hover:border-blue-20'}`}>
                  <span className={`mt-[2px] flex size-[38px] shrink-0 items-center justify-center rounded-[10px] ${sel === t.key ? 'bg-blue-00 text-white' : 'bg-blue-bg text-blue-00'}`}><Ic d={GI.doc} s={18} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold">{t.label}</span><span className="block text-[11px] leading-[1.5] font-light text-gray-30">{t.desc}</span></span>
                  {sel === t.key && <span className="mt-[2px] text-blue-00"><Ic d={GI.check} s={18} w={2.4} /></span>}
                </button>
              ))}
              {!list.length && <p className="py-[20px] text-center text-[13px] font-light text-gray-20">ไม่พบประเภทสัญญาที่ค้นหา</p>}
            </div>
          </section>
          <section aria-label="ตัวอย่างสัญญา" className="rounded-[14px] border border-gray-line-2 bg-[#f5f8fd] p-[16px]">
            <ContractViewer key={sel} type={sel} label={`ตัวอย่าง · ${cur.label}`} />
          </section>
        </div>

        <div className="flex justify-end gap-[8px]">
          <Btn kind="ghost" onClick={() => navigate('/agreement')}>ยกเลิก</Btn>
          <Btn onClick={() => navigate(`/agreement/new/parties?type=${sel}`)} disabled={me !== 'staff'}>ถัดไป</Btn>
        </div>
      </div>
    </div>
  )
}
