// ERP DOCUMENT — งานนำเข้าเอกสาร (e-Document Intelligence) book 3 §2.1.11, process from book 1 §2.2.9
// Demo: OCR + AI classification are simulated in the browser; the real system calls an OCR/AI service.

export type DocType = 'ใบเสร็จรับเงิน' | 'ใบกำกับภาษี' | 'ใบแจ้งหนี้' | 'ใบรับรองแพทย์' | 'หนังสือภายนอก'
export const docTypes: DocType[] = ['ใบเสร็จรับเงิน', 'ใบกำกับภาษี', 'ใบแจ้งหนี้', 'ใบรับรองแพทย์', 'หนังสือภายนอก']
export type PriceType = 'รวม VAT 7%' | 'ไม่รวม VAT' | 'ไม่มี VAT'
export const priceTypes: PriceType[] = ['รวม VAT 7%', 'ไม่รวม VAT', 'ไม่มี VAT']
export const docTags = ['เบิกจ่าย', 'ค่าวัสดุ', 'ค่าเดินทาง', 'ค่าอาหาร', 'ค่ารักษาพยาบาล', 'สวัสดิการ', 'โครงการ', 'ด่วน']

/** where each kind of document goes next (book 1 §2.2.9: ระบบแนะนำงานหรือฟังก์ชันที่เกี่ยวข้อง) */
export type Route = { sys: string; fn: string; to: string }
export const routesFor: Record<DocType, Route[]> = {
  ใบเสร็จรับเงิน: [{ sys: 'ERP FINANCE', fn: 'สร้างใบเบิกจ่าย / หักล้างเงินยืม', to: '/finance/clear' }, { sys: 'ERP HR', fn: 'เบิกสวัสดิการ', to: '/hr/welfare' }],
  ใบกำกับภาษี: [{ sys: 'ERP FINANCE', fn: 'บันทึกค่าใช้จ่ายและภาษีซื้อ', to: '/finance' }, { sys: 'ERP ASSET', fn: 'นำเข้าพัสดุ ครุภัณฑ์', to: '/asset/import' }],
  ใบแจ้งหนี้: [{ sys: 'ERP FINANCE', fn: 'ตั้งเบิกจ่ายให้ผู้รับจ้าง', to: '/finance' }],
  ใบรับรองแพทย์: [{ sys: 'ERP HR', fn: 'เบิกสวัสดิการค่ารักษาพยาบาล', to: '/hr/welfare' }, { sys: 'ERP HR', fn: 'แนบประกอบใบลาป่วย', to: '/hr/leave' }],
  หนังสือภายนอก: [{ sys: 'ERP SARABAN', fn: 'ลงรับหนังสือภายนอก', to: '/saraban/receive/new' }],
}

export type Line = { desc: string; qty: number; price: number }
export type Fields = {
  docNo: string; issueDate: string; contact: string; taxId: string; priceType: PriceType; lines: Line[]; tags: string[]; note: string
  // medical certificate
  patient?: string; hospital?: string; diagnosis?: string; restDays?: number
}
export type EDoc = { id: number; name: string; type: DocType; status: 'ร่าง' | 'เสร็จสิ้น'; uploadedAt: string; preview: string; mime: string; confidence: number; ocr: string; f: Fields; aiKeys: string[]; routedTo?: Route; by: string }

export const sum = (f: Fields) => f.lines.reduce((s, l) => s + l.qty * l.price, 0)
export function totals(f: Fields) {
  const base = sum(f)
  if (f.priceType === 'ไม่มี VAT') return { sub: base, vat: 0, net: base }
  if (f.priceType === 'ไม่รวม VAT') return { sub: base, vat: +(base * 0.07).toFixed(2), net: +(base * 1.07).toFixed(2) }
  const sub = +(base / 1.07).toFixed(2)
  return { sub, vat: +(base - sub).toFixed(2), net: base }
}
export const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const th = (iso: string) => iso.split('-').reverse().join('/').replace(/(\d{4})$/, (y) => String(Number(y) + 543))

// ---- sample documents drawn as SVG (so the preview matches what the "OCR" reads) -----------------
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
function paper(body: string, accent = '#0b2a5c') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842"><rect width="595" height="842" fill="#fff"/><rect x="0" y="0" width="595" height="8" fill="${accent}"/><g font-family="Tahoma, 'Leelawadee UI', sans-serif" fill="#1d2433">${body}</g></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
const t = (x: number, y: number, s: string, size = 12, w = 400, anchor = 'start', fill = '#1d2433') => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${w}" text-anchor="${anchor}" fill="${fill}">${esc(s)}</text>`
function bill(title: string, f: Fields, shop: { name: string; addr: string }, accent: string) {
  const tt = totals(f)
  let y = 300
  const rows = f.lines.map((l, i) => { const r = `${t(50, y, String(i + 1))}${t(80, y, l.desc)}${t(400, y, String(l.qty), 12, 400, 'end')}${t(470, y, money(l.price), 12, 400, 'end')}${t(545, y, money(l.qty * l.price), 12, 400, 'end')}<line x1="40" x2="555" y1="${y + 12}" y2="${y + 12}" stroke="#e6e9ef"/>`; y += 30; return r }).join('')
  return paper(
    `${t(40, 60, shop.name, 18, 700)}${t(40, 82, shop.addr, 10, 400, 'start', '#5d6b82')}${t(40, 98, `เลขประจำตัวผู้เสียภาษี ${f.taxId}`, 10, 400, 'start', '#5d6b82')}` +
      `<rect x="390" y="40" width="165" height="64" rx="8" fill="${accent}" opacity=".08"/>${t(472, 68, title, 16, 700, 'middle', accent)}${t(472, 90, 'ต้นฉบับ / Original', 9, 400, 'middle', '#5d6b82')}` +
      `${t(40, 150, 'ลูกค้า: สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน)', 12, 600)}${t(40, 170, '912 ถนนนวมินทร์ แขวงนวมินทร์ เขตบึงกุ่ม กรุงเทพฯ 10240', 10, 400, 'start', '#5d6b82')}` +
      `${t(400, 150, `เลขที่  ${f.docNo}`, 12, 600)}${t(400, 170, `วันที่  ${th(f.issueDate)}`, 12)}` +
      `<rect x="40" y="250" width="515" height="30" fill="#f2f5fa"/>${t(50, 270, '#', 11, 700)}${t(80, 270, 'รายการ', 11, 700)}${t(400, 270, 'จำนวน', 11, 700, 'end')}${t(470, 270, 'ราคา/หน่วย', 11, 700, 'end')}${t(545, 270, 'จำนวนเงิน', 11, 700, 'end')}${rows}` +
      `${t(470, y + 30, 'รวมเป็นเงิน', 11, 400, 'end')}${t(545, y + 30, money(tt.sub), 11, 400, 'end')}${t(470, y + 52, 'ภาษีมูลค่าเพิ่ม 7%', 11, 400, 'end')}${t(545, y + 52, money(tt.vat), 11, 400, 'end')}` +
      `<rect x="330" y="${y + 64}" width="225" height="34" rx="6" fill="${accent}"/>${t(470, y + 86, 'จำนวนเงินทั้งสิ้น', 12, 700, 'end', '#fff')}${t(545, y + 86, money(tt.net), 12, 700, 'end', '#fff')}` +
      `${t(400, 760, '........................................', 12, 400, 'middle', '#9aa5b8')}${t(400, 780, 'ผู้รับเงิน / Collector', 10, 400, 'middle', '#5d6b82')}`,
    accent,
  )
}
function medcert(f: Fields) {
  return paper(
    `${t(297, 70, f.hospital ?? '', 18, 700, 'middle', '#0f6b4c')}${t(297, 92, '1 ถนนรามอินทรา แขวงคันนายาว เขตคันนายาว กรุงเทพฯ 10230', 10, 400, 'middle', '#5d6b82')}` +
      `${t(297, 150, 'ใบรับรองแพทย์', 22, 700, 'middle')}${t(297, 172, 'Medical Certificate', 11, 400, 'middle', '#5d6b82')}${t(470, 210, `เลขที่ ${f.docNo}`, 11)}${t(470, 228, `วันที่ ${th(f.issueDate)}`, 11)}` +
      `${t(60, 280, 'ข้าพเจ้า นายแพทย์ภาณุ ศรีประเสริฐ ใบอนุญาตประกอบวิชาชีพเวชกรรมเลขที่ ว.45821', 12)}${t(60, 310, `ได้ทำการตรวจร่างกาย ${f.patient ?? ''}`, 12)}${t(60, 340, `เมื่อวันที่ ${th(f.issueDate)} มีอาการและผลการวินิจฉัยดังนี้`, 12)}` +
      `<rect x="60" y="360" width="475" height="70" rx="8" fill="#f2f8f5"/>${t(80, 390, `การวินิจฉัย: ${f.diagnosis ?? ''}`, 13, 600)}${t(80, 414, `ความเห็นแพทย์: ควรหยุดพักรักษาตัว ${f.restDays ?? 0} วัน`, 12)}` +
      `${t(60, 470, `ค่ารักษาพยาบาล ${money(sum(f))} บาท (ตามใบเสร็จรับเงินเลขที่ RC-${f.docNo.slice(-5)})`, 12)}` +
      `${t(420, 700, '........................................', 12, 400, 'middle', '#9aa5b8')}${t(420, 720, 'แพทย์ผู้ตรวจ', 11, 400, 'middle', '#5d6b82')}`,
    '#17a673',
  )
}
function letter(f: Fields) {
  return paper(
    `<circle cx="297" cy="80" r="32" fill="none" stroke="#0b2a5c" stroke-width="2"/>${t(297, 86, 'ตรา', 12, 700, 'middle', '#0b2a5c')}${t(60, 150, `ที่ ${f.docNo}`, 12)}${t(535, 150, f.contact, 12, 400, 'end')}${t(535, 170, `${th(f.issueDate)}`, 12, 400, 'end')}` +
      `${t(60, 220, `เรื่อง  ${f.lines[0]?.desc ?? ''}`, 13, 700)}${t(60, 250, 'เรียน  ผู้อำนวยการสถาบันพัฒนาองค์กรชุมชน', 12)}` +
      `${t(100, 300, 'ด้วยหน่วยงานมีความประสงค์ขอความร่วมมือสถาบันพัฒนาองค์กรชุมชน', 12)}${t(60, 325, 'ในการส่งผู้แทนเข้าร่วมประชุมคณะทำงานพัฒนาที่อยู่อาศัยชุมชนเมือง', 12)}${t(60, 350, 'จึงเรียนมาเพื่อโปรดพิจารณา', 12)}${t(400, 450, 'ขอแสดงความนับถือ', 12, 400, 'middle')}${t(400, 520, '(นางสาวพรทิพย์ วงศ์ไทย)', 12, 400, 'middle')}${t(400, 540, 'ผู้อำนวยการกอง', 11, 400, 'middle', '#5d6b82')}`,
  )
}
export function drawDoc(type: DocType, f: Fields) {
  if (type === 'ใบรับรองแพทย์') return medcert(f)
  if (type === 'หนังสือภายนอก') return letter(f)
  const shop = type === 'ใบแจ้งหนี้' ? { name: 'บริษัท แอร์ เซอร์วิส เอ็นจิเนียริ่ง จำกัด', addr: '300 ถนนเสรีไทย แขวงคันนายาว เขตคันนายาว กรุงเทพฯ 10230' } : type === 'ใบกำกับภาษี' ? { name: 'บริษัท ไอที ซัพพลาย จำกัด', addr: '88 ถนนรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ 10240' } : { name: f.contact || 'ร้านค้า', addr: '15/3 ถนนนวมินทร์ แขวงคลองกุ่ม เขตบึงกุ่ม กรุงเทพฯ 10240' }
  return bill(type === 'ใบกำกับภาษี' ? 'ใบกำกับภาษี' : type === 'ใบแจ้งหนี้' ? 'ใบแจ้งหนี้' : 'ใบเสร็จรับเงิน', f, shop, type === 'ใบแจ้งหนี้' ? '#a8650b' : type === 'ใบกำกับภาษี' ? '#5a40c9' : '#0b2a5c')
}

const iso = (d = new Date()) => d.toISOString().slice(0, 10)
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d) }
export const samples: { key: string; label: string; type: DocType; f: () => Fields }[] = [
  { key: 'receipt', label: 'ใบเสร็จค่าอาหารประชุม', type: 'ใบเสร็จรับเงิน', f: () => ({ docNo: 'RC-2569/00871', issueDate: daysAgo(2), contact: 'ร้านครัวบ้านสวน', taxId: '3100500123456', priceType: 'ไม่มี VAT', lines: [{ desc: 'อาหารกลางวันผู้เข้าร่วมประชุม', qty: 25, price: 120 }, { desc: 'อาหารว่างและเครื่องดื่ม', qty: 50, price: 35 }], tags: ['เบิกจ่าย', 'ค่าอาหาร', 'โครงการ'], note: 'ประชุมคณะทำงานพัฒนาที่อยู่อาศัย' }) },
  { key: 'tax', label: 'ใบกำกับภาษีหมึกพิมพ์', type: 'ใบกำกับภาษี', f: () => ({ docNo: 'INV-IT6911-0457', issueDate: daysAgo(4), contact: 'บริษัท ไอที ซัพพลาย จำกัด', taxId: '0105556012345', priceType: 'รวม VAT 7%', lines: [{ desc: 'หมึกพิมพ์ HP 26A (CF226A)', qty: 6, price: 2890 }, { desc: 'ค่าจัดส่ง', qty: 1, price: 160 }], tags: ['เบิกจ่าย', 'ค่าวัสดุ'], note: '' }) },
  { key: 'med', label: 'ใบรับรองแพทย์', type: 'ใบรับรองแพทย์', f: () => ({ docNo: 'MC-680112', issueDate: daysAgo(1), contact: 'โรงพยาบาลนวมินทร์', taxId: '', priceType: 'ไม่มี VAT', lines: [{ desc: 'ค่ารักษาพยาบาลผู้ป่วยนอก', qty: 1, price: 1850 }], tags: ['ค่ารักษาพยาบาล', 'สวัสดิการ'], note: '', patient: 'นางสาวปริยดา เจริญวัฒนกุล', hospital: 'โรงพยาบาลนวมินทร์', diagnosis: 'ไข้หวัดใหญ่ชนิดเอ (Influenza A)', restDays: 2 }) },
  { key: 'invoice', label: 'ใบแจ้งหนี้ล้างแอร์', type: 'ใบแจ้งหนี้', f: () => ({ docNo: 'IV-AS-25-1102', issueDate: daysAgo(6), contact: 'บริษัท แอร์ เซอร์วิส เอ็นจิเนียริ่ง จำกัด', taxId: '0105560111222', priceType: 'ไม่รวม VAT', lines: [{ desc: 'ล้างเครื่องปรับอากาศ 24,000 BTU', qty: 12, price: 650 }, { desc: 'เติมน้ำยา R32', qty: 2, price: 1200 }], tags: ['เบิกจ่าย'], note: 'ตามประกาศ ปจ. 13/2569' }) },
]

const ocrOf = (type: DocType, f: Fields) => type === 'ใบรับรองแพทย์'
  ? `${f.hospital}\nใบรับรองแพทย์ เลขที่ ${f.docNo} วันที่ ${th(f.issueDate)}\nผู้ป่วย ${f.patient}\nการวินิจฉัย ${f.diagnosis}\nหยุดพัก ${f.restDays} วัน\nค่ารักษา ${money(sum(f))}`
  : `${f.contact}\n${type} เลขที่ ${f.docNo}\nวันที่ ${th(f.issueDate)}\nเลขประจำตัวผู้เสียภาษี ${f.taxId}\n${f.lines.map((l) => `${l.desc}  ${l.qty} x ${money(l.price)} = ${money(l.qty * l.price)}`).join('\n')}\nจำนวนเงินทั้งสิ้น ${money(totals(f).net)}`

/** "OCR + AI": for samples it reads the real values; for user files it guesses the type from the file name */
export function readDocument(name: string, sampleKey?: string): { type: DocType; f: Fields; confidence: number; ocr: string; aiKeys: string[] } {
  const s = samples.find((x) => x.key === sampleKey)
  if (s) { const f = s.f(); return { type: s.type, f, confidence: 0.9 + ((name.length * 7) % 9) / 100, ocr: ocrOf(s.type, f), aiKeys: s.type === 'ใบรับรองแพทย์' ? ['type', 'docNo', 'issueDate', 'lines', 'tags', 'patient', 'hospital', 'diagnosis', 'restDays'] : ['type', 'docNo', 'issueDate', 'contact', 'taxId', 'priceType', 'lines', 'tags'] } }
  const n = name.toLowerCase()
  const type: DocType = /แพทย์|medical|cert|รพ|hospital/.test(n) ? 'ใบรับรองแพทย์' : /invoice|แจ้งหนี้|bill/.test(n) ? 'ใบแจ้งหนี้' : /tax|กำกับ/.test(n) ? 'ใบกำกับภาษี' : /หนังสือ|letter|memo|ที่ /.test(n) ? 'หนังสือภายนอก' : 'ใบเสร็จรับเงิน'
  const f: Fields = { docNo: '', issueDate: iso(), contact: '', taxId: '', priceType: 'รวม VAT 7%', lines: [{ desc: '', qty: 1, price: 0 }], tags: type === 'ใบรับรองแพทย์' ? ['ค่ารักษาพยาบาล'] : ['เบิกจ่าย'], note: '', ...(type === 'ใบรับรองแพทย์' ? { patient: 'นางสาวปริยดา เจริญวัฒนกุล', hospital: '', diagnosis: '', restDays: 1 } : {}) }
  return { type, f, confidence: 0.62 + ((name.length * 13) % 20) / 100, ocr: `(อ่านข้อความจาก ${name})\nตรวจพบโครงสร้างเอกสารประเภท ${type}\nบางช่องอ่านได้ไม่ชัด กรุณาตรวจสอบและกรอกเพิ่ม`, aiKeys: ['type', 'issueDate', 'tags'] }
}

export const seedDocs = (): EDoc[] => {
  const mk = (id: number, key: string, status: EDoc['status'], uploadedAt: string, routeIdx = 0): EDoc => {
    const s = samples.find((x) => x.key === key)!
    const r = readDocument(`${s.label}.jpg`, key)
    return { id, name: `${s.label}.jpg`, type: r.type, status, uploadedAt, preview: drawDoc(r.type, r.f), mime: 'image/svg+xml', confidence: r.confidence, ocr: r.ocr, f: r.f, aiKeys: [], routedTo: status === 'เสร็จสิ้น' ? routesFor[r.type][routeIdx] : undefined, by: 'ปริยดา เจริญวัฒนกุล' }
  }
  const letterF: Fields = { docNo: 'กทม 0612/2451', issueDate: daysAgo(9), contact: 'สำนักงานเขตบึงกุ่ม', taxId: '', priceType: 'ไม่มี VAT', lines: [{ desc: 'ขอเชิญผู้แทนเข้าร่วมประชุมคณะทำงาน', qty: 1, price: 0 }], tags: ['ด่วน'], note: '' }
  const travelF: Fields = { docNo: 'RC-2569/00712', issueDate: daysAgo(15), contact: 'บริษัท ขนส่ง จำกัด', taxId: '0994000165323', priceType: 'ไม่มี VAT', lines: [{ desc: 'ค่าโดยสารรถทัวร์ กรุงเทพฯ–ขอนแก่น ไป-กลับ', qty: 2, price: 412 }], tags: ['ค่าเดินทาง', 'เบิกจ่าย'], note: '' }
  const list: EDoc[] = [
    mk(6, 'receipt', 'ร่าง', `${daysAgo(0)} 09:42`),
    mk(5, 'med', 'เสร็จสิ้น', `${daysAgo(1)} 16:05`),
    mk(4, 'tax', 'เสร็จสิ้น', `${daysAgo(3)} 11:20`),
    mk(3, 'invoice', 'ร่าง', `${daysAgo(5)} 14:10`),
    { id: 2, name: 'หนังสือเชิญประชุม-เขตบึงกุ่ม.pdf', type: 'หนังสือภายนอก', status: 'เสร็จสิ้น', uploadedAt: `${daysAgo(9)} 10:00`, preview: drawDoc('หนังสือภายนอก', letterF), mime: 'image/svg+xml', confidence: 0.88, ocr: ocrOf('หนังสือภายนอก', letterF), f: letterF, aiKeys: [], routedTo: routesFor['หนังสือภายนอก'][0], by: 'ปริยดา เจริญวัฒนกุล' },
    { ...mk(1, 'receipt', 'เสร็จสิ้น', `${daysAgo(14)} 15:30`), name: 'ใบเสร็จค่าเดินทางลงพื้นที่.jpg', f: travelF, preview: drawDoc('ใบเสร็จรับเงิน', travelF), ocr: ocrOf('ใบเสร็จรับเงิน', travelF) },
  ]
  return list
}
