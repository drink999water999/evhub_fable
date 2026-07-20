/* EVHub — Home v3 */
"use strict";

Routes.home = (app) => {
  const featured = DB.VEHICLES.filter(v => v.featured).slice(0, 4);
  const heroCar = DB.VEHICLES.find(v => v.id === "lucid-air");
  const catThumb = (cat, img, icon) => {
    const count = cat === "charger" || cat === "parts"
      ? DB.PRODUCTS.filter(p => p.cat === cat).length
      : DB.VEHICLES.filter(v => v.cat === cat).length;
    return `<a class="cat-thumb" href="#/market?cat=${cat}">
      ${img ? `<img src="${img}" alt="" loading="lazy" onerror="this.remove()">` : `<span class="ph">${icon}</span>`}
      ${img ? "" : ""}
      <span class="lb"><b>${t("cat." + cat)}</b><small class="num">${count} ${t("mk.results")}</small></span>
    </a>`;
  };

  app.innerHTML = `<div class="page">

  <!-- ═══ HERO ═══ -->
  <section class="hero"><div class="wrap hero-inner">
    <div>
      <span class="pill-lime" style="margin-bottom:18px">${IC.bolt} ${t("hero.kicker")}</span>
      <h1>${t("hero.title")}</h1>
      <p class="lead">${t("hero.lead")}</p>
      <form class="searchpanel" id="heroSearch" role="search">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#93a39b" stroke-width="2.1" stroke-linecap="round" style="margin-inline-start:12px;flex-shrink:0"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>
        <input type="search" placeholder="${t("hero.searchPh")}" id="heroQ" aria-label="search">
        <button class="btn btn-primary" type="submit">${t("hero.searchBtn")}</button>
      </form>
      <div class="quick-links">
        <a class="quick-link" href="#/market?cat=car">${IC.shield} ${t("hero.q1")}</a>
        <a class="quick-link" href="#/tools/range">${IC.range} ${t("hero.q2")}</a>
        <a class="quick-link" href="#/compare">${IC.scale} ${t("hero.q3")}</a>
        <a class="quick-link" href="#/charging?tab=p2p">${IC.plug} ${t("hero.q4")}</a>
      </div>
      <div class="hero-stats">
        <div class="hstat"><b class="num">450+</b><span>${t("hero.stat1")}</span></div>
        <div class="hstat"><b class="num">120+</b><span>${t("hero.stat2")}</span></div>
        <div class="hstat"><b class="num">18K+</b><span>${t("hero.stat3")}</span></div>
      </div>
    </div>
    <div class="hero-visual">
      <div class="hero-photo">
        <img src="${heroCar.img.src}" alt="${vName(heroCar)}" onerror="this.src='../Media/ev-showroom-hero.webp'">
      </div>
      <div class="hero-float hf-1"><span class="big num">94%</span>
        <span>${t("hero.float1")}<br><small style="color:#8fb3a0;font-weight:500">${t("hero.float1b")}</small></span></div>
      <div class="hero-float hf-2"><span class="dot"></span>${t("hero.float2")}</div>
    </div>
  </div></section>

  <!-- ═══ BRANDS ═══ -->
  <section class="section"><div class="wrap">
    <div class="section-head reveal"><div>
      <span class="kicker">${State.lang==="ar"?"علامات عالمية":"Global marques"}</span>
      <h2>${t("brands.title")}</h2><div class="sub">${t("brands.sub")}</div></div></div>
    <div class="brand-row reveal">
      ${DB.BRANDS.map(b => `<a class="brand-tile" href="#/market?brand=${encodeURIComponent(b.id)}">
        <img src="${b.logo}" alt="${b.id}" loading="lazy" onerror="this.style.display='none'">
        <span>${b.id}</span></a>`).join("")}
    </div>
  </div></section>

  <!-- ═══ CATEGORY THUMBNAILS ═══ -->
  <section class="section" style="padding-top:10px"><div class="wrap">
    <div class="section-head reveal"><div>
      <span class="kicker">${State.lang==="ar"?"الفئات":"Categories"}</span>
      <h2>${t("cats.title")}</h2><div class="sub">${t("cats.sub")}</div></div></div>
    <div class="cat-strip reveal">
      ${catThumb("car", DB.IMG.zeekr.src)}
      ${catThumb("truck", DB.IMG.eactros.src, IC.truck)}
      ${catThumb("motorcycle", DB.IMG.moto.src)}
      ${catThumb("scooter", DB.IMG.scooter.src, IC.scooter)}
      ${catThumb("bike", DB.IMG.bike.src, IC.bike)}
      ${catThumb("charger", DB.IMG.wallbox.src, IC.plug)}
      ${catThumb("parts", "../Media/ev-battery-pack.webp", IC.batt)}
    </div>
  </div></section>

  <!-- ═══ FEATURED ═══ -->
  <section class="section" style="background:var(--bg-2);border-block:1px solid var(--line)"><div class="wrap">
    <div class="section-head reveal">
      <div><span class="kicker">EVHub Verified</span>
      <h2>${t("featured.title")}</h2><div class="sub">${t("featured.sub")}</div></div>
      <a class="btn btn-dark btn-sm" href="#/market">${t("featured.all")} ${IC.arrow}</a>
    </div>
    <div class="grid g4 reveal" id="featGrid">${featured.map(vehicleCard).join("")}</div>
  </div></section>

  <!-- ═══ DARK BAND: journey ═══ -->
  <section class="section"><div class="wrap">
    <div class="panel-dark reveal" style="padding:44px 40px">
      <div style="text-align:center;max-width:52em;margin:0 auto 34px">
        <h2 style="color:#fff;font-size:clamp(1.5rem,2.8vw,2.1rem)">${t("band.t")}</h2>
        <p class="muted" style="margin:0">${t("band.d")}</p>
      </div>
      <div class="grid g4">
        ${[["shield","1"],["users","2"],["chart","3"],["tg","4"]].map(([ic, n]) => `
        <div style="text-align:center;padding:10px">
          <div style="width:56px;height:56px;border-radius:17px;background:rgba(201,241,88,.13);color:var(--lime);display:grid;place-items:center;margin:0 auto 14px">${IC[ic]}</div>
          <b style="color:#fff;display:block;margin-bottom:6px">${t(`trust.${n}t`)}</b>
          <span class="muted" style="font-size:.84rem;line-height:1.65;display:block">${t(`trust.${n}d`)}</span>
        </div>`).join("")}
      </div>
    </div>
  </div></section>

  <!-- ═══ TOOLS ═══ -->
  <section class="section" style="padding-top:0"><div class="wrap">
    <div class="section-head reveal"><div>
      <span class="kicker">${State.lang==="ar"?"مصممة للمملكة":"Built for KSA"}</span>
      <h2>${t("feat.title")}</h2><div class="sub">${t("feat.sub")}</div></div></div>
    <div class="grid g3 reveal">
      ${[["range","#/tools/range","range",1],["aiT","#/market","batt",0,"ai"],["cmpT","#/compare","scale",0,"cmp"],
         ["tcoT","#/tools/tco","chart",0,"tco"],["finderT","#/tools/finder","spark",0,"finder"],["bundleT","#/tools/bundle","plug",0,"bundle"]]
        .map(([k, href, ic, dark, short]) => {
          const key = short || k.replace("T","");
          return `<a class="feat-tile ${dark ? "dark" : ""}" href="${href}">
          <span class="arrow">${IC.arrow}</span><div class="fico">${IC[ic]}</div>
          <b>${t("feat." + key + "T")}</b><span>${t("feat." + key + "D")}</span></a>`;}).join("")}
    </div>
  </div></section>

  <!-- ═══ P2P ═══ -->
  <section class="section" style="padding-top:0"><div class="wrap">
    <div class="panel-dark reveal">
      <div style="display:grid;grid-template-columns:1.15fr .85fr;gap:26px;align-items:center" class="p2p-grid">
        <div style="padding:40px 40px">
          <span class="pill-lime" style="margin-bottom:14px">${IC.bolt} P2P</span>
          <h2 style="color:#fff;font-size:clamp(1.4rem,2.6vw,1.9rem)">${t("p2p.title")}</h2>
          <p class="muted" style="max-width:36em">${t("p2p.sub")}</p>
          <div style="display:flex;gap:11px;flex-wrap:wrap;margin-top:20px">
            <a class="btn btn-primary" href="#/charging?tab=p2p">${t("p2p.cta")}</a>
            <a class="btn" style="border:1.5px solid rgba(255,255,255,.28);color:#eafce9" href="#/charging?tab=p2p&host=1">${t("p2p.host")}</a>
          </div>
        </div>
        <img src="../Media/home-charger.webp" alt="" class="p2p-img" style="height:100%;min-height:250px;object-fit:cover">
      </div>
    </div>
  </div></section>

  <!-- ═══ COMMUNITY ═══ -->
  <section class="section" style="padding-top:0"><div class="wrap">
    <div class="section-head reveal"><div>
      <span class="kicker">${State.lang==="ar"?"المجتمع":"Community"}</span>
      <h2>${t("commHome.title")}</h2><div class="sub">${t("commHome.sub")}</div></div>
      <a class="btn btn-soft btn-sm" href="#/community">${IC.tg} ${t("commHome.cta")}</a></div>
    <div class="grid g3 reveal">
      ${DB.STORIES.map(s => `<div class="card card-pad">
        <span class="chip on" style="margin-bottom:12px">${LOC(s.who)}</span>
        <p style="margin:0;font-size:.94rem;color:var(--ink-2);line-height:1.8">${LOC(s.text)}</p></div>`).join("")}
    </div>
  </div></section>
  ${footerHTML()}
  </div>
  <style>@media(max-width:800px){.p2p-grid{grid-template-columns:1fr!important}.p2p-img{display:none}}</style>`;

  bindCards(app);
  app.querySelector("#heroSearch").addEventListener("submit", e => {
    e.preventDefault();
    const q = app.querySelector("#heroQ").value.trim();
    location.hash = "#/market" + (q ? `?q=${encodeURIComponent(q)}` : "");
  });
};
