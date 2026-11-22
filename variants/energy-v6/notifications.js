// SANDBOX STUB: no Firebase, no service worker, no push, no Firestore writes.
(function(){
  const no = async () => ({ ok:false, sandbox:true });
  window.STNotify = { subscribe:no, unsubscribe:no, dismiss:()=>{}, getStatus:()=> "sandbox", hasDecided:()=>true, sendFeedback:no };
  if (navigator.serviceWorker) navigator.serviceWorker.register = () => Promise.reject(new Error("sandbox: SW disabled"));
})();
