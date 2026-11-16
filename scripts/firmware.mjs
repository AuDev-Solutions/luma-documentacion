// npm run firmware: compila WLED para la ESP32-S3 N16R8 y arma dos binarios en entregables/firmware/:
//   ..._completo.bin       imagen entera para una placa nueva (grabar en 0x0)
//   ..._actualizacion.bin  solo la aplicación, para actualizar por Wi-Fi (OTA)
// Uso: npm run firmware            (compila y arma)
//      npm run firmware -- --armar (solo arma, con una compilación existente)
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cargarDatos } from './generar-datos.mjs';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const datos = cargarDatos();
const wled = join(raiz, '..', 'WLED');
const platformio = join(homedir(), '.platformio');
const compilacion = join(wled, '.pio', 'build', datos.wledEntorno);
const salida = join(raiz, 'entregables', 'firmware');
const nombre = `WLED_${datos.wledVersion}_ESP32-S3_N16R8`;
export const binarioCompleto = join(salida, `${nombre}_completo.bin`);
export const binarioActualizacion = join(salida, `${nombre}_actualizacion.bin`);

// Direcciones de la ESP32-S3 (arranque en 0x0) y la tabla de particiones de 16 MB de WLED.
export const imagen = [['0x0', 'bootloader.bin'], ['0x8000', 'partitions.bin'], ['0xe000', 'boot_app0.bin'], ['0x10000', 'firmware.bin']];

function bootApp0() {
  const paquetes = join(platformio, 'packages');
  for (const paquete of readdirSync(paquetes).filter(nombrePaquete => nombrePaquete.startsWith('framework-arduinoespressif32'))) {
    const ruta = join(paquetes, paquete, 'tools', 'partitions', 'boot_app0.bin');
    if (existsSync(ruta)) return ruta;
  }
  throw new Error('No se encontró boot_app0.bin en los paquetes de PlatformIO.');
}

export function armar() {
  const archivos = { 'bootloader.bin': join(compilacion, 'bootloader.bin'), 'partitions.bin': join(compilacion, 'partitions.bin'), 'boot_app0.bin': bootApp0(), 'firmware.bin': join(compilacion, 'firmware.bin') };
  for (const [archivo, ruta] of Object.entries(archivos)) if (!existsSync(ruta)) throw new Error(`Falta ${archivo} (${ruta}). Ejecuta primero npm run firmware.`);
  mkdirSync(salida, { recursive: true });
  const python = join(platformio, 'penv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  const esptool = join(platformio, 'packages', 'tool-esptoolpy', 'esptool.py');
  execFileSync(python, [esptool, '--chip', 'esp32s3', 'merge-bin', '-o', binarioCompleto, '--flash-mode', 'keep', '--flash-freq', 'keep', '--flash-size', '16MB',
    ...imagen.flatMap(([direccion, archivo]) => [direccion, archivos[archivo]])], { stdio: 'inherit' });
  copyFileSync(archivos['firmware.bin'], binarioActualizacion);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  if (!process.argv.includes('--armar')) {
    const pio = join(platformio, 'penv', process.platform === 'win32' ? 'Scripts/pio.exe' : 'bin/pio');
    execFileSync(pio, ['run', '-e', datos.wledEntorno], { cwd: wled, stdio: 'inherit' });
  }
  armar();
  console.log(`Listo:\n  ${binarioCompleto}\n  ${binarioActualizacion}`);
}
