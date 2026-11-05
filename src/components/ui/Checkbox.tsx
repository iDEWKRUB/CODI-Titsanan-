import checked from '../../assets/ui/checkbox-checked.svg'
import unchecked from '../../assets/ui/checkbox-default.svg'
import disabledIcon from '../../assets/ui/checkbox-disabled.svg'
import filled from '../../assets/ui/checkbox-filled.svg'
import lgChecked from '../../assets/ui/checkbox-lg-checked.svg'
import lgDefault from '../../assets/ui/checkbox-lg-default.svg'
import mdChecked from '../../assets/ui/checkbox-md-checked.svg'
import mdDefault from '../../assets/ui/checkbox-md-default.svg'

type Size = 'default' | 'medium' | 'big'

type Props = {
  checked: boolean
  /** "Filled" state in Figma (partial selection) — Default size only */
  indeterminate?: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
  label: string
  name?: string
  size?: Size
}

// Figma Resource/Component › Forms › Checkbox (86:1360): Default 12px, Medium 16px, Big 22px
const art: Record<Size, { box: string; off: [string, string]; on: [string, string] }> = {
  default: { box: 'size-[12px]', off: [unchecked, 'inset-[-8.33%]'], on: [checked, 'inset-[-8.33%]'] },
  medium: { box: 'size-[16px]', off: [mdDefault, 'inset-[-6.25%]'], on: [mdChecked, 'inset-[-6.25%]'] },
  big: { box: 'size-[22px]', off: [lgDefault, 'inset-[-6.82%]'], on: [lgChecked, 'inset-[-4.55%]'] },
}

export default function Checkbox({ checked: isChecked, indeterminate, disabled, onChange, label, name, size = 'default' }: Props) {
  const a = art[size]
  const [src, inset] =
    disabled && size === 'default'
      ? [disabledIcon, 'inset-[-12.5%]']
      : isChecked
        ? a.on
        : indeterminate && size === 'default'
          ? [filled, 'inset-[-8.33%]']
          : a.off
  return (
    <label className={`relative flex shrink-0 ${a.box} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        name={name}
        checked={isChecked}
        disabled={disabled}
        ref={(el) => {
          if (el) el.indeterminate = !!indeterminate && !isChecked
        }}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="peer absolute inset-0 cursor-[inherit] opacity-0"
      />
      <span className={`absolute ${inset}`}>
        <img src={src} alt="" className="block size-full max-w-none" />
      </span>
      <span className="pointer-events-none absolute -inset-[3px] rounded-[5px] peer-focus-visible:outline-2 peer-focus-visible:outline-blue-00" />
    </label>
  )
}
