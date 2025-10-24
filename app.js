// Sticky header
const header = document.getElementById('topbar');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
});

// Counter
(function(){
  const BPS = 6000;
  const DIGITS = 6;
  const odo = document.getElementById('odo');

  function makeDigit(){
    const d = document.createElement('div'); d.className='digit';
    const s = document.createElement('div'); s.className='strip';
    for(let k=0;k<10;k++){
      const c = document.createElement('div'); c.className='cell';
      c.textContent=k; s.appendChild(c);
    }
    const e = document.createElement('div'); e.className='cell'; e.textContent='0';
    s.appendChild(e); d.appendChild(s); return d;
  }

  function build(){ odo.innerHTML=''; for(let i=0;i<DIGITS;i++) odo.appendChild(makeDigit()); }
  build();

  let cellH=0;
  function measure(){ const s=odo.querySelector('.cell'); if(s){ cellH=Math.round(s.getBoundingClientRect().height);} }
  measure(); addEventListener('resize',()=>{ measure(); setNumber(count); });

  let count=300000, prev=new Array(DIGITS).fill(0);
  function setNumber(n){
    const str = Math.max(0,Math.floor(n)).toString().padStart(DIGITS,'0');
    const strips = odo.querySelectorAll('.digit .strip');
    for(let i=0;i<DIGITS;i++){
      const st=strips[i]; const cur=+str[i];
      if(cur!==prev[i]){
        st.parentElement.classList.add('anim');
        st.style.transform='translate3d(0,'+(-cellH*cur)+'px,0)';
      }
    }
    prev=str.split('').map(Number);
  }

  setNumber(count);
  let acc=0,last=performance.now();
  function loop(now){
    const dt=(now-last)/1000; last=now;
    acc+=(BPS*dt)/1000;
    while(acc>=0.1){ acc-=0.1; count+=0.1; setNumber(count); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

// Reveal animation
const reveals=document.querySelectorAll('.reveal');
const io=new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible'); });
},{threshold:.2});
reveals.forEach(el=>io.observe(el));

// Canvas scene
(function(){
  const cvs=document.getElementById('scene');
  if(!cvs) return;
  const ctx=cvs.getContext('2d');
  let dpr=Math.max(1,window.devicePixelRatio||1);

  function resize(){
    const r=cvs.getBoundingClientRect();
    cvs.width=Math.max(2,Math.floor(r.width*dpr));
    cvs.height=Math.max(2,Math.floor(r.height*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();
  addEventListener('resize',resize);

  const man=new Image();
  man.src='./assets/silhouette.jpg'; // заменишь своим

  let playing=false,startT=0;
  function draw(t){
    const w=cvs.clientWidth||cvs.width/dpr;
    const h=cvs.clientHeight||cvs.height/dpr;
    ctx.clearRect(0,0,w,h);
    const T=8;
    const tt=Math.min((t-startT)/1000,T);
    const xEnter=-0.2*w,xExit=1.2*w;
    let x;
    if(tt<2){x=xEnter+(xExit-xEnter)*0.35*(tt/2);}
    else if(tt<5){x=xEnter+(xExit-xEnter)*0.35;}
    else{x=xEnter+(xExit-xEnter)*(0.35+0.65*((tt-5)/3));}
    const manH=Math.min(h*0.7,520);
    const manW=manH*0.35;
    const yBase=h*0.95;
    const yMan=yBase-manH;

    // бутылка
    let bx=x+manW*0.55,by;
    if(tt<2.2){by=yMan+manH*0.7;}
    else if(tt<3.4){const k=(tt-2.2)/1.2;by=yMan+manH*(0.7-0.35*k);bx=x+manW*(0.55-0.1*k);}
    else if(tt<4.2){by=yMan+manH*0.35;bx=x+manW*0.45;}
    else if(tt<5){const k=(tt-4.2)/0.8;const g=1400;const vy0=-60;const fall=vy0*k+0.5*g*k*k;by=yMan+manH*0.35+fall/100;bx=x+manW*(0.45+0.05*k);if(by>yBase-14)by=yBase-14;}
    else{by=yBase-14;}

    // пол
    const grd=ctx.createRadialGradient(x+manW*0.5,yBase-6,4,x+manW*0.5,yBase-6,120);
    grd.addColorStop(0,'rgba(0,0,0,.16)');
    grd.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=grd;
    ctx.beginPath();
    ctx.ellipse(x+manW*0.5,yBase-6,90,12,0,0,Math.PI*2);
    ctx.fill();

    if(man.complete&&man.naturalWidth){ctx.drawImage(man,x,yMan,manW,manH);}
    else{ctx.fillStyle='#0a1f33';ctx.fillRect(x,yMan,manW,manH);}

    // бутылка
    ctx.save();
    ctx.translate(bx,by);
    ctx.rotate(-0.15);
    ctx.fillStyle='#2b8cff';
    ctx.strokeStyle='#1a58cc';
    ctx.lineWidth=1.5;
    const bw=26,bh=64;
    ctx.beginPath();
    ctx.moveTo(-bw/2+10,-bh/2);
    ctx.lineTo(bw/2-10,-bh/2);
    ctx.quadraticCurveTo(bw/2,-bh/2,bw/2,-bh/2+10);
    ctx.lineTo(bw/2,bh/2-10);
    ctx.quadraticCurveTo(bw/2,bh/2,bw/2-10,bh/2);
    ctx.lineTo(-bw/2+10,bh/2);
    ctx.quadraticCurveTo(-bw/2,bh/2,-bw/2,bh/2-10);
    ctx.lineTo(-bw/2,-bh/2+10);
    ctx.quadraticCurveTo(-bw/2,-bh/2,-bw/2+10,-bh/2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle='#1047a8';
    ctx.fillRect(-8,-bh/2-8,16,10);
    ctx.restore();

    if(tt<T&&playing)requestAnimationFrame(draw);
  }
  function start(){if(playing)return;playing=true;startT=performance.now();requestAnimationFrame(draw);}
  function stop(){playing=false;}
  const sec=document.querySelector('.why');
  const io2=new IntersectionObserver((ents)=>{ents.forEach(e=>{e.isIntersecting?start():stop();})},{threshold:.35});
  io2.observe(sec);
})();
