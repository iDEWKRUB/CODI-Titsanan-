import iconCaretDown from '../../assets/survey/icon-caret-down.svg'

/** Small filter chip: shows the current value, a hidden native <select> changes it (same pattern as the survey filter) */
export default function Chip({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  const cur = options.find((o) => o.value === value)
  return (
    <label className="relative flex shrink-0 items-center gap-[4px] rounded-[8px] border border-gray-line bg-white py-[8px] pr-[8px] pl-[12px] transition-colors focus-within:border-blue-00 hover:border-blue-10">
      <span className="py-[2px] text-[12px] leading-[normal] font-medium whitespace-nowrap text-blue-00">{cur?.label ?? label}</span>
      <img src={iconCaretDown} alt="" width={14} height={14} className="m-px" />
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

