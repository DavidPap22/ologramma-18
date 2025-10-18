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
marker.addEventListener('markerFound', () => {
  console.log('Marker trovato!');
  markerVisible = true;
  // eventualmente aggiungere effetti luminosi rossi/fumo
});

// Marker perso
marker.addEventListener('markerLost', () => {
  console.log('Marker perso');
  markerVisible = false;
});

// Tap sullo schermo per avviare video e oggetti
document.body.addEventListener('click', () => {
  if(markerVisible && !videoStarted) {
    videoStarted = true;
    // mostra video e oggetti
    videoPlane.setAttribute('visible', 'true');
    tromba.setAttribute('visible', 'true');
    donBosco.setAttribute('visible', 'true');

    // animazioni di entrata
    videoPlane.setAttribute('animation', 'property: scale; from: 0 0 0; to: 1 1 1; dur: 1000; easing: easeOutElastic');
    tromba.setAttribute('animation', 'property: scale; from: 0 0 0; to: 0.2 0.2 0.2; dur: 1000; easing: easeOutElastic');
    donBosco.setAttribute('animation', 'property: scale; from: 0 0 0; to: 0.2 0.2 0.2; dur: 1000; easing: easeOutElastic');

    // avvia video
    video.play();

    // quando il video finisce mostra loghi
    video.onended = () => {
      logoReplay.style.display = 'block';
      logoWhatsApp.style.display = 'block';
    };
  }
});

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