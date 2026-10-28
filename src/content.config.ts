// Content collections: de teksten van de site staan in src/content/*.yaml en worden
// beheerd via het CMS op /admin (Sveltia) of rechtstreeks in de bestanden.
// Afbeeldingspaden in de YAML zijn relatief aan src/content/ (bijv. ../assets/img/foto.jpg),
// zodat Astro ze kan optimaliseren.
import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';
import yaml from 'js-yaml';

/** Eén YAML-bestand = één entry met id "data". */
const single = (path: string) =>
  file(path, { parser: (text) => ({ data: yaml.load(text) as Record<string, unknown> }) });

/** YAML met een lijst `items` = één entry per item, id = volgnummer. */
const list = (path: string) =>
  file(path, {
    parser: (text) => {
      const { items = [] } = yaml.load(text) as { items?: Record<string, unknown>[] };
      return items.map((item, i) => ({ id: String(i).padStart(3, '0'), ...item }));
    },
  });

const algemeen = defineCollection({
  loader: single('src/content/algemeen.yaml'),
  schema: ({ image }) =>
    z.object({
      seo: z.object({ title: z.string(), description: z.string(), ogImageAlt: z.string() }),
      hero: z.object({
        label: z.string(),
        title: z.string(),
        subtitle: z.string(),
        quote: z.string(),
        bullets: z.array(z.string()),
        buttonText: z.string(),
        portrait: image(),
        portraitAlt: z.string(),
      }),
      nieuw: z
        .object({ aan: z.boolean().default(false), label: z.string(), titel: z.string(), tekst: z.string(), link: z.string() })
        .optional(),
      contact: z.object({ text: z.string(), menuNote: z.string() }),
      gegevens: z.object({ email: z.string(), linkedin: z.string(), kvk: z.coerce.string(), adres: z.string() }),
    }),
});

const projecten = defineCollection({
  loader: list('src/content/projecten.yaml'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      intro: z.string(),
      image: image(),
      imageAlt: z.string(),
      logo: z.string(),
      logoAlt: z.string(),
      deliverables: z.array(z.string()),
    }),
});

const aanbevelingen = defineCollection({
  loader: list('src/content/aanbevelingen.yaml'),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      photo: image(),
      lang: z.enum(['nl', 'en']),
      linkedin: z.string().optional().default(''),
      text: z.string(),
    }),
});

// De algemene LinkedIn-link staat bovenin aanbevelingen.yaml, buiten de lijst.
const aanbevelingenInfo = defineCollection({
  loader: file('src/content/aanbevelingen.yaml', {
    parser: (text) => {
      const { linkUrl } = yaml.load(text) as { linkUrl: string };
      return { data: { linkUrl } };
    },
  }),
  schema: z.object({ linkUrl: z.string() }),
});

const rij = z.object({ jaar: z.coerce.string(), omschrijving: z.string() });

const skills = defineCollection({
  loader: single('src/content/skills.yaml'),
  schema: z.object({
    ervaring: z.array(rij),
    opleiding: z.array(rij),
    tools: z.array(z.object({ name: z.string(), logo: z.string(), alt: z.string() })),
  }),
});

const overMij = defineCollection({
  loader: single('src/content/over-mij.yaml'),
  schema: z.object({
    werkwijze: z.array(z.string()),
    resultaat: z.array(z.string()),
    voorWie: z.array(z.string()),
  }),
});

export const collections = { algemeen, projecten, aanbevelingen, aanbevelingenInfo, skills, overMij };
