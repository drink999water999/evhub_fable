/* EVHub — Vehicle detail v3 */
"use strict";

Routes.vehicle = (app, parts) => {
  const v = DB.VEHICLES.find(x => x.id === parts[0]);
  if (!v){ location.hash = "#/market"; return; }
  const seller = DB.SELLERS[v.sellerId];
  const isCar = v.cat === "car";
  // Trucks and motorcycles have real batteries and intercity range, so they
  // get the battery passport + decision tools just like cars.
  const bigEV = ["car", "truck", "motorcycle"].includes(v.cat);
  const alertOn = !!State.alerts[v.id];
  const summer = realRange(v);

  const secs = [
    ["overview", t("vd.secOverview")],
    ["specs", t("vd.secSpecs")],
    bigEV && ["battery", t("vd.secBattery")],
    bigEV && ["tools", t("vd.secTools")],
    ["reviews", t("vd.secReviews")],
    ["seller", t("vd.secSeller")],
  ].filter(Boolean);

  app.innerHTML = `<div class="page">
  <div class="wrap">
    <div class="crumbs"><a href="#/">${t("nav.home")}</a> ‹ <a href="#/market">${t("vd.back")}</a> ‹ <span>${vName(v)}</span></div>

    <div class="detail-grid">
      <div>
        <div class="gal-main">
          <img src="${v.img?.src || ""}" alt="${vName(v)}" onerror="this.style.display='none'">
          <div class="vcard-badges">
            ${v.verified ? `<span class="badge badge-verified">${IC.shield} ${t("vd.verified")}</span>` : ""}
            ${v.inspected ? `<span class="badge badge-gold">${IC.check} ${t("vd.inspected")}</span>` : ""}
            ${v.cond === "new" ? `<span class="badge badge-new">${t("vd.newBadge")}</span>` : ""}
          </div>
          ${v.img ? `<a class="img-credit" href="${v.img.page}" target="_blank" rel="noopener">${t("vd.photoCredit")}: ${v.img.credit}</a>` : ""}
        </div>
        <!-- quick hero stats -->
        <div class="spec-row-grid" style="margin-top:18px">
          ${bigEV ? `
          <div class="spec-tile hero-spec"><div class="si">${IC.sun}</div>
            <div><small>${t("vd.rangeSummer")}</small><b class="num">≈ ${fmtN(summer)} ${t("km")}</b></div></div>` : ""}
          <div class="spec-tile"><div class="si">${IC.range}</div>
            <div><small>${t("vd.range")} (${v.rangeStd})</small><b class="num">${fmtN(v.range)} ${t("km")}</b></div></div>
          <div class="spec-tile"><div class="si">${IC.batt}</div>
            <div><small>${t("vd.batt")}</small><b class="num">${v.batt} ${t("kwh")}</b></div></div>
          ${isCar && v.t1080 ? `<div class="spec-tile"><div class="si">${IC.bolt}</div>
            <div><small>${t("vd.chargeTime")}</small><b class="num">${v.t1080} ${t("min")}</b></div></div>` : ""}
        </div>
        ${bigEV ? `<div class="tip-band light" style="margin-top:12px">${IC.bulb} <span>${t("vd.summerNote")}</span></div>` : ""}
      </div>

      <aside class="dpanel">
        <div class="card card-pad">
          <div class="dhead">
            <h1>${vName(v)}</h1>
            <div class="sub"><span class="num">${v.year}</span> · ${cityName(v.city)} · ${v.cond === "new" ? t("mk.condNew") : `${fmtN(v.odo)} ${t("km")}`}</div>
          </div>
          <div class="dprice"><b class="num">${fmtN(v.price)}</b><span>${t("sar")} · ${t("vd.inclVat")}</span></div>
          ${bigEV ? `<div class="dfin">${t("vd.estFin")}: <b class="num">${SAR(finMonthly(v.price))}</b> ${t("perMonth")} <small style="color:var(--ink-3)">· ${t("vd.finNote")}</small></div>` : ""}
          ${v.cond === "used" && bigEV ? `<div style="margin:16px 0 4px"><div class="soh">
            <span style="font-size:.74rem;color:var(--ink-3);font-weight:700">${t("vd.soh")}</span>
            <div class="soh-track"><div class="soh-fill ${v.soh>=90?"ok":v.soh>=80?"mid":"low"}" style="width:${v.soh}%"></div></div>
            <span class="soh-val num">${v.soh}%</span></div></div>` : ""}
          <div class="dactions" style="margin-top:18px">
            <button class="btn btn-primary btn-lg full" id="btnOffer">${t("vd.actOffer")}</button>
            <button class="btn btn-dark" id="btnMsg">${t("vd.actMsg")}</button>
            <button class="btn btn-dark" id="btnTest">${t("vd.actTest")}</button>
            <button class="btn btn-ghost" id="btnSave">${IC.heart} ${isSaved(v.id) ? t("vd.actSaved") : t("vd.actSave")}</button>
            <button class="btn btn-ghost" id="btnShare">${t("vd.actShare")}</button>
            <button class="btn btn-ghost full" id="btnAlert">${alertOn ? t("vd.alertOn") : "🔔 " + t("vd.alertBtn")}</button>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
            <span class="chip chip-btn ${State.compare.includes(v.id)?"on":""}" data-cmp-d="${v.id}">${IC.scale} ${State.compare.includes(v.id)?t("mk.inCompare"):t("mk.compare")}</span>
            <button style="font-size:.76rem;color:var(--ink-3);text-decoration:underline" id="btnReport">${t("vd.actReport")}</button>
          </div>
        </div>
        <div class="card card-pad" style="display:flex;align-items:center;gap:13px">
          <div class="avatarbtn" style="width:48px;height:48px">${seller.type==="dealer"?IC.car:IC.users}</div>
          <div style="flex:1"><b style="font-size:.95rem">${LOC(seller.name)}</b>
            <div style="font-size:.78rem;color:var(--ink-3)">${seller.verified ? `${t("vd.verified")} · ` : ""}${t("vd.sellerSince")} <span class="num">${seller.since}</span></div></div>
          <span class="rating">${IC.star} <span class="num">${seller.rating}</span></span>
        </div>
      </aside>
    </div>
  </div>

  <!-- section nav -->
  <div class="sec-nav"><div class="wrap" style="display:flex;gap:4px;overflow-x:auto;scrollbar-width:none">
    ${secs.map(([id, lb], i) => `<a href="#sec-${id}" data-sec="${id}" class="${i===0?"on":""}">${lb}</a>`).join("")}
  </div></div>

  <div class="wrap">
    <section class="vsection" id="sec-overview">
      <h2><span class="hico">${IC.spark}</span>${t("vd.secOverview")}</h2>
      <div id="ovBody"></div>
    </section>
    <section class="vsection" id="sec-specs">
      <h2><span class="hico">${IC.gauge}</span>${t("vd.secSpecs")}</h2>
      <div id="specBody"></div>
    </section>
    ${bigEV ? `
    <section class="vsection" id="sec-battery">
      <h2><span class="hico">${IC.batt}</span>${t("vd.secBattery")}</h2>
      <div id="battBody"></div>
    </section>
    <section class="vsection" id="sec-tools">
      <h2><span class="hico">${IC.target}</span>${t("vd.secTools")}</h2>
      <div id="toolsBody"></div>
    </section>` : ""}
    <section class="vsection" id="sec-reviews">
      <h2><span class="hico">${IC.users}</span>${t("vd.secReviews")}</h2>
      <div id="revBody"></div>
    </section>
    <section class="vsection" id="sec-seller">
      <h2><span class="hico">${IC.shield}</span>${t("vd.secSeller")}</h2>
      <div id="sellerBody"></div>
    </section>

    <section class="section"><div class="section-head"><h2>${t("vd.similar")}</h2></div>
      <div class="grid g4" id="simGrid"></div></section>
  </div>
  ${footerHTML()}
  </div>`;

  /* overview */
  app.querySelector("#ovBody").innerHTML = overviewHTML(v, summer);
  /* specs */
  app.querySelector("#specBody").innerHTML = specsHTML(v);
  /* battery passport */
  if (bigEV){ app.querySelector("#battBody").innerHTML = batteryHTML(v); mountBattery(app, v); }
  /* tools */
  if (bigEV){ app.querySelector("#toolsBody").innerHTML = toolsHTML(v); mountDetailTools(app, v); }
  /* reviews */
  app.querySelector("#revBody").innerHTML = reviewsHTML(v);
  /* seller */
  app.querySelector("#sellerBody").innerHTML = sellerHTML(v);
  /* similar */
  const similar = DB.VEHICLES.filter(x => x.id !== v.id && x.cat === v.cat).slice(0, 4);
  app.querySelector("#simGrid").innerHTML = similar.map(vehicleCard).join("");
  bindCards(app.querySelector("#simGrid"));

  /* section nav: smooth scroll + active state */
  const navLinks = [...app.querySelectorAll("[data-sec]")];
  navLinks.forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    document.getElementById("sec-" + a.dataset.sec)?.scrollIntoView({behavior:"smooth", block:"start"});
  }));
  const secEls = secs.map(([id]) => document.getElementById("sec-" + id)).filter(Boolean);
  const secObs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting){
      navLinks.forEach(a => a.classList.toggle("on", "sec-" + a.dataset.sec === e.target.id));
    }});
  }, {rootMargin:"-30% 0px -60% 0px"});
  secEls.forEach(s => secObs.observe(s));

  /* actions */
  app.querySelector("#btnSave").addEventListener("click", e => {
    toggleSave(v.id); e.currentTarget.innerHTML = `${IC.heart} ${isSaved(v.id) ? t("vd.actSaved") : t("vd.actSave")}`;
  });
  app.querySelector("#btnShare").addEventListener("click", () => {
    try { navigator.clipboard?.writeText(location.href); } catch(e){}
    toast(t("copied"));
  });
  app.querySelector("#btnAlert").addEventListener("click", e => {
    State.alerts[v.id] = !State.alerts[v.id]; persist();
    e.currentTarget.innerHTML = State.alerts[v.id] ? t("vd.alertOn") : "🔔 " + t("vd.alertBtn");
    if (State.alerts[v.id]) toast(State.lang==="ar" ? "سنشعرك فور انخفاض السعر أو توفر تحديث OTA مهم" : "We'll alert you on price drops or important OTA updates");
  });
  app.querySelector("#btnMsg").addEventListener("click", () => toast(t("msgSoon"), 3800));
  app.querySelector("#btnTest").addEventListener("click", () => { location.hash = "#/community"; });
  app.querySelector("#btnReport").addEventListener("click", () => toast(t("reportSent")));
  const cmpD = app.querySelector("[data-cmp-d]");
  cmpD.addEventListener("click", () => {
    toggleCompare(v.id);
    cmpD.classList.toggle("on", State.compare.includes(v.id));
    cmpD.innerHTML = `${IC.scale} ${State.compare.includes(v.id) ? t("mk.inCompare") : t("mk.compare")}`;
  });
  app.querySelector("#btnOffer").addEventListener("click", () => {
    openModal(t("vd.actOffer"), `
      <p style="font-size:.9rem;color:var(--ink-2)">${vName(v)} — ${SAR(v.price)}</p>
      <div class="selrow"><label>${t("yourOffer")}</label>
        <input type="number" id="offerVal" value="${Math.round(v.price*0.95)}" step="500"></div>
      <button class="btn btn-primary btn-block btn-lg" id="offerSend" style="margin-top:16px">${t("sendOffer")}</button>`,
      root => root.querySelector("#offerSend").addEventListener("click", () => { closeModal(); toast(t("offerSent"), 3800); }));
  });
};

/* ── section builders ── */
function overviewHTML(v, summer){
  const bigEV = ["car", "truck", "motorcycle"].includes(v.cat);
  const tiles = [
    bigEV && [IC.sun, t("vd.rangeSummer"), `≈ ${fmtN(summer)} ${t("km")}`, true],
    [IC.range, `${t("vd.range")} (${v.rangeStd})`, `${fmtN(v.range)} ${t("km")}`],
    [IC.batt, t("vd.batt"), `${v.batt} ${t("kwh")}`],
    v.cond === "used" && [IC.shield, t("vd.soh"), `${v.soh}%`],
    v.dc && [IC.bolt, t("vd.dc"), `${v.dc} ${t("kw")}`],
    v.t1080 && [IC.clock, t("vd.chargeTime"), `${v.t1080} ${t("min")}`],
    [IC.gauge, t("vd.drivetrain"), v.drive],
    [IC.users, t("vd.seats"), String(v.seats)],
  ].filter(Boolean);
  return `<div class="spec-row-grid">${tiles.map(([ic, k, val, hero]) =>
    `<div class="spec-tile ${hero ? "hero-spec" : ""}"><div class="si">${ic}</div>
      <div><small>${k}</small><b class="num">${val}</b></div></div>`).join("")}</div>`;
}

function specsHTML(v){
  const bigEV = ["car", "truck", "motorcycle"].includes(v.cat);
  const sheet = (icon, title, rows) => `<div class="card sheet">
    <div class="sheet-head"><span class="si">${icon}</span><b>${title}</b></div>
    <div class="sheet-body">${rows.filter(Boolean).map(([k, val, hl]) =>
      `<div class="sheet-row ${hl ? "hl" : ""}"><span>${k}</span><b class="num">${val}</b></div>`).join("")}</div></div>`;
  return `<div class="grid g2" style="align-items:start">
    ${sheet(IC.batt, t("vd.grpBattery"), [
      [t("vd.batt"), `${v.batt} ${t("kwh")}`],
      v.cond === "used" && [t("vd.soh"), `${v.soh}%`, true],
      v.dc && [t("vd.dc"), `${v.dc} ${t("kw")} · ${v.connDC}`],
      [t("vd.ac"), `${v.ac} ${t("kw")} · ${v.connAC}`],
      v.t1080 && [t("vd.chargeTime"), `${v.t1080} ${t("min")}`],
      v.cat !== "truck" && [t("vd.v2l"), v.v2l ? `✓ ${t("vd.yes")}` : t("vd.no")],
    ])}
    ${sheet(IC.range, t("vd.grpPerf"), [
      [`${t("vd.range")} (${v.rangeStd})`, `${fmtN(v.range)} ${t("km")}`],
      bigEV && [t("vd.rangeSummer"), `≈ ${fmtN(realRange(v))} ${t("km")}`, true],
      [t("vd.drivetrain"), v.drive],
      [t("vd.seats"), String(v.seats)],
    ])}
    ${sheet(IC.cal, t("vd.grpGeneral"), [
      [t("vd.year"), String(v.year)],
      v.cond === "used" && [t("vd.odo"), `${fmtN(v.odo)} ${t("km")}`],
      [t("vd.city"), cityName(v.city)],
      [t("vd.source"), LOC(v.source)],
    ])}
    ${sheet(IC.shield, t("vd.grpOwn"), [
      [t("vd.warranty"), LOC(v.warranty)],
      [t("vd.inspected"), v.inspected ? `✓ ${t("vd.yes")}` : t("vd.no")],
      [t("vd.verified"), v.verified ? `✓ ${t("vd.yes")}` : t("vd.no")],
    ])}
  </div>`;
}

/* battery passport + AI predictor */
function certRing(pct){
  const r = 48, circ = 2 * Math.PI * r;
  return `<div class="ring"><svg width="120" height="120" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="10"/>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="#c9f158" stroke-width="10" stroke-linecap="round"
      stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - pct/100)}" style="transition:stroke-dashoffset 1s"/></svg>
    <div class="val"><b class="num">${pct}%</b><small>${t("vd.soh")}</small></div></div>`;
}
function batteryHTML(v){
  const isNew = !v.inspected;
  const facts = isNew ? [
    [t("vd.warranty"), LOC(v.warranty)],
    [t("vd.year"), `<span class="num">${v.year}</span> · ${t("mk.condNew")}`],
    [t("vd.connector"), `${v.connAC} / ${v.connDC}`],
    [t("vd.source"), LOC(v.source)],
  ] : [
    [t("vd.sohBy"), State.lang==="ar" ? "مركز فحص EVHub — " + cityName(v.city) : "EVHub Centre — " + cityName(v.city)],
    [t("vd.sohDate"), `<span class="num">2026-06-14</span>`],
    [t("vd.sohMethod"), State.lang==="ar" ? "فحص OBD + اختبار سعة DC" : "OBD scan + DC capacity test"],
    [t("vd.connector"), `${v.connAC} / ${v.connDC}`],
  ];
  return `
  <!-- certificate -->
  <div class="panel-dark cert-card">
    <div class="cert-head">
      <div class="cert-title"><span class="ci">${IC.shield}</span>
        <span><b>${t("vd.sohTitle")}</b><small>${vName(v)} · <span class="num">${v.year}</span></small></span></div>
      ${v.verified ? `<span class="pill-lime">${IC.check} ${t("vd.verified")}</span>` : ""}
    </div>
    <div class="ring-wrap">
      ${certRing(v.soh)}
      <div style="flex:1;min-width:200px">
        <b style="color:#fff;font-size:1rem;display:block;margin-bottom:8px">${isNew ? t("vd.sohNewCar") : (State.lang==="ar" ? "بطارية بحالة ممتازة وموثّقة" : "Excellent, verified battery condition")}</b>
        <div class="soh" style="margin-bottom:10px"><div class="soh-track"><div class="soh-fill ok" style="width:${v.soh}%"></div></div>
          <span class="soh-val num" style="color:var(--lime)">${v.soh}%</span></div>
        <p class="muted" style="font-size:.82rem;margin:0">${LOC(v.warranty)}</p>
      </div>
    </div>
    <div class="cert-facts">
      ${facts.map(([k, val]) => `<div class="cert-fact"><small>${k}</small><b>${val}</b></div>`).join("")}
    </div>
    ${isNew
      ? `<div class="tip-band">${IC.bulb} <span>${State.lang==="ar" ? "تصدر شهادة الفحص الرقمية للسيارات المستعملة بعد فحص معتمد — هذه سيارة جديدة بضمان المصنع." : "Digital certificates are issued for used cars after an approved inspection — this is a new car under factory warranty."}</span></div>`
      : `<button class="btn btn-primary" id="dlCert">⬇ ${t("vd.sohDl")}</button>`}
  </div>

  <!-- predictor: controls (start side / right in RTL) + result (end side / left in RTL) -->
  <div class="bt-grid" style="margin-top:22px">
    <div class="card card-pad bt-controls" style="display:flex;flex-direction:column;gap:16px">
      <div>
        <b style="font-size:1.05rem;display:flex;align-items:center;gap:9px">${IC.chart} ${t("bt.title")}</b>
        <p style="font-size:.84rem;color:var(--ink-2);margin:6px 0 0">${t("bt.sub")}</p>
      </div>
      <div class="selrow"><label>${t("bt.cityClimate")}</label>
        <select id="btCity">${DB.CITIES.map(c => `<option value="${c.id}" ${c.id===v.city?"selected":""}>${LOC(c)}${["riyadh","makkah","dammam","madinah"].includes(c.id) ? (State.lang==="ar"?" · حرارة مرتفعة":" · high heat") : ""}</option>`).join("")}</select></div>
      <div>
        <label style="font-size:.82rem;font-weight:700;color:var(--ink-2);display:block;margin-bottom:9px">${t("bt.usage")}</label>
        <div style="display:flex;flex-direction:column;gap:9px">
          ${[["heavy", IC.bolt, 110, 7, 35],["mid", IC.cal, 38, 4, 20],["light", IC.leaf, 15, 2, 10]].map(([k, ic, km, d, f]) =>
            `<button class="preset ${k==="mid"?"sel":""}" data-preset="${k}" data-km="${km}" data-days="${d}" data-fast="${f}">
              <span style="flex:1"><b>${t("bt."+k)}</b><small>${t("bt."+k+"D")}</small></span>
              <span class="pi">${ic}</span></button>`).join("")}
        </div>
      </div>
      <div class="calc-row"><label>${t("bt.kmDay")} <b class="num" id="btKmV">38 ${t("km")}</b></label>
        <input type="range" id="btKm" min="5" max="200" step="1" value="38"></div>
      <div class="calc-row"><label>${t("bt.daysWeek")} <b class="num" id="btDaysV">4/7</b></label>
        <input type="range" id="btDays" min="1" max="7" value="4"></div>
      <div class="calc-row"><label>${t("bt.fastPct")} <b class="num" id="btFastV">20%</b></label>
        <input type="range" id="btFast" min="0" max="100" step="5" value="20"></div>
      <div class="selrow"><label>${t("bt.parking")}</label>
        <select id="btPark"><option value="0">${t("bt.shade")}</option><option value="1" selected>${t("bt.mixed")}</option><option value="2">${t("bt.sun")}</option></select></div>
    </div>
    <div class="panel-dark bt-result-panel" id="btResult"></div>
  </div>`;
}

function mountBattery(app, v){
  app.querySelector("#dlCert")?.addEventListener("click", () => toast(t("comingSoonMsg")));
  const $ = id => app.querySelector("#" + id);
  const presets = [...app.querySelectorAll("[data-preset]")];
  const syncPresetHighlight = () => {
    const km = +$("btKm").value, d = +$("btDays").value;
    presets.forEach(p => p.classList.toggle("sel", +p.dataset.km === km && +p.dataset.days === d));
  };
  presets.forEach(p => p.addEventListener("click", () => {
    $("btKm").value = p.dataset.km; $("btDays").value = p.dataset.days; $("btFast").value = p.dataset.fast;
    render();
  }));
  /* SoH projection chart — SVG line/area over 8 years, 70% threshold, markers at 3 & 5 */
  const sohChartSVG = m => {
    const W = 560, H = 252, x0 = 44, x1 = 540, y0 = 22, y1 = 200;
    const lo = Math.min(68, Math.floor(Math.min(...m.pts) / 5) * 5 - 2), hi = 100;
    const X = yr => x0 + (x1 - x0) * yr / 8;
    const Y = soh => y1 - (y1 - y0) * (soh - lo) / (hi - lo);
    const line = m.pts.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p).toFixed(1)}`).join(" ");
    const area = `${line} L${x1},${y1} L${x0},${y1} Z`;
    const grid = [100, 90, 80, 70].filter(g => g >= lo).map(g => `
      <line x1="${x0}" y1="${Y(g)}" x2="${x1}" y2="${Y(g)}" stroke="rgba(255,255,255,.10)" stroke-width="1"/>
      <text x="${x0 - 8}" y="${Y(g) + 4}" fill="#8fb3a0" font-size="11" text-anchor="end" font-family="Space Grotesk">${g}%</text>`).join("");
    const thresh = 70 >= lo ? `
      <line x1="${x0}" y1="${Y(70)}" x2="${x1}" y2="${Y(70)}" stroke="#f37070" stroke-width="1.6" stroke-dasharray="6 5" opacity=".8"/>
      <text x="${x1}" y="${Y(70) - 7}" fill="#f37070" font-size="10.5" text-anchor="end" opacity=".9">${t("bt.threshold")}</text>` : "";
    const dots = m.pts.map((p, i) => {
      const key = i === 3 || i === 5;
      return `
      <circle cx="${X(i)}" cy="${Y(p)}" r="${key ? 6 : 3.2}" fill="${key ? "#c9f158" : "#7ea88f"}" stroke="${key ? "#0b2e20" : "none"}" stroke-width="${key ? 2.5 : 0}"/>
      ${key ? `<rect x="${X(i) - 26}" y="${Y(p) - 34}" width="52" height="21" rx="10" fill="rgba(201,241,88,.16)" stroke="rgba(201,241,88,.4)"/>
      <text x="${X(i)}" y="${Y(p) - 19}" fill="#c9f158" font-size="12.5" font-weight="700" text-anchor="middle" font-family="Space Grotesk">${p}%</text>` : ""}`;
    }).join("");
    const xLabels = m.pts.map((_, i) => `
      <text x="${X(i)}" y="${y1 + 22}" fill="#8fb3a0" font-size="11" text-anchor="middle" font-family="Space Grotesk">${i === 0 ? t("bt.chartNow") : i}</text>`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;direction:ltr" role="img" aria-label="${t("bt.chartTitle")}">
      <defs><linearGradient id="sohGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#c9f158" stop-opacity=".28"/><stop offset="1" stop-color="#c9f158" stop-opacity=".02"/>
      </linearGradient></defs>
      ${grid}${thresh}
      <path d="${area}" fill="url(#sohGrad)"/>
      <path d="${line}" fill="none" stroke="#c9f158" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}${xLabels}
      <text x="${(x0 + x1) / 2}" y="${H - 4}" fill="#6c8a79" font-size="10.5" text-anchor="middle">${t("bt.chartYear")} →</text>
    </svg>`;
  };

  const render = () => {
    const km = +$("btKm").value, days = +$("btDays").value, fast = +$("btFast").value;
    const park = +$("btPark").value, city = $("btCity").value;
    $("btKmV").textContent = `${km} ${t("km")}`;
    $("btDaysV").textContent = `${days}/7`;
    $("btFastV").textContent = `${fast}%`;
    syncPresetHighlight();
    const m = degradationModel(v, city, {kmDay:km, daysWeek:days, fastPct:fast, parkSun:park});
    const heavy = m.annual >= 1.4;
    $("btResult").innerHTML = `
      <div class="bt-res-head">
        <span class="pill-lime">${heavy ? "⚠ " + t("bt.resultKickerWarn") : IC.check + " " + t("bt.resultKicker")}</span>
        <div class="bt-res-hero">
          <div>
            <div class="stat-big num">${m.y5}%</div>
            <div class="muted" style="font-size:.86rem">${t("bt.y5")}</div>
          </div>
          <div class="bt-res-chips">
            <span class="pill-dark num">${fmtN(m.kmYear)} ${t("bt.kmYear")}</span>
            <span class="pill-dark">${t("bt.annual")} <b class="num" style="color:var(--lime)">&nbsp;${m.annual}%&nbsp;</b> ${t("bt.annualUnit")}</span>
            <span class="pill-dark num">≈ ${m.to70} ${t("bt.years")} ${t("bt.to70")}</span>
          </div>
        </div>
      </div>
      <div class="bt-chart">
        <small class="bt-chart-title">${IC.chart} ${t("bt.chartTitle")}</small>
        ${sohChartSVG(m)}
      </div>
      <div class="pred-stats">
        ${[[t("bt.now"), v.soh, null],[t("bt.y3"), m.y3, m.y3 - v.soh],[t("bt.y5"), m.y5, m.y5 - v.soh]].map(([lb, val, d]) => `
        <div class="pred-stat"><small>${lb}</small><b class="num">${val}%</b>
          ${d == null ? `<span class="pred-delta num" style="opacity:.4">—</span>` : `<span class="pred-delta num">${d.toFixed(1)}%</span>`}
          <div class="bar"><i style="width:${val}%"></i></div></div>`).join("")}
      </div>
      <p class="muted" style="font-size:.76rem;margin:14px 0 0">${t("bt.resultDesc")} ${t("bt.note")}</p>`;
  };
  ["btKm","btDays","btFast"].forEach(id => $(id).addEventListener("input", render));
  ["btPark","btCity"].forEach(id => $(id).addEventListener("change", render));
  render();
}

/* decision tools section (range map + readiness + TCO) */
function toolsHTML(v){
  return `
  <div class="grid" style="gap:22px">
    <!-- RANGE MAP -->
    <div class="card" style="overflow:visible"><div class="card-pad">
      <b style="font-size:1.1rem;display:flex;align-items:center;gap:9px">${IC.range} ${t("rm.title")}</b>
      <p style="font-size:.86rem;color:var(--ink-2);margin:6px 0 16px">${t("rm.sub")}</p>
      <div id="dRangeWidget"></div>
    </div></div>

    <div class="duo" style="align-items:stretch">
      <!-- READINESS -->
      <div class="card card-pad">
        <b style="font-size:1.05rem;display:flex;align-items:center;gap:9px">${IC.pin} ${t("vd.readyTitle")}</b>
        <p style="font-size:.84rem;color:var(--ink-2);margin:6px 0 14px">${t("vd.readyDesc")}</p>
        <div class="selrow" style="max-width:280px;margin-bottom:16px">
          <select id="readyCity">${DB.CITIES.map(c => `<option value="${c.id}" ${c.id===State.myCity?"selected":""}>${LOC(c)}</option>`).join("")}</select></div>
        <div id="readyOut"></div>
      </div>
      <!-- TCO -->
      <div class="card card-pad">
        <b style="font-size:1.05rem;display:flex;align-items:center;gap:9px">${IC.chart} ${t("vd.tcoTitle")}</b>
        <div class="calc-row"><label>${t("vd.tcoKm")} <b class="num" id="tKmV">20,000 ${t("km")}</b></label>
          <input type="range" id="tKm" min="5000" max="60000" step="1000" value="20000"></div>
        <div class="calc-row"><label>${t("vd.tcoElec")} <b class="num" id="tElV">30</b></label>
          <input type="range" id="tEl" min="18" max="70" step="1" value="30"></div>
        <div class="calc-row"><label>${t("vd.tcoFuel")} <b class="num" id="tFuV">2.33</b></label>
          <input type="range" id="tFu" min="1.5" max="4" step="0.01" value="2.33"></div>
        <div class="result-hero" style="margin-top:14px;padding:20px">
          <div class="big num" id="tSave">—</div>
          <div class="cap">${t("vd.tcoAnnual")} · <span id="tSave5" class="num"></span> ${t("vd.tco5")}</div>
        </div>
      </div>
    </div>

    <!-- SIMULATOR TEASER -->
    <div class="panel-dark" style="padding:26px;display:flex;gap:18px;align-items:center;flex-wrap:wrap">
      <div style="width:52px;height:52px;border-radius:15px;background:rgba(201,241,88,.13);color:var(--lime);display:grid;place-items:center">${IC.cam}</div>
      <div style="flex:1;min-width:220px"><b style="color:#fff">${t("vd.simTitle")}</b>
        <div class="muted" style="font-size:.85rem">${t("vd.simDesc")}</div></div>
      <a class="btn btn-primary" href="#/tools/sim">▶ ${t("vd.simBtn")}</a>
    </div>
  </div>`;
}

function mountDetailTools(app, v){
  // embedded range widget (defined in tools.js)
  renderRangeWidget(app.querySelector("#dRangeWidget"), {fixedVehicle:v, mapId:"dMap-" + v.id, compact:true});

  // readiness
  const readyRender = () => {
    const c = DB.CITIES.find(x => x.id === app.querySelector("#readyCity").value);
    const score = Math.min(10, Math.round((Math.min(c.chargers, 30) / 30 * 6 + Math.min(c.service, 8) / 8 * 4) * 10) / 10);
    const verdict = score >= 7.5 ? t("vd.readyGood") : score >= 5 ? t("vd.readyMid") : t("vd.readyLow");
    const col = score >= 7.5 ? "var(--ok)" : score >= 5 ? "var(--warn)" : "var(--bad)";
    const circ = 2 * Math.PI * 44;
    app.querySelector("#readyOut").innerHTML = `
      <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
        <div class="ring" style="width:108px;height:108px"><svg width="108" height="108" viewBox="0 0 108 108">
          <circle cx="54" cy="54" r="44" fill="none" stroke="var(--bg-2)" stroke-width="10"/>
          <circle cx="54" cy="54" r="44" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round"
            stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - score/10)}" style="transition:stroke-dashoffset .8s"/></svg>
          <div class="val"><b class="num" style="color:${col};font-size:1.5rem">${score}</b><small style="color:var(--ink-3)">/10</small></div></div>
        <div style="flex:1;min-width:180px">
          <b style="display:block;margin-bottom:8px;font-size:.95rem">${verdict}</b>
          <div class="vspecs">
            <span class="vspec">${IC.bolt} <b class="num">${c.chargers}</b>&nbsp;${t("vd.readyChargers")}</span>
            <span class="vspec">${IC.wrench} <b class="num">${c.service}</b>&nbsp;${t("vd.readyService")}</span>
          </div>
        </div>
      </div>`;
  };
  app.querySelector("#readyCity").addEventListener("change", readyRender);
  readyRender();

  // TCO
  const eff = v.batt / v.range * 100;
  const tcoRender = () => {
    const km = +app.querySelector("#tKm").value, hal = +app.querySelector("#tEl").value, fuel = +app.querySelector("#tFu").value;
    app.querySelector("#tKmV").textContent = `${fmtN(km)} ${t("km")}`;
    app.querySelector("#tElV").textContent = hal;
    app.querySelector("#tFuV").textContent = fuel.toFixed(2);
    const evCost = km / 100 * eff * 1.18 * (hal / 100);
    const iceCost = km / 12 * fuel;
    const save = Math.max(0, iceCost - evCost);
    app.querySelector("#tSave").textContent = SAR(save);
    app.querySelector("#tSave5").textContent = SAR(save * 5);
  };
  ["tKm","tEl","tFu"].forEach(id => app.querySelector("#" + id).addEventListener("input", tcoRender));
  tcoRender();
}

function reviewsHTML(v){
  const revs = DB.REVIEWS[v.id] || [];
  if (!revs.length) return `<div class="soon-banner">${IC.users} <span>${State.lang==="ar"?"لا توجد تجارب ملّاك لهذا الطراز بعد — كن أول من يشارك تجربته عبر المجتمع":"No owner reviews yet — be the first to share via the community"}</span></div>`;
  return `<div class="grid g2">${revs.map(r => `
    <div class="review">
      <div class="review-head"><b>${LOC(r.name)}</b><span class="stars">${"★".repeat(r.stars)}${"☆".repeat(5-r.stars)}</span></div>
      <div class="rev-facts">
        <span class="chip">${t("vd.revOwned")}: ${LOC(r.owned)}</span>
        <span class="chip num">${t("vd.revDriven")}: ${r.driven} ${t("km")}</span>
        <span class="chip">${t("vd.revSummer")}: ${LOC(r.summer)}</span>
        <span class="chip">${t("vd.revCharging")}: ${LOC(r.charging)}</span>
      </div>
      <p>${LOC(r.text)}</p>
    </div>`).join("")}</div>`;
}

function sellerHTML(v){
  const s = DB.SELLERS[v.sellerId];
  return `<div class="card card-pad" style="max-width:560px">
    <div style="display:flex;align-items:center;gap:15px;margin-bottom:18px">
      <div class="avatarbtn" style="width:58px;height:58px">${s.type==="dealer"?IC.car:IC.users}</div>
      <div><b style="font-size:1.1rem">${LOC(s.name)}</b>
        <div style="font-size:.8rem;color:var(--ink-3)">${s.type==="dealer"?(State.lang==="ar"?"معرض معتمد":"Verified dealer"):(State.lang==="ar"?"بائع فرد":"Individual seller")}${s.verified?" · "+t("vd.verified"):""}</div></div>
    </div>
    <div class="spec-row-grid">
      <div class="spec-tile"><div class="si">${IC.cal}</div><div><small>${t("vd.sellerSince")}</small><b class="num">${s.since}</b></div></div>
      <div class="spec-tile"><div class="si">${IC.star}</div><div><small>${t("sv.rating")}</small><b class="num">★ ${s.rating}</b></div></div>
      <div class="spec-tile"><div class="si">${IC.car}</div><div><small>${t("vd.sellerListings")}</small><b class="num">${s.listings}</b></div></div>
      <div class="spec-tile"><div class="si">${IC.clock}</div><div><small>${t("vd.sellerResp")}</small><b>${t("vd.sellerRespVal")}</b></div></div>
    </div>
    <button class="btn btn-dark btn-block" style="margin-top:16px" onclick="toast(t('msgSoon'),3800)">${t("vd.actMsg")}</button>
  </div>`;
}
