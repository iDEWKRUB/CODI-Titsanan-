export type LoanOrg = { id: string; name: string; contractNo: string; loanType: string; form: string; subdistrict: string; district: string; province: string; fund: string }

export const loanOrgs: LoanOrg[] = [
  { id: 'o1', name: 'กลุ่มออมทรัพย์บ้านแม่นาจร', contractNo: 'ส.2568/0142', loanType: 'สินเชื่อเพื่อที่อยู่อาศัย', form: 'สัญญากู้ยืมเงินแบบมีหลักประกัน', subdistrict: 'แม่นาจร', district: 'แม่แจ่ม', province: 'เชียงใหม่', fund: 'กองทุนที่อยู่อาศัย' },
  { id: 'o2', name: 'สหกรณ์เคหสถานชุมชนบ้านมั่นคงริมคลอง', contractNo: 'ส.2567/0388', loanType: 'สินเชื่อเพื่อที่อยู่อาศัย', form: 'สัญญากู้ยืมเงินแบบไม่มีหลักประกัน', subdistrict: 'บางบอน', district: 'บางบอน', province: 'กรุงเทพมหานคร', fund: 'กองทุนที่อยู่อาศัย' },
  { id: 'o3', name: 'เครือข่ายวิสาหกิจชุมชนตำบลแม่แฝก', contractNo: 'ส.2568/0057', loanType: 'สินเชื่อเพื่อการประกอบอาชีพ', form: 'สัญญากู้ยืมเงินแบบมีหลักประกัน', subdistrict: 'แม่แฝก', district: 'สันทราย', province: 'เชียงใหม่', fund: 'กองทุนพัฒนาอาชีพ' },
  { id: 'o4', name: 'กลุ่มสวัสดิการชุมชนบ้านโป่ง', contractNo: 'ส.2566/0911', loanType: 'สินเชื่อเพื่อสวัสดิการชุมชน', form: 'สัญญากู้ยืมเงินแบบไม่มีหลักประกัน', subdistrict: 'โป่ง', district: 'บ้านโป่ง', province: 'ราชบุรี', fund: 'กองทุนสวัสดิการชุมชน' },
]
export const loanTypes = ['สินเชื่อเพื่อที่อยู่อาศัย', 'สินเชื่อเพื่อการประกอบอาชีพ', 'สินเชื่อเพื่อสวัสดิการชุมชน']
export const contractForms = ['สัญญากู้ยืมเงินแบบมีหลักประกัน', 'สัญญากู้ยืมเงินแบบไม่มีหลักประกัน']
export const funds = ['กองทุนที่อยู่อาศัย', 'กองทุนพัฒนาอาชีพ', 'กองทุนสวัสดิการชุมชน']
export const banks = ['ธนาคารออมสิน', 'ธนาคารกรุงไทย', 'ธนาคารกรุงเทพ', 'ธนาคารกสิกรไทย', 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)']
export const payTypes = ['โอนเข้าบัญชีองค์กร', 'เช็คสั่งจ่าย', 'เงินสด']
export const accountTypes = ['ออมทรัพย์', 'กระแสรายวัน']
export const positions = ['ประธานกลุ่ม', 'รองประธาน', 'เลขานุการ', 'เหรัญญิก', 'ผู้อำนวยการ พอช.']

export type Debt = { contractNo: string; org: string; project: string; loanType: string; approved: string; signed: string; principal: number; interest: number; fine: number; balance: number; status: string }
export const debts: Debt[] = [
  { contractNo: 'ส.2568/0142', org: 'กลุ่มออมทรัพย์บ้านแม่นาจร', project: 'โครงการบ้านมั่นคง แม่นาจร', loanType: 'สินเชื่อเพื่อที่อยู่อาศัย', approved: '2025-03-12', signed: '2025-03-28', principal: 1_200_000, interest: 14_800, fine: 0, balance: 960_000, status: 'ปกติ' },
  { contractNo: 'ส.2567/0388', org: 'สหกรณ์เคหสถานชุมชนบ้านมั่นคงริมคลอง', project: 'โครงการบ้านมั่นคงริมคลอง', loanType: 'สินเชื่อเพื่อที่อยู่อาศัย', approved: '2024-07-02', signed: '2024-07-19', principal: 3_450_000, interest: 82_300, fine: 6_150, balance: 2_780_000, status: 'ค้างชำระ' },
  { contractNo: 'ส.2568/0057', org: 'เครือข่ายวิสาหกิจชุมชนตำบลแม่แฝก', project: 'โครงการส่งเสริมอาชีพ แม่แฝก', loanType: 'สินเชื่อเพื่อการประกอบอาชีพ', approved: '2025-01-20', signed: '2025-02-04', principal: 650_000, interest: 5_200, fine: 0, balance: 420_000, status: 'ปกติ' },
  { contractNo: 'ส.2566/0911', org: 'กลุ่มสวัสดิการชุมชนบ้านโป่ง', project: 'โครงการสวัสดิการชุมชน', loanType: 'สินเชื่อเพื่อสวัสดิการชุมชน', approved: '2023-05-08', signed: '2023-05-30', principal: 800_000, interest: 0, fine: 0, balance: 0, status: 'ปิดบัญชี' },
]
