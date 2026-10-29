// Algemene instellingen van de site. De teksten en gegevens komen uit src/content/home/seo.yaml
// en src/content/site/gegevens.yaml (te beheren via /admin); hier alleen wat de code nodig heeft.
import yaml from 'js-yaml';
import seoRaw from './content/home/seo.yaml?raw';
import gegevensRaw from './content/site/gegevens.yaml?raw';

const seo = yaml.load(seoRaw) as { title: string; description: string; ogImageAlt: string };
const gegevens = yaml.load(gegevensRaw) as { email: string; linkedin: string; kvk: string; adres: string };

export const site = {
  title: seo.title,
  description: seo.description,
  ogImageAlt: seo.ogImageAlt,
  url: 'https://alieke.design',
  email: gegevens.email,
  linkedin: gegevens.linkedin,
  kvk: String(gegevens.kvk),
  address: gegevens.adres,
};
