// script.js (AGGIORNATO - gestione robusta del pulsante ENTRA su desktop/Android/iOS)
// Integra: face-camera, iOS-friendly video start, single-play audio items, particelle veloci, WhatsApp link.

// ---------- Selettori DOM (tenta piu' id/class possibili per il bottone START) ----------
const startBtnCandidates = [
  document.getElementById('startBtn'),
  document.getElementById('enterBtn'),
  document.querySelector('.enterBtn'),
  document.getElementById('start-button'),
  null
].filter(Boolean);

const startOverlay = document.getElementById('startOverlay') || document.querySelector('.startOverlay');
const bgMusic = document.getElementById('bgMusic');
const cameraStreamEl = document.getElementById('cameraStream');
const holoVideo = document.getElementById('holoVideo');
const demoVideo = document.getElementById('demoVideo');
const qr = document.getElementById('qrCode') || document.getElementById('qr');
const replayLogo = document.getElementById('replayLogo');
const whatsappLogo = document.getElementById('whatsappLogo');
const videoTapOverlay = document.getElementById('videoTapOverlay');
const tapToPlay = document.getElementById('tapToPlay');

const itemIds = ['DonBosco','Radio','EtnaEnsemble','Tromba','Catania','Eduverse','Fantacalcio','Dj','Ballerino'];
let bgSavedTime = 0;
const wait = ms => new Promise(r => setTimeout(r, ms));

// Safety: ensure holoVideo exists
try { if (holoVideo) holoVideo.volume = 1.0; } catch(e){}

// ----------------- A-Frame component face-camera (Y-only by default) -----------------
if (window.AFRAME) {
  AFRAME.registerComponent('face-camera', {
    schema: { mode: { type: 'string', default: 'y' }, flip: { type: 'boolean', default: false }, lockX: { type: 'boolean', default: true }, lockZ: { type: 'boolean', default: true } },
    init: function() {
      this.cameraEl = document.querySelector('#camera');
      this.applyDoubleSideOnce();
      if (this.data.flip) this.applyFlipOnce();
    },
    applyDoubleSideOnce: function() {
      const mesh = this.el.getObject3D && this.el.getObject3D('mesh');
      if (!mesh) { setTimeout(()=>this.applyDoubleSideOnce(),120); return; }
      try {
        if (Array.isArray(mesh.material)) mesh.material.forEach(m=>{ m.side = THREE.DoubleSide; m.needsUpdate = true; });
        else if (mesh.material) { mesh.material.side = THREE.DoubleSide; mesh.material.needsUpdate = true; }
      } catch(e){}
    },
    applyFlipOnce: function() {
      const sAttr = this.el.getAttribute('scale') || '1 1 1';
      const parts = (typeof sAttr === 'string' ? sAttr.split(' ') : [sAttr.x, sAttr.y, sAttr.z]);
      const sx = -Math.abs(parseFloat(parts[0] || 1));
      const sy = parseFloat(parts[1] || 1);
      const sz = parseFloat(parts[2] || 1);
      this.el.setAttribute('scale', `${sx} ${sy} ${sz}`);
    },
    tick: (function(){
      const itemPos = new THREE.Vector3(), camPos = new THREE.Vector3();
      return function() {
        const camEl = this.cameraEl; if (!camEl || !camEl.object3D || !this.el.object3D) return;
        this.el.object3D.getWorldPosition(itemPos);
        camEl.object3D.getWorldPosition(camPos);
        if (this.data.mode === 'free') {
          this.el.object3D.lookAt(camPos);
          if (this.data.lockX || this.data.lockZ) {
            const ry = this.el.object3D.rotation.y;
            const rx = this.data.lockX ? 0 : this.el.object3D.rotation.x;
            const rz = this.data.lockZ ? 0 : this.el.object3D.rotation.z;
            this.el.object3D.rotation.set(rx, ry, rz);
          }
        } else {
          const dx = camPos.x - itemPos.x, dz = camPos.z - itemPos.z;
          const angle = Math.atan2(dx, dz);
          this.el.object3D.rotation.set(0, angle + Math.PI, 0);
        }
      };
    })()
  });
}

// ---------- Funzione unica di start dell'esperienza ----------
async function startExperience(eventOriginIsUserGesture = false) {
  // eventOriginIsUserGesture: se true, indica che il click/touch è sicuramente gesto nativo
  try { if (bgMusic) await bgMusic.play(); } catch(e){ /* potrebbe essere bloccato fino a gesture */ }

  // nascondi overlay start (se presente)
  if (startOverlay) {
    try { startOverlay.style.display = 'none'; } catch(e){}
  } else {
    // se non c'è overlay ma c'è un elemento body, scrollTo top per sicurezza
    try{ document.body.focus(); }catch(e){}
  }

  // avvia fotocamera / stream
  try {
    await startCameraWithRetries();
  } catch(e) {
    alert('Permesso fotocamera negato o impossibile avviare la fotocamera. Controlla i permessi del browser.');
    return;
  }

  // posiziona elementi, particles, ecc.
  distributeItemsCircle(2.0, 2.2);
  createParticles(36); createSmoke(25); animateLight();
  setupInteractions(); // registra interazioni (include iOS friendly per video)

  // applica il componente face-camera a tutti gli item (flip per farli front-facing)
  itemIds.forEach(id => {
    const el = document.getElementById(id) || document.querySelector(`#${id}`);
    if (!el) return;
    try { el.setAttribute('face-camera', 'mode: y; flip: true; lockX: true; lockZ: true'); } catch(e){}
  });

  // se l'evento che ha scatenato startExperience era un gesto nativo (click/touch),
  // proviamo a lanciare eventuali media che richiedono gesture: ad es. bgMusic già tentato sopra,
  // manteniamo behavior standard (video avviato solo su QR click o overlay tap).
}

// ---------- Attach robust listeners to start controls ----------
// Supporta click e touchend; prova prima i candidate buttons, altrimenti ascolta click sull'intero overlay
function attachStartHandlers() {
  const boundStart = (e) => {
    // Segnala che abbiamo un gesto nativo dell'utente (utile per play() su alcuni browser)
    e && e.preventDefault && e.preventDefault();
    startExperience(true);
  };

  // If we found explicit buttons, attach to them
  if (startBtnCandidates.length > 0) {
    startBtnCandidates.forEach(btn => {
      btn.addEventListener('click', boundStart, { passive: false });
      btn.addEventListener('touchend', boundStart, { passive: false });
    });
    return;
  }

  // Fallback 1: attach to overlay if present
  if (startOverlay) {
    startOverlay.addEventListener('click', boundStart, { passive: false });
    startOverlay.addEventListener('touchend', boundStart, { passive: false });
    return;
  }

  // Fallback 2: attach to whole document body (last resort)
  document.body.addEventListener('click', function onBodyClick(e){
    // attach once: remove this listener after first use
    document.body.removeEventListener('click', onBodyClick);
    startExperience(true);
  }, { once: true, passive: true });

  // Also listen for Enter key as backup
  window.addEventListener('keydown', function onKey(ev){
    if (ev.key === 'Enter') {
      window.removeEventListener('keydown', onKey);
      startExperience(true);
    }
  });
}

// ---------- startCameraWithRetries (come prima, robusto) ----------
async function startCameraWithRetries(){
  // se non esiste l'elemento video di camera, crealo (compatibilità)
  if (!cameraStreamEl) throw new Error('cameraStream element mancante');
  cameraStreamEl.setAttribute('playsinline',''); cameraStreamEl.setAttribute('webkit-playsinline','');
  cameraStreamEl.setAttribute('autoplay',''); cameraStreamEl.setAttribute('muted',''); cameraStreamEl.setAttribute('crossorigin','anonymous');
  cameraStreamEl.style.objectFit='cover';
  const attempts = [
    { video: { facingMode: { ideal: 'environment' } }, audio: false },
    { video: { facingMode: 'environment' }, audio: false },
    { video: true, audio: false }
  ];
  let lastErr = null, stream = null;
  for (const c of attempts) {
    try { stream = await navigator.mediaDevices.getUserMedia(c); if (stream) break; } catch(e){ lastErr = e; await wait(180); }
  }
  if (!stream) throw lastErr || new Error('Nessuno stream disponibile');
  cameraStreamEl.srcObject = stream;
  cameraStreamEl.muted = true;
  cameraStreamEl.playsInline = true;
  try { const p = cameraStreamEl.play(); if (p && p.then) await p; } catch(e){}
  // assegna al sky se esiste
  const sky = document.getElementById('cameraSky') || document.querySelector('a-sky');
  if (sky) {
    try { sky.setAttribute('material','shader: flat; src: #cameraStream'); forceSkyTextureUpdate(sky,1400,80); } catch(e){}
  }
  // wait breve affinché lo stream inizi
  await new Promise(res => setTimeout(res, 200));
}

function forceSkyTextureUpdate(skyEl,d=1400,i=80){
  const start = Date.now();
  const tid = setInterval(()=>{
    try {
      const mesh = skyEl.getObject3D && skyEl.getObject3D('mesh');
      if(mesh && mesh.material && mesh.material.map){ mesh.material.map.needsUpdate=true; mesh.material.needsUpdate=true; }
    } catch(e){}
    if (Date.now() - start > d) clearInterval(tid);
  }, i);
}

// ---------- Distribuzione items su cerchio (unchanged, leggermente semplificata) ----------
function distributeItemsCircle(radius=2.0, height=2.2){
  const count = itemIds.length;
  const angleStep = (2*Math.PI)/count;
  itemIds.forEach((id,i)=>{
    const el = document.getElementById(id) || document.querySelector(`#${id}`);
    if(!el) return;
    const angle = i*angleStep + (Math.random()*0.1 - 0.05);
    const x = radius * Math.cos(angle), z = radius * Math.sin(angle), y = height;
    el.setAttribute('position', `${x.toFixed(3)} ${y.toFixed(3)} ${z.toFixed(3)}`);
    el.setAttribute('scale','0.95 0.95 0.95');
    el.classList.add('clickable');
    const amp = 0.08 + Math.random()*0.04;
    const dur = 800 + Math.random()*600; // più veloce
    el.setAttribute('animation__float', `property: position; to: ${x.toFixed(3)} ${(y+amp).toFixed(3)} ${z.toFixed(3)}; dur:${dur}; dir:alternate; loop:true; easing:easeInOutSine`);
  });
}

// ---------- Particelle / fumo (veloci) ----------
function createParticles(count=32){
  const root = document.getElementById('particles') || document.createElement('a-entity');
  if (!document.getElementById('particles')) {
    root.id = 'particles';
    const scene = document.querySelector('a-scene');
    if (scene) scene.appendChild(root);
  } else {
    while(root.firstChild) root.removeChild(root.firstChild);
  }
  for(let i=0;i<count;i++){
    const s = document.createElement('a-sphere');
    const px = (Math.random()*2-1)*3, py = Math.random()*2 + 0.6, pz = (Math.random()*2-1)*3;
    s.setAttribute('position', `${px.toFixed(3)} ${py.toFixed(3)} ${pz.toFixed(3)}`);
    s.setAttribute('radius', (0.03 + Math.random()*0.04).toFixed(3));
    s.setAttribute('color', '#ff2b2b');
    const tx = (px + (Math.random()*0.6 - 0.3)).toFixed(3);
    const ty = (py + (Math.random()*0.6 - 0.3)).toFixed(3);
    const tz = (pz + (Math.random()*0.6 - 0.3)).toFixed(3);
    const dur = 700 + Math.random()*900; // veloce
    s.setAttribute('animation__float', `property: position; to: ${tx} ${ty} ${tz}; dur:${Math.round(dur)}; dir:alternate; loop:true; easing:easeInOutSine`);
    root.appendChild(s);
  }
}

function createSmoke(count=20){
  const root = document.getElementById('particles');
  for(let i=0;i<count;i++){
    const e = document.createElement('a-cylinder');
    const px=(Math.random()*2-1)*3, py=0.5 + Math.random()*2, pz=(Math.random()*2-1)*3;
    e.setAttribute('position', `${px.toFixed(3)} ${py.toFixed(3)} ${pz.toFixed(3)}`);
    e.setAttribute('radius', 0.03);
    e.setAttribute('height', 0.7 + Math.random()*0.5);
    e.setAttribute('color', '#ff1111');
    e.setAttribute('opacity', 0.45);
    const ty = (py + 0.6).toFixed(3);
    const dur = 800 + Math.random()*800;
    e.setAttribute('animation__rise', `property: position; to: ${px.toFixed(3)} ${ty} ${pz.toFixed(3)}; dur:${Math.round(dur)}; dir:alternate; loop:true; easing:easeInOutSine`);
    root.appendChild(e);
  }
}

function animateLight(){ const light = document.getElementById('pulseLight'); if(light) light.setAttribute('animation','property:intensity; to:1.1; dur:1200; dir:alternate; loop:true; easing:easeInOutSine'); }

// ---------- Interazioni (iOS-friendly) ----------
function setupInteractions(){
  const audioMap = { 'Fantacalcio':'fantacalcio.mp3', 'Dj':'dj.mp3' };
  const linkMap = {
    'DonBosco':'https://www.instagram.com/giovani_animatori_trecastagni/',
    'EtnaEnsemble':'https://www.instagram.com/etnaensemble/',
    'Catania':'https://www.instagram.com/officialcataniafc/',
    'Eduverse':'https://www.instagram.com/eduverse___/',
    'Radio':'https://open.spotify.com/intl-it/track/3nhAgjyrfUUCNDMZHx6LCa?si=043e9baf88924a82',
    'Tromba':'https://youtu.be/AMK10N6wwHM',
    'Ballerino':'https://youtu.be/JS_BY3LRBqw'
  };

  preserveVideoAspect();

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // QR behavior (uses qr id or qrCode)
  const qrEl = qr || document.getElementById('qr');
  if (qrEl) {
    qrEl.addEventListener('click', async ()=>{
      qrEl.setAttribute('visible', false);
      if (demoVideo) demoVideo.setAttribute('visible', true);
      if (isIOS) { if (videoTapOverlay) videoTapOverlay.style.display = 'flex'; return; }
      try { if (holoVideo) { holoVideo.volume = 1.0; await holoVideo.play(); bgSavedTime = (bgMusic && bgMusic.currentTime) || 0; if (bgMusic) bgMusic.pause(); } } catch(e){ if (videoTapOverlay) videoTapOverlay.style.display = 'flex'; }
    }, { passive: true });
  }

  if (tapToPlay) {
    tapToPlay.addEventListener('click', async ()=>{
      if (videoTapOverlay) videoTapOverlay.style.display = 'none';
      try { if (holoVideo) { holoVideo.volume = 1.0; await holoVideo.play(); bgSavedTime = (bgMusic && bgMusic.currentTime) || 0; if (bgMusic) bgMusic.pause(); } } catch(e){ alert('Impossibile avviare il video su questo dispositivo.'); }
    });
  }

  if (holoVideo) {
    holoVideo.addEventListener('ended', ()=>{
      if (demoVideo) demoVideo.setAttribute('visible', false);
      if (replayLogo) replayLogo.setAttribute('visible', true);
      if (whatsappLogo) whatsappLogo.setAttribute('visible', true);
      if (replayLogo) replayLogo.classList.add('clickable');
      if (whatsappLogo) whatsappLogo.classList.add('clickable');
      try { if (bgMusic) { bgMusic.currentTime = bgSavedTime || 0; bgMusic.play(); } } catch(e){}
    });
  }

  // replay behavior
  if (replayLogo) {
    replayLogo.addEventListener('click', async ()=>{
      if (!replayLogo.getAttribute('visible')) return;
      replayLogo.setAttribute('visible', false);
      if (whatsappLogo) whatsappLogo.setAttribute('visible', false);
      replayLogo.classList.remove('clickable');
      if (isIOS) { if (videoTapOverlay) videoTapOverlay.style.display = 'flex'; return; }
      try { if (holoVideo) { holoVideo.volume = 1.0; await holoVideo.play(); bgSavedTime = (bgMusic && bgMusic.currentTime) || 0; if (bgMusic) bgMusic.pause(); } } catch(e){ if (videoTapOverlay) videoTapOverlay.style.display = 'flex'; }
    }, { passive: true });
  }

  // whatsapp link
  if (whatsappLogo) {
    whatsappLogo.addEventListener('click', ()=> {
      if (!whatsappLogo.getAttribute('visible')) return;
      window.open('https://whatsapp.com/channel/0029VbCDIZCJUM2SokRjrw2W','_blank');
    }, { passive: true });
  }

  // item clicks
  itemIds.forEach(id => {
    const el = document.getElementById(id) || document.querySelector(`#${id}`);
    if (!el) return;
    el.addEventListener('click', ()=>{
      // link first
      if (linkMap[id]) { window.open(linkMap[id], '_blank'); return; }
      // audio local
      if (audioMap[id]) {
        if (playingAudios[id]) return; // già in riproduzione
        try { if (bgMusic) bgSavedTime = bgMusic.currentTime; if (bgMusic) bgMusic.pause(); } catch(e){}
        const a = new Audio(audioMap[id]);
        playingAudios[id] = a;
        const p = a.play();
        if (p && p.then) p.catch(()=>{ playingAudios[id] = null; try{ if (bgMusic) bgMusic.play(); }catch(e){} });
        a.addEventListener('ended', ()=>{ playingAudios[id] = null; try{ if (bgMusic) { bgMusic.currentTime = bgSavedTime || 0; bgMusic.play(); } } catch(e){} });
        return;
      }
      // fallback
      window.open('https://instagram.com','_blank');
    }, { passive: true });
  });
}

// ---------- preserveVideoAspect ----------
function preserveVideoAspect(){
  if (!holoVideo || !demoVideo) return;
  const src = holoVideo.querySelector && holoVideo.querySelector('source') ? holoVideo.querySelector('source').src : holoVideo.src;
  if (!src) return;
  const probe = document.createElement('video'); probe.preload='metadata'; probe.src = src; probe.muted=true; probe.playsInline=true;
  probe.addEventListener('loadedmetadata', ()=>{
    const w = probe.videoWidth, h = probe.videoHeight;
    if (w && h) {
      const aspect = w/h, baseH = 1.0; const sx = baseH * aspect, sy = baseH;
      try { demoVideo.setAttribute('scale', `${sx} ${sy} 1`); } catch(e){}
    }
  });
  probe.load();
}

// ---------- cleanup ----------
window.addEventListener('beforeunload', ()=>{ try{ if (bgMusic) bgMusic.pause(); }catch(e){} try{ if (holoVideo) holoVideo.pause(); }catch(e){} });

// ---------- inizializzazione: aggancia i listener di start su DOMContentLoaded ----------
window.addEventListener('DOMContentLoaded', ()=>{
  attachStartHandlers();
  // se vuoi forzare la preload delle risorse (opzionale)
});