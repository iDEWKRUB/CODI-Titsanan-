import { afterChecks, buildCmds, cautions, hosts, httpsCmds } from './TorDeployPage'

// Plain A4 document used to produce the downloadable PDF (no app shell, so nothing is clipped or paginated oddly).
const code = 'my-[6px] break-inside-avoid overflow-hidden rounded-[6px] bg-[#1f2a44] px-[12px] py-[8px] font-mono text-[11px] leading-[1.55] whitespace-pre-wrap text-[#e3efff]'
const h2 = 'mt-[22px] mb-[6px] break-after-avoid border-b border-[#c1e7ff] pb-[4px] text-[17px] font-semibold text-[#00357d]'
const h3 = 'mt-[14px] mb-[2px] break-after-avoid text-[14px] font-semibold text-[#0085f9]'
const p = 'text-[12.5px] leading-[1.7] text-[#333e47]'
const ul = 'my-[4px] list-disc pl-[20px] text-[12.5px] leading-[1.7] text-[#333e47]'

export default function DeployPrintPage() {
  return (
    <article className="mx-auto max-w-[760px] bg-white px-[8px] py-[8px] font-sans text-[#24252e]">
      <header className="mb-[10px] border-b-2 border-[#0085f9] pb-[10px]">
        <h1 className="text-[24px] font-bold text-[#0085f9]">CODI Portal — ขั้นตอน Deploy ขึ้นเว็บ</h1>
        <p className="mt-[4px] text-[12px] text-[#757d83]">วิธีเอาระบบนี้ขึ้นเว็บเองบน Server / Docker / Hosting อื่น ๆ (ไม่ใช้ Vercel) · เอกสารภายในทีม · 5 พฤศจิกายน 2569</p>
      </header>

      <p className={p}>
        ระบบนี้เป็น React + Vite ที่ build ออกมาเป็นไฟล์ static (HTML/JS/CSS) ล้วน ๆ ไม่ต้องมี Node หรือฐานข้อมูลบนเครื่องปลายทาง ขอแค่มี Web Server ที่เสิร์ฟไฟล์ และตั้งให้ “ทุกเส้นทางตกกลับมาที่ index.html”
      </p>

      <h2 className={h2}>ขั้นที่ 1 เตรียมของ</h2>
      <ul className={ul}>
        <li>เครื่องสำหรับ build: Node.js 20 ขึ้นไป + npm + Git (ใช้ครั้งเดียวตอน build จะเป็นเครื่องของคุณเองหรือ CI ก็ได้)</li>
        <li>ที่วางเว็บ: Server / VPS / Cloud ใดก็ได้ หรือบริการ Static Hosting (ดูขั้นที่ 3)</li>
        <li>โดเมนหรือซับโดเมน เช่น portal.example.go.th ชี้ DNS (A/CNAME) มาที่เครื่องปลายทาง</li>
        <li>ใบรับรอง HTTPS (ฟรีจาก Let’s Encrypt ได้) แนะนำให้ใช้เสมอ และบังคับสำหรับฟีเจอร์ไมโครโฟน (บันทึกเสียงประชุม) กับปุ่มระบุตำแหน่งปัจจุบัน ที่เบราว์เซอร์อนุญาตเฉพาะบน HTTPS</li>
      </ul>

      <h2 className={h2}>ขั้นที่ 2 Build เป็นไฟล์ static</h2>
      <pre className={code}>{buildCmds.join('\n')}</pre>
      <p className={p}>คำสั่ง npm run build จะตรวจ TypeScript ให้ด้วย ต้องไม่มี error ผลลัพธ์คือโฟลเดอร์ dist/ (ประมาณ 4 MB)</p>

      <h2 className={h2}>ขั้นที่ 3 เลือกวิธีวางไฟล์</h2>
      {hosts.map((h) => (
        <section key={h.key}>
          <h3 className={h3}>{h.label}</h3>
          <p className={p}>{h.intro}</p>
          {h.files.map((f) => (
            <div key={f.name}>
              <p className="mt-[6px] break-after-avoid text-[11px] font-semibold text-[#757d83]">{f.name}</p>
              <pre className={code}>{f.code}</pre>
            </div>
          ))}
          {h.after?.map((a) => (
            <p key={a} className="text-[11.5px] text-[#757d83]">{a}</p>
          ))}
        </section>
      ))}

      <h2 className={h2}>ขั้นที่ 4 ผูกโดเมนและเปิด HTTPS (ตัวอย่าง Ubuntu + Nginx)</h2>
      <pre className={code}>{httpsCmds.join('\n')}</pre>

      <h2 className={h2}>ขั้นที่ 5 ตรวจหลังขึ้นระบบ</h2>
      <ul className={ul}>
        {afterChecks.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>

      <h2 className={h2}>ขั้นที่ 6 อัปเดตเวอร์ชันครั้งต่อไป</h2>
      <pre className={code}>{'git pull\nnpm ci\nnpm run build\nscp -r dist/* user@SERVER:/var/www/codi-portal/   # หรือ docker build + docker run ใหม่'}</pre>
      <p className={p}>ไฟล์ใน assets/ มีชื่อแฮชใหม่ทุกครั้ง ผู้ใช้จึงได้เวอร์ชันล่าสุดทันทีที่รีเฟรช (index.html ตั้ง no-cache ไว้แล้ว) ควรเก็บ dist ของเวอร์ชันก่อนหน้าไว้เผื่อย้อนกลับ</p>

      <h2 className={h2}>ข้อควรระวัง</h2>
      <table className="w-full border-collapse text-[12px] leading-[1.6]">
        <tbody>
          {cautions.map(([k, v]) => (
            <tr key={k} className="break-inside-avoid border-b border-[#dbdddf] align-top">
              <th className="w-[170px] py-[7px] pr-[10px] text-left font-semibold text-[#24252e]">{k}</th>
              <td className="py-[7px] font-light text-[#333e47]">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-[10px] text-[11px] text-[#757d83]">ยังใช้ Vercel ได้เหมือนเดิม: npx vercel deploy --prod --yes (ในโปรเจกต์มี vercel.json ตั้ง SPA fallback ไว้แล้ว)</p>
    </article>
  )
}
