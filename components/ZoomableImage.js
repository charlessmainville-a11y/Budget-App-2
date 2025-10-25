const OVERLAY_ID = 'zoom-overlay';
const ZOOM_IMG_ID = 'zoom-img';
const DOUBLE_TAP_DELAY = 300;

export function setupZoomableImages() {
  if (typeof document === 'undefined') return;

  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.innerHTML = `<img id="${ZOOM_IMG_ID}" alt="" />`;
    document.body.appendChild(overlay);
  }

  let zoomImg = overlay.querySelector(`#${ZOOM_IMG_ID}`);
  if (!zoomImg) {
    zoomImg = document.createElement('img');
    zoomImg.id = ZOOM_IMG_ID;
    zoomImg.alt = '';
    overlay.appendChild(zoomImg);
  }

  let lastTap = 0;

  document.querySelectorAll('.zoomable img').forEach(img => {
    img.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastTap < DOUBLE_TAP_DELAY) {
        zoomImg.src = img.currentSrc || img.src;
        overlay.classList.add('active');
      }
      lastTap = now;
    });
  });

  overlay.addEventListener('click', () => {
    overlay.classList.remove('active');
  });
}
