/* EVHub — Charging: public stations map + P2P community charging */
"use strict";

const CH = { tab:"public", city:"all", minPower:0, sel:null, p2pCity:"all" };
let chMap = null, chMarkers = [];

Routes.charging = (app, parts, params) => {
  if (params.get("tab")) CH.tab = params.get("tab");
  app.innerHTML = `<div class="page wrap">
    <div class="crumbs"><a href="#/">${t("nav.home")}</a> ‹ <span>${t("ch.title")}</span></div>
    <div class="tool-hero">
      <h1>${t("ch.title")}</h1><p>${t("ch.sub")}</p>
      <div class="seg" style="margin-top:14px">
        <button data-seg="public" class="${CH.tab==="public"?"on":""}">${IC.bolt} ${t("ch.tabPublic")}</button>
        <button data-seg="p2p" class="${CH.tab==="p2p"?"on":""}">${IC.users} ${t("ch.tabP2P")}</button>
      </div>
    </div>
    <div id="chBody"></div>
    ${footerHTML()}
  </div>`;
  app.querySelectorAll("[data-seg]").forEach(b => b.addEventListener("click", () => {
    CH.tab = b.dataset.seg;
    app.querySelectorAll("[data-seg]").forEach(x => x.classList.toggle("on", x === b));
    renderChBody(app);
  }));
  renderChBody(app, params.get("host") === "1");
};

function renderChBody(app, scrollHost){
  const body = app.querySelector("#chBody");
  if (CH.tab === "public") renderStations(body);
  else renderP2P(body, scrollHost);
}

/* ── Public stations ── */
function renderStations(body){
  chMap = null; chMarkers = []; // fresh DOM each render
  body.innerHTML = `
    <div class="card" style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:18px;align-items:flex-end;padding:16px 20px;overflow:visible">
      <div class="selrow" style="min-width:180px;flex:1;max-width:260px"><label>${t("ch.fCity")}</label>
        <select id="stCity"><option value="all">${t("mk.allCities")}</option>
          ${DB.CITIES.filter(c => DB.STATIONS.some(s => s.city === c.id)).map(c => `<option value="${c.id}" ${CH.city===c.id?"selected":""}>${LOC(c)}</option>`).join("")}</select></div>
      <div class="selrow" style="min-width:180px;flex:1;max-width:260px"><label>${t("ch.fPower")}</label>
        <select id="stPower">
          ${[0,60,120,180,350].map(p => `<option value="${p}" ${CH.minPower===p?"selected":""}>${p ? `≥ ${p} ${t("kw")}` : (State.lang==="ar"?"أي قدرة":"Any power")}</option>`).join("")}</select></div>
      <span class="chip on num" id="stCount" style="margin-bottom:6px"></span>
    </div>
    <div class="map-layout">
      <div class="station-list" id="stList"></div>
      <div class="map-box"><div id="stMap" style="width:100%;height:100%"></div></div>
    </div>`;
  body.querySelector("#stCity").addEventListener("change", e => { CH.city = e.target.value; updateStations(body); });
  body.querySelector("#stPower").addEventListener("change", e => { CH.minPower = +e.target.value; updateStations(body); });

  // map init
  setTimeout(() => {
    if (!body.isConnected || !document.getElementById("stMap")) return; // stale render
    try {
      const m = L_map("stMap", [24.2, 45.0], 5.3);
      if (!m) return;
      chMap = m;
      updateStations(body);
    } catch(e){
      console.error("EVHub charging map:", e);
      /* never destroy a working map — only show fallback if no map rendered */
      const box = body.querySelector(".map-box");
      if (box && !box.querySelector(".leaflet-container")) box.innerHTML = mapFallback();
      updateStations(body, true);
    }
  }, 30);
}

/* ── Robust map bootstrap ─────────────────────────────────
   1. Try OSM tiles → 2. CARTO → 3. Esri (auto-failover)
   4. If ALL fail (offline / blocked): schematic KSA mode —
      country outline + cities, so circles & pins still work. */
const TILE_PROVIDERS = [
  {url:"https://tile.openstreetmap.org/{z}/{x}/{y}.png",
   opt:{maxZoom:19, attribution:"© OpenStreetMap"}},
  {url:"https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
   opt:{maxZoom:19, subdomains:"abcd", attribution:"© OpenStreetMap · © CARTO"}},
  {url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
   opt:{maxZoom:19, attribution:"© Esri"}},
];
/* simplified Saudi Arabia outline for schematic fallback */
const KSA_OUTLINE = [[29.1,34.95],[29.35,36.07],[31.0,37.5],[31.5,38.0],[32.15,39.2],[31.1,42.0],[30.5,44.7],
 [30.1,46.5],[29.1,47.43],[28.53,48.42],[27.6,48.8],[27.0,49.7],[26.5,50.15],[25.6,50.2],[24.6,50.85],
 [24.1,51.3],[22.7,51.6],[22.0,55.1],[19.5,52.7],[19.0,52.0],[17.9,49.1],[17.3,47.6],[16.95,47.0],
 [17.05,46.4],[17.25,45.4],[17.45,44.5],[17.05,43.9],[16.4,42.8],[16.9,42.35],[17.6,41.7],[18.8,41.1],
 [20.3,39.9],[21.3,39.1],[22.9,38.9],[24.1,37.9],[25.7,36.6],[27.0,35.7],[28.0,34.9],[29.1,34.95]];

function L_map(id, center, zoom){
  const el = typeof id === "string" ? document.getElementById(id) : id;
  if (!el) return null;
  /* IDEMPOTENT: if this container was already initialized (double render,
     racing timers, fast navigation) tear the old map down first instead of throwing */
  if (el._evhubMap){ try { el._evhubMap.remove(); } catch(e){} el._evhubMap = null; }
  if (el._leaflet_id){ try { delete el._leaflet_id; } catch(e){ el._leaflet_id = undefined; } }
  const m = L.map(el, {zoomControl:true, attributionControl:true}).setView(center, zoom);
  el._evhubMap = m;
  tryTileProvider(m, 0);
  [150, 600, 1400].forEach(ms => setTimeout(() => { try { m.invalidateSize(); } catch(e){} }, ms));
  return m;
}
function tryTileProvider(m, i){
  if (i >= TILE_PROVIDERS.length){ schematicMode(m); return; }
  let loaded = false;
  let layer;
  try {
    const p = TILE_PROVIDERS[i];
    layer = L.tileLayer(p.url, p.opt);
    layer.on("tileload", () => { loaded = true; });
    layer.addTo(m);
  } catch(e){ tryTileProvider(m, i + 1); return; }
  setTimeout(() => {
    if (loaded) return;                       // provider works — keep it
    try { m.removeLayer(layer); } catch(e){}
    tryTileProvider(m, i + 1);                // failover to next provider
  }, i === 0 ? 3500 : 4500);
}
function schematicMode(m){
  try {
    m.getContainer().classList.add("map-schematic");
    L.polygon(KSA_OUTLINE, {color:"var(--accent)", weight:1.5, fillColor:"#10b981", fillOpacity:.07, interactive:false}).addTo(m);
    DB.CITIES.forEach(c => {
      L.circleMarker([c.lat, c.lng], {radius:3, color:"#8a988f", fillColor:"#8a988f", fillOpacity:1, weight:1, interactive:false})
        .bindTooltip(LOC(c), {permanent:false}).addTo(m);
    });
    const note = L.control({position:"bottomleft"});
    note.onAdd = () => {
      const d = L.DomUtil.create("div", "map-note");
      d.textContent = t("mapSchematic");
      return d;
    };
    note.addTo(m);
  } catch(e){}
}
function mapFallback(){
  return `<div style="display:grid;place-items:center;height:100%;color:var(--ink-3);text-align:center;padding:30px">
    <div>${IC.pin}<br>${State.lang==="ar"?"الخريطة غير متاحة دون اتصال — القائمة تعمل بشكل كامل":"Map unavailable offline — the list is fully functional"}</div></div>`;
}

function stationCard(s){
  const st = {ok:["ok", t("ch.available")], busy:["busy", t("ch.busy")], off:["off", t("ch.offline")]}[s.status];
  return `<div class="card st-card ${CH.sel===s.id?"sel":""}" data-st="${s.id}">
    <div class="st-head">
      <div style="min-width:0;flex:1">
        <b>${LOC(s.name)}</b>
        <span class="st-op">${s.op} · ${cityName(s.city)}</span>
      </div>
      <div class="st-power-badge"><b class="num">${s.power}</b><small>${t("kw")} DC</small></div>
    </div>
    <div class="st-meta">
      <span class="avail ${st[0]}"><span class="d"></span>${st[1]}</span>
      ${s.conns.map(c => `<span class="chip">${c}</span>`).join("")}
      <span class="chip">${IC.clock} ${s.hours}</span>
    </div>
    <div class="st-meta" style="color:var(--ink-3);font-weight:500;font-size:.78rem">${LOC(s.amen)}</div>
    <div class="st-foot">
      <span style="font-size:.84rem;font-weight:600">
        <b class="num" style="color:var(--accent);font-family:'Space Grotesk'">${s.tariff.toFixed(2)}</b>
        <span style="color:var(--ink-2)">${t("sar")}/${t("kwh")}</span>
        ${s.tariffEst ? `<small style="color:var(--ink-3)"> (${t("ch.est")})</small>` : ""}
        <small style="color:var(--ink-3)"> · ${t("ch.verifiedAt")} <span class="num">${s.verified}</span></small>
      </span>
      <a class="btn btn-dark btn-sm" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}">${IC.pin} ${t("ch.directions")}</a>
    </div></div>`;
}

function updateStations(body, noMap){
  const list = DB.STATIONS.filter(s => (CH.city === "all" || s.city === CH.city) && s.power >= CH.minPower);
  body.querySelector("#stList").innerHTML = list.map(stationCard).join("") ||
    `<div class="soon-banner">${t("mk.noResults")}</div>`;
  body.querySelector("#stCount").innerHTML = `<b class="num">${list.length}</b> ${t("ch.stations")}`;
  body.querySelectorAll("[data-st]").forEach(c => c.addEventListener("click", () => {
    CH.sel = c.dataset.st;
    body.querySelectorAll("[data-st]").forEach(x => x.classList.toggle("sel", x.dataset.st === CH.sel));
    const s = DB.STATIONS.find(x => x.id === CH.sel);
    if (chMap && s) chMap.flyTo([s.lat, s.lng], 12, {duration:.8});
  }));
  if (chMap && !noMap){
    chMarkers.forEach(m => m.remove()); chMarkers = [];
    list.forEach(s => {
      const icon = L.divIcon({className:"ev-pin", html:`<div class="pin"><svg viewBox="0 0 24 24" width="13" height="13" fill="#fff"><path d="M13 2 4.5 13.5H11l-1 8.5L18.5 10.5H12z"/></svg></div>`, iconSize:[30,30], iconAnchor:[15,28]});
      const mk = L.marker([s.lat, s.lng], {icon}).addTo(chMap)
        .bindPopup(`<b>${LOC(s.name)}</b><br><span class="num">${s.power}</span> ${t("kw")} · ${s.conns.join(", ")}<br>${s.tariff.toFixed(2)} ${t("sar")}/${t("kwh")}`);
      mk.on("click", () => { CH.sel = s.id; body.querySelectorAll("[data-st]").forEach(x => x.classList.toggle("sel", x.dataset.st === s.id)); });
      chMarkers.push(mk);
    });
  }
}

/* ── P2P ── */
function renderP2P(body, scrollHost){
  const cities = [...new Set(DB.HOSTS.map(h => h.city))];
  body.innerHTML = `
    <div class="panel-dark" style="margin-bottom:22px">
      <div style="padding:30px">
        <span class="pill-lime">${IC.bolt} Peer-to-Peer</span>
        <h2 style="color:#fff;margin-top:12px">${t("p2pIntro.t")}</h2>
        <p class="muted" style="max-width:46em;margin:0">${t("p2pIntro.d")}</p>
        <div style="display:flex;gap:18px;margin-top:18px;flex-wrap:wrap">
          ${[["shield", t("p2p.insurance")],["pin", t("p2p.privacy")],["star", t("p2p.ratings")]].map(([ic, txt]) =>
            `<span class="pill-dark">${IC[ic]} ${txt}</span>`).join("")}
        </div>
      </div>
    </div>

    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px;align-items:flex-end;justify-content:space-between">
      <div class="selrow" style="min-width:170px"><label>${t("ch.fCity")}</label>
        <select id="hCity"><option value="all">${t("mk.allCities")}</option>
          ${cities.map(c => `<option value="${c}" ${CH.p2pCity===c?"selected":""}>${cityName(c)}</option>`).join("")}</select></div>
      <a class="btn btn-soft" href="#host-section" id="hostLink">${t("p2p.becomeHost")} ${IC.arrow}</a>
    </div>
    <div class="grid g3" id="hostGrid"></div>

    <!-- Host onboarding -->
    <section class="section" id="host-section">
      <div class="card" style="overflow:visible"><div class="card-pad" style="padding:30px">
        <div style="display:grid;grid-template-columns:1.1fr .9fr;gap:30px;align-items:center" class="host-cta-grid">
          <div>
            <h2 style="font-size:1.45rem">${t("p2p.hostTitle")}</h2>
            <p style="color:var(--ink-2)">${t("p2p.hostDesc")}</p>
            <div class="grid" style="gap:12px;margin-top:18px">
              ${[1,2,3].map(n => `<div style="display:flex;gap:13px;align-items:flex-start">
                <span class="avatarbtn" style="width:34px;height:34px;font-weight:700;font-size:.85rem">${n}</span>
                <div><b style="font-size:.92rem">${t("p2p.hostStep"+n)}</b>
                  <div style="font-size:.8rem;color:var(--ink-3)">${t("p2p.hostStep"+n+"d")}</div></div></div>`).join("")}
            </div>
          </div>
          <div>
            <div class="result-hero">
              <div class="cap">${t("p2p.hostEarn")}</div>
              <div class="big num">450 – 900 ${t("sar")}</div>
              <button class="btn btn-primary" style="margin-top:14px" id="hostNotify">${t("p2p.hostCta")}</button>
            </div>
          </div>
        </div>
      </div></div>
    </section>
    <style>@media(max-width:760px){.host-cta-grid{grid-template-columns:1fr!important}}</style>`;

  const renderHosts = () => {
    const hosts = DB.HOSTS.filter(h => CH.p2pCity === "all" || h.city === CH.p2pCity);
    body.querySelector("#hostGrid").innerHTML = hosts.map(hostCard).join("");
    bindHosts(body);
  };
  body.querySelector("#hCity").addEventListener("change", e => { CH.p2pCity = e.target.value; renderHosts(); });
  body.querySelector("#hostNotify").addEventListener("click", () => toast(t("notified")));
  body.querySelector("#hostLink").addEventListener("click", e => {
    e.preventDefault(); body.querySelector("#host-section").scrollIntoView({behavior:"smooth"});
  });
  renderHosts();
  if (scrollHost) setTimeout(() => body.querySelector("#host-section").scrollIntoView({behavior:"smooth"}), 200);
}

function hostCard(h){
  return `<article class="card hov host-card" data-host="${h.id}">
    <div class="host-media">
      <svg viewBox="0 0 120 80" width="110"><rect x="24" y="10" width="42" height="58" rx="7" fill="#134e4a"/><rect x="30" y="18" width="30" height="20" rx="4" fill="#2dd4a0" opacity=".9"/><rect x="36" y="44" width="18" height="6" rx="3" fill="#0f766e"/><path d="M66 40 Q92 40 92 62 L92 72" fill="none" stroke="#2dd4a0" stroke-width="4" stroke-linecap="round"/><circle cx="92" cy="75" r="5" fill="#2dd4a0"/></svg>
      <div class="price-tag"><span class="num">${h.priceKwh.toFixed(2)}</span> <small>${t("p2p.kwPrice")}</small></div>
    </div>
    <div class="host-body">
      <div class="host-row"><b>${LOC(h.name)}</b>
        <span class="rating">${IC.star} <span class="num">${h.rating.toFixed(1)}</span> <small style="color:var(--ink-3)">(${h.sessions})</small></span></div>
      <div class="vspecs">
        <span class="vspec">${IC.pin} ${LOC(h.district)} · ${cityName(h.city)}</span>
        <span class="vspec">${IC.bolt} <span class="num">${h.power}</span> ${t("kw")} · ${h.conn}</span>
      </div>
      <div style="font-size:.74rem;color:var(--ink-3)">${IC.shield} ${t("p2p.approxLoc")}</div>
      <div><small style="font-size:.75rem;font-weight:700;color:var(--ink-2)">${t("p2p.todaySlots")}</small>
        <div class="slots" style="margin-top:6px">
          ${h.slots.map((s, i) => `<button class="slot ${h.busy.includes(i)?"off":""}" data-slot="${s}" ${h.busy.includes(i)?"disabled":""}>${s}</button>`).join("")}
        </div></div>
      <button class="btn btn-primary btn-sm btn-block" data-book="${h.id}" style="margin-top:6px">${t("p2p.book")}</button>
    </div></article>`;
}

function bindHosts(body){
  body.querySelectorAll(".host-card").forEach(card => {
    let sel = null;
    card.querySelectorAll(".slot:not(.off)").forEach(s => s.addEventListener("click", () => {
      card.querySelectorAll(".slot").forEach(x => x.classList.remove("sel"));
      s.classList.add("sel"); sel = s.dataset.slot;
    }));
    card.querySelector("[data-book]").addEventListener("click", () => {
      if (!sel){ toast(t("p2p.selectSlot")); return; }
      const h = DB.HOSTS.find(x => x.id === card.dataset.host);
      const kwh = 30, cost = (kwh * h.priceKwh).toFixed(0);
      openModal(t("p2p.bookTitle"), `
        <div class="spec-grid" style="grid-template-columns:1fr 1fr">
          <div class="spec-cell"><small>${State.lang==="ar"?"المضيف":"Host"}</small><b>${LOC(h.name)} · ★ ${h.rating.toFixed(1)}</b></div>
          <div class="spec-cell"><small>${t("p2p.bookSlot")}</small><b class="num">${State.lang==="ar"?"اليوم":"Today"} ${sel}</b></div>
          <div class="spec-cell"><small>${t("p2p.bookKwh")}</small><b class="num">${kwh} ${t("kwh")}</b></div>
          <div class="spec-cell"><small>${t("p2p.bookEst")}</small><b class="num" style="color:var(--accent)">${cost} ${t("sar")}</b></div>
        </div>
        <div class="soon-banner" style="margin-top:12px;font-size:.8rem">${IC.shield} ${t("p2p.approxLoc")}</div>
        <button class="btn btn-primary btn-block" id="payBook" style="margin-top:14px">${t("p2p.bookPay")}</button>`,
        root => root.querySelector("#payBook").addEventListener("click", () => { closeModal(); toast(t("p2p.booked"), 4200); }));
    });
  });
}
