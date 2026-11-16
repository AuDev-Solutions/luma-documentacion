import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compilar } from '../scripts/lib/tectonic.mjs';
import { escribirDatos } from '../scripts/generar-datos.mjs';

test('la hoja de verificación cabe en exactamente una página', { timeout: 600000 }, async () => {
  escribirDatos();
  // XeTeX comprime los objetos del PDF: el número de páginas se lee del registro de la compilación.
  const { log } = await compilar('hoja-verificacion.tex');
  assert.match(log, /Output written on hoja-verificacion\.xdv \(1 page[,)]/);
});

test('la hoja no pide escribir contraseñas', () => {
  const hoja = readFileSync(new URL('../capitulos/hoja-contenido.tex', import.meta.url), 'utf8');
  assert.match(hoja, /contraseña/i);
  assert.doesNotMatch(hoja, /contraseña[^\n]*\\linea/i, 'la contraseña se marca con casilla, nunca se escribe');
});
