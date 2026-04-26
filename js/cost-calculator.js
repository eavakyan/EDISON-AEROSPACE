'use strict';

(function () {

  // ============================================
  // Scenario Data
  // ============================================
  var scenarios = {
    small: {
      label: 'Small Operation',
      hoursPerYear: 500,
      traditionalRate: 1200,
      heavy1Rate: 559
    },
    medium: {
      label: 'Medium Operation',
      hoursPerYear: 1000,
      traditionalRate: 1200,
      heavy1Rate: 559
    },
    large: {
      label: 'Large Operation',
      hoursPerYear: 2000,
      traditionalRate: 1200,
      heavy1Rate: 559
    }
  };

  // ============================================
  // Helper: Format number as currency
  // ============================================
  function formatCurrency(num) {
    return '$' + num.toLocaleString('en-US');
  }

  // ============================================
  // Update the cost display for a given scenario
  // ============================================
  function updateScenario(scenarioKey) {
    var data = scenarios[scenarioKey];
    if (!data) return;

    var traditionalAnnual = data.traditionalRate * data.hoursPerYear;
    var heavy1Annual = data.heavy1Rate * data.hoursPerYear;
    var savings = traditionalAnnual - heavy1Annual;

    // Update text elements if they exist
    var savingsEl = document.querySelector('.savings-amount');
    var traditionalEl = document.querySelector('.traditional-cost');
    var heavy1El = document.querySelector('.heavy1-cost');

    if (savingsEl) savingsEl.textContent = formatCurrency(savings) + '/year';
    if (traditionalEl) traditionalEl.textContent = formatCurrency(traditionalAnnual) + '/year';
    if (heavy1El) heavy1El.textContent = formatCurrency(heavy1Annual) + '/year';

    // Update bar widths (traditional = 100%, heavy1 = proportional)
    var barTraditional = document.querySelector('.bar-traditional');
    var barHeavy1 = document.querySelector('.bar-heavy1');

    if (barTraditional) {
      barTraditional.style.width = '100%';
    }
    if (barHeavy1) {
      var proportion = (heavy1Annual / traditionalAnnual) * 100;
      barHeavy1.style.width = proportion.toFixed(1) + '%';
    }
  }

  // ============================================
  // Savings Calculator (input-based)
  // ============================================
  function initSavingsCalculator() {
    var hoursInput = document.getElementById('hours-flown');
    var calcTraditional = document.getElementById('calc-traditional');
    var calcHeavy1 = document.getElementById('calc-heavy1');
    var calcSavings = document.getElementById('calc-savings');

    if (!hoursInput) return;

    function updateCalculator() {
      var hours = parseInt(hoursInput.value, 10);
      if (isNaN(hours) || hours < 1) hours = 0;

      var traditionalCost = hours * 1200;
      var heavy1Cost = hours * 559;
      var savings = traditionalCost - heavy1Cost;

      if (calcTraditional) calcTraditional.textContent = formatCurrency(traditionalCost);
      if (calcHeavy1) calcHeavy1.textContent = formatCurrency(heavy1Cost);
      if (calcSavings) calcSavings.textContent = formatCurrency(savings);
    }

    hoursInput.addEventListener('input', updateCalculator);
    hoursInput.addEventListener('change', updateCalculator);
  }

  // ============================================
  // Scenario Toggle Buttons
  // ============================================
  function initScenarioToggles() {
    var toggleButtons = document.querySelectorAll('.cost-toggle');
    if (toggleButtons.length === 0) return;

    toggleButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        // Remove active from all siblings
        toggleButtons.forEach(function (sibling) {
          sibling.classList.remove('active');
          sibling.setAttribute('aria-pressed', 'false');
        });

        // Set active on clicked button
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        // Update scenario display
        var scenario = btn.getAttribute('data-scenario');
        if (scenario) {
          updateScenario(scenario);
        }
      });
    });

    // Initialize with the currently active button's scenario, defaulting to medium
    var activeBtn = document.querySelector('.cost-toggle.active');
    if (activeBtn) {
      var initialScenario = activeBtn.getAttribute('data-scenario') || 'medium';
      updateScenario(initialScenario);
    } else {
      updateScenario('medium');
    }
  }

  // ============================================
  // Initialize on DOM Ready
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initScenarioToggles();
      initSavingsCalculator();
    });
  } else {
    initScenarioToggles();
    initSavingsCalculator();
  }

})();
