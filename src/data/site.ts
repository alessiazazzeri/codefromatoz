export const site = {
  url: 'https://www.codefromatoz.it/',
  name: 'Code from A to Z',
  person: 'Alessia Zazzeri',
  title: 'Code from A to Z — Alessia Zazzeri · Web Designer + Developer',
  description: 'Code from A to Z è il portfolio di Alessia: web designer con background da developer, per professionisti, attività e brand.',
  social: ['https://www.instagram.com/alessiaz.webdesign/', 'https://www.linkedin.com/in/alessia-zazzeri/'],
};
export const excludedFromIndex = new Set(['/privacy-policy', '/cookie-policy', '/404']);
export const absoluteUrl = (path: string) => new URL(path, site.url).href;
