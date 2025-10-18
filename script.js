// script.js — patch correttiva
(function(){
  const overlay = document.getElementById('overlay');
  const bgMusic = document.getElementById('bgMusic');
  const video = document.getElementById('my-video');
  const videoPlane = document.getElementById('videoPlane');
  const marker = document.getElementById('marker');
  const debugBadge = document.getElementById('debugBadge');
  const logoReplay = document.getElementById('logoReplay');
  const logoWhatsApp = document.getElementById('logoWhatsApp');
  const globalSmoke = document.getElementById('globalSmoke');
  const markerGlow = document.getElementById('markerGlow');

  let userGesture = false;    // overlay tap happened
  let markerVisible = false;
  let videoStarted = false;

  console.log('[AR] init');

  // 1) Gesture unlocking: overlay tap unlocks audio/video play permission (pre-play/pause)
  overlay.addEventListener('click', async () => {
    overlay.style.display = 'none';
    userGesture = true;
    try {
      await bgMusic.play();
      console.log('[AR] bgMusic play OK');
    } catch (e) {
      console.warn('[AR] bgMusic play blocked:', e);
    }

    // unlock video element by play/pause to allow subsequent programmatic play
    try {
      const p = video.play();
      if (p && p.then) {
        await p;
        video.pause();
        video.currentTime = 0;
        console.log('[AR] video unlocked via gesture');
      }
    } catch (err) {
      console.warn('[AR] video unlock attempt blocked:', err);
    }
  });

  // 2) Marker events: update debug badge and markerVisible flag
  marker.addEventListener('markerFound', () => {
    markerVisible = true;
    debugBadge.textContent = 'Marker: trovato ✓';
    debugBadge.style.background = 'rgba(0,80,0,0.6)';
    // show local glow so user sees marker area
    if (markerGlow) markerGlow.setAttribute('visible', 'true');
    console.log('[AR] markerFound');
  });
  marker.addEventListener('markerLost', () => {
    markerVisible = false;
    debugBadge.textContent = 'Marker: perso';
    debugBadge.style.background = 'rgba(80,0,0,0.6)';
    if (markerGlow) markerGlow.setAttribute('visible', 'false');
    console.log('[AR] markerLost');
  });

  // 3) Click handler: only starts video if marker visible AND userGesture true AND not started
  document.body.addEventListener('click', async (ev) => {
    if (!userGesture) {
      console.log('[AR] click ignored: gesture not provided yet');
      return;
    }
    if (!markerVisible) {
      console.log('[AR] click ignored: marker not visible');
      return;
    }
    if (videoStarted) {
      console.log('[AR] click ignored: video already started');
      return;
    }

    // Start sequence
    videoStarted = true;
    console.log('[AR] starting video on marker click');

    // show plane (child of marker => appears over marker)
    videoPlane.setAttribute('visible', 'true');

    // small entrance animation (scale from 0 -> 1)
    videoPlane.setAttribute('scale', '0 0 0');
    setTimeout(()=> {
      videoPlane.setAttribute('animation', 'property: scale; from: 0 0 0; to: 1 1 1; dur: 900; easing: easeOutElastic');
    }, 50);

    // lower music volume smoothly
    const targetLow = 0.18;
    const origVol = (bgMusic.volume !== undefined ? bgMusic.volume : 1);
    const fadeSteps = 12;
    for (let i=0;i<fadeSteps;i++){
      setTimeout(()=> { bgMusic.volume = origVol - ( (origVol - targetLow) * ((i+1)/fadeSteps) ); }, i*60);
    }

    // play video
    try {
      await video.play();
      console.log('[AR] video play OK');
    } catch (err) {
      console.error('[AR] video.play() failed:', err);
    }

    // when video ends: restore music and show logos
    video.addEventListener('ended', ()=> {
      console.log('[AR] video ended');
      // restore volume quickly
      bgMusic.volume = origVol;
      // show logos
      logoReplay.style.display = 'block';
      logoWhatsApp.style.display = 'block';
    }, {once:true});
  });

  // 4) Replay logic
  logoReplay.addEventListener('click', async () => {
    console.log('[AR] replay clicked');
    logoReplay.style.display = 'none';
    logoWhatsApp.style.display = 'none';
    if (!userGesture) return;
    // reset and play again
    try {
      video.currentTime = 0;
      await video.play();
      // pull down music while playing
      bgMusic.volume = 0.18;
    } catch(err) { console.warn('[AR] replay play failed', err); }
  });

  // 5) small debug: log play rejections
  video.addEventListener('play', ()=> console.log('[AR] video event: play'));
  video.addEventListener('pause', ()=> console.log('[AR] video event: pause'));
  video.addEventListener('error', (e)=> console.error('[AR] video error', e));

  // 6) interactive smoke slight movement relative to camera
  const camera = document.querySelector('a-entity[camera]');
  const interactiveSmoke = document.getElementById('globalSmoke') || document.getElementById('interactiveSmoke');
  function moveSmokeLoop(){
    if (camera && interactiveSmoke) {
      const pos = camera.object3D.position;
      interactiveSmoke.setAttribute('position', {
        x: Math.sin(pos.x) * 0.5,
        y: 1.5 + Math.sin(pos.y) * 0.25,
        z: Math.sin(pos.z) * 0.5
      });
    }
    requestAnimationFrame(moveSmokeLoop);
  }
  requestAnimationFrame(moveSmokeLoop);

  // 7) Helpful console tip
  console.log('[AR] Ready. Steps to test: 1) tap overlay to unlock media; 2) point camera to printed marker / marker on other screen; 3) when debug badge shows "Marker: trovato", tap screen to start video.');

})();