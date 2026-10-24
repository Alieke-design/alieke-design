// Handige functies om de site-inhoud uit de content collections te halen.
import { getCollection, getEntry } from 'astro:content';

export async function getAlgemeen() {
  return (await getEntry('algemeen', 'data'))!.data;
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
  return (await getEntry('skills', 'data'))!.data;
}

export async function getOverMij() {
  return (await getEntry('overMij', 'data'))!.data;
}
