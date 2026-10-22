// Interacties en animaties, overgenomen uit het WordPress-thema (assets/main.js):
// smooth scroll (Lenis), parallax (GSAP ScrollTrigger), --i scroll-variabele,
// is-inview, lazy-load fade en header-achtergrond bij scrollen.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = <T extends Element = HTMLElement>(sel: string) => [...document.querySelectorAll<T>(sel)];

// Afbeeldingen faden in zodra ze geladen zijn.
$$<HTMLImageElement>('img[data-lazy-load]').forEach((img) => {
  const done = () => img.classList.add('is-loaded');
  if (img.complete && img.naturalWidth) done();
  else img.addEventListener('load', done, { once: true });
});

// Smooth scroll (alleen op grote schermen, zoals het origineel).
let lenis: Lenis | null = null;
if (!reduceMotion) {
  lenis = new Lenis({
    duration: 1,
    easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    smoothWheel: window.innerWidth > 1024,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// Ankerlinks binnen de pagina.
$$<HTMLAnchorElement>('a[href*="#"]').forEach((link) => {
  const url = new URL(link.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
  link.addEventListener('click', (e) => {
    const target = document.querySelector<HTMLElement>(url.hash);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1 });
    else target.scrollIntoView();
    history.pushState(null, '', url.hash);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
});

// Header krijgt een achtergrond zodra je scrolt.
const header = document.querySelector('.header');
const onScroll = () => header?.classList.toggle('has-background', window.scrollY > 10);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const targetOf = (el: HTMLElement) =>
  el.dataset.target === 'parent' ? el.closest('section') : el.dataset.target || el;

if (reduceMotion) {
  // Geen beweging: toon alles direct in de eindstand.
  $$('[data-scroll-var]').forEach((el) => el.style.setProperty('--i', '1'));
  $$('[data-scroll]').forEach((el) => el.classList.add('is-inview'));
} else {
  // Parallax verticaal (waarde in 1/24 vw, zoals het origineel).
  $$('[data-scroll-translate]').forEach((el) => {
    gsap.to(el, {
      scrollTrigger: {
        trigger: targetOf(el),
        start: el.dataset.scrollOffsetY || 'top-=1',
        end: el.dataset.scrollDistance || 'bottom',
        scrub: true,
      },
      y: `${(100 / 24) * Number(el.dataset.translateY)}vw`,
    });
  });

  // Parallax horizontaal.
  $$('[data-scroll-translate-x]').forEach((el) => {
    gsap.to(el, {
      scrollTrigger: {
        trigger: targetOf(el),
        start: el.dataset.scrollOffsetY ? `top-=${el.dataset.scrollOffsetY}` : 'top-=1',
        end: el.dataset.scrollDistance ? `top+=${el.dataset.scrollDistance}` : 'bottom',
        scrub: true,
      },
      x: `${(100 / 24) * Number(el.dataset.translateX)}vw`,
    });
  });

  // CSS-variabele --i loopt van 0 naar 1 tijdens het scrollen.
  $$('[data-scroll-var]').forEach((el) => {
    const once = Boolean(el.dataset.once);
    gsap.to(el, {
      scrollTrigger: {
        trigger: targetOf(el),
        start: el.dataset.start || 'top',
        end: once ? undefined : el.dataset.end || 'bottom',
        scrub: once ? false : 1,
        once,
      },
      '--i': 1,
    });
  });

  // Klasse is-inview zodra een element in beeld komt (eenmalig).
  $$('[data-scroll]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: el.dataset.scrollStart || 'top-=100',
      once: true,
      onEnter: () => el.classList.add('is-inview'),
    });
  });
}

// Aanbevelingen: lange teksten inklappen met "Lees meer".
$$('.review').forEach((review) => {
  const text = review.querySelector<HTMLElement>('.review__text');
  const toggle = review.querySelector<HTMLButtonElement>('.review__toggle');
  if (!text || !toggle) return;
  text.classList.add('is-clamped');
  if (text.scrollHeight - text.clientHeight < 4) {
    text.classList.remove('is-clamped');
    return;
  }
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    text.classList.toggle('is-clamped', open);
    ScrollTrigger.refresh();
  });
});

// E-mailadres kopiëren
$$<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  const label = btn.querySelector<HTMLElement>('[data-copy-label]');
  const status = btn.parentElement?.querySelector<HTMLElement>('[data-copy-status]');
  let timer: number | undefined;
  btn.addEventListener('click', async () => {
    const value = btn.dataset.copy || '';
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = Object.assign(document.createElement('textarea'), { value });
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    document.body.classList.remove('tips-dismissed');
    if (label) label.textContent = 'Gekopieerd';
    if (status) status.textContent = 'E-mailadres gekopieerd';
    btn.classList.add('is-copied');
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      btn.classList.remove('is-copied');
      if (label) label.textContent = 'Kopiëren';
      if (status) status.textContent = '';
    }, 2000);
  });
});

// De lijst met aanbevelingen is alleen focusbaar als hij horizontaal scrolt (mobiel).
const reviewList = document.querySelector<HTMLElement>('.reviews');
const updateReviewFocus = () => {
  if (!reviewList) return;
  const scrollable = reviewList.scrollWidth > reviewList.clientWidth + 1;
  reviewList.classList.toggle('is-scrollable', scrollable);
  if (scrollable) reviewList.setAttribute('tabindex', '0');
  else reviewList.removeAttribute('tabindex');
};
updateReviewFocus();
window.addEventListener('resize', updateReviewFocus);

// Mobiel menu: native <dialog> (focus blijft in het menu, Escape sluit, focus gaat terug naar de knop).
const menu = document.querySelector<HTMLDialogElement>('#mobile-menu');
const menuOpen = document.querySelector<HTMLButtonElement>('[data-menu-open]');
if (menu && menuOpen) {
  const markCurrent = () => {
    const sections = $$('main section[id]');
    const y = window.scrollY + window.innerHeight / 3;
    let current = sections[0]?.id;
    sections.forEach((s) => { if (s.offsetTop <= y) current = s.id; });
    menu.querySelectorAll<HTMLAnchorElement>('a[data-section]').forEach((a) => {
      if (a.dataset.section === current) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };
  const unlock = () => {
    menuOpen.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    lenis?.start();
  };
  menuOpen.addEventListener('click', () => {
    markCurrent();
    menu.showModal();
    menuOpen.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
    lenis?.stop();
  });
  menu.querySelector('[data-menu-close]')?.addEventListener('click', () => menu.close());
  menu.addEventListener('close', () => {
    unlock();
    // Vangnet: focus terug naar de menuknop als de browser dat niet zelf deed.
    requestAnimationFrame(() => {
      if (!document.activeElement || document.activeElement === document.body) menuOpen.focus();
    });
  });
  // Eerst sluiten en ontgrendelen, daarna scrolt de gewone ankerlink naar de sectie.
  menu.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a[href^="#"]')) {
      menu.close();
      unlock();
    }
  }, true);
  // Menu dicht als het scherm breder wordt dan mobiel.
  window.matchMedia('(min-width: 751px)').addEventListener('change', (e) => { if (e.matches && menu.open) menu.close(); });
}

// Tooltips sluiten met Escape (WCAG 1.4.13); weer tonen zodra de muis beweegt of de focus verandert.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.body.classList.add('tips-dismissed');
});
const resetTips = () => document.body.classList.remove('tips-dismissed');
document.addEventListener('mousemove', resetTips, { passive: true });
document.addEventListener('focusin', resetTips);

window.addEventListener('load', () => ScrollTrigger.refresh());
