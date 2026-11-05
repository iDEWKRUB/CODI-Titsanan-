import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import iconPlus from '../assets/survey/icon-plus.svg'
import { BackTitle, lbl, primaryBtn } from '../components/leader/Parts'
import { pmPage } from '../components/pm/Parts'
import Select from '../components/ui/Select'
import { blankProject, budgetYears, projectTypes } from '../data/projects'
import { nextProjectId, saveProject } from '../lib/projectStore'

/** Figma OSS-Project Management › ยื่นเสนอโครงการ (323:14742): choose year + type, then create the form */
export default function ProjectProposePage() {
  const navigate = useNavigate()
  const [year, setYear] = useState('')
  const [type, setType] = useState('')
  const [tried, setTried] = useState(false)

  const create = () => {
    setTried(true)
    if (!year || !type) return
    const id = nextProjectId()
    saveProject(blankProject(id, year, type))
    navigate(`/projects/${id}/form`)
  }

  return (
    <div className={pmPage}>
      <BackTitle title="ยื่นเสนอโครงการ" to="/projects" />
      <section className="rounded-[12px] bg-blue-bg p-[8px]">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] items-end gap-[16px] rounded-[12px] bg-white p-[20px] max-lg:grid-cols-1 max-sm:p-[12px]">
          <div className="flex flex-col gap-[8px]">
            <span className={`${lbl} text-[16px]`}>ปีงบประมาณ</span>
            <Select label="ปีงบประมาณ" tone="subtle" value={year} placeholder="เลือกปีงบประมาณ" options={budgetYears.map((y) => ({ value: y, label: y }))} onChange={setYear} />
            {tried && !year && <span role="alert" className="text-[12px] text-red-00">กรุณาเลือกปีงบประมาณ</span>}
          </div>
          <div className="flex flex-col gap-[8px]">
            <span className={`${lbl} text-[16px]`}>ประเภทโครงการ</span>
            <Select label="ประเภทโครงการ" tone="subtle" value={type} placeholder="เลือกประเภทโครงการ" options={projectTypes.map((t) => ({ value: t, label: t }))} onChange={setType} />
            {tried && !type && <span role="alert" className="text-[12px] text-red-00">กรุณาเลือกประเภทโครงการ</span>}
          </div>
          <button type="button" onClick={create} className={`${primaryBtn} h-[46px] min-w-[200px]`}>
            <img src={iconPlus} alt="" width={14} height={14} className="brightness-0 invert" />
            สร้างแบบฟอร์ม
          </button>
        </div>
      </section>
      <p className="text-[12px] font-light text-gray-20">เลือกปีงบประมาณและประเภทโครงการ แล้วกด “สร้างแบบฟอร์ม” ระบบจะสร้างรหัสโครงการและพาไปกรอกข้อมูลองค์กรผู้เสนอและพื้นที่สำรวจ</p>
    </div>
  )
}
