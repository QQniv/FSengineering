// ---------- UTIL
const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];

// ---------- COUNTER (single row, top-to-bottom)
(() => {
  const container = qs('#odo');
  if (!container) return;

  const DIGITS = 6;           // считаем в тысячах
  const BPS = 6000;           // 6 тыс/сек
  let count = 300000;         // старт в тысячах
  const perTick = 0.1;        // шаг 0.1 тыс = 100 бутылок
  let cellH = 0;
  let prev = Array(DIGITS).fill(0);

  const makeDigit = () => {
    const d = document.createElement('div');
    d.className = 'digit';
    const s = document.createElement('div');
    s.className = 'strip';
    for (let i=0;i<10;i++){
      const c = document.createElement('div');
      c.className='cell'; c.textContent=i;
      s.appendChild(c);
    }
    // дополнительный «0» для ровной прокрутки — остается скрытым благодаря overflow
    const extra = document.createElement('div');
    extra.className='cell'; extra.textContent='0';
    s.appendChild(extra);
    d.appendChild(s);
    return d;
  };

  const build = () => {
    container.innerHTML = '';
    for (let i=0;i<DIGITS;i++) container.appendChild(makeDigit());
  };

  const measure = () => {
    const probe = container.querySelector('.cell');
    if (!probe) return;
    cellH = Math.round(probe.getBoundingClientRect().height);
  };

  const setNumber = (n) => {
    const str = Math.max(0, Math.floor(n)).toString().padStart(DIGITS,'0');
    const strips = container.querySelectorAll('.strip');
    for (let i=0;i<DIGITS;i++){
      const cur = +str[i];
      if (cur !== prev[i]){
        const s = strips[i];
        s.parentElement.classList.add('anim');
        // прокрутка СВЕРХУ ВНИЗ
        const y = -cellH * cur;
        s.style.transform = `translate3d(0, ${y}px, 0)`;
      }
    }
    prev = str.split('').map(x=>+x);
  };

  build();
  // обновляем размеры после загрузки шрифтов
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(()=>{ measure(); setNumber(count); });
  } else { setTimeout(()=>{ measure(); setNumber(count); }, 50); }
  window.addEventListener('resize', ()=>{ measure(); setNumber(count); });

  // рендер
  let last = performance.now(), acc = 0;
  const loop = now => {
    const dt = (now - last)/1000; last = now;
    acc += (BPS/1000) * dt; // BPS (бут/сек) => тысяч/сек
    while (acc >= perTick){ acc -= perTick; count += perTick; setNumber(count); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();

// ---------- REVEAL
(() => {
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('on'); });
  }, {threshold: .2});
  qsa('.reveal').forEach(el=>io.observe(el));
})();

// ---------- BOTTLES BG (behind text)
(() => {
  const canvas = qs('#bottlesCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W,H, bottles=[];
  const COLORS = ['#dfeaff','#e7f0ff','#eaf2ff'];

  const resize = () => { W = canvas.width = canvas.clientWidth; H = canvas.height = canvas.clientHeight; };
  const rand = (a,b)=>a+Math.random()*(b-a);

  const spawn = (x) => {
    bottles.push({
      x: x ?? rand(0,W),
      y: -40,
      w: rand(60,110),
      h: rand(16,26),
      a: rand(-.5,.5),
      s: rand(40,80),        // скорость падения
      r: rand(-.5,.5),       // скорость вращения
      c: COLORS[(Math.random()*COLORS.length)|0],
      life: 1
    });
  };

  const step = (dt) => {
    ctx.clearRect(0,0,W,H);
    // ограничение количества, пока фон «заполнится»
    if (bottles.length < 40) spawn();
    bottles.forEach(b=>{
      b.y += b.s*dt;
      b.a += b.r*dt;
      if (b.y > H+60) b.life = 0;
      ctx.save();
      ctx.translate(b.x,b.y); ctx.rotate(b.a);
      ctx.fillStyle = b.c;
      ctx.globalAlpha = .55;
      ctx.fillRect(-b.w/2,-b.h/2,b.w,b.h);
      ctx.restore();
    });
    bottles = bottles.filter(b=>b.life>0);
  };

  const loop = t=>{
    const now = performance.now();
    if(!loop.p) loop.p=now;
    const dt = (now-loop.p)/1000; loop.p=now;
    step(dt);
    requestAnimationFrame(loop);
  };

  const io = new IntersectionObserver((e)=>{
    if(e[0].isIntersecting){ resize(); requestAnimationFrame(loop); }
  },{threshold:.1});
  io.observe(canvas);
  window.addEventListener('resize',resize);
  resize();
})();

// ---------- PIPE stages switching
(() => {
  qsa('.how .stage').forEach(btn=>{
    btn.addEventListener('click',()=>{
      qsa('.stage-card').forEach(c=>c.classList.remove('show'));
      const id = btn.getAttribute('data-target');
      const card = qs(id);
      if (card) card.classList.add('show');
    });
  });
})();

// ---------- BUBBLES on Services
(() => {
  const canvas = qs('#bubblesCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W,H, arr=[];
  const resize = ()=>{ W=canvas.width=canvas.clientWidth; H=canvas.height=canvas.clientHeight; };
  const spawn = ()=>arr.push({x:Math.random()*W,y:H+20,r:4+Math.random()*10,s:.6+Math.random()*1.4,a:Math.random()*Math.PI});
  for(let i=0;i<40;i++) spawn();
  const loop=()=>{
    ctx.clearRect(0,0,W,H);
    arr.forEach(b=>{
      b.y -= b.s; b.x += Math.sin(b.a+=.02)*.3;
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
      ctx.fillStyle='rgba(100,160,255,.20)'; ctx.fill();
      if(b.y < -20){ b.y=H+20; b.x=Math.random()*W; }
    });
    requestAnimationFrame(loop);
  };
  resize(); loop();
  window.addEventListener('resize',resize);
})();
