// Regel uit het design system: nooit één woord alleen op de laatste regel.
// De laatste twee woorden van elk tekstblok worden aan elkaar gekoppeld, zodat ze
// samen naar de volgende regel gaan. Werkt ook voor teksten uit het CMS.
// CSS (text-wrap: pretty) doet het meeste werk; dit is het vangnet voor alle browsers.

const BLOCKS = 'h1, h2, h3, h4, h5, h6, p, li, dt, dd, figcaption, blockquote, label, .button__text';
// Tekst die je niet ziet of die los van de regel staat, telt niet mee
const IGNORE = 'svg, script, style, .visually-hidden, .tip__bubble, [aria-hidden="true"], [hidden]';
const NBSP = '\u00a0';
const done = new WeakSet<Element>();
type Join = { apply: () => void; undo: () => void; on: boolean; chain: HTMLElement[] };
const joins: Join[] = [];

const isBlocky = (el: Element) => /^(block|flex|grid|list-item|table|flow-root)/.test(getComputedStyle(el).display);
const isFlexOrGrid = (el: Element) => /(flex|grid)$/.test(getComputedStyle(el).display);

function textNodes(root: Element): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const hidden = n.parentElement?.closest(IGNORE);
      return hidden && hidden !== root && root.contains(hidden) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) out.push(n as Text);
  return out;
}

function fixBlock(el: Element) {
  if (done.has(el) || el.matches(IGNORE) || (el as HTMLElement).dataset.nowidow !== undefined) return;
  done.add(el);
  const kids = [...el.children].filter((c) => !c.matches(IGNORE));
  // In een flex- of grid-rij (bv. icoon + tekst) is elk kind een eigen tekstblok
  if (isFlexOrGrid(el)) { kids.forEach(fixBlock); return; }
  // Bevat het blok zelf blokken (een <li> met een <p>), dan regelen die het zelf
  if (kids.some(isBlocky)) { kids.filter(isBlocky).forEach(fixBlock); return; }
  joinLastTwo(el);
}

function joinLastTwo(el: Element) {
  const nodes = textNodes(el);
  const words = nodes.map((n) => n.data).join(' ').trim().split(/\s+/).filter(Boolean);
  if (words.length < 3) return;

  let seenWord = false;
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    for (let j = node.data.length - 1; j >= 0; j--) {
      const ch = node.data[j];
      if (ch === NBSP) return; // al gekoppeld
      if (/\S/.test(ch)) { seenWord = true; continue; }
      if (!seenWord) continue; // spaties aan het eind overslaan
      const hasWordBefore = /\S/.test(node.data.slice(0, j)) || nodes.slice(0, i).some((n) => /\S/.test(n.data));
      if (hasWordBefore) join(el, node, j);
      return;
    }
  }
}

// Koppel de laatste twee woorden: met een vaste spatie, of door ze samen in te wikkelen.
function join(el: Element, node: Text, j: number) {
  const chain = [el, el.parentElement, el.parentElement?.parentElement].filter(Boolean) as HTMLElement[];
  const prev = node.previousSibling;
  const next = node.nextSibling;
  const original = node.data;
  let wrap: HTMLSpanElement | null = null;
  let apply: () => void;
  let undo: () => void;

  if (original.trim() === '' && prev instanceof Element && next instanceof Element) {
    // Woorden in losse inline-block elementen (kernzin met cirkels): samen inwikkelen
    wrap = document.createElement('span');
    wrap.className = 'nowidow';
    apply = () => { node.parentNode!.insertBefore(wrap!, prev); wrap!.append(prev, node, next); };
    undo = () => { wrap!.replaceWith(prev, node, next); };
  } else {
    const joined = original.slice(0, j) + NBSP + original.slice(j + 1);
    // Een laatste woord met een streepje ("AI-tools") mag ook niet bij het streepje breken
    const hyphen = /[-\/]/.test(joined.slice(j + 1));
    const head = document.createTextNode(joined.slice(0, j + 1));
    const tail = document.createTextNode(joined.slice(j + 1));
    if (hyphen) { wrap = document.createElement('span'); wrap.className = 'nowidow'; wrap.append(tail); }
    apply = () => {
      if (hyphen) { node.replaceWith(head, wrap!); } else { node.data = joined; }
    };
    undo = () => {
      if (hyphen) { head.replaceWith(node); wrap!.remove(); } node.data = original;
    };
  }
  const entry: Join = { apply, undo, on: false, chain };
  joins.push(entry);
  check(entry);
  watch(chain[0], entry);
}

// Koppel, tenzij het blok (of de rij eromheen) daardoor breder wordt dan zijn vak
// (twee lange woorden op een smal scherm). Dan blijft de gewone afbreking staan.
function check(entry: Join) {
  if (entry.on) { entry.undo(); entry.on = false; }
  const before = entry.chain.map((b) => b.scrollWidth);
  entry.apply(); entry.on = true;
  if (entry.chain.some((b, k) => b.scrollWidth > Math.max(before[k], b.clientWidth) + 1)) {
    entry.undo(); entry.on = false;
  }
}

export function noWidows(root: ParentNode = document) {
  root.querySelectorAll(BLOCKS).forEach((el) => {
    // Alleen het buitenste blok starten; fixBlock loopt zelf naar binnen
    const outer = el.parentElement?.closest(BLOCKS);
    if (!outer) fixBlock(el);
  });
}

// Wordt een blok later smaller of breder (andere schermbreedte, een script dat de
// layout aanpast), dan opnieuw kijken of de koppeling nog past.
const byEl = new Map<Element, { width: number; entries: Join[] }>();
const pending = new Set<Join>();
let frame = 0;
const ro = new ResizeObserver((items) => {
  for (const it of items) {
    const rec = byEl.get(it.target);
    const w = Math.round(it.contentRect.width);
    if (!rec || rec.width === w) continue;
    rec.width = w;
    rec.entries.forEach((e) => pending.add(e));
  }
  if (pending.size && !frame) frame = requestAnimationFrame(() => { frame = 0; pending.forEach(check); pending.clear(); });
});
function watch(el: Element, entry: Join) {
  const rec = byEl.get(el);
  if (rec) { rec.entries.push(entry); return; }
  byEl.set(el, { width: Math.round(el.getBoundingClientRect().width), entries: [entry] });
  ro.observe(el);
}

// Pas meten als de lettertypes er zijn
const start = () => noWidows();
(document.fonts?.ready ?? Promise.resolve()).then(start, start);
