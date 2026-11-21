/* Motion & interaction pass (prototype). Works on the live DOM without changing app.js.
   Every behaviour checks html.mo at event time, so the Before/After switch is instant. */
(function(){
const H=document.documentElement, on=()=>H.classList.contains("mo");
const calm=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE="cubic-bezier(.32,.72,0,1)";

/* Before / After switch */
const ba=document.createElement("div"); ba.className="mo-ba"; ba.setAttribute("role","group"); ba.setAttribute("aria-label","Compare");
ba.innerHTML='<button data-v="before">Before</button><button data-v="after">After</button>';
const paint=()=>ba.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String((b.dataset.v==="after")===on())));
ba.onclick=e=>{const b=e.target.closest("button"); if(!b)return; H.classList.toggle("mo",b.dataset.v==="after");
  try{localStorage.setItem("st-motion-proto",b.dataset.v)}catch(_){}; paint(); prepGalleries();};
document.body.appendChild(ba); paint();

/* 3. staggered entrance: index the first cards, play once, then drop the class */
function enter(){ const cards=[...document.querySelectorAll(".st-wrap > div > .card")]; if(!cards.length) return false;
  cards.forEach((c,i)=>c.style.setProperty("--mo-i",Math.min(i,6))); if(on()&&!calm()){H.classList.add("mo-enter"); setTimeout(()=>H.classList.remove("mo-enter"),1400);} return true; }

/* photo swipe in opened cards (phones): one photo per swipe, snap, dots */
function prepGalleries(){
  document.querySelectorAll(".gallery").forEach(g=>{
    const want=on()&&innerWidth<=430&&g.children.length>1;
    g.classList.toggle("mo-swipe",want);
    let dots=g.nextElementSibling&&g.nextElementSibling.classList.contains("mo-dots")?g.nextElementSibling:null;
    if(want&&!dots){dots=document.createElement("div");dots.className="mo-dots";dots.setAttribute("aria-hidden","true");dots.innerHTML=[...g.children].map((_,i)=>`<i class="${i?"":"on"}"></i>`).join("");g.after(dots);
      g.addEventListener("scroll",()=>{const i=Math.round(g.scrollLeft/Math.max(1,g.clientWidth));dots.querySelectorAll("i").forEach((d,j)=>d.classList.toggle("on",i===j))},{passive:true});
      g.addEventListener("touchstart",e=>{if(g.classList.contains("mo-swipe"))e.stopPropagation()},{passive:true}); // the photo swipe wins over the page swipe
    }
    if(dots) dots.style.display=want?"":"none";
  });
}

/* 6. countdown: roll only the digits that changed */
let busy=false; const last=new WeakMap();
function roll(el){ if(busy||!on()||calm()) return; const txt=el.textContent; if(!/\d/.test(txt)) return;
  const prev=last.get(el)||""; last.set(el,txt); if(el.querySelector(".mo-d")&&prev===txt) return;
  busy=true; el.textContent=""; [...txt].forEach((ch,i)=>{const s=document.createElement("span");s.className="mo-d"+(prev&&prev[i]!==ch&&/\d/.test(ch)?" roll":"");s.textContent=ch;el.appendChild(s)}); busy=false; }

/* 5. lightbox grows out of the tapped photo */
let from=null;
document.addEventListener("click",e=>{const p=e.target.closest(".photo.has-img, .xm-grid img, .box-photo"); if(!p){return} const r=(p.querySelector("img")||p).getBoundingClientRect(); from=r;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{const img=document.querySelector(".lightbox.show img"); if(!img||!from||!on()||calm()) return; const t=img.getBoundingClientRect(); if(!t.width) return;
    const s=from.width/t.width, x=(from.left+from.width/2)-(t.left+t.width/2), y=(from.top+from.height/2)-(t.top+t.height/2);
    img.animate([{transform:`translate(${x}px,${y}px) scale(${s})`,borderRadius:"18px"},{transform:"none"}],{duration:480,easing:EASE}); from=null;}));
},true);

/* pull to refresh (Page 1 only, at the very top, vertical pulls only) */
const ptr=document.createElement("div"); ptr.className="mo-ptr"; ptr.setAttribute("aria-hidden","true");
ptr.innerHTML='<svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 2v9M3 7l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Pull to check for updates</span>';
document.body.appendChild(ptr);
const iosTab=/iP(hone|ad|od)/.test(navigator.userAgent)&&!navigator.standalone; // Safari tabs already have their own pull-to-refresh
let pg=null;
addEventListener("touchstart",e=>{ if(iosTab||!on()||scrollY>0||e.touches.length!==1||document.querySelector(".hdr-feed, .about.show, .lightbox.show")) {pg=null;return}
  pg={y:e.touches[0].clientY,x:e.touches[0].clientX,d:0}; },{passive:true});
addEventListener("touchmove",e=>{ if(!pg) return; const t=e.touches[0], dy=t.clientY-pg.y, dx=t.clientX-pg.x;
  if(dy<=0||Math.abs(dx)>dy){ if(Math.abs(dx)>12){pg=null; ptr.style.opacity=0;} return; }
  pg.d=Math.min(110,dy*.55); const ready=pg.d>64;
  ptr.style.transition="none"; ptr.style.transform=`translate(-50%, ${pg.d-60}px)`; ptr.style.opacity=Math.min(1,pg.d/50);
  ptr.classList.toggle("ready",ready); ptr.querySelector("span").textContent=ready?"Release to check":"Pull to check for updates"; },{passive:true});
addEventListener("touchend",()=>{ if(!pg) return; const go=pg.d>64; pg=null; ptr.style.transition=`transform .45s ${EASE}, opacity .3s`;
  if(go){ ptr.classList.remove("ready"); ptr.classList.add("spin"); ptr.querySelector("span").textContent="Checking…"; ptr.style.transform="translate(-50%, 8px)";
    setTimeout(()=>location.reload(),700); }
  else { ptr.style.transform="translate(-50%,-60px)"; ptr.style.opacity=0; } });

/* watch the app render */
const mo=new MutationObserver(ms=>{ if(busy) return; let gal=false;
  for(const m of ms){ const el=m.target.nodeType===3?m.target.parentElement:m.target;
    const cd=el&&el.closest&&el.closest(".cd-val"); if(cd) roll(cd);
    if(m.addedNodes.length) gal=true; }
  if(gal) prepGalleries(); });
const boot=setInterval(()=>{ if(document.querySelector(".st-wrap .card")){ clearInterval(boot); enter(); prepGalleries();
  document.querySelectorAll(".cd-val").forEach(roll);
  mo.observe(document.getElementById("root"),{subtree:true,childList:true,characterData:true}); } },50);
addEventListener("resize",prepGalleries);
})();
