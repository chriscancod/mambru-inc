// Veynor waitlist form: sends ONE email address to the existing waitlist server (veynor-backend, POST /api/drop-signup). Nothing else is collected and nothing is charged.
// Same request as mambru-inc/shared/site.js; the invisible bot check (captcha.js) is optional: if it is missing the server decides.
(function () {
  var BACKEND = 'https://veynor-backend-production.up.railway.app';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  document.querySelectorAll('form[data-waitlist]').forEach(function (f) {
    if (window.VeynorCaptcha) window.VeynorCaptcha.watch(f, BACKEND, 'signup');
    f.addEventListener('submit', async function (e) {
      e.preventDefault();
      var input = f.querySelector('input[type=email]'), btn = f.querySelector('button'), status = f.parentElement.querySelector('.wl-status');
      var email = input.value.trim();
      function say(t, ok) { status.textContent = t; status.className = 'fine wl-status ' + (ok ? 'ok' : 'err'); }
      if (!EMAIL_RE.test(email)) return say('Please enter a valid email address.', false);
      btn.disabled = true;
      try {
        var extra = window.VeynorCaptcha ? await window.VeynorCaptcha.fields(f) : {};
        var r = await fetch(BACKEND + '/api/drop-signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ email: email }, extra)) });
        var d = await r.json();
        if (!d.success) throw new Error(d.error === 'Invalid email' ? 'That email does not look right.' : 'Could not join just now. Please try again later.');
        say("You're on the list. We will email you real progress only.", true); input.value = '';
      } catch (err) { say(err.message || 'Could not join just now. Please try again later.', false); }
      btn.disabled = false;
    });
  });
})();
