// Eén pauzeknop zet alle beweging stil die langer dan 5 seconden doorloopt
// (WCAG 2.2.2): de hero-illustratie, de stip op de lus en de stippellijn.
// De keuze blijft bewaard tijdens het bezoek (sessionStorage).

const KEY = 'motion-paused';
const root = document.documentElement;
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-motion-pause]'));
const status = document.querySelector<HTMLElement>('[data-motion-status]');

// Alles met SMIL-animaties (<animate>, <animateMotion>) pauzeert via de svg zelf;
// CSS-animaties via de class op <html>.
const svgs = () => Array.from(document.querySelectorAll<SVGSVGElement>('svg[data-motion-smil]'));

export const motionPaused = () => root.classList.contains('motion-paused');

function apply(paused: boolean, announce: boolean) {
  root.classList.toggle('motion-paused', paused);
  svgs().forEach((svg) => (paused ? svg.pauseAnimations() : svg.unpauseAnimations()));
  buttons.forEach((btn) => {
    btn.setAttribute('aria-pressed', String(paused));
    btn.setAttribute('aria-label', paused ? 'Animatie afspelen' : 'Animatie pauzeren');
  });
  if (announce && status) status.textContent = paused ? 'Animatie gepauzeerd' : 'Animatie speelt weer';
  try { sessionStorage.setItem(KEY, paused ? '1' : '0'); } catch {}
}

let saved = false;
try { saved = sessionStorage.getItem(KEY) === '1'; } catch {}
if (saved) apply(true, false);

buttons.forEach((btn) => {
  btn.addEventListener('click', () => apply(!motionPaused(), true));
  // Escape verbergt de knop weer (focus weg), zoals een tooltip
  btn.addEventListener('keydown', (e) => { if (e.key === 'Escape') btn.blur(); });
});
