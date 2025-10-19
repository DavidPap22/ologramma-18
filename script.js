(function(){
  const overlay = document.getElementById('overlay');
  const bgMusic = document.getElementById('bgMusic');
  const video = document.getElementById('my-video');
  const videoPlane = document.getElementById('videoPlane');
  const marker = document.getElementById('marker');
  const debugBadge = document.getElementById('debugBadge');
  const logoReplay = document.getElementById('logoReplay');
  const logoWhatsApp = document.getElementById('logoWhatsApp');
  const markerGlow = document.getElementById('markerGlow');

  let userGesture = false;
  let markerVisible = false;
  let videoStarted = false;

  console.log('[AR] init');

  overlay.addEventListener('click', async () => {
    overlay.style.display = 'none';
    userGesture = true;
    try { await bgMusic.play(); console.log('[AR] bgMusic started'); }
    catch(e){ console.warn('[AR] bgMusic play blocked', e); }

    try { const p = video.play(); if(p && p.then){ await p; video.pause(); video.currentTime=0; } }
    catch(e){ console.warn('[AR] video unlock failed', e); }
  });

  marker.addEventListener('markerFound', () => {
    markerVisible = true;
    debugBadge.textContent = 'Marker: trovato ✓';
    debugBadge.style.background = 'rgba(0,80,0,0.6)';
    if(markerGlow) markerGlow.setAttribute('visible','true');
  });

  marker.addEventListener('markerLost', () => {
    markerVisible = false;
    debugBadge.textContent = 'Marker: perso';
    debugBadge.style.background = 'rgba(80,0,0,0.6)';
    if(markerGlow) markerGlow.setAttribute('visible','false');
  });

  document.body.addEventListener('click', async () => {
    if(!userGesture || !markerVisible || videoStarted) return;
    videoStarted = true;
    videoPlane.setAttribute('visible','true');
    videoPlane.setAttribute('scale','0 0 0');
    setTimeout(()=> {
      videoPlane.setAttribute('animation','property: scale; from:0 0 0; to:1 1 1; dur:900; easing:easeOutElastic');
    },40);

    const originalVol = bgMusic.volume || 1.0;
    const targetVol = 0.18;
    for(let i=0;i<12;i++){
      setTimeout(()=>{ bgMusic.volume = originalVol - ((originalVol-targetVol)*((i+1)/12)); }, i*60);
    }

    try { await video.play(); } catch(err){ console.error('[AR] video.play rejected', err); }

    video.addEventListener('ended', () => {
      bgMusic.volume = originalVol;
      logoReplay.style.display='block';
      logoWhatsApp.style.display='block';
    }, {once:true});
  });

  logoReplay.addEventListener('click', async ()=>{
    logoReplay.style.display='none'; logoWhatsApp.style.display='none';
    try{ video.currentTime=0; await video.play(); bgMusic.volume=0.18; }
    catch(err){ console.warn('[AR] replay play failed',err); }
  });

  logoWhatsApp.addEventListener('click', ()=>window.open('https://wa.me/YOURNUMBER','_blank'));

  const camera = document.querySelector('a-entity[camera]');
  const smoke = document.getElementById('globalSmoke');
  function moveSmoke(){
    if(camera && smoke){
      const p = camera.object3D.position;
      smoke.setAttribute('position',{
        x: Math.sin(p.x)*0.45,
        y:1.6 + Math.sin(p.y)*0.22,
        z: Math.sin(p.z)*0.45
      });
    }
    requestAnimationFrame(moveSmoke);
  }
  requestAnimationFrame(moveSmoke);
})();