const status = document.getElementById('status');

function youtubeEmbed(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;

  try {
    const candidate = value.includes('://') ? value : `https://${value}`;
    const url = new URL(candidate);
    let host = url.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);

    const playlistId = url.searchParams.get('list');
    if (playlistId) {
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlistId)}&rel=0&autoplay=1`;
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
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&autoplay=1`;
  } catch {
    return null;
  }
}

function loadVideo() {
  const input = document.getElementById('videoUrl');
  const screen = document.getElementById('movieScreen');
  const url = youtubeEmbed(input?.value);
  if (!url) {
    status.textContent = 'Paste a valid YouTube video, Shorts, live, or playlist link.';
    return;
  }
  screen.src = url;
  status.textContent = 'Now playing on the theater screen.';
}

document.getElementById('loadVideo')?.addEventListener('click', loadVideo);
document.getElementById('videoUrl')?.addEventListener('keydown', event => {
  if (event.key === 'Enter') loadVideo();
});

const controls = document.querySelector('.controls');
if (controls) {
  const signInput = document.createElement('input');
  signInput.placeholder = 'Type your neon sign';
  signInput.value = localStorage.getItem('trentTheaterSign') || 'TRENT STUDIO';
  const signButton = document.createElement('button');
  signButton.textContent = 'Change neon';
  signButton.className = 'alt';
  signButton.addEventListener('click', () => {
    const text = signInput.value.trim().slice(0, 28) || 'TRENT STUDIO';
    const title = document.getElementById('neonTitle');
    if (title) title.textContent = text;
    localStorage.setItem('trentTheaterSign', text);
    status.textContent = 'Neon sign updated.';
  });
  controls.append(signInput, signButton);
  const title = document.getElementById('neonTitle');
  if (title) title.textContent = signInput.value;
}

const endpoint = 'https://kygisserver.ky.gov/arcgis/rest/services/WGS84WM_Services/Ky_WebCams_WGS84WM/MapServer/0/query?where=county%3D%27Jefferson%27&outFields=name,highway,snapshot,updateTS,status&returnGeometry=false&f=json';

function card(item, index) {
  const attributes = item.attributes || {};
  const element = document.createElement('article');
  element.className = 'cam';
  const image = document.createElement('img');
  image.alt = attributes.name || `Louisville traffic camera ${index + 1}`;
  image.referrerPolicy = 'no-referrer';
  image.src = (attributes.snapshot || '') + ((attributes.snapshot || '').includes('?') ? '&' : '?') + 't=' + Date.now();
  image.onerror = () => { element.style.display = 'none'; };
  const label = document.createElement('span');
  const time = attributes.updateTS
    ? new Date(attributes.updateTS).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : 'current';
  label.textContent = `${attributes.name || attributes.highway || 'Louisville camera'} • ${time}`;
  element.append(image, label);
  return element;
}

async function refresh() {
  try {
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) throw new Error(`service ${response.status}`);
    const data = await response.json();
    const feeds = (data.features || []).filter(item => item.attributes?.snapshot).slice(0, 6);
    if (!feeds.length) throw new Error('no camera snapshots returned');
    const left = document.getElementById('leftCams');
    const right = document.getElementById('rightCams');
    left?.replaceChildren();
    right?.replaceChildren();
    feeds.forEach((item, index) => (index % 2 ? right : left)?.appendChild(card(item, index)));
    status.textContent = `3D theater ready • ${feeds.length} official Kentucky camera feeds loaded`;
  } catch (error) {
    status.textContent = `3D theater ready • camera wall error: ${error.message}`;
  }
}

refresh();
setInterval(refresh, 60000);
