import QRCode from 'qrcode'
import { useState } from 'react'
import iconCaretUp from '../../assets/builder/icon-caret-up-sm.svg'
import iconCopy from '../../assets/builder/icon-copy-blue.svg'
import iconPlusSquare from '../../assets/builder/icon-plus-square-blue.svg'
import iconQr from '../../assets/builder/icon-qr.svg'
import iconUpload from '../../assets/builder/icon-upload.svg'
import iconXChip from '../../assets/builder/icon-x-chip.svg'
import { scheduleInvalid, targetGroups, type Settings } from '../../data/surveyBuilder'
import Checkbox from '../ui/Checkbox'
import { DateInput, TimeInput } from '../ui/DateTimeInputs'
import Modal from '../ui/Modal'
import Select from '../ui/Select'
import Toggle from '../ui/Toggle'

type Props = { value: Settings; onChange: (s: Settings) => void; onToast: (msg: string) => void }

function Group({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <div className={`flex flex-col gap-[12px] ${last ? '' : 'border-b border-gray-line'}`}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex items-center gap-[10px] text-left">
        <h3 className="flex-1 text-[18px] leading-[normal] text-black opacity-90">{title}</h3>
        <img src={iconCaretUp} alt="" width={18} height={18} className={`transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>
      {open && <div className="py-[24px]">{children}</div>}
    </div>
  )
}

const channelLabels: [keyof Settings['channels'], string][] = [
  ['email', 'Email'],
  ['sms', 'SMS'],
  ['line', 'LINE'],
  ['notification', 'Notification Center'],
]

export default function SettingsTab({ value, onChange, onToast }: Props) {
  const [listOpen, setListOpen] = useState(false)
  const [qr, setQr] = useState<string>()
  const set = (patch: Partial<Settings>) => onChange({ ...value, ...patch })
  const url = `${window.location.origin}/s/${value.slug}`
  const allChannels = channelLabels.every(([k]) => value.channels[k])
  const someChannels = channelLabels.some(([k]) => value.channels[k])

  return (
    <div className="flex flex-col gap-[12px]">
      <section className="rounded-[12px] bg-gray-bg p-[12px]">
        <div className="flex flex-col gap-[24px] rounded-[12px] bg-white px-[24px] pt-[36px] pb-[24px] max-sm:px-[16px]">
          <Group title="การเผยแพร่">
            <div className="flex flex-col gap-[24px]">
              {(
                [
                  ['acceptResponses', 'เปิดรับคำตอบ'],
                  ['scheduled', 'ตั้งเวลาเผยแพร่'],
                ] as const
              ).map(([k, l]) => (
                <div key={k} className="flex items-center gap-[10px]">
                  <span className="flex w-[48px] justify-center">
                    <Toggle checked={value[k]} onChange={(v) => set({ [k]: v })} label={l} />
                  </span>
                  <span className="text-[14px] font-medium text-black opacity-90">{l}</span>
                </div>
              ))}
              {value.scheduled && (
                <div className="flex flex-col gap-[24px] px-[58px] max-sm:px-0">
                  {(
                    [
                      ['เริ่มการเผยแพร่', 'startDate', 'startTime'],
                      ['สิ้นสุดการเผยแพร่', 'endDate', 'endTime'],
                    ] as const
                  ).map(([l, d, t]) => (
                    <div key={d} className="flex flex-col gap-[10px]">
                      <span className="text-[14px] font-medium text-black opacity-90">{l}</span>
                      <div className="flex gap-[12px] max-sm:flex-col">
                        <div className="w-[267px] max-sm:w-full">
                          <DateInput value={value[d]} onChange={(v) => set({ [d]: v })} label={`วันที่${l}`} />
                        </div>
                        <div className="w-[267px] max-sm:w-full">
                          <TimeInput value={value[t]} onChange={(v) => set({ [t]: v })} label={`เวลา${l}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {scheduleInvalid(value) && (
                    <p role="alert" className="text-[12px] text-red-00">
                      วันเวลาสิ้นสุดต้องหลังวันเวลาเริ่มการเผยแพร่
                    </p>
                  )}
                </div>
              )}
            </div>
          </Group>

          <Group title="กำหนดกลุ่มเป้าหมาย">
            <div className="flex flex-col gap-[12px] px-[24px] max-sm:px-0">
              <Select className="w-[267px] max-sm:w-full" label="กลุ่มเป้าหมาย" value={value.target} options={targetGroups.map((g) => ({ value: g, label: g }))} onChange={(target) => set({ target })} />
              <button type="button" onClick={() => setListOpen(true)} className="flex w-fit items-center gap-[2px] rounded-[8px] px-[2px] py-[8px] hover:opacity-80">
                <img src={iconPlusSquare} alt="" width={14} height={14} className="my-px" />
                <span className="py-[2px] text-[12px] font-medium text-blue-00">กำหนดรายชื่อเอง</span>
              </button>
              {value.customTargets.map((name) => (
                <div key={name} className="flex w-[267px] items-center justify-between rounded-[4px] bg-blue-bg px-[14px] py-[12px] max-sm:w-full">
                  <span className="truncate text-[12px] font-light text-black underline">{name}</span>
                  <button type="button" aria-label={`เอา ${name} ออก`} onClick={() => set({ customTargets: value.customTargets.filter((x) => x !== name) })}>
                    <img src={iconXChip} alt="" width={14} height={14} className="brightness-0 opacity-60" />
                  </button>
                </div>
              ))}
            </div>
          </Group>

          <Group title="การแจ้งเตือน" last>
            <div className="flex flex-col gap-[24px] px-[24px] max-sm:px-0">
              <p className="text-[14px] font-medium text-black opacity-90">เลือกช่องทางการแจ้งเตือน</p>
              <div className="flex flex-col gap-[24px] px-[24px]">
                <label className="flex items-center gap-[10px] text-[14px] font-medium text-black opacity-90">
                  <Checkbox
                    size="medium"
                    label="ทั้งหมด"
                    checked={allChannels}
                    indeterminate={someChannels && !allChannels}
                    onChange={(on) => set({ channels: { email: on, sms: on, line: on, notification: on } })}
                  />
                  ทั้งหมด
                </label>
                {channelLabels.map(([k, l]) => (
                  <label key={k} className="flex items-center gap-[10px] text-[14px] font-medium text-black opacity-90">
                    <Checkbox size="medium" label={l} checked={value.channels[k]} onChange={(on) => set({ channels: { ...value.channels, [k]: on } })} />
                    {l}
                  </label>
                ))}
              </div>
            </div>
          </Group>
        </div>
      </section>

      <section className="rounded-[12px] bg-blue-bg p-[12px]">
        <div className="flex flex-col gap-[24px] rounded-[12px] bg-white p-[24px] max-sm:p-[16px]">
          <div className="flex items-center gap-[12px] max-sm:flex-col max-sm:items-stretch">
            <span className="w-[96px] text-[14px] font-medium text-black">การเข้าถึง</span>
            <Select
              className="w-[265px] max-sm:w-full"
              label="การเข้าถึง"
              value={value.access}
              options={[
                { value: 'public', label: 'สาธารณะ' },
                { value: 'restricted', label: 'เฉพาะกลุ่มเป้าหมาย' },
              ]}
              onChange={(access) => set({ access })}
            />
          </div>
          <div className="flex items-center gap-[12px] max-sm:flex-col max-sm:items-stretch">
            <span className="w-[96px] text-[14px] font-medium text-black">URL</span>
            <div className="flex items-center gap-[12px]">
              <input readOnly value={url} aria-label="URL แบบสอบถาม" onFocus={(e) => e.target.select()} className="h-[45px] w-[267px] rounded-[8px] border border-gray-line px-[16px] text-[14px] font-light text-black outline-none focus:border-blue-00 max-sm:w-full max-sm:flex-1" />
              <button
                type="button"
                aria-label="คัดลอก URL"
                title="คัดลอก URL"
                onClick={() => navigator.clipboard?.writeText(url).then(() => onToast('คัดลอก URL แล้ว'), () => onToast('คัดลอกไม่สำเร็จ'))}
                className="flex rounded-[5px] p-[4px] hover:bg-blue-bg"
              >
                <img src={iconCopy} alt="" width={20} height={20} />
              </button>
            </div>
          </div>
          <div className="flex items-start gap-[12px] max-sm:flex-col">
            <span className="flex h-[45px] w-[96px] items-center text-[14px] font-medium text-black">QR Code</span>
            <div className="flex flex-col gap-[12px]">
              <button
                type="button"
                onClick={() => QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: '#24252e' } }).then(setQr)}
                className="flex h-[45px] w-fit items-center gap-[4px] rounded-[8px] border border-gray-line bg-white px-[12px] transition-colors hover:border-blue-10"
              >
                <img src={iconQr} alt="" width={16} height={16} className="my-px" />
                <span className="p-[2px] text-[14px] font-medium text-blue-00">{qr ? 'สร้าง QR Code ใหม่' : 'สร้าง QR Code'}</span>
              </button>
              {qr && (
                <div className="flex items-end gap-[12px]">
                  <img src={qr} alt={`QR Code ของ ${url}`} className="size-[160px] rounded-[8px] border border-gray-line" />
                  <a href={qr} download={`${value.slug}-qr.png`} className="text-[12px] font-medium text-blue-00 underline">
                    ดาวน์โหลด
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Modal open={listOpen} title="กำหนดรายชื่อเอง" onClose={() => setListOpen(false)}>
        <div className="flex flex-col items-center gap-[24px] text-center">
          <label className="flex cursor-pointer items-center gap-[4px] rounded-[8px] bg-blue-00 px-[12px] py-[10px] transition hover:brightness-110">
            <img src={iconUpload} alt="" width={16} height={16} className="brightness-0 invert" />
            <span className="p-[2px] text-[14px] font-medium text-white-soft">เพิ่มรายชื่อ</span>
            <input
              type="file"
              accept=".xls,.xlsx,.csv"
              className="hidden"
              onChange={(e) => {
                const name = e.target.files?.[0]?.name
                if (name && !value.customTargets.includes(name)) set({ customTargets: [...value.customTargets, name] })
                setListOpen(false)
              }}
            />
          </label>
          <p className="text-[12px] font-light text-gray-30">ไฟล์ที่นำเข้าจะต้องเป็นนามสกุล XLS หรือ CSV ขนาดไฟล์ไม่เกิน 10 MB.</p>
        </div>
      </Modal>
    </div>
  )
}
