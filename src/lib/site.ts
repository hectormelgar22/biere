import type { ImageMetadata } from 'astro';
import negocio from '../data/negocio.json';

/** Ruta interna respetando la base de GitHub Pages (/biere/). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

/** URL absoluta (canonical, Open Graph, datos estructurados). */
export function absoluta(path = ''): string {
  return new URL(url(path), import.meta.env.SITE).href;
}

const fotos = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/*.{jpg,jpeg,png,webp}', { eager: true });

/** Devuelve una foto de src/assets/photos por su nombre de archivo (sin extensión). */
export function foto(nombre: string): ImageMetadata {
  const entrada = Object.entries(fotos).find(([ruta]) => ruta.split('/').pop()?.replace(/\.\w+$/, '') === nombre);
  if (!entrada) throw new Error(`No existe la foto "${nombre}" en src/assets/photos`);
  return entrada[1].default;
}

/** "11:00–15:30 · 19:00–23:30" o "Cerrado". */
export function tramosTexto(tramos: string[][]): string {
  return tramos.length ? tramos.map(([a, b]) => `${a}–${b}`).join(' · ') : 'Cerrado';
}

/** Resumen del horario agrupando días con el mismo horario. */
export function horarioResumen(): string {
  const dias = negocio.horario.dias;
  const abiertos = dias.filter((d) => d.tramos.length);
  const cerrados = dias.filter((d) => !d.tramos.length);
  const mismos = abiertos.every((d) => tramosTexto(d.tramos) === tramosTexto(abiertos[0].tramos));
  if (!mismos || !abiertos.length) return dias.map((d) => `${d.dia}: ${tramosTexto(d.tramos)}`).join('. ');
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const cerradoTxt = cerrados.length ? `${cap(cerrados.map((d) => d.dia).join(' y '))}, cerrado.` : '';
  return `${tramosTexto(abiertos[0].tramos)}. ${cerradoTxt}`.trim();
}

export { negocio };
