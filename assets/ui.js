// Shared helpers for the prototype. Reads only local data (data/data.js). No network calls, no notifications.
(function(){
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function uk(iso){const p=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date(iso)).map(x=>[x.type,x.value]));return{day:+p.day,mon:MON[+p.month-1],year:+p.year,time:`${p.hour}:${p.minute}`}}
// ONE date rule: "13 Nov 2026" (log), "26 Oct · 16:32 UK" (updates). Year only when not this year.
function stamp(iso,time=true,year=false){if(!iso)return"";const p=uk(iso);const y=year||p.year!==uk(new Date().toISOString()).year?` ${p.year}`:"";return `${p.day} ${p.mon}${y}${time?` · ${p.time} UK`:""}`}
const veh=(id)=>{const m=String(id||"").match(/^([BS])(\d+)(?:-(\d))?$/i);if(!m)return id||"";return (m[1].toUpperCase()==="B"?"Booster ":"Ship ")+m[2]+(m[3]?` (flight ${m[3]})`:"")};
// Credit = whoever published it. @handle for X posts, outlet name for articles. Never a vehicle name.
const OUTLETS={"nasaspaceflight.com":"NASASpaceflight","spaceflightnow.com":"Spaceflight Now","spacenews.com":"SpaceNews","teslarati.com":"Teslarati","spacex.com":"SpaceX","faa.gov":"FAA"};
function publisher(src,url){if(src&&/^@/.test(src))return src;try{const h=new URL(url).hostname.replace(/^www\./,"");const m=String(url).match(/x\.com\/([^/]+)\/status/);if(m)return "@"+m[1];return OUTLETS[h]||h}catch(e){return src||""}}
const CATS=()=>ROAD.categories;
const STATUS_WORD={done:"Done",progress:"In progress",none:"Not yet"};
function cellStatus(cat,hw){if(cat.status==="done")return"done";const has=(cat.history||[]).some(h=>h.hardware===hw);return has?"progress":"none"}
function latestFor(cat,hw){return (cat.history||[]).filter(h=>!hw||h.hardware===hw).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))[0]}
const catColor=(id)=>`var(--c-${id})`;
function stepsHTML(states){ // states: [{id,name,s}]
  return `<div class="steps" role="list">${states.map(c=>`<div class="step" role="listitem" data-s="${c.s}" style="--c:${catColor(c.id)}" aria-label="${c.name}: ${STATUS_WORD[c.s]}"><div class="bar"><i></i></div><div class="lb" aria-hidden="true">${c.icon||""}</div></div>`).join("")}</div>${sumLine(states)}`}
function sumLine(st){const g=k=>st.filter(x=>x.s===k).map(x=>x.short||x.name);const d=g("done"),p=g("progress"),n=g("none");if(!p.length&&!n.length)return `<div class="steps-sum"><b>All done:</b> ${d.join(" · ")}</div>`;return `<div class="steps-sum">${d.length?`<b>Done</b> ${d.join(", ")}`:""}${p.length?` · <b>In progress</b> ${p.join(", ")}`:""}${n.length?` · <b>Not yet</b> ${n.join(", ")}`:""}</div>`}
const SHORT={cryo:"Cryo",raptor:"Engines",static:"Static fire",pad:"Pad",faa:"FAA licence",date:"Launch date"};
function roadStates(allDone){return CATS().map(c=>({id:c.id,name:c.name,icon:c.icon,short:SHORT[c.id],s:allDone?"done":(c.status==="done"?"done":c.status==="progress"?"progress":"none")}))}
function img(h){const m=window.ROADIMG||{};return m[h.id]?`img/${m[h.id]}`:null}
function esc(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
window.UI={uk,stamp,veh,publisher,CATS,STATUS_WORD,cellStatus,latestFor,catColor,stepsHTML,roadStates,SHORT,img,esc};
})();
