/* FS — app.js (общий) */

/* --------- базовые настройки --------- */
(function boot(){
  const root = document.documentElement;
  root.classList.remove('no-js'); root.classList.add('js');

  // аккуратный возврат к началу только при первой загрузке
  try{
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (!location.hash) addEventListener('pageshow', () => scrollTo({top:0, left:0}));
  }catch(_){}
})();

/* --------- хелперы --------- */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const prefersReduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------- header: тень/сжатие при скролле --------- */
(function headerFX(){
  const header = document.querySelector('.topbar');
  if (!header) return;
  const update = () => {
    const sc = scrollY || document.documentElement.scrollTop || 0;
    header.classList.toggle('is-scrolled', sc > 6);
  };
  addEventListener('scroll', update, {passive:true});
  addEventListener('load', update);
  update();
})();

/* --------- плавный скролл по якорям --------- */
(function smoothAnchors(){
  const samePage = (a)=> a.origin === location.origin && a.pathname === location.pathname && a.hash;
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a[href^="#"], a[href*="#"]');
    if (!a || !samePage(new URL(a.href))) return;
    const id = decodeURIComponent(a.hash.slice(1));
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const y = el.getBoundingClientRect().top + scrollY;
    // учтём фиксированную шапку
    const header = document.querySelector('.topbar');
    const offset = header ? header.offsetHeight + 8 : 0;
    scrollTo({ top: Math.max(0, y - offset), behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`);
  });
})();

/* --------- reveal (IntersectionObserver) --------- */
(function reveal(){
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver((entries)=>{
    for (const e of entries){
      if (e.isIntersecting){
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    }
  }, { threshold: .25 });
  els.forEach(el => io.observe(el));
})();

/* --------- параллакс через CSS-переменную --pY --------- */
(function parallax(){
  if (prefersReduce()) return;
  const els = [...document.querySelectorAll('[data-parallax]')];
  if (!els.length) return;

  let ticking = false, H = innerHeight;
  const strength = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--parallax-strength')) || 0;

  const apply = () => {
    const k = strength();
    for (const el of els){
      const sp = parseFloat(el.dataset.parallax || '0');
      if (!sp || !k){ el.style.setProperty('--pY', '0px'); continue; }
      const r = el.getBoundingClientRect();
      const raw = (r.top - H * 0.5) * sp * k;
      el.style.setProperty('--pY', `${clamp(raw, -14, 14)}px`);
    }
    ticking = false;
  };

  const onScroll = () => { if (!ticking){ ticking = true; requestAnimationFrame(apply); } };
  addEventListener('scroll', onScroll, {passive:true});
  addEventListener('resize', ()=>{ H = innerHeight; onScroll(); }, {passive:true});
  apply();
})();

/* --------- локальная навигация (services.html) --------- */
(function localNav(){
  const links = [...document.querySelectorAll('.lnav a')];
  if (!links.length) return;

  const pairs = links
    .map(a => [a, document.querySelector(a.getAttribute('href'))])
    .filter(([, el]) => !!el);

  const io = new IntersectionObserver((entries)=>{
    const vis = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!vis) return;
    const id = '#' + vis.target.id;
    links.forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === id ? 'true' : 'false'));
  }, { rootMargin: '-40% 0px -50% 0px', threshold: [0, .25, .5, .75, 1] });

  pairs.forEach(([, el]) => io.observe(el));
})();

/* --------- авто-обновление mailto в форме (contacts.html) --------- */
(function contactMailto(){
  const form = document.getElementById('contactForm');
  const mailto = document.getElementById('mailtoLink');
  if (!form || !mailto) return;

  const build = () => {
    const fd = new FormData(form);
    const role = (fd.get('role') || '').toString();
    const name = (fd.get('name') || '').toString().trim();
    const email= (fd.get('email')|| '').toString().trim();
    const phone= (fd.get('phone')|| '').toString().trim();
    const msg  = (fd.get('message')||'').toString().trim();

    const subject = encodeURIComponent('FS — заявка с сайта');
    const body = encodeURIComponent(
`Кто: ${role}
Имя: ${name}
Email: ${email}
Телефон: ${phone}

Сообщение:
${msg}

(Файл прикрепите в письме вашего почтового клиента, если требуется)`);
    mailto.href = `mailto:xxxxxxx@xxx.com?subject=${subject}&body=${body}`;
  };

  form.addEventListener('input', build);
  build();
})();

/* --------- success-сообщение формы (contacts.html) --------- */
(function contactSubmit(){
  const form = document.getElementById('contactForm');
  const success = document.getElementById('success');
  if (!form || !success) return;

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    // мини-валидация
    const need = ['name','email','message','consent'];
    for (const n of need){
      const el = n === 'consent' ? document.getElementById('consent') : form.querySelector(`[name="${n}"]`);
      if (!el) continue;
      if ((el.type === 'checkbox' && !el.checked) || (el.type !== 'checkbox' && !el.value.trim())){
        el.scrollIntoView({behavior:'smooth', block:'center'});
        el.focus();
        el.style.outline = '2px solid #ef4444';
        setTimeout(()=> el.style.outline = '', 1200);
        return;
      }
    }
    success.style.display = 'block';
  });
})();
