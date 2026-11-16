import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { compilar } from '../scripts/lib/tectonic.mjs';
import { escribirDatos } from '../scripts/generar-datos.mjs';
import { escribirEfectos } from '../scripts/efectos.mjs';

const raiz = fileURLToPath(new URL('..', import.meta.url));

test('el manual compila y no deja referencias rotas', { timeout: 600000 }, async () => {
  escribirDatos();
  await escribirEfectos();
  const { pdf, log } = await compilar('manual.tex');
  assert.ok(existsSync(pdf), `No se generó ${pdf}`);
  assert.equal(pdf, join(raiz, 'build', 'manual.pdf'));
  assert.doesNotMatch(log, /multiply defined|undefined references|Reference `[^']+' on page \d+ undefined|File `[^']+' not found/);
});
