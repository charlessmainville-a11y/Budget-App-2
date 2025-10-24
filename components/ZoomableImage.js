const OVERLAY_ID = 'zoom-overlay';
const IMAGE_ID = 'zoom-img';
const MIN_SCALE = 1;
const MAX_SCALE = 4;

let overlay = null;
let zoomImage = null;
let currentScale = 1;
let pinchStartDistance = 0;
let pinchStartScale = 1;
let observer = null;
let previousBodyOverflow = '';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function distanceBetweenTouches(touches) {
  if (touches.length < 2) return 0;
  const [a, b] = touches;
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

function ensureOverlay() {
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  zoomImage = document.createElement('img');
  zoomImage.id = IMAGE_ID;
  zoomImage.alt = '';

  overlay.appendChild(zoomImage);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', closeOverlay);
  overlay.addEventListener('wheel', handleWheel, { passive: false });
  overlay.addEventListener('touchstart', handleTouchStart, { passive: true });
  overlay.addEventListener('touchmove', handleTouchMove, { passive: false });
  overlay.addEventListener('touchend', handleTouchEnd);
  overlay.addEventListener('touchcancel', handleTouchEnd);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && overlay?.classList.contains('active')) {
      closeOverlay();
    }
  });
}

function updateScale() {
  if (!zoomImage) return;
  zoomImage.style.transform = `scale(${currentScale})`;
}

function openOverlay(img) {
  if (!img) return;
  ensureOverlay();

  const src = img.currentSrc || img.src;
  if (!src) return;

  zoomImage.src = src;
  zoomImage.alt = img.alt || '';
  currentScale = 1;
  pinchStartScale = 1;
  pinchStartDistance = 0;
  updateScale();

  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  overlay.classList.add('active');
}

function closeOverlay() {
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = previousBodyOverflow;
  currentScale = 1;
  pinchStartDistance = 0;
  pinchStartScale = 1;
  updateScale();
  // defer clearing src so fade-out transition can complete without flicker
  window.setTimeout(() => {
    if (!overlay.classList.contains('active') && zoomImage) {
      zoomImage.src = '';
    }
  }, 200);
}

function handleWheel(event) {
  if (!overlay?.classList.contains('active')) return;
  event.preventDefault();
  const delta = event.deltaY * -0.001;
  currentScale = clamp(currentScale + delta, MIN_SCALE, MAX_SCALE);
  updateScale();
}

function handleTouchStart(event) {
  if (event.touches.length === 2) {
    pinchStartDistance = distanceBetweenTouches(event.touches);
    pinchStartScale = currentScale;
  }
}

function handleTouchMove(event) {
  if (!overlay?.classList.contains('active')) return;
  if (event.touches.length === 2) {
    const distance = distanceBetweenTouches(event.touches);
    if (!distance) return;
    event.preventDefault();
    if (!pinchStartDistance) {
      pinchStartDistance = distance;
    }
    const zoomFactor = distance / pinchStartDistance;
    currentScale = clamp(pinchStartScale * zoomFactor, MIN_SCALE, MAX_SCALE);
    updateScale();
  }
}

function handleTouchEnd(event) {
  if (event.touches.length < 2) {
    pinchStartDistance = 0;
    pinchStartScale = currentScale;
  }
}

function attachToImage(img) {
  if (!(img instanceof HTMLImageElement)) return;
  if (img.dataset.zoomableBound === '1') return;
  img.dataset.zoomableBound = '1';
  if (!img.style.cursor) {
    img.style.cursor = 'zoom-in';
  }
  img.addEventListener('click', () => openOverlay(img));
}

function attachInTree(root) {
  if (!(root instanceof Element)) return;

  if (root.matches?.('.zoomable')) {
    root.querySelectorAll('img').forEach(attachToImage);
  }

  if (root instanceof HTMLImageElement) {
    const container = root.closest('.zoomable');
    if (container) {
      attachToImage(root);
    }
  }

  root.querySelectorAll?.('.zoomable').forEach(container => {
    container.querySelectorAll('img').forEach(attachToImage);
  });
}

function observeMutations() {
  if (observer) return;
  observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node instanceof Element) {
          attachInTree(node);
        }
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export function setupZoomableImages() {
  if (typeof document === 'undefined') return;
  ensureOverlay();
  document.querySelectorAll('.zoomable img').forEach(attachToImage);
  observeMutations();
}
