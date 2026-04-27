/* ============================================
   Investor Gate — submits name/email to backend,
   swaps to "check your inbox" state on success.
   ============================================ */
(function () {
  'use strict';

  const form = document.getElementById('investor-form');
  if (!form) return;

  const successPanel = document.getElementById('investor-success');
  const successEmailEl = document.getElementById('investor-success-email');
  const resendLink = document.getElementById('investor-resend');
  const status = document.getElementById('form-status');
  const submitBtn = form.querySelector('.investors-submit');
  const endpoint = form.dataset.endpoint || '/investors/api/request-access.php';

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Show a banner if redirected back from /investors/api/verify.php with ?error=...
  (function showInboundError() {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (!err) return;
    const messages = {
      expired:       'That link has expired. Please request a new one below.',
      already_used:  'That link has already been used. Sign in again or request a new one below.',
      bad_signature: 'That link is invalid. Please request a new one below.',
      malformed:     'That link is invalid. Please request a new one below.',
      invalid:       'That link is invalid. Please request a new one below.',
    };
    setStatus(messages[err] || 'Verification failed. Please request a new link below.', 'error');
  })();

  function setStatus(msg, kind) {
    status.textContent = msg || '';
    status.className = 'form-status' + (kind ? ' ' + kind : '');
  }

  function clearFieldError(group) {
    if (group) group.classList.remove('error');
  }

  function setFieldError(group) {
    if (group) group.classList.add('error');
  }

  // Live validation: clear error as the user types.
  form.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', () => clearFieldError(input.closest('.form-group')));
  });

  function validate(data) {
    let ok = true;
    const nameGroup = form.querySelector('#investor-name').closest('.form-group');
    const emailGroup = form.querySelector('#investor-email').closest('.form-group');

    if (!data.name || data.name.length < 1 || data.name.length > 120) {
      setFieldError(nameGroup);
      ok = false;
    } else {
      clearFieldError(nameGroup);
    }

    if (!data.email || !EMAIL_RE.test(data.email) || data.email.length > 200) {
      setFieldError(emailGroup);
      ok = false;
    } else {
      clearFieldError(emailGroup);
    }

    return ok;
  }

  async function submitForm(e) {
    if (e) e.preventDefault();
    setStatus('', null);

    const data = {
      name: (form.elements.name.value || '').trim(),
      email: (form.elements.email.value || '').trim().toLowerCase(),
      company: (form.elements.company.value || '').trim(),
      role: (form.elements.role.value || '').trim(),
      // Honeypot — must be empty
      company_website: (form.elements.company_website.value || '').trim()
    };

    if (!validate(data)) {
      setStatus('Please fix the highlighted fields.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });

      let payload = null;
      try { payload = await res.json(); } catch (_) {}

      if (res.ok) {
        // Show success state
        if (successEmailEl) successEmailEl.textContent = data.email;
        form.hidden = true;
        successPanel.hidden = false;
        successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (res.status === 429) {
        setStatus('Too many requests. Please try again in a few minutes.', 'error');
      } else if (res.status === 400) {
        const msg = (payload && payload.error) || 'Please check your details and try again.';
        setStatus(msg, 'error');
      } else {
        setStatus('Something went wrong. Please try again or email info@edison.aero.', 'error');
      }
    } catch (err) {
      setStatus('Network error. Please check your connection and try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Verification Link';
    }
  }

  form.addEventListener('submit', submitForm);

  if (resendLink) {
    resendLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Flip back to form
      successPanel.hidden = true;
      form.hidden = false;
      setStatus('', null);
      const emailField = form.querySelector('#investor-email');
      if (emailField) emailField.focus();
    });
  }
})();
