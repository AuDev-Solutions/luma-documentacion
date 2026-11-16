# Documentación LUMA

Fuentes del manual técnico del poste LUMA (PCB_V2 · ESP32-S3 · WLED · app LUMA) y de la hoja de verificación. Todo se genera desde esta carpeta; los PDF no se editan a mano.

## Requisitos

- Node.js 20 o superior.
- [Tectonic](https://tectonic-typesetting.github.io) (compila el LaTeX): `herramientas/tectonic.exe`, su ruta en la variable `TECTONIC`, o en el PATH.
- KiCad 10 (`kicad-cli`) para exportar la placa. Otra ruta: variable `KICAD_CLI`. Otro proyecto: variable `PCB_V2`.
- Las carpetas hermanas `../luma-app` (con `npm install` hecho) y `../WLED` (en el commit documentado).
- PlatformIO, solo para recompilar el firmware.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run todo` | Todo en orden: datos → KiCad → capturas de la app → PDF → pruebas → entregables. |
| `npm run datos` | Genera `build/datos.tex` y `archivos/cfg-plantilla.json` desde `datos/poste.json`. |
| `npm run kicad` | Exporta de PCB_V2 el esquema, las capas, las vistas 3D, la lista de materiales y el netlist. |
| `npm run capturas` | Empaqueta LUMA y toma de nuevo las capturas de `img/app/` con un poste simulado. |
| `npm run pdf` | Compila `build/manual.pdf` y `build/hoja-verificacion.pdf` y la lista de fotos. |
| `npm run firmware` | Compila WLED y arma los binarios en `entregables/firmware/` (tarda; `-- --armar` solo arma). |
| `npm run entregables` | Copia a `entregables/` lo que se entrega al cliente. |
| `npm test` | Pruebas: el manual compila sin referencias rotas, datos coherentes con WLED y KiCad, privacidad, pendientes permitidos, imágenes, hoja de una página. |

## Dónde se cambia cada cosa

- **Datos del poste** (LED por cara, pines, versión de WLED, red propia, fusibles…): `datos/poste.json`. En los capítulos se usan con `\dato{clave}`; un valor `null` aparece como PENDIENTE.
- **Textos**: `capitulos/` (un archivo por capítulo) y `anexos/`. El orden está en `manual.tex`.
- **Hoja de verificación**: `capitulos/hoja-contenido.tex` (la usan la hoja suelta y el anexo D).
- **Estilo** (colores, recuadros, portada): `estilo/luma.sty` y `capitulos/portada.tex`.
- **Diagramas**: `diagramas/*.tex` (TikZ).
- **Efectos (anexo C)**: se generan solos desde `../luma-app/src/lib/scenes.js`.

## Fotos

Cada `\foto{id}{…}` muestra un marco «FOTO PENDIENTE» hasta que exista `img/fotos/<id>.jpg`. La lista de fotos que faltan, con su descripción, queda en `build/lista-fotos.md` (y en `entregables/Lista-de-fotos.md`). Toma la foto, guárdala con ese nombre y ejecuta `npm run pdf`.

## Entregables

`entregables/` (no se versiona): `Manual-LUMA.pdf`, `Hoja-de-verificacion.pdf`, `cfg-plantilla.json`, `Lista-de-fotos.md`, `firmware/`, `placa/` (Gerbers y esquema) y `luma-poste/` (la app empaquetada).

## Privacidad

No escribas contraseñas, nombres de redes privadas ni IP de la red de la oficina en ningún archivo: la prueba `privacidad.test.mjs` lo revisa.
