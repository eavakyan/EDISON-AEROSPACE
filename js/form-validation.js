'use strict';

document.addEventListener('DOMContentLoaded', function () {

  var form = document.querySelector('.contact-form form');
  if (!form) return;

  var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');

  // ============================================
  // Validation Rules
  // ============================================
  var validationRules = {
    name: {
      required: true,
      minLength: 2,
      message: 'Please enter your name (at least 2 characters).'
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address.'
    },
    message: {
      required: true,
      minLength: 10,
      message: 'Please enter a message (at least 10 characters).'
    }
  };

  // ============================================
  // Helper: Get or create error span for a field
  // ============================================
  function getErrorSpan(field) {
    var formGroup = field.closest('.form-group');
    if (!formGroup) return null;

    var errorSpan = formGroup.querySelector('.form-error');
    if (!errorSpan) {
      errorSpan = document.createElement('span');
      errorSpan.className = 'form-error';
      errorSpan.setAttribute('role', 'alert');
      field.parentNode.insertBefore(errorSpan, field.nextSibling);
    }
    return errorSpan;
  }

  // ============================================
  // Show error for a field
  // ============================================
  function showError(field, message) {
    var formGroup = field.closest('.form-group');
    if (formGroup) {
      formGroup.classList.add('error');
    }

    var errorSpan = getErrorSpan(field);
    if (errorSpan) {
      errorSpan.textContent = message;
      errorSpan.style.display = 'block';
    }
  }

  // ============================================
  // Clear error for a field
  // ============================================
  function clearError(field) {
    var formGroup = field.closest('.form-group');
    if (formGroup) {
      formGroup.classList.remove('error');
    }

    var errorSpan = getErrorSpan(field);
    if (errorSpan) {
      errorSpan.textContent = '';
      errorSpan.style.display = 'none';
    }
  }

  // ============================================
  // Validate a single field
  // ============================================
  function validateField(field) {
    var name = field.name || field.id;
    var rules = validationRules[name];
    if (!rules) return true;

    var value = field.value.trim();

    // Required check
    if (rules.required && value === '') {
      showError(field, rules.message);
      return false;
    }

    // Min length check
    if (rules.minLength && value.length < rules.minLength) {
      showError(field, rules.message);
      return false;
    }

    // Pattern check (email)
    if (rules.pattern && !rules.pattern.test(value)) {
      showError(field, rules.message);
      return false;
    }

    clearError(field);
    return true;
  }

  // ============================================
  // Clear errors on focus and input
  // ============================================
  var fieldsToValidate = form.querySelectorAll('input, textarea, select');

  fieldsToValidate.forEach(function (field) {
    field.addEventListener('focus', function () {
      clearError(field);
    });
    field.addEventListener('input', function () {
      clearError(field);
    });
  });

  // ============================================
  // Form Submit Handler
  // ============================================
  form.addEventListener('submit', function (e) {
    var isValid = true;
    var firstInvalid = null;

    // Validate all fields with rules
    Object.keys(validationRules).forEach(function (fieldName) {
      var field = form.querySelector('[name="' + fieldName + '"]') ||
                  form.querySelector('#' + fieldName);
      if (field && !validateField(field)) {
        isValid = false;
        if (!firstInvalid) firstInvalid = field;
      }
    });

    if (!isValid) {
      e.preventDefault();

      // Focus the first invalid field
      if (firstInvalid) {
        firstInvalid.focus();
      }

      // Re-enable submit button if it was disabled
      if (submitBtn) {
        submitBtn.disabled = false;
      }

      return;
    }

    // Prevent double-submit
    if (submitBtn) {
      submitBtn.disabled = true;
    }

    // Allow the form to submit normally (Formspree handles the POST)
  });

});
