// Copia a entregables/ todo lo que se entrega al cliente. El firmware lo deja ahí npm run firmware.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { raiz } from './lib/tectonic.mjs';
import { proyectoPcb } from './exportar-kicad.mjs';

export const destino = join(raiz, 'entregables');

export function archivosEntregables() {
  return [
    [join(raiz, 'build', 'manual.pdf'), 'Manual-LUMA.pdf'],
    [join(raiz, 'build', 'hoja-verificacion.pdf'), 'Hoja-de-verificacion.pdf'],
    [join(raiz, 'archivos', 'cfg-plantilla.json'), 'cfg-plantilla.json'],
    [join(raiz, 'build', 'lista-fotos.md'), 'Lista-de-fotos.md'],
    [join(proyectoPcb, 'gerber.zip'), join('placa', 'gerber.zip')],
    [join(proyectoPcb, 'PCB_V2_schematic.pdf'), join('placa', 'PCB_V2_schematic.pdf')],
    [join(raiz, '..', 'luma-app', 'dist-poste'), 'luma-poste'],
  ];
}

export function copiarEntregables() {
  const faltan = [];
  mkdirSync(destino, { recursive: true });
  for (const [origen, nombre] of archivosEntregables()) {
    if (!existsSync(origen)) { faltan.push(origen); continue; }
    cpSync(origen, join(destino, nombre), { recursive: true });
  }
  if (!existsSync(join(destino, 'firmware'))) faltan.push('entregables/firmware (ejecuta npm run firmware)');
  return faltan;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const faltan = copiarEntregables();
  if (faltan.length) { console.error(`Faltan:\n  ${faltan.join('\n  ')}`); process.exit(1); }
  console.log(`Listo: ${destino}`);
}
