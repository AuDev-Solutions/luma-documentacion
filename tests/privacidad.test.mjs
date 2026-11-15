import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const omitir = new Set(['build', 'herramientas', 'entregables', 'node_modules', '.git', '.superpowers', 'img']);
// Este archivo nombra los patrones prohibidos; no se revisa a sí mismo.
const esteArchivo = fileURLToPath(import.meta.url);
const prohibido = /192\.168\.80\.|@gmail\.com|"psk"\s*:/i;

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
