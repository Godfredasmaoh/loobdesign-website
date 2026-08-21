/**
 * Loob Design — Formspree AJAX helper
 * Endpoint: https://formspree.io/f/mljrvgyl
 * Auto-binds any form whose action points at Formspree.
 */
(function () {
  "use strict";

  var ENDPOINT = "https://formspree.io/f/mljrvgyl";

  function ensureStatus(form) {
    var el = form.querySelector("[data-formspree-status]");
    if (el) return el;
    el = document.createElement("p");
    el.setAttribute("data-formspree-status");
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.className = "loob-formspree-status";
    el.hidden = true;
    form.appendChild(el);
    return el;
  }

  function setStatus(form, type, message) {
    var el = ensureStatus(form);
    el.hidden = !message;
    el.textContent = message || "";
    el.classList.remove("is-success", "is-error");
    if (type) el.classList.add("is-" + type);
  }

  function submitButtons(form) {
    return form.querySelectorAll('button[type="submit"], input[type="submit"]');
  }

  function setSubmitting(form, on) {
    form.classList.toggle("is-submitting", on);
    submitButtons(form).forEach(function (btn) {
      btn.disabled = !!on;
      if (on) btn.setAttribute("aria-busy", "true");
      else btn.removeAttribute("aria-busy");
    });
  }

  function bindForm(form) {
    if (form.getAttribute("data-formspree-bound") === "1") return;
    form.setAttribute("data-formspree-bound", "1");
    form.setAttribute("action", ENDPOINT);
    form.setAttribute("method", "POST");

    if (!form.querySelector('input[name="_gotcha"]')) {
      var gotcha = document.createElement("input");
      gotcha.type = "text";
      gotcha.name = "_gotcha";
      gotcha.tabIndex = -1;
      gotcha.autocomplete = "off";
      gotcha.setAttribute("aria-hidden", "true");
      gotcha.className = "loob-formspree-gotcha";
      form.appendChild(gotcha);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      setStatus(form, null, "");
      setSubmitting(form, true);

      var data = new FormData(form);

      fetch(ENDPOINT, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
        mode: "cors"
      })
        .then(function (res) {
          return res.json().then(function (json) {
            return { ok: res.ok, json: json };
          }).catch(function () {
            return { ok: res.ok, json: null };
          });
        })
        .then(function (result) {
          setSubmitting(form, false);
          if (result.ok) {
            form.reset();
            setStatus(form, "success", "Thanks — we got your message and will reply soon.");
            return;
          }
          var msg = "Something went wrong. Please try again or email hello@loobdesign.com.";
          if (result.json && result.json.errors && result.json.errors.length) {
            msg = result.json.errors.map(function (e) { return e.message; }).join(" ");
          } else if (result.json && result.json.error) {
            msg = result.json.error;
          }
          setStatus(form, "error", msg);
        })
        .catch(function () {
          setSubmitting(form, false);
          setStatus(form, "error", "Network error. Please try again or email hello@loobdesign.com.");
        });

      return false;
    }, true);
  }

  function init() {
    var forms = document.querySelectorAll(
      'form[action*="formspree.io"], form[data-formspree], form.hero-nexum__cta, form.sec-4-about-form, form.footer-7__form'
    );
    forms.forEach(bindForm);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
