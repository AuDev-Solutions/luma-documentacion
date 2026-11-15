import test from 'node:test';
import assert from 'node:assert/strict';
import { extraerFotos } from '../scripts/lista-fotos.mjs';

test('extrae id y descripción de una foto', () => {
  assert.deepEqual(extraerFotos('\\foto{placa-superior}{Placa por arriba}{0.8}'), [{ id: 'placa-superior', descripcion: 'Placa por arriba' }]);
});

test('extrae varias fotos de un mismo texto', () => {
  const texto = 'Antes \\foto{a}{Uno}{0.5} medio \\foto{b}{Dos}{1} fin';
  assert.equal(extraerFotos(texto).length, 2);
});

test('un texto sin fotos no devuelve nada', () => {
  assert.deepEqual(extraerFotos('Sin imágenes \\captura{x}{y}'), []);
});
