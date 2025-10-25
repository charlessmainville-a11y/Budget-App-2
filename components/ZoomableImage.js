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
  let scale = 1;
  let targetScale = 1;
  let pinchStart = 0;
  let rafId;

  const openOverlay = (src) => {
    zoomImg.src = src;
    overlay.classList.add('active');
    cancelAnimationFrame(rafId);
    scale = 0.95;
    targetScale = 1;
    zoomImg.style.transform = `scale(${scale})`;
    rafId = requestAnimationFrame(animateScale);
  };

  const closeOverlay = () => {
    overlay.classList.remove('active');
    cancelAnimationFrame(rafId);
    rafId = undefined;
  };

  const animateScale = () => {
    scale += (targetScale - scale) * 0.15;
    zoomImg.style.transform = `scale(${scale})`;
    if (Math.abs(targetScale - scale) > 0.001) {
      rafId = requestAnimationFrame(animateScale);
    } else {
      rafId = undefined;
    }
  };

  document.querySelectorAll('.zoomable img').forEach(img => {
    const handleOpen = () => {
      openOverlay(img.currentSrc || img.src);
    };

    img.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastTap < DOUBLE_TAP_DELAY) {
        handleOpen();
      }
      lastTap = now;
    });

    img.addEventListener('dblclick', (event) => {
      event.preventDefault();
      handleOpen();
    });
  });

  overlay.addEventListener('click', () => {
    closeOverlay();
  });

  overlay.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStart = Math.hypot(dx, dy);
    }
  });

  overlay.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const pinchEnd = Math.hypot(dx, dy);
      const zoomFactor = pinchEnd / pinchStart || 1;
      targetScale = Math.min(Math.max(1, targetScale * zoomFactor), 4);
      pinchStart = pinchEnd;
      cancelAnimationFrame(rafId);
      animateScale();
    }
  }, { passive: false });
}
