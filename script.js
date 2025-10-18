const overlay = document.getElementById('overlay');
const dots = document.getElementById('dots');
const bgMusic = document.getElementById('bgMusic');
const video = document.getElementById('my-video');
const videoPlane = document.getElementById('videoPlane');
const marker = document.getElementById('marker');
const tromba = document.getElementById('tromba');
const donBosco = document.getElementById('donBosco');
const logoReplay = document.getElementById('logoReplay');
const logoWhatsApp = document.getElementById('logoWhatsApp');
const redGlow = document.getElementById('redGlow');
const interactiveSmoke = document.getElementById('interactiveSmoke');
const camera = document.querySelector('a-entity[camera]');

let markerVisible = false;
let videoStarted = false;

// Overlay tappabile
overlay.addEventListener('click', () => {
  overlay.style.display = 'none';
  bgMusic.play();
});

// Puntini animati
let dotInterval = setInterval(() => {
  dots.textContent = dots.textContent.length < 3 ? dots.textContent + '.' : '';
}, 500);

// Marker rilevato
marker.addEventListener('markerFound', () => markerVisible = true);
marker.addEventListener('markerLost', () => markerVisible = false);

// Funzione glow pulsante per oggetti
function animateGlow(obj) {
  let intensity = 0.5;
  let direction = 1;
  function pulse() {
    intensity += direction * 0.01;
    if(intensity >= 1) direction = -1;
    if(intensity <= 0.3) direction = 1;
    obj.setAttribute('material', 'emissiveIntensity', intensity);
    requestAnimationFrame(pulse);
  }
  pulse();
}

// Tap sullo schermo
document.body.addEventListener('click', () => {
  if(markerVisible && !videoStarted) {
    videoStarted = true;

    // Mostra video, oggetti e glow
    videoPlane.setAttribute('visible', 'true');
    tromba.setAttribute('visible', 'true');
    donBosco.setAttribute('visible', 'true');
    redGlow.setAttribute('visible', 'true');

    // Animazione glow pulsante del marker
    redGlow.setAttribute('animation', 'property: scale; from: 0.8 0.8 0.8; to: 1.2 1.2 1.2; dir: alternate; dur: 800; loop: true; easing: easeInOutSine');

    // Animazioni di entrata degli oggetti
    videoPlane.setAttribute('animation', 'property: scale; from: 0 0 0; to: 1 1 1; dur: 1000; easing: easeOutElastic');
    tromba.setAttribute('animation', 'property: position; dir: alternate; loop: true; dur: 2000; to:0.5 0.4 0.2');
    donBosco.setAttribute('animation', 'property: position; dir: alternate; loop: true; dur: 2500; to:-0.5 0.5 -0.2');

    // Glow sugli oggetti
    animateGlow(tromba);
    animateGlow(donBosco);

    // Abbassa musica
    bgMusic.volume = 0.2;

    // Avvia video
    video.play();

    // Fine video: mostra loghi e rialza musica
    video.onended = () => {
      logoReplay.style.display = 'block';
      logoWhatsApp.style.display = 'block';
      bgMusic.volume = 1;
    };
  }
});

// Replay click
logoReplay.addEventListener('click', () => {
  logoReplay.style.display = 'none';
  logoWhatsApp.style.display = 'none';
  video.currentTime = 0;
  video.play();

  videoPlane.setAttribute('animation', 'property: scale; from: 0 0 0; to: 1 1 1; dur: 1000; easing: easeOutElastic');
  redGlow.setAttribute('animation', 'property: scale; from: 0.8 0.8 0.8; to: 1.2 1.2 1.2; dir: alternate; dur: 800; loop: true; easing: easeInOutSine');
});

// WhatsApp click
logoWhatsApp.addEventListener('click', () => {
  window.open('https://wa.me/YOURNUMBER', '_blank');
});

// Particelle interattive fumo rosso
function updateSmoke() {
  if(!camera) return;
  const camPos = camera.object3D.position;
  interactiveSmoke.setAttribute('position', {
    x: Math.sin(camPos.x) * 0.5,
    y: 1.5 + Math.sin(camPos.y) * 0.3,
    z: Math.sin(camPos.z) * 0.5
  });
  requestAnimationFrame(updateSmoke);
}
updateSmoke();