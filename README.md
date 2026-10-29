# alieke.design

De website van Alieke Zelhorst, gebouwd met [Astro](https://astro.build) als statische site. Vervangt de WordPress-versie; design, teksten en animaties zijn één op één overgenomen.

## Inhoud aanpassen

De makkelijkste manier: ga naar **https://alieke.design/admin** en log in met GitHub. Daar pas je projecten, aanbevelingen, skills, "Over mij" en de algemene teksten aan. Opslaan maakt een commit op `main`; een paar minuten later staat het live.

Onder water staan de teksten in `src/content/`, ingedeeld zoals in het beheerscherm: per pagina een map, per sectie een bestand.

| Groep in het CMS | Map | Bestanden (in de volgorde van de pagina) |
|---|---|---|
| Homepage | `src/content/home/` | `bovenaan` (incl. Nieuw-blok), `projecten`, `skills`, `aanbevelingen`, `over-mij`, `contact`, `seo` |
| AI Design Consultant | `src/content/consultant/` | `bovenaan`, `waarom`, `aanpak`, `popup-1` t/m `popup-5`, `resultaat`, `scan`, `wie`, `contact`, `seo` |
| Hele site | `src/content/site/` | `gegevens` (e-mail, KvK, adres, LinkedIn) |

Een nieuwe pagina krijgt een eigen map en een eigen groep in `public/admin/config.yml`. `src/lib/content.ts` voegt de bestanden per pagina weer samen voor de componenten.

Je kunt die bestanden ook rechtstreeks bewerken. Let op: het CMS schrijft de bestanden opnieuw bij het opslaan, dus commentaarregels in de YAML verdwijnen dan.

Afbeeldingen voor projecten en aanbevelingen gaan in `src/assets/img/` (het CMS zet ze daar vanzelf); Astro maakt er bij het bouwen automatisch kleine webp-versies van. Logo's staan in `public/img/logos/`. Van de pagina AI Design Consultant staan alle teksten in het CMS, ook die van de pop-ups achter de stappen. De opmaak van de pop-ups zit in `src/components/StapPopup.astro`, de illustraties in de kaders in `src/lib/popup-illustraties.ts`. Het aantal stappen, pakketten en tabbladen ligt vast in de vormgeving.

### CMS instellen (eenmalig)

Het beheerscherm is [Sveltia CMS](https://github.com/sveltia/sveltia-cms) (`public/admin/`). Inloggen met GitHub loopt via een klein hulpje op Cloudflare Workers:

1. Deploy [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) naar je (gratis) Cloudflare-account; de README daar heeft een deploy-knop.
2. Maak op GitHub een OAuth App aan (Settings → Developer settings → OAuth Apps). Homepage: `https://alieke.design`, callback: `https://<worker>.workers.dev/callback`.
3. Zet in de Worker de variabelen `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` en `ALLOWED_DOMAINS=alieke.design`.
4. Vul de Worker-URL in bij `backend.base_url` in `public/admin/config.yml`.

## Lokaal bekijken

```
npm install
npm run dev
```

Open daarna http://localhost:4321.

## Opbouw

- `src/styles/theme.css` – de CSS van het oude WordPress-thema (niet aanpassen).
- `src/styles/site.css` – aanvullingen: aanbevelingen, contact, focusstijlen en de "Extra CSS" uit WordPress.
- `src/scripts/main.ts` – animaties: smooth scroll (Lenis), parallax en scroll-effecten (GSAP ScrollTrigger). Respecteert "verminder beweging" van het besturingssysteem.
- `public/.htaccess` – https, 404-pagina en caching op Hostinger.

## Live zetten (Hostinger)

De workflow `.github/workflows/deploy.yml` bouwt de site en zet hem via FTP op Hostinger. Hij draait automatisch bij elke wijziging op `main` (dus ook na opslaan in het beheerscherm); handmatig starten kan via Actions → **Deploy naar Hostinger** → **Run workflow**, eventueel als "dry run" om alleen de verbinding te testen.

De secrets staan in GitHub → Settings → Secrets and variables → Actions:

- `FTP_SERVER` – FTP-host uit Hostinger (hPanel → Bestanden → FTP-accounts)
- `FTP_LIVE_USERNAME` – FTP-gebruikersnaam
- `FTP_LIVE_PASSWORD` – FTP-wachtwoord

De secrets `FTP_USERNAME` en `FTP_PASSWORD` van de oude testomgeving (nieuw.alieke.design) worden niet meer gebruikt en kunnen weg.
