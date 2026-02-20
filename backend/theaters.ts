/**
 * Clawnema Theater Configuration
 *
 * Pre-configured theaters with YouTube livestream URLs and USDC pricing.
 * Add new theaters here to expand the cinema selection.
 */

export interface Theater {
  id: string;
  title: string;
  stream_url: string;
  ticket_price_usdc: number;
  description: string;
}

export const DEFAULT_THEATERS: Theater[] = [
  {
    id: 'seoul-drone-show',
    title: 'Seoul K-POP Drone Show Live',
    stream_url: 'https://www.youtube.com/watch?v=EByF2FWUoow',
    ticket_price_usdc: 0.042069,
    description: 'Watch the spectacular K-POP Demon Hunters drone show live from Seoul, South Korea.'
  },
  {
    id: 'jazz-cafe',
    title: 'Spring Jazz at Lakeside Café',
    stream_url: 'https://www.youtube.com/watch?v=UZiKR5HHXTo',
    ticket_price_usdc: 0.042069,
    description: 'Relax with soothing spring jazz music at a tranquil lakeside café ambience.'
  },
  {
    id: 'kenya-wildlife',
    title: 'Kenya Wildlife Safari Live',
    stream_url: 'https://www.youtube.com/watch?v=XsOU8JnEpNM',
    ticket_price_usdc: 0.042069,
    description: 'Live wildlife cam from ol Donyo Lodge in the Chyulu Hills between Tsavo and Amboseli, Kenya.'
  },
  {
    id: 'times-square-4k',
    title: 'EarthCam: Times Square 4K',
    stream_url: 'https://www.youtube.com/watch?v=rnXIjl_Rzy4',
    ticket_price_usdc: 0.042069,
    description: 'Aerial 4K live view of the most visited spot in New York City — Times Square.'
  },
  {
    id: 'fresno-traffic-cam',
    title: 'Traffic Cam: Fresno, California',
    stream_url: 'https://www.youtube.com/watch?v=1xl0hX-nF2E',
    ticket_price_usdc: 0.042069,
    description: 'Live traffic camera at Friant & Shepherd intersection in Fresno, CA — with police scanner audio.'
  },
  {
    id: 'spacex-lunar-launch',
    title: 'NASA x SpaceX: Dual Lunar Mission Launch',
    stream_url: 'https://www.youtube.com/watch?v=mXqfi6csKMQ',
    ticket_price_usdc: 0.042069,
    description: 'LIVE: SpaceX Falcon 9 launching Blue Ghost and Resilience lunar landers from Kennedy Space Center — two Moon missions on one rocket.'
  }
];

/**
 * Initialize theaters in the database.
 * Only adds missing defaults — never deletes admin-added theaters.
 */
export async function seedTheaters(db: any): Promise<void> {
  const existingTheaters = db.theaters.getAll();
  const existingMap = new Map(existingTheaters.map((t: any) => [t.id, t]));

  for (const theater of DEFAULT_THEATERS) {
    if (!existingMap.has(theater.id)) {
      db.theaters.create(theater);
      console.log(`Seeded theater: ${theater.title}`);
    } else {
      // Update price and other fields to match config
      const existing = existingMap.get(theater.id);
      if (existing.ticket_price_usdc !== theater.ticket_price_usdc ||
          existing.title !== theater.title ||
          existing.stream_url !== theater.stream_url) {
        db.theaters.update(theater.id, theater);
        console.log(`Updated theater: ${theater.title}`);
      }
    }
  }
}

export default DEFAULT_THEATERS;
