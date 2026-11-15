// Lista de fotos que el equipo debe tomar: sale de cada \foto{id}{descripcion}{ancho} de los .tex.
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));

export function extraerFotos(texto) {
  return [...texto.matchAll(/\\foto\{([^}]*)\}\{([^}]*)\}\{[^}]*\}/g)].map(([, id, descripcion]) => ({ id, descripcion }));
}

function archivosTex(dir) {
  return readdirSync(dir).flatMap(nombre => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return ['build', 'herramientas', 'entregables', 'node_modules', '.git', '.superpowers'].includes(nombre) ? [] : archivosTex(ruta);
    return ruta.endsWith('.tex') ? [ruta] : [];
  });
}

export function escribirLista() {
  const fotos = archivosTex(raiz).flatMap(ruta => extraerFotos(readFileSync(ruta, 'utf8')).map(foto => ({ ...foto, capitulo: relative(raiz, ruta).replaceAll('\\', '/') })));
  const filas = fotos.map(({ id, descripcion, capitulo }) => {
    const archivo = `img/fotos/${id}.jpg`;
    return `| ${existsSync(join(raiz, archivo)) ? 'Lista' : 'Falta'} | \`${archivo}\` | ${descripcion} | ${capitulo} |`;
  });
  const texto = ['# Lista de fotos para el manual LUMA', '', 'Guarda cada foto en JPG con el nombre exacto indicado y vuelve a compilar (`npm run pdf`).', '',
    '| Estado | Archivo | Qué fotografiar | Capítulo |', '|---|---|---|---|', ...filas, ''].join('\n');
  mkdirSync(join(raiz, 'build'), { recursive: true });
  writeFileSync(join(raiz, 'build', 'lista-fotos.md'), texto);
  return fotos;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const fotos = escribirLista();
  console.log(`Lista de fotos: ${fotos.length} tomas en build/lista-fotos.md`);
}
