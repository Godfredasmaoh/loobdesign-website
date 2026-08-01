/**
 * Loob Design site search — live overlay results + search.html?q=
 */
(function () {
  "use strict";

  var INDEX_URL = "assets/data/search-index.json";
  var POPULAR = [
    { label: "Software Development", q: "software development" },
    { label: "Web Development", q: "web development" },
    { label: "Products", q: "products erp" },
    { label: "Services", q: "services" },
    { label: "Contact", q: "contact" },
    { label: "Accra", q: "accra ghana" },
    { label: "Sunderland", q: "sunderland" },
    { label: "Startup MVP", q: "mvp startup" },
    { label: "Pricing", q: "pricing" },
    { label: "Team", q: "team" },
    { label: "Portfolio", q: "portfolio" },
    { label: "Merch", q: "merch" }
  ];

  var index = null;
  var indexPromise = null;

  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (indexPromise) return indexPromise;
    indexPromise = fetch(INDEX_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("Search index missing");
        return res.json();
      })
      .then(function (data) {
        index = Array.isArray(data) ? data : [];
        return index;
      })
      .catch(function () {
        index = [];
        return index;
      });
    return indexPromise;
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s+/.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function scoreItem(item, terms) {
    var hay =
      normalize(item.title) +
      " " +
      normalize(item.description) +
      " " +
      normalize(item.keywords);
    var score = 0;
    for (var i = 0; i < terms.length; i++) {
      var term = terms[i];
      if (!term) continue;
      if (normalize(item.title).indexOf(term) !== -1) score += 8;
      if (normalize(item.keywords).indexOf(term) !== -1) score += 5;
      if (hay.indexOf(term) !== -1) score += 2;
      else return 0;
    }
    return score;
  }

  function search(query) {
    var q = normalize(query);
    if (!q || !index || !index.length) return [];
    var terms = q.split(" ").filter(Boolean);
    return index
      .map(function (item) {
        return { item: item, score: scoreItem(item, terms) };
      })
      .filter(function (row) {
        return row.score > 0;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .map(function (row) {
        return row.item;
      });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderResults(container, results, query) {
    if (!container) return;
    if (!query) {
      container.innerHTML = "";
      container.hidden = true;
      return;
    }
    container.hidden = false;
    if (!results.length) {
      container.innerHTML =
        '<p class="loob-search-empty">No results for “' +
        escapeHtml(query) +
        '”. Try software, products, contact, Accra, or Sunderland.</p>';
      return;
    }
    var html =
      '<p class="loob-search-count">' +
      results.length +
      " result" +
      (results.length === 1 ? "" : "s") +
      " for “" +
      escapeHtml(query) +
      "”</p><ul class=\"loob-search-list\">";
    results.forEach(function (item) {
      html +=
        '<li><a class="loob-search-item" href="' +
        escapeHtml(item.url) +
        '"><span class="loob-search-item__title">' +
        escapeHtml(item.title) +
        '</span><span class="loob-search-item__desc">' +
        escapeHtml(item.description) +
        "</span></a></li>";
    });
    html += "</ul>";
    container.innerHTML = html;
  }

  function getQueryParam() {
    try {
      return new URLSearchParams(window.location.search).get("q") || "";
    } catch (e) {
      return "";
    }
  }

  function enhanceOverlay() {
    var forms = document.querySelectorAll(".at-search-form form");
    forms.forEach(function (form) {
      if (form.dataset.loobSearch === "1") return;
      form.dataset.loobSearch = "1";
      form.setAttribute("action", "search.html");
      form.setAttribute("method", "get");
      form.setAttribute("role", "search");

      var input = form.querySelector("input[type='text'], input:not([type])");
      if (!input) return;
      input.setAttribute("name", "q");
      input.setAttribute("autocomplete", "off");
      input.setAttribute("aria-label", "Search Loob Design");

      var wrap = form.closest(".at-search-form") || form.parentElement;
      var results = document.createElement("div");
      results.className = "loob-search-results";
      results.id = "loob-overlay-search-results";
      results.setAttribute("aria-live", "polite");
      results.hidden = true;
      wrap.appendChild(results);

      var run = function () {
        var q = input.value.trim();
        loadIndex().then(function () {
          renderResults(results, search(q), q);
        });
      };

      input.addEventListener("input", run);
      input.addEventListener("focus", run);

      form.addEventListener("submit", function (e) {
        var q = input.value.trim();
        if (!q) {
          e.preventDefault();
          return;
        }
        // Allow navigation to search.html for full results
      });
    });

    // Popular searches → real queries / pages
    document.querySelectorAll(".at-categories").forEach(function (box) {
      if (box.dataset.loobPopular === "1") return;
      box.dataset.loobPopular = "1";
      var list = box.querySelector(".at-categories-list");
      if (!list) return;
      list.innerHTML = POPULAR.map(function (item) {
        return (
          '<li><a href="search.html?q=' +
          encodeURIComponent(item.q) +
          '" class="at-categories-item">' +
          item.label +
          "</a></li>"
        );
      }).join("");
    });
  }

  function enhanceSearchPage() {
    var pageRoot = document.getElementById("loob-search-page");
    if (!pageRoot) return;

    var input = document.getElementById("loob-search-page-input");
    var results = document.getElementById("loob-search-page-results");
    var form = document.getElementById("loob-search-page-form");
    var initial = getQueryParam();

    if (input && initial) input.value = initial;

    function runPageSearch() {
      var q = (input && input.value.trim()) || initial || "";
      loadIndex().then(function () {
        renderResults(results, search(q), q);
        if (q) {
          document.title = "Search: " + q + " | Loob Design";
        }
      });
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var q = input ? input.value.trim() : "";
        if (!q) return;
        var url = "search.html?q=" + encodeURIComponent(q);
        window.history.replaceState({}, "", url);
        runPageSearch();
      });
    }
    if (input) input.addEventListener("input", runPageSearch);
    runPageSearch();
  }

  function boot() {
    enhanceOverlay();
    enhanceSearchPage();
    loadIndex();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
