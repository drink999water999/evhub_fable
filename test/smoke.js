/* EVHub v3 smoke test — renders every route in jsdom, both languages */
const {JSDOM} = require("/tmp/node_modules/jsdom");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8")
  .replace(/<script src="[^"]*"><\/script>/g, "")
  .replace(/<link rel="stylesheet" href="[^"]*leaflet[^"]*">/, "");

const dom = new JSDOM(html, {url:"http://localhost/#/", runScripts:"outside-only", pretendToBeVisual:true});
const {window} = dom;
window.matchMedia = window.matchMedia || (() => ({matches:false, addListener(){}, removeListener(){}}));
const layerStub = () => ({addTo(){return this}, bindPopup(){return this}, bindTooltip(){return this}, on(){return this}, remove(){}, setView(){return this}});
window.L = {
  map: () => ({setView(){return this}, flyTo(){}, remove(){}, on(){return this}, removeLayer(){return this},
    invalidateSize(){}, getContainer(){ return window.document.createElement("div"); }}),
  tileLayer: () => layerStub(), marker: () => layerStub(), circle: () => layerStub(),
  circleMarker: () => layerStub(), divIcon: (o) => o, polygon: () => layerStub(),
  control: () => ({onAdd:null, addTo(){return this}}),
  DomUtil: {create: (tag) => window.document.createElement(tag || "div")},
};
window.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
window.scrollTo = () => {};
window.Element.prototype.scrollIntoView = window.Element.prototype.scrollIntoView || function(){};
window.navigator.geolocation = {getCurrentPosition:(ok) => ok({coords:{latitude:24.7, longitude:46.7}})};

const files = ["i18n.js","data.js","core.js","home.js","market.js","detail.js","charging.js","tools.js","misc.js","app.js"];
let bundle = files.map(f => fs.readFileSync(path.join(root, "js", f), "utf8").replace(/^"use strict";/m, "")).join("\n;\n");

const driver = `
window.__errors = [];
window.__count = 0;
const routes = ["#/","#/market","#/market?cat=charger","#/market?brand=Tesla","#/vehicle/tesla-my","#/vehicle/zeekr-001","#/vehicle/lucid-air","#/vehicle/livewire",
  "#/charging","#/charging?tab=p2p","#/tools","#/tools/finder","#/tools/range","#/compare",
  "#/tools/lab","#/tools/tco","#/tools/bundle","#/tools/sim","#/tools/ar",
  "#/services","#/community","#/account","#/account/saved","#/account/alerts","#/account/settings","#/sell"];
function go(route){
  location.hash = route;
  try { navigate(); } catch(e){ window.__errors.push(route + " [" + State.lang + "]: " + e.message); return; }
  const len = document.getElementById("app").innerHTML.length;
  if (len < 400) window.__errors.push(route + " [" + State.lang + "]: small render (" + len + ")");
  window.__count++;
}
/* CRITICAL: the global L must still be Leaflet — never shadowed by app code */
try {
  if (typeof L === "undefined" || typeof L.map !== "function")
    window.__errors.push("Leaflet global 'L' is shadowed or missing! typeof L.map = " + (typeof L !== "undefined" ? typeof L.map : "no L"));
} catch(e){ window.__errors.push("Leaflet global check failed: " + e.message); }

applyTheme(); applyLang();
for (const r of routes) go(r);
State.lang = "en"; applyLang();
for (const r of routes) go(r);
State.lang = "ar"; applyLang();

// battery predictor interaction
location.hash = "#/vehicle/zeekr-001"; navigate();
const preset = document.querySelector("[data-preset='heavy']");
if (!preset) window.__errors.push("detail: no presets");
else { preset.click();
  const res = document.getElementById("btResult");
  if (!res || !/%/.test(res.textContent)) window.__errors.push("detail: predictor result empty");
}
// range widget on detail
if (!document.querySelector("#dRangeWidget .map-box")) window.__errors.push("detail: range widget missing");
const owKm = document.querySelector('#dRangeWidget [data-r="owKm"]');
if (!owKm || !/\\d/.test(owKm.textContent)) window.__errors.push("detail: one-way km not computed");

// compare-4 flow
State.compare = []; persist();
["tesla-my","zeekr-001","lucid-air","kia-ev6"].forEach(toggleCompare);
if (State.compare.length !== 4) window.__errors.push("compare: couldn't add 4");
toggleCompare("bmw-ix");
if (State.compare.length !== 4) window.__errors.push("compare: limit-4 not enforced");
location.hash = "#/compare"; navigate();
const ths = document.querySelectorAll(".cmp-table thead th").length;
if (ths < 5) window.__errors.push("compare: expected 4 vehicle columns, ths=" + ths);
if (!document.querySelector(".cmp-best")) window.__errors.push("compare: no best highlights");
const rmBtn = document.querySelector("[data-rm]");
rmBtn && rmBtn.click();
if (State.compare.length !== 3) window.__errors.push("compare: remove failed");

// range tool geolocation
location.hash = "#/tools/range"; navigate();
const locBtn = document.querySelector('[data-r="loc"]');
if (!locBtn) window.__errors.push("range: no location button");
else locBtn.click();

// finder walk-through
location.hash = "#/tools/finder"; navigate();
const wiz = document.getElementById("wiz");
for (let s = 0; s < 5; s++){
  const opt = wiz.querySelector(".wiz-opt");
  if (!opt){ window.__errors.push("finder: no options at step " + s); break; }
  opt.click(); wiz.querySelector("#wNext").click();
}
if (!wiz.querySelector(".vcard")) window.__errors.push("finder: no results");

// P2P booking
location.hash = "#/charging?tab=p2p"; navigate();
const host = document.querySelector(".host-card");
if (host){
  const slot = host.querySelector(".slot:not(.off)");
  slot.click(); host.querySelector("[data-book]").click();
  if (!document.getElementById("payBook")) window.__errors.push("p2p: booking modal missing");
  else document.getElementById("payBook").click();
} else window.__errors.push("p2p: no host cards");

// TCO computed
location.hash = "#/tools/tco"; navigate();
const s5 = document.getElementById("tcSave5");
if (!s5 || !/\\d/.test(s5.textContent)) window.__errors.push("tco: no result");
`;
try { window.eval(bundle + "\n;\n" + driver); }
catch(e){ console.log("BUNDLE ERROR: " + e.stack.split("\n").slice(0, 5).join("\n")); process.exit(1); }

const errors = window.__errors || [];
if (errors.length){ console.log("FAILURES:\n" + errors.join("\n")); process.exit(1); }
console.log("ALL PASS — " + window.__count + " route renders + predictor, range map, compare-4, finder, P2P, TCO interactions OK");
