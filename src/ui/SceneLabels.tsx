import { SceneLabel } from '@/ui/primitives'

/** All section labels live in one unpositioned layer so `position: fixed` is never trapped inside a transformed panel */
export function SceneLabels() {
  return (
    <>
      <SceneLabel n="01" text="Aerial precision" a={4.6} b={12.5} />
      <SceneLabel n="02" text="LiDAR drone scans" a={12.6} b={21.8} />
      <SceneLabel n="02b" text="Touch the data" a={22.4} b={27.8} />
      <SceneLabel n="03" text="Digital twin" a={28.3} b={32} />
      <SceneLabel n="04" text="AI data platform" a={32.3} b={36} />
      <SceneLabel n="05" text="Scan to BIM" a={40.6} b={54.2} />
      <SceneLabel n="06" text="Live twin" a={55.2} b={61.8} />
      <SceneLabel n="07" text="3D cadastre" a={63.6} b={71.8} />
      <SceneLabel n="08" text="For all industries" a={72.6} b={84} />
      <SceneLabel n="09" text="End to end" a={84.6} b={91.8} />
      <SceneLabel n="10" text="Landing" a={92.4} b={97} className="!text-elyon" />
    </>
  )
}
