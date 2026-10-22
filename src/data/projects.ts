// Projecten in de sectie "Werk". Volgorde hier = volgorde op de site.
// Afbeeldingen staan in src/assets/img, logo's in public/img/logos.
import beschikbaarheidswijzer from '../assets/img/visual-design-beschikbaarheidswijzer-small.jpg';
import evi from '../assets/img/evi-app-small.png';
import heineken from '../assets/img/Heineken-dashboard-design-1800x1220.jpg';
import untire from '../assets/img/Untire-app-design-1800x1228.jpg';

export const projects = [
  {
    image: beschikbaarheidswijzer,
    imageAlt: '',
    logo: '/img/logos/logo-beschikbaarheidswijzer.svg',
    logoAlt: 'Logo Beschikbaarheidswijzer',
    title: 'Sneller passende zorg door heldere flows',
    intro: 'Redesign van publieke platform en beheersysteem',
    deliverables: [
      'Information architecture',
      'Prototype',
      'Visual design',
      'Developer handover',
      'WCAG toetsing<br>bestaand design system',
    ],
  },
  {
    image: evi,
    imageAlt: '',
    logo: '/img/logos/logo-evi-dark.png',
    logoAlt: 'Logo Evi app',
    title: 'Slim inzicht in slaap en voeding van baby’s',
    intro: 'Design en realisatie van een nieuwe app',
    deliverables: [
      'Concept',
      'User research',
      'Information architecture',
      'AI prototyping',
      'Usability tests',
      'Visual design',
      'Vibe coding',
    ],
  },
  {
    image: heineken,
    imageAlt: 'Design van een dashboard voor Heineken waarop de performance van de bar te zien is.',
    logo: '/img/logos/Logo-Heineken.svg',
    logoAlt: 'Logo van opdrachtgever Heineken',
    title: 'Meer inzicht met dashboard voor bareigenaren',
    intro: 'Design voor een nieuw concept van Heineken',
    deliverables: [
      'User research',
      'Visual design',
      'Information architecture',
      'Design system',
      'Prototyping',
      'Developer handover',
      'Usability tests',
    ],
  },
  {
    image: untire,
    imageAlt: 'Design van het Vandaag scherm van de app Untire Now',
    logo: '/img/logos/Logo-Untire.svg',
    logoAlt: 'Logo van de app Untire',
    title: 'Intuïtieve app voor vermoeide (ex)kankerpatiënten',
    intro:
      'Volledig redesign <a href="https://apps.apple.com/nl/app/untire-now/id1661118356" target="_blank" rel="noopener">Untire Now app</a> / ⭐️⭐️⭐️⭐️⭐️ in AppStore',
    deliverables: [
      'Research',
      'Usability tests',
      'Information architecture',
      'User survey',
      'User flow',
      'Visual design',
      'UX writing',
      'Design System',
      'Prototyping',
      'Developer handover',
    ],
  },
];
