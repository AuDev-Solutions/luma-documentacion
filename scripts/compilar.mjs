// npm run pdf: compila el manual (y la hoja de verificación si existe) y actualiza la lista de fotos.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { compilar, raiz } from './lib/tectonic.mjs';
import { escribirLista } from './lista-fotos.mjs';
import { escribirDatos } from './generar-datos.mjs';

escribirDatos();

for (const tex of ['manual.tex', 'hoja-verificacion.tex']) {
  if (!existsSync(join(raiz, tex))) continue;
  const { pdf } = await compilar(tex);
  console.log(`Listo: ${pdf}`);
}
const fotos = escribirLista();
console.log(`Lista de fotos: ${fotos.length} tomas en build/lista-fotos.md`);
