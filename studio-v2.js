const status=document.getElementById('loginStatus');
window.__TRENT_STUDIO_VERSION__='20260717-5';
(async()=>{
  try{
    await import('/studio-v2-auth.js?v=20260717-5');
    await import('/studio-v2-tools.js?v=20260717-5');
  }catch(error){
    console.error('Studio startup failed:',error);
    if(status) status.textContent='Studio startup error: '+(error?.message||error);
  }
})();
