import negocio from '../data/negocio.json';
import caveatBrush from '../assets/fonts/caveat-brush.woff2?url';

declare global {
  interface Window { __biere?: boolean }
}
window.__biere = true;

const root = document.documentElement;
/** Ejecuta trabajo no urgente cuando el navegador está libre (reparte la carga inicial). */
const enReposo = (fn: () => void) =>
  'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200);
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

/* ---------- Hero «Entra en BIÉRE»: el scroll sube la persiana y cruza la puerta ---------- */
const cine = document.querySelector<HTMLElement>('[data-cine]');
if (cine && !reduceMotion.matches) {
  const stage = cine.querySelector<HTMLElement>('[data-cine-stage]')!;
  const svg = cine.querySelector<SVGSVGElement>('[data-cine-fachada]')!;
  const barra = cine.querySelector<HTMLElement>('.cine__barra')!;
  const tramo = (p: number, desde: number, hasta: number) => Math.min(1, Math.max(0, (p - desde) / (hasta - desde)));
  const suave = (t: number) => t * t * (3 - 2 * t);
  let inicio = 0, recorrido = 1, activo = false, pendiente = false;

  // Puerta del dibujo (mismas coordenadas que en Fachada.astro).
  const PUERTA = { x: 480, y: 380, w: 130, h: 340 };
  let vb = [-300, 0, 1500, 800], recorta = false;

  // En horizontal se ve toda la fachada. En vertical, el dibujo se escala para que el letrero
  // quede siempre debajo del titular y la puerta por encima de la barra de pedido.
  const encuadrar = () => {
    const W = innerWidth, H = Math.max(innerHeight, 576);
    const vertical = W / H < 1;
    recorta = vertical;
    if (vertical) {
      const ancho = W >= 1024;
      const letra = ancho ? Math.min(Math.max(96, W * 0.11), 200) : Math.min(Math.max(54.4, W * 0.19), 192);
      const cabecera = ancho ? 76 : 64;
      const kicker = W < 380 ? 36 : 18;
      const finTitulo = cabecera + 20 + kicker + 12 + letra * 0.88 * (ancho ? 2 : 1);
      const arriba = finTitulo + 22;
      const abajo = H - (ancho ? 0 : 72) - 12;
      const k = (abajo - arriba) / (720 - 174); // del borde del letrero (y=174) al suelo (y=720)
      vb = [591 - W / (2 * k), 174 - arriba / k, W / k, H / k];
      stage.style.setProperty('--fin-titulo', `${finTitulo}px`);
    } else {
      vb = [-300, 0, 1500, 800];
    }
    svg.setAttribute('viewBox', vb.map((n) => n.toFixed(1)).join(' '));
    svg.setAttribute('preserveAspectRatio', vertical ? 'xMidYMid slice' : 'xMidYMid meet');
  };

  // Calcula dónde cae la puerta en pantalla a partir del viewBox (sin medir el SVG en el DOM).
  const medir = () => {
    const W = stage.clientWidth, H = stage.clientHeight;
    const k = (recorta ? Math.max : Math.min)(W / vb[2], H / vb[3]);
    const tx = (W - vb[2] * k) / 2 - vb[0] * k, ty = (H - vb[3] * k) / 2 - vb[1] * k;
    const x = tx + PUERTA.x * k, y = ty + PUERTA.y * k, w = PUERTA.w * k, h = PUERTA.h * k;
    stage.style.setProperty('--ox', `${x + w / 2}px`);
    stage.style.setProperty('--oy', `${y + h / 2}px`);
    stage.style.setProperty('--s', String(Math.max(W / w, H / h) * 1.12));
    stage.style.setProperty('--ax', `${x + w + 14}px`);
    stage.style.setProperty('--ay', `${y - 54}px`);
    inicio = cine.offsetTop;
    recorrido = Math.max(1, cine.offsetHeight - innerHeight);
  };

  const pintar = () => {
    pendiente = false;
    const p = Math.min(1, Math.max(0, (scrollY - inicio) / recorrido));
    const a = 0.12 + 0.88 * suave(tramo(p, 0, 0.3));
    const b = Math.pow(tramo(p, 0.22, 0.62), 2.2);
    const c = suave(tramo(p, 0.6, 0.92));
    stage.style.setProperty('--a', a.toFixed(4));
    stage.style.setProperty('--b', b.toFixed(4));
    stage.style.setProperty('--c', c.toFixed(4));
    stage.classList.toggle('is-dentro', c > 0.35);
  };
  const alScroll = () => { if (activo && !pendiente) { pendiente = true; requestAnimationFrame(pintar); } };

  encuadrar();
  // Las medidas se toman tras el primer pintado, cuando el navegador ya ha maquetado la página.
  requestAnimationFrame(() => requestAnimationFrame(() => { medir(); pintar(); }));
  new IntersectionObserver(([e]) => { activo = e.isIntersecting; if (activo) alScroll(); }).observe(cine);
  window.addEventListener('scroll', alScroll, { passive: true });
  window.addEventListener('resize', () => { encuadrar(); medir(); pintar(); });
  // Si alguien llega con el teclado a los botones del interior, se le lleva al final de la escena.
  barra.addEventListener('focusin', () => {
    if (!stage.classList.contains('is-dentro')) window.scrollTo({ top: inicio + recorrido, behavior: 'instant' });
  });
}

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
    root.classList.add('menu-abierto');
    menuOpen.setAttribute('aria-expanded', 'true');
  });
  menu.querySelector('[data-menu-close]')?.addEventListener('click', closeMenu);
  menu.addEventListener('cancel', (e) => { e.preventDefault(); closeMenu(); });
  menu.addEventListener('close', () => {
    root.classList.remove('menu-abierto');
    menuOpen.setAttribute('aria-expanded', 'false');
    menuOpen.focus();
  });
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
  target.scrollIntoView({ behavior: smooth && !reduceMotion.matches ? 'smooth' : 'instant', block: 'start' });
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
if (location.hash) {
  requestAnimationFrame(() => irA(location.hash, false));
  // El navegador puede recolocar el scroll al terminar de cargar: se corrige una vez más.
  window.addEventListener('load', () => irA(location.hash, false), { once: true });
}
window.addEventListener('hashchange', () => irA(location.hash, false));
window.addEventListener('popstate', () => { if (location.hash) irA(location.hash, false); });

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
if (carta) enReposo(() => {
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
});

/* ---------- Abierto / cerrado ahora (hora de Cuenca) ---------- */
type Dia = { dia: string; tramos: string[][] };
const dias = negocio.horario.dias as Dia[];

let reloj: Intl.DateTimeFormat | undefined;
function ahoraEnCuenca() {
  reloj ??= new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = reloj.formatToParts(new Date());
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
    if (mins >= aMin(abre) && mins < aMin(cierra)) return { abierto: true, texto: `Abierto hasta las ${cierra}` };
  }
  const luego = hoy.tramos.find(([abre]) => aMin(abre) > mins);
  if (luego) return { abierto: false, texto: `Cerrado. Abre hoy a las ${luego[0]}` };
  for (let i = 1; i <= 7; i++) {
    const d = diaDe((wd + i) % 7);
    if (d.tramos.length) return { abierto: false, texto: `Cerrado. Abre ${i === 1 ? 'mañana' : `el ${d.dia}`} a las ${d.tramos[0][0]}` };
  }
  return { abierto: false, texto: 'Cerrado' };
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
enReposo(() => {
  pintarEstado();
  setInterval(pintarEstado, 60_000);
});

