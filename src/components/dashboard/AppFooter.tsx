import deco0 from '../../assets/dashboard/footer-deco-0.svg'
import deco1 from '../../assets/dashboard/footer-deco-1.svg'
import deco2 from '../../assets/dashboard/footer-deco-2.svg'
import deco3 from '../../assets/dashboard/footer-deco-3.svg'
import deco4 from '../../assets/dashboard/footer-deco-4.svg'
import deco5 from '../../assets/dashboard/footer-deco-5.svg'
import iconFacebook from '../../assets/dashboard/icon-facebook.svg'
import iconGlobe from '../../assets/dashboard/icon-globe.svg'

// Watermark layers (Figma 219:12765), positioned by inset %
const watermark: [string, string][] = [
  [deco0, '10.24% 30.97% 28.07% 11.54%'],
  [deco1, '10.21% 54.23% 35.18% 18.88%'],
  [deco2, '9.57% 9.91% 35.23% 28.7%'],
  [deco3, '56.39% 25.76% 18% 23.56%'],
  [deco4, '16.64% 14.31% 38.14% 47.64%'],
  [deco5, '26.19% 18.44% 10.91% 27.75%'],
]

const links = ['คู่มือการใช้งานระบบ', 'ติดต่อ IT Support/Admin', 'ศูนย์ช่วยเหลือ (Helpdesk)', 'PDPA/Privacy Policy', 'Term and conditions']
const linkClass = 'rounded-[2px] transition-colors hover:text-blue-00 focus-visible:outline-2 focus-visible:outline-blue-00'

export default function AppFooter() {
  return (
    <footer className="relative mt-[39px] px-[24px] pt-[12px] pb-[24px] max-sm:px-[16px]">
      {/* Faded CODI mark, bleeding up behind the content */}
      <div aria-hidden="true" className="pointer-events-none absolute right-0 bottom-px h-[431px] w-[476px] overflow-hidden opacity-20 max-sm:h-[300px] max-sm:w-[330px]">
        <div className="absolute top-0 bottom-[-62.07%] left-0 aspect-[97/86]">
          {watermark.map(([src, inset]) => (
            <div key={inset} className="absolute" style={{ inset }}>
              <img src={src} alt="" className="absolute inset-0 block size-full max-w-none" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex items-end justify-between gap-[24px] px-[24px] pb-[24px] text-[12px] leading-[1.3] font-light max-md:flex-col max-md:items-start max-sm:px-0">
        <div className="flex min-w-0 flex-col gap-[12px]">
          <p className="text-black">Copyright © 2568 สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน)</p>
          <nav className="flex flex-wrap gap-x-[16px] gap-y-[6px] text-gray-20">
            {links.map((l) => (
              <a key={l} href="#" onClick={(e) => e.preventDefault()} className={linkClass}>
                {l}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-[12px]">
          <button type="button" aria-label="เปลี่ยนภาษา" className="rounded-full transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-blue-00">
            <img src={iconGlobe} alt="" width={24} height={24} />
          </button>
          <a
            href="https://www.facebook.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
            className="rounded-full transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-blue-00"
          >
            <img src={iconFacebook} alt="" width={24} height={24} />
          </a>
        </div>
      </div>
    </footer>
  )
}
