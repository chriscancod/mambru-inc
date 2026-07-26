// MAMBRU INC — shared site behavior: custom cursor, glass nav that hides on
// scroll-down / reveals on scroll-up, magnetic CTAs, and the waitlist form
// submit handler shared by every page that embeds a .waitlist form.

const CONFIG = {
  // Same backend already running Mambru Inc's other storefronts — the
  // drop-signup endpoint just inserts an email into a brand-agnostic
  // Postgres table, no payment/cart coupling, so it's safe to reuse here.
  BACKEND_URL: 'https://cungus-production.up.railway.app',
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
(function(){
  const nav=document.getElementById('nav');
  if(!nav) return;
  let lastY=window.scrollY, ticking=false;
  window.addEventListener('scroll',()=>{
    if(ticking) return;
    ticking=true;
    requestAnimationFrame(()=>{
      const y=window.scrollY;
      nav.classList.toggle('scrolled',y>10);
      if(y>lastY && y>140){ nav.classList.add('nav-hide'); }
      else{ nav.classList.remove('nav-hide'); }
      lastY=y;
      ticking=false;
    });
  },{passive:true});
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
