const qr = document.getElementById('qr');
const demoVideo = document.getElementById('demoVideo');
const holoVideo = document.getElementById('holoVideo');
const bgMusic = document.getElementById('bgMusic');
const replayLogo = document.getElementById('replayLogo');
const whatsappLogo = document.getElementById('whatsappLogo');
const videoTapOverlay = document.getElementById('videoTapOverlay');
const tapToPlay = document.getElementById('tapToPlay');
const itemIds = ['DonBosco','Radio','EtnaEnsemble','Tromba','Ballerino','Catania','Eduverse','Fantacalcio','Dj'];

let bgSavedTime = 0;
let playingAudios = {};

function preserveVideoAspect() {
  const ratio = 16 / 9;
  const h = 1.7, w = h * ratio;
  demoVideo.setAttribute('width', w);
  demoVideo.setAttribute('height', h);
}

// movimento sfere più veloce
function animateSpheres() {
  const s1 = document.getElementById('sphere1');
  const s2 = document.getElementById('sphere2');
  const s3 = document.getElementById('sphere3');
  let t = 0;
  setInterval(() => {
    t += 0.02; // più veloce
    s1.object3D.position.y = 1 + Math.sin(t) * 0.5;
    s2.object3D.position.x = -3 + Math.cos(t * 1.5) * 0.5;
    s3.object3D.position.z = -2.5 + Math.sin(t * 2) * 0.5;
  }, 30);
}

// ---------- INTERAZIONI (video, audio, click) - VERSIONE iOS-FRIENDLY ----------
function setupInteractions() {
  const audioMap = { 'Fantacalcio': 'fantacalcio.mp3', 'Dj': 'dj.mp3' };
  const linkMap = {
    'DonBosco': 'https://www.instagram.com/giovani_animatori_trecastagni/',
    'EtnaEnsemble': 'https://www.instagram.com/etnaensemble/',
    'Catania': 'https://www.instagram.com/officialcataniafc/',
    'Eduverse': 'https://www.instagram.com/eduverse___/',
    'Radio': 'https://open.spotify.com/intl-it/track/3nhAgjyrfUUCNDMZHx6LCa?si=043e9baf88924a82',
    'Tromba': 'https://youtu.be/AMK10N6wwHM',
    'Ballerino': 'https://youtu.be/JS_BY3LRBqw'
  };

  preserveVideoAspect();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  qr.addEventListener('click', async () => {
    qr.setAttribute('visible', false);
    demoVideo.setAttribute('visible', true);

    if (isIOS) {
      videoTapOverlay.style.display = 'flex';
      return;
    }

    try {
      holoVideo.volume = 1.0;
      await holoVideo.play();
      bgSavedTime = bgMusic.currentTime;
      bgMusic.pause();
    } catch (e) {
      videoTapOverlay.style.display = 'flex';
    }
  });

  tapToPlay && tapToPlay.addEventListener('click', async () => {
    videoTapOverlay.style.display = 'none';
    try {
      holoVideo.volume = 1.0;
      await holoVideo.play();
      bgSavedTime = bgMusic.currentTime;
      bgMusic.pause();
    } catch {
      alert('Impossibile avviare il video sul tuo dispositivo.');
    }
  });

  holoVideo.addEventListener('ended', () => {
    demoVideo.setAttribute('visible', false);
    replayLogo.setAttribute('visible', true);
    whatsappLogo.setAttribute('visible', true);
    replayLogo.classList.add('clickable');
    whatsappLogo.classList.add('clickable');
    try { bgMusic.currentTime = bgSavedTime || 0; bgMusic.play(); } catch {}
  });

  replayLogo.addEventListener('click', async () => {
    if (!replayLogo.getAttribute('visible')) return;
    replayLogo.setAttribute('visible', false);
    whatsappLogo.setAttribute('visible', false);
    replayLogo.classList.remove('clickable');
    whatsappLogo.classList.remove('clickable');
    demoVideo.setAttribute('visible', true);
    if (isIOS) {
      videoTapOverlay.style.display = 'flex';
      return;
    }
    try {
      holoVideo.volume = 1.0;
      await holoVideo.play();
      bgSavedTime = bgMusic.currentTime;
      bgMusic.pause();
    } catch {
      videoTapOverlay.style.display = 'flex';
    }
  });

  whatsappLogo.addEventListener('click', () => {
    if (!whatsappLogo.getAttribute('visible')) return;
    window.open('https://whatsapp.com/channel/0029VbCDIZCJUM2SokRjrw2W', '_blank');
  });

  itemIds.forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    el.addEventListener('click', () => {
      if (linkMap[id]) { window.open(linkMap[id], '_blank'); return; }
      if (audioMap[id]) {
        if (playingAudios[id]) return;
        try { bgSavedTime = bgMusic.currentTime; bgMusic.pause(); } catch {}
        const a = new Audio(audioMap[id]);
        playingAudios[id] = a;
        const p = a.play();
        if (p && p.then) p.catch(() => { playingAudios[id] = null; try { bgMusic.play(); } catch {} });
        a.addEventListener('ended', () => {
          playingAudios[id] = null;
          try { bgMusic.currentTime = bgSavedTime || 0; bgMusic.play(); } catch {}
        });
        return;
      }
      window.open('https://instagram.com', '_blank');
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setupInteractions();
  animateSpheres();
});