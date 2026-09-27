/* global window */
// GA4 bootstrap for kbbqguide.com.
//
// A same-origin file rather than an inline <script>, so the site's CSP can keep
// script-src to 'self' plus exact hashes (no 'unsafe-inline', no new hash).
// The gtag.js loader is the separate <script async> tag in BaseLayout.astro.
window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'G-PD2CXJ4Z0C');
