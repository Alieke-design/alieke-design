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
    lerp: 0.1, // glijdt mee met de scrollsnelheid (natuurlijker op een trackpad)
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
    if (lenis) {
      // Duur hangt af van de afstand (0,8–1,6 s), met een zachte start en stop.
      const distance = Math.abs(target.getBoundingClientRect().top);
      const duration = Math.min(1.6, Math.max(0.8, 0.6 + distance / 4000));
      const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      lenis.scrollTo(target, { offset: 0, duration, easing: easeInOutCubic });
    }
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
        scrub: 0.6, // korte naloop: zachter meebewegen
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
        scrub: 0.6, // korte naloop: zachter meebewegen
      },
      x: `${(100 / 24) * Number(el.dataset.translateX)}vw`,
    });
  });

  // CSS-variabele --i loopt van 0 naar 1 tijdens het scrollen.
  // Alleen op de elementen die --i echt gebruiken (projectkaart-tekst en de ring om de
  // portretfoto). Op een hele sectie zetten laat de browser bij elk scrollbeeld de hele
  // sectie opnieuw doorrekenen; dat kostte veel prestaties.
  $$('[data-scroll-var]').forEach((el) => {
    const consumers = $$<HTMLElement>('.project__text, .text-image__media').filter((c) => el.contains(c));
    if (!consumers.length) return;
    const once = Boolean(el.dataset.once);
    gsap.fromTo(consumers, { '--i': 0 }, {
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

// Koppen, teksten en kaarten zacht laten verschijnen zodra ze in beeld komen.
const revealTargets = $$(
  '.text-image__text > *, .projects__text > *, .content-repeater__content > *, .widget-block__inner > :not(.reviews), .review, .form__text > :not(.contact-spacer):not(.visually-hidden)',
);
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealTargets.forEach((el) => el.classList.add('is-revealed'));
} else {
  const io = new IntersectionObserver((entries) => {
    let i = 0;
    entries.filter((e) => e.isIntersecting).forEach((e) => {
      const el = e.target as HTMLElement;
      el.style.setProperty('--reveal-delay', `${Math.min(i++, 4) * 80}ms`);
      el.classList.add('is-revealed');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  revealTargets.forEach((el) => io.observe(el));
}

// ---------------------------------------------------------------------------
// 1. Header kleurt mee met de achtergrond eronder (wit, lichtblauw of navy)
// 2. Actieve sectie in het menu (gele streep die meeschuift + aria-current)
// ---------------------------------------------------------------------------
const headerEl = document.querySelector<HTMLElement>('.header');
const navEl = headerEl?.querySelector<HTMLElement>('.header__nav');
const indicator = headerEl?.querySelector<HTMLElement>('.header__indicator');
const navLinks = $$<HTMLAnchorElement>('.header__link').filter((a) => a.hash && a.pathname === location.pathname);
const themeOf = (el: Element): 'light' | 'tint' | 'navy' | null => {
  const bg = getComputedStyle(el).backgroundColor;
  if (bg === 'rgb(227, 240, 255)') return 'tint';
  if (bg === 'rgb(13, 0, 100)') return 'navy';
  if (bg === 'rgb(255, 255, 255)') return 'light';
  return null;
};
// Kleuren één keer uitlezen (en opnieuw bij resize), niet bij elk scrollbeeld.
// Posities en kleuren één keer opmeten (opnieuw bij resize/laden), zodat er tijdens
// het scrollen geen layout gelezen hoeft te worden: alleen window.scrollY.
let bands: { top: number; bottom: number; theme: string }[] = [];
let linkTargets: { a: HTMLAnchorElement; top: number }[] = [];
const measureBands = () => {
  const sy = window.scrollY;
  bands = $$('main section, footer')
    .map((el) => ({ el, theme: themeOf(el) as string }))
    .filter((b) => b.theme)
    .map(({ el, theme }) => { const r = el.getBoundingClientRect(); return { top: r.top + sy, bottom: r.bottom + sy, theme }; });
  linkTargets = navLinks
    .map((a) => ({ a, el: document.querySelector<HTMLElement>(a.hash) }))
    .filter((l) => l.el)
    .map(({ a, el }) => ({ a, top: el!.getBoundingClientRect().top + sy }));
};
let headerHeight = 0, viewportH = 0, docH = 0;
const measureAll = () => {
  measureBands();
  headerHeight = headerEl?.offsetHeight ?? 0;
  viewportH = window.innerHeight;
  docH = document.documentElement.scrollHeight;
};
measureAll();
let headerTicking = false;
let lastTheme = '';
let lastActive: HTMLAnchorElement | null | undefined;
let lastCompact: boolean | undefined;
const placeIndicator = (active: HTMLAnchorElement | null) => {
  if (!indicator || !navEl) return;
  const text = active?.querySelector('.header__text') ?? active;
  if (!text) { indicator.classList.remove('is-visible'); return; }
  const r = text.getBoundingClientRect();
  const n = navEl.getBoundingClientRect();
  indicator.style.width = `${r.width}px`;
  indicator.style.transform = `translate(${r.left - n.left}px, ${r.bottom - n.top + 2}px)`;
  indicator.classList.add('is-visible');
};
const updateHeader = (force = false) => {
  headerTicking = false;
  if (!headerEl) return;
  // Eerst alles lezen…
  const sy = window.scrollY;
  const probe = sy + headerHeight - 1;
  let theme = 'light';
  for (const b of bands) if (b.top <= probe && b.bottom > probe) theme = b.theme;
  const y = sy + viewportH / 3;
  let active: HTMLAnchorElement | null = null;
  for (const l of linkTargets) if (l.top <= y) active = l.a;
  if (viewportH + sy >= docH - 4) active = linkTargets[linkTargets.length - 1]?.a ?? active;
  const compact = window.scrollY > 40;
  // …dan alleen schrijven wat veranderd is.
  if (theme !== lastTheme) { headerEl.dataset.theme = theme; lastTheme = theme; }
  if (compact !== lastCompact) { headerEl.classList.toggle('is-compact', compact); lastCompact = compact; force = true; }
  if (force || active !== lastActive) {
    navLinks.forEach((a) => (a === active ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    lastActive = active;
    // na de padding-overgang van de compacte header opnieuw plaatsen
    requestAnimationFrame(() => placeIndicator(active));
    if (force) setTimeout(() => placeIndicator(active), 380);
  }
};
const requestHeader = () => {
  if (!headerTicking) { headerTicking = true; requestAnimationFrame(() => updateHeader()); }
};
window.addEventListener('scroll', requestHeader, { passive: true });
window.addEventListener('resize', () => { measureAll(); updateHeader(true); });
window.addEventListener('load', () => { measureAll(); updateHeader(true); });
document.fonts?.ready.then(() => { measureAll(); updateHeader(true); });
ScrollTrigger.addEventListener('refresh', () => { measureAll(); requestHeader(); });
// Lazy-geladen afbeeldingen en 'Lees meer' veranderen de paginahoogte.
if ('ResizeObserver' in window) new ResizeObserver(() => { measureAll(); requestHeader(); }).observe(document.body);
updateHeader(true);

// ---------------------------------------------------------------------------
// 3. Markeerstift onder het eerste kopwoord van elke sectie, tekent zich in
// ---------------------------------------------------------------------------
$$('main section').forEach((section) => {
  const h = section.querySelector<HTMLElement>('h2');
  if (!h || h.querySelector('.mark') || h.closest('.mobile-menu')) return;
  // Kernwoord: data-mark="…" op de kop, anders de hele kop als die uit één woord bestaat.
  const node = [...h.childNodes].find((n) => n.nodeType === 3 && n.textContent!.trim());
  if (!node) return;
  const text = node.textContent!;
  const word = h.dataset.mark || (text.trim().split(/\s+/).length === 1 ? text.trim() : '');
  const at = word ? text.indexOf(word) : -1;
  if (at < 0) return;
  const mark = document.createElement('span');
  mark.className = 'mark';
  mark.textContent = word;
  const frag = document.createDocumentFragment();
  frag.append(text.slice(0, at), mark, text.slice(at + word.length));
  h.replaceChild(frag, node);
});
const marks = $$('.mark, .p blockquote .highlight');
if (reduceMotion || !('IntersectionObserver' in window)) {
  marks.forEach((m) => m.classList.add('is-drawn'));
} else {
  const mio = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-drawn');
    mio.unobserve(e.target);
  }), { rootMargin: '0px 0px -15% 0px' });
  marks.forEach((m) => mio.observe(m));
}

// ---------------------------------------------------------------------------
// 4. Projectbeelden: harde schaduw schuift op zijn plek (via .is-inview hierboven)
// 6. Stippen en driehoeken zweven één keer rustig (5 s) als ze in beeld komen.
//    Kort genoeg voor WCAG 2.2.2, en opnieuw zodra je er weer langs scrolt.
// ---------------------------------------------------------------------------
if (!reduceMotion && 'IntersectionObserver' in window) {
  const floaters = $$('.svg-dot-grid svg, .form__svg svg, .svg-double-arrows-down svg, .mobile-menu__dots');
  const fio = new IntersectionObserver((entries) => entries.forEach((e) => {
    const el = e.target as HTMLElement;
    if (e.isIntersecting) {
      el.classList.remove('is-floating');
      void el.offsetWidth;
      el.classList.add('is-floating');
    }
  }), { threshold: 0.3 });
  floaters.forEach((f) => fio.observe(f));
}

// ---------------------------------------------------------------------------
// 7. Tijdlijn bij Ervaring en Opleiding vult zich terwijl je scrolt
// ---------------------------------------------------------------------------
$$('.description-list').forEach((list) => {
  list.classList.add('has-timeline');
  if (reduceMotion) { list.style.setProperty('--progress', '1'); return; }
  gsap.to(list, {
    '--progress': 1,
    ease: 'none',
    scrollTrigger: { trigger: list, start: 'top 75%', end: 'bottom 55%', scrub: 0.6 },
  });
});

// Tooltips sluiten met Escape (WCAG 1.4.13); weer tonen zodra de muis beweegt of de focus verandert.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.body.classList.add('tips-dismissed');
});
const resetTips = () => document.body.classList.remove('tips-dismissed');
document.addEventListener('mousemove', resetTips, { passive: true });
document.addEventListener('focusin', resetTips);

window.addEventListener('load', () => ScrollTrigger.refresh());
