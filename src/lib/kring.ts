// Hulpjes voor teksten uit het CMS die een beetje opmaak nodig hebben.

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Dezelfde twee handgetekende cirkels als in Quote.astro; ze wisselen elkaar af.
const cirkels = [
  'M118 5 C 62 1, 9 13, 7 35 C 5 57, 66 67, 118 65 C 172 63, 215 51, 213 33 C 211 13, 162 3, 96 9',
  'M120 6 C 60 2, 8 14, 6 36 C 4 58, 70 66, 120 64 C 175 62, 216 50, 214 32 C 212 12, 160 4, 100 8',
];

/** Tekst met *sterretjes* → woorden met een gele cirkel eromheen (class "qk"). Geeft HTML terug.
 *  regeleinde: waarmee een nieuwe regel in de tekst wordt vervangen (standaard een spatie). */
export function kring(text: string, regeleinde = ' '): string {
  let k = 0;
  return esc(text).replace(/\r?\n/g, regeleinde).replace(/\*(.+?)\*/g, (_, woord) => {
    const d = cirkels[k++ % cirkels.length];
    return `<span class="qk">${woord}<svg viewBox="0 0 220 70" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="${d}"></path></svg></span>`;
  });
}

/** Tekst met regeleinden → HTML met <br>. */
export function regels(text: string): string {
  return esc(text).replace(/\r?\n/g, '<br>');
}
