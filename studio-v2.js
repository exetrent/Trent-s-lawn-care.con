const status = document.getElementById('loginStatus');
window.__TRENT_STUDIO_VERSION__ = '20260724-9';

(async () => {
  try {
    await import('/studio-v2-auth.js?v=20260724-9');
    await import('/studio-v2-tools.js?v=20260724-7');
    const top = document.querySelector('.top div:last-child');
    if (top && !document.getElementById('enter3dTheater')) {
      const link = document.createElement('a');
      link.id = 'enter3dTheater';
      link.className = 'btn';
      link.href = '/theater3d.html?v=20260724-4';
      link.textContent = 'Enter 3D Theater';
      top.prepend(link);
    }
  } catch (error) {
    console.error('Studio startup failed:', error);
    if (status) status.textContent = `Studio startup error: ${error?.message || error}`;
  }
})();
