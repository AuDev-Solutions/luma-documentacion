import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cargarDatos, generarCfgPlantilla } from '../scripts/generar-datos.mjs';

const leerJson = ruta => JSON.parse(readFileSync(new URL(ruta, import.meta.url), 'utf8'));
const datos = cargarDatos();
// Configuración real del poste que funciona (fuera de este repositorio, contiene la red de casa).
const cfgReal = leerJson('../../luma-app/.local/cfg-2026-11-18.json');
const plantilla = generarCfgPlantilla(datos, cfgReal);

test('dos salidas de 100 LEDs desde el LED 0: cara A en RMT, cara B en I2S, la B repite la A', () => {
  const { total, ins } = plantilla.hw.led;
  assert.equal(total, 100, 'WLED ve 100 LED (200 físicos)');
  assert.equal(ins.length, 2);
  assert.deepEqual([ins[0].start, ins[0].len, ins[0].pin, ins[0].type, ins[0].drv], [0, 100, [17], 22, 0]);
  assert.deepEqual([ins[1].start, ins[1].len, ins[1].pin, ins[1].type, ins[1].drv], [0, 100, [3], 22, 1]);
});

test('red propia LUMA-Poste1 en 4.3.2.1, siempre activa', () => {
  assert.equal(plantilla.ap.ssid, 'LUMA-Poste1');
  assert.equal(plantilla.ap.behav, 2);
  assert.deepEqual(plantilla.ap.ip, [4, 3, 2, 1]);
});

test('no lleva la red de casa ni identificadores del poste original', () => {
  const ssidCasa = cfgReal.nw.ins[0].ssid;
  assert.ok(ssidCasa, 'la configuración real debería tener una red de casa');
  assert.ok(!JSON.stringify(plantilla).includes(ssidCasa));
  assert.ok(plantilla.nw.ins.every(red => red.ssid === ''));
  assert.equal(plantilla.if.mqtt.cid, '');
});

test('límite de corriente apagado: se fija en LUMA con los amperios reales de la fuente', () => {
  assert.equal(plantilla.hw.led.maxpwr, 0);
});

test('la plantilla publicada es la que genera el script', () => {
  assert.deepEqual(leerJson('../archivos/cfg-plantilla.json'), plantilla);
});
