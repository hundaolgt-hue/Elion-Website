/**
 * Founders, from the details supplied with the brief. Portraits: drop the files at
 * /public/founders/hundaol.jpg and /public/founders/dagim.jpg (4:5, at least 960 px wide);
 * until a file exists the card shows the LiDAR sweep over a point field instead of a photo.
 */
export interface Founder {
  id: string
  n: string
  first: string
  last: string
  role: string
  bio: string
  portrait: string
  alt: string
  facts: { icon: string; label: string; value: string }[]
  projects: { title: string; place: string; icon: string }[]
}

export const FOUNDERS: Founder[] = [
  {
    id: 'hundaol',
    n: '01',
    first: 'Hundaol',
    last: 'Girma',
    role: 'Architect and Urban Planner',
    bio: 'Hundaol Girma is an architect and urban planner whose work spans the scales Elyon flies: a cultural center in Addis Ababa, a master plan for Hawassa and a mixed-use complex in Bishoftu. Hundaol brings the planner’s questions to every flight, what a city needs to know about itself before it builds, and turns LiDAR data into plans, drawings and decisions that municipalities, developers and institutions can act on.',
    portrait: '/founders/hundaol.jpg',
    alt: 'Portrait of Hundaol Girma, architect and urban planner, co-founder of Elyon Aerial Services',
    facts: [
      { icon: 'built', label: 'Discipline', value: 'Architecture' },
      { icon: 'cadastre', label: 'Discipline', value: 'Urban planning' },
      { icon: 'projects', label: 'Featured projects', value: '3' },
    ],
    projects: [
      { title: 'Cultural Center', place: 'Addis Ababa', icon: 'heritage' },
      { title: 'Master Plan', place: 'Hawassa', icon: 'cadastre' },
      { title: 'Mixed-Use Complex', place: 'Bishoftu', icon: 'buildings' },
    ],
  },
  {
    id: 'dagim',
    n: '02',
    first: 'Dagim',
    last: 'Girma',
    role: 'Captain at Ethiopian Airlines',
    bio: 'Dagim Girma is a Captain at Ethiopian Airlines and a dedicated aviator with a passion for safety, leadership, and connecting Ethiopia to the world. At Elyon, Dagim brings the cockpit’s discipline of planning, checklists and airspace awareness to the flight side of the company, so that every survey over a city, a building or a corridor is flown to an airline standard.',
    portrait: '/founders/dagim.jpg',
    alt: 'Portrait of Dagim Girma, Captain at Ethiopian Airlines, co-founder of Elyon Aerial Services',
    facts: [
      { icon: 'aerial', label: 'Rank', value: 'Captain' },
      { icon: 'globe', label: 'Airline', value: 'Ethiopian Airlines' },
      { icon: 'precision', label: 'Focus', value: 'Safety and leadership' },
    ],
    projects: [
      { title: 'Flight operations', place: 'Elyon Aerial Services', icon: 'drone' },
      { title: 'Safety and leadership', place: 'Ethiopian Airlines', icon: 'precision' },
      { title: 'Connecting Ethiopia', place: 'to the world', icon: 'globe' },
    ],
  },
]
