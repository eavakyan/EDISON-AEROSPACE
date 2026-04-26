'use strict';

document.addEventListener('DOMContentLoaded', function () {

  var STORAGE_KEY = 'edison-cookie-consent';
  var consent = localStorage.getItem(STORAGE_KEY);

  // Try both possible banner IDs used in the HTML
  var banner = document.getElementById('cookie-banner') ||
               document.getElementById('cookie-consent');
  var acceptBtn = document.getElementById('cookie-accept');
  var declineBtn = document.getElementById('cookie-decline');

  /**
   * Hide the cookie consent banner.
   */
  function hideBanner() {
    if (banner) {
      banner.classList.remove('active');
      banner.style.display = 'none';
    }
  }

  /**
   * Show the cookie consent banner.
   */
  function showBanner() {
    if (banner) {
      banner.classList.add('active');
    }
  }

  // If no stored preference, show the banner
  if (!consent) {
    showBanner();
  } else if (consent === 'accepted') {
    // If previously accepted, load analytics automatically
    if (typeof window.loadAnalytics === 'function') {
      window.loadAnalytics();
    }
  }

  // Accept button handler
  if (acceptBtn) {
    acceptBtn.addEventListener('click', function () {
      localStorage.setItem(STORAGE_KEY, 'accepted');
      hideBanner();

      if (typeof window.loadAnalytics === 'function') {
        window.loadAnalytics();
      }
    });
  }

  // Decline button handler
  if (declineBtn) {
    declineBtn.addEventListener('click', function () {
      localStorage.setItem(STORAGE_KEY, 'declined');
      hideBanner();
    });
  }

});
