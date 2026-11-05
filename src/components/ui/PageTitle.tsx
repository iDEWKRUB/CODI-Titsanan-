/** Figma Resource/Component › Forms › Header (114:7938), type Default / Desktop. */
export default function PageTitle({ icon, children }: { icon: string; children: string }) {
  return (
    <div className="flex h-[24px] items-center gap-[10px]">
      <img src={icon} alt="" width={24} height={24} className="size-[24px] shrink-0" />
      <h1 className="truncate text-[20px] leading-[1.2] font-semibold text-blue-00">{children}</h1>
    </div>
  )
}
