"use strict";
// script.js
// Logica esterna per l'esperienza AR/VR

(function(){
  // DOM
  const overlay = document.getElementById('overlay');
  const endOverlay = document.getElementById('endOverlay');
  const waFloat = document.getElementById('waFloat');
  const replayBtn = document.getElementById('replayBtn');

  const marker = document.getElementById('marker');
  const videoEl = document.getElementById('my-video');
  const videoPlane = document.getElementById('videoPlane');

  const halo = document.getElementById('qrHalo');
  const qrLight = document.getElementById('qrLight');

  // ologrammi/oggetti
  const don = document.getElementById('donbosco');
  const tromba = document.getElementById('tromba');
  const palla = document.getElementById('palla');
  const label1 = document.getElementById('label1');
  const extra1 = document.getElementById('extra1');

  // audio come HTMLAudioElement
  const bgAudio = new Audio('musica.mp3');
  bgAudio.loop = true;
  bgAudio.preload = 'auto';
  bgAudio.volume = 0.55;

  // stato
  let userStarted = false;
  let sessionPlaying = false;
  // pulse interval holder
  let pulseInterval = null;

  // mostra/nascondi oggetti
  function showHologramObjects(flag){
    const arr = [videoPlane, don, tromba, palla, label1, extra1];
    arr.forEach(el => { if(!el) return; el.setAttribute && el.setAttribute('visible', !!flag); });
  }

  // start halo pulse
  function startHaloPulse(){
    if(!halo || !qrLight) return;
    halo.setAttribute('visible', true);
    qrLight.setAttribute('visible', true);
    let t=0;
    if(pulseInterval) clearInterval(pulseInterval);
    pulseInterval = setInterval(()=>{
      t += 0.06;
      const op = 0.25 + Math.abs(Math.sin(t)) * 0.75; // 0.25..1.0
      halo.setAttribute('material', 'opacity', op);
      const intensity = 0.3 + Math.abs(Math.sin(t)) * 1.6;
      qrLight.setAttribute('light', 'intensity', intensity);
    }, 60);
  }
  function stopHaloPulse(){
    if(pulseInterval){ clearInterval(pulseInterval); pulseInterval = null; }
    halo.setAttribute('visible', false);
    qrLight.setAttribute('visible', false);
  }

  // user gesture to unlock autoplay
  function userGestureStart(){
    if(userStarted) return;
    userStarted = true;
    overlay.style.display = 'none';
    // preload video: try play/pause to ensure ready
    try { videoEl.currentTime = 0; } catch(e){}
    const p = videoEl.play && videoEl.play();
    if(p && p.then) {
      p.then(()=> { videoEl.pause(); console.log('[AR] video preloaded'); })
       .catch(err => console.warn('[AR] video preload/play blocked', err));
    }
    // play bgAudio (gesture permits)
    bgAudio.play().catch(e => console.warn('[AR] bgAudio play blocked', e));
    console.log('[AR] gesture received: preloaded media. Inquadra il QR per avviare.');
  }

  // marker found => start session (show halo then show full hologram and play video+audio)
  marker && marker.addEventListener('markerFound', () => {
    console.log('[AR] markerFound');
    startHaloPulse();

    // if session not started, start it when video is ready
    if(!sessionPlaying){
      // show halo visually then after tiny delay show objects and play
      showHologramObjects(true);
      // ensure video plane visible
      videoPlane.setAttribute('visible', true);

      // reset video and play
      try { videoEl.currentTime = 0; } catch(e){}
      const playPromise = videoEl.play && videoEl.play();
      if(playPromise && playPromise.then){
        playPromise.then(()=> {
          console.log('[AR] Video playback started.');
        }).catch(err=>{
          console.warn('[AR] Video playback blocked on markerFound:', err);
        });
      }
      // ensure background audio playing
      if(bgAudio.paused) {
        bgAudio.play().catch(err=>console.warn('[AR] bgAudio play err', err));
      }
      sessionPlaying = true;
    }
  });

  // markerLost: do not stop video (per requisito)
  marker && marker.addEventListener('markerLost', () => {
    console.log('[AR] markerLost (keeping playback)');
  });

  // when video ends -> show endOverlay (Replay + WhatsApp), stop bgAudio and halo
  videoEl && videoEl.addEventListener('ended', () => {
    console.log('[AR] video ended');
    stopHaloPulse();
    if(endOverlay) endOverlay.style.display = 'flex';
    if(waFloat) waFloat.style.display = 'block';
    try { bgAudio.pause(); bgAudio.currentTime = 0; } catch(e){}
    sessionPlaying = false;
  });

  // Replay button: reset and restart session
  replayBtn && replayBtn.addEventListener('click', () => {
    console.log('[AR] replay pressed');
    if(endOverlay) endOverlay.style.display = 'none';
    if(waFloat) waFloat.style.display = 'none';
    // reset media
    try { videoEl.pause(); videoEl.currentTime = 0; } catch(e){}
    try { bgAudio.pause(); bgAudio.currentTime = 0; } catch(e){}
    sessionPlaying = false;
    // if user had given gesture, attempt restart (if marker present video will play)
    if(userStarted){
      showHologramObjects(true);
      videoPlane.setAttribute('visible', true);
      videoEl.play().catch(err=>console.warn('[AR] replay video play err', err));
      bgAudio.play().catch(err=>console.warn('[AR] replay bgAudio play err', err));
      sessionPlaying = true;
    } else {
      // request gesture again
      overlay.style.display = 'flex';
    }
  });

  // single tap to unlock (gesture)
  function onUserTapOnce(){
    userGestureStart();
    window.removeEventListener('click', onUserTapOnce);
    window.removeEventListener('touchstart', onUserTapOnce);
  }
  window.addEventListener('click', onUserTapOnce);
  window.addEventListener('touchstart', onUserTapOnce, {passive:true});

  // startup: hide objects
  showHologramObjects(false);

  // DEBUG helper: log video & canvas presence after small delay
  setTimeout(()=>{
    console.log('[DEBUG] video elements:', document.querySelectorAll('video').length);
    console.log('[DEBUG] canvas present:', !!document.querySelector('canvas'));
  }, 1200);

})();