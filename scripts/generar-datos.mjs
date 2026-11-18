// npm run datos: datos/poste.json → build/datos.tex (macros \setdato) y archivos/cfg-plantilla.json.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));

export function cargarDatos(ruta = join(raiz, 'datos', 'poste.json')) {
  return JSON.parse(readFileSync(ruta, 'utf8'));
}

const escaparTex = valor => String(valor).replace(/[\\_%&#$]/g, c => (c === '\\' ? '\\textbackslash{}' : `\\${c}`));

export function aMacrosTex(datos, prefijo = '') {
  return Object.entries(datos).flatMap(([clave, valor]) => {
    const nombre = prefijo ? `${prefijo}.${clave}` : clave;
    if (valor !== null && typeof valor === 'object' && !Array.isArray(valor)) return aMacrosTex(valor, nombre).split('\n');
    return [`\\setdato{${nombre}}{${valor === null ? '\\PENDIENTE' : escaparTex(valor)}}`];
  }).join('\n');
}

// Parte de la configuración real del poste y deja solo lo que sirve a cualquier poste nuevo.
export function generarCfgPlantilla(datos, cfgBase) {
  const cfg = structuredClone(cfgBase);
  const salidaBase = cfg.hw.led.ins[0];
  const salida = (start, pin, drv) => ({ ...salidaBase, start, len: datos.ledsPorCara, pin: [pin], type: datos.wledTipoLed, order: datos.ordenColorWled, drv, maxpwr: 0, ledma: datos.ledmaRecomendado });
  // Las dos salidas empiezan en el LED 0: WLED manda cada píxel a las dos y la cara B repite la cara A,
  // LED por LED, en todos los efectos. WLED ve ledsWled LED (ledsTotal físicos).
  cfg.hw.led.total = datos.ledsWled;
  cfg.hw.led.maxpwr = 0;
  cfg.hw.led.ins = [salida(0, datos.pinesPosteActual.caraA, 0), salida(0, datos.pinesPosteActual.caraB, 1)];
  cfg.ap = { ...cfg.ap, ssid: datos.redPropiaSsid, behav: 2, ip: datos.redPropiaIp.split('.').map(Number) };
  cfg.nw.ins = cfg.nw.ins.map(red => ({ ...red, ssid: '', pskl: 0, bssid: '' }));
  cfg.id = { ...cfg.id, mdns: 'luma-poste', name: datos.producto };
  cfg.if.mqtt = { ...cfg.if.mqtt, cid: '' };
  // Una ESP32 recién grabada no tiene presets: la escena de encendido la elige LUMA después.
  cfg.def = { ...cfg.def, ps: 0 };
  return cfg;
}

export function escribirDatos() {
  const datos = cargarDatos();
  mkdirSync(join(raiz, 'build'), { recursive: true });
  writeFileSync(join(raiz, 'build', 'datos.tex'), `% Generado por scripts/generar-datos.mjs desde datos/poste.json. No editar.\n${aMacrosTex(datos)}\n`);
  console.log('Listo: build/datos.tex');
  // La configuración real del poste vive fuera de este repositorio (luma-app/.local); sin ella se conserva la plantilla publicada.
  const cfgReal = join(raiz, '..', 'luma-app', '.local', 'cfg-2026-11-18.json');
  if (existsSync(cfgReal)) {
    mkdirSync(join(raiz, 'archivos'), { recursive: true });
    writeFileSync(join(raiz, 'archivos', 'cfg-plantilla.json'), JSON.stringify(generarCfgPlantilla(datos, JSON.parse(readFileSync(cfgReal, 'utf8'))), null, 2) + '\n');
    console.log('Listo: archivos/cfg-plantilla.json');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) escribirDatos();
