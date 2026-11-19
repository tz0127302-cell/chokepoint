(function () {
  try {
    var t = localStorage.getItem("chokepoint-theme");
    if (t !== "light" && t !== "dark") {
      t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.dataset.theme = t;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#121614" : "#f3efe4");
  } catch (e) {
    /* localStorage can be blocked; the light theme remains. */
  }
})();
