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

export async function getAanbevelingenLink() {
  return (await getEntry('aanbevelingenInfo', 'data'))!.data.linkUrl;
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
