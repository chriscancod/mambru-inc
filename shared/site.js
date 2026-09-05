// MAMBRU INC — shared site behavior: custom cursor, glass nav that hides on
// scroll-down / reveals on scroll-up, magnetic CTAs, and the waitlist form
// submit handler shared by every page that embeds a .waitlist form.
// Last edited: 2026-09-04 08:35 AM EDT (BACKEND_URL comment corrected — see find-and-fix-5
// roadmap entry)

const CONFIG = {
  // BOTTLENECK FIX (2026-08-29): this used to point at cungus's shared
  // backend — meaning Mambru Inc's only working conversion path (the
  // waitlist) went down any time cungus's backend did, for reasons that had
  // nothing to do with Mambru Inc. Chris's call: keep the waitlist (no
  // checkout until there's a real prototype) but give it its own backend —
  // see /veynor-backend/README.md in the project root for what that is and
  // how to deploy it.
  //
  // No longer a placeholder — this is the real, deployed veynor-backend service (confirmed
  // live via its health check on 2026-09-04). It was live but still broken until this same
  // round: POST /api/drop-signup was 500ing on the deployed service because its one table was
  // never actually created (see veynor-backend/server.js's ensureSchema() fix, 2026-09-04) —
  // fixed there, not here; this URL itself was already correct. Same request/response shape as
  // before (POST /api/drop-signup, {email} in, {success} out) so nothing else in this file
  // needs to change once that backend redeploys.
  BACKEND_URL: 'https://veynor-backend-production.up.railway.app',
};

// ── CURSOR ──────────────────────────────────────────────────────────────
(function(){
  const cur=document.getElementById('cur'),crn=document.getElementById('curRing');
  if(!cur||!crn)return;
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;});
  (function tick(){
    cur.style.left=mx+'px';cur.style.top=my+'px';
    rx+=(mx-rx)*.1;ry+=(my-ry)*.1;
    crn.style.left=rx+'px';crn.style.top=ry+'px';
    requestAnimationFrame(tick);
  })();
  function bindCur(){
    document.querySelectorAll('a,button,input,textarea,select').forEach(el=>{
      el.addEventListener('mouseenter',()=>{cur.style.width='20px';cur.style.height='20px';crn.style.width='0';crn.style.height='0';});
      el.addEventListener('mouseleave',()=>{cur.style.width='6px';cur.style.height='6px';crn.style.width='28px';crn.style.height='28px';});
    });
  }
  window.bindCur=bindCur;
  bindCur();
})();

// ── NAV — glass background + hide on scroll-down, reveal on scroll-up ───
// Also drives the thin scroll-progress bar in the same rAF tick, since both
// need the current scroll position and there's no reason to pay for two
// scroll listeners.
(function(){
  const nav=document.getElementById('nav');
  const progress=document.getElementById('scrollProgress');
  if(!nav && !progress) return;
  let lastY=window.scrollY, ticking=false;
  function update(){
    const y=window.scrollY;
    if(nav){
      nav.classList.toggle('scrolled',y>10);
      if(y>lastY && y>140){ nav.classList.add('nav-hide'); }
      else{ nav.classList.remove('nav-hide'); }
    }
    if(progress){
      const max=document.documentElement.scrollHeight-window.innerHeight;
      const pct=max>0?(y/max)*100:0;
      progress.style.width=pct+'%';
    }
    lastY=y;
    ticking=false;
  }
  window.addEventListener('scroll',()=>{
    if(ticking) return;
    ticking=true;
    requestAnimationFrame(update);
  },{passive:true});
  update();
})();

// ── MAGNETIC BUTTONS ─────────────────────────────────────────────────────
(function(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if(window.matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('[data-magnetic]').forEach(wrap=>{
    const btn=wrap.querySelector('button, a');
    if(!btn) return;
    const strength=0.35;
    wrap.addEventListener('mousemove',e=>{
      const r=wrap.getBoundingClientRect();
      const x=e.clientX-(r.left+r.width/2);
      const y=e.clientY-(r.top+r.height/2);
      btn.style.transform=`translate(${x*strength}px, ${y*strength}px)`;
    });
    wrap.addEventListener('mouseleave',()=>{
      btn.style.transition='transform .5s cubic-bezier(.16,1,.3,1)';
      btn.style.transform='translate(0,0)';
      setTimeout(()=>{btn.style.transition='';},500);
    });
  });
})();

// ── WAITLIST FORM ────────────────────────────────────────────────────────
// Any <form class="waitlist" data-waitlist> with an <input type=email> and
// a submit button wires up automatically — used on the home page and the
// Veynor Solis page alike.
async function submitWaitlist(e){
  e.preventDefault();
  const form=e.target;
  const input=form.querySelector('input[type=email]');
  const status=form.parentElement.querySelector('.waitlist-status');
  const btn=form.querySelector('button');
  const email=input.value.trim();
  if(!email.includes('@')){
    if(status){status.textContent='Enter a valid email';status.className='waitlist-status err';}
    return false;
  }
  btn.disabled=true;
  try{
    const r=await fetch(`${CONFIG.BACKEND_URL}/api/drop-signup`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email}),
    });
    const d=await r.json();
    if(!d.success) throw new Error(d.error||'Could not join the waitlist');
    if(status){status.textContent="You're on the list ✦";status.className='waitlist-status ok';}
    input.value='';
  }catch(err){
    if(status){status.textContent=err.message;status.className='waitlist-status err';}
  }
  btn.disabled=false;
  return false;
}
document.addEventListener('submit',(e)=>{
  if(e.target.matches('[data-waitlist]')) submitWaitlist(e);
});

document.addEventListener('DOMContentLoaded',()=>{
  const yearEl=document.getElementById('fyear');
  if(yearEl) yearEl.textContent=new Date().getFullYear();
});

// ── HERO PARTICLES ───────────────────────────────────────────────────────
// Lightweight drifting embers behind the hero — CSS-driven, no canvas.
(function(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.hero-particles').forEach(container=>{
    const COLORS=['#e2263a','#f5f3f0'];
    const COUNT=22;
    for(let i=0;i<COUNT;i++){
      const p=document.createElement('div');
      p.className='hp';
      const size=1.5+Math.random()*2.5;
      p.style.width=size+'px';
      p.style.height=size+'px';
      p.style.left=Math.random()*100+'%';
      p.style.top=40+Math.random()*55+'%';
      p.style.background=COLORS[i%2];
      p.style.animationDuration=(6+Math.random()*8)+'s';
      p.style.animationDelay=(Math.random()*8)+'s';
      container.appendChild(p);
    }
  });
})();

// ── FAQ ACCORDION ─────────────────────────────────────────────────────────
// Screen readers had no idea these were expandable — the .open class drove
// the CSS reveal but nothing ever touched aria-expanded, so a closed answer
// and an open one looked identical to assistive tech. Now the button that
// gets clicked (and every button this closes) has its aria-expanded kept in
// sync with the actual open/closed state.
document.addEventListener('click',(e)=>{
  const q=e.target.closest('.faq-q');
  if(!q) return;
  const item=q.closest('.faq-item');
  const wasOpen=item.classList.contains('open');
  item.parentElement.querySelectorAll('.faq-item.open').forEach(i=>{
    if(i!==item){
      i.classList.remove('open');
      const otherQ=i.querySelector('.faq-q');
      if(otherQ) otherQ.setAttribute('aria-expanded','false');
    }
  });
  item.classList.toggle('open',!wasOpen);
  q.setAttribute('aria-expanded',String(!wasOpen));
});

// ── LIVE BATTERY / TEG WIDGET ─────────────────────────────────────────────
// Ties the marketing page to the real Thermal screen in the launcher: reads
// the visitor's own device battery where the Battery Status API is
// available, and derives a simulated "TEG trickle" number from it. Falls
// back to a clearly-labeled demo state where the API doesn't exist (most
// desktop/iOS browsers dropped it for fingerprinting reasons).
(function(){
  const widget=document.querySelector('[data-battery-widget]');
  if(!widget) return;
  const levelEl=widget.querySelector('[data-bw-level]');
  const stateEl=widget.querySelector('[data-bw-state]');
  const trickleEl=widget.querySelector('[data-bw-trickle]');
  const barEl=widget.querySelector('[data-bw-bar]');
  const noteEl=widget.querySelector('[data-bw-note]');
  const liveEl=widget.querySelector('[data-bw-live]');

  function render(level,charging,isLive){
    const pct=Math.round(level*100);
    if(levelEl) levelEl.textContent=pct+'%';
    if(stateEl) stateEl.textContent=charging?'Charging':'On battery';
    if(barEl) barEl.style.width=pct+'%';
    const trickle=(charging?2.4:0.3)+(Math.sin(Date.now()/4000)*0.3);
    if(trickleEl) trickleEl.textContent=(trickle>=0?'+':'')+trickle.toFixed(1)+'%/hr';
    if(liveEl) liveEl.style.display=isLive?'flex':'none';
    if(noteEl) noteEl.textContent=isLive
      ? "That's your actual device battery, read live — the same reading Veynor Solis's Thermal screen shows, next to a simulated solar/TEG trickle number."
      : 'Your browser doesn’t expose live battery data (most desktop and iOS browsers dropped that API) — this is a demo of what the Thermal screen looks like on Veynor Solis itself.';
  }

  if('getBattery' in navigator){
    navigator.getBattery().then(battery=>{
      render(battery.level,battery.charging,true);
      battery.addEventListener('levelchange',()=>render(battery.level,battery.charging,true));
      battery.addEventListener('chargingchange',()=>render(battery.level,battery.charging,true));
    }).catch(()=>render(0.87,false,false));
  }else{
    render(0.87,false,false);
  }
})();

// ── EASTER EGG ────────────────────────────────────────────────────────────
// Click the nav logo 5 times to trigger a brief "energy surge" flash —
// a small reward for people who poke around.
(function(){
  const logo=document.querySelector('.nav-logo');
  if(!logo) return;
  let clicks=0, timer=null;
  logo.addEventListener('click',(e)=>{
    clicks++;
    clearTimeout(timer);
    timer=setTimeout(()=>{clicks=0;},1200);
    if(clicks>=5){
      e.preventDefault();
      clicks=0;
      const surge=document.createElement('div');
      surge.className='energy-surge fire';
      document.body.appendChild(surge);
      surge.addEventListener('animationend',()=>surge.remove());
      const toast=document.createElement('div');
      toast.className='energy-toast';
      toast.textContent='⚡ TEG overload — thermal reclaim maxed';
      document.body.appendChild(toast);
      requestAnimationFrame(()=>toast.classList.add('show'));
      setTimeout(()=>{toast.classList.remove('show');setTimeout(()=>toast.remove(),400);},2200);
    }
  });
})();
