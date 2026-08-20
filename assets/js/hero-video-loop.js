(function () {
  var hero = document.querySelector(".hero-mainframe");
  var video = document.getElementById("hero-mainframe-video");
  var typeEl = document.getElementById("hero-mainframe-type");
  var cursorEl = document.getElementById("hero-mainframe-cursor");
  var pills = document.getElementById("hero-mainframe-pills");
  var copyBtn = document.getElementById("hero-mainframe-copy");

  if (!hero) return;

  window.setTimeout(function () {
    if (pills) pills.classList.add("is-visible");
  }, 400);

  function typewriter(text, speed, startDelay) {
    speed = speed || 38;
    startDelay = startDelay === undefined ? 600 : startDelay;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      if (typeEl) typeEl.textContent = text;
      if (cursorEl) cursorEl.hidden = true;
      return;
    }
    window.setTimeout(function () {
      var i = 0;
      var timer = window.setInterval(function () {
        i += 1;
        if (typeEl) typeEl.textContent = text.slice(0, i);
        if (i >= text.length) {
          window.clearInterval(timer);
          if (cursorEl) cursorEl.hidden = true;
        }
      }, speed);
    }, startDelay);
  }

  typewriter("Glad you stopped in. Good taste tends to find us. Now, what are we building?", 38, 600);

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var email = "hello@loobdesign.com";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).catch(function () {});
      }
    });
  }

  if (!video) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  video.pause();
  video.loop = false;
  video.playbackRate = 1;

  if (window.matchMedia("(pointer: coarse)").matches) {
    video.loop = true;
    video.play().catch(function () {});
    return;
  }

  var SENSITIVITY = 0.8;
  var prevX = null;
  var targetTime = 0;
  var seeking = false;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function seekIfNeeded() {
    if (!video.duration) return;
    if (Math.abs(video.currentTime - targetTime) < 0.01) {
      seeking = false;
      return;
    }
    seeking = true;
    try {
      video.currentTime = targetTime;
    } catch (err) {
      seeking = false;
    }
  }

  video.addEventListener("seeked", function () {
    if (Math.abs(video.currentTime - targetTime) > 0.01) {
      video.currentTime = targetTime;
    } else {
      seeking = false;
    }
  });

  video.addEventListener("loadedmetadata", function () {
    targetTime = 0;
    video.currentTime = 0;
  });

  window.addEventListener("mousemove", function (event) {
    if (!video.duration) return;
    if (prevX === null) {
      prevX = event.clientX;
      return;
    }
    var delta = event.clientX - prevX;
    prevX = event.clientX;
    targetTime = clamp(
      targetTime + (delta / window.innerWidth) * SENSITIVITY * video.duration,
      0,
      video.duration
    );
    if (!seeking) seekIfNeeded();
  });
})();
