/* EVHub core v3 — state, i18n, router, shared UI */
"use strict";

const State = {
  lang: localStorage.getItem("evhub.lang") || "ar",
  theme: localStorage.getItem("evhub.theme") || "light",
  saved: JSON.parse(localStorage.getItem("evhub.saved") || "[]"),
  compare: JSON.parse(localStorage.getItem("evhub.compare") || "[]"),
  myVehicle: localStorage.getItem("evhub.myVehicle") || "",
  myCity: localStorage.getItem("evhub.myCity") || "riyadh",
  alerts: JSON.parse(localStorage.getItem("evhub.alerts") || "{}"),
  compatOn: localStorage.getItem("evhub.compatOn") !== "0",
};
function persist(){
  localStorage.setItem("evhub.saved", JSON.stringify(State.saved));
  localStorage.setItem("evhub.compare", JSON.stringify(State.compare));
  localStorage.setItem("evhub.myVehicle", State.myVehicle);
  localStorage.setItem("evhub.myCity", State.myCity);
  localStorage.setItem("evhub.alerts", JSON.stringify(State.alerts));
  localStorage.setItem("evhub.compatOn", State.compatOn ? "1" : "0");
}

/* i18n */
const t = k => (I18N[State.lang] && I18N[State.lang][k]) ?? I18N.ar[k] ?? k;
const LOC = obj => (obj && typeof obj === "object") ? (obj[State.lang] ?? obj.ar) : obj;
const fmtN = n => Number(n).toLocaleString("en-US");
const SAR = n => `${fmtN(Math.round(n))} ${t("sar")}`;
const cityName = id => { const c = DB.CITIES.find(c => c.id === id); return c ? LOC(c) : id; };
const vName = v => `${v.brand} ${LOC(v.model)}`;

function applyLang(){
  document.documentElement.lang = State.lang;
  document.documentElement.dir = State.lang === "ar" ? "rtl" : "ltr";
  document.getElementById("langLabel").textContent = State.lang === "ar" ? "EN" : "ع";
  document.querySelectorAll("[data-i18n]").forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  document.title = State.lang === "ar" ? "EVHub — سوق التنقّل الكهربائي في السعودية" : "EVHub — Saudi EV Marketplace";
}
function applyTheme(){ document.documentElement.dataset.theme = State.theme; }

/* Toast + modal */
function toast(msg, ms = 3200){
  const el = document.createElement("div");
  el.className = "toast"; el.innerHTML = msg;
  document.getElementById("toastRoot").appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; setTimeout(() => el.remove(), 320); }, ms);
}
function openModal(title, bodyHTML, onMount){
  const root = document.getElementById("modalRoot");
  root.innerHTML = `<div class="modal-back" id="modalBack">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head"><h3>${title}</h3>
        <button class="iconbtn" id="modalClose" aria-label="${t("close")}">✕</button></div>
      <div class="modal-body">${bodyHTML}</div>
    </div></div>`;
  root.querySelector("#modalClose").onclick = closeModal;
  root.querySelector("#modalBack").addEventListener("click", e => { if (e.target.id === "modalBack") closeModal(); });
  if (onMount) onMount(root);
}
function closeModal(){ document.getElementById("modalRoot").innerHTML = ""; }

/* ── media helpers ── */
function vehiclePhoto(v, cls = ""){
  const [c1, c2] = v.mono || ["#5b6d65", "#2c3a33"];
  return `<span class="vcard-media ${cls}" style="background:linear-gradient(140deg,${c1},${c2})">
    <img src="${v.img?.src || ""}" alt="${vName(v)}" loading="lazy"
      onerror="this.parentElement.classList.add('noimg')">
    <span class="mono-fb">${v.brand}</span>
    ${v.img ? `<span class="img-credit">${v.img.credit}</span>` : ""}
  </span>`;
}

/* icons */
const IC = {
  bolt:'<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M13 2 4.5 13.5H11l-1 8.5L18.5 10.5H12z"/></svg>',
  range:'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  batt:'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="2.5" y="8" width="17" height="9" rx="2"/><path d="M21.5 11v3"/><rect x="5" y="10.5" width="7" height="4" rx="1" fill="currentColor" stroke="none"/></svg>',
  gauge:'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 14a8 8 0 1 1 16 0"/><path d="M12 14 15.5 9"/></svg>',
  pin:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  shield:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v5c0 4.4 3 8 7 10 4-2 7-5.6 7-10V6z"/><path d="m9 11.5 2.2 2.2L15.5 9.5"/></svg>',
  heart:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7.5-4.8-9.3-9.1C1.3 7.5 3.6 4.5 6.9 4.5c2 0 3.7 1.1 5.1 3 1.4-1.9 3.1-3 5.1-3 3.3 0 5.6 3 4.2 6.4C19.5 15.2 12 20 12 20z"/></svg>',
  star:'<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
  spark:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="3.4"/></svg>',
  plug:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0zM12 16v5"/></svg>',
  chart:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 20V6M4 20h16"/><path d="m7 14 4-4 3 3 5-6"/></svg>',
  users:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c1-2.8 3-4.2 5.5-4.2s4.5 1.4 5.5 4.2"/><circle cx="17" cy="9.5" r="2.6"/><path d="M16 14.9c2.2.2 3.8 1.5 4.5 3.6"/></svg>',
  wrench:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6.5a4 4 0 0 0-5.4 4.8L3.5 17a2.1 2.1 0 0 0 3 3l5.7-5.6a4 4 0 0 0 4.8-5.4l-2.7 2.7-2.5-.7-.7-2.5z"/></svg>',
  car:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v-3l2-5.5A2 2 0 0 1 7.9 6h8.2a2 2 0 0 1 1.9 1.5L20 13v3"/><path d="M4 13h16M6.5 16.5a1.5 1.5 0 1 0 .01 0M17.5 16.5a1.5 1.5 0 1 0 .01 0"/></svg>',
  moto:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17" r="2.8"/><circle cx="18.5" cy="17" r="2.8"/><path d="M5.5 17 9 10h4l3 4h2.5M13 10l-1.5-3H9"/></svg>',
  bike:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17" r="3"/><circle cx="18.5" cy="17" r="3"/><path d="M5.5 17 10 9h5l3.5 8M10 9 8.5 6H11"/></svg>',
  scooter:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5h3l3 11h4M5 19h0M8 5 7 3"/><circle cx="5.5" cy="19" r="2.3"/><circle cx="18.5" cy="19" r="2.3"/></svg>',
  truck:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6h11v10h-11zM13.5 9h4l3 3.5V16h-7"/><circle cx="7" cy="17.8" r="1.9"/><circle cx="17" cy="17.8" r="1.9"/></svg>',
  home:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 10.5 12 3.5l8.5 7v9a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/></svg>',
  scale:'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M8 20h8M6 7l6-3 6 3M6 7l-2.5 6a3 3 0 0 0 5 0zM18 7l-2.5 6a3 3 0 0 0 5 0z"/></svg>',
  check:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  clock:'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  tg:'<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M21.9 4.6 19 19.3c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.6L18.6 7c.4-.3-.1-.5-.6-.2L7.6 13.3l-4.4-1.4c-1-.3-1-1 .2-1.4L20.6 3.2c.8-.3 1.5.2 1.3 1.4z"/></svg>',
  cam:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="m8 7 1.5-2.5h5L16 7"/><circle cx="12" cy="13.5" r="3.5"/></svg>',
  sun:'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/></svg>',
  bulb:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21h6M10 17.5h4M12 3a6 6 0 0 0-3.5 10.9c.8.6 1.5 1.6 1.5 2.6h4c0-1 .7-2 1.5-2.6A6 6 0 0 0 12 3z"/></svg>',
  target:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
  cal:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  leaf:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20C5 10 10 5 20 4c1 10-4 15-13 15"/><path d="M5 20c2-5 5-8 10-10"/></svg>',
};

/* interactions */
function isSaved(id){ return State.saved.includes(id); }
function toggleSave(id, btn){
  const i = State.saved.indexOf(id);
  if (i >= 0){ State.saved.splice(i, 1); toast(t("unsaved")); }
  else { State.saved.push(id); toast(t("saved")); }
  persist();
  if (btn) btn.classList.toggle("on", isSaved(id));
}
function toggleCompare(id){
  const i = State.compare.indexOf(id);
  if (i >= 0) State.compare.splice(i, 1);
  else {
    if (State.compare.length >= 4){ toast(t("maxCompare")); return; }
    State.compare.push(id);
  }
  persist();
}
function finMonthly(price){ return Math.round(price * 1.04 / 60); }

/* vehicle card */
function vehicleCard(v){
  const badges = [];
  if (v.verified) badges.push(`<span class="badge badge-verified">${IC.shield} ${t("vd.verified")}</span>`);
  if (v.cond === "new") badges.push(`<span class="badge badge-new">${t("vd.newBadge")}</span>`);
  else if (v.inspected) badges.push(`<span class="badge badge-gold">${IC.check} ${t("vd.inspected")}</span>`);
  const specs = v.cat === "car"
    ? `<span class="vspec">${IC.range} <span class="num">${fmtN(v.range)}</span> ${t("km")}</span>
       <span class="vspec">${IC.bolt} <span class="num">${v.dc}</span> ${t("kw")}</span>
       <span class="vspec">${IC.gauge} <span class="num">${fmtN(v.odo)}</span> ${t("km")}</span>`
    : `<span class="vspec">${IC.range} <span class="num">${fmtN(v.range)}</span> ${t("km")}</span>
       <span class="vspec">${IC.batt} <span class="num">${v.batt}</span> ${t("kwh")}</span>`;
  const soh = (v.cond === "used" && v.cat === "car")
    ? `<div class="soh"><span style="font-size:.72rem;color:var(--ink-3);font-weight:700">${t("vd.soh")}</span>
       <div class="soh-track"><div class="soh-fill ${v.soh>=90?"ok":v.soh>=80?"mid":"low"}" style="width:${v.soh}%"></div></div>
       <span class="soh-val num">${v.soh}%</span></div>` : "";
  return `<article class="card hov vcard">
    <a href="#/vehicle/${v.id}" style="display:block;position:relative">
      ${vehiclePhoto(v)}
      <div class="vcard-badges">${badges.join("")}</div>
    </a>
    <button class="vcard-fav ${isSaved(v.id) ? "on" : ""}" data-fav="${v.id}" aria-label="${t("vd.actSave")}">${IC.heart}</button>
    <a href="#/vehicle/${v.id}" class="vcard-body">
      <div class="vcard-title">
        <h3>${vName(v)}<br><span class="yr num">${v.year} · ${v.cond === "new" ? t("mk.condNew") : t("mk.condUsed")}</span></h3>
        <div class="vcard-price"><b class="num">${SAR(v.price)}</b>${v.cat === "car" ? `<small class="num">${SAR(finMonthly(v.price))} ${t("perMonth")}</small>` : ""}</div>
      </div>
      <div class="vspecs">${specs}</div>
      ${soh}
      <div class="vcard-foot">
        <span style="display:inline-flex;align-items:center;gap:5px">${IC.pin} ${cityName(v.city)}</span>
        <span class="chip chip-btn ${State.compare.includes(v.id) ? "on" : ""}" data-cmp="${v.id}">${IC.scale} ${State.compare.includes(v.id) ? t("mk.inCompare") : t("mk.compare")}</span>
      </div>
    </a>
  </article>`;
}
function bindCards(container){
  container.querySelectorAll("[data-fav]").forEach(b => b.addEventListener("click", e => {
    e.preventDefault(); e.stopPropagation(); toggleSave(b.dataset.fav, b);
  }));
  container.querySelectorAll("[data-cmp]").forEach(b => b.addEventListener("click", e => {
    e.preventDefault(); e.stopPropagation(); toggleCompare(b.dataset.cmp);
    b.classList.toggle("on", State.compare.includes(b.dataset.cmp));
    b.innerHTML = `${IC.scale} ${State.compare.includes(b.dataset.cmp) ? t("mk.inCompare") : t("mk.compare")}`;
  }));
}

/* range model */
function realRange(v, {tempC = 45, style = 1, acLevel = 3, load = 1, terrain = 0, speed = 110} = {}){
  let f = 1;
  if (tempC >= 45) f -= 0.20; else if (tempC >= 40) f -= 0.15; else if (tempC >= 35) f -= 0.10; else if (tempC <= 5) f -= 0.15;
  f -= [0, 0.04, 0.09][style] ?? 0.04;
  f -= [0.02, 0.05, 0.08][acLevel - 1] ?? 0.05;
  f -= [0, 0.03, 0.07][load] ?? 0;
  f -= terrain ? 0.08 : 0;
  if (speed > 120) f -= 0.11; else if (speed > 100) f -= 0.05;
  if (v.rangeStd === "CLTC") f -= 0.11;
  return Math.max(60, Math.round(v.range * f));
}
function distKm(a, b){
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180) * Math.cos(b.lat*Math.PI/180) * Math.sin(dLng/2)**2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 1.25);
}

/* degradation model (used by detail + account) */
function degradationModel(v, cityId, {kmDay = 38, daysWeek = 4, fastPct = 20, parkSun = 1} = {}){
  const hotCities = ["riyadh","makkah","madinah","dammam","khobar","jubail","hofuf","yanbu","jizan","buraydah","tabuk"];
  const hot = hotCities.includes(cityId);
  const kmYear = Math.round(kmDay * daysWeek * 52);
  let annual = 0.55;                                  // calendar aging base %/yr
  annual += hot ? 0.35 : 0.15;                        // climate
  annual += Math.min(1.2, kmYear / 20000 * 0.45);     // cycling
  annual += fastPct / 100 * 0.5;                      // fast charging
  annual += [0, 0.12, 0.28][parkSun] ?? 0.12;         // heat soak while parked
  if (["BYD","GAC Aion"].includes(v.brand)) annual -= 0.3;  // LFP chemistry
  annual = Math.max(0.5, +annual.toFixed(2));
  const at = y => Math.max(60, +(v.soh - annual * y * (1 + y * 0.025)).toFixed(1));
  const to70 = annual > 0 ? Math.max(1, Math.round((v.soh - 70) / annual)) : 99;
  return {annual, kmYear, y3: at(3), y5: at(5), to70, pts:[0,1,2,3,4,5,6,7,8].map(at)};
}

/* reveal on scroll */
let revealObs;
function initReveals(root){
  if (!("IntersectionObserver" in window)){ root.querySelectorAll(".reveal").forEach(el => el.classList.add("vis")); return; }
  revealObs?.disconnect();
  revealObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add("vis"); revealObs.unobserve(e.target); } }), {threshold:.07});
  root.querySelectorAll(".reveal").forEach(el => revealObs.observe(el));
}

/* footer */
function footerHTML(){
  return `<footer class="site"><div class="wrap">
    <div class="foot-grid">
      <div>
        <div class="brand" style="margin-bottom:14px"><span class="brand-mark"><svg viewBox="0 0 32 32" width="26" height="26"><path d="M6 7h13l-2.6 4.5H11l-1.2 2h8.4L15.6 18H8.2L6 22h11.8" fill="none" stroke="#c9f158" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 5l6 10-3.4 12" fill="none" stroke="#c9f158" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <span style="color:#fff;font-weight:700;font-size:1.25rem">EVHub</span></div>
        <p style="font-size:.86rem;line-height:1.8">${t("ft.about")}</p>
      </div>
      <div><h4>${t("ft.market")}</h4>
        <a href="#/market?cat=car">${t("cat.car")}</a><a href="#/market?cat=motorcycle">${t("cat.motorcycle")}</a>
        <a href="#/market?cat=charger">${t("cat.charger")}</a><a href="#/market?cat=parts">${t("cat.parts")}</a></div>
      <div><h4>${t("ft.tools")}</h4>
        <a href="#/tools/finder">${t("tl.finder")}</a><a href="#/tools/range">${t("tl.range")}</a>
        <a href="#/compare">${t("tl.cmp")}</a><a href="#/tools/tco">${t("tl.tco")}</a></div>
      <div><h4>${t("ft.company")}</h4>
        <a href="#/community">${t("nav.community")}</a><a href="#/services">${t("nav.services")}</a>
        <a href="#/sell">${State.lang==="ar"?"أضف إعلانك":"Sell your EV"}</a><a href="#/account">${t("nav.account")}</a></div>
    </div>
    <div class="foot-note"><span>${t("ft.rights")} · ${t("ft.pdpl")}</span><span>${t("ft.demo")} · <b class="num">build v3.5</b></span></div>
  </div></footer>`;
}

/* router */
const Routes = {};
function navigate(){
  const hash = location.hash.slice(2) || "";
  const [pathRaw, query] = hash.split("?");
  const parts = pathRaw.split("/").filter(Boolean);
  const page = parts[0] || "home";
  const params = new URLSearchParams(query || "");
  const app = document.getElementById("app");
  window.scrollTo({top:0});
  const fn = Routes[page] || Routes.home;
  app.innerHTML = "";
  fn(app, parts.slice(1), params);
  applyLang();
  document.querySelectorAll("[data-route]").forEach(a => a.classList.toggle("active", a.dataset.route === page || (page === "home" && a.dataset.route === "home")));
  initReveals(app);
}
