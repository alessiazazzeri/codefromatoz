import elenaMobile from '../assets/projects/elena-bianchi-mobile.png';
import fitnessMobile from '../assets/projects/gym-center-mobile.png';
import hairMobile from '../assets/projects/luxury-hair-mobile.png';
import beautyMobile from '../assets/projects/sito-estetista-mobile.png';
import mariSearch from '../assets/projects/p-mari-search.png';
import mariCatalogue from '../assets/projects/p-mari-lista-prodotti.png';
import mariProduct from '../assets/projects/p-mari-prodotto-singolo.png';
import addCategories from '../assets/projects/add-group-sector.png';
import addVisual from '../assets/projects/add-group-visual.png';
import addMobile from '../assets/projects/add-group-mobile.png';
import elenaServices from '../assets/projects/elena-bianchi-servizi.png';
import fitnessFeatures from '../assets/projects/gym-center-2.png';
import hairPhilosophy from '../assets/projects/luxury-hair-studio-2.png';
import beautyTreatments from '../assets/projects/sito-estetista-listino.png';
import mari from '../assets/projects/p-mari-best-catering.png';
import add from '../assets/projects/add-group.png';
import elena from '../assets/projects/elena-bianchi.png';
import fitness from '../assets/projects/gym-center.png';
import hair from '../assets/projects/luxury-hair-studio.png';
import beauty from '../assets/projects/sito-estetista.png';
import bubu from '../assets/projects/bubu-siby.png';
import type { PortfolioImage } from './portfolio';

// Explicit associations verified against the supplied screenshots.
// Repository source originals remain untouched; only responsive derivatives are published.
export const projectImages: Record<string, PortfolioImage> = {
  'p-mari-best-catering-ltd': { source: mari, alt: 'Homepage P.Mari: catalogo di attrezzature per la ristorazione', position: '0% 50%' },
  'add-group': { source: add, alt: 'Homepage ADD Group: presentazione aziendale e offerta per partner business', position: '0% 50%' },
  'elena-bianchi': { source: elena, alt: 'Homepage Elena Bianchi: presentazione della psicologa e dei suoi servizi', position: '0% 50%' },
  'centro-fitness': { source: fitness, alt: 'Landing Gym Center: allenamento e invito a iniziare', position: '0% 50%' },
  'luxury-hair-studio': { source: hair, alt: 'Homepage Luxury Hair Studio: salone e servizi per capelli', position: '0% 50%' },
  'centro-estetico': { source: beauty, alt: 'Homepage del centro estetico: trattamenti e cura di sé', position: '0% 50%' },
  'bubu-siby': { source: bubu, alt: 'Bubu & Siby: i due gatti protagonisti del sito personale', position: '50% 50%' },
};

export const projectDetails = {
  mariSearch: { source: mariSearch, alt: 'Ricerca P.Mari con suggerimenti di categorie e prodotti' },
  mariCatalogue: { source: mariCatalogue, alt: 'P.Mari: categorie del catalogo di attrezzature per la ristorazione' },
  mariProduct: { source: mariProduct, alt: 'P.Mari: scheda forno con caratteristiche e richiesta di disponibilità' },
  addVisual: { source: addVisual, alt: 'ADD Group: pagina About us con presentazione aziendale e logistica' },
  addCategories: { source: addCategories, alt: 'ADD Group: categorie merceologiche e settori serviti' },
  addMobile: { source: addMobile, alt: 'Homepage ADD Group su mobile, con presentazione e contatto per i partner' },
  'elena-bianchi': { source: elenaServices, alt: 'Elena Bianchi: percorsi di sostegno psicologico e servizi' },
  'centro-fitness': { source: fitnessFeatures, alt: 'Gym Center: sezione Perché sceglierci con attrezzature, trainer e community' },
  'luxury-hair-studio': { source: hairPhilosophy, alt: 'Luxury Hair Studio: filosofia del salone e strumenti di lavoro' },
  'centro-estetico': { source: beautyTreatments, alt: 'Centro estetico: trattamenti viso e relativo listino' },
} satisfies Record<string, PortfolioImage>;

export const projectMobile: Record<string, PortfolioImage> = {
  'elena-bianchi': { source: elenaMobile, alt: 'Elena Bianchi su mobile: presentazione e contatto per un colloquio' },
  'centro-fitness': { source: fitnessMobile, alt: 'Gym Center su mobile: presentazione e invito a iniziare' },
  'luxury-hair-studio': { source: hairMobile, alt: 'Luxury Hair Studio su mobile: salone e prenotazione' },
  'centro-estetico': { source: beautyMobile, alt: 'Centro estetico su mobile: trattamenti e prenotazione' },
};
