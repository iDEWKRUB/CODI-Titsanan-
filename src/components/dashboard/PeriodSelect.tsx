import iconCaret from '../../assets/dashboard/icon-caret-down-blue.svg'

const options = ['1 เดือนล่าสุด', '3 เดือนล่าสุด', '6 เดือนล่าสุด', '12 เดือนล่าสุด']

/** "6 เดือนล่าสุด" pill dropdown (Figma Button 172:8782), backed by a native select. */
export default function PeriodSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="relative flex shrink-0 items-center gap-[2px] rounded-[7px] border border-gray-line bg-white px-[8px] py-[6px] transition-colors focus-within:border-blue-00 hover:border-blue-10">
      <span className="flex h-[16px] items-center px-[2px] pt-[2px] pb-[3px] text-[10px] leading-[normal] font-light whitespace-nowrap text-blue-00">{value}</span>
      <img src={iconCaret} alt="" width={12} height={12} className="my-[2px]" />
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}
