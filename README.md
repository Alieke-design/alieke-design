# alieke.design

De website van Alieke Zelhorst, gebouwd met [Astro](https://astro.build) als statische site. Vervangt de WordPress-versie; design, teksten en animaties zijn één op één overgenomen.

## Inhoud aanpassen

Bijna alle tekst staat in een paar overzichtelijke bestanden:

| Wat | Bestand |
|---|---|
| Projecten (Werk) | `src/data/projects.ts` |
| Aanbevelingen | `src/data/aanbevelingen.ts` |
| Ervaring, opleiding, tools, werkwijze, resultaat, voor wie | `src/data/skills.ts` |
| E-mailadres, KvK, adres, LinkedIn, Google Analytics | `src/config.ts` |
| Hero (Hi! 👋) | `src/components/Hero.astro` |
| Contacttekst | `src/components/Contact.astro` |

Afbeeldingen voor projecten en aanbevelingen gaan in `src/assets/img/`; Astro maakt er bij het bouwen automatisch kleine webp-versies van. Logo's staan in `public/img/logos/`.

## Lokaal bekijken

```
npm install
npm run dev
```

Open daarna http://localhost:4321.

## Opbouw

- `src/styles/theme.css` – de CSS van het oude WordPress-thema (niet aanpassen).
- `src/styles/site.css` – aanvullingen: aanbevelingen, contact, cookiemelding, focusstijlen en de "Extra CSS" uit WordPress.
- `src/scripts/main.ts` – animaties: smooth scroll (Lenis), parallax en scroll-effecten (GSAP ScrollTrigger). Respecteert "verminder beweging" van het besturingssysteem.
- `src/scripts/cookies.ts` – cookiemelding. Verschijnt alleen als `googleAnalyticsId` in `src/config.ts` is ingevuld; Analytics laadt pas na toestemming.
- `public/.htaccess` – https, 404-pagina en caching op Hostinger.

## Live zetten (Hostinger)

De workflow `.github/workflows/deploy.yml` bouwt de site en zet hem via FTP op Hostinger. Hij draait alleen als je hem zelf start.

Eenmalig instellen in GitHub → Settings → Secrets and variables → Actions:

- `FTP_SERVER` – FTP-host uit Hostinger (hPanel → Bestanden → FTP-accounts)
- `FTP_USERNAME` – FTP-gebruikersnaam
- `FTP_PASSWORD` – FTP-wachtwoord
- `FTP_SERVER_DIR` – map op de server, bijvoorbeeld `/public_html/`

Daarna: Actions → **Deploy naar Hostinger** → **Run workflow**.

Let op: maak eerst een back-up van de WordPress-site en haal WordPress weg uit `public_html` voordat je de eerste keer live zet.
