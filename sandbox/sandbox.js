/* SANDBOX layer (TUS-1): the in-app panel + the few behaviours CSS can't do. Never touches app.js state.
   Each behaviour checks its own toggle when it fires, so flipping a switch takes effect immediately. */
(function(){
const H=document.documentElement, on=id=>H.classList.contains("sb-"+id);
const calm=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE="cubic-bezier(.32,.72,0,1)";
const TOGGLES=window.__sbToggles;

/* --- make our stylesheets win ties: move them after the app's own <style> once React has mounted --- */
function lastCss(){ document.querySelectorAll("link[data-sbx]").forEach(l=>document.body.appendChild(l)); }

/* ================= PANEL ================= */
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
const gear=document.createElement("button"); gear.className="sbx-gear"; gear.setAttribute("aria-label","Sandbox settings");
gear.innerHTML='<span><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></span>';
const scrim=document.createElement("div"); scrim.className="sbx-scrim";
const sheet=document.createElement("div"); sheet.className="sbx-sheet"; sheet.setAttribute("role","dialog"); sheet.setAttribute("aria-label","Sandbox settings");
function groups(){ const g={}; TOGGLES.forEach(t=>(g[t.group]=g[t.group]||[]).push(t)); return g; }
function build(){
  const gs=groups();
  sheet.innerHTML=`<div class="sbx-grab"></div><h2>Sandbox changes</h2><p class="sub">Everything is ON. Flip a switch to compare with how the live app behaves. Nothing here touches the live app.</p>
  <div class="sbx-bar"><button data-a="on">All on</button><button data-a="off">All off (= live)</button></div>`+
  Object.keys(gs).map(k=>`<h3>${esc(k)}</h3><div class="sbx-group">${gs[k].map(t=>`<div class="sbx-row" role="switch" tabindex="0" aria-checked="${on(t.id)}" data-id="${t.id}"><div class="t"><b>${esc(t.title)}</b><small>${esc(t.desc)}${t.reload?' <span class="sbx-reload">· reloads</span>':''}</small></div><span class="sbx-sw"></span></div>`).join("")}</div>`).join("")+
  `<p class="sbx-note">Build: ${esc(window.__sbBuild||"")}. Changes are saved on this phone only. Add <b>?sbx=off</b> to the address to open it with everything off.</p>`;
}
function save(){ const st={}; TOGGLES.forEach(t=>st[t.id]=on(t.id)); try{localStorage.setItem("sbx-toggles-v1",JSON.stringify(st))}catch(e){} }
function setT(id,v,noRefresh){ H.classList.toggle("sb-"+id,v); }
function after(changed){ save(); refresh(); dispatchEvent(new Event("sbx-flags")); setTimeout(()=>dispatchEvent(new Event("resize")),30); if(changed.some(id=>TOGGLES.find(t=>t.id===id&&t.reload))) setTimeout(()=>location.reload(),250); }
function open(){ build(); scrim.classList.add("show"); sheet.classList.add("show"); }
function close(){ scrim.classList.remove("show"); sheet.classList.remove("show"); }
gear.onclick=open; scrim.onclick=close;
sheet.addEventListener("click",e=>{
  const r=e.target.closest(".sbx-row"); if(r){ const id=r.dataset.id,v=!on(id); setT(id,v); r.setAttribute("aria-checked",v); after([id]); return; }
  const b=e.target.closest("button[data-a]"); if(b){ const v=b.dataset.a==="on",ch=[]; TOGGLES.forEach(t=>{ if(on(t.id)!==v){ setT(t.id,v); ch.push(t.id) } }); build(); after(ch); } });
sheet.addEventListener("keydown",e=>{ if((e.key==="Enter"||e.key===" ")&&e.target.classList.contains("sbx-row")){e.preventDefault();e.target.click()} });
// swipe the sheet down to close
let sg=null; sheet.addEventListener("touchstart",e=>{ if(sheet.scrollTop>0) return; sg={y:e.touches[0].clientY,d:0}; },{passive:true});
sheet.addEventListener("touchmove",e=>{ if(!sg) return; const d=e.touches[0].clientY-sg.y; if(d<=0){sg.d=0;return} sg.d=d; sheet.style.transition="none"; sheet.style.transform=`translateY(${d}px)`; },{passive:true});
sheet.addEventListener("touchend",()=>{ if(!sg) return; const d=sg.d; sg=null; sheet.style.transition=""; sheet.style.transform=""; if(d>90) close(); });
document.body.append(gear,scrim,sheet);

/* ================= behaviours ================= */
/* enter: index the first cards, play once */
function enter(){ const cards=[...document.querySelectorAll(".st-wrap > div > .card")]; if(!cards.length) return false;
  cards.forEach((c,i)=>c.style.setProperty("--sb-i",Math.min(i,6))); if(on("enter")&&!calm()){H.classList.add("sb-entering"); setTimeout(()=>H.classList.remove("sb-entering"),1400);} return true; }

/* swipe: photos in opened cards (phones) */
function prepGalleries(){
  document.querySelectorAll(".gallery").forEach(g=>{
    const want=on("swipe")&&innerWidth<=430&&g.children.length>1;
    g.classList.toggle("sb-swipe",want);
    let dots=g.nextElementSibling&&g.nextElementSibling.classList.contains("sbx-dots")?g.nextElementSibling:null;
    if(want&&!dots){dots=document.createElement("div");dots.className="sbx-dots";dots.setAttribute("aria-hidden","true");dots.innerHTML=[...g.children].map((_,i)=>`<i class="${i?"":"on"}"></i>`).join("");g.after(dots);
      g.addEventListener("scroll",()=>{const i=Math.round(g.scrollLeft/Math.max(1,g.clientWidth));dots.querySelectorAll("i").forEach((d,j)=>d.classList.toggle("on",i===j))},{passive:true});
      g.addEventListener("touchstart",e=>{if(g.classList.contains("sb-swipe"))e.stopPropagation()},{passive:true}); }
  });
}

/* digits: when the minute/hour/day part changes, the countdown eases in once. Seconds ticks stay still. Never rewrites React's text. */
const lastCd=new WeakMap();
function roll(el){ if(!on("digits")||calm()) return; const txt=el.textContent; if(!/\d/.test(txt)) return;
  const head=txt.replace(/:\d\d$/,""), prev=lastCd.get(el); lastCd.set(el,head); if(prev===undefined||prev===head) return;
  el.animate([{transform:"translateY(-30%)",opacity:.25},{transform:"none",opacity:1}],{duration:320,easing:EASE}); }

/* sheets: lightbox grows out of the tapped photo */
let from=null;
document.addEventListener("click",e=>{const p=e.target.closest(".photo.has-img, .xm-grid img, .box-photo"); if(!p) return; from=(p.querySelector("img")||p).getBoundingClientRect();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{const img=document.querySelector(".lightbox.show img"); if(!img||!from||!on("sheets")||calm()) return; const t=img.getBoundingClientRect(); if(!t.width) return;
    const s=from.width/t.width,x=(from.left+from.width/2)-(t.left+t.width/2),y=(from.top+from.height/2)-(t.top+t.height/2);
    img.animate([{transform:`translate(${x}px,${y}px) scale(${s})`,borderRadius:"18px"},{transform:"none"}],{duration:480,easing:EASE}); from=null;}));
},true);

/* ptr: pull to refresh, Page 1 only */
const ptr=document.createElement("div"); ptr.className="sbx-ptr"; ptr.setAttribute("aria-hidden","true");
ptr.innerHTML='<svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 2v9M3 7l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Pull to check for updates</span>';
document.body.appendChild(ptr);
const iosTab=/iP(hone|ad|od)/.test(navigator.userAgent)&&!navigator.standalone;
let pg=null;
addEventListener("touchstart",e=>{ if(iosTab||calm()||!on("ptr")||scrollY>0||e.touches.length!==1||document.querySelector(".hdr-feed, .about.show, .lightbox.show, .sbx-sheet.show")){pg=null;return}
  pg={y:e.touches[0].clientY,x:e.touches[0].clientX,d:0}; },{passive:true});
addEventListener("touchmove",e=>{ if(!pg) return; const t=e.touches[0],dy=t.clientY-pg.y,dx=t.clientX-pg.x;
  if(dy<=0||Math.abs(dx)>dy){ if(Math.abs(dx)>12){pg=null;ptr.style.opacity=0} return; }
  pg.d=Math.min(110,dy*.55); const ready=pg.d>64; ptr.style.transition="none"; ptr.style.transform=`translate(-50%, ${pg.d-60}px)`; ptr.style.opacity=Math.min(1,pg.d/50);
  ptr.classList.toggle("ready",ready); ptr.querySelector("span").textContent=ready?"Release to check":"Pull to check for updates"; },{passive:true});
addEventListener("touchend",()=>{ if(!pg) return; const go=pg.d>64; pg=null; ptr.style.transition=`transform .45s ${EASE}, opacity .3s`;
  if(go){ ptr.classList.remove("ready"); ptr.classList.add("spin"); ptr.querySelector("span").textContent="Checking…"; ptr.style.transform="translate(-50%, 8px)"; setTimeout(()=>location.reload(),700); }
  else { ptr.style.transform="translate(-50%,-60px)"; ptr.style.opacity=0; } });

/* hero: mark placeholder facts */
function markTbc(){ document.querySelectorAll(".facts dd").forEach(d=>{const v=/^to be (confirmed|announced)\.?$/i.test(d.textContent.trim()); if(d.classList.contains("sb-tbc")!==v) d.classList.toggle("sb-tbc",v)}); }

/* DaVinci #3: collapse stacked TBC rows in the hero into one line (hide with a class, never remove React's nodes) */
function foldTbc(){ const f=document.querySelector(".next .facts"); if(!f) return;
  const dds=[...f.querySelectorAll("dd")], tb=dds.filter(d=>d.classList.contains("sb-tbc")), fold=on("tbc")&&tb.length>=2;
  dds.forEach(d=>{ const dt=d.previousElementSibling, h=fold&&d.classList.contains("sb-tbc"); if(d.classList.contains("sb-fold")!==h){ d.classList.toggle("sb-fold",h); dt&&dt.classList.toggle("sb-fold",h);} });
  const note=f.parentNode.querySelector(".next-note"); if(note){ const h=fold&&/^details to be (announced|confirmed)\.?$/i.test(note.textContent.trim()); if(note.classList.contains("sb-fold")!==h) note.classList.toggle("sb-fold",h); }
  let line=f.parentNode.querySelector(".sb-tbcline");
  if(fold){ const names=tb.map(d=>(d.previousElementSibling.textContent||"").trim().toLowerCase()).filter(Boolean); const t=(names.join(" and ")||"details")+" to be confirmed"; const txt=t.charAt(0).toUpperCase()+t.slice(1);
    if(!line){ line=document.createElement("p"); line.className="sb-tbcline"; f.before(line); } if(line.textContent!==txt) line.textContent=txt; }
  else if(line) line.remove(); }

/* timeline: log label (hidden by CSS unless the toggle is on) */
function sectionLabel(){ const wrap=document.querySelector(".st-wrap"); if(!wrap) return;
  const first=[...wrap.children].find(c=>c.matches("div")&&c.querySelector(":scope > .card")); if(!first) return;
  const n=wrap.querySelectorAll(":scope > div > .card").length; let h=wrap.querySelector(".sb-sec");
  if(!h){h=document.createElement("div");h.className="sb-sec";h.setAttribute("role","heading");h.setAttribute("aria-level","2");}
  const html=`Flight log<span>${n} flights</span>`; if(h.innerHTML!==html) h.innerHTML=html; if(h.nextSibling!==first) first.before(h); }

/* menu: Done button + swipe left to close */
function menu(){ const a=document.querySelector(".about"); if(!a||a.dataset.sb) return; a.dataset.sb="1";
  const d=document.createElement("button"); d.className="sb-done"; d.textContent="Done"; d.onclick=()=>{const s=document.querySelector(".scrim.show"); s&&s.click()}; a.prepend(d);
  let g=null; a.addEventListener("touchstart",e=>{ if(!on("menu")||calm()) return; g={x:e.touches[0].clientX,y:e.touches[0].clientY,dx:0,m:null}; },{passive:true});
  a.addEventListener("touchmove",e=>{ if(!g) return; const t=e.touches[0],dx=t.clientX-g.x,dy=t.clientY-g.y;
    if(!g.m){ if(Math.abs(dx)<8&&Math.abs(dy)<8) return; g.m=(dx<0&&Math.abs(dx)>Math.abs(dy)*1.4)?"x":"n"; if(g.m==="x") a.style.transition="none"; }
    if(g.m!=="x") return; g.dx=Math.min(0,dx); a.style.transform=`translateX(${g.dx}px)`; },{passive:true});
  a.addEventListener("touchend",()=>{ if(!g) return; const dx=g.dx,m=g.m; g=null; if(m!=="x") return; a.style.transition=`transform .4s ${EASE}`;
    if(dx<-70){ const s=document.querySelector(".scrim.show"); a.style.transform=""; s&&s.click(); } else a.style.transform=""; setTimeout(()=>{a.style.transition="";a.style.transform=""},450); });
}

function refresh(){ prepGalleries(); markTbc(); foldTbc(); sectionLabel(); menu(); document.querySelectorAll(".cd-val").forEach(roll); }
const mo=new MutationObserver(ms=>{ let add=false;
  for(const m of ms){ const el=m.target.nodeType===3?m.target.parentElement:m.target; const cd=el&&el.closest&&el.closest(".cd-val"); if(cd) roll(cd); if(m.addedNodes.length) add=true; }
  if(add) refresh(); });
const boot=setInterval(()=>{ if(document.querySelector(".st-wrap .card")){ clearInterval(boot); lastCss(); enter(); refresh(); mo.observe(document.getElementById("root"),{subtree:true,childList:true,characterData:true}); } },50);
addEventListener("resize",prepGalleries);
window.__sbRefresh=refresh;
})();
