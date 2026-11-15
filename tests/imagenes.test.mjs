import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
// Capturas que produce luma-app/scripts/capturas-manual.mjs (npm run capturas:manual).
export const capturas = ['inicio-desconectado', 'conectar-dialogo', 'conectado', 'colores', 'efectos-galeria', 'efecto-detalle', 'segmentos',
  'escenas-guardar', 'escenas-lista', 'modo-automatico', 'horario', 'temas', 'brillo', 'mi-montaje', 'consumo', 'seguridad', 'wifi-propio',
  'vista-poste-ampliada', 'escritorio-general', 'escritorio-segmentos'];

function archivosTex(dir) {
  return readdirSync(dir).flatMap(nombre => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return ['build', 'herramientas', 'entregables', 'node_modules', '.git', '.superpowers'].includes(nombre) ? [] : archivosTex(ruta);
    return ruta.endsWith('.tex') ? [ruta] : [];
  });
}

test('las 20 capturas de LUMA existen', () => {
  for (const nombre of capturas) assert.ok(existsSync(join(raiz, 'img', 'app', `${nombre}.png`)), `falta img/app/${nombre}.png`);
});

test('cada imagen citada en el manual existe', () => {
  for (const ruta of archivosTex(raiz)) {
    const texto = readFileSync(ruta, 'utf8');
    for (const [, nombre] of texto.matchAll(/\\captura(?:\[[^\]]*\])?\{([^}]*)\}/g)) {
      assert.ok(existsSync(join(raiz, 'img', 'app', `${nombre}.png`)), `${relative(raiz, ruta)} cita img/app/${nombre}.png, que no existe`);
    }
    for (const [, archivo] of texto.matchAll(/\\includegraphics(?:\[[^\]]*\])?\{([^}#]*)\}/g)) {
      assert.ok(existsSync(join(raiz, archivo)), `${relative(raiz, ruta)} cita ${archivo}, que no existe`);
    }
  }
});
