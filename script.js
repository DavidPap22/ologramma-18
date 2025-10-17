window.addEventListener('load', () => {
  const scene = document.querySelector('#arScene');
  if (scene) scene.style.display = 'block';

  const video = document.querySelector('#videoTexture');
  const whatsappIcon = document.querySelector('#whatsapp');
  const replayIcon = document.querySelector('#replay');
  const music = document.querySelector('#bgMusic');
  const interactables = document.querySelectorAll('.interactable');

  video.play().catch(err => console.log('Errore video:', err));
  music.play().catch(err => console.log('Errore musica:', err));

  interactables.forEach(obj => {
    obj.addEventListener('click', () => {
      const originalColor = obj.getAttribute('data-color') || obj.getAttribute('color');
      obj.setAttribute('color', '#ffffff');
      setTimeout(() => obj.setAttribute('color', originalColor), 300);

      const particle = document.createElement('a-entity');
      particle.setAttribute('particle-system', `preset: sparks; particleCount: 15; color: #ff0000, #ffffff; size: 0.02; velocityValue: 0.07 0.1 0.07; positionSpread: 0.15 0.15 0.15`);
      particle.setAttribute('position', obj.getAttribute('position'));
      obj.parentNode.appendChild(particle);
      setTimeout(() => particle.parentNode.removeChild(particle), 800);
    });
  });

  video.addEventListener('play', () => music.volume = 0.2);
  video.addEventListener('ended', () => {
    music.volume = 1.0;
    whatsappIcon.setAttribute('visible', true);
    replayIcon.setAttribute('visible', true);
  });

  whatsappIcon.addEventListener('click', () => window.open('https://chat.whatsapp.com/tuo-canale', '_blank'));
  replayIcon.addEventListener('click', () => {
    video.currentTime = 0;
    video.play();
    music.volume = 0.2;
    whatsappIcon.setAttribute('visible', false);
    replayIcon.setAttribute('visible', false);
  });
});