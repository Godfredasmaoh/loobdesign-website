/**
 * Loob Design — Formspree AJAX helper
 * Endpoint: https://formspree.io/f/mljrvgyl
 * Keeps users on-page (no Formspree/FormSubmit redirect).
 */
(function () {
  "use strict";

  var ENDPOINT = "https://formspree.io/f/mljrvgyl";

  function ensureStatus(form) {
    var el = form.querySelector("[data-formspree-status]");
    if (el) return el;
    el = document.createElement("p");
    el.setAttribute("data-formspree-status", "");
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.className = "loob-formspree-status";
    el.hidden = true;
    var actions = form.querySelector(".sec-4-about-form__actions");
    if (actions && actions.parentNode === form) {
      actions.insertAdjacentElement("afterend", el);
    } else {
      form.appendChild(el);
    }
    return el;
  }

  function setStatus(form, type, message) {
    var el = ensureStatus(form);
    el.hidden = !message;
    el.textContent = message || "";
    el.classList.remove("is-success", "is-error");
    if (type) el.classList.add("is-" + type);
    if (message) {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch (e) {}
    }
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

  function postForm(form) {
    if (form.classList.contains("is-submitting")) return;

    if (typeof form.reportValidity === "function" && !form.reportValidity()) {
      return;
    }

    setStatus(form, null, "");
    setSubmitting(form, true);

    var data = new FormData(form);

    fetch(ENDPOINT, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" }
    })
      .then(function (res) {
        return res
          .json()
          .then(function (json) {
            return { ok: res.ok, status: res.status, json: json };
          })
          .catch(function () {
            return { ok: res.ok, status: res.status, json: null };
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
          msg = result.json.errors
            .map(function (e) {
              return e.message;
            })
            .join(" ");
        } else if (result.json && result.json.error) {
          msg = String(result.json.error);
        } else if (result.status === 422) {
          msg = "Please check the form fields and try again.";
        }
        setStatus(form, "error", msg);
      })
      .catch(function () {
        setSubmitting(form, false);
        setStatus(
          form,
          "error",
          "Network error. Please try again or email hello@loobdesign.com."
        );
      });
  }

  function bindForm(form) {
    if (form.getAttribute("data-formspree-bound") === "1") return;
    if (form.hasAttribute("data-hero-contact")) return;
    if (form.classList.contains("hero-nexum__cta")) return;

    form.setAttribute("data-formspree-bound", "1");
    form.setAttribute("action", ENDPOINT);
    form.setAttribute("method", "POST");
    form.setAttribute("novalidate", "novalidate");

    if (!form.querySelector('input[name="_gotcha"]')) {
      var gotcha = document.createElement("input");
      gotcha.type = "text";
      gotcha.name = "_gotcha";
      gotcha.value = "";
      gotcha.tabIndex = -1;
      gotcha.autocomplete = "off";
      gotcha.setAttribute("aria-hidden", "true");
      gotcha.className = "loob-formspree-gotcha";
      form.appendChild(gotcha);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      postForm(form);
    });

    submitButtons(form).forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        // Ensure nested spans/icons still submit via our handler
        if (btn.disabled) {
          event.preventDefault();
          return;
        }
        if (event.target !== btn && event.currentTarget === btn) {
          // allow native submit to bubble as form submit; also call explicitly
        }
        event.preventDefault();
        postForm(form);
      });
    });
  }

  function prefillEmailFromQuery() {
    var params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (err) {
      return;
    }
    var email = params.get("email");
    if (!email) return;
    email = String(email).trim();
    if (!email) return;

    var inputs = document.querySelectorAll(
      'form.sec-4-about-form input[type="email"][name="email"], form.sec-4-about-form input[name="email"]'
    );
    inputs.forEach(function (input) {
      input.value = email;
      try {
        input.dispatchEvent(new Event("input", { bubbles: true }));
      } catch (e) {}
    });

    var first = inputs[0];
    if (first && typeof first.focus === "function") {
      window.setTimeout(function () {
        first.focus({ preventScroll: true });
        first.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 250);
    }
  }

  function init() {
    var forms = document.querySelectorAll(
      'form[action*="formspree.io"], form[data-formspree], form.sec-4-about-form, form.footer-7__form, form.checkout-billing__form, form.checkout-payment__form'
    );
    forms.forEach(bindForm);
    prefillEmailFromQuery();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
