(function(){
  const overlay = document.getElementById('overlay');
  const bgMusic = document.getElementById('bgMusic');
  const video = document.getElementById('my-video');
  const invitoPlane = document.getElementById('invitoPlane');
  const videoPlane = document.getElementById('videoPlane');
  const logoReplay = document.getElementById('logoReplay');
  const logoWhatsApp = document.getElementById('logoWhatsApp');

  let userGesture = false;
  let videoStarted = false;

  // Tap overlay per sbloccare audio
  overlay.addEventListener('click', async () => {
    overlay.style.display = 'none';
    userGesture = true;
    try { await bgMusic.play(); } catch(e){ console.warn('bgMusic play blocked', e);}
  });

  // Click sul PNG per avviare video
  invitoPlane.addEventListener('click', async () => {
    if(!userGesture || videoStarted) return;
    videoStarted = true;

    // Nascondi l’invito
    invitoPlane.setAttribute('visible','false');

    // Mostra video
    videoPlane.setAttribute('visible','true');
    videoPlane.setAttribute('scale','0 0 0');
    setTimeout(()=> {
      videoPlane.setAttribute('animation','property: scale; from:0 0 0; to:1 1 1; dur:900; easing:easeOutElastic');
    }, 40);

    // Abbassa musica background
    const originalVol = bgMusic.volume || 1.0;
    const targetVol = 0.18;
    const steps = 12;
    for(let i=0;i<steps;i++){
      setTimeout(()=>{ bgMusic.volume = originalVol - ((originalVol-targetVol)*((i+1)/steps)); }, i*60);
    }

    // Start video
    try { await video.play(); } catch(err){ console.error('video.play rejected', err);}

    // Fine video
    video.addEventListener('ended',()=>{
      bgMusic.volume = originalVol;
      logoReplay.style.display = 'block';
      logoWhatsApp.style.display = 'block';
    }, {once:true});
  });

  // Replay
  logoReplay.addEventListener('click', async () => {
    logoReplay.style.display = 'none';
    logoWhatsApp.style.display = 'none';
    try {
      video.currentTime = 0;
      await video.play();
      bgMusic.volume = 0.18;
    } catch(err){ console.warn('replay play failed', err);}
  });

  // WhatsApp
  logoWhatsApp.addEventListener('click', ()=> window.open('https://wa.me/YOURNUMBER','_blank'));
})();