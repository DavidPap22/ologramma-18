const overlay = document.getElementById('overlay');
const dots = document.getElementById('dots');
const bgMusic = document.getElementById('bgMusic');
const video = document.getElementById('my-video');
const videoPlane = document.getElementById('videoPlane');
const marker = document.getElementById('marker');
const logoReplay = document.getElementById('logoReplay');
const logoWhatsApp = document.getElementById('logoWhatsApp');
const markerHit = document.getElementById('markerHit');

let markerClicked = false;

// Overlay tappabile
overlay.addEventListener('click', () => {
  overlay.style.display = 'none';
  bgMusic.play();
});

// Animazione puntini
let dotInterval = setInterval(() => {
  dots.textContent = dots.textContent.length < 3 ? dots.textContent + '.' : '';
}, 500);

// Marker click (avvia video e oggetti)
markerHit.addEventListener('click', () => {
  if(!markerClicked) {
    markerClicked = true;
    markerHit.textContent = 'Marker cliccato';
    startOlogramma();
  }
});

function startOlogramma() {
  videoPlane.setAttribute('visible', 'true');
  video.play();
  // quando il video finisce
  video.onended = () => {
    logoReplay.style.display = 'block';
    logoWhatsApp.style.display = 'block';
  };
}

// Replay click
logoReplay.addEventListener('click', () => {
  logoReplay.style.display = 'none';
  logoWhatsApp.style.display = 'none';
  video.currentTime = 0;
  video.play();
});

// WhatsApp click
logoWhatsApp.addEventListener('click', () => {
  window.open('https://wa.me/tuonumero', '_blank');
});

// AR marker detection
marker.addEventListener('markerFound', () => {
  console.log('Marker trovato!');
  markerHit.style.display = 'block';
  markerHit.textContent = 'Marker pronto, clicca per avviare';
});

marker.addEventListener('markerLost', () => {
  console.log('Marker perso');
});