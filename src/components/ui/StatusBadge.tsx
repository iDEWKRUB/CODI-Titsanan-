export type Status = 'Completed' | 'Pending' | 'Failed' | 'Ended' | 'Draft' | 'Approved'

// Figma Resource/Component › Badges › Badge Status v2 (76:2299)
const styles: Record<Status, string> = {
  Completed: 'bg-green font-medium text-green-bg',
  Pending: 'bg-blue-20 font-medium text-blue-00',
  Failed: 'bg-red-20 font-light text-red-00',
  Ended: 'bg-gray-10 font-light text-gray-bg',
  Draft: 'bg-gray-5 font-light text-gray-30',
  Approved: 'bg-green-bg font-light text-green-text',
}

export default function StatusBadge({ status, className = '' }: { status: Status; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 rounded-[4px] px-[6px] py-[2px] text-[10px] leading-[normal] whitespace-nowrap ${styles[status]} ${className}`}>
      {status}
    </span>
  )
}
