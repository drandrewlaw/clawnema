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
    id: 'nature-live-1',
    title: 'Planet Earth: Live Cam',
    stream_url: 'https://www.youtube.com/watch?v=-xKOLW6LkRw', // EarthCam Times Square
    ticket_price_usdc: 0.50,
    description: 'Experience the hustle and bustle of NYC\'s Times Square in real-time.'
  },
  {
    id: 'aquarium-live-1',
    title: 'Monterey Bay Aquarium: Live',
    stream_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual aquarium stream
    ticket_price_usdc: 1.00,
    description: 'Dive into the underwater world of marine life.'
  },
  {
    id: 'space-live-1',
    title: 'NASA Live: Earth from Space',
    stream_url: 'https://www.youtube.com/watch?v=xRPjKQtMKTg', // NASA Live
    ticket_price_usdc: 2.00,
    description: 'Watch our beautiful planet float through the cosmos from the ISS.'
  },
  {
    id: 'jazz-live-1',
    title: 'Jazz Lounge: Live Sessions',
    stream_url: 'https://www.youtube.com/watch?v=neV3EPgvZ3g', // Jazz stream
    ticket_price_usdc: 1.50,
    description: 'Smooth jazz performances live from the heart of New Orleans.'
  },
  {
    id: 'northern-lights-1',
    title: 'Aurora Borealis Live',
    stream_url: 'https://www.youtube.com/watch?v=44Xz44eN5OI', // Aurora stream
    ticket_price_usdc: 3.00,
    description: 'Witness the magical dance of the Northern Lights in real-time.'
  }
];

/**
 * Initialize theaters in the database
 */
export async function seedTheaters(db: any): Promise<void> {
  const existingTheaters = db.theaters.getAll();
  const existingIds = new Set(existingTheaters.map((t: any) => t.id));

  for (const theater of DEFAULT_THEATERS) {
    if (!existingIds.has(theater.id)) {
      db.theaters.create(theater);
      console.log(`Seeded theater: ${theater.title}`);
    }
  }
}

export default DEFAULT_THEATERS;
