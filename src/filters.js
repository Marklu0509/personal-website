// Coarse bot/crawler detection from the User-Agent. Real browsers always send
// a UA and run JS to fire the beacon; automated clients that do reach /track
// are dropped so engagement data reflects humans. Best-effort, no IP involved.
const BOT_UA =
  /(bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|pinterest|redditbot|whatsapp|telegram|slackbot|discordbot|headlesschrome|phantomjs|python-requests|curl|wget|axios|go-http-client|node-fetch|okhttp|java\/|libwww|lighthouse|pingdom|uptimerobot|gtmetrix|semrush|ahrefs|dataprovider)/i;

export function isBot(userAgent) {
  if (!userAgent) return true; // a human browser always sends a User-Agent
  return BOT_UA.test(userAgent);
}
