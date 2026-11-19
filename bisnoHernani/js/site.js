(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- Menu móvel ---------- */
  const burger = $('.burger'), nav = $('.nav');
  if (burger) {
    burger.addEventListener('click', () => {
      const o = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(o));
      document.body.style.overflow = o ? 'hidden' : '';
    });
    $$('.nav a').forEach((a) => a.addEventListener('click', () => {
      nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
    }));
  }

  /* ---------- Cabeçalho, régua, botões flutuantes ---------- */
  const header = $('.header');
  const ruler = document.createElement('div');
  ruler.className = 'ruler'; ruler.setAttribute('aria-hidden', 'true');
  ruler.innerHTML = '<div class="ticks"></div><div class="mk"><span>000 m</span></div>';
  document.body.appendChild(ruler);
  const mk = $('.mk', ruler), mkTxt = $('span', mk);
  const fab = document.createElement('div');
  fab.className = 'fab';
  fab.innerHTML =
    '<button class="up" type="button" aria-label="Voltar ao topo"><svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg></button>' +
    '<a class="wa" href="https://wa.me/244934544544" target="_blank" rel="noopener" aria-label="Falar por WhatsApp"><svg viewBox="0 0 24 24"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.7-5.2A8.5 8.5 0 1 1 21 12z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2z"/></svg></a>';
  document.body.appendChild(fab);
  const up = $('.up', fab);
  up.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  let lastY = 0, ticking = false;
  const onScroll = () => {
    const y = scrollY, h = document.documentElement;
    const max = h.scrollHeight - innerHeight;
    const p = max > 0 ? y / max : 0;
    mk.style.top = (p * 100) + '%';
    mkTxt.textContent = String(Math.round(p * 120)).padStart(3, '0') + ' m';
    up.classList.toggle('show', y > 600);
    if (header && !(nav && nav.classList.contains('open'))) header.classList.toggle('hide', y > lastY && y > 240);
    lastY = y;
    parallax();
    const hs = $('.hs'); if (hs) hsBar();
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- Paralaxe suave ---------- */
  const par = $$('[data-par]');
  function parallax() {
    if (reduce) return;
    par.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > innerHeight + 100) return;
      const c = (r.top + r.height / 2) - innerHeight / 2;
      el.style.transform = 'translate3d(0,' + (c * parseFloat(el.dataset.par)).toFixed(1) + 'px,0)';
    });
  }

  /* ---------- Entradas ao rolar ---------- */
  const targets = $$('.rv,.proc,.dimline,[data-in]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((t) => io.observe(t));
  } else targets.forEach((t) => t.classList.add('in'));
  const first = $('[data-load]'); if (first) requestAnimationFrame(() => first.classList.add('in'));

  /* ---------- Contadores ---------- */
  $$('[data-count]').forEach((el) => {
    const end = parseInt(el.dataset.count, 10);
    const set = (v) => { el.firstChild.nodeValue = String(v); };
    if (reduce) { set(end); return; }
    set(0);
    new IntersectionObserver((es, o) => {
      if (!es[0].isIntersecting) return; o.disconnect();
      const t0 = performance.now(), d = 1600;
      const step = (t) => {
        const k = Math.min((t - t0) / d, 1), e = 1 - Math.pow(1 - k, 4);
        set(Math.round(end * e)); if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 }).observe(el);
  });

  /* ---------- Hero: carrossel com cortina ---------- */
  const stage = $('[data-car]');
  if (stage) {
    const fs = $$('.fs', stage), th = $$('.th', stage);
    const D = 6000; let cur = 0, timer;
    stage.style.setProperty('--d', D / 1000 + 's');
    const go = (n) => {
      const old = cur; cur = (n + fs.length) % fs.length;
      fs.forEach((f, i) => { f.classList.remove('prev'); if (i === old && old !== cur) f.classList.add('prev'); f.classList.toggle('on', i === cur); });
      th.forEach((t, i) => { t.classList.remove('on'); void t.offsetWidth; t.classList.toggle('on', i === cur); });
      clearTimeout(timer);
      if (!reduce) timer = setTimeout(() => go(cur + 1), D);
    };
    th.forEach((t, i) => t.addEventListener('click', () => go(i)));
    stage.addEventListener('mouseenter', () => { stage.classList.add('hold'); clearTimeout(timer); });
    stage.addEventListener('mouseleave', () => { stage.classList.remove('hold'); go(cur); });
    let x0 = null;
    stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    stage.addEventListener('pointerup', (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); });
    go(0);
  }

  /* ---------- Índice de serviços: imagem que segue o rato ---------- */
  const idx = $('.idx');
  if (idx && fine) {
    const peek = document.createElement('div');
    peek.className = 'peek'; peek.setAttribute('aria-hidden', 'true');
    const rows = $$('a.row', idx);
    const imgs = rows.map((r) => { const i = new Image(); i.src = r.dataset.img; i.alt = ''; peek.appendChild(i); return i; });
    document.body.appendChild(peek);
    let tx = 0, ty = 0, x = 0, y = 0, run = false;
    const loop = () => {
      x += (tx - x) * 0.14; y += (ty - y) * 0.14;
      peek.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + ((tx - x) * 0.04) + 'deg)';
      if (run) requestAnimationFrame(loop);
    };
    rows.forEach((r, i) => {
      r.addEventListener('mouseenter', () => {
        imgs.forEach((im, k) => im.classList.toggle('on', k === i));
        peek.classList.add('on'); if (!run) { run = true; requestAnimationFrame(loop); }
      });
      r.addEventListener('mouseleave', () => { peek.classList.remove('on'); run = false; });
    });
    idx.addEventListener('mousemove', (e) => { tx = e.clientX + 40; ty = e.clientY - 150; });
  }

  /* ---------- Faixa horizontal de projectos ---------- */
  const hs = $('.hs');
  function hsBar() {
    const bar = $('.hs-bar i'); if (!bar || !hs) return;
    const max = hs.scrollWidth - hs.clientWidth;
    const p = max > 0 ? hs.scrollLeft / max : 0;
    const w = Math.max(14, (hs.clientWidth / hs.scrollWidth) * 100);
    bar.style.width = w + '%'; bar.style.marginLeft = (p * (100 - w)) + '%';
  }
  if (hs) {
    hs.addEventListener('scroll', hsBar, { passive: true }); hsBar();
    let down = false, sx = 0, sl = 0, moved = 0;
    hs.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = e.clientX; sl = hs.scrollLeft; });
    addEventListener('pointermove', (e) => {
      if (!down) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 5) { hs.classList.add('drag'); hs.scrollLeft = sl - dx; }
    });
    addEventListener('pointerup', () => { down = false; setTimeout(() => hs.classList.remove('drag'), 0); });
    hs.addEventListener('click', (e) => { if (moved > 5) { e.preventDefault(); moved = 0; } }, true);
    $$('[data-hs]').forEach((b) => b.addEventListener('click', () => hs.scrollBy({ left: parseInt(b.dataset.hs, 10) * 440, behavior: 'smooth' })));
  }

  /* ---------- Filtros ---------- */
  $$('[data-filter]').forEach((g) => {
    const target = $(g.dataset.filter);
    $$('.chip', g).forEach((c) => c.addEventListener('click', () => {
      $$('.chip', g).forEach((x) => x.classList.remove('on')); c.classList.add('on');
      const f = c.dataset.f;
      $$('[data-cat]', target).forEach((el) => el.classList.toggle('hidden', f !== 'all' && !el.dataset.cat.split(' ').includes(f)));
    }));
  });

  /* ---------- Acordeão de serviços (um aberto de cada vez) ---------- */
  $$('.acc details').forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) $$('.acc details').forEach((o) => { if (o !== d) o.open = false; });
  }));
  if (location.hash) { const t = $(location.hash); if (t && t.tagName === 'DETAILS') { t.open = true; } }

  /* ---------- Janela de detalhe do projecto ---------- */
  const modal = $('#modal');
  if (modal) {
    const q = (s) => $(s, modal);
    const close = () => modal.classList.remove('open');
    $$('.pc[data-title]').forEach((p) => {
      const open = (e) => {
        if (e) e.preventDefault();
        const im = q('figure img'); im.src = p.dataset.img; im.alt = p.dataset.title;
        q('.k').textContent = p.dataset.tag; q('h3').textContent = p.dataset.title;
        q('.desc').textContent = p.dataset.desc; q('.m-serv').textContent = p.dataset.tag;
        q('.m-local').textContent = p.dataset.local; q('.m-tipo').textContent = p.dataset.tipo;
        modal.classList.add('open'); q('.close').focus();
      };
      p.addEventListener('click', open);
      p.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(e); });
    });
    modal.addEventListener('click', (e) => { if (e.target === modal || e.target.classList.contains('close')) close(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* ---------- Formulário de contacto ---------- */
  const pick = $('#pick');
  if (pick) {
    const assunto = $('#assunto');
    $$('.chip', pick).forEach((c) => c.addEventListener('click', () => {
      c.classList.toggle('on');
      const s = $$('.chip.on', pick).map((x) => x.textContent);
      assunto.value = s.length ? 'Orçamento: ' + s.join(', ') : '';
    }));
  }
  const form = $('#contact-form');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const body = 'Nome: ' + d.get('nome') + '\nE-mail: ' + d.get('email') + '\nTelefone: ' + d.get('telefone') + '\n\n' + d.get('mensagem');
    location.href = 'mailto:geral@mmoliveira.ao?subject=' + encodeURIComponent(d.get('assunto') || 'Pedido de contacto') + '&body=' + encodeURIComponent(body);
    $('.note', form).textContent = 'A abrir o seu cliente de e-mail…';
  });
  $$('.news').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    location.href = 'mailto:geral@mmoliveira.ao?subject=Newsletter&body=' + encodeURIComponent('Inscrever o e-mail: ' + $('input', f).value);
  }));

  onScroll();
})();
