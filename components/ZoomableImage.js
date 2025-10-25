const OVERLAY_ID = 'zoom-overlay';
const ZOOM_IMG_ID = 'zoom-img';
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_SMOOTHING = 0.15;
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

  const zoomImg = overlay.querySelector(`#${ZOOM_IMG_ID}`);
  if (!zoomImg) {
    throw new Error('Zoom overlay image element is missing');
  }

  let lastTap = 0;
  let scale = 1;
  let targetScale = 1;
  let pinchStart = 0;
  let rafId = null;

  function setScale(value) {
    scale = value;
    zoomImg.style.transform = `scale(${scale})`;
  }

  function animateScale() {
    if (Math.abs(targetScale - scale) < 0.001) {
      setScale(targetScale);
      rafId = null;
      return;
    }
    setScale(scale + (targetScale - scale) * SCALE_SMOOTHING);
    rafId = requestAnimationFrame(animateScale);
  }

  function stopAnimation() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  document.querySelectorAll('.zoomable img').forEach(img => {
    img.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastTap < DOUBLE_TAP_DELAY) {
        zoomImg.src = img.currentSrc || img.src;
        overlay.classList.toggle('active');
        stopAnimation();
        scale = 1;
        targetScale = 1;
        pinchStart = 0;
        setScale(1);
      }
      lastTap = now;
    });
  });

  overlay.addEventListener('click', () => {
    overlay.classList.remove('active');
    stopAnimation();
    targetScale = 1;
    pinchStart = 0;
    setScale(1);
    window.setTimeout(() => {
      if (!overlay.classList.contains('active')) {
        zoomImg.src = '';
      }
    }, 250);
  });

  overlay.addEventListener('touchstart', event => {
    if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      pinchStart = Math.hypot(dx, dy);
    }
  });

  overlay.addEventListener(
    'touchmove',
    event => {
      if (event.touches.length === 2) {
        event.preventDefault();
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const pinchEnd = Math.hypot(dx, dy);
        if (!pinchStart) {
          pinchStart = pinchEnd;
        }
        const zoomFactor = pinchEnd / pinchStart;
        targetScale = Math.min(
          Math.max(MIN_SCALE, targetScale * zoomFactor),
          MAX_SCALE
        );
        pinchStart = pinchEnd;
        stopAnimation();
        animateScale();
      }
    },
    { passive: false }
  );

  const resetPinch = () => {
    pinchStart = 0;
  };

  overlay.addEventListener('touchend', resetPinch);
  overlay.addEventListener('touchcancel', resetPinch);
}
