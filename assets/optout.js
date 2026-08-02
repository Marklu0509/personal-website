// Owner opt-out. Visiting any page with `?me=1` sets a persistent flag so the
// site owner's own visits are never counted. Chosen deliberately over IP-based
// exclusion so no personal data is involved. Once set, the beacon sends nothing.
//
//   search:  location.search (e.g. "?me=1")
//   storage: a Storage-like object (localStorage)
//   returns: true if this visitor is opted out
export function updateAndCheckOptOut(search, storage) {
  try {
    if (/[?&]me=1(?:&|$)/.test(search || "")) {
      storage.setItem("mlu_optout", "1");
    }
    return storage.getItem("mlu_optout") === "1";
  } catch (e) {
    return false; // storage blocked -> don't suppress a real visitor
  }
}
