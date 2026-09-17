import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const pages = ['index.html', 'macchinari/dm-40/index.html'];
const attributePattern = /(?:href|src)="([^"]+)"/g;
const errors = [];

for (const page of pages) {
  if (!existsSync(page)) {
    errors.push(`${page}: file mancante`);
    continue;
  }

  const html = readFileSync(page, 'utf8');
  for (const [, reference] of html.matchAll(attributePattern)) {
    if (/^(?:[a-z]+:|#|\/\/)/i.test(reference)) continue;
    const cleanReference = reference.split(/[?#]/, 1)[0];
    if (!cleanReference) continue;
    const target = resolve(dirname(page), cleanReference);
    const candidates = [target, resolve(target, 'index.html')];
    if (!candidates.some(existsSync)) errors.push(`${page}: riferimento mancante ${reference}`);
  }
}

for (const required of [
  'assets/dm40.glb',
  'assets/room-back.webp',
  'assets/room-left.webp',
  'assets/room-right.webp',
  'assets/showroom-door.webp',
  'showroom-3d.js'
]) {
  if (!existsSync(required)) errors.push(`${required}: asset essenziale mancante`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Struttura e collegamenti locali validi.');
