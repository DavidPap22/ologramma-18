// ---------- script.js completo e robusto ----------
// - face-camera (Y-only)
// - gestione iOS-friendly per il video (overlay tap)
// - single-play per audio item
// - particles / smoke più veloci
// - link WhatsApp aggiornato
// - attachStartHandlersFlexible() crea fallback "ENTRA" se necessario

// ---------- Selettori DOM principali ----------
const startOverlay = document.getElementById('startOverlay') || document.querySelector('.startOverlay');
const startBtnCandidates = [
  document.getElementById('startBtn'),
  document.getElementById('enterBtn'),
  document.querySelector('.enterBtn'),
  document.getElementById('start-button'),
  document.querySelector('#startOverlay button'),
  null
].filter(Boolean);

const bgMusic = document.getElementById('bgMusic');
const cameraStreamEl = document.getElementById('cameraStream');
const holoVideo = document.getElementById('holoVideo'); // <video> element
const demoVideo = document.getElementById('demoVideo'); // a-video or a-entity
const qr = document.getElementById('qrCode') || document.getElementById('qr');
const replayLogo = document.getElementById('replayLogo');
const whatsappLogo = document.getElementById('whatsappLogo');
const videoTapOverlay = document.getElementById('videoTapOverlay');
const tapToPlay = document.getElementById('tapToPlay');
const itemIds = ['DonBosco','Radio','EtnaEnsemble','Tromba','Catania','Eduverse','Fantacalcio','Dj','Ballerino'];

let bgSavedTime = 0;
const wait = ms => new Promise(r => setTimeout(r, ms));

// safety: set video volume high when possible
try { if (holoVideo) holoVideo.volume = 1.0; } catch(e){}

// ----------------- AFRAME COMPONENT: face-camera (Y-only) -----------------
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

// ---------- startExperience (chiamata quando l'utente preme ENTRA) ----------
async function startExperience(eventOriginIsUserGesture = false) {
  try { if (bgMusic) await bgMusic.play(); } catch(e){ /* autoplay blocked fino a gesture */ }

  if (startOverlay) try { startOverlay.style.display = 'none'; } catch(e){}

  // avvia fotocamera
  try {
    await startCameraWithRetries();
  } catch(e) {
    alert('Impossibile avviare la fotocamera. Controlla i permessi del browser.');
    return;
  }

  // predisponi scena e interazioni
  distributeItemsCircle(2.0, 2.2);
  createParticles(36); createSmoke(25); animateLight();
  setupInteractions();

  // applica face-camera (flip per front-facing)
  itemIds.forEach(id => {
    const el = document.getElementById(id) || document.querySelector(`#${id}`);
    if (!el) return;
    try { el.setAttribute('face-camera','mode: y; flip: true; lockX: true; lockZ: true'); } catch(e){}
  });
}

// ---------- attachStartHandlersFlexible + fallback button ----------
function attachStartHandlersFlexible() {
  const candidates = startBtnCandidates.concat([document.querySelector('#startOverlay'), document.querySelector('.startOverlay')]).filter(Boolean);
  let started = false;
  const boundStart = (ev) => {
    if (started) return;
    started = true;
    try { if (ev && ev.preventDefault) ev.preventDefault(); } catch(e){}
    try { startExperience(true); } catch(e){}
  };

  if (candidates.length) {
    candidates.forEach(btn => {
      try {
        btn.style.touchAction = btn.style.touchAction || 'manipulation';
        btn.addEventListener('click', boundStart, { passive: false });
        btn.addEventListener('pointerup', boundStart, { passive: false });
        btn.addEventListener('touchend', boundStart, { passive: false });
      } catch(e){}
    });
    // se nessuno preme entro 1200ms creiamo fallback
    setTimeout(()=>{ if (!started) createFallbackStartButton(boundStart); }, 1200);
    return;
  }
  // nessun candidato trovato
  createFallbackStartButton(boundStart);
}

function createFallbackStartButton(handler) {
  if (document.getElementById('emergencyStartBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'emergencyStartBtn';
  btn.textContent = 'ENTRA';
  Object.assign(btn.style, {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: '99999999',
    padding: '18px 36px',
    borderRadius: '999px',
    border: 'none',
    background: '#ff2b2b',
    color: '#fff',
    fontSize: '1.2rem',
    fontWeight: '700',
    boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
    cursor: 'pointer',
    opacity: '0.98'
  });
  const hint = document.createElement('div');
  hint.id = 'emergencyStartHint';
  hint.textContent = 'Tocca per entrare';
  Object.assign(hint.style, {
    position: 'fixed',
    left: '50%',
    top: 'calc(50% + 64px)',
    transform: 'translateX(-50%)',
    zIndex: '99999999',
    color: '#fff',
    fontSize: '0.95rem',
    opacity: '0.95'
  });
  document.body.appendChild(btn);
  document.body.appendChild(hint);

  const onceHandler = function(ev){
    try { handler(ev); } catch(e){}
    setTimeout(()=>{ try{ btn.remove(); hint.remove(); } catch(e){} }, 250);
    btn.removeEventListener('click', onceHandler);
    btn.removeEventListener('pointerup', onceHandler);
    btn.removeEventListener('touchend', onceHandler);
  };

  btn.addEventListener('click', onceHandler, { passive: false });
  btn.addEventListener('pointerup', onceHandler, { passive: false });
  btn.addEventListener('touchend', onceHandler, { passive: false });
}

// ---------- startCameraWithRetries ----------
async function startCameraWithRetries(){
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
  const sky = document.getElementById('cameraSky') || document.querySelector('a-sky');
  if (sky) {
    try { sky.setAttribute('material','shader: flat; src: #cameraStream'); forceSkyTextureUpdate(sky,1400,80); } catch(e){}
  }
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

// ---------- distributeItemsCircle ----------
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

// ---------- particles / smoke ----------
function createParticles(count=32){
  let root = document.getElementById('particles');
  if (!root) {
    root = document.createElement('a-entity'); root.id = 'particles';
    const scene = document.querySelector('a-scene'); if (scene) scene.appendChild(root);
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

// ---------- interactions (iOS-friendly) ----------
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

  if (whatsappLogo) {
    whatsappLogo.addEventListener('click', ()=> {
      if (!whatsappLogo.getAttribute('visible')) return;
      window.open('https://whatsapp.com/channel/0029VbCDIZCJUM2SokRjrw2W','_blank');
    }, { passive: true });
  }

  const playingAudios = {}; // local to function to avoid accidental global reuse

  itemIds.forEach(id => {
    const el = document.getElementById(id) || document.querySelector(`#${id}`);
    if (!el) return;
    el.addEventListener('click', ()=>{
      if (linkMap[id]) { window.open(linkMap[id], '_blank'); return; }
      if (audioMap[id]) {
        if (playingAudios[id]) return;
        try { if (bgMusic) bgSavedTime = bgMusic.currentTime; if (bgMusic) bgMusic.pause(); } catch(e){}
        const a = new Audio(audioMap[id]);
        playingAudios[id] = a;
        const p = a.play();
        if (p && p.then) p.catch(()=>{ playingAudios[id] = null; try{ if (bgMusic) bgMusic.play(); }catch(e){} });
        a.addEventListener('ended', ()=>{ playingAudios[id] = null; try{ if (bgMusic) { bgMusic.currentTime = bgSavedTime || 0; bgMusic.play(); } } catch(e){} });
        return;
      }
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

// ---------- inizializzazione ----------
window.addEventListener('DOMContentLoaded', ()=>{
  attachStartHandlersFlexible();
  // eventuale preload o altre inizializzazioni leggere possono andare qui
});