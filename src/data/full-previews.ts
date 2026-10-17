import mari from '../assets/projects/full/p-mari-full.webp';
import add from '../assets/projects/full/add-group-full.webp';
import elena from '../assets/projects/full/elena-bianchi-full.webp';
import fitness from '../assets/projects/full/gym-center-full.webp';
import hair from '../assets/projects/full/luxury-hair-full.webp';
import beauty from '../assets/projects/full/sito-estetista-full.webp';
import type { ImageMetadata } from 'astro';
// Full-page source files; all six associations verified visually.
export const fullPreviews: Record<string, ImageMetadata> = {
  'p-mari-best-catering-ltd': mari,
  'add-group': add,
  'elena-bianchi': elena,
  'centro-fitness': fitness,
  'luxury-hair-studio': hair,
  'centro-estetico': beauty,
};
