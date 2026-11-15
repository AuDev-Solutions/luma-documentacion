import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
// Lo único que el equipo acordó dejar pendiente (diseño, sección 12).
const permitidos = new Set(['empresa', 'cliente', 'logo', 'repositorioApp', 'pinesConfirmados', 'fusibles', 'listaCompra', 'capturasWled']);

function archivosTex(dir) {
  return readdirSync(dir).flatMap(nombre => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return ['build', 'herramientas', 'entregables', 'node_modules', '.git', '.superpowers'].includes(nombre) ? [] : archivosTex(ruta);
    return ruta.endsWith('.tex') ? [ruta] : [];
  });
}

test('solo quedan pendientes los datos acordados con el equipo', () => {
  for (const ruta of archivosTex(raiz)) {
    if (ruta.endsWith('luma.sty')) continue;
    for (const [, clave] of readFileSync(ruta, 'utf8').matchAll(/\\pendiente\{([^}]*)\}/g)) {
      assert.ok(permitidos.has(clave), `Pendiente no acordado «${clave}» en ${relative(raiz, ruta)}`);
    }
  }
});
