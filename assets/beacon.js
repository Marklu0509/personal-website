// Cookieless, fail-safe analytics beacon.
//   * Random session id per page load (in memory only: no cookie, no storage).
//   * Sends a pageview immediately, so even a bounce is recorded.
//   * Times how long each section is on screen with IntersectionObserver, then
//     flushes one batched dwell payload when the page is hidden or unloaded.
// Must never block rendering or throw into the page.
import { accumulateDwell } from "./dwell.js";

(function () {
  try {
    var sessionId =
      (window.crypto && crypto.randomUUID && crypto.randomUUID()) ||
      Date.now().toString(36) + Math.random().toString(16).slice(2);
    var page = location.pathname;

    function send(payload) {
      try {
        var body = JSON.stringify(payload);
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            "/track",
            new Blob([body], { type: "application/json" }),
          );
        } else {
          fetch("/track", {
            method: "POST",
            body: body,
            keepalive: true,
            headers: { "content-type": "application/json" },
          }).catch(function () {});
        }
      } catch (e) {
        /* never break the page */
      }
    }

    // Pageview.
    send({ session_id: sessionId, page: page });

    // Section dwell.
    var sections = Array.prototype.slice.call(
      document.querySelectorAll(
        "[data-section], main section[id], main .detail-block, .row[id]",
      ),
    );

    if (sections.length && "IntersectionObserver" in window) {
      var events = [];
      var now = function () {
        return (window.performance && performance.now()) || Date.now();
      };
      var nameOf = function (el, i) {
        return el.getAttribute("data-section") || el.id || "section-" + i;
      };

      var names = new Map();
      sections.forEach(function (el, i) {
        names.set(el, nameOf(el, i));
      });

      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            var name = names.get(entry.target);
            events.push({
              section: name,
              type: entry.isIntersecting ? "enter" : "exit",
              t: now(),
            });
          });
        },
        { threshold: 0.5 },
      );
      sections.forEach(function (el) {
        io.observe(el);
      });

      var flushed = false;
      var flush = function () {
        if (flushed) return;
        flushed = true;
        try {
          io.disconnect();
        } catch (e) {}
        // Close out any section still on screen.
        var end = now();
        var open = {};
        events.forEach(function (e) {
          open[e.section] = e.type === "enter";
        });
        Object.keys(open).forEach(function (name) {
          if (open[name]) events.push({ section: name, type: "exit", t: end });
        });

        var dwell = accumulateDwell(events);
        var list = Object.keys(dwell)
          .filter(function (name) {
            return dwell[name] > 0;
          })
          .map(function (name) {
            return { section: name, dwell_ms: dwell[name] };
          });

        if (list.length) send({ session_id: sessionId, page: page, sections: list });
      };

      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") flush();
      });
      window.addEventListener("pagehide", flush);
    }
  } catch (e) {
    // Analytics must never break the page.
  }
})();
