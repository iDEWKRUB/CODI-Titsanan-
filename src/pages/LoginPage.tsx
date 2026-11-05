import dividerLine from '../assets/login/divider.svg'
import facebookIcon from '../assets/login/icon-facebook.svg'
import globeIcon from '../assets/login/icon-globe.svg'
import codiLogo from '../assets/login/logo-codi.webp'
import HeroPanel from '../components/login/HeroPanel'
import { useNavigate } from 'react-router-dom'
import LoginForm from '../components/login/LoginForm'
import { login } from '../lib/auth'

const footerLink =
  'rounded-[2px] transition-colors hover:text-gray-20 focus-visible:outline-2 focus-visible:outline-blue-00'

export default function LoginPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-svh bg-white lg:h-svh lg:min-h-[760px]">
      <HeroPanel />

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center px-[16px] py-[32px] sm:px-[24px]">
          <section className="w-full max-w-[564px] rounded-[24px] bg-white/50 px-[16px] pt-[24px] pb-[48px] sm:px-[48px]">
            <div className="flex flex-col gap-[24px]">
              {/* Logo */}
              <div className="flex w-full items-center justify-center gap-[10px] rounded-[12px] py-[12px]">
                <img
                  src={codiLogo}
                  alt="สถาบันพัฒนาองค์กรชุมชน (CODI)"
                  width={84}
                  height={84}
                  className="size-[56px] shrink-0 object-cover sm:size-[84px]"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-[8px] pt-[8px] max-sm:gap-[4px]">
                  <p className="text-[17px] leading-[normal] font-semibold whitespace-nowrap text-heading sm:text-[24px]">
                    CODI Portal
                  </p>
                  <h1 className="text-[20px] leading-[1.1] font-medium whitespace-nowrap text-black sm:text-[28px]">
                    สถาบันพัฒนาองค์กรชุมชน
                  </h1>
                </div>
              </div>

              <img src={dividerLine} alt="" width={468} height={1} className="block h-px w-full" />

              <LoginForm
                onSubmit={({ email, password, remember }) => {
                  if (!login(email, password, remember)) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
                  navigate('/dashboard', { replace: true })
                }}
                onDigitalId={() => console.info('digital-id')}
              />
            </div>
          </section>
        </div>

        <footer className="flex flex-col-reverse items-center gap-[12px] px-[24px] pt-[11px] pb-[36px] text-[12px] leading-[1.3] text-gray-10 sm:flex-row sm:gap-[10px] sm:pr-[27px] sm:pl-[29px]">
          <p className="flex-1 font-semibold max-sm:text-center">© 2568 สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน)</p>
          <div className="flex h-[24px] items-center gap-[12px]">
            <nav className="flex gap-[16px] font-light whitespace-nowrap">
              <a href="#privacy" className={footerLink}>
                Privacy Policy
              </a>
              <a href="#terms" className={footerLink}>
                Term and conditions
              </a>
            </nav>
            <button
              type="button"
              aria-label="เปลี่ยนภาษา"
              className="rounded-full transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-blue-00"
            >
              <img src={globeIcon} alt="" width={24} height={24} />
            </button>
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="rounded-full transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-blue-00"
            >
              <img src={facebookIcon} alt="" width={24} height={24} />
            </a>
          </div>
        </footer>
      </main>
    </div>
  )
}
