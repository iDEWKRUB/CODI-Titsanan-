import { useState, type FormEvent } from 'react'
import Checkbox from '../ui/Checkbox'
import eyeIcon from '../../assets/login/icon-eye.svg'
import eyeSlashIcon from '../../assets/login/icon-eye-slash.svg'
import questionIcon from '../../assets/login/icon-question.svg'
import thaidLogo from '../../assets/login/thaid.webp'

export type LoginValues = {
  email: string
  password: string
  remember: boolean
}

type Props = {
  /** Return an error message to show under the fields, or nothing on success. */
  onSubmit?: (values: LoginValues) => string | void
  onDigitalId?: () => void
}

type Errors = Partial<Record<'email' | 'password', string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate({ email, password }: LoginValues): Errors {
  const errors: Errors = {}
  if (!email.trim()) errors.email = 'กรุณากรอกอีเมล'
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
  if (!password) errors.password = 'กรุณากรอกรหัสผ่าน'
  return errors
}

const fieldClass =
  'flex w-full items-center gap-[10px] border-b border-blue-20 transition-colors focus-within:border-blue-00'
const inputClass =
  'h-[38px] min-w-0 flex-1 bg-transparent text-[14px] leading-[1.25] font-light text-gray-30 outline-none placeholder:text-gray-20'
const linkClass =
  'rounded-[2px] text-[12px] font-semibold text-blue-10 transition-colors hover:text-blue-00 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-00'

export default function LoginForm({ onSubmit, onDigitalId }: Props) {
  const [values, setValues] = useState<LoginValues>({ email: '', password: '', remember: false })
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string>()

  const update = <K extends keyof LoginValues>(key: K, value: LoginValues[K]) => {
    const next = { ...values, [key]: value }
    setValues(next)
    setFormError(undefined)
    if (submitted) setErrors(validate(next))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) setFormError(onSubmit?.(values) || undefined)
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-[12px] p-[24px] max-sm:px-0">
      <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-[12px] px-[12px]">
        <h2 className="text-center text-[14px] leading-[normal] font-medium text-heading">เข้าสู่ระบบ</h2>

        <div className="flex w-full flex-col gap-[24px]">
          <div className="flex w-full flex-col items-center gap-[24px]">
            {/* Email */}
            <div className="w-full">
              <label className={`${fieldClass} ${errors.email ? 'border-red-400' : ''}`}>
                <span className="sr-only">Email</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="Email"
                  value={values.email}
                  onChange={(e) => update('email', e.target.value)}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={inputClass}
                />
              </label>
              {errors.email && (
                <p id="email-error" className="mt-[6px] text-[11px] text-red-500">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="w-full">
              <label className={`${fieldClass} ${errors.password ? 'border-red-400' : ''}`}>
                <span className="sr-only">Password</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  value={values.password}
                  onChange={(e) => update('password', e.target.value)}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  aria-pressed={showPassword}
                  className="flex shrink-0 rounded-[5px] p-[4px] transition-colors hover:bg-gray-subtle focus-visible:outline-2 focus-visible:outline-blue-00"
                >
                  <img src={showPassword ? eyeSlashIcon : eyeIcon} alt="" width={20} height={20} />
                </button>
              </label>
              {errors.password && (
                <p id="password-error" className="mt-[6px] text-[11px] text-red-500">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember + terms */}
            <div className="flex w-full items-center gap-[12px]">
              <Checkbox
                name="remember"
                label="จดจำบัญชี"
                checked={values.remember}
                onChange={(on) => update('remember', on)}
              />
              <div className="flex items-center gap-[4px] text-[11px] leading-[normal] whitespace-nowrap">
                <span className="cursor-default">จดจำบัญชี</span>
                <a href="#terms" className="text-blue-10 underline transition-colors hover:text-blue-00">
                  เงื่อนไขการใช้งาน
                </a>
                <img src={questionIcon} alt="" width={12} height={12} />
              </div>
            </div>

            {formError && (
              <p role="alert" className="-my-[12px] w-full rounded-[8px] bg-red-50 px-[12px] py-[8px] text-center text-[12px] text-red-600">
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="flex h-[45px] w-full items-center justify-center rounded-[8px] bg-blue-00 px-[14px] py-[10px] text-[14px] font-medium text-[#fbfbfc] drop-shadow-[0px_10px_10px_rgba(0,0,0,0.3)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-00 active:translate-y-px active:brightness-95"
            >
              Login
            </button>
          </div>

          <div className="flex w-full items-center gap-[12px] leading-[normal] whitespace-nowrap">
            <div className="flex flex-1 items-center gap-[4px]">
              <span className="text-[11px] font-light">ไม่มีบัญชี?</span>
              <a href="#register" className={linkClass}>
                สร้างบัญชีใหม่
              </a>
            </div>
            <a href="#forgot-password" className={linkClass}>
              ลืมรหัสผ่าน
            </a>
          </div>
        </div>

        <p className="text-center text-[14px] leading-[normal] font-medium text-heading">หรือ</p>
      </form>

      <button
        type="button"
        onClick={onDigitalId}
        className="flex h-[56px] w-full items-center justify-center gap-[24px] rounded-[12px] bg-navy py-[4px] text-[14px] font-semibold text-white drop-shadow-[0px_10px_10px_rgba(0,0,0,0.3)] transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-00 active:translate-y-px"
      >
        เข้าสู่ระบบด้วย Digital ID
        <img src={thaidLogo} alt="ThaID" width={48} height={48} className="size-[48px] rounded-[12px] object-cover" />
      </button>
    </div>
  )
}
