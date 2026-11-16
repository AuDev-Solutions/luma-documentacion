// Genera build/efectos.tex (anexo C) desde el catálogo real de LUMA: ../luma-app/src/lib/scenes.js.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { raiz } from './lib/tectonic.mjs';

const escapar = texto => String(texto ?? '').replace(/[_%&#$]/g, c => `\\${c}`);

export async function cargarEfectos() {
  const { effects } = await import(pathToFileURL(join(raiz, '..', 'luma-app', 'src', 'lib', 'scenes.js')).href);
  return effects;
}

export function efectosATex(efectos) {
  const filas = efectos.map(efecto =>
    `${escapar(efecto.name)}${efecto.featured ? ' $\\star$' : ''} & ${escapar(efecto.category)} & \\texttt{${escapar(efecto.wled)}} & ${escapar(efecto.description)} \\\\`);
  return [
    '% Generado por scripts/efectos.mjs desde luma-app/src/lib/scenes.js. No editar.',
    '\\begin{longtable}{@{}>{\\raggedright\\arraybackslash}p{0.22\\linewidth} >{\\raggedright\\arraybackslash}p{0.14\\linewidth} >{\\raggedright\\arraybackslash}p{0.22\\linewidth} >{\\raggedright\\arraybackslash}p{0.34\\linewidth}@{}}',
    '\\toprule \\textbf{Nombre en LUMA} & \\textbf{Categoría} & \\textbf{Efecto de WLED} & \\textbf{Descripción} \\\\ \\midrule \\endhead',
    ...filas,
    '\\bottomrule',
    '\\end{longtable}',
  ].join('\n');
}

export async function escribirEfectos() {
  mkdirSync(join(raiz, 'build'), { recursive: true });
  const efectos = await cargarEfectos();
  writeFileSync(join(raiz, 'build', 'efectos.tex'), efectosATex(efectos) + '\n');
  return efectos;
}
