(function () {
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  try {
    var savedTheme = localStorage.getItem("repair-nerds-theme");
    root.setAttribute("data-theme", savedTheme === "light" ? "light" : "dark");
  } catch (error) {
    root.setAttribute("data-theme", "dark");
  }

  function syncTheme() {
    var isLight = root.getAttribute("data-theme") === "light";
    if (toggle) {
      toggle.textContent = isLight ? "☾" : "☀";
      toggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
      toggle.setAttribute("aria-pressed", String(isLight));
    }
    if (themeMeta) {
      themeMeta.setAttribute("content", isLight ? "#f8f0e6" : "#000000");
    }
  }

  syncTheme();

  if (toggle) {
    toggle.addEventListener("click", function () {
      var nextTheme = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", nextTheme);
      try {
        localStorage.setItem("repair-nerds-theme", nextTheme);
      } catch (error) {
        /* The selected theme still works for the current visit. */
      }
      syncTheme();
    });
  }

  document.querySelectorAll("[data-current-year]").forEach(function (element) {
    element.textContent = String(new Date().getFullYear());
  });
}());
