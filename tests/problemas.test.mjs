import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const capitulo = readFileSync(new URL('../capitulos/17-problemas.tex', import.meta.url), 'utf8');
// Filas de la tabla síntoma → causa → solución (terminan en \\).
const filas = capitulo.split(/\\\\\s*\n/).map(fila => fila.toLowerCase());

const casos = {
  'segunda cara apagada (I2S)': [/cara b|segunda cara/, /i2s/],
  'cambios que no se aplican (cortar la corriente)': [/no se aplic/, /corta la corriente/],
  'red de 5 GHz': [/5\s*~?ghz/],
  'hora perdida tras un corte': [/hora/, /corte/],
  'poste que no responde': [/no responde/],
  'no aparece la red propia': [/no aparece la red/],
  'PIN olvidado': [/pin/, /olvid/],
  'LUMA no conecta desde una página HTTPS': [/https/],
};

for (const [caso, patrones] of Object.entries(casos)) {
  test(`la tabla de problemas cubre: ${caso}`, () => {
    assert.ok(filas.some(fila => patrones.every(patron => patron.test(fila))), `falta una fila para «${caso}»`);
  });
}
