import type { ReactNode } from 'react'

/**
 * Elyon icon vocabulary: 1.5 px stroke line icons on a 24 grid. Every icon draws in via
 * stroke-dashoffset (class "draw") and carries one inner element with an idle loop so nothing
 * on screen ever sits perfectly still. Exported to public/icons/sprite.svg by scripts/build-sprite.mjs.
 */
export const ICONS: Record<string, ReactNode> = {
  // Brand elements
  precision: (<><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="1.2" className="fill idle-pulse" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /></>),
  technology: (<><line x1="6" y1="21" x2="6" y2="10" /><line x1="12" y1="21" x2="12" y2="6" /><line x1="18" y1="21" x2="18" y2="12" /><circle cx="6" cy="8" r="2" className="idle-blink" /><circle cx="12" cy="4" r="2" /><circle cx="18" cy="10" r="2" className="idle-blink" /></>),
  data: (<><ellipse cx="12" cy="6" rx="7" ry="2.5" /><path d="M5 6v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" /><path d="M5 12v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" className="idle-stack" /></>),
  elevation: (<><path d="M3 20L10 8l4 6 2-3 5 9" /><path d="M12 2v5" className="idle-rise" /><path d="M9.5 4.5L12 2l2.5 2.5" className="idle-rise" /></>),
  // The mark's four symbols
  aerial: (<><path d="M2 7l10 5 10-5" /><path d="M2 7l10 10 10-10" /><circle cx="12" cy="12" r="1" className="fill idle-pulse" /></>),
  built: (<><rect x="3" y="10" width="6" height="11" /><rect x="9" y="4" width="7" height="17" /><rect x="16" y="13" width="5" height="8" /><line x1="12" y1="8" x2="13" y2="8" className="idle-blink" /><line x1="12" y1="12" x2="13" y2="12" /><line x1="12" y1="16" x2="13" y2="16" className="idle-blink" /></>),
  lidarPoints: (<g className="idle-pulse"><circle cx="12" cy="12" r="1" className="fill" /><circle cx="6" cy="8" r="0.9" className="fill" /><circle cx="18" cy="8" r="0.9" className="fill" /><circle cx="8" cy="16" r="0.9" className="fill" /><circle cx="16" cy="16" r="0.9" className="fill" /><circle cx="12" cy="5" r="0.7" className="fill" /><circle cx="12" cy="19" r="0.7" className="fill" /><circle cx="5" cy="13" r="0.7" className="fill" /><circle cx="19" cy="13" r="0.7" className="fill" /></g>),
  aiData: (<><path d="M12 2l8.7 5v10L12 22l-8.7-5V7z" /><circle cx="12" cy="12" r="2.2" /><path d="M12 9.8V6" className="idle-blink" /><path d="M14 13l3 1.8" /><path d="M10 13l-3 1.8" className="idle-blink" /></>),
  // Services
  lidarScan: (<><path d="M4 7h4l2-2h4l2 2h4" /><circle cx="6" cy="7" r="1.6" /><circle cx="18" cy="7" r="1.6" /><rect x="10" y="7" width="4" height="3" /><path d="M8 11l-3 10M16 11l3 10" className="idle-pulse" /><circle cx="12" cy="16" r="0.7" className="fill idle-drop" /><circle cx="10" cy="19" r="0.7" className="fill idle-drop" /><circle cx="14" cy="19" r="0.7" className="fill idle-drop" /></>),
  surveying: (<><rect x="3" y="4" width="18" height="12" rx="1.5" /><line x1="12" y1="16" x2="12" y2="20" /><line x1="8" y1="20" x2="16" y2="20" /><path d="M7 13v-3M10 13V8M13 13v-2M16 13V7" className="idle-rise" /></>),
  processing: (<><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" className="idle-stack" /><path d="M3 17l9 5 9-5" /></>),
  aiPlatform: (<><path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 3 3 3 0 0 0 2 3v1a3 3 0 0 0 3 3h3V4z" /><path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 3 3 3 0 0 1-2 3v1a3 3 0 0 1-3 3h-3V4z" /><path d="M9 9h2M8 13h3M15 9h-2M16 13h-3" className="idle-blink" /></>),
  digitalTwin: (<><path d="M4 20V9l5-3v14" /><path d="M9 20V6l6 3v11" /><path d="M15 20V9l5 3v8" /><line x1="2" y1="20" x2="22" y2="20" /><path d="M4 13h5M9 11h6M15 14h5" className="idle-blink" /></>),
  industries: (<><circle cx="12" cy="7" r="3" /><circle cx="5" cy="10" r="2.2" /><circle cx="19" cy="10" r="2.2" /><path d="M7 20v-3a5 5 0 0 1 10 0v3" /><path d="M2 20v-2a3 3 0 0 1 3-3M22 20v-2a3 3 0 0 0-3-3" className="idle-pulse" /></>),
  // HUD and data
  altitude: (<><path d="M4 20h16" /><path d="M12 17V5" /><path d="M8.5 8.5L12 5l3.5 3.5" className="idle-rise" /><path d="M6 14h3M15 14h3M7 10h2M15 10h2" /></>),
  satellite: (<><rect x="9" y="9" width="6" height="6" transform="rotate(45 12 12)" /><path d="M3 9l4 4M9 3l4 4M17 13l4 4M13 17l4 4" /><path d="M16 4a4 4 0 0 1 4 4" className="idle-blink" /><path d="M17 2a6 6 0 0 1 5 5" className="idle-blink" /></>),
  battery: (<><rect x="2" y="7" width="18" height="10" rx="2" /><path d="M22 10v4" /><path d="M5 10v4M8 10v4M11 10v4M14 10v4" className="idle-blink" /></>),
  heading: (<><circle cx="12" cy="12" r="9" /><path d="M15 9l-2 6-4 2 2-6z" className="idle-sweep" /><circle cx="12" cy="12" r="0.8" className="fill" /></>),
  wind: (<><path d="M3 8h11a3 3 0 1 0-3-3" className="idle-scan" /><path d="M3 12h16a3 3 0 1 1-3 3" /><path d="M3 16h8a2 2 0 1 1-2 2" className="idle-scan" /></>),
  points: (<><circle cx="12" cy="12" r="1.2" className="fill idle-pulse" /><circle cx="6" cy="6" r="1" className="fill" /><circle cx="18" cy="6" r="1" className="fill" /><circle cx="6" cy="18" r="1" className="fill" /><circle cx="18" cy="18" r="1" className="fill" /><path d="M7 7l4 4M17 7l-4 4M7 17l4-4M17 17l-4-4" /></>),
  density: (<><rect x="3" y="3" width="18" height="18" rx="2" /><g className="idle-pulse"><circle cx="8" cy="8" r="0.9" className="fill" /><circle cx="12" cy="8" r="0.9" className="fill" /><circle cx="16" cy="8" r="0.9" className="fill" /><circle cx="8" cy="12" r="0.9" className="fill" /><circle cx="12" cy="12" r="0.9" className="fill" /><circle cx="16" cy="12" r="0.9" className="fill" /><circle cx="8" cy="16" r="0.9" className="fill" /><circle cx="12" cy="16" r="0.9" className="fill" /><circle cx="16" cy="16" r="0.9" className="fill" /></g></>),
  accuracy: (<><path d="M4 20h16" /><path d="M12 20V7" /><path d="M8 11l4-4 4 4" /><path d="M6 15h12" className="idle-rise" /><path d="M9 4h6" /></>),
  swath: (<><path d="M12 4v4" /><circle cx="12" cy="3" r="1" /><path d="M12 8L4 20M12 8l8 12" /><path d="M4 20h16" className="idle-scan" /><path d="M7 15.5h10" className="idle-blink" /></>),
  area: (<><path d="M4 6l6-2 6 3 4-1v12l-4 1-6-3-6 2z" /><path d="M10 4v13M16 7v13" className="idle-blink" /></>),
  pulses: (<><path d="M2 12h4l2-6 3 12 3-9 2 3h6" className="idle-flow" /></>),
  buildings: (<><rect x="3" y="11" width="5" height="10" /><rect x="8" y="5" width="8" height="16" /><rect x="16" y="9" width="5" height="12" /><path d="M11 9h2M11 13h2M11 17h2" className="idle-blink" /></>),
  roads: (<><path d="M5 21L9 3h6l4 18" /><path d="M12 5v3M12 11v3M12 17v3" className="idle-flow" /></>),
  vegetation: (<><path d="M12 21v-7" /><path d="M12 14c-4 0-7-3-7-7 4 0 7 3 7 7z" /><path d="M12 14c4 0 7-3 7-7-4 0-7 3-7 7z" className="idle-sweep" /><path d="M12 10V3" /></>),
  power: (<><path d="M13 2L5 14h6l-1 8 8-12h-6z" className="idle-blink" /></>),
  water: (<><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" /><path d="M9 14a3 3 0 0 0 3 3" className="idle-pulse" /></>),
  terrain: (<><path d="M3 18c3-6 6-6 9 0s6 6 9 0" /><path d="M3 14c3-6 6-6 9 0s6 6 9 0" className="idle-scan" /><path d="M3 10c3-6 6-6 9 0s6 6 9 0" /></>),
  contours: (<><ellipse cx="12" cy="13" rx="9" ry="6" /><ellipse cx="12" cy="13" rx="6" ry="3.8" className="idle-pulse" /><ellipse cx="12" cy="13" rx="3" ry="1.8" /></>),
  // Sensors
  occupancy: (<><circle cx="9" cy="7" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2" /><circle cx="17" cy="9" r="2" className="idle-blink" /><path d="M21 20v-2a4 4 0 0 0-4-4" /></>),
  hvac: (<><circle cx="12" cy="12" r="3" /><g className="idle-spin"><path d="M12 9V3M12 21v-6M9 12H3M21 12h-6" /><path d="M9.9 9.9L5.6 5.6M18.4 18.4l-4.3-4.3M14.1 9.9l4.3-4.3M5.6 18.4l4.3-4.3" /></g></>),
  energy: (<><circle cx="12" cy="13" r="8" /><path d="M12 13l4-4" className="idle-sweep" /><circle cx="12" cy="13" r="1" className="fill" /><path d="M7 16h2M15 16h2" /></>),
  lift: (<><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M12 3v18" /><path d="M8 11l-1.5 1.5M8 11l1.5 1.5M8 11v3" className="idle-rise" /><path d="M16 13l-1.5-1.5M16 13l1.5-1.5M16 13v-3" /></>),
  fire: (<><path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-3-1-6-3-8-1 4-5 7-5 12 0 4 3 7 7 7z" /><path d="M12 22c-2 0-3-1.5-3-3.5S11 15 12 13c1 2 3 3.5 3 5.5S14 22 12 22z" className="idle-pulse" /></>),
  // Industries
  agriculture: (<><path d="M3 20h18" /><path d="M5 20c0-5 1-9 4-9" /><path d="M9 20c0-4 1-7 3-7" className="idle-sweep" /><path d="M13 20c0-5 2-9 5-9" /><path d="M17 20c0-3 1-5 3-5" /></>),
  corridor: (<><path d="M4 21L10 3h4l6 18" /><path d="M12 7v2M12 12v2M12 17v2" className="idle-flow" /><path d="M2 13h4M18 13h4" /></>),
  mining: (<><path d="M3 20l5-10 4 6 3-4 6 8z" /><path d="M8 10l2-4" className="idle-blink" /><path d="M4 20h16" /></>),
  powerline: (<><path d="M12 2v20" /><path d="M5 7h14M7 11h10" /><path d="M5 7q3.5 4 7 4t7-4" className="idle-rise" /><path d="M8 2l-3 5M16 2l3 5" /></>),
  dam: (<><path d="M3 20h18" /><path d="M6 20V8h12v12" /><path d="M6 12h12M6 16h12" /><path d="M18 10c2 0 3 1 3 3v7" className="idle-rise" /></>),
  forestry: (<><path d="M12 3l5 7h-3l4 5h-5v6h-2v-6H6l4-5H7z" /><path d="M9 18h6" className="idle-pulse" /></>),
  heritage: (<><path d="M4 21h16" /><path d="M5 21V9l7-6 7 6v12" /><path d="M9 21v-6h6v6" /><path d="M12 9v3M10.5 10.5h3" className="idle-blink" /></>),
  // Data stack
  pointcloud: (<><g className="idle-pulse"><circle cx="5" cy="17" r="1" className="fill" /><circle cx="9" cy="12" r="1" className="fill" /><circle cx="13" cy="15" r="1" className="fill" /><circle cx="17" cy="9" r="1" className="fill" /><circle cx="19" cy="16" r="1" className="fill" /><circle cx="7" cy="7" r="1" className="fill" /><circle cx="12" cy="6" r="1" className="fill" /></g></>),
  dsm: (<><path d="M3 19h18" /><path d="M3 15l4-6 4 3 3-7 4 5 3-2" className="idle-rise" /></>),
  dtm: (<><path d="M3 19h18" /><path d="M3 15c4-5 8-5 12-1s4 2 6 0" className="idle-scan" /></>),
  ortho: (<><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" className="idle-blink" /></>),
  mesh: (<><path d="M4 18L9 5l6 4 5-3-3 12z" /><path d="M9 5l3 13M15 9l-3 9M4 18h17" className="idle-blink" /></>),
  bim: (<><path d="M4 21V9l8-5 8 5v12" /><path d="M4 9l8 5 8-5M12 14v7" /><path d="M8 11.5v6M16 11.5v6" className="idle-blink" /></>),
  cadastre: (<><path d="M3 4h8v8H3zM11 4h10v5H11zM3 12h5v8H3zM8 12h13v8H8z" /><circle cx="15" cy="16" r="1.2" className="fill idle-pulse" /></>),
  sensors: (<><circle cx="12" cy="14" r="2" /><path d="M8 10a6 6 0 0 1 8 0" className="idle-pulse" /><path d="M5 7a10 10 0 0 1 14 0" className="idle-pulse" /><path d="M12 16v5" /></>),
  // Misc
  verified: (<><circle cx="12" cy="12" r="9" /><path d="M7.5 12.5l3 3 6-6" className="idle-blink" /></>),
  stamp: (<><path d="M12 3a3 3 0 0 0-3 3c0 2 1 3 1 5H8a3 3 0 0 0-3 3v2h14v-2a3 3 0 0 0-3-3h-2c0-2 1-3 1-5a3 3 0 0 0-3-3z" /><path d="M5 20h14" className="idle-blink" /></>),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" className="idle-pulse" /></>),
  pin: (<><path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" className="idle-pulse" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" className="idle-scan" /></>),
  sound: (<><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6" className="idle-pulse" /><path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" className="idle-pulse" /></>),
  soundOff: (<><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M17 9l4 6M21 9l-4 6" /></>),
  drone: (<><rect x="9" y="10" width="6" height="4" rx="1" /><path d="M9 12H4M15 12h5" /><path d="M2 9h4M18 9h4" className="idle-spin" /><circle cx="4" cy="9" r="0.6" className="fill" /><circle cx="20" cy="9" r="0.6" className="fill" /><path d="M11 14l-1 3M13 14l1 3" /><circle cx="12" cy="16" r="0.8" className="fill idle-drop" /></>),
  scanToBim: (<><path d="M3 20V8l6-4v16" /><path d="M9 20V4l6 3v13" /><path d="M15 20V8l6 2v10" /><path d="M3 12h18" className="idle-scan" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" className="idle-sweep" /></>),
  hectares: (<><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M4 12h16M12 4v16" className="idle-blink" /><circle cx="8" cy="8" r="0.8" className="fill" /><circle cx="16" cy="16" r="0.8" className="fill" /></>),
  projects: (<><path d="M3 7h6l2 2h10v11H3z" /><path d="M7 14h6" className="idle-scan" /></>),
  arrow: (<><path d="M5 12h14" /><path d="M13 6l6 6-6 6" className="idle-scan" /></>),
  flood: (<><path d="M3 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0" className="idle-scan" /><path d="M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /><path d="M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" className="idle-scan" /></>),
  solar: (<><circle cx="12" cy="12" r="4" /><g className="idle-spin"><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" /></g></>),
}

export type IconName = keyof typeof ICONS
export const ICON_NAMES = Object.keys(ICONS) as IconName[]
