import test from 'node:test';
import assert from 'node:assert/strict';
import { efectosATex, cargarEfectos } from '../scripts/efectos.mjs';

test('el anexo de efectos tiene una fila por cada efecto de LUMA', async () => {
  const efectos = await cargarEfectos();
  const tex = efectosATex(efectos);
  const filas = tex.split('\n').filter(linea => linea.trim().endsWith('\\\\') && !linea.includes('\\textbf'));
  assert.equal(filas.length, efectos.length);
  assert.ok(efectos.length >= 30);
});

test('marca los efectos de «Selección» y escapa los caracteres especiales', () => {
  const tex = efectosATex([{ name: 'Fuego & 100%', wled: 'Fire_2012', category: 'Movimiento', description: 'x', featured: true }]);
  assert.match(tex, /Fuego \\& 100\\%/);
  assert.match(tex, /Fire\\_2012/);
  assert.match(tex, /\$\\star\$/);
});
