# BIÉRE · web oficial

Web de **BIÉRE**, bar y cocina venezolana en Cuenca (C. Dalmacio García Izcara, 9).

- Web publicada: https://hectormelgar22.github.io/biere/
- Cada cambio que se sube a la rama `main` se publica solo en 1–3 minutos (pestaña **Actions** del repositorio).

---

## Cómo actualizar la web sin programar

La forma más sencilla es editar los archivos **desde la propia web de GitHub**:

1. Entra en el repositorio y abre el archivo que quieras cambiar (ver tabla).
2. Pulsa el icono del **lápiz** (Edit this file).
3. Haz el cambio respetando las comillas `"` y las comas `,`.
4. Pulsa **Commit changes**. En un par de minutos la web estará actualizada.

| Quiero cambiar…                         | Archivo                     |
| --------------------------------------- | --------------------------- |
| Platos, descripciones, precios, bebidas | `src/data/carta.json`       |
| Horario, teléfono, dirección, enlaces   | `src/data/negocio.json`     |
| Reseñas destacadas                      | `src/data/resenas.json`     |
| Fotografías                             | `src/assets/photos/`        |

> Si al guardar algo falla, la pestaña **Actions** mostrará una cruz roja y la web seguirá como estaba. Suele ser una coma o unas comillas que faltan.

### La carta (`src/data/carta.json`)

Cada plato tiene este aspecto:

```json
{ "nombre": "Reina Pepiada", "descripcion": "Pollo desmenuzado, aguacate fresco y un toque de mayonesa.", "etiquetas": ["La favorita de la casa"], "precio": null, "disponible": "si", "fuentes": ["glovo"] }
```

- **precio**: escribe el precio entre comillas, por ejemplo `"precio": "9,50 €"`. Con `null` no se muestra ningún precio (es lo que hay ahora, porque los precios del local no estaban confirmados).
- **disponible**: `"si"` o `"consultar"` (muestra la etiqueta «Pregunta si hay»).
- **etiquetas**: textos cortos como `"Novedad"` o `"Picante"`. «La favorita de la casa» y «Novedad» salen en amarillo.
- **detalle** (opcional): por ejemplo `"6 unidades"`.
- **grupo** (opcional): agrupa platos dentro de una categoría (se usa en Bebidas: Cervezas / De la casa / Sin alcohol).
- **fuentes**: solo informativo (de dónde salió el dato). No se muestra.
- Para añadir un plato, copia una línea entera de otro plato, pégala debajo y cambia los textos. Ojo con la coma entre platos.
- Cada categoría admite una foto (`"imagen": "nombre-de-la-foto"`). Ahora están en `null` para no repetir fotos de otras secciones.

### Horario y datos de contacto (`src/data/negocio.json`)

- **horario.dias**: cada día tiene sus tramos, por ejemplo `[["11:00", "15:30"], ["19:00", "23:30"]]`. Un día cerrado se deja así: `"tramos": []`.
- El cartel «Abierto ahora / Cerrado ahora» y la tabla de horario se calculan solos a partir de estos datos (hora de Cuenca).
- **telefono**, **direccion** y **enlaces** (Glovo, Just Eat, Instagram, Google Maps) se usan en toda la web: cambiándolos aquí se cambian en todas partes.
- **valoracion**: nota y número de reseñas de Google. Actualízalo de vez en cuando.

### Fotografías (`src/assets/photos/`)

- Para **sustituir** una foto, sube un JPG con **exactamente el mismo nombre** (por ejemplo `cachapa.jpg`). La web genera sola las versiones ligeras (AVIF/WebP) en varios tamaños.
- Usa fotos horizontales o verticales de al menos **1200 px** de ancho y sin textos encima.
- Fotos actuales: portada (interior) `interior-barra` (móvil) e `interior-botellas` (ordenador), y las tres fotos que «se sirven» en la barra: `hero-arepa-mechada`, `brindis-pared-botellas` y `brindis-cocteles`; la casa `puerta-de-biere`; platos `arepa-queso-de-mano`, `tequenos`, `mesa-para-compartir`, `cachapa`, `hamburguesa`; ambiente `noche-de-futbol`, `fachada-de-noche`, `dia-de-apertura`, `jarras-de-la-pared`.
- La portada («Entra en BIÉRE») está en `src/components/Hero.astro`; la fachada dibujada, en `src/components/Fachada.astro`, y la animación al hacer scroll, al principio de `src/scripts/main.ts`.
- Los textos manuscritos sobre las fotos (las «anotaciones») están en `src/components/Hero.astro` y `src/components/Imprescindibles.astro`.

---

## Para quien programe

Web estática hecha con [Astro](https://astro.build): sin base de datos ni servidor.

```bash
npm install        # instalar (Node 22.23 o superior)
npm run dev        # servidor de desarrollo en http://localhost:4321/biere/
npm run build      # compila la web en dist/
npm run preview    # sirve dist/ para probar la versión final
```

- `src/components/`: una pieza por sección (Hero, LaCasa, Imprescindibles, Carta, Domicilio, Ambiente, Opiniones, Visitanos, Header, Footer, OrderBar).
- `src/styles/global.css`: todo el diseño (colores y tipografías al principio, en `:root`).
- `src/scripts/main.ts`: menú móvil, pestañas de la carta, revelados al hacer scroll y estado «abierto ahora». Sin librerías.
- `src/assets/fonts/`: League Gothic, Instrument Sans y Caveat Brush, alojadas en la propia web (licencia SIL OFL en `public/licencias/`).
- `src/assets/svg/mapa-zona.svg`: mapa dibujado con datos de OpenStreetMap.
- `.github/workflows/deploy.yml`: compila y publica en GitHub Pages en cada push a `main`.
- La web vive en `/biere/` (ver `astro.config.mjs`). Con un dominio propio, cambia `site` y pon `base: '/'`.

---

## Pendiente de confirmar con BIÉRE

- **Permiso de uso de las fotos** (proceden del Instagram oficial @biere_bar y, las del interior de la portada, de la ficha de Google Maps) y consentimiento de las personas que aparecen en «brindis-cocteles», «noche-de-futbol», «puerta-de-biere», «dia-de-apertura» y «jarras-de-la-pared».
- **Horario**: tomado de la ficha de Google (L y X–D 11:00–15:30 y 19:00–23:30; martes cerrado). Confirmar y avisar si cambia en festivos.
- **Precios del local**: no se publican hasta tenerlos confirmados.
- **Disponibilidad** de mandocas, jojoticos, tequeños de guayaba, tiramisú, cannolo y cerveza con licor de frutas (aparecen como «Pregunta si hay»).
- **Just Eat**: al revisarlo solo ofrecía recogida en el local; confirmar si también hacen entrega por esa vía.
- **Datos legales** del titular (razón social y NIF) para completar el aviso legal.
- **Menú del día**: el Instagram indica 13 €; no se publica el precio hasta confirmarlo.
