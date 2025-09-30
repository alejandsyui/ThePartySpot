import type { ImageContent } from './types.js'

export const defaultImageContent: ImageContent = {
  hero: {
    primary: {
      id: 'hero-primary',
      label: 'Main hero banner',
      url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1600&q=80',
      alt: 'Confetti falling over a lively dance floor',
      credit: 'Unsplash · Nicholas Green'
    },
    secondary: {
      id: 'hero-secondary',
      label: 'Supporting hero image',
      url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      alt: 'Team preparing a birthday event with balloons and streamers',
      credit: 'Unsplash · Hannah Busing'
    }
  },
  spotlights: [
    {
      id: 'kids-birthday-magic',
      label: 'Kids Birthday Magic',
      description: 'Balloon garlands, photo booths, and themed decor delivered turnkey.',
      url: 'https://images.unsplash.com/photo-1603575409264-ef899475b1d9?auto=format&fit=crop&w=1000&q=80',
      alt: 'Children celebrating a birthday party with balloons',
      credit: 'Unsplash · Jude Beck'
    },
    {
      id: 'corporate-happy-hour',
      label: 'Corporate Happy Hour',
      description: 'Polished lighting, lounge seating, and AV support for mixers and workshops.',
      url: 'https://images.unsplash.com/photo-1530023367847-a683933f4177?auto=format&fit=crop&w=1000&q=80',
      alt: 'Coworkers enjoying a modern corporate cocktail hour',
      credit: 'Unsplash · Helena Lopes'
    },
    {
      id: 'neon-glow-nights',
      label: 'Neon Glow Nights',
      description: 'LED walls, DJ booth, and synchronized lighting ready for the after-dark crowd.',
      url: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81a?auto=format&fit=crop&w=1000&q=80',
      alt: 'DJ performing under neon lighting in a club',
      credit: 'Unsplash · Antoine Julien'
    }
  ],
  gallery: [
    {
      id: 'immersive-led-wall',
      label: 'Immersive LED Wall',
      url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
      alt: 'Technicians aligning LED panels before an event',
      credit: 'Unsplash · Hannah Busing'
    },
    {
      id: 'signature-balloon-entrance',
      label: 'Signature Balloon Entrance',
      url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80',
      alt: 'Curated balloon arch at venue entrance',
      credit: 'Unsplash · Adi Goldstein'
    },
    {
      id: 'vip-lounge',
      label: 'VIP Lounge Experience',
      url: 'https://images.unsplash.com/photo-1509817306631-ca1f5b3caa5c?auto=format&fit=crop&w=1000&q=80',
      alt: 'Chic lounge area prepared for guests',
      credit: 'Unsplash · Michael Browning'
    }
  ],
  updatedAt: new Date().toISOString()
}

export function cloneDefaultImageContent(): ImageContent {
  return structuredClone(defaultImageContent)
}
