// Content collections: de teksten van de site staan in src/content/ en worden beheerd via
// het CMS op /admin (Sveltia) of rechtstreeks in de bestanden. Indeling, gelijk aan het CMS:
//   src/content/home/        homepage, één bestand per sectie
//   src/content/consultant/  pagina AI Design Consultant, één bestand per sectie
//   src/content/site/        gegevens die op de hele site staan
// Afbeeldingspaden in de YAML beginnen bij de projectmap (bijv. /src/assets/img/foto.jpg),
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

const str = z.string();

// ---------- Hele site

const siteGegevens = defineCollection({
  loader: single('src/content/site/gegevens.yaml'),
  schema: z.object({ email: str, linkedin: str, kvk: z.coerce.string(), adres: str }),
});

// ---------- Homepage

const homeBovenaan = defineCollection({
  loader: single('src/content/home/bovenaan.yaml'),
  schema: ({ image }) =>
    z.object({
      label: str,
      title: str,
      subtitle: str,
      quote: str,
      bullets: z.array(str),
      buttonText: str,
      portrait: image(),
      portraitAlt: str,
      nieuw: z
        .object({ aan: z.boolean().default(false), label: str, titel: str, tekst: str, link: str })
        .optional(),
    }),
});

const projecten = defineCollection({
  loader: list('src/content/home/projecten.yaml'),
  schema: ({ image }) =>
    z.object({
      title: str,
      intro: str,
      image: image(),
      imageAlt: str,
      logo: str,
      logoAlt: str,
      deliverables: z.array(str),
    }),
});

const aanbevelingen = defineCollection({
  loader: list('src/content/home/aanbevelingen.yaml'),
  schema: ({ image }) =>
    z.object({
      name: str,
      role: str,
      photo: image(),
      lang: z.enum(['nl', 'en']),
      linkedin: str.optional().default(''),
      text: str,
    }),
});

// De algemene LinkedIn-link staat bovenin aanbevelingen.yaml, buiten de lijst.
const aanbevelingenInfo = defineCollection({
  loader: file('src/content/home/aanbevelingen.yaml', {
    parser: (text) => {
      const { linkUrl } = yaml.load(text) as { linkUrl: string };
      return { data: { linkUrl } };
    },
  }),
  schema: z.object({ linkUrl: str }),
});

const rij = z.object({ jaar: z.coerce.string(), omschrijving: str });

const skills = defineCollection({
  loader: single('src/content/home/skills.yaml'),
  schema: z.object({
    ervaring: z.array(rij),
    opleiding: z.array(rij),
    tools: z.array(z.object({ name: str, logo: str, alt: str })),
  }),
});

const overMij = defineCollection({
  loader: single('src/content/home/over-mij.yaml'),
  schema: z.object({
    werkwijze: z.array(str),
    resultaat: z.array(str),
    voorWie: z.array(str),
  }),
});

const homeContact = defineCollection({
  loader: single('src/content/home/contact.yaml'),
  schema: z.object({ text: str, menuNote: str }),
});

const homeSeo = defineCollection({
  loader: single('src/content/home/seo.yaml'),
  schema: z.object({ title: str, description: str, ogImageAlt: str }),
});

// ---------- AI Design Consultant

const cBovenaan = defineCollection({
  loader: single('src/content/consultant/bovenaan.yaml'),
  schema: z.object({
    label: str, titel: str, titelAccent: str, intro: str,
    punten: z.array(z.object({ vet: str, tekst: str })),
    knop: str,
  }),
});

const cWaarom = defineCollection({
  loader: single('src/content/consultant/waarom.yaml'),
  schema: z.object({ label: str, titel: str, ondertitel: str, tekst: str, kernzin: str }),
});

const cAanpak = defineCollection({
  loader: single('src/content/consultant/aanpak.yaml'),
  schema: z.object({
    label: str, titel: str, ondertitel: str,
    stappen: z.array(z.object({ titel: str, frequentie: str, tekst: str })).length(5),
    designersTitel: str, designersTekst: str,
  }),
});

const cResultaat = defineCollection({
  loader: single('src/content/consultant/resultaat.yaml'),
  schema: z.object({
    label: str, titel: str, ondertitel: str, tip: str,
    punten: z.array(z.object({ titel: str, tekst: str, optioneel: z.boolean().default(false) })),
  }),
});

const cScan = defineCollection({
  loader: single('src/content/consultant/scan.yaml'),
  schema: z.object({
    label: str, titel: str, intro: str, toolsTip: str, wcagTitel: str, wcagTip: str,
    pakketten: z
      .array(
        z.object({
          naam: str, doelgroep: str, prijsLabel: str, prijs: z.coerce.string(),
          gesprek: str, producten: str, tools: str,
          wcagPrijs: z.coerce.string(), wcagVanaf: z.boolean().default(false),
        }),
      )
      .length(3),
    resultaat: z.object({ label: str, titel: str, rapportVet: str, rapportTekst: str, planVet: str, planTekst: str }),
  }),
});

const cWie = defineCollection({
  loader: single('src/content/consultant/wie.yaml'),
  schema: z.object({
    label: str, naam: str, punten: z.array(str), quote: str, quoteNaam: str, quoteRol: str, knop: str,
  }),
});

const cContact = defineCollection({
  loader: single('src/content/consultant/contact.yaml'),
  schema: z.object({ label: str, titel: str, tekst: str, punten: z.array(str), menuNote: str }),
});

const cSeo = defineCollection({
  loader: single('src/content/consultant/seo.yaml'),
  schema: z.object({ title: str, description: str, ogImageAlt: str }),
});

export const collections = {
  siteGegevens,
  homeBovenaan, projecten, aanbevelingen, aanbevelingenInfo, skills, overMij, homeContact, homeSeo,
  cBovenaan, cWaarom, cAanpak, cResultaat, cScan, cWie, cContact, cSeo,
};
