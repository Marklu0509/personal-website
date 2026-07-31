// Cookieless, fail-safe analytics beacon.
// Generates a random session id per page load (kept only in memory — no
// cookie, no localStorage) and reports a single pageview. Must never block
// rendering or throw into the page.
(function () {
  try {
    var sessionId =
      (window.crypto && crypto.randomUUID && crypto.randomUUID()) ||
      Date.now().toString(36) + Math.random().toString(16).slice(2);

    var payload = JSON.stringify({
      session_id: sessionId,
      page: location.pathname,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/track",
        new Blob([payload], { type: "application/json" }),
      );
    } else {
      fetch("/track", {
        method: "POST",
        body: payload,
        keepalive: true,
        headers: { "content-type": "application/json" },
      }).catch(function () {});
    }
  } catch (e) {
    // Analytics must never break the page.
  }
})();
