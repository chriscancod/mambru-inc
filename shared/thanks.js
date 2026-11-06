// Stores no email or signup details. A short-lived, one-use receipt is UI state only.
(function () {
  'use strict';
  var KEY = 'veynor.waitlist.receipt.v1';
  var BRANDS = { charm: true, solis: true, veynor: true };
  function brand(value) { return Object.prototype.hasOwnProperty.call(BRANDS, value) ? value : 'veynor'; }
  function remember(value) {
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify({ brand: brand(value), at: Date.now() }));
      return true;
    } catch (_) { return false; }
  }
  function take() {
    try {
      var raw = window.sessionStorage.getItem(KEY);
      window.sessionStorage.removeItem(KEY);
      var receipt = JSON.parse(raw);
      if (!receipt || !Object.prototype.hasOwnProperty.call(BRANDS, receipt.brand) ||
          typeof receipt.at !== 'number' || Date.now() < receipt.at || Date.now() - receipt.at > 5 * 60 * 1000) return null;
      return receipt.brand;
    } catch (_) { return null; }
  }
  window.VeynorThanks = {
    // Only called after HTTP success AND the backend's explicit boolean success.
    afterWaitlist: function (form) {
      if (!remember(form.getAttribute('data-waitlist-brand'))) return false;
      window.location.assign('thank-you.html');
      return true;
    }
  };
  if (!document.querySelector('[data-waitlist-thanks]')) return;
  // Neither query strings nor fragments can confirm signup or select a destination.
  if (window.location.search || window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname);
  }
  var source = take();
  if (!source) return;
  var names = { charm: 'Veynor Charm', solis: 'Veynor Solis', veynor: 'Veynor' };
  var links = { charm: 'charm.html', solis: 'solis.html', veynor: 'index.html' };
  document.querySelector('[data-thanks-title]').textContent = "You're on the Veynor list.";
  document.querySelector('[data-thanks-copy]').textContent = "Thanks for following " + names[source] + ". We'll email you Veynor development updates. This isn't a preorder, and no payment was taken.";
  var back = document.querySelector('[data-thanks-back]');
  back.href = links[source];
  back.textContent = source === 'veynor' ? 'Explore Veynor' : 'Back to ' + names[source];
  document.title = 'Thanks for joining — Veynor';
})();
