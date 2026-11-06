import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nextContractNo, stamp, type Contract } from '../../data/erpAgreement'
import { contracts, gWho, useContracts, useGPersona } from '../../lib/agreementStore'
import { useToast } from '../leader/Parts'
import Modal from '../ui/Modal'
import { ContractDetail, DeleteModal } from './Table'

/** view / edit / copy / delete behaviour shared by the three contract lists */
export function useContractActions() {
  const all = useContracts()
  const me = useGPersona()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [open, setOpen] = useState<Contract>()
  const [del, setDel] = useState<Contract>()

  const can = (c: Contract) => ({
    edit: me === 'staff' ? c.status === 'ร่าง' || c.status === 'ต้องแก้ไข' || c.fromRegistry : me === 'legal' && c.status === 'รอตรวจสอบ',
    del: me === 'staff' && (c.status === 'ร่าง' || c.status === 'ต้องแก้ไข' || c.status === 'รอตรวจสอบ'),
  })
  const onEdit = (c: Contract) => navigate(me === 'legal' ? `/agreement/review/detail?id=${c.id}` : c.fromRegistry ? `/agreement/registry/new?id=${c.id}` : `/agreement/new/parties?id=${c.id}`)
  const onCopy = (c: Contract) => {
    const at = stamp()
    const id = contracts.next()
    const no = nextContractNo(all)
    contracts.save({ ...c, id, no, title: `${c.title} (สำเนา)`, status: 'ร่าง', signDate: '', file: '', notes: [], fromRegistry: false, createdAt: at, updatedAt: at, resp: gWho(), history: [{ at, by: gWho(), action: `คัดลอกจากสัญญา ${c.no}` }] })
    show(`คัดลอกเป็นร่างสัญญาใหม่แล้ว (${no})`)
  }
  const modals = (
    <>
      <Modal open={!!open} onClose={() => setOpen(undefined)} title={open ? `สัญญา ${open.no}` : ''} width="max-w-[720px]">
        {open && <div className="max-h-[70vh] overflow-y-auto pr-[4px]"><ContractDetail c={all.find((x) => x.id === open.id) ?? open} /></div>}
      </Modal>
      <DeleteModal c={del} onClose={() => setDel(undefined)} onConfirm={() => { if (del) contracts.remove(del.id); setDel(undefined); show('ลบรายการสัญญาแล้ว') }} />
      {toast}
    </>
  )
  return { all, me, can, onView: setOpen, onEdit, onCopy, onDelete: setDel, modals, show, navigate }
}
