// Localiza Tectonic y compila un .tex del proyecto a build/.
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const raiz = fileURLToPath(new URL('../../', import.meta.url));

export function encontrarTectonic() {
  if (process.env.TECTONIC && existsSync(process.env.TECTONIC)) return process.env.TECTONIC;
  const local = join(raiz, 'herramientas', process.platform === 'win32' ? 'tectonic.exe' : 'tectonic');
  if (existsSync(local)) return local;
  const enPath = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['tectonic'], { encoding: 'utf8' });
  if (enPath.status === 0) return enPath.stdout.split(/\r?\n/)[0].trim();
  throw new Error('Tectonic no encontrado: colócalo en documentacion/herramientas/ o define la variable TECTONIC.');
}

export function compilar(archivoTex, { salida = 'build' } = {}) {
  const outdir = join(raiz, salida);
  mkdirSync(outdir, { recursive: true });
  const nombre = basename(archivoTex).replace(/\.tex$/, '');
  return new Promise((resolve, reject) => {
    const proceso = spawn(encontrarTectonic(), ['-X', 'compile', archivoTex, '--outdir', outdir, '--keep-logs'], { cwd: raiz });
    let consola = '';
    proceso.stdout.on('data', parte => { consola += parte; });
    proceso.stderr.on('data', parte => { consola += parte; });
    proceso.on('error', reject);
    proceso.on('close', codigo => {
      const rutaLog = join(outdir, `${nombre}.log`);
      const log = (existsSync(rutaLog) ? readFileSync(rutaLog, 'utf8') : '') + '\n' + consola;
      if (codigo !== 0) return reject(Object.assign(new Error(`Tectonic falló compilando ${archivoTex} (código ${codigo}).\n${consola.slice(-3000)}`), { log }));
      resolve({ pdf: join(outdir, `${nombre}.pdf`), log });
    });
  });
}
