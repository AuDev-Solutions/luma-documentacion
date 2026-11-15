// npm run kicad: exporta de PCB_V2 el esquema, las capas de cobre, vistas 3D y la lista de materiales.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
export const proyectoPcb = process.env.PCB_V2 ?? join(homedir(), 'Documents', 'KiCad', 'Projects', 'PCB_V2');
export const kicadCli = () => process.env.KICAD_CLI ?? 'C:\\Program Files\\KiCad\\10.0\\bin\\kicad-cli.exe';

// Nombre legible de cada componente del esquema.
const componentes = {
  'ESP32-S3 N16R8': 'Placa ESP32-S3 N16R8 (DevKitC, 44 pines)',
  YAAJ_DCDC_StepDown_LM2596: 'Módulo reductor LM2596 (ajustar a 5,0 V)',
  Fuse: 'Portafusible 5×20 mm Keystone 3512P',
  Screw_Terminal_01x03: 'Bornera de 3 polos, paso 5,08 mm',
  Screw_Terminal_01x02: 'Bornera de 2 polos, paso 7,5 mm',
  ALIMENTACION1: 'Bornera de 2 polos, paso 7,5 mm (alimentación LM2596 e inyección)',
  ALIMENTACION2: 'Bornera de 2 polos, paso 7,5 mm (alimentación de las caras)',
  C_Polarized_Small: 'Condensador electrolítico radial 10 mm (valor por confirmar)',
  R: 'Resistencia 1/4 W axial (valor por confirmar)',
};
const proveedores = { 'ESP32-S3 N16R8': 'Electronilab (WIF0036)' };

const escapar = texto => String(texto).replace(/[_%&#$]/g, c => `\\${c}`);

function referencias(campo) {
  return campo.split(',').flatMap(parte => {
    const rango = parte.match(/^([A-Z_]+)(\d+)-\1?(\d+)$/i);
    if (!rango) return [parte.trim()];
    return Array.from({ length: Number(rango[3]) - Number(rango[2]) + 1 }, (_, i) => `${rango[1]}${Number(rango[2]) + i}`);
  });
}

function leerCsv(csv) {
  const [, ...lineas] = csv.trim().split(/\r?\n/);
  return lineas.map(linea => [...linea.matchAll(/"([^"]*)"/g)].map(([, valor]) => valor));
}

export function bomCsvATex(csv) {
  const filas = leerCsv(csv).map(([refs, valor, huella, cantidad, dnp]) => {
    const notas = [proveedores[valor] ?? 'por confirmar'];
    if (referencias(refs).includes('F5')) notas.push('\\textbf{F5 NO PROTEGE} (puenteado por cobre)');
    if (dnp) notas.push('no se monta (DNP)');
    const huellaCorta = huella.split(':').pop().split('_').slice(0, 3).join(' ');
    return `${escapar(refs.replaceAll(',', ', '))} & ${escapar(componentes[valor] ?? valor)} & {\\footnotesize ${escapar(huellaCorta)}} & ${cantidad} & ${notas.join('; ')} \\\\`;
  });
  return [
    '% Generado por scripts/exportar-kicad.mjs desde PCB_V2. No editar.',
    '\\begin{longtable}{@{}>{\\raggedright\\arraybackslash}p{0.13\\linewidth} >{\\raggedright\\arraybackslash}p{0.3\\linewidth} >{\\raggedright\\arraybackslash}p{0.2\\linewidth} c >{\\raggedright\\arraybackslash}p{0.22\\linewidth}@{}}',
    '\\toprule \\textbf{Ref.} & \\textbf{Componente} & \\textbf{Huella} & \\textbf{Cant.} & \\textbf{Proveedor / nota} \\\\ \\midrule \\endhead',
    ...filas,
    '\\bottomrule',
    '\\end{longtable}',
  ].join('\n');
}

// Red de datos (GPIO_A/B/C) → número de GPIO del pin de U1 al que llega, leído del netlist de KiCad.
export function pinesDesdeNetlist(netlist) {
  const pines = {};
  for (const bloque of netlist.split(/\(net\s*\n/).slice(1)) {
    const red = bloque.match(/\(name "\/?(GPIO_[A-Z])"\)/)?.[1];
    const funcion = bloque.match(/\(ref "U1"\)\s*\(pin "\d+"\)\s*\(pinfunction "GPIO(\d+)/)?.[1];
    if (red && funcion) pines[red] = Number(funcion);
  }
  return pines;
}

export function exportar() {
  const cli = kicadCli();
  if (!existsSync(cli)) throw new Error(`No se encontró kicad-cli en ${cli}. Define KICAD_CLI.`);
  const sch = join(proyectoPcb, 'PCB_V2.kicad_sch');
  const pcb = join(proyectoPcb, 'PCB_V2.kicad_pcb');
  const img = join(raiz, 'img', 'pcb');
  const build = join(raiz, 'build');
  mkdirSync(img, { recursive: true });
  mkdirSync(build, { recursive: true });
  const kicad = (...args) => execFileSync(cli, args, { stdio: 'pipe' });
  kicad('sch', 'export', 'pdf', '--black-and-white', '--exclude-drawing-sheet', '-o', join(img, 'esquema.pdf'), sch);
  kicad('pcb', 'export', 'pdf', '--layers', 'F.Cu,F.Silkscreen,Edge.Cuts', '--mode-single', '-o', join(img, 'cobre-superior.pdf'), pcb);
  kicad('pcb', 'export', 'pdf', '--layers', 'B.Cu,Edge.Cuts', '--mirror', '--mode-single', '-o', join(img, 'cobre-inferior.pdf'), pcb);
  for (const lado of [['top', 'superior'], ['bottom', 'inferior']]) {
    kicad('pcb', 'render', '--side', lado[0], '--quality', 'high', '--width', '1600', '--height', '1000', '--background', 'opaque', '-o', join(img, `3d-${lado[1]}.png`), pcb);
  }
  kicad('sch', 'export', 'bom', '--fields', 'Reference,Value,Footprint,QUANTITY,DNP', '--group-by', 'Value', '-o', join(build, 'bom.csv'), sch);
  kicad('sch', 'export', 'netlist', '--format', 'kicadsexpr', '-o', join(build, 'netlist.net'), sch);
  writeFileSync(join(build, 'bom.tex'), bomCsvATex(readFileSync(join(build, 'bom.csv'), 'utf8')) + '\n');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  exportar();
  console.log('Listo: img/pcb/ y build/bom.tex');
}
