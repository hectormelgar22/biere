import negocio from '../data/negocio.json';
import caveatBrush from '../assets/fonts/caveat-brush.woff2?url';

declare global {
  interface Window { __biere?: boolean }
}
window.__biere = true;

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- Cabecera: fondo sólido al hacer scroll (sin leer el scroll en cada frame) ---------- */
const header = document.querySelector<HTMLElement>('[data-header]');
const sentinel = document.querySelector('[data-scroll-sentinel]');
if (header && sentinel && 'IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => header.classList.toggle('is-scrolled', !e.isIntersecting)).observe(sentinel);
}

/* ---------- Fuente manuscrita de las anotaciones: se pide cuando lo principal ya ha cargado ---------- */
function cargarManuscrita() {
  if (!('FontFace' in window)) return;
  const font = new FontFace('Caveat Brush', `url(${caveatBrush}) format('woff2')`, { display: 'swap' });
  font.load().then((f) => document.fonts.add(f)).catch(() => {});
}
if (document.readyState === 'complete') cargarManuscrita();
else window.addEventListener('load', cargarManuscrita, { once: true });

/* ---------- Menú móvil (dialog nativo: foco atrapado y Esc incluidos) ---------- */
const menu = document.querySelector<HTMLDialogElement>('[data-menu]');
const menuOpen = document.querySelector<HTMLButtonElement>('[data-menu-open]');

function closeMenu() {
  if (!menu?.open) return;
  menuOpen?.setAttribute('aria-expanded', 'false');
  if (reduceMotion.matches) { menu.close(); return; }
  menu.classList.add('is-closing');
  menu.addEventListener('animationend', () => {
    menu.classList.remove('is-closing');
    menu.close();
  }, { once: true });
}

if (menu && menuOpen) {
  menuOpen.addEventListener('click', () => {
    menu.showModal();
    menuOpen.setAttribute('aria-expanded', 'true');
  });
  menu.querySelector('[data-menu-close]')?.addEventListener('click', closeMenu);
  menu.addEventListener('cancel', (e) => { e.preventDefault(); closeMenu(); });
  menu.addEventListener('close', () => { menuOpen.setAttribute('aria-expanded', 'false'); menuOpen.focus(); });
  menu.querySelectorAll<HTMLAnchorElement>('[data-menu-link]').forEach((a) => {
    a.addEventListener('click', () => {
      // Cierra sin animación para que el scroll al ancla sea inmediato.
      menu.close();
    });
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches && menu.open) menu.close(); });
}

/* ---------- Enlaces internos ----------
   Las secciones se pintan bajo demanda (content-visibility). Antes de saltar a una
   sección se pintan todas, para que el desplazamiento acabe exactamente en su sitio. */
function pintarTodo() { root.classList.add('cv-off'); }
function irA(hash: string, smooth: boolean) {
  const target = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!target) return false;
  pintarTodo();
  target.scrollIntoView({ behavior: smooth && !reduceMotion.matches ? 'smooth' : 'auto', block: 'start' });
  return true;
}
document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
  if (!a) return;
  const destino = new URL(a.href);
  if (destino.pathname !== location.pathname || !destino.hash) return;
  if (irA(destino.hash, true)) {
    e.preventDefault();
    history.pushState(null, '', destino.hash);
  }
});
if (location.hash) requestAnimationFrame(() => irA(location.hash, false));

/* ---------- Revelados al entrar en pantalla ---------- */
const revealTargets = document.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-img]');
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLElement;
      el.classList.add('is-in');
      el.querySelectorAll('.shutter').forEach((s) => s.classList.add('is-in'));
      io.unobserve(el);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  revealTargets.forEach((el) => io.observe(el));
} else {
  revealTargets.forEach((el) => {
    el.classList.add('is-in');
    el.querySelectorAll('.shutter').forEach((s) => s.classList.add('is-in'));
  });
}

/* ---------- Carta: pestañas accesibles ---------- */
const carta = document.querySelector<HTMLElement>('[data-carta]');
if (carta) {
  const tablist = carta.querySelector<HTMLElement>('[data-carta-tabs]')!;
  const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(carta.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
  const desktop = window.matchMedia('(min-width: 1024px)');

  function select(id: string, { focus = false, scroll = false } = {}) {
    const tab = tabs.find((t) => t.dataset.cat === id);
    const panel = panels.find((p) => p.dataset.panel === id);
    if (!tab || !panel) return;
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p) => {
      const on = p === panel;
      if (on && p.hidden) {
        p.hidden = false;
        if (!reduceMotion.matches) {
          p.classList.remove('is-entering');
          void p.offsetWidth;
          p.classList.add('is-entering');
        }
      } else if (!on) {
        p.hidden = true;
        p.classList.remove('is-entering');
      }
    });
    if (focus) tab.focus();
    // En móvil, centra la pestaña activa dentro de la fila deslizable.
    if (!desktop.matches) {
      const left = tab.offsetLeft - (tablist.clientWidth - tab.offsetWidth) / 2;
      tablist.scrollTo({ left, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }
    if (scroll) {
      const top = carta.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.6) {
        window.scrollTo({ top: window.scrollY + top - 80, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      }
    }
  }

  tabs.forEach((tab) => tab.addEventListener('click', () => select(tab.dataset.cat!, { scroll: true })));
  tablist.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const next: Record<string, number> = {
      ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1,
    };
    if (!(e.key in next)) return;
    e.preventDefault();
    const target = tabs[(next[e.key] + tabs.length) % tabs.length];
    select(target.dataset.cat!, { focus: true });
  });

  // Enlaces "Ver en la carta" desde los platos imprescindibles.
  document.querySelectorAll<HTMLAnchorElement>('[data-carta-ir]').forEach((a) => {
    a.addEventListener('click', () => select(a.dataset.cartaIr!));
  });
}

/* ---------- Abierto / cerrado ahora (hora de Cuenca) ---------- */
type Dia = { dia: string; tramos: string[][] };
const dias = negocio.horario.dias as Dia[];

function ahoraEnCuenca() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  const mins = (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10);
  return { wd, mins };
}
const aMin = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
const diaDe = (wd: number) => dias[(wd + 6) % 7]; // dias[0] = lunes

function estado() {
  const { wd, mins } = ahoraEnCuenca();
  const hoy = diaDe(wd);
  for (const [abre, cierra] of hoy.tramos) {
    if (mins >= aMin(abre) && mins < aMin(cierra)) return { abierto: true, texto: `Abierto ahora · hasta las ${cierra}` };
  }
  const luego = hoy.tramos.find(([abre]) => aMin(abre) > mins);
  if (luego) return { abierto: false, texto: `Cerrado ahora · abre hoy a las ${luego[0]}` };
  for (let i = 1; i <= 7; i++) {
    const d = diaDe((wd + i) % 7);
    if (d.tramos.length) return { abierto: false, texto: `Cerrado ahora · abre ${i === 1 ? 'mañana' : `el ${d.dia}`} a las ${d.tramos[0][0]}` };
  }
  return { abierto: false, texto: 'Cerrado ahora' };
}

function pintarEstado() {
  const e = estado();
  const { wd } = ahoraEnCuenca();
  document.querySelectorAll<HTMLElement>('[data-estado]').forEach((el) => {
    el.hidden = false;
    el.classList.toggle('is-open', e.abierto);
    const label = el.querySelector('[data-estado-label]');
    if (label) label.textContent = e.texto;
  });
  document.querySelectorAll<HTMLElement>('[data-estado-texto]').forEach((el) => { el.textContent = e.texto; });
  document.querySelectorAll<HTMLTableRowElement>('[data-horario] tr').forEach((tr) => {
    tr.classList.toggle('is-today', Number(tr.dataset.dia) === wd);
  });
}
pintarEstado();
setInterval(pintarEstado, 60_000);

root.classList.add('is-ready');
