/* EVHub — Services, Community, Account, Sell */
"use strict";

/* ── Services ── */
Routes.services = (app) => {
  app.innerHTML = `<div class="page wrap">
    <div class="crumbs"><a href="#/">${t("nav.home")}</a> ‹ <span>${t("sv.title")}</span></div>
    <div class="tool-hero"><h1>${t("sv.title")}</h1><p>${t("sv.sub")}</p></div>
    <div class="grid g2" style="margin-bottom:26px">
      ${[["charger","plug","chargerCta","#svc-install"],["insp","shield","inspCta",""],["maint","wrench","maintCta",""],["road","car","roadCta","soon"]]
        .map(([k, ic, cta, href]) => `
        <div class="card card-pad hov ${href==="soon"?"soon-tile":""}" style="display:flex;gap:16px;align-items:flex-start">
          <div class="fico" style="width:52px;height:52px;border-radius:14px;background:var(--accent-soft);color:var(--accent-soft-ink);display:grid;place-items:center;flex-shrink:0">${IC[ic]}</div>
          <div style="flex:1"><b style="font-size:1.05rem">${t("sv."+k+"T")}</b>
            <p style="font-size:.86rem;color:var(--ink-2);margin:6px 0 12px">${t("sv."+k+"D")}</p>
            ${href==="soon" ? `<span class="badge badge-soon">${t("soon")}</span>`
              : `<button class="btn btn-soft btn-sm" data-svc="${k}">${t("sv."+cta)}</button>`}</div>
        </div>`).join("")}
    </div>

    <!-- Installation journey -->
    <section class="section" id="svc-install" style="padding-top:10px">
      <div class="section-head"><div><h2>${t("sv.chargerT")}</h2></div></div>
      <div class="tool-split">
        <div class="card card-pad range-controls">
          <div class="selrow"><label>${t("sv.q3")}</label>
            <select id="svV"><option value="">—</option>
              ${DB.VEHICLES.filter(v=>v.cat==="car").map(v => `<option value="${v.id}" ${State.myVehicle===v.id?"selected":""}>${v.brand} ${v.model}</option>`).join("")}</select></div>
          <div class="selrow"><label>${t("sv.q1")}</label>
            <select id="svP"><option value="villa">${t("sv.q1a")}</option><option value="apt">${t("sv.q1b")}</option><option value="compound">${t("sv.q1c")}</option><option value="biz">${t("sv.q1d")}</option></select></div>
          <div class="selrow"><label>${t("sv.q2")}</label>
            <select id="svPark"><option value="private">${t("sv.q2a")}</option><option value="shared">${t("sv.q2b")}</option></select></div>
          <div class="selrow"><label>${t("ac.city")}</label>
            <select id="svCity">${DB.CITIES.slice(0,6).map(c => `<option value="${c.id}" ${c.id===State.myCity?"selected":""}>${LOC(c)}</option>`).join("")}</select></div>
        </div>
        <div id="svOut"></div>
      </div>
    </section>
    ${footerHTML()}
  </div>`;

  const render = () => {
    const v = DB.VEHICLES.find(x => x.id === app.querySelector("#svV").value);
    const out = app.querySelector("#svOut");
    if (!v){ out.innerHTML = `<div class="soon-banner">${IC.plug} <span>${t("sv.q3")}</span></div>`; return; }
    const prop = app.querySelector("#svP").value;
    const kw = prop === "apt" ? Math.min(7.4, v.ac) : v.ac >= 22 ? 22 : v.ac >= 11 ? 11 : 7.4;
    const charger = kw >= 22 ? DB.PRODUCTS.find(p=>p.id==="autel-22") : kw >= 11 ? DB.PRODUCTS.find(p=>p.id==="wb-pulsar11") : DB.PRODUCTS.find(p=>p.id==="wb-pulsar7");
    const cityId = app.querySelector("#svCity").value;
    const tech = DB.TECHS.find(x => x.city === cityId) || DB.TECHS[0];
    out.innerHTML = `<div class="card card-pad">
      <span class="badge badge-verified" style="margin-bottom:12px">${IC.spark} ${t("sv.rec")}</span>
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:14px">
        <div class="avatarbtn" style="width:56px;height:56px">${IC.plug}</div>
        <div><b style="font-size:1.05rem">${LOC(charger.name)}</b>
          <div style="font-size:.8rem;color:var(--ink-3)">${t("sv.recWhy")} — ${v.ac} ${t("kw")} AC</div></div>
        <b class="num" style="margin-inline-start:auto;color:var(--accent);font-size:1.15rem">${SAR(charger.price)}</b>
      </div>
      <div class="spec-grid">
        <div class="spec-cell"><small>${t("sv.techs")}</small><b>${LOC(tech.name)}</b></div>
        <div class="spec-cell"><small>${t("sv.rating")}</small><b class="num">★ ${tech.rating} (${tech.jobs})</b></div>
        <div class="spec-cell"><small>${t("bd.install")}</small><b class="num">${SAR(tech.price)}</b></div>
        <div class="spec-cell"><small>${t("bd.total")}</small><b class="num" style="color:var(--accent)">${SAR(charger.price + tech.price)}</b></div>
      </div>
      <p style="font-size:.8rem;color:var(--ink-3);margin:12px 0">${t("sv.recSurvey")}</p>
      <button class="btn btn-primary btn-block" id="svBook">${t("sv.book")}</button></div>`;
    out.querySelector("#svBook").addEventListener("click", () => toast(t("sv.booked"), 4200));
  };
  ["svV","svP","svPark","svCity"].forEach(id => app.querySelector("#" + id).addEventListener("change", render));
  app.querySelectorAll("[data-svc]").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.svc === "charger") app.querySelector("#svc-install").scrollIntoView({behavior:"smooth"});
    else if (b.dataset.svc === "insp") toast(State.lang==="ar"?"تم استلام طلب الفحص — سنؤكد الموعد برسالة":"Inspection request received — we'll confirm by message", 3800);
    else toast(State.lang==="ar"?"فُعّلت خطة العناية — ستصلك التذكيرات حسب سيارتك":"Care plan activated — reminders tailored to your car", 3800);
  }));
  render();
};

/* ── Community ── */
Routes.community = (app) => {
  app.innerHTML = `<div class="page wrap">
    <div class="crumbs"><a href="#/">${t("nav.home")}</a> ‹ <span>${t("cm.title")}</span></div>
    <div class="tool-hero"><h1>${t("cm.title")}</h1><p>${t("cm.sub")}</p></div>

    <div class="card" style="background:var(--hero-bg);border:0;color:#eafcf4;margin-bottom:26px"><div class="card-pad" style="padding:30px">
      <span class="badge" style="background:rgba(45,212,160,.15);color:#5eead4">${IC.users} P2P</span>
      <h2 style="color:#fff;margin-top:10px">${t("cm.testT")}</h2>
      <p style="color:#b9d6cb;max-width:44em">${t("cm.testD")}</p>
      <div style="display:flex;gap:22px;flex-wrap:wrap;margin-top:14px">
        ${[1,2,3].map(n => `<span style="display:inline-flex;gap:9px;align-items:center;font-size:.86rem;color:#cfe8de">
          <span class="avatarbtn" style="width:28px;height:28px;font-size:.75rem;font-weight:700;background:rgba(45,212,160,.18);color:#5eead4">${n}</span>${t("cm.testHow"+n)}</span>`).join("")}
      </div>
    </div></div>

    <div class="section-head"><div><h2>${t("cm.owners")}</h2><div class="sub">${t("cm.sessionFee")}</div></div></div>
    <div class="grid g3" style="margin-bottom:34px">
      ${DB.OWNERS.map(o => `<div class="card card-pad hov">
        <div style="display:flex;gap:13px;align-items:center;margin-bottom:12px">
          <div class="avatarbtn" style="width:46px;height:46px">${IC.users}</div>
          <div><b>${LOC(o.name)}</b><div style="font-size:.78rem;color:var(--ink-3)">${o.car} · ${cityName(o.city)}</div></div>
          <span class="rating" style="margin-inline-start:auto">${IC.star} <span class="num">${o.rating}</span></span>
        </div>
        <div class="vspecs" style="margin-bottom:12px">
          <span class="vspec">${IC.check} <span class="num">${o.sessions}</span> ${State.lang==="ar"?"جلسة سابقة":"sessions"}</span>
          <span class="vspec">${IC.shield} ${t("vd.verified")}</span>
        </div>
        <button class="btn btn-soft btn-sm btn-block" data-owner="${o.id}">${t("cm.bookSession")} — <span class="num">${o.fee}</span> ${t("sar")}</button>
      </div>`).join("")}
    </div>

    <div class="card" style="border-color:#2aabee40"><div class="card-pad" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
      <div class="fico" style="width:54px;height:54px;border-radius:16px;background:#2aabee1d;color:#2aabee;display:grid;place-items:center">${IC.tg}</div>
      <div style="flex:1;min-width:220px"><b style="font-size:1.05rem">${t("cm.tg")}</b>
        <div style="font-size:.86rem;color:var(--ink-2)">${t("cm.tgD")}</div></div>
      <a class="btn btn-primary" href="https://t.me/" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#2aabee,#1d8fd1)">${IC.tg} ${t("cm.tgCta")}</a>
    </div></div>

    <div class="section-head" style="margin-top:34px"><div><h2>${t("cm.stories")}</h2></div></div>
    <div class="grid g3">
      ${DB.STORIES.map(s => `<div class="card card-pad">
        <div class="chip on" style="margin-bottom:10px">${LOC(s.who)}</div>
        <p style="margin:0;font-size:.93rem;color:var(--ink-2);line-height:1.7">${LOC(s.text)}</p></div>`).join("")}
    </div>
    ${footerHTML()}
  </div>`;
  app.querySelectorAll("[data-owner]").forEach(b => b.addEventListener("click", () => toast(t("cm.bookedSession"), 4000)));
};

/* ── Account ── */
Routes.account = (app, parts) => {
  const tab = parts[0] || "overview";
  const mine = DB.VEHICLES.find(v => v.id === State.myVehicle);
  const tabs = [["overview", t("ac.overview")], ["vehicle", t("ac.vehicle")], ["saved", t("ac.saved")], ["alerts", t("ac.alerts")], ["settings", t("ac.settings")]];
  app.innerHTML = `<div class="page wrap">
    <div class="crumbs"><a href="#/">${t("nav.home")}</a> ‹ <span>${t("ac.title")}</span></div>
    <div class="tool-hero"><h1>${t("ac.hello")} 👋</h1>
      <p style="font-size:.85rem">${t("ac.phoneSoon")}</p></div>
    <div class="acct-grid">
      <div class="card acct-side">
        ${tabs.map(([k, lb]) => `<a href="#/account/${k}" class="${tab===k?"on":""}">${lb}</a>`).join("")}
      </div>
      <div id="acBody"></div>
    </div>
    ${footerHTML()}
  </div>`;
  const body = app.querySelector("#acBody");

  const vehiclePicker = () => `
    <div class="selrow"><label>${t("ac.setVehicle")}</label>
      <select id="acVSel"><option value="">—</option>
        ${DB.VEHICLES.filter(v => v.cat === "car").map(v => `<option value="${v.id}" ${State.myVehicle===v.id?"selected":""}>${v.brand} ${v.model}</option>`).join("")}</select></div>`;

  if (tab === "overview"){
    body.innerHTML = `<div class="grid" style="gap:16px">
      <div class="card card-pad">
        <div class="section-head" style="margin-bottom:12px"><h3 style="margin:0;font-size:1.05rem">${t("ac.myVehicle")}</h3></div>
        ${mine ? `<div class="myvehicle">
            <span class="ph"><img src="${mine.img?.src || ""}" alt="" onerror="this.style.display='none'"></span>
            <div><b>${vName(mine)}</b>
              <div style="font-size:.8rem;color:var(--ink-3)">${mine.connAC} / ${mine.connDC} · ${mine.batt} ${t("kwh")}</div>
              <div class="compat-tag" style="margin-top:6px">${IC.check} ${t("ac.compatNote")} ${mine.connAC}</div></div>
          </div>` : `<p style="color:var(--ink-2);font-size:.9rem">${t("ac.noVehicle")}</p>${vehiclePicker()}`}
      </div>
      <div class="duo">
        <a class="card card-pad hov" href="#/tools/range"><b>${IC.range} ${t("tl.range")}</b><br><small style="color:var(--ink-3)">${t("tl.rangeD")}</small></a>
        <a class="card card-pad hov" href="#/tools/tco"><b>${IC.chart} ${t("tl.tco")}</b><br><small style="color:var(--ink-3)">${t("tl.tcoD")}</small></a>
      </div>
      ${mine ? `<div class="card card-pad"><h3 style="font-size:1rem">${t("bt.title")}</h3><div id="acDeg"></div></div>` : ""}
    </div>`;
    if (mine){
      const m = degradationModel(mine, State.myCity);
      body.querySelector("#acDeg").innerHTML = `
        <div class="duo" style="grid-template-columns:repeat(3,1fr)">
          ${[[t("bt.now"), mine.soh],[t("bt.y3"), m.y3],[t("bt.y5"), m.y5]].map(([lb, val]) => `
          <div class="mini-stat"><small>${lb}</small><b class="num">${val}%</b>
            <div class="soh-track" style="height:6px;margin-top:8px"><div class="soh-fill ok" style="width:${val}%"></div></div></div>`).join("")}
        </div>
        <a class="btn btn-soft btn-sm" style="margin-top:14px" href="#/vehicle/${mine.id}">${t("vd.secBattery")} ${IC.arrow}</a>`;
    }
    const sel = body.querySelector("#acVSel");
    if (sel) sel.addEventListener("change", e => { State.myVehicle = e.target.value; persist(); Routes.account(app, ["overview"]); applyLang(); });
  }

  if (tab === "vehicle"){
    body.innerHTML = `<div class="card card-pad">${vehiclePicker()}
      <div class="selrow" style="margin-top:12px"><label>${t("ac.city")}</label>
        <select id="acCity">${DB.CITIES.map(c => `<option value="${c.id}" ${c.id===State.myCity?"selected":""}>${LOC(c)}</option>`).join("")}</select></div>
      <p style="font-size:.82rem;color:var(--ink-3);margin-top:14px">${t("ac.noVehicle")}</p></div>`;
    body.querySelector("#acVSel").addEventListener("change", e => { State.myVehicle = e.target.value; persist(); toast("✓"); });
    body.querySelector("#acCity").addEventListener("change", e => { State.myCity = e.target.value; persist(); toast("✓"); });
  }

  if (tab === "saved"){
    const savedV = State.saved.map(id => DB.VEHICLES.find(v => v.id === id)).filter(Boolean);
    body.innerHTML = savedV.length
      ? `<div class="grid g2">${savedV.map(vehicleCard).join("")}</div>`
      : `<div class="soon-banner">${IC.heart} <span>${t("ac.savedEmpty")}</span></div>`;
    bindCards(body);
  }

  if (tab === "alerts"){
    const alerts = [["price", t("ac.alertPrice")], ["ota", t("ac.alertOta")], ["new", t("ac.alertNew")], ["service", t("ac.alertService")]];
    body.innerHTML = `<div class="card card-pad">
      ${alerts.map(([k, lb]) => `<div class="alert-row"><div><b>${lb}</b></div>
        <label class="switch"><input type="checkbox" data-al="${k}" ${State.alerts["_" + k] !== false ? "checked" : ""}><span class="tr"></span></label></div>`).join("")}
      <p style="font-size:.78rem;color:var(--ink-3);margin-top:14px">${t("comingSoonMsg")}</p></div>`;
    body.querySelectorAll("[data-al]").forEach(sw => sw.addEventListener("change", () => {
      State.alerts["_" + sw.dataset.al] = sw.checked; persist();
    }));
  }

  if (tab === "settings"){
    body.innerHTML = `<div class="card card-pad">
      <div class="alert-row"><div><b>${t("ac.lang")}</b></div>
        <div class="seg"><button data-lg="ar" class="${State.lang==="ar"?"on":""}">العربية</button><button data-lg="en" class="${State.lang==="en"?"on":""}">English</button></div></div>
      <div class="alert-row"><div><b>${t("ac.theme")}</b></div>
        <div class="seg"><button data-th="light" class="${State.theme==="light"?"on":""}">☀ ${t("ac.themeL")}</button><button data-th="dark" class="${State.theme==="dark"?"on":""}">🌙 ${t("ac.themeD")}</button></div></div>
      <div class="alert-row"><div><b>${t("ac.phone")}</b><small>${t("ac.phoneSoon")}</small></div>
        <span class="badge badge-soon">${t("soon")}</span></div></div>`;
    body.querySelectorAll("[data-lg]").forEach(b => b.addEventListener("click", () => {
      State.lang = b.dataset.lg; localStorage.setItem("evhub.lang", State.lang); applyLang(); navigate();
    }));
    body.querySelectorAll("[data-th]").forEach(b => b.addEventListener("click", () => {
      State.theme = b.dataset.th; localStorage.setItem("evhub.theme", State.theme); applyTheme(); navigate();
    }));
  }
};

/* ── Sell wizard ── */
Routes.sell = (app) => {
  let step = 0;
  const data = {};
  app.innerHTML = `<div class="page wrap">
    <div class="crumbs"><a href="#/">${t("nav.home")}</a> ‹ <span>${t("sl.title")}</span></div>
    <div class="tool-hero"><h1>${t("sl.title")}</h1><p>${t("sl.sub")}</p></div>
    <div class="wizard card card-pad" id="sellWiz"></div>
    <div class="soon-banner" style="max-width:660px;margin:18px auto 0">${IC.spark} <span>${t("sl.tip")}</span></div>
    ${footerHTML()}
  </div>`;
  const wiz = app.querySelector("#sellWiz");
  const steps = ["s1","s2","s3","s4","s5"];
  const inputRow = (id, label, type = "text", ph = "") =>
    `<div class="selrow" style="margin-bottom:12px"><label>${label}</label><input type="${type}" id="${id}" placeholder="${ph}" value="${data[id] ?? ""}"></div>`;

  const render = () => {
    const head = `<div class="wiz-progress">${steps.map((_, i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>
      <div class="wiz-q">${t("sl." + steps[step])}</div>`;
    let inner = "";
    if (step === 0) inner = `<div class="wiz-opts">
      ${["car","truck","motorcycle","scooter","bike"].map(c => `<button class="wiz-opt ${data.cat===c?"sel":""}" data-cat="${c}"><b>${t("cat."+c)}</b></button>`).join("")}</div>`;
    if (step === 1) inner = inputRow("brand", t("sl.brand")) + inputRow("model", t("sl.model")) +
      `<div class="duo">${inputRow("year", t("sl.yearL"), "number", "2024")}${inputRow("price", t("sl.price"), "number", "120000")}</div>` +
      `<div class="duo">${inputRow("odo", t("sl.odoL"), "number", "25000")}
       <div class="selrow" style="margin-bottom:12px"><label>${t("sl.cityL")}</label>
         <select id="city">${DB.CITIES.map(c => `<option value="${c.id}">${LOC(c)}</option>`).join("")}</select></div></div>`;
    if (step === 2) inner = `<div class="duo">${inputRow("batt", t("sl.battL"), "number", "78")}${inputRow("soh", t("sl.sohL"), "number", "94")}</div>
      <div class="selrow"><label>${t("sl.connL")}</label>
        <select id="conn"><option>Type 2 / CCS2</option><option>GB/T</option><option>${State.lang==="ar"?"منفذ منزلي":"Home plug"}</option></select></div>`;
    if (step === 3) inner = `
      <div class="card" style="border-style:dashed;padding:26px;text-align:center;color:var(--ink-3);margin-bottom:14px;cursor:pointer" id="upPhotos">
        ${IC.cam}<br><b style="color:var(--ink-2)">${t("sl.photos")}</b><br><small>${t("sl.photosD")}</small></div>
      <div class="card" style="border-style:dashed;padding:22px;text-align:center;color:var(--ink-3);cursor:pointer" id="upReport">
        ${IC.shield}<br><b style="color:var(--ink-2)">${t("sl.upload")}</b><br><small>${t("sl.uploadD")}</small></div>`;
    if (step === 4){
      inner = `<div class="spec-grid">
        <div class="spec-cell"><small>${t("mk.fCat")}</small><b>${data.cat ? t("cat."+data.cat) : "—"}</b></div>
        <div class="spec-cell"><small>${t("sl.brand")}</small><b>${data.brand || "—"} ${data.model || ""}</b></div>
        <div class="spec-cell"><small>${t("sl.price")}</small><b class="num">${data.price ? SAR(+data.price) : "—"}</b></div>
        <div class="spec-cell"><small>${t("sl.sohL")}</small><b class="num">${data.soh || "—"}%</b></div></div>
      <div class="soon-banner" style="margin-top:14px;font-size:.82rem">${IC.shield} ${State.lang==="ar"?"سيُراجع الإعلان يدويًا قبل النشر — هذه سياسة الثقة في EVHub":"Listings are manually reviewed before publishing — EVHub's trust policy"}</div>`;
    }
    wiz.innerHTML = head + inner + `<div class="wiz-nav">
      <button class="btn btn-ghost" id="slBack" ${step===0?"disabled":""}>${t("fz.back")}</button>
      <button class="btn btn-primary" id="slNext">${step===4?t("sl.submit"):t("fz.next")}</button></div>`;

    wiz.querySelectorAll("[data-cat]").forEach(b => b.addEventListener("click", () => {
      data.cat = b.dataset.cat;
      wiz.querySelectorAll("[data-cat]").forEach(x => x.classList.toggle("sel", x === b));
    }));
    ["upPhotos","upReport"].forEach(id => wiz.querySelector("#"+id)?.addEventListener("click", () =>
      toast(State.lang==="ar"?"رفع الملفات يتفعّل مع إطلاق الحسابات":"File upload activates with account launch")));
    wiz.querySelector("#slBack").addEventListener("click", () => { saveInputs(); step--; render(); });
    wiz.querySelector("#slNext").addEventListener("click", () => {
      saveInputs();
      if (step === 4){ toast(t("sl.submitted"), 4500); step = 0; Object.keys(data).forEach(k => delete data[k]); render(); return; }
      step++; render();
    });
  };
  const saveInputs = () => wiz.querySelectorAll("input,select").forEach(i => { if (i.id) data[i.id] = i.value; });
  render();
};
