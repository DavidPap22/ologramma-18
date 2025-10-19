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
  const globalSmoke = document.getElementById('globalSmoke');
  const floating1 = document.getElementById('floating1');
  const floating2 = document.getElementById('floating2');
  const markerSmoke = document.getElementById('markerSmoke');

  let userGesture = false;
  let markerVisible = false;
  let videoStarted = false;

  overlay.addEventListener('click', async () => {
    overlay.style.display='none';
    userGesture = true;
    try { await bgMusic.play(); } catch(e){ console.warn(e); }
    // Mostra elementi AR già sbloccati ma invisibili finché marker non trovato
    globalSmoke.setAttribute('visible', false);
    floating1.setAttribute('visible', false);
    floating2.setAttribute('visible', false);
    markerGlow.setAttribute('visible', false);
    markerSmoke.setAttribute('visible', false);
  });

  marker.addEventListener('markerFound', () => {
    markerVisible = true;
    debugBadge.textContent = 'Marker: trovato ✓';
    debugBadge.style.background = 'rgba(0,80,0,0.6)';
    markerGlow.setAttribute('visible', true);
    globalSmoke.setAttribute('visible', true);
    floating1.setAttribute('visible', true);
    floating2.setAttribute('visible', true);
    markerSmoke.setAttribute('visible', true);
  });

  marker.addEventListener('markerLost', () => {
    markerVisible = false;
    debugBadge.textContent = 'Marker: perso';
    debugBadge.style.background = 'rgba(80,0,0,0.6)';
    markerGlow.setAttribute('visible', false);
  });

  document.body.addEventListener('click', async () => {
    if(!userGesture || !markerVisible || videoStarted) return;
    videoStarted = true;
    videoPlane.setAttribute('visible', true);
    videoPlane.setAttribute('scale','0 0 0');
    setTimeout(()=> videoPlane.setAttribute('animation','property: scale; from:0 0 0; to:1 1 1; dur:900; easing:easeOutElastic'), 40);

    const originalVol = bgMusic.volume || 1.0;
    const targetVol = 0.18;
    for(let i=0;i<12;i++){
      setTimeout(()=>{ bgMusic.volume = originalVol - ((originalVol-targetVol)*((i+1)/12)); }, i*60);
    }

    try { await video.play(); } catch(err){ console.error(err); }

    video.addEventListener('ended', ()=>{
      bgMusic.volume = originalVol;
      logoReplay.style.display='block';
      logoWhatsApp.style.display='block';
    }, {once:true});
  });

  logoReplay.addEventListener('click', async ()=>{
    logoReplay.style.display='none';
    logoWhatsApp.style.display='none';
    try{ video.currentTime=0; await video.play(); bgMusic.volume=0.18; } catch(err){ console.warn(err); }
  });

  logoWhatsApp.addEventListener('click', ()=> window.open('https://wa.me/YOURNUMBER','_blank'));

})();