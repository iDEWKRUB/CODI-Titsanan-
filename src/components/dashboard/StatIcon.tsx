import type { StatKey } from '../../data/dashboard'

// Multi-layer illustrations from Figma (city / archive / add-user / bank), positioned by inset %.
const layers = import.meta.glob<string>('../../assets/dashboard/stat-icons/*.svg', { eager: true, import: 'default' })
const g = (i: number) => layers[`../../assets/dashboard/stat-icons/g${i}.svg`]

const icons: Record<StatKey, { h: number; parts: [number, string][] }> = {
  councils: {
    h: 48,
    parts: [
      [0, '31.25% 15.63% 25% 50%'],
      [1, '12.5% 40.63% 25% 31.25%'],
      [2, '25% 56.25% 12.5% 15.63%'],
      [3, '57.81% 60.94% 37.5% 20.31%'],
      [3, '67.19% 60.94% 28.13% 20.31%'],
      [4, '76.56% 60.94% 18.75% 20.31%'],
      [3, '48.44% 60.94% 46.88% 20.31%'],
      [3, '39.06% 60.94% 56.25% 20.31%'],
      [3, '29.69% 60.94% 65.63% 20.31%'],
      [5, '43.75% 29.69% 12.5% 35.94%'],
      [6, '60.94% 35.94% 20.31% 59.38%'],
      [7, '54.69% 45.31% 20.31% 50%'],
      [8, '48.44% 54.69% 20.31% 40.63%'],
    ],
  },
  organizations: {
    h: 48,
    parts: [
      [9, '16.41% 12.5% 33.59% 25%'],
      [10, '25.78% 34.38% 42.97% 21.88%'],
      [11, '32.03% 29.69% 30.47% 17.19%'],
      [12, '39.84% 25% 16.41% 12.5%'],
    ],
  },
  members: {
    h: 47,
    parts: [
      [13, '20.88% 12.5% 29.12% 28.13%'],
      [14, '27.13% 18.75% 47.87% 56.25%'],
      [15, '62.28% 39.84% 16.62% 12.5%'],
      [16, '33.38% 51.56% 43.18% 24.22%'],
    ],
  },
  funds: {
    h: 48,
    parts: [
      [17, '17.97% 12.5% 32.03% 31.25%'],
      [18, '44.53% 32.81% 27.34% 20.31%'],
      [19, '44.53% 32.81% 27.34% 60.94%'],
      [20, '44.53% 42.19% 27.34% 51.56%'],
      [21, '44.53% 73.44% 27.34% 20.31%'],
      [20, '44.53% 64.06% 27.34% 29.69%'],
      [22, '30.47% 26.49% 58.59% 13.99%'],
      [23, '74.22% 29.69% 19.53% 17.19%'],
    ],
  },
}

export default function StatIcon({ kind }: { kind: StatKey }) {
  const { h, parts } = icons[kind]
  return (
    <div aria-hidden="true" className="relative w-[48px] shrink-0 overflow-hidden" style={{ height: h }}>
      {parts.map(([i, inset], idx) => (
        <div key={idx} className="absolute" style={{ inset }}>
          <img src={g(i)} alt="" className="absolute inset-0 block size-full max-w-none" />
        </div>
      ))}
    </div>
  )
}
