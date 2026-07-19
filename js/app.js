/* EVHub — bootstrap */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  applyLang();

  document.getElementById("themeToggle").addEventListener("click", () => {
    State.theme = State.theme === "light" ? "dark" : "light";
    localStorage.setItem("evhub.theme", State.theme);
    applyTheme();
  });
  document.getElementById("langToggle").addEventListener("click", () => {
    State.lang = State.lang === "ar" ? "en" : "ar";
    localStorage.setItem("evhub.lang", State.lang);
    applyLang();
    navigate(); // re-render current page in new language
  });

  window.addEventListener("hashchange", navigate);
  navigate();
});
