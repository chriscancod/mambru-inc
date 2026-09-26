// Drop-in analytics for a static website (2AM store, Veynor site). Add ONE tag
// per page:
//   <script defer src="analytics-web.js" data-source="2am-store"></script>
// data-source must be one of: 2am-store, veynor-site.
// No cookies, no local storage, no fingerprinting. It sends the page path and
// the referrer's host, and nothing when the visitor has Do Not Track on.
(function () {
  var tag = document.currentScript;
  var source = tag && tag.getAttribute('data-source');
  if (!source || navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;
  var url = (tag.getAttribute('data-endpoint') || 'https://mega-backend-production.up.railway.app') + '/api/analytics/event';
  function send(event, name) {
    var body = JSON.stringify({ source: source, event: event, name: name || location.pathname, referrer: document.referrer });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      else fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: body, keepalive: true });
    } catch (e) { /* analytics must never break the page */ }
  }
  send('pageview');
  window.vtrack = send; // vtrack('add_to_cart', 'product-12')
})();
