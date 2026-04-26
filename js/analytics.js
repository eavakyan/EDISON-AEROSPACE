'use strict';

/**
 * Google Analytics GA4 - Conditional Loader
 *
 * This file defines window.loadAnalytics() which is called by
 * cookie-consent.js only after the user has accepted cookies.
 * It will only load the GA4 script once, even if called multiple times.
 */

(function () {

  var GA_MEASUREMENT_ID = 'GT-WVCKHNB';
  var analyticsLoaded = false;

  window.loadAnalytics = function () {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    // Create and append the GA4 gtag.js script
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(script);

    // Initialize the dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);
  };

})();
