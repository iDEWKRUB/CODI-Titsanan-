import heroGlass from '../../assets/login/hero-glass.webp'

/**
 * Left brand panel (desktop only). Geometry follows Figma frame 1440×1024:
 * panel 702×973 at (32, 26), glass image clipped from y=181 to the panel bottom,
 * bleeding past the panel's left edge to the viewport edge.
 */
export default function HeroPanel() {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden w-[50.97%] max-w-[1040px] shrink-0 pt-[26px] pb-[25px] pl-[32px] lg:block"
    >
      <div className="relative h-full rounded-[25px] bg-gradient-to-b from-[#d3dcec] from-[15.673%] to-[#99accf]" />

      {/* Glass artwork */}
      <div className="pointer-events-none absolute top-[181px] right-0 bottom-[25px] left-0 overflow-hidden rounded-br-[25px]">
        <div className="absolute top-0 left-[-298px] flex h-[973.963px] w-[1434.097px] items-center justify-center">
          <div className="flex-none rotate-[12.51deg] -scale-y-100">
            <img
              src={heroGlass}
              alt=""
              className="h-[706.402px] w-[1312.202px] max-w-none object-cover"
            />
          </div>
        </div>
      </div>

      <p className="absolute top-[101px] left-[96px] w-[calc(100%-128px)] max-w-[597px] text-[36px] leading-[normal] text-[#4c4c4c]">
        เชื่อมการทำงานทุกมิติ
        <br />
        ด้วยความเร็วและความเข้าใจ
      </p>
    </aside>
  )
}
