import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { binarioCompleto } from '../scripts/firmware.mjs';

const capitulo = readFileSync(new URL('../capitulos/08-grabar-firmware.tex', import.meta.url), 'utf8');

test('la advertencia de USB y LM2596 aparece antes del primer comando de grabación', () => {
  const advertencias = [...capitulo.matchAll(/\\advertencia\{/g)].map(m => m.index)
    .filter(inicio => { const texto = capitulo.slice(inicio, inicio + 600); return /USB/.test(texto) && /LM2596/.test(texto); });
  const comandos = [...capitulo.matchAll(/\\begin\{comando\}([\s\S]*?)\\end\{comando\}/g)].filter(([, cuerpo]) => /esptool|write[-_]flash/.test(cuerpo));
  assert.ok(advertencias.length, 'falta la advertencia de USB + LM2596');
  assert.ok(comandos.length, 'falta el comando de grabación');
  assert.ok(advertencias[0] < comandos[0].index, 'la advertencia debe ir antes del primer comando de grabación');
});

test('el comando de grabación usa el nombre del binario que produce firmware.mjs', () => {
  assert.ok(capitulo.includes(binarioCompleto.split(/[\\/]/).pop().replaceAll('_', '\\_')) || capitulo.includes(binarioCompleto.split(/[\\/]/).pop()));
});

test('el binario completo pesa más de 1 MB', { skip: !existsSync(binarioCompleto) && 'binario no generado (npm run firmware)' }, () => {
  assert.ok(statSync(binarioCompleto).size > 1024 * 1024);
});
