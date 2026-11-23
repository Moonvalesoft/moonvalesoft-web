// design/tokens.json → app/tokens.css (CSS değişkenleri). Renkler sadece buradan gelir.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, '../../../design/tokens.json'), 'utf8'));
const kebab = (s) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
const block = (sel, colors) =>
  `${sel} {\n` + Object.entries(colors).map(([k, v]) => `  --mv-${kebab(k)}: ${v};`).join('\n') + '\n}\n';

const g = tokens.color.gece;
const d = { moon: g.accent, ...tokens.color.gunduz };
let css = '/* Otomatik üretildi: npm run tokens. Elle düzenleme; design/tokens.json değiştir. */\n';
css += block(':root, [data-theme="gece"]', { moon: g.accent, ...g });
css += ':root, [data-theme="gece"] { color-scheme: dark; }\n';
css += block('[data-theme="gunduz"]', d);
css += '[data-theme="gunduz"] { color-scheme: light; }\n';
css += `:root {\n  --mv-radius-sm: ${tokens.radius.sm}px;\n  --mv-radius-md: ${tokens.radius.md}px;\n  --mv-radius-lg: ${tokens.radius.lg}px;\n  --mv-max-width: ${tokens.space.maxWidth}px;\n}\n`;
writeFileSync(join(here, '../app/tokens.css'), css);
console.log('tokens.css yazıldı');
