'use strict';

document.addEventListener('DOMContentLoaded', function () {

  // ============================================
  // Sticky Header Scroll Effect
  // ============================================
  var header = document.getElementById('site-header');

  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // ============================================
  // Hamburger Menu Toggle
  // ============================================
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function (e) {
      e.stopPropagation();
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });

    // Close when clicking outside the mobile menu
    document.addEventListener('click', function (e) {
      if (mobileMenu.classList.contains('active') &&
          !mobileMenu.contains(e.target) &&
          !hamburger.contains(e.target)) {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
      }
    });
  }

  // ============================================
  // Mobile Dropdown Toggle
  // ============================================
  var dropdownToggles = document.querySelectorAll('.mobile-dropdown-toggle');

  dropdownToggles.forEach(function (toggle) {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      var dropdown = toggle.nextElementSibling ||
                     toggle.parentElement.querySelector('.mobile-dropdown');

      if (dropdown && dropdown.classList.contains('mobile-dropdown')) {
        dropdown.classList.toggle('active');
      }
    });
  });

  // ============================================
  // Smooth Scroll for Anchor Links
  // ============================================
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;

    var targetId = link.getAttribute('href');
    if (targetId === '#' || targetId.length < 2) return;

    var targetEl = document.querySelector(targetId);
    if (!targetEl) return;

    e.preventDefault();

    var headerOffset = header ? header.offsetHeight : 80;
    var targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });

    // Close mobile menu if open
    if (hamburger && mobileMenu && mobileMenu.classList.contains('active')) {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
    }
  });

  // ============================================
  // Parallax Effect for Hero Backgrounds
  // ============================================
  var parallaxElements = document.querySelectorAll('.hero-parallax');

  if (parallaxElements.length > 0) {
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      window.addEventListener('scroll', function () {
        var scrollY = window.scrollY;
        parallaxElements.forEach(function (el) {
          var speed = 0.3;
          var offset = scrollY * speed;
          el.style.backgroundPositionY = offset + 'px';
        });
      }, { passive: true });
    }
  }

  // ============================================
  // Intersection Observer - Section Fade In
  // ============================================
  var sections = document.querySelectorAll('.section');

  if (sections.length > 0 && 'IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          sectionObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  // ============================================
  // Active Nav Highlighting
  // ============================================
  var currentPath = window.location.pathname;
  var currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

  // Desktop nav items
  var navLinks = document.querySelectorAll('.main-nav > li > a');
  navLinks.forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.parentElement.classList.add('active');
    }
  });

  // Also check dropdown links for active parent highlighting
  var dropdownLinks = document.querySelectorAll('.dropdown-menu li a');
  dropdownLinks.forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === currentPage) {
      var parentLi = link.closest('.has-dropdown');
      if (parentLi) {
        parentLi.classList.add('active');
      }
    }
  });

});
