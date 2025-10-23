// script.js - versione completa e coerente

const startBtn = document.getElementById('startBtn');
const startOverlay = document.getElementById('startOverlay');
const bgMusic = document.getElementById('bgMusic');
const cameraStreamEl = document.getElementById('cameraStream');
const holoVideo = document.getElementById('holoVideo');
const videoTapOverlay = document.getElementById('videoTapOverlay');
const tapToPlay = document.getElementById('tapToPlay');
const qr = document.getElementById('qrCode');
const demoVideo = document.getElementById('demoVideo');
const replayLogo = document.getElementById('replayLogo');
const whatsappLogo = document.getElementById('whatsappLogo');

const itemIds = ['DonBosco', 'Radio', 'EtnaEnsemble', 'Tromba', 'Catania', 'Eduverse', 'Fantacalcio', 'Dj', 'Ballerino'];
let bgSavedTime = 0;
const wait = ms => new Promise(r => setTimeout(r, ms));

startBtn.addEventListener('click', async () => {
  try { await bgMusic.play(); } catch (e) { /* autoplay may be blocked until user gesture; it's fine */ }
  startOverlay.style.display = 'none';
  try { await startCameraWithRetries(); } catch (e) { alert('Impossibile avviare la fotocamera.'); return; }

  // Reset posizione/visibilità centrali
  qr.setAttribute('position', '0 1.2 -1.5');
  qr.setAttribute('scale', '1.3 1.3 1');
  demoVideo.setAttribute('position', '0 1.2 -1.5');
  replayLogo.setAttribute('position', '-0.9 1.2 -1.5');
  whatsappLogo.setAttribute('position', '0.9 1.2 -1.5');
  replayLogo.setAttribute('visible', false);
  whatsappLogo.setAttribute('visible', false);
  replayLogo.classList.remove('clickable');
  whatsappLogo.classList.remove('clickable');

  distributeItemsCircle(2.0, 2.2);
  createParticles(36);
  createSmoke(25);
  animateLight();
  setupInteractions();
});

// CAMERA START
async function startCameraWithRetries() {
  cameraStreamEl.setAttribute('playsinline', '');
  cameraStreamEl.setAttribute('webkit-playsinline', '');
  cameraStreamEl.setAttribute('autoplay', '');
  cameraStreamEl.setAttribute('muted', '');
  cameraStreamEl.setAttribute('crossorigin', 'anonymous');
  cameraStreamEl.style.objectFit = 'cover';

  const attempts = [
    { video: { facingMode: { ideal: 'environment' } }, audio: false },
    { video: { facingMode: 'environment' }, audio: false },
    { video: true, audio: false }
  ];

  let lastErr = null, stream = null;
  for (const c of attempts) {
    try { stream = await navigator.mediaDevices.getUserMedia(c); if (stream) break; }
    catch (e) { lastErr = e; await wait(180); }
  }
  if (!stream) throw lastErr || new Error('Nessuno stream');

  cameraStreamEl.srcObject = stream;
  cameraStreamEl.muted = true;
  cameraStreamEl.playsInline = true;
  try { const p = cameraStreamEl.play(); if (p && p.then) await p; } catch (e) {}

  await new Promise(r => {
    let done = false;
    function onPlay() {
      if (done) return;
      done = true;
      cameraStreamEl.removeEventListener('playing', onPlay);
      r();
    }
    cameraStreamEl.addEventListener('playing', onPlay);
    setTimeout(() => {
      if (!done) { done = true; cameraStreamEl.removeEventListener('playing', onPlay); r(); }
    }, 1800);
  });

  document.getElementById('cameraSky').setAttribute('material', 'shader: flat; src: #cameraStream');
  forceSkyTextureUpdate(document.getElementById('cameraSky'), 1400, 80);
}

function forceSkyTextureUpdate(skyEl, d = 1400, i = 80) {
  const start = Date.now();
  const tid = setInterval(() => {
    try {
      const mesh = skyEl.getObject3D('mesh');
      if (mesh && mesh.material && mesh.material.map) {
        mesh.material.map.needsUpdate = true;
        mesh.material.needsUpdate = true;
      }
    } catch (e) {}
    if (Date.now() - start > d) clearInterval(tid);
  }, i);
}

// DISTRIBUISCI ITEMS SU CERCHIO, CREANDO UN WRAPPER PER ROTAZIONE + FLOAT
function distributeItemsCircle(radius = 2.0, height = 2.2) {
  const scene = document.querySelector('a-scene');
  const count = itemIds.length;
  const angleStep = (2 * Math.PI) / count;

  itemIds.forEach((id, i) => {
    const img = document.getElementById(id);
    if (!img) return;

    const angle = i * angleStep + (Math.random() * 0.1 - 0.05);
    const x = (radius * Math.cos(angle));
    const z = (radius * Math.sin(angle));
    const y = height;

    // crea wrapper
    const wrap = document.createElement('a-entity');
    wrap.setAttribute('id', `${id}-wrap`);
    wrap.setAttribute('position', `${x.toFixed(3)} ${y.toFixed(3)} ${z.toFixed(3)}`);

    // float (vertical oscillation)
    const amp = 0.08 + Math.random() * 0.04;
    const floatDur = 1800 + Math.random() * 1500;
    wrap.setAttribute('animation__float',
      `property: position; to: ${x.toFixed(3)} ${(y + amp).toFixed(3)} ${z.toFixed(3)}; dur:${Math.floor(floatDur)}; dir:alternate; loop:true; easing:easeInOutSine`
    );

    // rotation continua su Y (wrap ruota così l'immagine "gira su se stessa")
    const rotDur = 4000 + Math.random() * 6000;
    wrap.setAttribute('animation__rotate',
      `property: rotation; to: 0 360 0; dur:${Math.floor(rotDur)}; easing:linear; loop:true`
    );

    // sposta l'immagine dentro il wrapper (posizione relativa)
    if (img.parentNode) img.parentNode.removeChild(img);
    img.setAttribute('position', `0 0 0`);
    img.setAttribute('scale', '0.95 0.95 0.95');

    // mantieni look-at sull'immagine figlia (in modo che "guardi" la camera)
    img.setAttribute('look-at', '#camera');

    // assicurati sia cliccabile
    img.classList.add('clickable');

    wrap.appendChild(img);
    scene.appendChild(wrap);
  });
}

// PARTICELLE, FUMO, LUCE
function createParticles(count = 32) {
  const root = document.getElementById('particles');
  while (root.firstChild) root.removeChild(root.firstChild);
  for (let i = 0; i < count; i++) {
    const s = document.createElement('a-sphere');
    const px = (Math.random() * 2 - 1) * 3;
    const py = Math.random() * 2 + 0.6;
    const pz = (Math.random() * 2 - 1) * 3;
    s.setAttribute('position', `${px.toFixed(3)} ${py.toFixed(3)} ${pz.toFixed(3)}`);
    s.setAttribute('radius', (0.03 + Math.random() * 0.04).toFixed(3));
    s.setAttribute('color', '#ff2b2b');
    const tx = px + (Math.random() * 0.6 - 0.3);
    const ty = py + (Math.random() * 0.6 - 0.3);
    const tz = pz + (Math.random() * 0.6 - 0.3);
    const dur = 1600 + Math.random() * 2600;
    s.setAttribute('animation',
      `property: position; to: ${tx.toFixed(3)} ${ty.toFixed(3)} ${tz.toFixed(3)}; dur:${dur}; dir:alternate; loop:true; easing:easeInOutSine`
    );
    root.appendChild(s);
  }
}
function createSmoke(count = 20) {
  const root = document.getElementById('particles');
  for (let i = 0; i < count; i++) {
    const e = document.createElement('a-cylinder');
    const px = (Math.random() * 2 - 1) * 3;
    const py = 0.5 + Math.random() * 2;
    const pz = (Math.random() * 2 - 1) * 3;
    e.setAttribute('position', `${px.toFixed(3)} ${py.toFixed(3)} ${pz.toFixed(3)}`);
    e.setAttribute('radius', 0.03);
    e.setAttribute('height', 0.7 + Math.random() * 0.5);
    e.setAttribute('color', '#ff1111');
    e.setAttribute('opacity', 0.45);
    e.setAttribute('animation',
      `property: position; to: ${px.toFixed(3)} ${(py + 0.6).toFixed(3)} ${pz.toFixed(3)}; dur:${1800 + Math.random() * 1800}; dir:alternate; loop:true; easing:easeInOutSine`
    );
    root.appendChild(e);
  }
}
function animateLight() {
  const light = document.getElementById('pulseLight');
  light.setAttribute('animation',
    'property: intensity; to:1.1; dur:1200; dir:alternate; loop:true; easing:easeInOutSine'
  );
}

// INTERAZIONI (link, audio items, video behavior)
function setupInteractions() {
  const audioMap = {
    'Radio': 'radio.mp3',
    'Fantacalcio': 'fantacalcio.mp3',
    'Dj': 'dj.mp3'
  };
  const linkMap = {
    'DonBosco': 'https://www.instagram.com/giovani_animatori_trecastagni/',
    'EtnaEnsemble': 'https://www.instagram.com/etnaensemble/',
    'Catania': 'https://www.instagram.com/officialcataniafc/',
    'Eduverse': 'https://www.instagram.com/eduverse___/'
  };

  preserveVideoAspect();

  // QR click -> nascondi QR, mostra video e avvia (solo dopo click)
  qr.addEventListener('click', async () => {
    qr.setAttribute('visible', false);
    demoVideo.setAttribute('visible', true);
    try {
      bgSavedTime = bgMusic.currentTime || 0;
      bgMusic.pause();
      // play video
      await holoVideo.play();
      // disabilita pause dell'utente durante la riproduzione
      protectVideoFromPause();
    } catch (e) {
      // se il play fallisce per politica browser (autoplay), mostra overlay per tocco
      videoTapOverlay.style.display = 'flex';
    }
  });

  // overlay per avviare il video su browser che bloccano play automatico
  tapToPlay && tapToPlay.addEventListener('click', async () => {
    videoTapOverlay.style.display = 'none';
    try {
      bgSavedTime = bgMusic.currentTime || 0;
      bgMusic.pause();
      await holoVideo.play();
      protectVideoFromPause();
    } catch (e) {
      alert('Impossibile avviare il video');
    }
  });

  // quando il video finisce
  holoVideo.addEventListener('ended', () => {
    demoVideo.setAttribute('visible', false);
    replayLogo.setAttribute('visible', true);
    whatsappLogo.setAttribute('visible', true);
    replayLogo.classList.add('clickable');
    whatsappLogo.classList.add('clickable');
    // riattiva musica di sottofondo da dove era rimasta
    try { bgMusic.currentTime = bgSavedTime || 0; bgMusic.play(); } catch (e) {}
    // rimuovo eventuale listener che forzava play
    removeProtectVideoFromPause();
  });

  // replay logo click -> riavvia il video
  replayLogo.addEventListener('click', async () => {
    if (!replayLogo.getAttribute('visible')) return;
    replayLogo.setAttribute('visible', false);
    whatsappLogo.setAttribute('visible', false);
    replayLogo.classList.remove('clickable');
    whatsappLogo.classList.remove('clickable');
    demoVideo.setAttribute('visible', true);
    try {
      bgSavedTime = bgMusic.currentTime || 0;
      bgMusic.pause();
      holoVideo.currentTime = 0;
      await holoVideo.play();
      protectVideoFromPause();
    } catch (e) {
      videoTapOverlay.style.display = 'flex';
    }
  });

  // whatsapp logo -> apri link (sostituisci numero reale)
  whatsappLogo.addEventListener('click', () => {
    if (!whatsappLogo.getAttribute('visible')) return;
    window.open('https://wa.me/1234567890', '_blank');
  });

  // mappa delle azioni clic sugli item (nota: gli item ora sono figli dei wrapper)
  itemIds.forEach(id => {
    // il click listener va aggiunto sull'elemento immagine (non sul wrapper)
    const img = document.getElementById(id);
    if (!img) return;
    img.addEventListener('click', () => {
      if (audioMap[id]) {
        // riproduci mp3: salva stato musica bg, metti in pausa bg, riprendi a fine traccia
        try { bgSavedTime = bgMusic.currentTime; bgMusic.pause(); } catch (e) {}
        const a = new Audio(audioMap[id]);
        a.play().catch(() => {});
        a.onended = () => {
          try { bgMusic.currentTime = bgSavedTime || 0; bgMusic.play(); } catch (e) {}
        };
        return;
      }
      if (id === 'Tromba') { window.open('https://youtu.be/AMK10N6wwHM', '_blank'); return; }
      if (id === 'Ballerino') { window.open('https://youtu.be/JS_BY3LRBqw', '_blank'); return; }
      if (linkMap[id]) { window.open(linkMap[id], '_blank'); return; }
      // fallback
      window.open('https://instagram.com', '_blank');
    });
  });
}

// Mantieni l'aspect ratio del video nell'a-scene
function preserveVideoAspect() {
  const src = holoVideo.querySelector('source') ? holoVideo.querySelector('source').src : holoVideo.src;
  if (!src) return;
  const probe = document.createElement('video');
  probe.preload = 'metadata';
  probe.src = src;
  probe.muted = true;
  probe.playsInline = true;
  probe.addEventListener('loadedmetadata', () => {
    const w = probe.videoWidth, h = probe.videoHeight;
    if (w && h) {
      const aspect = w / h;
      const baseH = 1.0;
      const sx = baseH * aspect, sy = baseH;
      // imposta la scala del video display (a-video)
      demoVideo.setAttribute('scale', `${sx} ${sy} 1`);
    }
  });
  probe.load();
}

/* Protezione contro la pausa del video:
   - Quando video è in riproduzione lo manteniamo in play se l'utente cerca di metterlo in pausa.
   - Quando il video è terminato rimuoviamo la protezione.
*/
let _pauseGuard = null;
function protectVideoFromPause() {
  removeProtectVideoFromPause();
  _pauseGuard = (e) => {
    // se il video è in pausa ma non è ended => proviamo a riavviare
    if (holoVideo.paused && !holoVideo.ended) {
      holoVideo.play().catch(() => {});
    }
  };
  holoVideo.addEventListener('pause', _pauseGuard);
  // disabilita controlli di default (non mostrare) e impedisci click sul video per interrompere
  holoVideo.controls = false;
  demoVideo.setAttribute('class', 'no-pointer'); // stilare in css se vuoi
}
function removeProtectVideoFromPause() {
  if (_pauseGuard) {
    holoVideo.removeEventListener('pause', _pauseGuard);
    _pauseGuard = null;
  }
  // ripristina eventuali proprietà
  holoVideo.controls = false;
  demoVideo.removeAttribute('class');
}

// --- utility / small improvements ---
// Evita che con il click lungo/apri menu del video si possano fare azioni
holoVideo.addEventListener('contextmenu', (e) => { e.preventDefault(); });

// Se l'utente prova a mettere in pausa via codice esterno, lo riavviamo
holoVideo.addEventListener('playing', () => { /* ok */ });

// FINE script.js
