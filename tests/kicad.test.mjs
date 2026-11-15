import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { bomCsvATex, kicadCli } from '../scripts/exportar-kicad.mjs';

const csv = [
  '"Reference","Value","Footprint","QUANTITY","DNP"',
  '"U1","ESP32-S3 N16R8","Espressif:ESP32-S3-DevKitC","1",""',
  '"F1,F2,F5-F7","Fuse","Fuse:Fuseholder_Clip-5x20mm_Keystone_3512P","5",""',
  '"R1,R2","R","Resistor_THT:R_Axial_DIN0207","2",""',
].join('\n');
const filas = bomCsvATex(csv).split('\n').filter(linea => linea.includes('\\\\'));

test('la lista de materiales incluye la ESP32 con su proveedor', () => {
  const u1 = filas.find(fila => fila.startsWith('U1'));
  assert.ok(u1);
  assert.match(u1, /Electronilab/);
});

test('la fila de fusibles avisa que F5 no protege, aunque venga en un rango', () => {
  assert.match(filas.find(fila => fila.includes('F5')), /NO PROTEGE/);
});

test('un componente sin proveedor conocido queda por confirmar', () => {
  assert.match(filas.find(fila => fila.startsWith('R1')), /por confirmar/);
});

const imagenes = ['esquema.pdf', 'cobre-superior.pdf', 'cobre-inferior.pdf', '3d-superior.png', '3d-inferior.png'];
test('los exportes de KiCad existen', { skip: !existsSync(kicadCli()) && 'kicad-cli no instalado' }, () => {
  for (const nombre of imagenes) {
    const ruta = new URL(`../img/pcb/${nombre}`, import.meta.url);
    assert.ok(existsSync(ruta) && statSync(ruta).size > 0, `falta img/pcb/${nombre}`);
  }
  const bom = readFileSync(new URL('../build/bom.csv', import.meta.url), 'utf8');
  for (const ref of ['U1', 'F1', 'LM1', 'INY1']) assert.ok(bom.includes(ref), `bom.csv sin ${ref}`);
});
