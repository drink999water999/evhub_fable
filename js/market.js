/* EVHub — Marketplace v3 */
"use strict";

const MK = { cat:"car", brand:"all", city:"all", maxPrice:400000, minRange:0, minSoh:0, cond:"all", conn:"all",
  verifiedOnly:false, inspOnly:false, sort:"new", q:"" };

Routes.market = (app, parts, params) => {
  if (params.get("cat")) MK.cat = params.get("cat");
  if (params.get("brand")){ MK.brand = params.get("brand"); MK.cat = "car"; }
  if (params.get("q") !== null) MK.q = params.get("q") || "";

  const catDef = [
    ["car", DB.IMG.zeekr.src], ["motorcycle", DB.IMG.moto.src], ["scooter", DB.IMG.scooter.src],
    ["bike", DB.IMG.bike.src], ["charger", DB.IMG.wallbox.src], ["parts", "../Media/ev-battery-pack.webp"],
  ];

  app.innerHTML = `<div class="page wrap">
    <div class="crumbs"><a href="#/">${t("nav.home")}</a> ‹ <span>${t("mk.title")}</span></div>
    <div class="page-head"><h1>${t("mk.title")}</h1><p>${t("mk.sub")}</p></div>

    <!-- category thumbnails -->
    <div class="cat-strip" style="margin-bottom:20px" id="catStrip">
      ${catDef.map(([c, img]) => `<a class="cat-thumb ${MK.cat===c?"on":""}" data-cat="${c}" href="#/market?cat=${c}">
        <img src="${img}" alt="" loading="lazy" onerror="this.remove()">
        <span class="lb"><b>${t("cat."+c)}</b><small class="num">${
          c==="charger"||c==="parts" ? DB.PRODUCTS.filter(p=>p.cat===c).length : DB.VEHICLES.filter(v=>v.cat===c).length
        } ${t("mk.results")}</small></span></a>`).join("")}
    </div>

    <div id="compatBanner"></div>
    <div class="market-layout">
      <aside class="card filters" id="filters"></aside>
      <div>
        <div class="market-top">
          <span class="res" id="resCount"></span>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <span id="cmpLink"></span>
            <label class="sortsel">${t("mk.sort")}
              <select id="sortSel">
                <option value="new">${t("mk.sortNew")}</option>
                <option value="priceL">${t("mk.sortPriceL")}</option>
                <option value="priceH">${t("mk.sortPriceH")}</option>
                <option value="range">${t("mk.sortRange")}</option>
                <option value="soh">${t("mk.sortSoh")}</option>
                <option value="charge">${t("mk.sortCharge")}</option>
              </select></label>
          </div>
        </div>
        <div class="results-grid" id="results"></div>
      </div>
    </div>
    ${footerHTML()}
  </div>`;

  // category thumbs
  app.querySelectorAll("[data-cat]").forEach(el => el.addEventListener("click", e => {
    e.preventDefault(); MK.cat = el.dataset.cat; MK.brand = "all";
    app.querySelectorAll("[data-cat]").forEach(x => x.classList.toggle("on", x === el));
    renderFilters(app); renderResults(app);
  }));

  renderFilters(app);
  renderResults(app);
  app.querySelector("#sortSel").value = MK.sort;
  app.querySelector("#sortSel").addEventListener("change", e => { MK.sort = e.target.value; renderResults(app); });
};

function myVehicleObj(){ return DB.VEHICLES.find(v => v.id === State.myVehicle); }

function renderFilters(app){
  const el = app.querySelector("#filters");
  const conns = ["all","Type 2","CCS2","GB/T"];
  el.innerHTML = `
    <div class="fgroup" style="display:flex;justify-content:space-between;align-items:center">
      <b style="margin:0">${t("mk.filters")}</b>
      <button class="chip chip-btn" id="fClear">${t("mk.clear")}</button></div>
    ${MK.cat === "car" ? `<div class="fgroup"><b>${t("mk.fBrand")}</b><div class="fopts">
      <button class="chip chip-btn ${MK.brand==="all"?"on":""}" data-fbrand="all">${t("cat.all")}</button>
      ${DB.BRANDS.map(b => `<button class="chip chip-btn ${MK.brand===b.id?"on":""}" data-fbrand="${b.id}">${b.id}</button>`).join("")}
    </div></div>` : ""}
    <div class="fgroup"><b>${t("mk.fCity")}</b>
      <select id="fCity" style="width:100%;border:1.5px solid var(--line-2);border-radius:12px;padding:10px 13px;background:var(--surface)">
        <option value="all">${t("mk.allCities")}</option>
        ${DB.CITIES.map(c => `<option value="${c.id}" ${MK.city===c.id?"selected":""}>${LOC(c)}</option>`).join("")}</select></div>
    <div class="fgroup"><b>${t("mk.fPrice")} <span class="fval num" id="fPriceV">${SAR(MK.maxPrice)}</span></b>
      <input type="range" id="fPrice" min="2000" max="400000" step="2000" value="${MK.maxPrice}"></div>
    <div class="fgroup"><b>${t("mk.fRange")} <span class="fval num" id="fRangeV">${MK.minRange} ${t("km")}</span></b>
      <input type="range" id="fRange" min="0" max="700" step="25" value="${MK.minRange}"></div>
    <div class="fgroup"><b>${t("mk.fSoh")} <span class="fval num" id="fSohV">${MK.minSoh}%</span></b>
      <input type="range" id="fSoh" min="0" max="100" step="5" value="${MK.minSoh}"></div>
    <div class="fgroup"><b>${t("mk.fCond")}</b><div class="fopts">
      ${["all","new","used"].map(c => `<button class="chip chip-btn ${MK.cond===c?"on":""}" data-f="cond" data-v="${c}">${c==="all"?t("cat.all"):t("mk.cond"+(c==="new"?"New":"Used"))}</button>`).join("")}</div></div>
    <div class="fgroup"><b>${t("mk.fConn")}</b><div class="fopts">
      ${conns.map(c => `<button class="chip chip-btn ${MK.conn===c?"on":""}" data-f="conn" data-v="${c}">${c==="all"?t("cat.all"):c}</button>`).join("")}</div></div>
    <div class="fgroup"><b>${t("mk.fMore")}</b>
      <label class="fcheck"><input type="checkbox" id="fVer" ${MK.verifiedOnly?"checked":""}> ${t("mk.verifiedOnly")}</label>
      <label class="fcheck"><input type="checkbox" id="fInsp" ${MK.inspOnly?"checked":""}> ${t("mk.inspOnly")}</label></div>`;

  el.querySelectorAll("[data-f]").forEach(b => b.addEventListener("click", () => {
    MK[b.dataset.f] = b.dataset.v; renderFilters(app); renderResults(app);
  }));
  el.querySelectorAll("[data-fbrand]").forEach(b => b.addEventListener("click", () => {
    MK.brand = b.dataset.fbrand; renderFilters(app); renderResults(app);
  }));
  const bindRange = (id, key, fmt) => {
    const inp = el.querySelector("#" + id);
    inp.addEventListener("input", () => { MK[key] = +inp.value; el.querySelector("#" + id + "V").textContent = fmt(+inp.value); renderResults(app); });
  };
  bindRange("fPrice","maxPrice", v => SAR(v));
  bindRange("fRange","minRange", v => `${v} ${t("km")}`);
  bindRange("fSoh","minSoh", v => `${v}%`);
  el.querySelector("#fCity").addEventListener("change", e => { MK.city = e.target.value; renderResults(app); });
  el.querySelector("#fVer").addEventListener("change", e => { MK.verifiedOnly = e.target.checked; renderResults(app); });
  el.querySelector("#fInsp").addEventListener("change", e => { MK.inspOnly = e.target.checked; renderResults(app); });
  el.querySelector("#fClear").addEventListener("click", () => {
    Object.assign(MK, {brand:"all", city:"all", maxPrice:400000, minRange:0, minSoh:0, cond:"all", conn:"all", verifiedOnly:false, inspOnly:false, q:""});
    renderFilters(app); renderResults(app);
  });
}

function productCard(p){
  const mine = myVehicleObj();
  let compat = "";
  if (mine && (p.cat === "charger" || p.cat === "parts")){
    const fits = p.compat.includes(mine.connAC);
    compat = `<span class="compat-tag ${fits?"":"no"}">${fits?IC.check:"!"} ${
      fits ? (State.lang==="ar"?`متوافق مع ${vName(mine)}`:`Fits your ${vName(mine)}`)
           : (State.lang==="ar"?"غير متوافق مع سيارتك":"Not compatible with your car")}</span>`;
  }
  const media = p.img
    ? `<span class="vcard-media"><img src="${p.img.src}" alt="${LOC(p.name)}" loading="lazy" style="object-fit:contain;padding:16px;background:#fff"
        onerror="this.parentElement.classList.add('noimg')"><span class="mono-fb" style="color:var(--ink-3)">${IC.plug}</span></span>`
    : `<span class="vcard-media" style="background:linear-gradient(140deg,var(--pine-800),var(--pine-990))">
        <span style="position:absolute;inset:0;display:grid;place-items:center;color:var(--lime)">
        <span style="width:78px;height:78px;border-radius:22px;background:rgba(201,241,88,.12);display:grid;place-items:center">${p.cat==="charger"?IC.plug:IC.batt}</span></span></span>`;
  return `<article class="card hov vcard">
    ${media}
    <div class="vcard-body">
      <div class="vcard-title"><h3>${LOC(p.name)}</h3><div class="vcard-price"><b class="num">${SAR(p.price)}</b></div></div>
      <div class="vspecs">
        ${p.power ? `<span class="vspec">${IC.bolt} <span class="num">${p.power}</span> ${t("kw")}</span>` : ""}
        <span class="vspec">${IC.plug} ${p.compat.join(" · ")}</span></div>
      <span style="font-size:.82rem;color:var(--ink-3)">${LOC(p.tag)}</span>
      ${compat}
      <div class="vcard-foot"><span style="display:inline-flex;gap:5px;align-items:center">${IC.shield} ${State.lang==="ar"?"ضمان وتركيب متاح":"Warranty & install"}</span>
        <button class="chip chip-btn" data-buy="${p.id}">${State.lang==="ar"?"أضف للسلة":"Add to cart"}</button></div>
    </div></article>`;
}

function renderResults(app){
  const mine = myVehicleObj();
  const banner = app.querySelector("#compatBanner");
  if (mine && (MK.cat === "charger" || MK.cat === "parts")){
    banner.innerHTML = `<div class="compat-banner">${IC.spark}
      <span>${t("mk.compat")} <b>${vName(mine)}</b> (${mine.connAC})</span>
      <label class="switch sw"><input type="checkbox" id="compatSw" ${State.compatOn?"checked":""}><span class="tr"></span></label></div>`;
    banner.querySelector("#compatSw").addEventListener("change", e => { State.compatOn = e.target.checked; persist(); renderResults(app); });
  } else banner.innerHTML = "";

  let items = [];
  const q = MK.q.toLowerCase();
  if (MK.cat === "charger" || MK.cat === "parts"){
    items = DB.PRODUCTS.filter(p => p.cat === MK.cat)
      .filter(p => p.price <= MK.maxPrice)
      .filter(p => !q || LOC(p.name).toLowerCase().includes(q))
      .filter(p => MK.conn === "all" || p.compat.includes(MK.conn));
    if (mine && State.compatOn) items = items.filter(p => p.compat.includes(mine.connAC));
    items.sort((a, b) => MK.sort === "priceH" ? b.price - a.price : a.price - b.price);
    app.querySelector("#results").innerHTML = items.length ? items.map(productCard).join("") : emptyState();
  } else {
    items = DB.VEHICLES
      .filter(v => v.cat === MK.cat)
      .filter(v => MK.brand === "all" || v.brand === MK.brand)
      .filter(v => MK.city === "all" || v.city === MK.city)
      .filter(v => v.price <= MK.maxPrice)
      .filter(v => v.range >= MK.minRange)
      .filter(v => v.soh >= MK.minSoh)
      .filter(v => MK.cond === "all" || v.cond === MK.cond)
      .filter(v => MK.conn === "all" || v.connAC === MK.conn || v.connDC === MK.conn)
      .filter(v => !MK.verifiedOnly || v.verified)
      .filter(v => !MK.inspOnly || v.inspected)
      .filter(v => !q || vName(v).toLowerCase().includes(q));
    const sorts = {
      new:(a,b) => b.year - a.year, priceL:(a,b) => a.price - b.price, priceH:(a,b) => b.price - a.price,
      range:(a,b) => b.range - a.range, soh:(a,b) => b.soh - a.soh, charge:(a,b) => b.dc - a.dc,
    };
    items.sort(sorts[MK.sort] || sorts.new);
    app.querySelector("#results").innerHTML = items.length ? items.map(vehicleCard).join("") : emptyState();
  }
  app.querySelector("#resCount").innerHTML = `<b class="num">${items.length}</b> ${t("mk.results")}`;
  const cl = app.querySelector("#cmpLink");
  cl.innerHTML = State.compare.length ? `<a class="btn btn-dark btn-sm" href="#/compare">${IC.scale} ${t("mk.viewCompare")} (${State.compare.length})</a>` : "";
  bindCards(app.querySelector("#results"));
  app.querySelectorAll("[data-buy]").forEach(b => b.addEventListener("click", e => {
    e.preventDefault(); toast(State.lang==="ar"?"أُضيف إلى السلة — الدفع الإلكتروني قريبًا":"Added to cart — online checkout coming soon");
  }));
}
function emptyState(){
  return `<div style="grid-column:1/-1;text-align:center;padding:70px 20px;color:var(--ink-3)">
    <div style="font-size:2.6rem;margin-bottom:10px">🔍</div>
    <b style="color:var(--ink-2)">${t("mk.noResults")}</b><br><span style="font-size:.9rem">${t("mk.noResultsSub")}</span></div>`;
}
