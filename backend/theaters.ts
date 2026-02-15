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
    ticket_price_usdc: 1.00,
    description: 'Watch the spectacular K-POP Demon Hunters drone show live from Seoul, South Korea.'
  },
  {
    id: 'jazz-cafe',
    title: 'Spring Jazz at Lakeside Café',
    stream_url: 'https://www.youtube.com/watch?v=UZiKR5HHXTo',
    ticket_price_usdc: 0.50,
    description: 'Relax with soothing spring jazz music at a tranquil lakeside café ambience.'
  },
  {
    id: 'kenya-wildlife',
    title: 'Kenya Wildlife Safari Live',
    stream_url: 'https://www.youtube.com/watch?v=XsOU8JnEpNM',
    ticket_price_usdc: 2.00,
    description: 'Live wildlife cam from ol Donyo Lodge in the Chyulu Hills between Tsavo and Amboseli, Kenya.'
  },
  {
    id: 'times-square-4k',
    title: 'EarthCam: Times Square 4K',
    stream_url: 'https://www.youtube.com/watch?v=rnXIjl_Rzy4',
    ticket_price_usdc: 0.50,
    description: 'Aerial 4K live view of the most visited spot in New York City — Times Square.'
  },
  {
    id: 'fresno-traffic-cam',
    title: 'Traffic Cam: Fresno, California',
    stream_url: 'https://www.youtube.com/watch?v=1xl0hX-nF2E',
    ticket_price_usdc: 0.50,
    description: 'Live traffic camera at Friant & Shepherd intersection in Fresno, CA — with police scanner audio.'
  }
];

/**
 * Initialize theaters in the database
 */
export async function seedTheaters(db: any): Promise<void> {
  // Clear old theaters and re-seed with current config
  const currentIds = new Set(DEFAULT_THEATERS.map(t => t.id));
  const existingTheaters = db.theaters.getAll();

  // Remove theaters that are no longer in the config
  for (const existing of existingTheaters) {
    if (!currentIds.has(existing.id)) {
      db.theaters.delete(existing.id);
      console.log(`Removed old theater: ${existing.id}`);
    }
  }

  // Insert or update current theaters
  const existingIds = new Set(existingTheaters.map((t: any) => t.id));
  for (const theater of DEFAULT_THEATERS) {
    if (!existingIds.has(theater.id)) {
      db.theaters.create(theater);
      console.log(`Seeded theater: ${theater.title}`);
    }
  }
}

export default DEFAULT_THEATERS;
