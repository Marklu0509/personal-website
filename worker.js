import { handleTrack } from "./src/track.js";

// Workers entry. Static files are served by the assets layer before this runs,
// so the Worker only sees dynamic routes. Anything it doesn't handle falls
// through to the assets binding (which also produces the 404 response).
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/track") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }
      return handleTrack(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
