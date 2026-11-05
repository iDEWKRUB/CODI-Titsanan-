// Mock profile data (read-only; will come from the HR/user API)
export const profile = {
  firstName: 'ปรียาดา',
  lastName: 'เจริญรัตนะ',
  birthDate: '1995-10-31',
  position: 'พนักงานธุรการทั่วไป',
  office: 'สำนักพัฒนาที่อยู่อาศัยชุมชนริมราง',
}

export const loginHistory = [
  { id: 1, date: '2025.11.26', platform: 'บริหารโครงการ', time: '12:23', browser: 'Chrome', device: 'Desktop' as const },
  { id: 2, date: '2025.11.25', platform: 'จัดการสัญญา', time: '09:00', browser: 'iOS', device: 'Mobile' as const },
]
