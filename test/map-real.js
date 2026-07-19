/* REAL integration test: actual vendored Leaflet 1.9.4 + actual app code in jsdom.
   Asserts maps truly initialize: panes, tiles requested, pins, range circles. */
const {JSDOM} = require("/tmp/node_modules/jsdom");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8")
  .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, "")
  .replace(/<script>[\s\S]*?<\/script>/g, "")
  .replace(/<link rel="stylesheet"[^>]*>/g, "");

const dom = new JSDOM(html, {url:"http://localhost/#/", runScripts:"outside-only", pretendToBeVisual:true});
const {window} = dom;
window.matchMedia = window.matchMedia || (() => ({matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}}));
window.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
window.scrollTo = () => {};
window.Element.prototype.scrollIntoView = function(){};
// jsdom has no layout: give every element a real size so Leaflet computes tile grids
window.Element.prototype.getBoundingClientRect = function(){
  return {x:0, y:0, top:0, left:0, right:900, bottom:560, width:900, height:560};
};
window.navigator.geolocation = {getCurrentPosition:(ok) => ok({coords:{latitude:24.7, longitude:46.7}})};

const errors = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  // 1) REAL Leaflet
  try {
    window.eval(fs.readFileSync("/sessions/determined-upbeat-allen/mnt/EVHUB/Media/vendor/leaflet/leaflet.js", "utf8"));
  } catch(e){ console.log("REAL LEAFLET FAILED TO LOAD: " + e.message); process.exit(1); }
  if (!window.L || typeof window.L.map !== "function"){ console.log("Leaflet not on window"); process.exit(1); }

  // 2) real app bundle
  const files = ["i18n.js","data.js","core.js","home.js","market.js","detail.js","charging.js","tools.js","misc.js","app.js"];
  const bundle = files.map(f => fs.readFileSync(path.join(root, "js", f), "utf8").replace(/^"use strict";/m, "")).join("\n;\n");
  try { window.eval(bundle); } catch(e){ console.log("BUNDLE ERROR: " + e.message); process.exit(1); }

  // shadow check with REAL leaflet present
  const shadow = window.eval("typeof L !== 'undefined' && typeof L.map === 'function'");
  if (!shadow) errors.push("global L is not Leaflet inside app scope");

  const go = async (route) => { window.location.hash = route; window.eval("navigate()"); await sleep(700); };

  // 3) charging map
  await go("#/charging");
  const doc = window.document;
  let containers = doc.querySelectorAll(".leaflet-container").length;
  let tiles = doc.querySelectorAll(".leaflet-tile").length;
  let pins = doc.querySelectorAll(".ev-pin").length;
  if (!containers) errors.push("charging: no .leaflet-container created");
  if (!tiles) errors.push("charging: no tiles requested (tiles=0)");
  if (pins < 5) errors.push("charging: station pins missing (pins=" + pins + ")");
  console.log(`charging map → containers:${containers} tiles:${tiles} station-pins:${pins}`);

  // 4) range tool map with the two circles
  await go("#/tools/range");
  containers = doc.querySelectorAll(".leaflet-container").length;
  tiles = doc.querySelectorAll(".leaflet-tile").length;
  const circles = doc.querySelectorAll("path.leaflet-interactive").length;
  if (!containers) errors.push("range: no .leaflet-container");
  if (circles < 2) errors.push("range: expected 2 range circles, got " + circles);
  console.log(`range map    → containers:${containers} tiles:${tiles} vector-paths:${circles}`);

  // 5) vehicle-page embedded map
  await go("#/vehicle/tesla-my");
  const dContainers = doc.querySelectorAll("#dRangeWidget .leaflet-container").length;
  const dCircles = doc.querySelectorAll("#dRangeWidget path.leaflet-interactive").length;
  if (!dContainers) errors.push("detail: embedded map missing");
  if (dCircles < 2) errors.push("detail: embedded circles missing (" + dCircles + ")");
  console.log(`detail map   → containers:${dContainers} vector-paths:${dCircles}`);

  if (errors.length){ console.log("FAILURES:\n" + errors.join("\n")); process.exit(1); }
  console.log("REAL-LEAFLET INTEGRATION: ALL MAPS INITIALIZE ✓");
  process.exit(0);
})();
