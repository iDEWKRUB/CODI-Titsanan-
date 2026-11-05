// Six certificate looks (the Figma template thumbnails are photos, so these are drawn here).
const looks = [
  { a: '#1ea7e1', b: '#e6f6fd', ink: '#0b5a85' },
  { a: '#0e7c86', b: '#e5f6f6', ink: '#0a4f56' },
  { a: '#2b4fc9', b: '#e9eefc', ink: '#1b2f85' },
  { a: '#b7791f', b: '#fbf1dc', ink: '#74490c' },
  { a: '#7b3fb5', b: '#f1e8fa', ink: '#4b2373' },
  { a: '#c2412d', b: '#fdece8', ink: '#7f2517' },
]

type Props = { index: number; course?: string; name?: string; date?: string; signer?: string; className?: string }

/** A4-landscape certificate as an SVG so it scales to thumbnails and the preview dialog alike */
export default function CertTemplate({ index, course = 'ชื่อหลักสูตร', name = 'ชื่อ นามสกุล', date = '', signer = '', className = '' }: Props) {
  const l = looks[index % looks.length]
  return (
    <svg viewBox="0 0 400 283" role="img" aria-label={`ใบรับรอง ${course}`} className={className}>
      <rect width="400" height="283" fill="#fff" />
      <rect x="10" y="10" width="380" height="263" fill={l.b} stroke={l.a} strokeWidth="3" rx="4" />
      <rect x="20" y="20" width="360" height="243" fill="none" stroke={l.a} strokeWidth="1" strokeDasharray="4 3" rx="2" />
      <path d="M10 10h110l-40 36H10Z M390 273H280l40-36h70Z" fill={l.a} opacity="0.85" />
      <circle cx="200" cy="52" r="16" fill={l.a} />
      <path d="m194 52 4 4 8-9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <text x="200" y="92" textAnchor="middle" fontFamily="Prompt, sans-serif" fontWeight="700" fontSize="22" letterSpacing="3" fill={l.ink}>
        CERTIFICATE
      </text>
      <text x="200" y="110" textAnchor="middle" fontFamily="Prompt, sans-serif" fontSize="9" fill={l.ink}>
        ใบรับรองฉบับนี้ให้ไว้เพื่อแสดงว่า
      </text>
      <text x="200" y="144" textAnchor="middle" fontFamily="Prompt, sans-serif" fontWeight="600" fontSize="22" fill={l.a}>
        {name}
      </text>
      <line x1="110" y1="152" x2="290" y2="152" stroke={l.a} strokeWidth="0.8" />
      <text x="200" y="172" textAnchor="middle" fontFamily="Prompt, sans-serif" fontSize="9" fill={l.ink}>
        ได้ผ่านการอบรมหลักสูตร
      </text>
      <text x="200" y="190" textAnchor="middle" fontFamily="Prompt, sans-serif" fontWeight="600" fontSize="12" fill={l.ink}>
        {course.length > 52 ? course.slice(0, 50) + '…' : course}
      </text>
      <text x="200" y="208" textAnchor="middle" fontFamily="Prompt, sans-serif" fontSize="8.5" fill={l.ink}>
        {date ? `ให้ไว้ ณ วันที่ ${date}` : ''}
      </text>
      <line x1="150" y1="240" x2="250" y2="240" stroke={l.ink} strokeWidth="0.6" />
      <text x="200" y="251" textAnchor="middle" fontFamily="Prompt, sans-serif" fontSize="8" fill={l.ink}>
        {signer || 'ผู้ลงนาม'}
      </text>
    </svg>
  )
}
