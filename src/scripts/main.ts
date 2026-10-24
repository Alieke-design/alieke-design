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
// Pagina's met een eigen pop-up (zoals AI Design Consultancy) zetten het meescrollen
// even stil zolang de pop-up open staat.
window.addEventListener('lenis:stop', () => lenis?.stop());
window.addEventListener('lenis:start', () => lenis?.start());

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
// Hetzelfde voor de stappen op de AI Design Consultancy-pagina (mobiel swipebaar).
const scrollLists = $$<HTMLElement>('.reviews, [data-steps]');
const updateReviewFocus = () => {
  scrollLists.forEach((list) => {
    const scrollable = list.scrollWidth > list.clientWidth + 1;
    list.classList.toggle('is-scrollable', scrollable);
    if (scrollable) list.setAttribute('tabindex', '0');
    else list.removeAttribute('tabindex');
  });
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
  '.text-image__text > :not(.quote-b), .projects__text > *, .content-repeater__content > *, .widget-block__inner > :not(.reviews), .review, .form__text > :not(.contact-spacer):not(.visually-hidden)',
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
const linksEl = headerEl?.querySelector<HTMLElement>('.header__links');
const placeIndicator = (active: HTMLAnchorElement | null) => {
  if (!indicator || !linksEl) return;
  if (!active || !active.offsetParent) { indicator.classList.remove('is-visible'); return; }
  const r = active.getBoundingClientRect();
  const n = linksEl.getBoundingClientRect();
  indicator.style.width = `${r.width}px`;
  indicator.style.transform = `translateX(${r.left - n.left}px)`;
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
  // …dan alleen schrijven wat veranderd is.
  if (theme !== lastTheme) { headerEl.dataset.theme = theme; lastTheme = theme; }
  if (force || active !== lastActive) {
    navLinks.forEach((a) => (a === active ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    lastActive = active;
    // Altijd de link van dát moment gebruiken, nooit een oude (anders springt de pil terug).
    requestAnimationFrame(() => placeIndicator(lastActive ?? null));
    if (force) setTimeout(() => placeIndicator(lastActive ?? null), 380);
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
// 3. Logo: letters komen omhoog en de gele stip valt erin (één keer bij laden).
//    Bij hover of focus maken de letters een golfje en springt de stip mee.
// ---------------------------------------------------------------------------
const logos = $$<HTMLElement>('.logo');
const restartLogo = (el: HTMLElement, cls: 'is-playing' | 'is-waving' | 'is-idle') => {
  el.classList.remove('is-playing', 'is-waving', 'is-idle');
  void el.getBoundingClientRect();
  el.classList.add(cls);
};
if (!reduceMotion) {
  logos.forEach((el) => {
    let busy = false;
    const done = () => { busy = false; };
    el.addEventListener('animationend', (e) => { if ((e.target as Element).classList.contains('logo__dot')) done(); });
    const wave = () => { if (busy) return; busy = true; restartLogo(el, 'is-waving'); };
    el.addEventListener('pointerenter', wave);
    el.addEventListener('focus', wave);
    if (!el.closest('.mobile-menu')) { busy = true; restartLogo(el, 'is-playing'); }
  });
  // Sta je even stil (8 s geen scroll, muis of toets), dan stuitert de stip nog eens.
  // Hooguit drie keer per bezoek, zodat het geen doorlopende beweging wordt (WCAG 2.2.2).
  const headerLogo = logos.find((el) => !el.closest('.mobile-menu'));
  if (headerLogo) {
    let idleTimer = 0, plays = 0;
    const arm = () => {
      window.clearTimeout(idleTimer);
      if (plays >= 3) return;
      idleTimer = window.setTimeout(() => {
        if (document.hidden || headerLogo.matches(':hover')) return arm();
        plays++;
        restartLogo(headerLogo, 'is-idle');
        arm();
      }, 8000);
    };
    ['scroll', 'pointermove', 'keydown', 'touchstart'].forEach((t) => window.addEventListener(t, arm, { passive: true }));
    arm();
  }
}

// ---------------------------------------------------------------------------
// Kernzin: woorden komen één voor één binnen, daarna tekenen de cirkels zich in.
// Eenmalig, zodra de zin in beeld komt.
// ---------------------------------------------------------------------------
const quotes = $$('[data-quote]');
if (reduceMotion || !('IntersectionObserver' in window)) {
  quotes.forEach((q) => q.classList.add('is-played'));
} else {
  const qio = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-played');
    qio.unobserve(e.target);
  }), { rootMargin: '0px 0px -10% 0px' });
  quotes.forEach((q) => qio.observe(q));
}

// ---------------------------------------------------------------------------
// 4. Projectkaarten komen rustig binnen (via .is-inview hierboven)
// 6. Stippen en driehoeken zweven één keer rustig (5 s) als ze in beeld komen.
//    Kort genoeg voor WCAG 2.2.2, en opnieuw zodra je er weer langs scrolt.
// ---------------------------------------------------------------------------
if (!reduceMotion && 'IntersectionObserver' in window) {
  const floaters = $$('.mobile-menu__dots');
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
// 5. Projectkaarten: diepte met de muis. Foto en tekstkaart bewegen een paar
//    pixels tegen elkaar in en een zacht lichtschijnsel volgt de cursor.
// ---------------------------------------------------------------------------
$$('.project').forEach((project) => {
  // Na het binnenkomen de overgang van de kaart uitzetten, zodat hij direct de muis volgt.
  const settle = () => window.setTimeout(() => project.classList.add('is-settled'), 1900);
  if (project.classList.contains('is-inview')) settle();
  else new MutationObserver((_, mo) => { if (project.classList.contains('is-inview')) { mo.disconnect(); settle(); } })
    .observe(project, { attributes: true, attributeFilter: ['class'] });

  if (reduceMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const media = project.querySelector<HTMLElement>('.project__media');
  const img = media?.querySelector<HTMLElement>('img, video');
  const card = project.querySelector<HTMLElement>('.project__text');
  if (!media || !img || !card) return;
  const sheen = document.createElement('span');
  sheen.className = 'project__sheen';
  sheen.setAttribute('aria-hidden', 'true');
  media.append(sheen);
  let tx = 0, ty = 0, x = 0, y = 0, ts = 1, sc = 1, raf = 0;
  let rect: DOMRect | null = null, mrect: DOMRect | null = null;
  const tick = () => {
    x += (tx - x) * 0.09; y += (ty - y) * 0.09; sc += (ts - sc) * 0.07;
    img.style.setProperty('--ix', `${(-x * 12).toFixed(2)}px`);
    img.style.setProperty('--iy', `${(-y * 9).toFixed(2)}px`);
    img.style.setProperty('--is', sc.toFixed(4));
    card.style.setProperty('--cx', `${(x * 7).toFixed(2)}px`);
    card.style.setProperty('--cy', `${(y * 5).toFixed(2)}px`);
    const still = Math.abs(tx - x) < 0.001 && Math.abs(ty - y) < 0.001 && Math.abs(ts - sc) < 0.0005;
    raf = still ? 0 : requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  project.addEventListener('pointerenter', () => {
    rect = project.getBoundingClientRect();
    mrect = media.getBoundingClientRect();
    project.classList.add('is-hovered');
  });
  project.addEventListener('pointermove', (e) => {
    if (!rect || !mrect) return;
    tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ty = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    ts = 1.05;
    sheen.style.setProperty('--sx', `${e.clientX - mrect.left}px`);
    sheen.style.setProperty('--sy', `${e.clientY - mrect.top}px`);
    kick();
  });
  project.addEventListener('pointerleave', () => {
    tx = 0; ty = 0; ts = 1; rect = null; mrect = null;
    project.classList.remove('is-hovered');
    kick();
  });
  // Bij scrollen verschuift de kaart; posities opnieuw opmeten bij de volgende beweging.
  window.addEventListener('scroll', () => { if (rect) { rect = project.getBoundingClientRect(); mrect = media.getBoundingClientRect(); } }, { passive: true });
});

// Portret in de hero: gele cirkel, foto en blauwe ring liggen op drie lagen
// en bewegen een paar pixels tegen elkaar in als je de muis beweegt.
const portrait = document.querySelector<HTMLElement>('.text-image__media');
const heroSection = portrait?.closest<HTMLElement>('section');
if (portrait && heroSection && !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
  const layers: [string, string, number, number][] = [['--hx1', '--hy1', -3, -2], ['--hx2', '--hy2', 4, 3], ['--hx3', '--hy3', -12, -9]];
  const tick = () => {
    x += (tx - x) * 0.08; y += (ty - y) * 0.08;
    for (const [vx, vy, ax, ay] of layers) {
      portrait.style.setProperty(vx, `${(x * ax).toFixed(2)}px`);
      portrait.style.setProperty(vy, `${(y * ay).toFixed(2)}px`);
    }
    raf = Math.abs(tx - x) < 0.001 && Math.abs(ty - y) < 0.001 ? 0 : requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  heroSection.addEventListener('pointermove', (e) => {
    const r = portrait.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    tx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)));
    ty = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));
    kick();
  });
  heroSection.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
}

// ---------------------------------------------------------------------------
// Stippen en pijlen
// - Stippen bovenaan komen tegelijk met de rest binnen, die bij Contact als golf.
// - Met de muis wijken stippen dichtbij de cursor een paar pixels uit.
// - Pijlen schuiven één keer naar beneden en veren terug als ze in beeld komen.
// ---------------------------------------------------------------------------
const dotGrids = $$<SVGSVGElement>('[data-dots]');
const arrowSets = $$('.svg-double-arrows-down');
if (reduceMotion || !('IntersectionObserver' in window)) {
  dotGrids.forEach((g) => g.classList.add('is-dotted'));
} else {
  const dio = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add(e.target.matches('[data-dots]') ? 'is-dotted' : 'is-nudged');
    dio.unobserve(e.target);
  }), { threshold: 0.35 });
  dotGrids.forEach((g) => dio.observe(g));
  arrowSets.forEach((a) => dio.observe(a));
}
if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  type Dot = { el: SVGCircleElement; cx: number; cy: number; x: number; y: number; tx: number; ty: number };
  const grids = dotGrids.map((svg) => {
    const vb = svg.viewBox.baseVal;
    const dots: Dot[] = [...svg.querySelectorAll('circle')].map((el) => ({
      el, cx: el.cx.baseVal.value, cy: el.cy.baseVal.value, x: 0, y: 0, tx: 0, ty: 0,
    }));
    return { svg, vb, dots, visible: false };
  });
  const vio = new IntersectionObserver((entries) => entries.forEach((e) => {
    const g = grids.find((x) => x.svg === e.target);
    if (g) g.visible = e.isIntersecting;
  }));
  grids.forEach((g) => vio.observe(g.svg));
  let px = -9999, py = -9999, raf = 0;
  const R = 110, PUSH = 12;
  const tick = () => {
    let moving = false;
    for (const g of grids) {
      if (!g.visible) continue;
      const r = g.svg.getBoundingClientRect();
      const sx = r.width / g.vb.width, sy = r.height / g.vb.height;
      for (const d of g.dots) {
        const dx = r.left + d.cx * sx - px, dy = r.top + d.cy * sy - py;
        const dist = Math.hypot(dx, dy);
        const f = dist < R ? (1 - dist / R) ** 2 : 0;
        d.tx = dist > 0.01 ? (dx / dist) * f * PUSH : 0;
        d.ty = dist > 0.01 ? (dy / dist) * f * PUSH : 0;
        d.x += (d.tx - d.x) * 0.15; d.y += (d.ty - d.y) * 0.15;
        if (Math.abs(d.tx - d.x) > 0.02 || Math.abs(d.ty - d.y) > 0.02) moving = true;
        // terug naar viewBox-eenheden
        d.el.style.transform = `translate(${(d.x / sx).toFixed(2)}px, ${(d.y / sy).toFixed(2)}px)`;
      }
    }
    raf = moving ? requestAnimationFrame(tick) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  window.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; if (grids.some((g) => g.visible)) kick(); }, { passive: true });
  document.addEventListener('pointerleave', () => { px = -9999; py = -9999; kick(); });
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
