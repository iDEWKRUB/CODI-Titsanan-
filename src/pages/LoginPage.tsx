import { useNavigate } from 'react-router-dom'
import facebookIcon from '../assets/login/icon-facebook.svg'
import globeIcon from '../assets/login/icon-globe.svg'
import codiLogo from '../assets/login/logo-codi.webp'
import { useState } from 'react'
import LoginForm from '../components/login/LoginForm'
import ThaiDConnect from '../components/login/ThaiDConnect'
import { login, loginWithThaiD } from '../lib/auth'

const footerLink = 'rounded-[2px] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-white'
// the paper tone shared by the back folder panel and its tab
const paper = 'bg-[#e6f0fc]'

/**
 * OSS login — Figma "Login" folder variant (177:26287), the screen shown in TOR book 3 §2.2.1.1 (figure 2-73):
 * a sign-in card sitting in a folder, white upper half / blue lower half.
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const [thaid, setThaid] = useState(false)
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-white lg:min-h-[calc(100svh/0.75)] lg:[zoom:0.75]">
      <header className="absolute top-[20px] left-[16px] z-10 flex items-center gap-[10px] md:top-[53px] md:left-[62px] md:gap-[10px]">
        <img src={codiLogo} alt="สถาบันพัฒนาองค์กรชุมชน (CODI)" width={84} height={84} className="size-[52px] shrink-0 object-cover md:size-[84px]" />
        <div className="flex min-w-0 flex-col md:gap-[4px] md:pt-[3px]">
          <p className="text-[18px] leading-[1.25] font-semibold whitespace-nowrap text-[#333e47] md:text-[28px] md:leading-[36px]">CODI Portal</p>
          <h1 className="text-[13px] leading-[1.3] font-semibold whitespace-nowrap text-[#333e47] md:text-[20px] md:leading-[27px]">สถาบันพัฒนาองค์กรชุมชน</h1>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center px-[16px]">
        <div className="flex w-full flex-1 items-center justify-center pt-[120px] md:pt-[148px]">
        <section aria-label="เข้าสู่ระบบ" className="relative w-[min(817px,100%)]">
          {/* blue lower half of the page: starts a little below the card's vertical middle and runs to the bottom edge */}
          <div aria-hidden="true" className="absolute inset-x-[-400%] top-[230px] bottom-[-3000px] -z-10 bg-[linear-gradient(180deg,#003a86_0,#0049ad_900px)] md:top-[253px]" />
          {/* folder, back panel with tab: simple CSS shape on phones, the Figma outline (S-curve shoulder) from md up */}
          <div aria-hidden="true" style={{ filter: 'drop-shadow(-12px 14px 20px rgba(0,40,110,0.34)) drop-shadow(0 0 1.5px rgba(0,60,140,0.45))' }} className="absolute top-[-70px] left-[1.5%] h-[120px] w-[96.8%] md:hidden">
            <div className={`absolute top-0 left-0 h-full w-[53%] rounded-t-[28px] ${paper} shadow-[inset_0_2px_0_rgba(255,255,255,0.9)]`} />
            <div className={`absolute inset-x-0 top-[30px] bottom-0 rounded-t-[28px] ${paper} shadow-[inset_0_2px_0_rgba(255,255,255,0.9)]`} />
            <div className="absolute top-[2px] left-[53%] size-[28px] bg-[radial-gradient(circle_at_100%_0,transparent_27px,#e6f0fc_28px)]" />
          </div>
          <svg
            aria-hidden="true"
            viewBox="0 0 791 200"
            preserveAspectRatio="none"
            style={{ filter: 'drop-shadow(-12px 14px 20px rgba(0,40,110,0.34)) drop-shadow(0 0 1.5px rgba(0,60,140,0.45))' }}
            className="absolute top-[-148px] left-[1.5%] hidden h-[200px] w-[96.8%] md:block"
          >
            <defs>
              <linearGradient id="folder-back" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#eef5ff" />
                <stop offset="1" stopColor="#cfe0f7" />
              </linearGradient>
            </defs>
            <path d="M0 40Q0 0 40 0H292C352 0 346 62 410 62H751Q791 62 791 102V200H0Z" fill="url(#folder-back)" />
            <path d="M40 1H292C352 1 346 63 410 63H751" fill="none" stroke="#fff" strokeOpacity="0.9" strokeWidth="2" />
          </svg>
          {/* folder, glowing blue sheet */}
          <div
            aria-hidden="true"
            className="absolute top-[-30px] left-[10.4%] h-[120px] w-[78.9%] rounded-t-[28px] bg-[linear-gradient(135deg,#014ead_0%,#3dc2fb_100%)] shadow-[0_-8px_30px_rgba(60,190,255,0.55),-10px_8px_22px_rgba(0,50,140,0.28),inset_-4px_4px_10px_rgba(255,255,255,0.45)] md:top-[-54px] md:rounded-t-[40px]"
          />

          {/* front card */}
          <div className="relative rounded-[28px] bg-[linear-gradient(180deg,#fafcff_40%,#e2ecf9_100%)] px-[16px] pt-[32px] pb-[40px] shadow-[-24px_34px_54px_rgba(0,28,80,0.3),-10px_-6px_33px_rgba(138,177,255,0.4),inset_2px_-6px_4px_rgba(0,0,0,0.08),inset_-4px_4px_4px_rgba(255,255,255,0.95)] md:min-h-[551px] md:rounded-[40px] md:px-[177px] md:pt-[53px] md:pb-[82px]">
            <div className="mx-auto w-full max-w-[463px]">
              <LoginForm
                headingClass="text-[28px] leading-[1.25] font-semibold text-[#333e47] md:text-[28px]"
                onSubmit={({ email, password, remember }) => {
                  if (!login(email, password, remember)) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
                  navigate('/app', { replace: true })
                }}
                onDigitalId={() => setThaid(true)}
              />
            </div>
          </div>
        </section>
        </div>

        <footer className="flex w-full flex-col-reverse items-center gap-[12px] px-[8px] pt-[48px] pb-[28px] text-[12px] leading-[1.3] text-[#b3b7ba] sm:flex-row sm:gap-[10px] md:pb-[38px]">
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
            <button type="button" aria-label="เปลี่ยนภาษา" className="rounded-full transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-white">
              <img src={globeIcon} alt="" width={24} height={24} />
            </button>
            <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-full transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-white">
              <img src={facebookIcon} alt="" width={24} height={24} />
            </a>
          </div>
        </footer>
      </main>
      <ThaiDConnect open={thaid} onClose={() => setThaid(false)} onSuccess={() => { loginWithThaiD(); navigate('/app', { replace: true }) }} />
    </div>
  )
}
