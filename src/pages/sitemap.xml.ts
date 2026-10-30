import type { APIRoute } from 'astro';
import { absoluta } from '../lib/site';

// Mapa del sitio para buscadores. Añade aquí nuevas páginas si se crean.
const paginas = [
  { path: '', prioridad: '1.0' },
  { path: 'aviso-legal/', prioridad: '0.2' },
];

export const GET: APIRoute = () => {
  const hoy = new Date().toISOString().slice(0, 10);
  const urls = paginas
    .map((p) => `  <url><loc>${absoluta(p.path)}</loc><lastmod>${hoy}</lastmod><priority>${p.prioridad}</priority></url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
