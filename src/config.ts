// Algemene instellingen van de site. De teksten en gegevens komen uit src/content/algemeen.yaml
// (te beheren via /admin); hier alleen wat de code nodig heeft.
import yaml from 'js-yaml';
import raw from './content/algemeen.yaml?raw';

type Algemeen = {
  seo: { title: string; description: string; ogImageAlt: string };
  gegevens: { email: string; linkedin: string; kvk: string; adres: string };
};

const algemeen = yaml.load(raw) as Algemeen;

export const site = {
  title: algemeen.seo.title,
  description: algemeen.seo.description,
  ogImageAlt: algemeen.seo.ogImageAlt,
  url: 'https://alieke.design',
  email: algemeen.gegevens.email,
  linkedin: algemeen.gegevens.linkedin,
  kvk: String(algemeen.gegevens.kvk),
  address: algemeen.gegevens.adres,
};
