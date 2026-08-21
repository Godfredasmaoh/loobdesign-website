(function () {
  var video = document.querySelector(".hero-nexum__video");
  if (!video) return;

  video.muted = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  var play = function () {
    var p = video.play();
    if (p && typeof p.catch === "function") {
      p.catch(function () {});
    }
  };

  if (video.readyState >= 2) {
    play();
  } else {
    video.addEventListener("canplay", play, { once: true });
  }
})();
