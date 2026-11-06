import r1 from '../assets/ams/room-1.jpg'
import r2 from '../assets/ams/room-2.jpg'
import r3 from '../assets/ams/room-3.jpg'
import r4 from '../assets/ams/room-4.jpg'
import r5 from '../assets/ams/room-5.jpg'
import r6 from '../assets/ams/room-6.jpg'
import r7 from '../assets/ams/room-7.jpg'
import r8 from '../assets/ams/room-8.jpg'
import r9 from '../assets/ams/room-9.jpg'
import r10 from '../assets/ams/room-10.jpg'

export type Room = { id: string; name: string; floor: number; office: string; count: number; photo: string }

// Figma ภาพรวมพัสดุ-ครุภัณฑ์ (340:27290): 10 rooms, 20,000 items in total
export const rooms: Room[] = [
  { id: 'finance', name: 'ห้องสำนักการเงินและบัญชี', floor: 2, office: 'สำนักการเงินและบัญชี', count: 277, photo: r7 },
  { id: 'coordination', name: 'ห้องสำนักงานประสานขบวนองค์กรชุมชนและประชาสังคม', floor: 3, office: 'สำนักงานประสานขบวนองค์กรชุมชนและประชาสังคม', count: 359, photo: r8 },
  { id: 'director', name: 'ห้องสำนักผู้อำนวยการ', floor: 3, office: 'สำนักผู้อำนวยการ', count: 560, photo: r1 },
  { id: 'it', name: 'ห้องสำนักเทคโนโลยีสารสนเทศ', floor: 3, office: 'สำนักเทคโนโลยีสารสนเทศ', count: 453, photo: r3 },
  { id: 'admin', name: 'ห้องสำนักบริหารงานกลาง', floor: 1, office: 'สำนักบริหารงานกลาง', count: 360, photo: r10 },
  { id: 'library', name: 'ห้องสมุด', floor: 1, office: 'สำนักบริหารงานกลาง', count: 225, photo: r2 },
  { id: 'bkk', name: 'ห้องสำนักงานภาคกรุงเทพฯ ปริมณฑลและตะวันออก', floor: 4, office: 'สำนักงานภาคกรุงเทพฯ ปริมณฑลและตะวันออก', count: 298, photo: r9 },
  { id: 'hr', name: 'ห้องสำนักทรัพยากรบุคคล', floor: 3, office: 'สำนักทรัพยากรบุคคล', count: 356, photo: r6 },
  { id: 'meeting', name: 'ห้องประชุมไพบูลย์ วัฒนศิริธรรม', floor: 1, office: 'สำนักบริหารงานกลาง', count: 325, photo: r5 },
  { id: 'knowledge', name: 'ห้องสำนักพัฒนาองค์ความรู้และสื่อสารองค์กร', floor: 2, office: 'สำนักพัฒนาองค์ความรู้และสื่อสารองค์กร', count: 317, photo: r4 },
]
export const roomById = (id?: string) => rooms.find((r) => r.id === id) ?? rooms[3]

export const offices = [...new Set(rooms.map((r) => r.office))]

export type AssetRow = { tag: string; name: string; kind: string; qty: number }
const catalog: [string, string][] = [
  ['Notebook Dell Latitude 3420', 'คอมพิวเตอร์'],
  ['เครื่องพิมพ์ Canon G3010', 'เครื่องใช้สำนักงาน'],
  ['Router TP-Link AC1200', 'อุปกรณ์เครือข่าย'],
  ['จอภาพ LG 24 นิ้ว', 'คอมพิวเตอร์'],
  ['โต๊ะทำงาน 120 ซม.', 'เฟอร์นิเจอร์'],
  ['เก้าอี้สำนักงานมีล้อเลื่อน', 'เฟอร์นิเจอร์'],
  ['เครื่องปรับอากาศ Daikin 18,000 BTU', 'เครื่องใช้ไฟฟ้า'],
  ['Switch Cisco 24 Port', 'อุปกรณ์เครือข่าย'],
  ['โปรเจกเตอร์ Epson EB-X06', 'โสตทัศนูปกรณ์'],
  ['ตู้เก็บเอกสาร 4 ลิ้นชัก', 'เฟอร์นิเจอร์'],
]

/** Items the scan did not find (the 3 missing of 453, matches Figma ผลลัพธ์การตรวจนับ) */
export const lostItems: AssetRow[] = [
  { tag: 'RFID-IT-0045', name: 'Notebook Dell Latitude 3420', kind: 'คอมพิวเตอร์', qty: 1 },
  { tag: 'RFID-IT-0112', name: 'เครื่องพิมพ์ Canon G3010', kind: 'เครื่องใช้สำนักงาน', qty: 1 },
  { tag: 'RFID-IT-0207', name: 'Router TP-Link AC1200', kind: 'อุปกรณ์เครือข่าย', qty: 1 },
]
export const foundItems = (n: number): AssetRow[] =>
  Array.from({ length: n }, (_, i) => {
    const [name, kind] = catalog[(i * 7 + 3) % catalog.length]
    return { tag: `RFID-IT-${String(i * 3 + 1).padStart(4, '0')}`, name, kind, qty: 1 }
  })

export function toCsv(rows: AssetRow[]) {
  const head = 'ลำดับ,RFID Tag,ชื่อรายการพัสดุ,ประเภทพัสดุ,จำนวน (ชิ้น)'
  return '﻿' + [head, ...rows.map((r, i) => [i + 1, r.tag, `"${r.name}"`, r.kind, r.qty].join(','))].join('\n')
}
