/* EVHub — Decision tools v3 */
"use strict";

Routes.tools = (app, parts) => {
  const sub = parts[0] || "hub";
  if (sub === "compare"){ location.hash = "#/compare"; return; }
  const map = {hub:toolsHub, finder:toolFinder, range:toolRange, lab:toolLab, tco:toolTCO, bundle:toolBundle, sim:toolSim, ar:toolAR};
  (map[sub] || toolsHub)(app);
};
Routes.compare = (app) => toolCompare(app);

function toolShell(app, title, sub, inner){
  app.innerHTML = `<div class="page wrap">
    <div class="crumbs"><a href="#/">${t("nav.home")}</a> ‹ <a href="#/tools">${t("tl.title")}</a> ‹ <span>${title}</span></div>
    <div class="page-head"><h1>${title}</h1><p>${sub}</p></div>
    ${inner}${footerHTML()}</div>`;
}

/* ── hub ── */
function toolsHub(app){
  const tools = [["finder","spark","finder"],["range","range","range",1],["cmp","scale","/compare"],["lab","gauge","lab"],
    ["tco","chart","tco"],["bundle","plug","bundle"],["sim","cam","sim"],["ar","cam","ar"]];
  app.innerHTML = `<div class="page wrap">
    <div class="crumbs"><a href="#/">${t("nav.home")}</a> ‹ <span>${t("tl.title")}</span></div>
    <div class="page-head"><h1>${t("tl.title")}</h1><p>${t("tl.sub")}</p></div>
    <div class="grid g4">
      ${tools.map(([k, ic, href, dark]) => `<a class="feat-tile ${dark?"dark":""}" href="${href.startsWith("/") ? "#" + href : "#/tools/" + href}">
        <span class="arrow">${IC.arrow}</span><div class="fico">${IC[ic]}</div>
        <b>${t("tl."+k)}</b><span>${t("tl."+k+"D")}</span>
        ${k==="ar" ? `<span class="badge badge-soon" style="position:absolute;top:22px;inset-inline-start:22px">${t("soon")}</span>` : ""}</a>`).join("")}
    </div>${footerHTML()}</div>`;
}

/* ═══════════════════════════════════════════════════════
   RANGE WIDGET — shared by #/tools/range and vehicle page
   Two overlapping circles: outer = one-way, inner = round trip
   ═══════════════════════════════════════════════════════ */
function renderRangeWidget(host, {fixedVehicle = null, mapId = "rwMap", compact = false} = {}){
  // range applies to anything that travels intercity: cars, trucks, motorcycles
  const cars = DB.VEHICLES.filter(v => ["car", "truck", "motorcycle"].includes(v.cat));
  const state = {
    vehicle: fixedVehicle || cars[0],
    origin: null,            // {lat,lng,label}
    charge: 90, reserve: 15, temp: 45, style: 1,
    map: null, layers: [],
    usable: 0, round: 0,
    routeLayers: [], routeReq: 0,
    lastTrip: null,          // {lat,lng,distance,geometry,isRoad}
  };
  const cityOpt = DB.CITIES.map(c => `<option value="${c.id}" ${c.id===State.myCity?"selected":""}>${LOC(c)}</option>`).join("");

  host.innerHTML = `
  <div class="rw-cols ${compact ? "compact" : ""}">
    <div style="display:flex;flex-direction:column;gap:14px">
      ${fixedVehicle ? "" : `<div class="selrow"><label>${t("rm.vehicle")}</label>
        <select data-r="veh">${cars.map(v => `<option value="${v.id}">${vName(v)} (${v.range} ${t("km")})</option>`).join("")}</select></div>`}
      <div class="selrow"><label>${t("rm.from")}</label>
        <div style="display:flex;gap:8px">
          <select data-r="city" style="flex:1">${cityOpt}</select>
          <button class="btn btn-dark btn-sm" data-r="loc" title="${t("rm.useMyLoc")}">${IC.target} ${t("rm.useMyLoc")}</button>
        </div></div>
      <div class="calc-row"><label>${t("rm.charge")} <b class="num" data-r="chgV">90%</b></label>
        <input type="range" data-r="chg" min="30" max="100" step="5" value="90"></div>
      <div class="calc-row"><label>${t("rm.temp")} <b class="num" data-r="tmpV">45°C</b></label>
        <input type="range" data-r="tmp" min="15" max="52" step="1" value="45"></div>
      ${compact ? "" : `
      <div class="calc-row"><label>${t("rm.reserve")} <b class="num" data-r="resV">15%</b></label>
        <input type="range" data-r="res" min="5" max="30" step="5" value="15"></div>
      <div class="selrow"><label>${t("rm.style")}</label>
        <select data-r="style"><option value="0">${t("rm.styleCalm")}</option><option value="1" selected>${t("rm.styleNormal")}</option><option value="2">${t("rm.styleSport")}</option></select></div>`}

      <div class="result-hero" style="padding:18px">
        <div class="big num" data-r="out">—</div>
        <div class="cap">${t("rm.usable")} · ${t("rm.acNote")}</div>
      </div>

      <!-- route-to-destination result (appears after a map click) -->
      <div class="trip-result" data-r="trip" hidden></div>

      <!-- the two-circle explanation -->
      <div class="range-legend">
        <div class="leg-card"><i style="background:rgba(14,122,82,.35);border:2px solid #0e7a52"></i>
          <span><b>${t("rm.oneWayT")} — <span class="num" data-r="owKm"></span> ${t("km")}</b>${t("rm.oneWayD")}</span></div>
        <div class="leg-card"><i style="background:rgba(37,99,235,.3);border:2px dashed #2563eb"></i>
          <span><b>${t("rm.roundT")} — <span class="num" data-r="rtKm"></span> ${t("km")}</b>${t("rm.roundD")}</span></div>
        <div class="tip-band light" style="font-size:.78rem">${IC.target} ${t("rm.clickHint")}</div>
        <div class="tip-band light" style="font-size:.78rem">${IC.bulb} ${t("rm.mapHint")}</div>
      </div>
      <div data-r="cities"></div>
    </div>
    <div class="map-box rw-map"><div id="${mapId}" style="width:100%;height:100%"></div></div>
  </div>`;

  const $ = sel => host.querySelector(`[data-r="${sel}"]`);
  const cityById = id => DB.CITIES.find(c => c.id === id);

  /* ── click-to-route: road route + distance to any point on the map ── */
  const clearTrip = () => {
    state.routeLayers.forEach(l => { try { l.remove(); } catch(e){} });
    state.routeLayers = []; state.lastTrip = null; state.routeReq++;
    const box = $("trip"); if (box){ box.hidden = true; box.innerHTML = ""; }
  };
  const renderTrip = trip => {
    state.lastTrip = trip;
    const {lat, lng, distance, geometry, isRoad} = trip;
    const usable = state.usable, round = state.round;
    const reachable = distance <= usable, roundOk = distance <= round;
    const chg = +$("chg").value, res = $("res") ? +$("res").value : state.reserve;
    const arrive = Math.max(0, Math.round((chg - res) * (1 - distance / usable) + res));
    const color = reachable ? "#2563eb" : "#cc3a3a";
    if (state.map){
      state.routeLayers.forEach(l => { try { l.remove(); } catch(e){} });
      state.routeLayers = [];
      const o = [state.origin.lat, state.origin.lng];
      const line = geometry
        ? L.geoJSON(geometry, {style:{color, weight:5, opacity:.88}}).addTo(state.map)
        : L.polyline([o, [lat, lng]], {color, weight:4, dashArray:"8 8", opacity:.85}).addTo(state.map);
      const destMk = L.circleMarker([lat, lng], {radius:9, color:"#fff", weight:3, fillColor:color, fillOpacity:1})
        .addTo(state.map).bindTooltip(t("rm.dest"), {direction:"top"});
      state.routeLayers.push(line, destMk);
      try { state.map.fitBounds(line.getBounds(), {padding:[46, 46], maxZoom:10}); } catch(e){}
    }
    const box = $("trip");
    if (box){
      box.hidden = false;
      box.className = `trip-result ${reachable ? "reachable" : "unreachable"}`;
      box.innerHTML = `
        <div class="tr-top">
          <b class="tr-km num">${distance.toFixed(0)} <small>${t("km")}</small></b>
          <span class="badge ${isRoad ? "badge-verified" : "badge-soon"}">${isRoad ? t("rm.roadRoute") : t("rm.geoEst")}</span>
          <button class="tr-clear" data-r="tripClear" title="${t("rm.clearDest")}">✕</button>
        </div>
        <b class="tr-verdict">${reachable ? "✓ " + t("rm.destReach") : "⚠ " + t("rm.destNo")}</b>
        <div class="tr-facts">
          <span>${t("rm.battArrive")}: <b class="num">${reachable ? arrive + "%" : "—"}</b></span>
          <span>${roundOk ? "✓ " + t("rm.roundOk") : "· " + t("rm.roundNo")}</span>
        </div>`;
      box.querySelector('[data-r="tripClear"]').addEventListener("click", clearTrip);
    }
  };
  const pickDest = (lat, lng) => {
    if (!state.origin || !state.usable) return;
    const req = ++state.routeReq;
    const linear = distKm(state.origin, {lat, lng}); // haversine × 1.25 road factor
    const box = $("trip");
    if (box){
      box.hidden = false; box.className = "trip-result loading";
      box.innerHTML = `<div class="tr-top"><b class="tr-verdict">${t("rm.calcRoute")}</b></div>
        <div class="tr-facts"><span>${t("rm.calcRouteD")}</span></div>`;
    }
    const fallback = () => { if (req === state.routeReq) renderTrip({lat, lng, distance:linear, geometry:null, isRoad:false}); };
    if (typeof fetch !== "function"){ fallback(); return; }
    const url = `https://router.project-osrm.org/route/v1/driving/${state.origin.lng},${state.origin.lat};${lng},${lat}?overview=full&geometries=geojson`;
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(() => { try { ctrl?.abort(); } catch(e){} }, 7000);
    fetch(url, ctrl ? {signal:ctrl.signal} : {})
      .then(r => { if (!r.ok) throw 0; return r.json(); })
      .then(d => {
        clearTimeout(timer);
        const route = d?.routes?.[0];
        if (!route) throw 0;
        if (req === state.routeReq) renderTrip({lat, lng, distance:route.distance / 1000, geometry:route.geometry, isRoad:true});
      })
      .catch(() => { clearTimeout(timer); fallback(); });
  };

  const calc = () => {
    const v = state.vehicle;
    if (!state.origin){ const c = cityById($("city").value); state.origin = {lat:c.lat, lng:c.lng, label:LOC(c)}; }
    const chg = +$("chg").value, temp = +$("tmp").value;
    const res = $("res") ? +$("res").value : state.reserve;
    const style = $("style") ? +$("style").value : 1;
    $("chgV").textContent = chg + "%";
    $("tmpV").textContent = temp + "°C";
    if ($("resV")) $("resV").textContent = res + "%";
    const usable = Math.round(realRange(v, {tempC:temp, style}) * (chg - res) / 100);
    const round = Math.round(usable / 2);
    state.usable = usable; state.round = round;
    $("out").innerHTML = `${fmtN(usable)} <small style="font-size:1rem">${t("km")}</small>`;
    $("owKm").textContent = fmtN(usable);
    $("rtKm").textContent = fmtN(round);

    // nearest cities table
    const rows = DB.CITIES.map(c => ({c, d: distKm(state.origin, c)})).filter(r => r.d > 4)
      .sort((a, b) => a.d - b.d).slice(0, compact ? 6 : 8);
    $("cities").innerHTML = `<small style="font-weight:700;font-size:.78rem;color:var(--ink-2)">${t("rm.destHint")}</small>
      <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">
      ${rows.map(({c, d}) => {
        const rt = d <= round, ok = d <= usable;
        const tag = rt ? `<span class="compat-tag">${t("rm.reachRound")}</span>`
          : ok ? `<span class="compat-tag" style="color:var(--info)">${t("rm.reach")}</span>`
          : `<span class="compat-tag no">${t("rm.noReach")}</span>`;
        return `<div style="display:flex;justify-content:space-between;font-size:.84rem;padding:5px 0;border-bottom:1px dashed var(--line)">
          <span>${LOC(c)} <small class="num" style="color:var(--ink-3)">${d} ${t("km")}</small></span>${tag}</div>`;
      }).join("")}</div>`;

    // map
    if (state.map){
      state.layers.forEach(l => l.remove()); state.layers = [];
      const o = [state.origin.lat, state.origin.lng];
      // one-way circle (outer)
      state.layers.push(L.circle(o, {radius:usable / 1.25 * 1000, color:"#0e7a52", weight:2,
        fillColor:"#10b981", fillOpacity:.13}).addTo(state.map)
        .bindTooltip(`${t("rm.oneWayT")} — ${fmtN(usable)} ${t("km")}`, {sticky:true}));
      // round-trip circle (inner, overlapped)
      state.layers.push(L.circle(o, {radius:round / 1.25 * 1000, color:"#2563eb", weight:2, dashArray:"7 6",
        fillColor:"#3b82f6", fillOpacity:.14}).addTo(state.map)
        .bindTooltip(`${t("rm.roundT")} — ${fmtN(round)} ${t("km")}`, {sticky:true}));
      const meIcon = L.divIcon({className:"ev-pin me", html:`<div class="pin"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M13 2 4.5 13.5H11l-1 8.5L18.5 10.5H12z"/></svg></div>`, iconSize:[32,32], iconAnchor:[16,30]});
      state.layers.push(L.marker(o, {icon:meIcon}).addTo(state.map).bindTooltip(state.origin.label));
      rows.forEach(({c, d}) => {
        const col = d <= round ? "#2563eb" : d <= usable ? "#0e7a52" : "#98a49b";
        state.layers.push(L.circleMarker([c.lat, c.lng], {radius:6.5, color:"#fff", weight:2, fillColor:col, fillOpacity:1})
          .bindTooltip(`${LOC(c)} — ${d} ${t("km")}`).addTo(state.map));
      });
      if (!state.lastTrip) state.map.flyTo(o, usable > 450 ? 6 : usable > 250 ? 6.5 : 7.5, {duration:.7});
    }
    /* keep the destination verdict in sync with the new settings */
    if (state.lastTrip) renderTrip(state.lastTrip);
  };

  // events
  if ($("veh")) $("veh").addEventListener("change", e => { state.vehicle = cars.find(v => v.id === e.target.value); calc(); });
  $("city").addEventListener("change", e => {
    const c = cityById(e.target.value); state.origin = {lat:c.lat, lng:c.lng, label:LOC(c)}; clearTrip(); calc();
  });
  $("loc").addEventListener("click", () => {
    if (!navigator.geolocation){ toast(t("rm.locDenied")); return; }
    $("loc").disabled = true;
    navigator.geolocation.getCurrentPosition(
      pos => { state.origin = {lat:pos.coords.latitude, lng:pos.coords.longitude, label:t("rm.myLoc")}; $("loc").disabled = false; clearTrip(); calc(); toast("📍 " + t("rm.myLoc")); },
      () => { $("loc").disabled = false; toast(t("rm.locDenied")); },
      {timeout:8000});
  });
  ["chg","tmp","res","style"].forEach(k => $(k)?.addEventListener($(k).tagName === "SELECT" ? "change" : "input", calc));

  setTimeout(() => {
    if (!host.isConnected || !document.getElementById(mapId)) return; // stale render
    try {
      state.map = L_map(mapId, [24.2, 45.0], 5.5);
      if (state.map) state.map.on("click", e => pickDest(e.latlng.lat, e.latlng.lng));
    } catch(e){
      console.error("EVHub range map:", e);
      const box = host.querySelector(".map-box");
      if (box && !box.querySelector(".leaflet-container")) box.innerHTML = mapFallback();
    }
    calc();
  }, 40);
  calc();
}

function toolRange(app){
  toolShell(app, t("rm.title"), t("rm.sub"), `<div id="rangeHost"></div>`);
  renderRangeWidget(app.querySelector("#rangeHost"), {mapId:"rangeToolMap"});
}

/* ═══ COMPARE — up to 4 vehicles ═══ */
function toolCompare(app){
  const cars = DB.VEHICLES.filter(v => v.cat === "car");
  app.innerHTML = `<div class="page wrap">
    <div class="crumbs"><a href="#/">${t("nav.home")}</a> ‹ <span>${t("cmp.title")}</span></div>
    <div class="page-head"><h1>${t("cmp.title")}</h1><p>${t("cmp.sub")}</p></div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;align-items:center">
      <select id="cmpAdd" style="border:1.5px solid var(--line-2);background:var(--surface);border-radius:14px;padding:11px 15px;font-weight:600">
        <option value="">${t("cmp.add")}</option>
        ${cars.map(v => `<option value="${v.id}">${vName(v)}</option>`).join("")}</select>
      <label class="fcheck" style="padding:0"><input type="checkbox" id="cmpHide"> ${t("cmp.hideSame")}</label>
    </div>
    <div id="cmpBody"></div>
    ${footerHTML()}</div>`;

  const render = () => {
    const sel = State.compare.map(id => DB.VEHICLES.find(v => v.id === id)).filter(v => v && v.cat === "car").slice(0, 4);
    const bodyEl = app.querySelector("#cmpBody");
    if (!sel.length){ bodyEl.innerHTML = `<div class="soon-banner">${IC.scale} <span>${t("cmp.empty")}</span></div>`; return; }
    const hideSame = app.querySelector("#cmpHide").checked;
    const best = {
      price: Math.min(...sel.map(v => v.price)), range: Math.max(...sel.map(v => v.range)),
      summer: Math.max(...sel.map(v => realRange(v))), soh: Math.max(...sel.map(v => v.soh)),
      dc: Math.max(...sel.map(v => v.dc)), batt: Math.max(...sel.map(v => v.batt)),
      t1080: Math.min(...sel.filter(v => v.t1080).map(v => v.t1080)),
    };
    const mark = txt => `${txt}<span class="bdot"></span>`;
    const groups = [
      [t("cmp.gPrice"), [
        [t("cmp.price"), v => SAR(v.price), v => v.price === best.price],
        [t("cmp.fin"), v => `${SAR(finMonthly(v.price))} ${t("perMonth")}`, v => v.price === best.price],
      ]],
      [t("cmp.gBattery"), [
        [t("vd.batt"), v => `${v.batt} ${t("kwh")}`, v => v.batt === best.batt],
        [t("vd.soh"), v => v.cond === "new" ? `100% (${t("mk.condNew")})` : v.soh + "%", v => v.soh === best.soh],
        [t("vd.dc"), v => v.dc ? `${v.dc} ${t("kw")}` : "—", v => v.dc === best.dc],
        [t("vd.chargeTime"), v => v.t1080 ? `${v.t1080} ${t("min")}` : "—", v => v.t1080 === best.t1080],
        [t("vd.connector"), v => `${v.connAC} / ${v.connDC}`, () => false],
        [t("vd.v2l"), v => v.v2l ? "✓" : "—", () => false],
      ]],
      [t("cmp.gRange"), [
        [t("vd.range"), v => `${fmtN(v.range)} ${t("km")} (${v.rangeStd})`, v => v.range === best.range],
        [t("vd.rangeSummer"), v => `≈ ${fmtN(realRange(v))} ${t("km")}`, v => realRange(v) === best.summer],
        [t("vd.drivetrain"), v => v.drive, () => false],
      ]],
      [t("cmp.gGeneral"), [
        [t("vd.year"), v => String(v.year), () => false],
        [t("vd.odo"), v => v.cond === "new" ? t("mk.condNew") : `${fmtN(v.odo)} ${t("km")}`, () => false],
        [t("vd.source"), v => LOC(v.source), () => false],
        [t("vd.warranty"), v => LOC(v.warranty), () => false],
        [t("vd.inspected"), v => v.inspected ? "✓" : "—", () => false],
        [t("vd.city"), v => cityName(v.city), () => false],
      ]],
    ];
    const crowns = [
      [t("cmp.bestPrice"), sel.find(v => v.price === best.price), IC.chart],
      [t("cmp.bestRange"), sel.find(v => v.range === best.range), IC.range],
      [t("cmp.bestCharge"), sel.find(v => v.dc === best.dc), IC.bolt],
    ];
    const emptySlots = Math.max(0, Math.min(4, sel.length + 1) - sel.length) && sel.length < 4 ? 1 : 0;

    bodyEl.innerHTML = `
      ${sel.length > 1 ? `<div class="crowns">${crowns.map(([lb, v, ic]) => `
        <div class="crown"><div class="ci">${ic}</div><div><small>${lb}</small><b>${vName(v)}</b></div></div>`).join("")}</div>` : ""}
      <div class="cmp-scroll"><table class="cmp-table">
        <thead><tr><th></th>
          ${sel.map(v => `<th><div class="cmp-vhead">
            <span class="ph"><img src="${v.img?.src || ""}" alt="" onerror="this.style.display='none'">
              <button class="rm" data-rm="${v.id}" title="${t("cmp.remove")}">✕</button></span>
            <b>${vName(v)}<br><small class="num" style="color:var(--ink-3);font-weight:500">${v.year} · ${v.cond === "new" ? t("mk.condNew") : t("mk.condUsed")}</small></b>
          </div></th>`).join("")}
          ${emptySlots ? `<th><div class="cmp-vhead"><span class="cmp-empty">${t("cmp.add")}</span></div></th>` : ""}
        </tr></thead>
        <tbody>
        ${groups.map(([gname, rows]) => {
          const visible = rows.filter(([_, fn]) => !hideSame || new Set(sel.map(fn)).size > 1);
          if (!visible.length) return "";
          return `<tr class="cmp-group"><td colspan="${sel.length + 2}">${gname}</td></tr>` +
            visible.map(([lbl, fn, isBest]) => `<tr><td>${lbl}</td>
              ${sel.map(v => `<td class="${isBest(v) && sel.length > 1 ? "cmp-best" : ""}">${isBest(v) && sel.length > 1 ? mark(fn(v)) : fn(v)}</td>`).join("")}
              ${emptySlots ? "<td></td>" : ""}</tr>`).join("");
        }).join("")}
        </tbody></table></div>
      <div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">
        ${sel.map(v => `<a class="btn btn-dark btn-sm" href="#/vehicle/${v.id}">${vName(v)} ${IC.arrow}</a>`).join("")}
      </div>`;
    bodyEl.querySelectorAll("[data-rm]").forEach(b => b.addEventListener("click", () => {
      State.compare = State.compare.filter(id => id !== b.dataset.rm); persist(); render();
    }));
  };
  app.querySelector("#cmpAdd").addEventListener("change", e => {
    if (e.target.value){ toggleCompare(e.target.value); e.target.value = ""; render(); }
  });
  app.querySelector("#cmpHide").addEventListener("change", render);
  render();
}

/* ═══ Finder ═══ */
function toolFinder(app){
  const steps = [
    {q:"fz.q1", opts:[["b1"],["b2"],["b3"],["b4"]]},
    {q:"fz.q2", opts:[["d1","d1d"],["d2","d2d"],["d3","d3d"],["d4","d4d"]]},
    {q:"fz.q3", opts:[["t1"],["t2"],["t3"],["t4"]]},
    {q:"fz.q4", opts:[["h1"],["h2"],["h3"]]},
    {q:"fz.q5", opts:[["p1"],["p2"],["p3"],["p4"]]},
  ];
  const ans = [];
  let step = 0;
  toolShell(app, t("tl.finder"), t("tl.finderD"), `<div class="wizard card card-pad" id="wiz"></div>`);
  const wiz = app.querySelector("#wiz");

  const renderStep = () => {
    if (step >= steps.length){ renderResult(); return; }
    const s = steps[step];
    wiz.innerHTML = `
      <div class="wiz-progress">${steps.map((_, i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>
      <div class="wiz-q">${t(s.q)}</div>
      <div class="wiz-opts">${s.opts.map(([k, d], i) => `<button class="wiz-opt ${ans[step]===i?"sel":""}" data-i="${i}">
        <b>${t("fz."+k)}</b>${d ? `<span>${t("fz."+d)}</span>` : ""}</button>`).join("")}</div>
      <div class="wiz-nav">
        <button class="btn btn-ghost" id="wBack" ${step===0?"disabled":""}>${t("fz.back")}</button>
        <button class="btn btn-primary" id="wNext" ${ans[step]==null?"disabled":""}>${step===steps.length-1?t("fz.result"):t("fz.next")}</button>
      </div>`;
    wiz.querySelectorAll(".wiz-opt").forEach(b => b.addEventListener("click", () => {
      ans[step] = +b.dataset.i;
      wiz.querySelectorAll(".wiz-opt").forEach(x => x.classList.toggle("sel", x === b));
      wiz.querySelector("#wNext").disabled = false;
    }));
    wiz.querySelector("#wBack").addEventListener("click", () => { step--; renderStep(); });
    wiz.querySelector("#wNext").addEventListener("click", () => { step++; renderStep(); });
  };

  const renderResult = () => {
    const budgets = [[0,150000],[150000,220000],[220000,300000],[300000,999999]];
    const [bLo, bHi] = budgets[ans[0]];
    const wantBike = ans[2] === 3;
    let pool = DB.VEHICLES.filter(v => wantBike ? !["car","truck"].includes(v.cat) : v.cat === "car");
    const scored = pool.map(v => {
      let score = 50;
      if (v.price >= bLo && v.price <= bHi) score += 25;
      else score -= Math.min(25, Math.abs(v.price - (v.price < bLo ? bLo : bHi)) / 4000);
      const dailyNeed = [40, 80, 150, 300][ans[1]];
      const summer = realRange(v);
      if (summer > dailyNeed * 2.5) score += 15; else if (summer > dailyNeed * 1.6) score += 8; else score -= 12;
      if (ans[3] === 1 && v.dc >= 200) score += 8;
      if (ans[4] === 0) score += (v.range - 450) / 25;
      if (ans[4] === 1) score += (v.dc - 150) / 15;
      if (ans[4] === 2) score += (200000 - v.price) / 15000;
      if (ans[4] === 3 && ["Tesla","ZEEKR","Lucid","Hyundai","Kia"].includes(v.brand)) score += 8;
      if (v.verified) score += 3;
      return {v, score: Math.max(35, Math.min(98, Math.round(score)))};
    }).sort((a, b) => b.score - a.score).slice(0, 3);

    wiz.classList.remove("card","card-pad");
    wiz.innerHTML = `
      <div class="section-head"><div><h2>${t("fz.resultTitle")}</h2>
        <div class="sub">${t("fz.whyTitle")}: <b>${t("fz.p" + (ans[4] + 1))}</b></div></div>
        <button class="btn btn-ghost btn-sm" id="wRestart">${t("fz.restart")}</button></div>
      <div class="grid g3">
        ${scored.map(({v, score}) => `<div style="position:relative">
          <span class="badge badge-new" style="position:absolute;top:-11px;inset-inline-start:16px;z-index:4;box-shadow:var(--sh-1)">${t("fz.match")}: ${score}%</span>
          ${vehicleCard(v)}</div>`).join("")}
      </div>`;
    bindCards(wiz);
    wiz.querySelector("#wRestart").addEventListener("click", () => { ans.length = 0; step = 0; wiz.classList.add("card","card-pad"); renderStep(); });
  };
  renderStep();
}

/* ═══ Range Lab ═══ */
function toolLab(app){
  const cars = DB.VEHICLES.filter(v => v.cat === "car");
  toolShell(app, t("lab.title"), t("lab.sub"), `
    <div class="tool-split">
      <div class="card card-pad" style="display:flex;flex-direction:column;gap:12px">
        <div class="selrow"><label>${t("rm.vehicle")}</label>
          <select id="lbV">${cars.map(v => `<option value="${v.id}">${vName(v)}</option>`).join("")}</select></div>
        <div class="calc-row"><label>${t("rm.temp")} <b class="num" id="lbTV">45°C</b></label>
          <input type="range" id="lbT" min="10" max="52" value="45"></div>
        <div class="calc-row"><label>${t("lab.speed")} <b class="num" id="lbSV">120</b></label>
          <input type="range" id="lbS" min="60" max="160" step="5" value="120"></div>
        <div class="selrow"><label>${t("lab.ac")}</label>
          <select id="lbAC"><option value="1">${t("lab.acLow")}</option><option value="2">${t("lab.acMid")}</option><option value="3" selected>${t("lab.acHigh")}</option></select></div>
        <div class="selrow"><label>${t("lab.load")}</label>
          <select id="lbL"><option value="0">${t("lab.loadLight")}</option><option value="1" selected>${t("lab.loadMid")}</option><option value="2">${t("lab.loadFull")}</option></select></div>
        <div class="selrow"><label>${t("lab.terrain")}</label>
          <select id="lbTer"><option value="0">${t("lab.flat")}</option><option value="1">${t("lab.hilly")}</option></select></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="duo">
          <div class="card card-pad" style="text-align:center">
            <small style="color:var(--ink-3);font-size:.78rem;font-weight:700">${t("lab.official")}</small>
            <div class="num" style="font-size:2.5rem;font-weight:700" id="lbOff">—</div>
            <small class="num" style="color:var(--ink-3)" id="lbStd"></small></div>
          <div class="result-hero" style="padding:22px">
            <div class="cap">${t("lab.estimated")}</div>
            <div class="big num" id="lbEst">—</div>
            <div class="cap num" id="lbDiff"></div></div>
        </div>
        <div class="card card-pad" id="lbBar"></div>
      </div>
    </div>`);
  const render = () => {
    const v = cars.find(x => x.id === app.querySelector("#lbV").value);
    const temp = +app.querySelector("#lbT").value, speed = +app.querySelector("#lbS").value;
    const ac = +app.querySelector("#lbAC").value, load = +app.querySelector("#lbL").value, ter = +app.querySelector("#lbTer").value;
    app.querySelector("#lbTV").textContent = temp + "°C";
    app.querySelector("#lbSV").textContent = speed;
    const est = realRange(v, {tempC:temp, acLevel:ac, load, terrain:ter, speed});
    const pct = Math.round(est / v.range * 100);
    app.querySelector("#lbOff").textContent = fmtN(v.range);
    app.querySelector("#lbStd").textContent = v.rangeStd + " · " + t("km");
    app.querySelector("#lbEst").innerHTML = `${fmtN(est)} <small style="font-size:1rem">${t("km")}</small>`;
    app.querySelector("#lbDiff").textContent = `${t("lab.diff")}: -${100 - pct}%`;
    app.querySelector("#lbBar").innerHTML = `
      <div style="display:flex;justify-content:space-between;font-size:.82rem;color:var(--ink-2);margin-bottom:9px;font-weight:600">
        <span>${t("lab.estimated")}</span><b class="num">${pct}%</b></div>
      <div class="soh-track" style="height:15px"><div class="soh-fill ${pct >= 75 ? "ok" : pct >= 60 ? "mid" : "low"}" style="width:${pct}%"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--ink-3);margin-top:7px">
        <span>0</span><span class="num">${fmtN(v.range)} ${t("km")} (${v.rangeStd})</span></div>`;
  };
  ["lbV","lbT","lbS","lbAC","lbL","lbTer"].forEach(id =>
    app.querySelector("#" + id).addEventListener(["lbT","lbS"].includes(id) ? "input" : "change", render));
  render();
}

/* ═══ TCO ═══ */
function toolTCO(app){
  const cars = DB.VEHICLES.filter(v => v.cat === "car");
  toolShell(app, t("tco.title"), t("tco.sub"), `
    <div class="tool-split">
      <div class="card card-pad" style="display:flex;flex-direction:column;gap:4px">
        <div class="selrow" style="margin-bottom:8px"><label>${t("tco.vehicle")}</label>
          <select id="tcV">${cars.map(v => `<option value="${v.id}">${vName(v)}</option>`).join("")}</select></div>
        <div class="calc-row"><label>${t("tco.kmYear")} <b class="num" id="tcKmV"></b></label>
          <input type="range" id="tcKm" min="5000" max="60000" step="1000" value="20000"></div>
        <div class="calc-row"><label>${t("tco.homePct")} <b class="num" id="tcHomeV"></b></label>
          <input type="range" id="tcHome" min="0" max="100" step="5" value="80"></div>
        <div class="calc-row"><label>${t("tco.homeTariff")} <b class="num" id="tcHtV"></b></label>
          <input type="range" id="tcHt" min="18" max="48" value="30"></div>
        <div class="calc-row"><label>${t("tco.pubTariff")} <b class="num" id="tcPtV"></b></label>
          <input type="range" id="tcPt" min="60" max="180" step="5" value="120"></div>
        <div class="calc-row"><label>${t("tco.fuelPrice")} <b class="num" id="tcFV"></b></label>
          <input type="range" id="tcF" min="1.5" max="4" step="0.01" value="2.33"></div>
        <div class="calc-row"><label>${t("tco.iceCons")} <b class="num" id="tcIV"></b></label>
          <input type="range" id="tcI" min="6" max="20" step="0.5" value="12"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="result-hero"><div class="cap">${t("tco.save5")}</div>
          <div class="stat-big num" id="tcSave5" style="margin:6px 0">—</div>
          <div class="cap num" id="tcSaveY"></div></div>
        <div class="duo">
          <div class="card card-pad"><small style="color:var(--ink-3);font-size:.78rem;font-weight:700">⚡ ${t("tco.evCost")}</small>
            <div class="num" style="font-size:1.8rem;font-weight:700;color:var(--accent)" id="tcEv">—</div>
            <div class="soh-track" style="height:10px;margin-top:9px" id="tcEvBar"><div class="soh-fill ok" style="width:20%"></div></div></div>
          <div class="card card-pad"><small style="color:var(--ink-3);font-size:.78rem;font-weight:700">⛽ ${t("tco.iceCost")}</small>
            <div class="num" style="font-size:1.8rem;font-weight:700;color:var(--warn)" id="tcIce">—</div>
            <div class="soh-track" style="height:10px;margin-top:9px"><div class="soh-fill mid" style="width:100%"></div></div></div>
        </div>
        <p style="font-size:.78rem;color:var(--ink-3)">${t("tco.note")}</p>
      </div>
    </div>`);
  const render = () => {
    const v = cars.find(x => x.id === app.querySelector("#tcV").value);
    const km = +app.querySelector("#tcKm").value, home = +app.querySelector("#tcHome").value;
    const ht = +app.querySelector("#tcHt").value, pt = +app.querySelector("#tcPt").value;
    const fuel = +app.querySelector("#tcF").value, eff = +app.querySelector("#tcI").value;
    app.querySelector("#tcKmV").textContent = `${fmtN(km)} ${t("km")}`;
    app.querySelector("#tcHomeV").textContent = home + "%";
    app.querySelector("#tcHtV").textContent = ht;
    app.querySelector("#tcPtV").textContent = pt;
    app.querySelector("#tcFV").textContent = fuel.toFixed(2);
    app.querySelector("#tcIV").textContent = eff;
    const consumption = v.batt / v.range * 100 * 1.18;
    const kwhYear = km / 100 * consumption;
    const evCost = kwhYear * (home/100 * ht/100 + (1 - home/100) * pt/100);
    const iceCost = km / eff * fuel;
    const save = iceCost - evCost;
    app.querySelector("#tcEv").textContent = SAR(evCost);
    app.querySelector("#tcIce").textContent = SAR(iceCost);
    app.querySelector("#tcSave5").textContent = SAR(Math.max(0, save * 5));
    app.querySelector("#tcSaveY").textContent = `${t("tco.saveYear")}: ${SAR(Math.max(0, save))}`;
    app.querySelector("#tcEvBar").firstElementChild.style.width = Math.max(4, Math.min(100, evCost / iceCost * 100)) + "%";
  };
  ["tcV","tcKm","tcHome","tcHt","tcPt","tcF","tcI"].forEach(id =>
    app.querySelector("#" + id).addEventListener(id === "tcV" ? "change" : "input", render));
  render();
}

/* ═══ Bundle ═══ */
function toolBundle(app){
  const cars = DB.VEHICLES.filter(v => v.cat === "car");
  toolShell(app, t("bd.title") || "", t("bd.sub") || "", `
    <div class="selrow" style="max-width:400px;margin-bottom:24px"><label>${State.lang==="ar"?"اختر السيارة":"Choose vehicle"}</label>
      <select id="bdV"><option value="">—</option>
        ${cars.map(v => `<option value="${v.id}" ${State.myVehicle===v.id?"selected":""}>${vName(v)}</option>`).join("")}</select></div>
    <div id="bdOut"></div>`);
  const render = () => {
    const v = cars.find(x => x.id === app.querySelector("#bdV").value);
    const out = app.querySelector("#bdOut");
    if (!v){ out.innerHTML = `<div class="soon-banner">${IC.plug} <span>${State.lang==="ar"?"اختر سيارة لنبني حزمتها":"Pick a car to build its bundle"}</span></div>`; return; }
    const charger = v.connAC === "GB/T" ? DB.PRODUCTS.find(p => p.id === "gbt-adapter")
      : v.ac >= 22 ? DB.PRODUCTS.find(p => p.id === "autel-22")
      : v.ac >= 11 ? DB.PRODUCTS.find(p => p.id === "wb-pulsar11")
      : DB.PRODUCTS.find(p => p.id === "wb-pulsar7");
    const items = [
      {p:charger, why:`${t("sv.recWhy")} — ${v.ac} ${t("kw")} AC (${v.connAC})`},
      {p:DB.PRODUCTS.find(p => p.id === "cable-t2"), why:State.lang==="ar"?"للشحن في المحطات العامة AC":"For public AC stations"},
      v.v2l && {p:DB.PRODUCTS.find(p => p.id === "v2l-adapter"), why:State.lang==="ar"?"سيارتك تدعم V2L — شغّل أجهزتك في البر":"Your car supports V2L — power devices outdoors"},
      {p:DB.PRODUCTS.find(p => p.id === "sunshade"), why:State.lang==="ar"?"حماية البطارية والمقصورة من حرارة الصيف":"Protects battery & cabin from summer heat"},
    ].filter(Boolean);
    const install = 850;
    const total = items.reduce((s, i) => s + i.p.price, 0) + install;
    out.innerHTML = `<div class="card card-pad" style="max-width:800px">
      <b style="font-size:1.1rem;display:flex;align-items:center;gap:9px">${IC.spark} ${State.lang==="ar"?"حزمة EVHub المتكاملة":"Your complete EVHub bundle"} — ${vName(v)}</b>
      <div class="grid" style="gap:12px;margin-top:16px">
        ${items.map(({p, why}, i) => `<div style="display:flex;gap:15px;align-items:center;padding:14px;border:1px solid var(--line);border-radius:16px">
          <div class="avatarbtn" style="width:46px;height:46px;flex-shrink:0">${i===0?IC.plug:i===items.length-1?IC.sun:IC.bolt}</div>
          <div style="flex:1"><b style="font-size:.94rem">${LOC(p.name)}</b>
            <div style="font-size:.79rem;color:var(--ink-3)">${why}</div></div>
          <b class="num" style="color:var(--accent);white-space:nowrap">${SAR(p.price)}</b></div>`).join("")}
        <div style="display:flex;gap:15px;align-items:center;padding:14px;border-radius:16px;background:var(--mint-soft);border:1px solid #bfe6d4">
          <div class="avatarbtn" style="width:46px;height:46px;flex-shrink:0">${IC.wrench}</div>
          <div style="flex:1"><b style="font-size:.94rem">${State.lang==="ar"?"خدمة التركيب المعتمدة":"Certified installation"}</b>
            <div style="font-size:.79rem;color:var(--ink-3)">${t("sv.recSurvey")}</div></div>
          <b class="num" style="color:var(--accent);white-space:nowrap">${SAR(install)}</b></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;flex-wrap:wrap;gap:12px">
        <div><small style="color:var(--ink-3);font-weight:700">${State.lang==="ar"?"إجمالي الحزمة":"Bundle total"}</small>
          <div class="num" style="font-size:1.8rem;font-weight:700">${SAR(total)}</div></div>
        <button class="btn btn-primary btn-lg" id="bdAdd">${State.lang==="ar"?"أضف الحزمة للسلة":"Add bundle to cart"}</button>
      </div></div>`;
    out.querySelector("#bdAdd").addEventListener("click", () => toast(State.lang==="ar"?"أُضيفت الحزمة — سنتواصل لتأكيد موعد التركيب":"Bundle added — we'll confirm installation", 4000));
  };
  app.querySelector("#bdV").addEventListener("change", render);
  render();
}

/* ═══ Simulator ═══ */
function toolSim(app){
  toolShell(app, t("sim.title"), t("sim.desc"), `
    <div class="seg" style="margin-bottom:22px">
      <button data-sim="tesla" class="on">Tesla OS</button>
      <button data-sim="byd">BYD DiLink</button>
    </div>
    <div class="card" style="max-width:880px;background:#000;border-color:#222;border-radius:26px;padding:16px">
      <div id="simScreen" style="border-radius:14px;overflow:hidden;background:#0a0a0a;aspect-ratio:16/8.5;position:relative;direction:ltr"></div>
    </div>
    <div class="soon-banner" style="margin-top:18px;max-width:880px">${IC.clock} <span>${t("sim.soon")}</span></div>`);
  const screen = app.querySelector("#simScreen");
  const renderSim = kind => {
    if (kind === "tesla"){
      screen.innerHTML = `
        <div style="display:grid;grid-template-columns:38% 62%;height:100%;font-family:'Space Grotesk'">
          <div style="border-right:1px solid #1c1c1c;padding:18px;display:flex;flex-direction:column;color:#eee">
            <div style="font-size:.7rem;color:#888">P R N <b style="color:#fff">D</b></div>
            <div style="margin:auto;text-align:center">
              <div style="font-size:2.8rem;font-weight:700" id="simSpeed">0</div>
              <div style="font-size:.65rem;color:#888">km/h</div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:.72rem;color:#9f9"><span>▲ 372 km</span><span>82%</span></div>
          </div>
          <div style="position:relative;background:#101418">
            <div style="position:absolute;inset:0;background:radial-gradient(420px 220px at 70% 30%,#1c2a38,transparent)"></div>
            <div style="position:absolute;top:12px;left:14px;color:#eee;font-size:.8rem">📍 ${State.lang==="ar"?"الرياض — حي الياسمين":"Riyadh — Al Yasmin"}</div>
            <div style="position:absolute;bottom:0;inset-inline:0;display:flex;justify-content:space-around;padding:11px;background:rgba(0,0,0,.5);backdrop-filter:blur(8px)">
              ${["🚗","🌡️","🎵","📞","⚡","⚙️"].map((e, i) => `<button class="simBtn" data-b="${i}" style="font-size:1.2rem;padding:6px 11px;border-radius:10px">${e}</button>`).join("")}
            </div>
            <div id="simPanel" style="position:absolute;bottom:64px;inset-inline:14px;color:#ddd;font-size:.76rem"></div>
          </div>
        </div>`;
      let sp = 0;
      const iv = setInterval(() => {
        const el = document.getElementById("simSpeed");
        if (!el){ clearInterval(iv); return; }
        sp = (sp + 7) % 128; el.textContent = sp;
      }, 900);
      screen.querySelectorAll(".simBtn").forEach(b => b.addEventListener("click", () => {
        const msgs = [
          State.lang==="ar"?"التحكم بالسيارة: الأبواب، الأضواء، الوضع الرياضي":"Car controls: doors, lights, sport mode",
          State.lang==="ar"?"المناخ: تبريد المقاعد + حماية المقصورة من الحرارة":"Climate: seat cooling + cabin overheat protection",
          State.lang==="ar"?"الوسائط: راديو، بلوتوث، بودكاست":"Media: radio, Bluetooth, podcasts",
          State.lang==="ar"?"الهاتف متصل":"Phone connected",
          State.lang==="ar"?"الشحن: 82٪ — جدولة الشحن الليلي مفعّلة":"Charging: 82% — night charging scheduled",
          State.lang==="ar"?"الإعدادات: تحديث 2026.24 متاح OTA":"Settings: update 2026.24 available OTA",
        ];
        screen.querySelector("#simPanel").innerHTML = `<div style="background:rgba(20,25,30,.92);border:1px solid #2a3540;border-radius:12px;padding:12px 16px">${msgs[+b.dataset.b]}</div>`;
      }));
    } else {
      screen.innerHTML = `
        <div style="height:100%;background:linear-gradient(160deg,#0d1526,#1a2436);color:#e8ecf4;padding:16px;font-family:'Space Grotesk';position:relative">
          <div style="display:flex;justify-content:space-between;font-size:.75rem;color:#9fb0c8"><span>BYD DiLink 100</span><span>28°C ☀</span></div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px">
            ${[["⚡", State.lang==="ar"?"الطاقة":"Energy","96%"],["❄️", State.lang==="ar"?"المناخ":"Climate","22°"],["🗺️", State.lang==="ar"?"الملاحة":"Nav","—"],["🎵", State.lang==="ar"?"الموسيقى":"Music","▶"],["📷","360","●"],["🔋","V2L","OFF"]]
              .map(([e, lb, val]) => `<button class="bydTile" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:16px;text-align:center;color:#e8ecf4">
              <div style="font-size:1.5rem">${e}</div><div style="font-size:.72rem;margin-top:4px;color:#9fb0c8">${lb}</div><b style="font-size:.85rem">${val}</b></button>`).join("")}
          </div>
          <div id="bydMsg" style="position:absolute;bottom:14px;inset-inline:16px;font-size:.75rem;color:#7dd3b9"></div>
        </div>`;
      screen.querySelectorAll(".bydTile").forEach(b => b.addEventListener("click", () => {
        screen.querySelector("#bydMsg").textContent = State.lang==="ar" ? "نظام محاكى — النسخة الكاملة مع إطلاق التطبيق" : "Simulated — full version with the app launch";
      }));
    }
  };
  app.querySelectorAll("[data-sim]").forEach(b => b.addEventListener("click", () => {
    app.querySelectorAll("[data-sim]").forEach(x => x.classList.toggle("on", x === b));
    renderSim(b.dataset.sim);
  }));
  renderSim("tesla");
}

/* ═══ AR ═══ */
function toolAR(app){
  toolShell(app, t("arp.title"), "", `
    <div class="card" style="max-width:740px;overflow:hidden">
      <img src="../Media/home-charger.webp" alt="" style="width:100%;aspect-ratio:16/8;object-fit:cover">
      <div class="card-pad">
        <span class="badge badge-soon" style="margin-bottom:12px">${t("soon")}</span>
        <p style="color:var(--ink-2)">${t("arp.desc")}</p>
        <p style="font-size:.85rem;color:var(--ink-3)">${t("arp.soon")}</p>
        <button class="btn btn-primary" id="arNotify">${t("notify")}</button>
      </div></div>`);
  app.querySelector("#arNotify").addEventListener("click", () => toast(t("notified")));
}
