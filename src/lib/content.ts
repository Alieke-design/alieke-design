// Handige functies om de site-inhoud uit de content collections te halen.
// Elke sectie staat in een eigen bestand (zie src/content.config.ts); deze functies voegen
// ze weer samen, zodat de componenten niet hoeven te weten hoe de bestanden zijn ingedeeld.
import { getCollection, getEntry } from 'astro:content';

type Single =
  | 'siteGegevens' | 'homeBovenaan' | 'skills' | 'overMij' | 'homeContact' | 'homeSeo'
  | 'cBovenaan' | 'cWaarom' | 'cAanpak' | 'cResultaat' | 'cScan' | 'cWie' | 'cContact' | 'cSeo'
  | 'cPopup1' | 'cPopup2' | 'cPopup3' | 'cPopup4' | 'cPopup5';

const one = async <C extends Single>(c: C) => (await getEntry(c, 'data'))!.data;

/** Homepage: bovenaan, Nieuw-blok, contact, SEO en de bedrijfsgegevens. */
export async function getAlgemeen() {
  const { nieuw, ...hero } = await one('homeBovenaan');
  return {
    hero,
    nieuw,
    contact: await one('homeContact'),
    seo: await one('homeSeo'),
    gegevens: await one('siteGegevens'),
  };
}

export async function getProjecten() {
  return (await getCollection('projecten')).sort((a, b) => a.id.localeCompare(b.id)).map((e) => e.data);
}

export async function getAanbevelingen() {
  return (await getCollection('aanbevelingen')).sort((a, b) => a.id.localeCompare(b.id)).map((e) => e.data);
}

export async function getAanbevelingenInfo() {
  return (await getEntry('aanbevelingenInfo', 'data'))!.data;
}

export async function getAanbevelingenLink() {
  return (await getAanbevelingenInfo()).linkUrl;
}

export async function getProjectenInfo() {
  return (await getEntry('projectenInfo', 'data'))!.data;
}

// ---------- Menu
// Elk menu-item heeft dezelfde tekst als de badge (label) van zijn sectie, tenzij er in het
// CMS een eigen 'Naam in het menu' is ingevuld. Volgorde en ankers liggen hier vast.

type NavItem = { href: string; label: string };
const naam = (s: { label: string; menu?: string }) => s.menu?.trim() || s.label;

/** Menu van de homepage. prefix '/' laat de links vanaf een andere pagina naar de homepage wijzen. */
export async function getHomeNav(prefix = ''): Promise<NavItem[]> {
  const { hero, contact } = await getAlgemeen();
  return [
    { href: `${prefix}#hi`, label: naam(hero) },
    { href: `${prefix}#werk`, label: naam(await getProjectenInfo()) },
    { href: `${prefix}#skills`, label: naam(await getSkills()) },
    { href: `${prefix}#aanbevelingen`, label: naam(await getAanbevelingenInfo()) },
    { href: `${prefix}#over-mij`, label: naam(await getOverMij()) },
    { href: `${prefix}#contact`, label: naam(contact) },
  ];
}

/** Menu van de pagina AI Design Consultant. */
export async function getConsultantNav(): Promise<NavItem[]> {
  const c = await getConsultant();
  return [
    { href: '#waarom', label: naam(c.waarom) },
    { href: '#aanpak', label: naam(c.aanpak) },
    { href: '#wat-je-krijgt', label: naam(c.resultaat) },
    { href: '#analyse', label: naam(c.scan) },
    { href: '#contact', label: naam(c.contact) },
  ];
}

export async function getSkills() {
  return one('skills');
}

export async function getOverMij() {
  return one('overMij');
}

/** Pagina AI Design Consultant, alle secties samen. */
export async function getConsultant() {
  return {
    hero: await one('cBovenaan'),
    waarom: await one('cWaarom'),
    aanpak: await one('cAanpak'),
    resultaat: await one('cResultaat'),
    scan: await one('cScan'),
    wie: await one('cWie'),
    contact: await one('cContact'),
    seo: await one('cSeo'),
    popups: [await one('cPopup1'), await one('cPopup2'), await one('cPopup3'), await one('cPopup4'), await one('cPopup5')],
  };
}
