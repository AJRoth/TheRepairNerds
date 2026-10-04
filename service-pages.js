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

  var siteMenus = Array.prototype.slice.call(document.querySelectorAll(".nav-dropdown, .mobile-menu"));

  siteMenus.forEach(function (menu) {
    menu.addEventListener("toggle", function () {
      if (!menu.open) {
        return;
      }

      siteMenus.forEach(function (otherMenu) {
        if (otherMenu !== menu) {
          otherMenu.open = false;
        }
      });

      if (menu.classList.contains("mobile-menu")) {
        menu.firstElementChild.setAttribute("aria-label", "Close navigation menu");
      }
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.open = false;
      });
    });
  });

  document.addEventListener("click", function (event) {
    siteMenus.forEach(function (menu) {
      if (menu.open && !menu.contains(event.target)) {
        menu.open = false;
      }
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") {
      return;
    }

    siteMenus.forEach(function (menu) {
      if (menu.open) {
        menu.open = false;
        menu.firstElementChild.focus();
      }
    });
  });

  document.querySelectorAll(".mobile-menu").forEach(function (menu) {
    menu.addEventListener("toggle", function () {
      if (!menu.open) {
        menu.firstElementChild.setAttribute("aria-label", "Open navigation menu");
      }
    });
  });

  document.querySelectorAll("[data-current-year]").forEach(function (element) {
    element.textContent = String(new Date().getFullYear());
  });

  var form = document.getElementById("support-form");
  if (!form) {
    return;
  }

  var status = document.getElementById("form-status");
  var submitButton = document.getElementById("form-submit");
  var contactMethod = document.getElementById("contact-method");
  var email = document.getElementById("email");
  var emailRequirement = document.getElementById("email-requirement");
  var phone = document.getElementById("phone");
  var phoneRequirement = document.getElementById("phone-requirement");
  var idleSubmitLabel = submitButton.textContent;
  var successStatus =
    "Thanks for reaching out. We got your request, and someone from The Repair Nerds will contact you shortly.";
  var errorStatus =
    "We couldn’t send that just now. Please try again, or call or text 717-535-6525.";

  function syncContactRequirements() {
    var wantsCallOrText = contactMethod.value === "Call" || contactMethod.value === "Text";
    var wantsEmail = contactMethod.value === "Email";

    email.required = wantsEmail;
    email.setAttribute("aria-required", String(wantsEmail));
    emailRequirement.textContent = wantsEmail ? "(required)" : "(optional)";

    phone.required = wantsCallOrText;
    phone.setAttribute("aria-required", String(wantsCallOrText));
    phoneRequirement.textContent = wantsCallOrText ? "(required)" : "(optional)";
  }

  function setStatus(message, state) {
    status.textContent = message;
    status.classList.toggle("visible", Boolean(message));
    status.classList.toggle("is-pending", state === "pending");
    status.classList.toggle("is-success", state === "success");
    status.classList.toggle("is-error", state === "error");
  }

  function setSubmitting(isSubmitting) {
    submitButton.disabled = isSubmitting;
    submitButton.textContent = isSubmitting ? "Sending…" : idleSubmitLabel;
    Array.prototype.forEach.call(form.elements, function (element) {
      if (element === submitButton || element.name === "botcheck") {
        return;
      }
      if (element.type === "hidden") {
        return;
      }
      element.disabled = isSubmitting || form.classList.contains("is-sent");
    });
  }

  function markSent() {
    form.classList.add("is-sent");
    setSubmitting(false);
    Array.prototype.forEach.call(form.elements, function (element) {
      if (element.type !== "hidden" && element.name !== "botcheck") {
        element.disabled = true;
      }
    });
    submitButton.disabled = true;
  }

  contactMethod.addEventListener("change", syncContactRequirements);
  syncContactRequirements();

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    var data = new FormData(form);
    var payload = JSON.stringify(Object.fromEntries(data.entries()));

    setSubmitting(true);
    setStatus("Sending your request…", "pending");

    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: payload
    })
      .then(function (response) {
        return response.json().then(function (result) {
          return { ok: response.ok, result: result };
        });
      })
      .then(function (outcome) {
        if (!outcome.ok || !outcome.result || outcome.result.success === false) {
          throw new Error((outcome.result && outcome.result.message) || "Submit failed");
        }

        if (typeof gtag === "function") {
          gtag("event", "generate_lead", {
            contact_method: "support_request_form",
            requested_service: String(data.get("Requested service") || "")
          });
        }

        markSent();
        setStatus(successStatus, "success");
      })
      .catch(function () {
        form.classList.remove("is-sent");
        setSubmitting(false);
        setStatus(errorStatus, "error");
      });
  });
}());
