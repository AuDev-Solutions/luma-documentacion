# Documentación de entrega LUMA · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Producir `Manual-LUMA.pdf` (libro en español, 5 partes + anexos) y `Hoja-de-verificacion.pdf`, regenerables con un comando, que permitan a un técnico montar, grabar, configurar, usar, mantener y modificar un poste LUMA sin ayuda.

**Architecture:** Proyecto LaTeX en `LED/documentacion/` compilado con Tectonic (XeTeX). Los datos del poste viven una sola vez en `datos/poste.json`; un script los convierte en macros (`\dato{clave}`) y en la plantilla `cfg.json`. Las imágenes técnicas se generan: KiCad (`kicad-cli`) para esquema/PCB/BOM, Playwright contra el poste simulado de las pruebas e2e para las capturas de LUMA, TikZ para diagramas. Las pruebas (`node --test`) comprueban los datos contra el código real, la ausencia de datos privados, los pendientes permitidos y que el PDF compile sin referencias rotas.

**Tech Stack:** Tectonic (XeTeX), paquetes `babel` (spanish), `tcolorbox`, `tikz`, `listings`, `hyperref`, `graphicx`, `booktabs`, `longtable`; Node 18+ (`node:test`); KiCad 10 `kicad-cli`; Playwright-core (ya en `luma-app`); PlatformIO + esptool (ya instalados en `%USERPROFILE%\.platformio`).

**Spec:** `LED/documentacion/specs/2026-11-15-documentacion-design.md`

## Global Constraints

- Todo el texto del documento en **español**.
- Producción: **100 LEDs por cara, 2 caras, 200 en total**; 200 por cara solo como variante.
- PCB final: **PCB_V2** (`C:\Users\usuario\Documents\KiCad\Projects\PCB_V2\PCB_V2.kicad_pro`).
- Pines: esquema dice `GPIO_A=GPIO4`, `GPIO_B=GPIO5`, `GPIO_C=GPIO7`; el poste que funciona usa **GPIO 17 (cara A, RMT)** y **GPIO 3 (cara B, I2S `drv:1`)**. Pines confirmados = **PENDIENTE**. Nunca presentar uno de los dos como confirmado.
- Firmware: WLED **17.0.0-devV5**, sin modificar, commit `961961fd`, entorno `esp32s3dev_16MB_opi`.
- Red propia **«LUMA-Poste1»**, **http://4.3.2.1**, solo 2,4 GHz.
- Código entregado por **GitHub** (URL = PENDIENTE). Producto: **LUMA**. Empresa, cliente, logo = PENDIENTE.
- Lista de materiales desde KiCad + enlaces de Electronilab; proveedor desconocido = «por confirmar».
- Fusibles: recomendación del LEEME (ATO 4 A por cara, 7,5 A a la salida de la fuente) como **«recomendación por confirmar»**. F5 está puenteado y **no protege**.
- Fuente FUE0007: **solo interiores, 0–40 °C**.
- Prohibido en cualquier archivo de `documentacion/`: contraseñas, SSID e IP de redes privadas, correos (la lista exacta vive solo en `tests/privacidad.test.mjs`).
- WLED es EUPL-1.2: anexo de licencias.
- Un dato no confirmado va con `\pendiente{clave}{texto}`, nunca como dato.
- Commits en el repo nuevo `documentacion/` al final de cada tarea; cambios en `luma-app` se commitean en su propio repo.

## Review Focus

1. **El documento contradice el código actual** (el README está parcialmente desactualizado; p. ej. «las dos caras siempre son idénticas» del último commit). Cada tarea de capítulo verifica sus afirmaciones contra el código, no contra el README.
2. **Grabar con USB y LM2596 a la vez puede dañar la placa**: la advertencia debe aparecer antes del primer comando de grabación. Prueba en Tarea 7.
3. **Datos privados filtrados** (SSID de casa, IP, contraseñas): prueba en Tarea 1 que recorre todos los archivos.
4. **El PDF compila pero faltan imágenes** o queda un pendiente no acordado: pruebas de imágenes y de pendientes permitidos (Tareas 1 y 4).
5. **Segunda cara apagada en un poste nuevo** (ambas salidas en RMT): la plantilla fuerza `drv:1` (Tarea 2) y la tabla de problemas la cubre (Tarea 10).

---

## Estructura de archivos

```
documentacion/
  package.json            scripts: datos, kicad, pdf, todo, test
  .gitignore              build/, herramientas/, entregables/
  herramientas/tectonic.exe
  estilo/luma.sty         recuadros, \dato, \pendiente, \foto, \captura, estilo de código
  manual.tex              libro: portada + \input de partes
  hoja-verificacion.tex   una página
  capitulos/              00-inicio.tex … 19-limitaciones.tex
  anexos/                 a-pines.tex b-cfg.tex c-efectos.tex d-hoja.tex e-referencias.tex f-licencias.tex
  diagramas/              bloques.tex cableado.tex flujo-datos.tex
  datos/poste.json        única fuente de los datos del poste
  img/app/ img/pcb/ img/wled/ img/fotos/
  archivos/cfg-plantilla.json
  scripts/lib/tectonic.mjs scripts/generar-datos.mjs scripts/exportar-kicad.mjs scripts/lista-fotos.mjs scripts/compilar.mjs scripts/firmware.mjs
  tests/*.test.mjs
  build/                  datos.tex bom.tex manual.log lista-fotos.md (ignorado)
  entregables/            PDFs finales, firmware, cfg, Gerbers (ignorado)
luma-app/
  tests/e2e/mock-pole.mjs        (nuevo: createPole + browserPath extraídos)
  scripts/capturas-manual.mjs    (nuevo)
```

---

### Task 1: Base del proyecto, estilo y compilación

**Files:**
- Create: `documentacion/package.json`, `.gitignore`, `estilo/luma.sty`, `manual.tex`, `capitulos/00-inicio.tex` (solo portada y control de versiones por ahora), `scripts/lib/tectonic.mjs`, `scripts/compilar.mjs`, `scripts/lista-fotos.mjs`
- Test: `tests/compilar.test.mjs`, `tests/privacidad.test.mjs`, `tests/lista-fotos.test.mjs`

**Interfaces:**
- Produces:
  - `encontrarTectonic(): string`: `process.env.TECTONIC`, luego `herramientas/tectonic.exe`, luego `tectonic` del PATH; lanza `Error('Tectonic no encontrado…')`.
  - `compilar(archivoTex: string, { salida = 'build' }): Promise<{ pdf: string, log: string }>`: ejecuta `tectonic -X compile <tex> --outdir build --keep-logs`; rechaza si sale con código ≠ 0.
  - `extraerFotos(texto: string): Array<{ id: string, descripcion: string }>`: busca `\foto{id}{descripcion}{ancho}`.
  - Macros LaTeX en `luma.sty`: `\advertencia{texto}`, `\nota{texto}`, `\pendiente{clave}{texto}` (recuadro naranja con «PENDIENTE»), `\dato{clave}` (lee `\csname dato@clave\endcsname`; si no existe, error de compilación; si su valor es `\PENDIENTE`, texto rojo «PENDIENTE»), `\setdato{clave}{valor}`, `\foto{id}{descripcion}{ancho}` (si existe `img/fotos/<id>.jpg` la incluye; si no, marco gris «FOTO PENDIENTE: descripcion»), `\captura{archivo}{pie}` (figura con `img/app/<archivo>.png`), entorno `comando` (listings, fondo gris, sin numeración).
  - npm scripts: `"pdf": "node scripts/compilar.mjs"`, `"test": "node --test tests/"`.

- [ ] **Step 1: Instalar Tectonic** en `documentacion/herramientas/` con el instalador oficial de Windows (`iex ((New-Object System.Net.WebClient).DownloadString('https://drop-ps1.fullyjustified.net'))` ejecutado dentro de esa carpeta). Verificar: `herramientas\tectonic.exe --version` imprime una versión.
- [ ] **Step 2: Escribir las pruebas que fallan.**
  - `compilar.test.mjs`: `test('el manual compila y no deja referencias rotas')`: llama `compilar('manual.tex')`; `assert.ok(existsSync('build/manual.pdf'))`; `assert.doesNotMatch(log, /undefined references|Reference `[^']+' .* undefined|File `[^']+' not found/)`.
  - `privacidad.test.mjs`: `test('ningún archivo contiene datos privados')`: recorre `documentacion/` excepto `build/ herramientas/ entregables/ node_modules/ .git/` y `img/`; `assert.doesNotMatch` contra la lista de patrones privados (SSID e IP de redes privadas, correos, claves de contraseña de WLED) por archivo, con el nombre del archivo en el mensaje.
  - `lista-fotos.test.mjs`: `extraerFotos('\\foto{placa-superior}{Placa por arriba}{0.8}')` → `[{ id: 'placa-superior', descripcion: 'Placa por arriba' }]`; dos fotos en un texto → 2 elementos; texto sin fotos → `[]`.
- [ ] **Step 3: Ejecutar `npm test`**. Esperado: FAIL (módulos no existen).
- [ ] **Step 4: Implementar** `tectonic.mjs`, `compilar.mjs` (compila `manual.tex` y `hoja-verificacion.tex` si existe; al terminar llama a `lista-fotos.mjs`), `lista-fotos.mjs` (lee todos los `.tex`, escribe `build/lista-fotos.md` con tabla id | descripción | archivo esperado `img/fotos/<id>.jpg`, marcando las que ya existen), `luma.sty` y `manual.tex` (clase `book`, A4, `babel` español, `hyperref`, portada con producto «LUMA», título «Manual técnico de instalación, uso y mantenimiento», y `\pendiente{empresa}{Nombre de la empresa}`, `\pendiente{cliente}{Nombre del cliente}`, `\pendiente{logo}{Logo}`), y `00-inicio.tex` con la tabla de control de versiones (v0.1, 15-11-2026, «Borrador»).
- [ ] **Step 5: Ejecutar `npm test`**. Esperado: PASS. Abrir `build/manual.pdf` y comprobar que se ven la portada y los tres recuadros PENDIENTE.
- [ ] **Step 6: Commit.** `git init` en `documentacion/`, `git add -A`, `git commit -m "Base del manual LUMA: estilo, compilación y pruebas"`.

### Task 2: Datos del poste y plantilla cfg.json

**Files:**
- Create: `datos/poste.json`, `scripts/generar-datos.mjs`, `archivos/cfg-plantilla.json` (generado, se commitea)
- Modify: `manual.tex` (`\input{build/datos.tex}` antes de `\begin{document}`), `package.json` (`"datos"`)
- Test: `tests/datos.test.mjs`, `tests/cfg-plantilla.test.mjs`, `tests/pendientes.test.mjs`

**Interfaces:**
- Consumes: `luma.sty` (`\setdato`, `\PENDIENTE`).
- Produces:
  - `cargarDatos(ruta = 'datos/poste.json'): object`
  - `aMacrosTex(datos: object): string`: una línea `\setdato{clave}{valor}` por hoja del JSON; claves anidadas con punto (`pinesPosteActual.caraA`); `null` → `\setdato{clave}{\PENDIENTE}`; escapa `_ % & # $`.
  - `generarCfgPlantilla(datos: object, cfgBase: object): object`
  - Claves de `poste.json` (valores exactos): `producto: "LUMA"`, `empresa: null`, `cliente: null`, `logo: null`, `repositorioApp: null`, `ledsPorCara: 100`, `caras: 2`, `ledsTotal: 200`, `tipoLed: "WS2811 12 V"`, `wledTipoLed: 22`, `ordenColorWled: 1`, `pinesPosteActual: { caraA: 17, caraB: 3 }`, `driverCaraA: "RMT (drv: 0)"`, `driverCaraB: "I2S (drv: 1)"`, `pinesEsquema: { GPIO_A: 4, GPIO_B: 5, GPIO_C: 7 }`, `pinesConfirmados: null`, `wledVersion: "17.0.0-devV5"`, `wledCommit: "961961fd"`, `wledEntorno: "esp32s3dev_16MB_opi"`, `redPropiaSsid: "LUMA-Poste1"`, `redPropiaIp: "4.3.2.1"`, `fuente: "Electronilab FUE0007, 12 V 15 A, solo interiores (0–40 °C)"`, `corrienteMedida: "2 A máximo por cara de 200 píxeles"`, `fusibleCara: "ATO 4 A (recomendación por confirmar)"`, `fusibleFuente: "ATO 7,5 A (recomendación por confirmar)"`, `pcbVersion: "PCB_V2"`, `placaEsp: "ESP32-S3 N16R8 (WIF0036, Electronilab)"`, `reguladorSalida: "5,0 V"`.

- [ ] **Step 1: Pruebas que fallan.**
  - `datos.test.mjs`:
    - `wledVersion` === `version` de `../WLED/package.json`.
    - `git -C ../WLED rev-parse HEAD` empieza por `wledCommit`.
    - `../WLED/platformio.ini` contiene `[env:${wledEntorno}]`.
    - `ledsTotal === ledsPorCara * caras` y `ledsPorCara === 100`.
    - `../luma-app/package.json` tiene los scripts `dev`, `test`, `test:e2e`, `build:poste`, `instalar:poste`.
    - `aMacrosTex({ a: null, b: { c: 'x_y' } })` contiene `\setdato{a}{\PENDIENTE}` y `\setdato{b.c}{x\_y}`.
  - `cfg-plantilla.test.mjs` sobre `generarCfgPlantilla(datos, cfgBase)` con `cfgBase` = `../luma-app/.local/cfg-before-2026-09-30.json`:
    - `hw.led.total === 200`; `hw.led.ins.length === 2`.
    - `ins[0]`: `start 0, len 100, pin [17], type 22, drv 0`; `ins[1]`: `start 100, len 100, pin [3], type 22, drv 1`.
    - `ap.ssid === 'LUMA-Poste1'`, `ap.behav === 2`, `ap.ip` = `[4,3,2,1]`.
    - `nw.ins` sin SSID (`[]` o `ssid: ''`); `JSON.stringify` no contiene el SSID privado de la red de casa del `cfgBase`.
    - `hw.led.maxpwr === 0` (el límite se fija en LUMA › Mi montaje › Consumo con los amperios reales de la fuente).
  - `pendientes.test.mjs`: recorre los `.tex` y extrae las claves de `\pendiente{clave}`; todas deben estar en `['empresa','cliente','logo','repositorioApp','pinesConfirmados','fusibles','listaCompra','capturasWled']`.
- [ ] **Step 2: Ejecutar `npm test`**. Esperado: FAIL.
- [ ] **Step 3: Implementar** `poste.json` con los valores de Interfaces y `generar-datos.mjs` (CLI: escribe `build/datos.tex` y `archivos/cfg-plantilla.json` con 2 espacios de sangría). En `generarCfgPlantilla` también: `id.mdns = 'luma-poste'`, `id.name = 'LUMA'`, `if.mqtt.cid = ''`.
- [ ] **Step 4: `npm run datos && npm test`**. Esperado: PASS.
- [ ] **Step 5: Commit** «Datos del poste y plantilla cfg.json».

### Task 3: Exportes de KiCad (esquema, PCB, 3D, lista de materiales)

**Files:**
- Create: `scripts/exportar-kicad.mjs`; salidas `img/pcb/esquema.pdf`, `img/pcb/cobre-superior.pdf`, `img/pcb/cobre-inferior.pdf`, `img/pcb/3d-superior.png`, `img/pcb/3d-inferior.png`, `build/bom.csv`, `build/bom.tex`
- Modify: `package.json` (`"kicad"`)
- Test: `tests/kicad.test.mjs`

**Interfaces:**
- Produces: `bomCsvATex(csv: string): string`: filas de `longtable` con columnas Referencias | Valor | Huella | Cant. | Proveedor; proveedor = enlace de Electronilab conocido (FUE0007, píxeles WS2811, WIF0036) o «por confirmar»; filas con DNP o referencia `F5` llevan la nota «NO PROTEGE (puenteado)».
- Ruta KiCad: `KICAD_CLI` env o `C:\Program Files\KiCad\10.0\bin\kicad-cli.exe`. Proyecto: `C:\Users\usuario\Documents\KiCad\Projects\PCB_V2\`.

- [ ] **Step 1: Pruebas que fallan.** `bomCsvATex` con un CSV de 3 filas (`"U1","ESP32-S3 N16R8",...`, `"F5","Fuse",...`, `"R1","R",...`) → contiene `U1`, contiene `NO PROTEGE` en la fila de F5, `R1` lleva `por confirmar`. Prueba de integración (se omite si no existe `kicad-cli`): tras `npm run kicad`, existen los 5 archivos de imagen con tamaño > 0, y `build/bom.csv` contiene `U1`, `F1`, `F6`, `F7`.
- [ ] **Step 2: Ejecutar y ver FAIL.**
- [ ] **Step 3: Implementar** con: `sch export pdf`, `pcb export pdf --layers F.Cu,F.Silkscreen,Edge.Cuts` (y `B.Cu,Edge.Cuts` para la inferior), `pcb render --side top|bottom --quality high --width 1600 --height 1000`, `sch export bom --fields "Reference,Value,Footprint,QUANTITY,DNP" --group-by Value`.
- [ ] **Step 4: `npm run kicad && npm test`**. PASS. Abrir las imágenes y comprobar que se ven la placa y el esquema completos.
- [ ] **Step 5: Commit** «Exportes de KiCad para el manual» (se commitean las imágenes de `img/pcb/`).

### Task 4: Capturas automáticas de LUMA

**Files:**
- Create: `luma-app/tests/e2e/mock-pole.mjs`, `luma-app/scripts/capturas-manual.mjs`
- Modify: `luma-app/tests/e2e/app.e2e.mjs` (importar `createPole` y `browserPath` del módulo nuevo; sin cambiar ninguna prueba), `luma-app/package.json` (`"capturas:manual": "vite build && node scripts/capturas-manual.mjs"`)
- Test: `documentacion/tests/imagenes.test.mjs`

**Interfaces:**
- Produces: `createPole({ twoFaces }): pole` y `browserPath(): string|undefined`, con la misma firma de hoy. `capturas-manual.mjs [carpetaSalida]` (por defecto `../documentacion/img/app/`) escribe PNG con estos nombres exactos (móvil 390×844 @2x salvo `escritorio-*` 1440×1000), con `twoFaces: true`: `inicio-desconectado`, `conectar-dialogo`, `conectado`, `colores`, `efectos-galeria`, `efecto-detalle`, `segmentos`, `escenas-guardar`, `escenas-lista`, `modo-automatico`, `horario`, `temas`, `brillo`, `mi-montaje`, `consumo`, `seguridad`, `wifi-propio`, `vista-poste-ampliada`, `escritorio-general`, `escritorio-segmentos`.
- `\captura{<nombre>}{pie}` en los capítulos usa estos nombres.

- [ ] **Step 1: Prueba que falla.** `imagenes.test.mjs`: para cada `\captura{x}` en los `.tex` existe `img/app/x.png`; para cada `\includegraphics{ruta}` existe la ruta.
- [ ] **Step 2: Extraer `mock-pole.mjs`** y ejecutar `npm run test:e2e` en `luma-app`. Esperado: las 7 pruebas PASS, igual que antes.
- [ ] **Step 3: Implementar `capturas-manual.mjs`** reutilizando `preview` de Vite, `createPole` y los mismos selectores que `app.e2e.mjs`; tras cada acción esperar a que no haya animación de modal y ocultar la notificación de conexión.
- [ ] **Step 4: `npm run capturas:manual`** en `luma-app`. Esperado: 20 PNG en `documentacion/img/app/`. Revisarlos a ojo: sin textos cortados ni notificaciones encima.
- [ ] **Step 5: Commits.** En `luma-app`: «Poste simulado compartido y capturas para el manual». En `documentacion`: «Capturas de LUMA».

### Task 5: Diagramas TikZ

**Files:**
- Create: `diagramas/bloques.tex`, `diagramas/cableado.tex`, `diagramas/flujo-datos.tex`

**Contenido fijado:**
- `bloques`: Red 120 V → Fuente 12 V → PCB_V2 (fusibles F6/F7, LM2596 → 5 V → ESP32-S3) → bornera A1 → Cara A (`\dato{ledsPorCara}` LED) y bornera B1 → Cara B; INY1/INY2 inyección; Teléfono ⇄ Wi-Fi «`\dato{redPropiaSsid}`» ⇄ WLED ⇄ LUMA (página en el propio poste).
- `cableado`: fuente → (fusible de fuente) → borneras de la PCB → A1/B1 (GND, datos, +12 V) → caras; señales de datos marcadas con `\dato{pinesPosteActual.caraA}` / `caraB` y una nota PENDIENTE junto a ellas.
- `flujo-datos`: componente React → `controller.js` → `wled.js` → `POST /json/state` → WLED → LEDs; vuelta: `GET /json` para confirmar; `/ws` con `lv:true` → `pole-renderer.js` (vista en vivo).

- [ ] **Step 1:** Incluir los tres en un capítulo de prueba temporal y ejecutar `npm run pdf && npm test`. PASS.
- [ ] **Step 2:** Revisar el PDF: sin texto encimado, legible en A4.
- [ ] **Step 3: Commit** «Diagramas del sistema».

### Tasks 6–10: Capítulos

Reglas comunes a cada tarea de capítulos:
- Cada afirmación técnica se comprueba contra la fuente indicada antes de escribirla (código, `cfg`, KiCad, LEEME). El README **no** es fuente válida sin comprobar contra el código.
- Datos del poste solo con `\dato{…}`; nada copiado a mano.
- Cada procedimiento: numerado, con resultado esperado al final de cada paso y una imagen cuando ayude.
- Fotos reales con `\foto{id}{descripción precisa de la toma}{ancho}`.
- Verificación al terminar: `npm run datos && npm run pdf && npm test` PASS, y lectura del capítulo en el PDF.
- Commit por tarea: «Manual: parte N».

### Task 6: Parte 0 y Parte I (Hardware)

**Files:** `capitulos/00-inicio.tex` (completar), `01-materiales.tex`, `02-pcb.tex`, `03-esquema.tex`, `04-ensamble.tex`, `05-cableado.tex`, `06-consumo.tex`

- Parte 0: cómo usar el manual, convenciones (los 3 recuadros con un ejemplo de cada uno), glosario (GPIO, RMT, I2S, WS2811, píxel, segmento, preset, escena, AP, OTA, `cfg.json`), diagrama `bloques`.
- 01: `\input{build/bom.tex}` + `\pendiente{listaCompra}{…}`.
- 02: `3d-superior`, `3d-inferior`, cobre; tabla de borneras (S_LM_INY1, S_A_B1, INY1, INY2, A1, B1, B2) con señal; fusibles con F5 «NO PROTEGE».
- 03: esquema por bloques; tabla de pines con esquema vs. poste actual + `\pendiente{pinesConfirmados}{…}`.
- 04: ensamble; ajustar LM2596 a `\dato{reguladorSalida}` **antes** de insertar la ESP; comprobación con multímetro; antes de fabricar, medir la WIF0036 contra la huella.
- 05: diagrama `cableado`; caja, condiciones de la fuente (`\advertencia` de solo interiores); `\pendiente{fusibles}{…}`.
- 06: corriente medida, cálculo para 100 por cara, regla del 85 % de LUMA (comprobar en `src/` dónde se aplica el 85 %).

### Task 7: Parte II (Firmware)

**Files:** `capitulos/07-preparar-pc.tex`, `08-grabar-firmware.tex`, `09-configurar-wled.tex`; `scripts/firmware.mjs`; `tests/firmware.test.mjs`

**Interfaces:**
- `firmware.mjs`: ejecuta `%USERPROFILE%\.platformio\penv\Scripts\pio.exe run -e esp32s3dev_16MB_opi` en `../WLED`, luego `esptool merge_bin` (chip `esp32s3`; bootloader `0x0`, partitions `0x8000`, `boot_app0` `0xe000`, firmware `0x10000`; comprobar los offsets contra el `.pio/build/.../` y el `platformio.ini` de WLED antes de fijarlos) → `entregables/firmware/WLED_17.0.0-devV5_ESP32-S3_N16R8_completo.bin` y copia `firmware.bin` como `…_actualizacion.bin`.

- [ ] **Prueba:** `firmware.test.mjs`: (a) en `08-grabar-firmware.tex`, la primera `\advertencia` que menciona «USB» y «LM2596» aparece antes del primer entorno `comando` que contiene `esptool` o `write_flash`; (b) si existe el binario completo, su tamaño es > 1 MB.
- 07: Git, GitHub (`git clone` de `\dato{repositorioApp}` con `\pendiente{repositorioApp}{…}`), Node.js LTS, VS Code, PlatformIO, driver USB; cómo reconocer el puerto COM.
- 08: camino principal = grabar el binario completo (esptool por línea de comandos y la alternativa web oficial de Espressif); modo de arranque (BOOT+RESET); camino alterno = compilar con `firmware.mjs` / PlatformIO; qué hacer si no aparece el puerto. Advertencia USB + LM2596.
- 09: primera conexión a la red de WLED, cambiar contraseña de la red propia (sin escribirla), subir `cfg-plantilla.json` como `/cfg.json` y `/bkp.cfg.json` por `/upload`, **cortar la corriente** para que la lea; tabla de salidas (pin, tipo 22, orden, cantidad, RMT/I2S) con PENDIENTE; capturas de los ajustes de WLED (`img/wled/`) o `\pendiente{capturasWled}{…}` si no hay poste a mano. Recuadro `\nota` con la variante de 200 por cara (qué cambia: `len`, `start` de la cara B, `total`, consumo).
- Manual (lo hace el equipo si tiene una ESP32-S3 libre): grabar el binario completo en una placa nueva, comprobar que aparece «WLED-AP». Anotar el resultado en el capítulo.

### Task 8: Parte III (App LUMA)

**Files:** `capitulos/10-instalar-luma.tex`, `11-uso.tex`, `12-aceptacion.tex`

- 10: `npm install`, `npm run build:poste`, `npm run instalar:poste -- 4.3.2.1` (PIN opcional), abrir `http://4.3.2.1`, añadir a la pantalla de inicio. Verificar en `scripts/install-on-pole.mjs` que sube también `index.htm.gz`.
- 11: una sección por pantalla usando las 20 capturas; comportamiento comprobado en `src/App.jsx` y componentes (p. ej. que editar una cara la copia a la otra, último commit `c08abea`; límite de 16 segmentos; 12 escenas en el navegador; escenas en el poste; horario y hora tomada del teléfono).
- 12: prueba de aceptación en pasos (mismos ítems que la hoja de la Tarea 11).

### Task 9: Parte IV (El código)

**Files:** `capitulos/13-arquitectura.tex`, `14-cambios-comunes.tex`, `15-desarrollo.tex`, `16-contrato-wled.tex`

- 13: árbol de `luma-app/src/` con la responsabilidad de cada archivo (leer cada uno); diagrama `flujo-datos`.
- 14: recetas con fragmentos reales: añadir un efecto en `src/lib/scenes.js` (campos del objeto: `id, name, description, wled, category, colors, speed, brightness`…), un tema en `themes.js`, una paleta en `palettes.js`, textos visibles; tras cada receta: `npm test`, `npm run build:poste`, `instalar:poste`.
- 15: `npm run dev` (puerto 5174), `npm test`, `npm run test:e2e`, flujo git mínimo (rama, commit, push, pull request).
- 16: endpoints usados y lo que se verifica tras cada envío (leer `src/lib/wled.js`): `/json`, `/json/info`, `/json/state`, `/json/cfg`, `/json/fxdata`, `/presets.json`, `/upload`, `/ws` (`lv:true`), enlaces a kno.wled.ge.

### Task 10: Parte V (Operación) y anexos

**Files:** `capitulos/17-problemas.tex`, `18-actualizar-respaldar.tex`, `19-limitaciones.tex`, `anexos/a-pines.tex`, `b-cfg.tex`, `c-efectos.tex`, `e-referencias.tex`, `f-licencias.tex`; `tests/problemas.test.mjs`

- [ ] **Prueba:** `17-problemas.tex` contiene filas para: segunda cara apagada (`I2S`), cambios que no se aplican (cortar la corriente), red de 5 GHz, hora perdida tras corte, poste que no responde, no aparece la red propia, PIN olvidado, LUMA no conecta desde una página HTTPS.
- 17: tabla síntoma → causa → solución.
- 18: actualizar firmware por OTA (`…_actualizacion.bin`), actualizar LUMA, respaldar/restaurar `cfg.json` y `presets.json`.
- 19: sin reloj con pila (RTC DS3231 o fotocelda), `maxpwr: 0` hasta configurarlo, HTTPS, F5, fusibles, fuente de interiores, DRC con 22 violaciones heredadas.
- Anexos: A pines (esquema vs. actual + PENDIENTE), B `cfg-plantilla.json` comentado por bloques, C efectos (de `luma-app/design/EFFECTS-RESEARCH.md` contrastado con `scenes.js`), E referencias, F licencias (WLED EUPL-1.2, dependencias de LUMA: React, Vite, lucide, fuentes; comprobar las licencias en `node_modules/*/package.json`).

### Task 11: Hoja de verificación, lista de fotos y entregables

**Files:** `hoja-verificacion.tex`, `anexos/d-hoja.tex` (incluye la misma hoja), `scripts/compilar.mjs` (modificar: copiar a `entregables/`), `package.json` (`"todo"`), `README.md` de `documentacion/`; `tests/hoja.test.mjs`

- [ ] **Prueba:** `hoja.test.mjs`: `build/hoja-verificacion.pdf` tiene exactamente 1 página (contar `/Type /Page` sin `/Pages`).
- Hoja: datos del poste (ID, fecha, técnico), casillas: tensión LM2596 medida, firmware grabado, red propia visible, contraseña cambiada (casilla, sin valor), `cfg.json` subido + corte de corriente, cara A enciende, cara B enciende, LUMA abre en 4.3.2.1, escena guardada en el poste, límite de corriente configurado, firma.
- `"todo"`: `datos` → `kicad` → `capturas:manual` (en `../luma-app`) → `pdf` → `test`; al final copia a `entregables/`: `Manual-LUMA.pdf`, `Hoja-de-verificacion.pdf`, `cfg-plantilla.json`, `firmware/`, `gerber.zip` y `PCB_V2_schematic.pdf` de KiCad, `dist-poste/` de LUMA, y `build/lista-fotos.md` como `Lista-de-fotos.md`.
- `README.md`: cómo regenerar (requisitos y `npm run todo`), dónde se cambia cada dato (`datos/poste.json`), cómo añadir fotos (`img/fotos/<id>.jpg`).
- [ ] **Verificación final:** `npm run todo` termina sin errores; `npm test` PASS; leer el PDF completo una vez; listar los PENDIENTE que quedan (deben ser solo los permitidos) y las fotos faltantes, y entregarlos al equipo.
- [ ] **Commit** «Entregables y hoja de verificación».
