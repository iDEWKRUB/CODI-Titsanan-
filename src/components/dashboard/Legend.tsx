export default function Legend({ items }: { items: readonly { label: string; dot: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center justify-end gap-[12px]">
      {items.map((s) => (
        <li key={s.label} className="flex items-center gap-[12px] rounded-[4px] bg-white px-[8px] py-[4px]">
          <img src={s.dot} alt="" width={12} height={12} />
          <span className="text-[10px] leading-[normal] font-medium whitespace-nowrap text-gray-20">{s.label}</span>
        </li>
      ))}
    </ul>
  )
}
