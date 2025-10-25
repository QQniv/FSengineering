const qs=s=>document.querySelector(s), qsa=s=>[...document.querySelectorAll(s)];

/* ===== COUNTER (6 цифр, сверху-вниз, плавно) ===== */
(() => {
  const box = qs('#odo'); if (!box) return;
  const DIGITS = 6, BPS = 6000;       // 6 тыс/сек = реальные данные
  let count = 300000, cellH = 0, prev = Array(DIGITS).fill(0);

  const makeDigit = () => {
    const d = document.createElement('div'); d.className='digit';
    const s = document.createElement('div'); s.className='strip';
    for(let i=0;i<10;i++){ const c=document.createElement('div'); c.className='cell'; c.textContent=i; s.appendChild(c); }
    const extra=document.createElement('div'); extra.className='cell'; extra.textContent='0'; s.appendChild(extra);
    d.appendChild(s); return d;
  };
  box.innerHTML=''; for(let i=0;i<DIGITS;i++) box.appendChild(makeDigit());

  const measure = () => { const c=box.querySelector('.cell'); if(!c) return; cellH=Math.round(c.getBoundingClientRect().height); };
  const setNumber = (n) => {
    const str = Math.max(0,Math.floor(n)).toString().padStart(DIGITS,'0');
    const strips = box.querySelectorAll('.strip');
    for(let i=0;i<DIGITS;i++){
      const cur=+str[i]; if(cur!==prev[i]){
        const s=strips[i]; s.parentElement.classList.add('anim');
        s.style.transform=`translate3d(0, ${-cellH*cur}px, 0)`; // сверху-вниз
      }
    }
    prev = str.split('').map(x=>+x);
  };

  (document.fonts?.ready||Promise.resolve()).then(()=>{ measure(); setNumber(count); });
  addEventListener('resize',()=>{ measure(); setNumber(count); });

  let last=performance.now(), acc=0, step=0.1; // 0.1 тыс = 100 шт
  const loop=now=>{
    const dt=(now-last)/1000; last=now;
    acc += (BPS/1000)*dt;
    while(acc>=step){ acc-=step; count+=step; setNumber(count); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();

/* ===== REVEAL ===== */
(() => {
  const io=new IntersectionObserver((es)=>es.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('on'); }),{threshold:.2});
  qsa('.reveal').forEach(el=>io.observe(el));
})();

/* ===== FALLING BOTTLES (behind text) ===== */
(() => {
  const cvs=qs('#bottlesCanvas'); if(!cvs) return; const ctx=cvs.getContext('2d');
  let W,H,items=[];
  const COLORS=['#e7f0ff','#eaf3ff','#dfeaff'];
  const resize=()=>{ W=cvs.width=cvs.clientWidth; H=cvs.height=cvs.clientHeight; };
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const spawn=()=>items.push({x:rnd(0,W),y:-40,w:rnd(60,110),h:rnd(16,26),a:rnd(-.5,.5),vy:rnd(40,80),vr:rnd(-.5,.5),c:COLORS[(Math.random()*COLORS.length)|0]});
  const step=(dt)=>{ ctx.clearRect(0,0,W,H); if(items.length<50) spawn();
    items.forEach(b=>{ b.y+=b.vy*dt; b.a+=b.vr*dt; if(b.y>H+60) b.y=-40;
      ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(b.a); ctx.globalAlpha=.55; ctx.fillStyle=b.c; ctx.fillRect(-b.w/2,-b.h/2,b.w,b.h); ctx.restore();
    });
  };
  const loop=()=>{ const t=performance.now(); if(!loop.p) loop.p=t; const dt=(t-loop.p)/1000; loop.p=t; step(dt); requestAnimationFrame(loop); };
  const io=new IntersectionObserver(e=>{ if(e[0].isIntersecting){ resize(); requestAnimationFrame(loop);} },{threshold:.1});
  io.observe(cvs); addEventListener('resize',resize); resize();
})();

/* ===== BUBBLES under "Что делает FS" ===== */
(() => {
  const cvs=qs('#bubblesTeaser'); if(!cvs) return; const ctx=cvs.getContext('2d');
  let W,H,arr=[];
  const resize=()=>{ W=cvs.width=cvs.clientWidth; H=cvs.height=cvs.clientHeight; arr = Array.from({length:40},()=>({x:Math.random()*W,y:Math.random()*H,r:4+Math.random()*10,s:.6+Math.random()*1.4,a:Math.random()*Math.PI})); };
  const loop=()=>{ ctx.clearRect(0,0,W,H);
    arr.forEach(b=>{ b.y-=b.s; b.x+=Math.sin(b.a+=.02)*.3; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fillStyle='rgba(100,160,255,.18)'; ctx.fill(); if(b.y<-20){ b.y=H+20; b.x=Math.random()*W; }});
    requestAnimationFrame(loop);
  };
  resize(); loop(); addEventListener('resize',resize);
})();

/* ===== PIPE stages switching ===== */
(() => {
  qsa('.how .stage').forEach(b=>b.addEventListener('click',()=>{
    qsa('.stage-card').forEach(c=>c.classList.remove('show'));
    qs(b.dataset.target)?.classList.add('show');
  }));
})();
