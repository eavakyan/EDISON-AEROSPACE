'use strict';

(function () {

  // ============================================
  // Create Lightbox Overlay DOM Structure
  // ============================================
  var overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Image lightbox');
  overlay.setAttribute('aria-modal', 'true');

  var closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.setAttribute('aria-label', 'Close lightbox');
  closeBtn.innerHTML = '&times;';

  var contentWrapper = document.createElement('div');
  contentWrapper.className = 'lightbox-content';

  var lightboxImg = document.createElement('img');
  lightboxImg.alt = '';
  contentWrapper.appendChild(lightboxImg);

  overlay.appendChild(closeBtn);
  overlay.appendChild(contentWrapper);
  document.body.appendChild(overlay);

  // Track the element that opened the lightbox for focus restoration
  var previousFocus = null;

  // ============================================
  // Open Lightbox
  // ============================================
  function openLightbox(src, altText) {
    previousFocus = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = altText || 'Enlarged image';

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus the close button for keyboard accessibility
    closeBtn.focus();
  }

  // ============================================
  // Close Lightbox
  // ============================================
  function closeLightbox() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    lightboxImg.src = '';

    // Restore focus to the element that triggered the lightbox
    if (previousFocus) {
      previousFocus.focus();
      previousFocus = null;
    }
  }

  // ============================================
  // Event Listeners
  // ============================================

  // Click on elements with [data-lightbox] attribute
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-lightbox]');
    if (!trigger) return;

    e.preventDefault();

    // Use data-lightbox value if it contains a path, otherwise use the img src
    var src = trigger.getAttribute('data-lightbox');
    var altText = '';

    if (!src || src === '' || src === 'true') {
      var img = trigger.tagName === 'IMG' ? trigger : trigger.querySelector('img');
      if (img) {
        src = img.src;
        altText = img.alt || '';
      }
    } else {
      // Try to get alt text from any nested img
      var nestedImg = trigger.tagName === 'IMG' ? trigger : trigger.querySelector('img');
      if (nestedImg) {
        altText = nestedImg.alt || '';
      }
    }

    if (src) {
      openLightbox(src, altText);
    }
  });

  // Close on overlay background click (not on the image itself)
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
      closeLightbox();
    }
  });

  // Close on close button click
  closeBtn.addEventListener('click', function () {
    closeLightbox();
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeLightbox();
    }
  });

  // Focus trap - keep Tab within the lightbox when open
  overlay.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    if (!overlay.classList.contains('active')) return;

    // The only focusable element in the lightbox is the close button
    e.preventDefault();
    closeBtn.focus();
  });

})();
