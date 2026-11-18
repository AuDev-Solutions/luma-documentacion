import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { cargarDatos, aMacrosTex } from '../scripts/generar-datos.mjs';

const leer = ruta => readFileSync(new URL(ruta, import.meta.url), 'utf8');
const datos = cargarDatos();

test('la versión de WLED coincide con el código del firmware', () => {
  assert.equal(datos.wledVersion, JSON.parse(leer('../../WLED/package.json')).version);
});

test('el commit de WLED documentado es el que está en el repositorio', () => {
  const head = execFileSync('git', ['-C', new URL('../../WLED', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  assert.ok(head.startsWith(datos.wledCommit), `HEAD de WLED es ${head}`);
});

test('el entorno de compilación existe en platformio.ini', () => {
  assert.ok(leer('../../WLED/platformio.ini').includes(`[env:${datos.wledEntorno}]`));
});

test('producción: 100 LEDs por cara y el total cuadra', () => {
  assert.equal(datos.ledsPorCara, 100);
  assert.equal(datos.ledsTotal, datos.ledsPorCara * datos.caras);
  assert.equal(datos.ledsWled, datos.ledsPorCara, 'la cara B repite la A: WLED ve una cara');
});

test('los comandos de LUMA que cita el manual existen', () => {
  const scripts = JSON.parse(leer('../../luma-app/package.json')).scripts;
  for (const nombre of ['dev', 'test', 'test:e2e', 'build:poste', 'instalar:poste']) assert.ok(scripts[nombre], `falta npm run ${nombre}`);
});

test('aMacrosTex: null es PENDIENTE, claves anidadas con punto y caracteres escapados', () => {
  const tex = aMacrosTex({ a: null, b: { c: 'x_y' }, d: '50 % & #1 $' });
  assert.ok(tex.includes('\\setdato{a}{\\PENDIENTE}'));
  assert.ok(tex.includes('\\setdato{b.c}{x\\_y}'));
  assert.ok(tex.includes('\\setdato{d}{50 \\% \\& \\#1 \\$}'));
});
