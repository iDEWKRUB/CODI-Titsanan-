import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import iconTor from '../assets/tor/icon-clipboard-check.svg'
import TorTabs from '../components/tor/TorTabs'
import PageTitle from '../components/ui/PageTitle'

export type Host = { key: string; label: string; intro: string; files: { name: string; code: string }[]; after?: string[] }

export const buildCmds = ['git clone <URL ของ repo> codi-portal && cd codi-portal', 'npm ci', 'npm run build', '# ได้โฟลเดอร์ dist/ (ประมาณ 4 MB) = เว็บทั้งหมดที่ต้องเอาไปวาง']

export const hosts: Host[] = [
  {
    key: 'nginx',
    label: 'Nginx บน Linux Server',
    intro: 'เหมาะกับ VPS / เครื่องของหน่วยงาน / Cloud VM (Ubuntu) — วางไฟล์ dist แล้วตั้ง Nginx ให้ทุกเส้นทางตกกลับมาที่ index.html',
    files: [
      { name: 'คัดลอกไฟล์ขึ้นเครื่อง', code: 'scp -r dist/* user@SERVER:/var/www/codi-portal/' },
      {
        name: '/etc/nginx/sites-available/codi-portal',
        code: 'server {\n  listen 80;\n  server_name portal.example.go.th;\n  root /var/www/codi-portal;\n  index index.html;\n\n  gzip on;\n  gzip_types text/css application/javascript application/json image/svg+xml;\n\n  location /assets/ {\n    expires 1y;\n    add_header Cache-Control "public, immutable";\n  }\n\n  location / {\n    try_files $uri $uri/ /index.html;\n    add_header Cache-Control "no-cache";\n  }\n}',
      },
      { name: 'เปิดใช้งาน', code: 'sudo ln -s /etc/nginx/sites-available/codi-portal /etc/nginx/sites-enabled/\nsudo nginx -t && sudo systemctl reload nginx' },
    ],
  },
  {
    key: 'docker',
    label: 'Docker',
    intro: 'ในโปรเจกต์มี Dockerfile และ nginx.conf ให้แล้ว — build image ครั้งเดียว เอาไปรันที่ไหนก็ได้ (Server, Kubernetes, Cloud Run, ECS ฯลฯ)',
    files: [
      { name: 'Build และรัน', code: 'docker build -t codi-portal .\ndocker run -d --name codi-portal -p 80:80 --restart unless-stopped codi-portal' },
      { name: 'หรือผ่าน Registry', code: 'docker tag codi-portal registry.example.com/codi/codi-portal:1.0.0\ndocker push registry.example.com/codi/codi-portal:1.0.0' },
    ],
  },
  {
    key: 'apache',
    label: 'Apache',
    intro: 'วางไฟล์ใน DocumentRoot แล้วเพิ่ม .htaccess (ต้องเปิด mod_rewrite และ AllowOverride All)',
    files: [
      { name: 'คัดลอกไฟล์', code: 'scp -r dist/* user@SERVER:/var/www/html/codi-portal/' },
      { name: '.htaccess (วางข้าง index.html)', code: '<IfModule mod_rewrite.c>\n  RewriteEngine On\n  RewriteBase /\n  RewriteRule ^index\\.html$ - [L]\n  RewriteCond %{REQUEST_FILENAME} !-f\n  RewriteCond %{REQUEST_FILENAME} !-d\n  RewriteRule . /index.html [L]\n</IfModule>' },
    ],
  },
  {
    key: 'iis',
    label: 'Windows IIS',
    intro: 'ติดตั้ง URL Rewrite Module แล้ววางไฟล์ใน Site ของ IIS พร้อม web.config',
    files: [
      {
        name: 'web.config (วางข้าง index.html)',
        code: '<configuration>\n  <system.webServer>\n    <rewrite>\n      <rules>\n        <rule name="SPA" stopProcessing="true">\n          <match url=".*" />\n          <conditions logicalGrouping="MatchAll">\n            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />\n            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />\n          </conditions>\n          <action type="Rewrite" url="/index.html" />\n        </rule>\n      </rules>\n    </rewrite>\n  </system.webServer>\n</configuration>',
      },
    ],
  },
  {
    key: 'static',
    label: 'Static Hosting อื่น',
    intro: 'Netlify / Cloudflare Pages / GitHub Pages / AWS S3 + CloudFront / Firebase Hosting — ใช้ได้หมด เพราะเว็บนี้เป็นไฟล์ static (ไม่มี Server ฝั่งหลังบ้าน)',
    files: [
      { name: 'ตั้งค่าที่เหมือนกันทุกที่', code: 'Build command : npm run build\nOutput folder : dist\nNode version  : 20 ขึ้นไป' },
      { name: 'Netlify / Cloudflare Pages: ไฟล์ public/_redirects', code: '/*    /index.html   200' },
      { name: 'S3 + CloudFront: ตั้ง Error page', code: '403 และ 404 → /index.html (HTTP 200)' },
    ],
    after: ['GitHub Pages ไม่รองรับ SPA fallback ตรง ๆ ต้องใช้ไฟล์ 404.html ที่เป็นสำเนา index.html'],
  },
]

export const httpsCmds = ['sudo apt install -y certbot python3-certbot-nginx', 'sudo certbot --nginx -d portal.example.go.th', '# ต่ออายุอัตโนมัติ — ทดสอบด้วย: sudo certbot renew --dry-run']
export const afterChecks = [
  'เปิด /login แล้วล็อกอิน demo@codi.or.th / 123456 (บัญชีทดลองในเบราว์เซอร์)',
  'เปิด URL ลึก ๆ เช่น /tor/sitemap แล้วกดรีเฟรช ต้องไม่ขึ้น 404 (ถ้าขึ้น แปลว่ายังไม่ได้ตั้ง SPA fallback)',
  'เปิด /community/map ต้องเห็นแผนที่ถนน (ถ้าว่าง ให้ตรวจว่าเครื่องผู้ใช้ออกอินเทอร์เน็ตไปที่ tile.openstreetmap.org ได้)',
  'เปิดผ่านมือถือ ตรวจว่าเมนูและหน้าหลักแสดงถูกต้อง',
]
export const cautions = [
  ['ไม่มี Backend', 'ข้อมูลทุกอย่างอยู่ใน localStorage ของเบราว์เซอร์แต่ละเครื่อง ไม่แชร์ข้ามผู้ใช้ และหายเมื่อล้างข้อมูลเบราว์เซอร์ — เหมาะกับ Demo/UAT เท่านั้น'],
  ['ติดตั้งไว้ใต้โฟลเดอร์ย่อย (เช่น /codi/)', 'ต้องตั้ง base: "/codi/" ใน vite.config.ts และ basename ใน BrowserRouter ก่อน build ไม่เช่นนั้นไฟล์และเส้นทางจะหาไม่เจอ ถ้าใช้ทั้งโดเมนหรือซับโดเมน (portal.example.go.th) ไม่ต้องแก้'],
  ['แผนที่', 'ใช้ภาพแผนที่และการค้นหาตำแหน่งจาก OpenStreetMap (ฟรีแต่มีนโยบายการใช้งาน) ถ้าผู้ใช้เยอะหรือใช้ในเครือข่ายปิด ควรติดตั้ง Tile Server ของตัวเอง'],
  ['Node 24 / TypeScript', 'โปรเจกต์ใช้ TypeScript 5.9 ห้ามอัปเกรดเป็น 7 (ตัว compile หายบนเครื่องนี้) ให้ใช้ npm ci เพื่อได้เวอร์ชันตาม package-lock.json'],
  ['หน้าภายในทีม', 'หน้า CODI TOR และบัญชี demo จะเปิดให้ทุกคนที่เข้า URL ได้ ถ้าเปิดสาธารณะควรซ่อนหรือกั้นด้วย Basic Auth / VPN'],
]

function Copy({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text)
        setOk(true)
        setTimeout(() => setOk(false), 1500)
      }}
      className="no-print shrink-0 rounded-[6px] bg-white/10 px-[8px] py-[3px] text-[11px] font-medium text-white hover:bg-white/20"
    >
      {ok ? 'คัดลอกแล้ว' : 'คัดลอก'}
    </button>
  )
}

function Code({ code }: { code: string }) {
  return (
    <div className="mt-[6px] flex items-start gap-[8px] rounded-[8px] bg-[#1f2a44] px-[12px] py-[8px]">
      <pre className="min-w-0 flex-1 overflow-x-auto font-mono text-[12px] leading-[1.6] whitespace-pre text-[#cfe3ff]">{code}</pre>
      <Copy text={code} />
    </div>
  )
}

/** CODI TOR › ขั้นตอน Deploy — prototype on Vercel now, and the production roll-out the TOR requires */
export default function TorDeployPage() {
  const [host, setHost] = useState('nginx')
  // ?print=all shows every hosting option at once (this is the view the PDF is made from)
  const all = useSearchParams()[0].get('print') === 'all'
  const cur = hosts.find((h) => h.key === host) ?? hosts[0]
  return (
    <div className="flex flex-col gap-[16px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]">
      <TorTabs />
      <div className="flex flex-wrap items-start gap-[12px]">
        <div className="min-w-0 flex-1">
          <PageTitle icon={iconTor}>ขั้นตอน Deploy</PageTitle>
          <p className="mt-[8px] text-[12px] leading-[1.6] font-light text-gray-20">วิธีเอาระบบนี้ขึ้นเว็บเองบน Server / Docker / Hosting อื่น ๆ นอกเหนือจาก Vercel · หน้านี้ใช้ภายในทีม</p>
        </div>
        <a
          href="/downloads/CODI-Deploy-Guide.pdf"
          download="CODI-Portal-Deploy-Guide.pdf"
          className="no-print flex shrink-0 items-center gap-[6px] rounded-[8px] bg-blue-00 px-[14px] py-[10px] text-[12px] leading-[normal] font-medium whitespace-nowrap text-white-soft transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-00"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" />
          </svg>
          ดาวน์โหลด PDF
        </a>
      </div>

      <section aria-labelledby="proto" className="rounded-[12px] bg-blue-bg p-[16px]">
        <h2 id="proto" className="mb-[4px] text-[16px] font-semibold text-blue-dark">
          1. เอาระบบนี้ขึ้นเว็บที่อื่น (ไม่ใช้ Vercel)
        </h2>
        <p className="mb-[12px] text-[12px] leading-[1.6] font-light text-gray-30">
          ระบบนี้เป็น React + Vite ที่ build ออกมาเป็นไฟล์ static (HTML/JS/CSS) ล้วน ๆ — ไม่ต้องมี Node หรือฐานข้อมูลบนเครื่องปลายทาง ขอแค่มี Web Server ที่เสิร์ฟไฟล์และตั้งให้ “ทุกเส้นทางตกกลับมาที่ index.html”
        </p>

        <ol className="flex flex-col gap-[10px]">
          <li className="flex gap-[12px] rounded-[10px] bg-white p-[12px]">
            <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-blue-00 text-[12px] font-semibold text-white">1</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-black">เตรียมของ</p>
              <ul className="mt-[6px] flex list-disc flex-col gap-[2px] pl-[18px] text-[12px] leading-[1.6] font-light text-gray-30">
                <li>เครื่องสำหรับ build: Node.js 20 ขึ้นไป + npm + Git (ใช้ครั้งเดียวตอน build จะเป็นเครื่องคุณเองหรือ CI ก็ได้)</li>
                <li>ที่วางเว็บ: Server/VPS/Cloud ใดก็ได้ หรือบริการ Static Hosting (เลือกในข้อ 3)</li>
                <li>โดเมนหรือซับโดเมน เช่น portal.example.go.th ชี้ DNS (A/CNAME) มาที่เครื่องปลายทาง</li>
                <li>ใบรับรอง HTTPS (ฟรีจาก Let’s Encrypt ได้) — แนะนำให้ใช้เสมอ และบังคับสำหรับฟีเจอร์ไมโครโฟน (บันทึกเสียงประชุม) กับปุ่มระบุตำแหน่งปัจจุบัน ที่เบราว์เซอร์อนุญาตเฉพาะบน HTTPS</li>
              </ul>
            </div>
          </li>
          <li className="flex gap-[12px] rounded-[10px] bg-white p-[12px]">
            <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-blue-00 text-[12px] font-semibold text-white">2</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-black">Build เป็นไฟล์ static</p>
              <Code code={buildCmds.join('\n')} />
              <p className="mt-[6px] text-[12px] font-light text-gray-30">ถ้า build ผ่าน คำสั่ง npm run build จะตรวจ TypeScript ให้ด้วย ต้องไม่มี error</p>
            </div>
          </li>
          <li className="flex gap-[12px] rounded-[10px] bg-white p-[12px]">
            <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-blue-00 text-[12px] font-semibold text-white">3</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-black">เลือกวิธีวางไฟล์</p>
              {all ? (
                hosts.map((h) => (
                  <div key={h.key} className="mt-[12px] break-inside-avoid">
                    <p className="text-[13px] font-semibold text-blue-dark">{h.label}</p>
                    <p className="mt-[2px] text-[12px] leading-[1.6] font-light text-gray-30">{h.intro}</p>
                    {h.files.map((f) => (
                      <div key={f.name} className="mt-[6px]">
                        <p className="text-[11px] font-medium text-gray-20">{f.name}</p>
                        <Code code={f.code} />
                      </div>
                    ))}
                    {h.after?.map((x) => (
                      <p key={x} className="mt-[6px] text-[11px] font-light text-gray-20">{x}</p>
                    ))}
                  </div>
                ))
              ) : (
                <>
              <div role="tablist" aria-label="วิธีวางไฟล์" className="mt-[8px] flex flex-wrap gap-[6px]">
                {hosts.map((h) => (
                  <button key={h.key} type="button" role="tab" aria-selected={host === h.key} onClick={() => setHost(h.key)} className={`rounded-[8px] px-[12px] py-[6px] text-[12px] font-medium transition-colors ${host === h.key ? 'bg-blue-00 text-white' : 'bg-blue-bg text-blue-00 hover:bg-blue-20'}`}>
                    {h.label}
                  </button>
                ))}
              </div>
              <p className="mt-[8px] text-[12px] leading-[1.6] font-light text-gray-30">{cur.intro}</p>
              {cur.files.map((f) => (
                <div key={f.name} className="mt-[8px]">
                  <p className="text-[11px] font-medium text-gray-20">{f.name}</p>
                  <Code code={f.code} />
                </div>
              ))}
              {cur.after?.map((a) => (
                <p key={a} className="mt-[8px] text-[11px] font-light text-gray-20">{a}</p>
              ))}
                </>
              )}
            </div>
          </li>
          <li className="flex gap-[12px] rounded-[10px] bg-white p-[12px]">
            <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-blue-00 text-[12px] font-semibold text-white">4</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-black">ผูกโดเมนและเปิด HTTPS (ตัวอย่างบน Ubuntu + Nginx)</p>
              <Code code={httpsCmds.join('\n')} />
            </div>
          </li>
          <li className="flex gap-[12px] rounded-[10px] bg-white p-[12px]">
            <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-blue-00 text-[12px] font-semibold text-white">5</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-black">ตรวจหลังขึ้นระบบ</p>
              <ul className="mt-[6px] flex list-disc flex-col gap-[2px] pl-[18px] text-[12px] leading-[1.6] font-light text-gray-30">
                {afterChecks.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </li>
          <li className="flex gap-[12px] rounded-[10px] bg-white p-[12px]">
            <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-blue-00 text-[12px] font-semibold text-white">6</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-black">อัปเดตเวอร์ชันครั้งต่อไป</p>
              <Code code={'git pull\nnpm ci\nnpm run build\nscp -r dist/* user@SERVER:/var/www/codi-portal/   # หรือ docker build + docker run ใหม่'} />
              <p className="mt-[6px] text-[12px] font-light text-gray-30">ไฟล์ใน assets/ มีชื่อแฮชใหม่ทุกครั้ง ผู้ใช้จึงได้เวอร์ชันล่าสุดทันทีที่รีเฟรช (index.html ตั้ง no-cache ไว้แล้ว) ควรเก็บ dist ของเวอร์ชันก่อนหน้าไว้เผื่อย้อนกลับ</p>
            </div>
          </li>
        </ol>

        <h3 className="mt-[16px] mb-[8px] text-[14px] font-semibold text-blue-dark">ข้อควรระวัง</h3>
        <dl className="grid grid-cols-[200px_minmax(0,1fr)] gap-x-[12px] gap-y-[8px] rounded-[10px] bg-white p-[12px] text-[12px] leading-[1.6] max-md:grid-cols-1">
          {cautions.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-medium text-black">{k}</dt>
              <dd className="font-light text-gray-30">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-[10px] text-[11px] font-light text-gray-20">ยังใช้ Vercel ได้เหมือนเดิม: npx vercel deploy --prod --yes (ในโปรเจกต์มี vercel.json ตั้ง SPA fallback ไว้แล้ว)</p>
      </section>
    </div>
  )
}
