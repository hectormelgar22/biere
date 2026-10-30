import { defineConfig } from 'astro/config';

// La web se publica en GitHub Pages bajo /biere/.
// Si algún día se usa un dominio propio, cambia `site` y deja `base` en '/'.
export default defineConfig({
  site: 'https://hectormelgar22.github.io',
  base: '/biere',
  trailingSlash: 'ignore',
  compressHTML: true,
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  devToolbar: { enabled: false },
});
