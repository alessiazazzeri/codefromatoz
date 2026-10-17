import mari from '../../public/p-mari-best-catering.png';
import add from '../../public/add-group.png';
import elena from '../../public/elena-bianchi.png';
import fitness from '../../public/gym-center.png';
import hair from '../../public/luxury-hair-studio.png';
import beauty from '../../public/sito-estetista.png';
import bubu from '../../public/bubu-siby.png';
import type { PortfolioImage } from './portfolio';

// Explicit associations verified against the supplied screenshots.
// Public originals remain untouched; Astro generates responsive derivatives.
export const projectImages: Record<string, PortfolioImage> = {
  'p-mari-best-catering-ltd': { source: mari, alt: 'Homepage P.Mari: catalogo di attrezzature per la ristorazione', position: '0% 50%' },
  'add-group': { source: add, alt: 'Homepage ADD Group: presentazione aziendale e offerta per partner business', position: '0% 50%' },
  'elena-bianchi': { source: elena, alt: 'Homepage Elena Bianchi: presentazione della psicologa e dei suoi servizi', position: '0% 50%' },
  'centro-fitness': { source: fitness, alt: 'Landing Gym Center: allenamento e invito a iniziare', position: '0% 50%' },
  'luxury-hair-studio': { source: hair, alt: 'Homepage Luxury Hair Studio: salone e servizi per capelli', position: '0% 50%' },
  'centro-estetico': { source: beauty, alt: 'Homepage del centro estetico: trattamenti e cura di sé', position: '0% 50%' },
  'bubu-siby': { source: bubu, alt: 'Bubu & Siby: i due gatti protagonisti del sito personale', position: '50% 50%' },
};
