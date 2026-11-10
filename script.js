/* =====================================================================
   CRUZ ÁMBAR · script.js
   Todo es mejora progresiva: si algo falla, la página sigue completa y legible.
   Librería opcional: anime.js 3.2.2 (cdnjs). Si la CDN no responde, solo se omiten
   la onda de puntos del héroe y el trazo de los iconos.
   ===================================================================== */
(() => {
  'use strict';

  /* ---------------------------------------------------------------
     CONFIGURACIÓN: único lugar donde vive el número de WhatsApp.
     Formato: código de país 52 + los 10 dígitos, todo junto y sin signos.
     Mientras esté vacío, el formulario y el botón flotante permanecen ocultos
     y la sección de contacto muestra el aviso «Canal en activación».
     --------------------------------------------------------------- */
  const WHATSAPP_NUMERO = '';

  /* ---------- Utilidades ---------- */
  const root = document.documentElement;
  root.classList.add('js');
  window.__cruzOK = true;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const safe = (fn) => { try { fn(); } catch (err) { if (window.console) console.warn('[cruz-ambar]', err); } };

  /* ---------------------------------------------------------------
     1. CARGADOR (≤ 2.5 s; el CSS tiene su propio respaldo)
     --------------------------------------------------------------- */
  safe(() => {
    const pl = $('#preloader');
    if (!pl) return;
    const pct = $('#plPct');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      pl.classList.add('is-done');
      root.classList.add('is-loaded');
      setTimeout(() => { if (pl.parentNode) pl.parentNode.removeChild(pl); }, 900);
    };
    const t0 = performance.now();
    const dur = 1700;
    const ease = (p) => 1 - Math.pow(1 - p, 3);
    const tick = (now) => {
      if (done) return;
      const p = clamp((now - t0) / dur, 0, 1);
      if (pct) pct.textContent = String(Math.round(ease(p) * 100));
      if (p < 1) requestAnimationFrame(tick); else finish();
    };
    requestAnimationFrame(tick);
    setTimeout(finish, 2100); // respaldo si requestAnimationFrame se pausa
  });

  /* ---------------------------------------------------------------
     2. MENÚ MÓVIL
     --------------------------------------------------------------- */
  safe(() => {
    const burger = $('#burger');
    const nav = $('#nav');
    if (!burger || !nav) return;
    const setOpen = (open) => {
      nav.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    };
    burger.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', () => { if (window.innerWidth >= 960) setOpen(false); });
  });

  /* ---------------------------------------------------------------
     3. REVELADO POR SCROLL (IntersectionObserver + respaldo por geometría)
        Los .rv nunca llevan clip-path ni escala 0: siempre son detectables.
     --------------------------------------------------------------- */
  let pending = $$('.rv');
  const showEl = (el) => el.classList.add('in');
  const geoReveal = (vh) => {
    if (!pending.length) return;
    pending = pending.filter((el) => {
      if (el.classList.contains('in')) return false;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) { showEl(el); return false; }
      return true;
    });
  };
  safe(() => {
    if (reduce || !('IntersectionObserver' in window)) { pending.forEach(showEl); pending = []; return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { showEl(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    pending.forEach((el) => io.observe(el));
  });

  /* ---------------------------------------------------------------
     4. MANIFIESTO: las palabras se encienden con el scroll
     --------------------------------------------------------------- */
  const man = $('#manifesto');
  let words = [];
  safe(() => {
    if (!man) return;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = tok;
            frag.appendChild(s);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) {
          walk(ch);
        }
      });
    };
    walk(man);
    words = $$('.w', man);
    if (reduce) words.forEach((w) => w.classList.add('on'));
  });
  const wordsFrame = (vh) => {
    if (!words.length || reduce) return;
    const r = man.getBoundingClientRect();
    const p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.3), 0, 1);
    const n = Math.round(p * words.length * 1.06);
    words.forEach((w, i) => {
      const on = i < n;
      if (w._on !== on) { w._on = on; w.classList.toggle('on', on); }
    });
  };

  /* ---------------------------------------------------------------
     5. TARJETAS APILADAS: las anteriores se encogen y oscurecen
     --------------------------------------------------------------- */
  const cards = $$('.card');
  const cardIn = cards.map((c) => $('.card__in', c));
  const stackFrame = (vh) => {
    if (!cards.length || reduce) return;
    const wide = window.innerWidth >= 960;
    const hh = wide ? 72 : 64;
    const arrive = cards.map((c, j) => {
      if (j === 0) return 0;
      const top = c.getBoundingClientRect().top;
      const stick = hh + (wide ? 20 : 14) + j * (wide ? 18 : 14);
      return clamp(1 - (top - stick) / (vh * 0.85), 0, 1);
    });
    cardIn.forEach((el, i) => {
      let sum = 0;
      for (let j = i + 1; j < cards.length; j++) sum += arrive[j];
      el.style.setProperty('--s', (1 - 0.04 * sum).toFixed(4));
      el.style.setProperty('--b', (1 - 0.14 * sum).toFixed(3));
    });
  };

  /* ---------------------------------------------------------------
     6. «EN CAMPO»: la imagen se abre hasta ocupar toda la pantalla
     --------------------------------------------------------------- */
  const zoom = $('#campo');
  const zoomFrame = (vh) => {
    if (!zoom) return;
    if (reduce) { zoom.style.setProperty('--p', '1'); return; }
    const r = zoom.getBoundingClientRect();
    const total = r.height - vh;
    if (total <= 0) { zoom.style.setProperty('--p', '1'); return; }
    let p = clamp(-r.top / (total * 0.72), 0, 1);
    p = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOutQuad
    zoom.style.setProperty('--p', p.toFixed(4));
  };

  /* ---------------------------------------------------------------
     7. PROTOCOLO P.A.S.: el paso activo cambia la foto
     --------------------------------------------------------------- */
  const steps = $$('.pas-step');
  const pasImgs = $$('#pasMedia img');
  const pasTag = $('#pasTag');
  const pasNames = ['P · Proteger', 'A · Avisar', 'S · Socorrer'];
  let pasCur = -1;
  const pasFrame = (vh) => {
    if (!steps.length) return;
    let best = 0;
    let bd = Infinity;
    steps.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - vh * 0.5);
      if (d < bd) { bd = d; best = i; }
    });
    if (best === pasCur) return;
    pasCur = best;
    steps.forEach((s, i) => s.classList.toggle('on', i === best));
    pasImgs.forEach((im, i) => im.classList.toggle('on', i === best));
    if (pasTag) pasTag.textContent = pasNames[best] || '';
  };

  /* ---------------------------------------------------------------
     8. ENLACE ACTIVO EN EL MENÚ + BARRA DE PROGRESO + PARALLAX DEL HÉROE
     --------------------------------------------------------------- */
  const navLinks = $$('.nav a[href^="#"]:not(.btn)');
  const navSecs = navLinks.map((a) => $(a.getAttribute('href')));
  const bar = $('#progressBar');
  const heroBg = $('#heroBg');
  const stagePar = $('#stagePar');
  const globalFrame = (y, vh) => {
    // progreso de lectura
    const max = root.scrollHeight - vh;
    if (bar && max > 0) bar.style.transform = 'scaleX(' + clamp(y / max, 0, 1).toFixed(4) + ')';
    // menú
    let cur = -1;
    navSecs.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= vh * 0.4) cur = i; });
    navLinks.forEach((a, i) => a.classList.toggle('is-active', i === cur));
    // parallax del héroe
    if (!reduce && y < vh * 1.4) {
      const k = Math.min(y, 600);
      if (heroBg) heroBg.style.transform = 'translate3d(0,' + (k * 0.14).toFixed(1) + 'px,0)';
      if (stagePar) stagePar.style.transform = 'translate3d(0,' + (-k * 0.07).toFixed(1) + 'px,0)';
    }
  };

  /* ---------------------------------------------------------------
     9. BUCLE ÚNICO DE SCROLL (requestAnimationFrame)
     --------------------------------------------------------------- */
  let ticking = false;
  const frame = () => {
    ticking = false;
    const vh = window.innerHeight;
    const y = window.scrollY || window.pageYOffset || 0;
    safe(() => globalFrame(y, vh));
    safe(() => wordsFrame(vh));
    safe(() => stackFrame(vh));
    safe(() => zoomFrame(vh));
    safe(() => pasFrame(vh));
    safe(() => geoReveal(vh));
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  window.addEventListener('load', request);
  document.addEventListener('visibilitychange', request);
  request();
  // Respaldo por geometría: a los ~2 s de cargar, revela lo que ya esté a la vista
  setTimeout(() => safe(() => geoReveal(window.innerHeight)), 2000);
  setTimeout(() => safe(() => geoReveal(window.innerHeight)), 4000);

  /* ---------------------------------------------------------------
     10. EFECTOS DE PUNTERO (solo mouse): inclinación 3D, foco y botones magnéticos
     --------------------------------------------------------------- */
  safe(() => {
    if (!fine || reduce) return;
    const hero = $('#inicio');
    const tilt = $('#stageTilt');
    if (hero && tilt) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.setProperty('--ry', (nx * 20).toFixed(2) + 'deg');
        tilt.style.setProperty('--rx', (-ny * 14).toFixed(2) + 'deg');
      });
      hero.addEventListener('pointerleave', () => {
        tilt.style.setProperty('--ry', '0deg');
        tilt.style.setProperty('--rx', '0deg');
      });
    }
    $$('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((x - 0.5) * 18).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * 18).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
    $$('.spot').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      });
    });
    $$('.btn--mag').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        b.style.transform = 'translate(' + (dx * 0.16).toFixed(1) + 'px,' + (dy * 0.26).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  });

  /* ---------------------------------------------------------------
     11. ONDA DE PUNTOS DEL HÉROE (anime.js, cuadrícula con stagger desde el centro)
     --------------------------------------------------------------- */
  let lastW = window.innerWidth;
  const buildDots = () => {
    const g = $('#dotgrid');
    if (!g) return;
    const small = window.innerWidth < 700;
    const cols = small ? 11 : 17;
    const rows = small ? 9 : 11;
    g.style.setProperty('--cols', String(cols));
    g.innerHTML = '<i></i>'.repeat(cols * rows);
    if (reduce || !window.anime) return;
    if (g._anim && g._anim.pause) g._anim.pause();
    g._anim = window.anime({
      targets: '#dotgrid i',
      scale: [{ value: 2.4, duration: 450, easing: 'easeOutSine' }, { value: 0.7, duration: 1100, easing: 'easeInOutQuad' }],
      opacity: [{ value: 1, duration: 450 }, { value: 0.3, duration: 1100 }],
      delay: window.anime.stagger(85, { grid: [cols, rows], from: 'center' }),
      endDelay: 500,
      loop: true
    });
  };
  safe(buildDots);

  /* Trazo progresivo de los iconos al entrar en pantalla (anime.js) */
  safe(() => {
    if (reduce || !window.anime || !('IntersectionObserver' in window)) return;
    $$('.fact svg, .pcard svg').forEach((svg) => {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          io.disconnect();
          window.anime({
            targets: svg.querySelectorAll('path, circle'),
            strokeDashoffset: [window.anime.setDashoffset, 0],
            easing: 'easeInOutSine',
            duration: 1400,
            delay: window.anime.stagger(140)
          });
        });
      });
      io.observe(svg);
    });
  });

  /* ---------------------------------------------------------------
     12. BRASAS: partículas ámbar con red de líneas (canvas, siempre en movimiento)
     --------------------------------------------------------------- */
  let embersResize = null;
  safe(() => {
    const cv = $('#embers');
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, ps = [], visible = true;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const make = (init) => ({ x: rnd(0, w), y: init ? rnd(0, h) : h + rnd(0, 40), r: rnd(0.6, 2.4), vy: -rnd(0.12, 0.55), vx: rnd(-0.15, 0.15), a: rnd(0.25, 0.85), ph: rnd(0, 6.28) });
    const size = () => {
      const r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp((w * h) / 20000, 26, 78));
      ps = Array.from({ length: n }, () => make(true));
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        if (!reduce) {
          p.y += p.vy;
          p.x += p.vx + Math.sin(t * 0.0007 + p.ph) * 0.18;
          if (p.y < -10 || p.x < -10 || p.x > w + 10) { ps[i] = make(false); continue; }
        }
        const tw = 0.6 + 0.4 * Math.sin(t * 0.002 + p.ph);
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,' + (190 + Math.round(40 * tw)) + ',60,' + (p.a * tw).toFixed(3) + ')';
        ctx.shadowColor = 'rgba(245,181,10,.9)';
        ctx.shadowBlur = 8;
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.lineWidth = 0.6;
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const dx = ps[i].x - ps[j].x;
          const dy = ps[i].y - ps[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 8100) {
            ctx.strokeStyle = 'rgba(245,181,10,' + (0.16 * (1 - d2 / 8100)).toFixed(3) + ')';
            ctx.beginPath();
            ctx.moveTo(ps[i].x, ps[i].y);
            ctx.lineTo(ps[j].x, ps[j].y);
            ctx.stroke();
          }
        }
      }
    };
    size();
    embersResize = size;
    if (reduce) { draw(0); return; }
    const loop = (t) => { if (visible && !document.hidden) draw(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    const hero = $('#inicio');
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(hero);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW) return; // ignora el cambio de alto por la barra del navegador móvil
    lastW = window.innerWidth;
    safe(buildDots);
    if (embersResize) safe(embersResize);
  });

  /* ---------------------------------------------------------------
     13. VISOR DE FOTOS (la imagen se abre en grande)
     --------------------------------------------------------------- */
  safe(() => {
    const lb = $('#lightbox');
    const img = $('#lbImg');
    const cap = $('#lbCap');
    if (!lb || !img) return;
    const items = [];
    $$('.rail .shot').forEach((b) => {
      const i = Number(b.dataset.i);
      const im = $('img', b);
      if (!items[i] && im) items[i] = { src: im.getAttribute('src'), alt: im.getAttribute('alt') || '' };
    });
    let idx = 0;
    let lastFocus = null;
    const show = (i) => {
      idx = (i + items.length) % items.length;
      const it = items[idx];
      if (!it) return;
      img.src = it.src;
      img.alt = it.alt;
      if (cap) cap.textContent = it.alt;
    };
    const open = (i, trigger) => {
      lastFocus = trigger || document.activeElement;
      show(i);
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const x = $('#lbClose');
      if (x) x.focus();
    };
    const close = () => {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    $$('.rail .shot').forEach((b) => b.addEventListener('click', () => open(Number(b.dataset.i), b)));
    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', () => show(idx - 1));
    $('#lbNext').addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  });

  /* ---------------------------------------------------------------
     14. CONTACTO + WHATSAPP (el número vive solo en WHATSAPP_NUMERO)
     --------------------------------------------------------------- */
  safe(() => {
    const digits = String(WHATSAPP_NUMERO || '').replace(/\D/g, '');
    const num = digits.length === 10 ? '52' + digits : (digits.length >= 11 ? digits : '');
    const form = $('#contactForm');
    const soon = $('#contactSoon');
    const wa = $('#waFloat');
    const shareBtn = $('#shareBtn');
    const shareMsg = $('#shareMsg');

    // Interés preseleccionado desde los botones de la página
    const interesMap = { voluntario: null, capacitacion: '#int-capacitacion', evento: '#int-evento', duda: '#int-duda' };
    $$('[data-interes]').forEach((a) => {
      a.addEventListener('click', () => {
        const key = a.getAttribute('data-interes');
        if (!form || form.hidden) return;
        const sel = interesMap[key];
        const radio = sel ? $(sel) : $('input[name="interes"]', form);
        if (radio) radio.checked = true;
      });
    });

    if (num) {
      // Hay número real: se muestra el formulario y el botón flotante
      if (form) form.hidden = false;
      if (soon) soon.hidden = true;
      if (wa) {
        wa.hidden = false;
        wa.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent('Hola, vengo de la página de Cruz Ámbar y me gustaría más información.');
      }
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          if (!form.reportValidity()) return;
          const fd = new FormData(form);
          const nombre = String(fd.get('nombre') || '').trim();
          const interes = String(fd.get('interes') || '').trim();
          const mensaje = String(fd.get('mensaje') || '').trim();
          const texto = [
            'Hola, Cruz Ámbar. Soy ' + nombre + '.',
            interes + '.',
            mensaje ? mensaje : '',
            '(Enviado desde la página web)'
          ].filter(Boolean).join('\n');
          window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
        });
      }
    } else {
      // Sin número: se oculta el envío y el botón flotante con elegancia
      if (form) form.hidden = true;
      if (soon) soon.hidden = false;
      if (wa) wa.hidden = true;
    }

    // Compartir la página (sirve mientras no haya WhatsApp)
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        const data = { title: document.title, text: 'Conoce Cruz Ámbar: voluntarios que atienden gratis a la ciudadanía en la CDMX.', url: window.location.href };
        const fallback = 'Copia la dirección de esta página y compártela.';
        try {
          if (navigator.share) {
            await navigator.share(data);
            if (shareMsg) shareMsg.textContent = '¡Gracias por compartir!';
          } else if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(window.location.href);
            if (shareMsg) shareMsg.textContent = 'Enlace copiado. ¡Compártelo!';
          } else if (shareMsg) {
            shareMsg.textContent = fallback;
          }
        } catch (err) {
          if (err && err.name === 'AbortError') return;
          if (shareMsg) shareMsg.textContent = fallback;
        }
      });
    }
  });
})();
