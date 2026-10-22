// Cookiemelding + Google Analytics. Analytics laadt pas na toestemming.
const banner = document.querySelector<HTMLElement>('.cookie-banner');
const KEY = 'cookie-consent';

const read = () => {
  try { return localStorage.getItem(KEY); } catch { return null; }
};
const save = (value: string) => {
  try { localStorage.setItem(KEY, value); } catch { /* opslag geblokkeerd */ }
};

function loadAnalytics(id: string) {
  if (document.getElementById('ga-script')) return;
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() { w.dataLayer.push(arguments); };
  w.gtag('js', new Date());
  w.gtag('config', id, { anonymize_ip: true });
  const s = document.createElement('script');
  s.id = 'ga-script';
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
}

function clearAnalyticsCookies() {
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim();
    if (!name.startsWith('_ga')) return;
    const domain = location.hostname.replace(/^www\./, '');
    document.cookie = `${name}=; Max-Age=0; path=/`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.${domain}`;
  });
}

if (banner) {
  const id = banner.dataset.gaId || '';
  const show = (focus = false) => {
    banner.hidden = false;
    if (focus) banner.querySelector<HTMLButtonElement>('[data-consent="granted"]')?.focus();
  };

  const choice = read();
  if (choice === 'granted') loadAnalytics(id);
  else if (choice !== 'denied') show();

  banner.querySelectorAll<HTMLButtonElement>('[data-consent]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.consent!;
      save(value);
      banner.hidden = true;
      if (value === 'granted') loadAnalytics(id);
      else clearAnalyticsCookies();
    });
  });

  document.querySelector('[data-cookie-settings]')?.addEventListener('click', () => show(true));
}
