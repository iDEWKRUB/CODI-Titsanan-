import off from '../../assets/builder/toggle-off.svg'
import on from '../../assets/builder/toggle-on.svg'

/** Figma Resource/Component › Forms › Toggle Button (86:1379), 28×16. */
export default function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-[16px] w-[28px] shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-00"
    >
      <img src={checked ? on : off} alt="" className="absolute inset-0 block size-full max-w-none" />
    </button>
  )
}
