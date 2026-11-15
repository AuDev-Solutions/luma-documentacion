# Diseño · Documentación de entrega del poste LUMA

Fecha: 15-11-2026 · Estado: borrador para aprobación

## 1. Intención y por qué

El proyecto del poste LED (PCB propia + firmware WLED + app LUMA) se cobró en 2.400.000: la mitad ya, la otra mitad **al entregar la documentación**. El cliente lleva el diseño a producción: sus técnicos instalarán postes nuevos con otras ESP32-S3 y podrán modificar el código. La documentación tiene que permitirles hacerlo **sin llamarnos**: armar, grabar, configurar, instalar la app, probar, usar, mantener y cambiar el código.

Lector principal: **técnico instalador con conocimientos de electrónica y algo de programación**. No se asume que conozca WLED, React, KiCad ni LaTeX.

## 2. Metas, no metas, anti-metas

**Metas**
- Un poste nuevo puede quedar funcionando siguiendo solo el documento, desde una ESP32-S3 N16R8 virgen y la PCB_V2.
- Cada paso tiene una imagen (captura, foto, esquema o diagrama) cuando ver ayuda más que leer.
- El técnico entiende cómo está hecho el código de LUMA lo suficiente para cambiar efectos, temas, textos y la conexión con WLED, y volver a instalarla.
- Las limitaciones conocidas y los pendientes quedan escritos, para que la entrega no se discuta después.

**No metas**
- Documentar el código interno de WLED (C++). Es firmware de terceros sin modificar; se documenta solo cómo compilarlo/grabarlo y qué configuración usamos, con enlaces a kno.wled.ge.
- Rediseñar la PCB o corregir sus problemas conocidos (F5 puenteado, DRC heredado). Se documentan como están.
- Manual para el usuario final del público. El manual de uso de la app va dirigido al técnico/operador.

**Anti-metas** (sería un fracaso aunque “esté completo”)
- Que el documento diga algo distinto de lo que hace el hardware o el código actual (por ejemplo, copiar el README sin verificar: parte de él está desactualizado).
- Pines, valores o pasos inventados. Lo que no esté confirmado va en un recuadro **PENDIENTE** visible, nunca como dato.
- Que contenga contraseñas reales o datos privados.

## 3. Hechos y restricciones (verificados en el proyecto)

| Parte | Hecho | Fuente |
|---|---|---|
| PCB | **PCB_V2** es la versión final (tiene la ESP integrada y Gerbers del 08-10-2026). ESP32-S3 N16R8 (WIF0036 Electronilab), LM2596 a 5 V, borneras A1/B1 caras, INY1/INY2 inyección, fusibles F1 F2 F5 F6 F7 (F5 puenteado, no protege). | `Documents\KiCad\Projects\PCB_V2\`, LEEMEs |
| Alimentación | Fuente FUE0007 12 V 15 A, **solo interiores 0–40 °C**. Píxeles WS2811 12 V IP68. Medido 2 A máx. por cara de 200 píxeles. Recomendación de fusibles sin confirmar. | LEEME_PCB_V2_POSTES.md |
| Pines | **Conflicto sin resolver**: el esquema dice GPIO_A=GPIO4, GPIO_B=GPIO5 (GPIO_C=GPIO7); el poste que funciona usa GPIO 17 (cara A, RMT) y GPIO 3 (cara B, I2S `drv:1`). El cliente/equipo lo confirmará. | esquema vs. cfg del poste |
| Firmware | WLED 17.0.0-devV5 sin modificar, perfil PlatformIO `esp32s3dev_16MB_opi`. Segunda salida debe ir en I2S. Red propia «LUMA-Poste1» en 4.3.2.1, solo 2,4 GHz. Cambios de LED a veces requieren cortar la corriente. | `WLED/`, memoria del proyecto |
| App | LUMA: React 19 + Vite 7, adaptador `src/lib/wled.js` (API JSON + WebSocket), escenas, segmentos, temas, horario. `npm run build:poste` + `npm run instalar:poste -- <ip>` la instala en el poste como página principal. 35 pruebas + 7 e2e. Repo git en `luma-app` (último cambio: “las dos caras siempre idénticas”). | `luma-app/` |
| Pendientes del producto | Sin reloj con pila (pierde la hora sin internet), `maxpwr: 0` (límite de corriente desactivado), app no funciona desde HTTPS hacia el poste. | README |
| Herramientas en el PC | KiCad 10 con `kicad-cli` (exporta esquema, capas, lista de materiales). Node y Playwright (capturas automáticas). **No** hay LaTeX instalado. | verificado |

## 4. Enfoques considerados

| Enfoque | Ventaja | En contra |
|---|---|---|
| **A. LaTeX directo, un libro con partes** ← elegido | PDF formal y profesional, control total: recuadros, tablas, diagramas TikZ, índices. Fuentes entregables. | El técnico necesita LaTeX para editarlo; hay que instalar compilador. |
| B. Markdown + Pandoc | Fácil de editar | Menos control visual; recuadros y diagramas limitados. |
| C. Sitio MkDocs + PDF | Buscador, cómodo en campo | Se siente menos “entregable formal”; PDF exportado flojo. |

Se eligió **A** porque la documentación es el hito de pago y debe verse completa y profesional; el técnico va a cambiar el código, no el manual.

## 5. El entregable

1. **`Manual-LUMA.pdf`**: un libro en español.
2. **`Hoja-de-verificacion.pdf`**: una página imprimible por poste (casillas, valores medidos, firma).
3. **Fuentes** del documento (`.tex`, imágenes, diagramas) y el script para recompilarlo.
4. **Anexos en archivo**: `cfg.json` plantilla (sin contraseñas), Gerbers, esquema en PDF, binario del firmware compilado, `dist-poste/` de LUMA.

### Estructura del libro

**Parte 0 · Inicio**: portada, control de versiones del documento, cómo usar el manual, convenciones (recuadros ADVERTENCIA / NOTA / PENDIENTE), glosario (GPIO, RMT, I2S, WS2811, segmento, preset…), visión general del sistema con un diagrama de bloques (fuente → PCB → ESP32 → caras A/B; teléfono → Wi-Fi del poste → LUMA → WLED).

**Parte I · Hardware**
1. Lista de materiales: referencia, valor, cantidad, proveedor/enlace (de KiCad + lista de compra).
2. La PCB_V2: vistas superior/inferior, función de cada bornera y punto de prueba, fusibles y su estado real (F5).
3. Esquema eléctrico comentado por bloques (alimentación, ESP32, salidas de datos, inyección).
4. Ensamble paso a paso: soldar, ajustar LM2596 a 5,0 V **antes** de insertar la ESP, verificación con multímetro.
5. Cableado del poste: fuente, caras A y B, inyección, calibre de cable, fusibles, caja y condiciones ambientales (fuente solo interiores).
6. Consumo y protección: corriente medida, cálculo para 100/200 píxeles por cara, límite del 85 %.

**Parte II · Firmware (WLED en una ESP32-S3 nueva)**
7. Preparar el PC: VS Code, PlatformIO, driver USB, Node.js, obtener el código.
8. Grabar el firmware: camino principal con el binario entregado; camino alterno compilando `esp32s3dev_16MB_opi`. Modo de arranque, puerto USB correcto, qué hacer si no aparece. Advertencia: no alimentar por USB y LM2596 a la vez.
9. Primera configuración de WLED: red propia, contraseña, salidas LED (pin, tipo, orden de color, cantidad, RMT/I2S), límite de corriente, subir `cfg.json` plantilla, reinicio cortando la corriente. Tabla de pines con **PENDIENTE** hasta que se confirme.

**Parte III · App LUMA**
10. Compilar e instalar LUMA en el poste (`build:poste`, `instalar:poste`), abrirla en el teléfono, añadirla a la pantalla de inicio.
11. Manual de uso, con capturas: conectar, colores, efectos, segmentos, escenas, modo automático, horario, temas, brillo, Mi montaje, consumo, seguridad.
12. Prueba de aceptación del poste (la misma de la hoja de verificación, explicada).

**Parte IV · El código**
13. Arquitectura: carpetas, módulos (`wled.js`, `controller.js`, `scenes.js`, `segments.js`, `themes.js`, `pole-renderer.js`…), diagrama de cómo viaja un cambio desde la pantalla hasta los LED y de vuelta.
14. Cómo hacer cambios comunes: añadir/editar un efecto, un tema, una paleta, textos; cambiar el montaje por defecto.
15. Desarrollo y pruebas: `npm run dev`, `npm test`, `npm run test:e2e`, compilar, volver a instalar; uso de git.
16. Contrato con WLED: qué endpoints usa LUMA (`/json`, `/json/state`, `/ws`, `/upload`, `presets.json`) y qué verifica.

**Parte V · Operación y mantenimiento**
17. Solución de problemas: tabla síntoma → causa → solución (segunda cara apagada, cambios que no se aplican, no aparece la red, red de 5 GHz, hora perdida tras un corte, PIN olvidado, poste sin responder).
18. Actualizar firmware y app, respaldo y restauración (`cfg.json`, `presets.json`).
19. Limitaciones conocidas y mejoras pendientes (RTC DS3231/fotocelda, HTTPS, F5, fusibles, fuente para exteriores).

**Anexos**: A. tabla de pines · B. `cfg.json` comentado · C. referencia de efectos (de `design/EFFECTS-RESEARCH.md`) · D. hoja de verificación · E. referencias externas (kno.wled.ge, Espressif, datasheets).

## 6. De dónde salen las imágenes

| Tipo | Cómo | Regenerable |
|---|---|---|
| Capturas de LUMA (móvil y escritorio) | Script Playwright nuevo, contra el poste simulado que ya usan las pruebas e2e; una captura por paso del manual | Sí |
| Esquema, capas de la PCB, lista de materiales | `kicad-cli` exportando de `PCB_V2` (SVG/PDF, BOM CSV) | Sí |
| Diagramas de bloques, cableado, flujo de datos | TikZ dentro del LaTeX | Sí |
| Capturas de WLED (ajustes LED, Wi-Fi) | Del poste real o de una ESP32 de prueba | Manual |
| Fotos: placa ambas caras, ensamble, poste armado, cableado, caja | **Las toma el equipo** con una lista de tomas que entrega el constructor | Manual |

Donde falte una foto se deja un marco **FOTO PENDIENTE: <descripción>** para que el PDF compile completo y se vea qué falta.

## 7. Herramientas y archivos

- Compilador: **Tectonic** (un solo ejecutable, descarga paquetes solo). Clase `book` (o `scrbook`), español (`babel`), `tcolorbox` para recuadros, `tikz` para diagramas, `listings`/`minted` para código, `hyperref` para enlaces.
- Carpeta: `LED/documentacion/` (fuente `.tex` por capítulo, `img/`, `diagramas/`, `scripts/` para capturas y exportes de KiCad, `build/`), con su propio repositorio git.
- Un comando regenera todo: exportes de KiCad + capturas + PDF.

## 8. Decidido en la conversación

- Lector: técnico instalador que también puede cambiar el código.
- Cubrir instalación completa en ESP32-S3 nuevas.
- Enfoque A (LaTeX, libro con partes) + hoja de verificación de una página.
- PCB final: PCB_V2. Pines de las caras: pendientes; se avanza con lo demás.

## 9. Lo que queda para el constructor

Diseño visual del documento, redacción, orden fino de secciones, qué capturas exactas tomar, formato de la lista de tomas de fotos, script de regeneración, verificación de cada dato contra el código y el hardware actuales.

## 10. Decisiones mías (corregibles)

- Firmware: camino principal = **grabar el binario que entregamos**; compilar desde el código queda como camino alterno.
- Valores de fusibles: se documenta la recomendación del LEEME como **recomendación por confirmar**, no como valor final.
- Se añade un anexo de **licencias** (WLED es software libre con licencia EUPL-1.2; al distribuir el firmware hay que respetarla).
- Las contraseñas aparecen como campos en blanco en la hoja de verificación, nunca en el texto.

## 11. Respuestas del equipo (15-11-2026)

1. **Producción: 100 LEDs por cara** (200 en total). La plantilla `cfg.json`, el cálculo de consumo y los fusibles se hacen para 100 por cara; 200 por cara se menciona como variante.
2. **El cliente recibe el código por GitHub.** Los capítulos 7 y 15 enseñan a clonar, actualizar (`git pull`) y subir cambios; se explica git lo mínimo necesario.
3. **El producto se llama LUMA.** Nombre de nuestra empresa, del cliente y logo en portada: **PENDIENTE** (se deja el espacio).
4. **No hay lista de compra real** por ahora: la lista de materiales se arma desde KiCad + enlaces de Electronilab de los LEEME, con columna de proveedor marcada «por confirmar» donde no haya fuente.

## 12. Pendientes que no bloquean el avance

- Pines de las caras A y B (recuadro PENDIENTE en capítulo 9 y anexo A).
- Nombre de empresa, cliente y logo para la portada.
- Fotos reales: el constructor entrega la lista de tomas; el equipo las toma.
- Valores finales de fusibles.
