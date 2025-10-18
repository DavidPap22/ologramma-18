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

// Tap sullo schermo per avviare il video
document.body.addEventListener('click', () => {
  if(markerVisible && !videoStarted) {
    videoStarted = true;

    // Mostra video sopra marker
    videoPlane.setAttribute('visible', 'true');
    video.play();

    // Abbassa musica durante il video
    bgMusic.volume = 0.2;

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
  bgMusic.volume = 0.2;
});

// WhatsApp click
logoWhatsApp.addEventListener('click', () => {
  window.open('https://wa.me/YOURNUMBER', '_blank');
});

// Particelle fumo rosso interattive
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