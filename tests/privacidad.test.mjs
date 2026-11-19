import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const omitir = new Set(['build', 'herramientas', 'entregables', 'node_modules', '.git', '.superpowers', 'img', '.privado']);
// Este archivo nombra los patrones prohibidos; no se revisa a sí mismo.
const esteArchivo = fileURLToPath(import.meta.url);
// Palabras privadas propias de cada equipo (redes, usuarios): una por línea en .privado/palabras.txt,
// que no se sube al repositorio. Sin ese archivo solo se revisan los patrones generales.
const archivoLocal = join(raiz, '.privado', 'palabras.txt');
const escapar = texto => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const locales = existsSync(archivoLocal)
  ? readFileSync(archivoLocal, 'utf8').split(/\r?\n/).map(linea => linea.trim()).filter(Boolean).map(escapar)
  : [];
const prohibido = new RegExp(['@gmail\\.com', '"psk"\\s*:', ...locales].join('|'), 'i');

function archivos(dir) {
  return readdirSync(dir).flatMap(nombre => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return omitir.has(nombre) ? [] : archivos(ruta);
    return [ruta];
  });
}

test('ningún archivo contiene datos privados', () => {
  for (const ruta of archivos(raiz)) {
    if (ruta === esteArchivo || /\.(png|jpe?g|pdf|zip|bin|exe)$/i.test(ruta)) continue;
    assert.doesNotMatch(readFileSync(ruta, 'utf8'), prohibido, `Dato privado en ${relative(raiz, ruta)}`);
  }
});
