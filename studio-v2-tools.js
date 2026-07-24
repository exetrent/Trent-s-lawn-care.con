const $ = id => document.getElementById(id);
let stream = null;
let facing = 'user';

function setText(id, text) {
  const element = $(id);
  if (element) element.textContent = text;
}

function stopCamera() {
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null;
  const video = $('video');
  if (video) video.srcObject = null;
  setText('cameraStatus', 'Camera is off.');
}

async function startCamera() {
  try {
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera access is not supported in this browser.');
    }
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facing } },
      audio: false
    });
    const video = $('video');
    if (video) video.srcObject = stream;
    setText('cameraStatus', 'Camera is live.');
  } catch (error) {
    setText('cameraStatus', `Camera error: ${error.message}`);
  }
}

$('start')?.addEventListener('click', startCamera);
$('stop')?.addEventListener('click', stopCamera);
$('switch')?.addEventListener('click', async () => {
  facing = facing === 'user' ? 'environment' : 'user';
  await startCamera();
});
$('mirror')?.addEventListener('click', () => $('viewer')?.classList.toggle('mirror'));

function youtubeEmbed(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;

  try {
    const candidate = value.includes('://') ? value : `https://${value}`;
    const url = new URL(candidate);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');

    const playlistId = url.searchParams.get('list');
    if (playlistId) {
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlistId)}&rel=0`;
    }

    let videoId = '';
    if (host === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] || '';
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v') || '';
      } else {
        const parts = url.pathname.split('/').filter(Boolean);
        if (['embed', 'shorts', 'live'].includes(parts[0])) videoId = parts[1] || '';
      }
    }

    if (!videoId) return null;
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`;
  } catch {
    return null;
  }
}

function loadVideo() {
  const url = youtubeEmbed($('videoUrl')?.value);
  if (!url) {
    setText('screenStatus', 'Paste a valid YouTube video or playlist link.');
    return;
  }
  const screen = $('movieScreen');
  if (screen) screen.src = url;
  setText('screenStatus', 'Now playing.');
}

$('loadVideo')?.addEventListener('click', loadVideo);
$('videoUrl')?.addEventListener('keydown', event => {
  if (event.key === 'Enter') loadVideo();
});

$('fullscreenScreen')?.addEventListener('click', async () => {
  try {
    const frame = $('movieScreen')?.parentElement;
    if (!frame?.requestFullscreen) throw new Error('Fullscreen is not supported here.');
    await frame.requestFullscreen();
  } catch (error) {
    setText('screenStatus', error.message);
  }
});

window.addEventListener('beforeunload', stopCamera);
import('/studio-v2-storage.js?v=20260724-3').catch(error => {
  console.error('Studio storage failed:', error);
});
