/**
 * Minimal Video Player — Vanilla JS
 * Features:
 * - data-video-url="..." (required)
 * - data-autoplay (optional; will be muted)
 * - centered play button
 * - only one non-autoplay video plays at a time
 */


/**
 * Thumbnail helper for Universal Video Player
 *
 * Rules:
 * - If `.vp-thumbnail` already has a usable `src`, do nothing.
 * - Otherwise:
 *   - YouTube: fetch best available thumbnail URL
 *   - Vimeo: fetch thumbnail via oEmbed
 *   - Native video: generate thumbnail from a non-black frame
 * - Thumbnail visibility:
 *   - Visible on page load
 *   - Hidden while playing
 *   - Shown again ONLY when playback ends
 *   - If user pauses before the end, do NOT show thumbnail
 */
(function (window) {
  "use strict";

  if (!window || !window.document) return;

  function isUsableUrl(url) {
    if (!url) return false;
    var s = String(url).trim();
    if (!s) return false;
    if (s === "#" || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") return false;
    return true;
  }

  function extractYouTubeId(url) {
    if (!url) return null;
    var m =
      url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/) ||
      url.match(/youtube\.com\/.*[?&]v=([^&\n?#]+)/);
    return m ? m[1] : null;
  }

  function extractVimeoId(url) {
    if (!url) return null;
    var m = url.match(/vimeo\.com\/(\d+)/) || url.match(/vimeo\.com\/.*\/(\d+)/);
    return m ? m[1] : null;
  }

  function detectSource(url) {
    var yt = extractYouTubeId(url);
    if (yt) return { type: "youtube", id: yt };
    var vm = extractVimeoId(url);
    if (vm) return { type: "vimeo", id: vm };
    return { type: "native", id: url || "" };
  }

  function ensureThumbnailEls(wrapper) {
    if (!wrapper) return null;
    var container = wrapper.querySelector(".vp-container");
    if (!container) return null;

    var holder = container.querySelector(".vp-thumbnail-holder");
    if (!holder) {
      holder = document.createElement("div");
      holder.className = "vp-thumbnail-holder";
      container.appendChild(holder);
    }

    var img = holder.querySelector("img.vp-thumbnail");
    if (!img) {
      img = document.createElement("img");
      img.className = "vp-thumbnail";
      img.alt = "";
      holder.appendChild(img);
    }

    return { container: container, holder: holder, img: img };
  }

  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error("Image failed to load")); };
      img.src = url;
    });
  }

  async function getYouTubeThumbnailUrl(videoId) {
    // Prefer maxres, but if unavailable YouTube returns a tiny placeholder (often 120x90).
    var candidates = [
      "https://i.ytimg.com/vi/" + videoId + "/maxresdefault.jpg",
      "https://i.ytimg.com/vi/" + videoId + "/sddefault.jpg",
      "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg",
      "https://i.ytimg.com/vi/" + videoId + "/mqdefault.jpg",
    ];

    for (var i = 0; i < candidates.length; i++) {
      try {
        var img = await loadImage(candidates[i]);
        if (img && img.naturalWidth && img.naturalHeight) {
          if (img.naturalWidth > 200) return candidates[i];
        }
      } catch (e) {}
    }
    // Fallback anyway
    return candidates[candidates.length - 1];
  }

  async function getVimeoThumbnailUrl(originalUrl) {
    // oEmbed gives a ready-to-use thumbnail URL
    var endpoint = "https://vimeo.com/api/oembed.json?url=" + encodeURIComponent(originalUrl);
    var res = await fetch(endpoint, { method: "GET" });
    if (!res.ok) throw new Error("Vimeo oEmbed failed: " + res.status);
    var data = await res.json();
    if (data && isUsableUrl(data.thumbnail_url)) return data.thumbnail_url;
    throw new Error("Vimeo oEmbed missing thumbnail_url");
  }

  function isFrameMostlyBlack(ctx, w, h) {
    // Sample a small image for speed.
    var sampleW = Math.max(8, Math.min(64, w));
    var sampleH = Math.max(8, Math.min(36, h));
    var tmp = document.createElement("canvas");
    tmp.width = sampleW;
    tmp.height = sampleH;
    var tctx = tmp.getContext("2d", { willReadFrequently: true });
    if (!tctx) return true;
    tctx.drawImage(ctx.canvas, 0, 0, w, h, 0, 0, sampleW, sampleH);
    var img = tctx.getImageData(0, 0, sampleW, sampleH).data;

    var total = 0;
    var count = 0;
    // step through pixels; include alpha
    for (var i = 0; i < img.length; i += 16) {
      var r = img[i], g = img[i + 1], b = img[i + 2], a = img[i + 3];
      if (a < 16) continue;
      // perceived luminance
      var y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      total += y;
      count++;
    }
    if (!count) return true;
    var avg = total / count;
    // threshold tuned to reject typical black intro frames
    return avg < 18;
  }
  async function generateNativeThumbnail(videoUrl, wrapper) {
    function attemptCapture(useCORS) {
      return new Promise(function (resolve, reject) {
        var v = document.createElement("video");
        v.muted = true;
        v.playsInline = true;
        v.preload = "auto";
        if (useCORS) v.crossOrigin = "anonymous";
  
        var cleaned = false;
        function cleanup() {
          if (cleaned) return;
          cleaned = true;
          try { v.pause(); } catch (e) {}
          v.removeAttribute("src");
          try { v.load(); } catch (e) {}
        }
  
        var captureTimeout = null;
  
        function captureFrame() {
          var w = v.videoWidth;
          var h = v.videoHeight;
          if (!w || !h) return false;
  
          var canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return false;
  
          ctx.drawImage(v, 0, 0, w, h);
  
          try {
            ctx.getImageData(0, 0, 1, 1); // taint check
          } catch (e) {
            cleanup();
            reject(e); // SecurityError — caller retries with CORS
            return true; // signal "handled"
          }
  
          if (isFrameMostlyBlack(ctx, w, h)) return false; // keep playing
  
          var dataUrl = canvas.toDataURL("image/jpeg", 0.82);
          cleanup();
          resolve(dataUrl);
          return true;
        }
  
        // Attempt capture on every timeupdate until we get a good frame
        var attempts = 0;
        function onTimeUpdate() {
          attempts++;
          if (captureFrame()) {
            v.removeEventListener("timeupdate", onTimeUpdate);
            return;
          }
          // Give up after ~60 updates (~2s of playback) to avoid running forever
          if (attempts > 60) {
            v.removeEventListener("timeupdate", onTimeUpdate);
            // Last resort: capture whatever frame we have now, black or not
            var w = v.videoWidth, h = v.videoHeight;
            if (w && h) {
              var canvas = document.createElement("canvas");
              canvas.width = w; canvas.height = h;
              var ctx = canvas.getContext("2d", { willReadFrequently: true });
              ctx.drawImage(v, 0, 0, w, h);
              try {
                var dataUrl = canvas.toDataURL("image/jpeg", 0.82);
                cleanup();
                resolve(dataUrl);
                return;
              } catch (e) {}
            }
            cleanup();
            reject(new Error("No usable frame found"));
          }
        }
  
        v.addEventListener("error", function () {
          cleanup();
          reject(new Error("Video load error: " + (v.error ? v.error.message : "unknown")));
        }, { once: true });
  
        v.addEventListener("loadedmetadata", function () {
          if (!v.videoWidth || !v.videoHeight) {
            cleanup();
            reject(new Error("Missing video dimensions"));
            return;
          }
  
          // Safety timeout: if canplay never fires within 10s, give up
          captureTimeout = setTimeout(function () {
            v.removeEventListener("timeupdate", onTimeUpdate);
            cleanup();
            reject(new Error("Playback timeout — video unresponsive"));
          }, 10000);
  
          v.addEventListener("canplay", function () {
            v.addEventListener("timeupdate", onTimeUpdate);
            v.play().catch(function (e) {
              clearTimeout(captureTimeout);
              cleanup();
              reject(new Error("play() failed: " + e.message));
            });
          }, { once: true });
        }, { once: true });
  
        v.addEventListener("ended", function () {
          // Video ended before we got a good frame — capture whatever is showing
          clearTimeout(captureTimeout);
          v.removeEventListener("timeupdate", onTimeUpdate);
          captureFrame(); // one last try
          if (!cleaned) {
            cleanup();
            reject(new Error("Video ended without a usable frame"));
          }
        }, { once: true });
  
        v.src = videoUrl;
        v.load();
      });
    }
  
    // Try without CORS first; retry with CORS if canvas is tainted
    try {
      return await attemptCapture(false);
    } catch (e1) {
      var isTaint = e1 && (e1.name === "SecurityError" || /tainted|cross.?origin/i.test(e1.message));
      if (!isTaint) throw e1;
      return await attemptCapture(true);
    }
  }

  async function ensureThumbnailUrl(wrapper) {
    if (!wrapper || !wrapper.getAttribute) return;
    var url = wrapper.getAttribute("data-video-url") || "";
    if (!url) return;

    var els = ensureThumbnailEls(wrapper);
    if (!els || !els.img) return;

    // If author provided a valid thumbnail already, keep it.
    if (isUsableUrl(els.img.getAttribute("src"))) {
      wrapper.dataset.vpThumbnailReady = "true";
      return;
    }

    var src = detectSource(url);
    try {
      if (src.type === "youtube" && src.id) {
        els.img.src = await getYouTubeThumbnailUrl(src.id);
        wrapper.dataset.vpThumbnailReady = "true";
        return;
      }
      if (src.type === "vimeo") {
        els.img.src = await getVimeoThumbnailUrl(url);
        wrapper.dataset.vpThumbnailReady = "true";
        return;
      }
      if (src.type === "native" && isUsableUrl(src.id)) {
        // Generate a thumbnail only if CORS allows it; otherwise fail silently.
        els.img.src = await generateNativeThumbnail(src.id, wrapper);
        wrapper.dataset.vpThumbnailReady = "true";
        return;
      }
    } catch (e) {
      // Silent by default; keep empty thumbnail rather than breaking playback.
      wrapper.dataset.vpThumbnailReady = "false";
    }
  }

  function hideThumbnail(wrapper) {
    if (!wrapper) return;
    wrapper.classList.add("vp-thumb-hidden");
  }

  function showThumbnail(wrapper) {
    if (!wrapper) return;
    wrapper.classList.remove("vp-thumb-hidden");
  }

  function initWrapper(wrapper) {
    if (!wrapper || wrapper._vpThumbInitialized) return;
    wrapper._vpThumbInitialized = true;

    ensureThumbnailEls(wrapper);

    // Visible on load, except autoplay (background hero).
    if (wrapper.hasAttribute("data-autoplay")) hideThumbnail(wrapper);
    else showThumbnail(wrapper);

    ensureThumbnailUrl(wrapper);
  }

  function initAll() {
    var wrappers = document.querySelectorAll(".vp-wrapper");
    for (var i = 0; i < wrappers.length; i++) initWrapper(wrappers[i]);
  }

  // Event wiring from video-player.js
  document.addEventListener("vp:init", function (e) {
    var wrapper = e && e.detail && e.detail.wrapper;
    if (wrapper) initWrapper(wrapper);
  });

  document.addEventListener("vp:play", function (e) {
    var wrapper = e && e.detail && e.detail.wrapper;
    if (!wrapper) return;
    hideThumbnail(wrapper);
  });

  document.addEventListener("vp:ended", function (e) {
    var wrapper = e && e.detail && e.detail.wrapper;
    if (!wrapper) return;
    // Only show after the video ends (not on pause).
    showThumbnail(wrapper);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  window.VideoPlayerThumbnailInit = initAll;
})(window);


(function (window) {
  "use strict";

  // If another script redefines things, still keep ours isolated.
  // Also helps diagnose "script not working" situations.
  if (!window || !window.document) return;

  // ============================================================================
  // Provider SDK loaders (needed for YouTube/Vimeo progress/volume/time)
  // ============================================================================
  var YT_API_PROMISE = null;
  function loadYouTubeAPI() {
    if (YT_API_PROMISE) return YT_API_PROMISE;
    YT_API_PROMISE = new Promise(function (resolve, reject) {
      if (window.YT && window.YT.Player) return resolve(window.YT);
      var tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.onerror = function () { reject(new Error("Failed to load YouTube Iframe API")); };
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        try { if (typeof prev === "function") prev(); } catch (e) {}
        resolve(window.YT);
      };
      document.head.appendChild(tag);
    });
    return YT_API_PROMISE;
  }

  var VIMEO_API_PROMISE = null;
  function loadVimeoAPI() {
    if (VIMEO_API_PROMISE) return VIMEO_API_PROMISE;
    VIMEO_API_PROMISE = new Promise(function (resolve, reject) {
      if (window.Vimeo && window.Vimeo.Player) return resolve(window.Vimeo);
      var tag = document.createElement("script");
      tag.src = "https://player.vimeo.com/api/player.js";
      tag.async = true;
      tag.onload = function () {
        if (window.Vimeo && window.Vimeo.Player) resolve(window.Vimeo);
        else reject(new Error("Vimeo Player API loaded but Vimeo.Player missing"));
      };
      tag.onerror = function () { reject(new Error("Failed to load Vimeo Player API")); };
      document.head.appendChild(tag);
    });
    return VIMEO_API_PROMISE;
  }

  var PLAYERS = [];
  function register(p) { PLAYERS.push(p); }
  function pauseOthers(active) {
    for (var i = 0; i < PLAYERS.length; i++) {
      var p = PLAYERS[i];
      if (!p || p === active) continue;
      if (p.autoplay) continue; // keep autoplay running
      p.pause();
    }
  }

  function describeEl(el) {
    try {
      if (!el || !el.tagName) return String(el);
      var s = el.tagName.toLowerCase();
      if (el.id) s += "#" + el.id;
      if (el.className && typeof el.className === "string") {
        var cls = el.className.trim().split(/\s+/).slice(0, 3).join(".");
        if (cls) s += "." + cls;
      }
      var url = el.getAttribute && el.getAttribute("data-video-url");
      if (url) s += ' [data-video-url="' + url + '"]';
      return s;
    } catch (e) { return "vp-wrapper"; }
  }

  function warn(wrapper, msg, extra) {
    try {
      if (extra !== undefined) console.warn("[VideoPlayer]", msg, describeEl(wrapper), wrapper, extra);
      else console.warn("[VideoPlayer]", msg, describeEl(wrapper), wrapper);
    } catch (e) {}
  }

  function error(wrapper, msg, extra) {
    try {
      if (extra !== undefined) console.error("[VideoPlayer]", msg, describeEl(wrapper), wrapper, extra);
      else console.error("[VideoPlayer]", msg, describeEl(wrapper), wrapper);
    } catch (e) {}
  }

  function emit(wrapper, name, detail) {
    try {
      document.dispatchEvent(new CustomEvent(name, { detail: detail || { wrapper: wrapper } }));
    } catch (e) {}
  }

  function parseAutoplayAttr(wrapper) {
    if (!wrapper.hasAttribute("data-autoplay")) return false;
    var v = wrapper.getAttribute("data-autoplay");
    if (v === "false") return false;
    return true;
  }

  function extractYouTubeId(url) {
    var m =
      url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/) ||
      url.match(/youtube\.com\/.*[?&]v=([^&\n?#]+)/);
    return m ? m[1] : null;
  }

  function extractVimeoId(url) {
    var m = url.match(/vimeo\.com\/(\d+)/) || url.match(/vimeo\.com\/.*\/(\d+)/);
    return m ? m[1] : null;
  }

  function formatTime(s) {
    if (!s || !isFinite(s)) return "0:00";
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function detectSource(url) {
    if (!url) return { type: null, id: null };
    var yt = extractYouTubeId(url);
    if (yt) return { type: "youtube", id: yt };
    var vm = extractVimeoId(url);
    if (vm) return { type: "vimeo", id: vm };
    return { type: "native", id: url };
  }

  var ICONS = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
    volumeOn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    volumeOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
    fullscreen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
    exitFullscreen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>',
  };

  function VideoPlayer(wrapper) {
    this.wrapper = wrapper;
    if (!this.wrapper || !this.wrapper.getAttribute) {
      throw new Error("Invalid wrapper element");
    }
    this.container = wrapper.querySelector(".vp-container");
    if (!this.container) {
      // Required in your markup; we create it but log so you can fix HTML.
      error(wrapper, 'Missing required element: child ".vp-container". Creating one automatically.');
      this.container = document.createElement("div");
      this.container.className = "vp-container";
      wrapper.appendChild(this.container);
    }
    this.url = wrapper.getAttribute("data-video-url") || "";
    if (!this.url) error(wrapper, 'Missing required attribute: data-video-url="..."');
    this.source = detectSource(this.url);
    this.autoplay = parseAutoplayAttr(wrapper);
    this.showControls = !wrapper.hasAttribute("data-hide-controls") && !this.autoplay;
    this.title = wrapper.getAttribute("data-title") || wrapper.getAttribute("aria-label") || "Video";

    this.started = false;
    this.isPlaying = false;
    this.videoEl = null;
    this.iframeEl = null;
    this.providerPlayer = null; // YT.Player or Vimeo.Player

    this.centerBtn = null;
    this.clickOverlay = null;
    this.controlsBar = null;
    this.playBtn = null;
    this.progressWrapper = null;
    this.progressFill = null;
    this.progressHandle = null;
    this.timeLabel = null;
    this.volumeContainer = null;
    this.volumeSlider = null;
    this.volumeFill = null;
    this.volumeBtn = null;
    this.fsBtn = null;

    this.duration = 0;
    this.currentTime = 0;
    this.volume = 1;
    this.isMuted = false;
    this.isFullscreen = false;

    this._tickTimer = 0;
    this._suppressToggleUntil = 0;

    this.init();
    register(this);
  }

  VideoPlayer.prototype.init = function () {
    var self = this;

    this.wrapper.classList.add("vp-min");
    if (this.source.type === "youtube" || this.source.type === "vimeo") {
      this.wrapper.classList.add("vp-embed-cover");
    }
    this.wrapper.setAttribute("tabindex", "0");
    this.wrapper.classList.remove("vp-started");
    this.wrapper.setAttribute("aria-label", this.title);

    emit(this.wrapper, "vp:init", { wrapper: this.wrapper, player: this });

    this.buildCenterButton();
    if (this.showControls) this.buildControls();
    this.wrapper.addEventListener("click", function () {
      // Prevent wrapper toggle after scrubbing/dragging controls
      if (Date.now() < self._suppressToggleUntil) return;
      self.toggle();
    });
    this.wrapper.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        self.toggle();
      }
    });

    if (this.autoplay) this.play();
  };

  VideoPlayer.prototype.buildCenterButton = function () {
    var self = this;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vp-center-button";
    btn.setAttribute("aria-label", "Play video");
    btn.innerHTML =
      '<span class="play-icon">' + ICONS.play + "</span>" +
      '<span class="pause-icon">' + ICONS.pause + "</span>";
    this.centerBtn = btn;
    this.container.appendChild(btn);
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      self.toggle();
    });
    this.updateCenterButton();
  };

  VideoPlayer.prototype.buildControls = function () {
    var self = this;
    var wrap = document.createElement("div");
    wrap.className = "vp-controls";
    wrap.innerHTML =
      '<div class="vp-progress-wrapper" aria-label="Video progress" tabindex="0">' +
        '<div class="vp-progress-bar">' +
          '<div class="vp-progress-fill"></div>' +
          '<div class="vp-progress-handle"></div>' +
        '</div>' +
      '</div>' +
      '<div class="vp-controls-bar">' +
        '<button type="button" class="vp-control-btn vp-play-toggle" aria-label="Play">' +
          ICONS.play +
        '</button>' +
        '<span class="vp-time">0:00 / 0:00</span>' +
        '<div class="vp-spacer"></div>' +
        '<div class="vp-volume-container">' +
          '<button type="button" class="vp-control-btn vp-volume-toggle" aria-label="Mute">' +
            ICONS.volumeOn +
          '</button>' +
          '<div class="vp-volume-slider">' +
            '<div class="vp-volume-fill" style="width:100%"></div>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="vp-control-btn vp-fs-toggle" aria-label="Fullscreen">' +
          ICONS.fullscreen +
        '</button>' +
      '</div>';

    this.controlsBar = wrap;
    this.container.appendChild(wrap);

    this.progressWrapper = wrap.querySelector(".vp-progress-wrapper");
    this.progressFill = wrap.querySelector(".vp-progress-fill");
    this.progressHandle = wrap.querySelector(".vp-progress-handle");
    this.playBtn = wrap.querySelector(".vp-play-toggle");
    this.timeLabel = wrap.querySelector(".vp-time");
    this.volumeContainer = wrap.querySelector(".vp-volume-container");
    this.volumeSlider = wrap.querySelector(".vp-volume-slider");
    this.volumeFill = wrap.querySelector(".vp-volume-fill");
    this.volumeBtn = wrap.querySelector(".vp-volume-toggle");
    this.fsBtn = wrap.querySelector(".vp-fs-toggle");

    wrap.addEventListener("click", function (e) { e.stopPropagation(); });

    if (this.playBtn) {
      this.playBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        self.toggle();
      });
    }

    if (this.progressWrapper) {
      var onSeekAtEvent = function (clientX) {
        if (!self.duration) return;
        var rect = self.progressWrapper.getBoundingClientRect();
        var pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        self.seek(self.duration * pct);
      };
      this.progressWrapper.addEventListener("click", function (e) {
        e.stopPropagation();
        onSeekAtEvent(e.clientX);
      });
      // Drag support
      this.progressWrapper.addEventListener("pointerdown", function (e) {
        if (!self.duration) return;
        e.preventDefault();
        e.stopPropagation();
        self._suppressToggleUntil = Date.now() + 600;
        try { self.progressWrapper.setPointerCapture(e.pointerId); } catch (err) {}
        onSeekAtEvent(e.clientX);
        var onMove = function (ev) { onSeekAtEvent(ev.clientX); };
        var onUp = function () {
          self._suppressToggleUntil = Date.now() + 600;
          self.progressWrapper.removeEventListener("pointermove", onMove);
          self.progressWrapper.removeEventListener("pointerup", onUp);
          self.progressWrapper.removeEventListener("pointercancel", onUp);
        };
        self.progressWrapper.addEventListener("pointermove", onMove);
        self.progressWrapper.addEventListener("pointerup", onUp);
        self.progressWrapper.addEventListener("pointercancel", onUp);
      });
    }

    if (this.volumeBtn) {
      this.volumeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        self.toggleMute();
      });
    }

    if (this.volumeSlider) {
      var onVolumeAtEvent = function (clientX) {
        var rect = self.volumeSlider.getBoundingClientRect();
        var pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        self.setVolume(pct);
      };
      this.volumeSlider.addEventListener("click", function (e) {
        e.stopPropagation();
        onVolumeAtEvent(e.clientX);
      });
      // Drag support
      this.volumeSlider.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        e.stopPropagation();
        self._suppressToggleUntil = Date.now() + 600;
        try { self.volumeSlider.setPointerCapture(e.pointerId); } catch (err) {}
        onVolumeAtEvent(e.clientX);
        var onMove = function (ev) { onVolumeAtEvent(ev.clientX); };
        var onUp = function () {
          self._suppressToggleUntil = Date.now() + 600;
          self.volumeSlider.removeEventListener("pointermove", onMove);
          self.volumeSlider.removeEventListener("pointerup", onUp);
          self.volumeSlider.removeEventListener("pointercancel", onUp);
        };
        self.volumeSlider.addEventListener("pointermove", onMove);
        self.volumeSlider.addEventListener("pointerup", onUp);
        self.volumeSlider.addEventListener("pointercancel", onUp);
      });
    }

    if (this.fsBtn) {
      this.fsBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        self.toggleFullscreen();
      });
    }

    this.updateControls();
  };

  VideoPlayer.prototype.updateControls = function () {
    if (!this.showControls) return;
    if (this.playBtn) {
      if (this.isPlaying) {
        this.playBtn.setAttribute("aria-label", "Pause");
        this.playBtn.innerHTML = ICONS.pause;
      } else {
        this.playBtn.setAttribute("aria-label", "Play");
        this.playBtn.innerHTML = ICONS.play;
      }
    }
    if (this.progressFill && this.duration) {
      var pct = Math.max(0, Math.min(1, this.currentTime / this.duration));
      this.progressFill.style.width = (pct * 100) + "%";
      if (this.progressHandle) this.progressHandle.style.left = (pct * 100) + "%";
    }
    if (this.timeLabel) {
      var cur = formatTime(this.currentTime || 0);
      var dur = formatTime(this.duration || 0);
      this.timeLabel.textContent = cur + " / " + dur;
    }
    if (this.volumeFill) {
      this.volumeFill.style.width = (this.isMuted ? 0 : this.volume * 100) + "%";
    }
    if (this.volumeBtn) {
      this.volumeBtn.innerHTML = this.isMuted ? ICONS.volumeOff : ICONS.volumeOn;
      this.volumeBtn.setAttribute("aria-label", this.isMuted ? "Unmute" : "Mute");
    }
    if (this.fsBtn) {
      this.fsBtn.innerHTML = this.isFullscreen ? ICONS.exitFullscreen : ICONS.fullscreen;
      this.fsBtn.setAttribute("aria-label", this.isFullscreen ? "Exit fullscreen" : "Fullscreen");
    }
  };

  VideoPlayer.prototype.updateCenterButton = function () {
    if (!this.centerBtn) return;
    if (this.autoplay) {
      this.centerBtn.style.display = "none";
      return;
    }
    this.centerBtn.style.display = "";
    if (this.isPlaying) {
      this.centerBtn.classList.add("is-playing");
      this.centerBtn.setAttribute("aria-label", "Pause video");
    } else {
      this.centerBtn.classList.remove("is-playing");
      this.centerBtn.setAttribute("aria-label", "Play video");
    }
  };

  VideoPlayer.prototype.createEmbed = function () {
    var self = this;
    if (this.source.type === "youtube") {
      if (!this.source.id) {
        error(this.wrapper, "Invalid YouTube URL (cannot extract video id).", this.url);
        return;
      }
      var originPart = "";
      try {
        if (location.protocol === "http:" || location.protocol === "https:") {
          originPart = "&origin=" + encodeURIComponent(location.origin);
        } else {
          warn(this.wrapper, "YouTube controls may be limited on file://. Use a local server for full API support.");
        }
      } catch (e) {}
      var loopPart = this.autoplay ? "&loop=1&playlist=" + encodeURIComponent(this.source.id) : "";
      var params =
        "autoplay=1&mute=" + (this.autoplay ? 1 : 0) +
        "&controls=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1" +
        originPart + loopPart;
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + this.source.id + "?" + params;
      iframe.allow = "autoplay; encrypted-media; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.style.cssText = "position:absolute;border:0;";
      this.container.insertBefore(iframe, this.container.firstChild);
      this.iframeEl = iframe;

      // overlay to catch clicks (iframe eats clicks)
      var ov = document.createElement("div");
      ov.className = "vp-click-overlay";
      this.container.appendChild(ov);
      this.clickOverlay = ov;
      ov.addEventListener("click", function (e) {
        e.stopPropagation();
        self.toggle();
      });

      // Attach YouTube API for time/volume/progress
      loadYouTubeAPI().then(function (YT) {
        try {
          self.providerPlayer = new YT.Player(iframe, {
            events: {
              onReady: function () {
                // initial state
                try {
                  self.duration = self.providerPlayer.getDuration() || 0;
                  self.isMuted = self.providerPlayer.isMuted && self.providerPlayer.isMuted();
                  self.volume = (self.providerPlayer.getVolume ? self.providerPlayer.getVolume() / 100 : 100) / 100;
                } catch (e) {}
                self.startTicking();
                self.updateControls();
              },
              onStateChange: function (ev) {
                // 1 playing, 2 paused, 0 ended
                self.isPlaying = ev && ev.data === 1;
                if (ev && ev.data === 0) emit(self.wrapper, "vp:ended", { wrapper: self.wrapper, player: self });
                self.updateCenterButton();
                self.updateControls();
              }
            }
          });
        } catch (e) {
          error(self.wrapper, "Failed to initialize YouTube API player.", e);
        }
      }).catch(function (e) {
        error(self.wrapper, "YouTube API failed to load. Progress/volume/time disabled.", e && e.message);
      });
      return;
    }

    if (this.source.type === "vimeo") {
      if (!this.source.id) {
        error(this.wrapper, "Invalid Vimeo URL (cannot extract video id).", this.url);
        return;
      }
      var loopPart2 = this.autoplay ? "&loop=1" : "";
      var params2 = "autoplay=1&muted=" + (this.autoplay ? 1 : 0) + "&controls=0&api=1&dnt=1" + loopPart2;
      var iframe2 = document.createElement("iframe");
      iframe2.src = "https://player.vimeo.com/video/" + this.source.id + "?" + params2;
      iframe2.allow = "autoplay; fullscreen; picture-in-picture";
      iframe2.allowFullscreen = true;
      iframe2.style.cssText = "position:absolute;border:0;";
      this.container.insertBefore(iframe2, this.container.firstChild);
      this.iframeEl = iframe2;

      var ov2 = document.createElement("div");
      ov2.className = "vp-click-overlay";
      this.container.appendChild(ov2);
      this.clickOverlay = ov2;
      ov2.addEventListener("click", function (e) {
        e.stopPropagation();
        self.toggle();
      });

      // Attach Vimeo API for time/volume/progress
      loadVimeoAPI().then(function (Vimeo) {
        try {
          self.providerPlayer = new Vimeo.Player(iframe2);
          self.providerPlayer.getDuration().then(function (d) {
            self.duration = d || 0;
            self.updateControls();
          }).catch(function () {});
          self.providerPlayer.getVolume().then(function (v) {
            self.volume = typeof v === "number" ? v : 1;
            self.isMuted = self.volume === 0;
            self.updateControls();
          }).catch(function () {});

          self.providerPlayer.on("play", function () {
            self.isPlaying = true;
            self.updateCenterButton();
            self.updateControls();
          });
          self.providerPlayer.on("pause", function () {
            self.isPlaying = false;
            self.updateCenterButton();
            self.updateControls();
          });
          self.providerPlayer.on("ended", function () {
            self.isPlaying = false;
            self.updateCenterButton();
            self.updateControls();
            emit(self.wrapper, "vp:ended", { wrapper: self.wrapper, player: self });
          });
          self.providerPlayer.on("timeupdate", function (data) {
            if (!data) return;
            if (typeof data.seconds === "number") self.currentTime = data.seconds;
            if (typeof data.duration === "number") self.duration = data.duration;
            self.updateControls();
          });
          self.startTicking();
        } catch (e) {
          error(self.wrapper, "Failed to initialize Vimeo API player.", e);
        }
      }).catch(function (e) {
        error(self.wrapper, "Vimeo API failed to load. Progress/volume/time disabled.", e && e.message);
      });
      return;
    }

    var video = document.createElement("video");
    video.src = this.source.id;
    video.playsInline = true;
    video.muted = this.autoplay; // autoplay must be muted
    video.loop = !!this.autoplay; // requirement: autoplay always loops
    video.controls = false;
    video.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;";
    this.container.insertBefore(video, this.container.firstChild);
    this.videoEl = video;

    video.addEventListener("play", function () {
      self.isPlaying = true;
      self.isMuted = video.muted;
      self.updateCenterButton();
      self.updateControls();
    });
    video.addEventListener("pause", function () {
      self.isPlaying = false;
      self.updateCenterButton();
      self.updateControls();
    });
    video.addEventListener("loadedmetadata", function () {
      self.duration = video.duration || 0;
      self.updateControls();
    });
    video.addEventListener("timeupdate", function () {
      self.currentTime = video.currentTime || 0;
      self.updateControls();
    });
    video.addEventListener("ended", function () {
      self.isPlaying = false;
      self.updateCenterButton();
      self.updateControls();
      emit(self.wrapper, "vp:ended", { wrapper: self.wrapper, player: self });
    });
  };

  // Provider control helpers
  VideoPlayer.prototype.providerPlay = function () {
    if (this.videoEl) return this.videoEl.play();
    if (!this.providerPlayer) return;
    try {
      if (this.source.type === "youtube" && this.providerPlayer.playVideo) this.providerPlayer.playVideo();
      if (this.source.type === "vimeo" && this.providerPlayer.play) this.providerPlayer.play();
    } catch (e) {}
  };

  VideoPlayer.prototype.providerPause = function () {
    if (this.videoEl) return this.videoEl.pause();
    if (!this.providerPlayer) return;
    try {
      if (this.source.type === "youtube" && this.providerPlayer.pauseVideo) this.providerPlayer.pauseVideo();
      if (this.source.type === "vimeo" && this.providerPlayer.pause) this.providerPlayer.pause();
    } catch (e) {}
  };

  VideoPlayer.prototype.play = function () {
    if (!this.url) return;
    if (!this.autoplay) pauseOthers(this);
    if (!this.started) {
      this.started = true;
      this.createEmbed();
    }
    if (!this.videoEl && !this.iframeEl) {
      // createEmbed failed (invalid URL etc.)
      return;
    }
    this.wrapper.classList.add("vp-started");
    if (this.videoEl) this.videoEl.play().catch(function () {});
    if (this.iframeEl) this.providerPlay();
    this.isPlaying = true;
    this.updateCenterButton();
    this.updateControls();
    this.startTicking();

    emit(this.wrapper, "vp:play", { wrapper: this.wrapper, player: this });
  };

  VideoPlayer.prototype.pause = function () {
    if (this.autoplay) return;
    if (this.videoEl) this.videoEl.pause();
    if (this.iframeEl) this.providerPause();
    this.isPlaying = false;
    this.updateCenterButton();
    this.updateControls();
  };

  VideoPlayer.prototype.toggle = function () {
    if (this.autoplay) return;
    if (!this.started || !this.isPlaying) this.play();
    else this.pause();
  };

  VideoPlayer.prototype.seek = function (time) {
    if (this.videoEl) {
      this.videoEl.currentTime = Math.max(0, Math.min(time, this.duration || time));
      this.currentTime = this.videoEl.currentTime;
      this.updateControls();
      return;
    }
    if (!this.providerPlayer) return;
    try {
      if (this.source.type === "youtube" && this.providerPlayer.seekTo) this.providerPlayer.seekTo(time, true);
      if (this.source.type === "vimeo" && this.providerPlayer.setCurrentTime) this.providerPlayer.setCurrentTime(time);
    } catch (e) {}
  };

  VideoPlayer.prototype.toggleMute = function () {
    if (this.videoEl) {
      this.isMuted = !this.isMuted;
      this.videoEl.muted = this.isMuted;
      this.updateControls();
      return;
    }
    if (!this.providerPlayer) return;
    try {
      if (this.source.type === "youtube") {
        if (this.providerPlayer.isMuted && this.providerPlayer.isMuted()) this.providerPlayer.unMute();
        else if (this.providerPlayer.mute) this.providerPlayer.mute();
        this.isMuted = this.providerPlayer.isMuted ? this.providerPlayer.isMuted() : !this.isMuted;
      } else if (this.source.type === "vimeo") {
        var nextMuted = !this.isMuted;
        this.providerPlayer.setVolume(nextMuted ? 0 : (this.volume || 1));
        this.isMuted = nextMuted;
      }
    } catch (e) {}
    this.updateControls();
  };

  VideoPlayer.prototype.setVolume = function (v) {
    this.volume = Math.max(0, Math.min(1, v));
    this.isMuted = this.volume === 0;
    if (this.videoEl) {
      this.videoEl.volume = this.volume;
      this.videoEl.muted = this.isMuted;
      this.updateControls();
      return;
    }
    if (!this.providerPlayer) return;
    try {
      if (this.source.type === "youtube" && this.providerPlayer.setVolume) this.providerPlayer.setVolume(Math.round(this.volume * 100));
      if (this.source.type === "vimeo" && this.providerPlayer.setVolume) this.providerPlayer.setVolume(this.volume);
    } catch (e) {}
    this.updateControls();
  };

  VideoPlayer.prototype.toggleFullscreen = function () {
    var self = this;
    var el = this.wrapper;
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().then(function () {
        self.isFullscreen = true;
        self.updateControls();
      }).catch(function () {});
    } else if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().then(function () {
        self.isFullscreen = false;
        self.updateControls();
      }).catch(function () {});
    }
  };

  VideoPlayer.prototype.startTicking = function () {
    var self = this;
    if (this._tickTimer) return;
    // Poll YT (no reliable timeupdate without full API callbacks).
    this._tickTimer = window.setInterval(function () {
      if (!self.started) return;
      if (self.videoEl) return; // native uses events
      if (!self.providerPlayer) return;
      try {
        if (self.source.type === "youtube") {
          if (self.providerPlayer.getCurrentTime) self.currentTime = self.providerPlayer.getCurrentTime() || 0;
          if (self.providerPlayer.getDuration) self.duration = self.providerPlayer.getDuration() || self.duration;
          if (self.providerPlayer.getVolume) self.volume = (self.providerPlayer.getVolume() || 0) / 100;
          if (self.providerPlayer.isMuted) self.isMuted = self.providerPlayer.isMuted();
          self.updateControls();
        }
      } catch (e) {}
    }, 250);
  };

  function initAllPlayers() {
    // If another script has already initialized wrappers, we won't double-init.
    var wrappers = document.querySelectorAll(".vp-wrapper");
    for (var i = 0; i < wrappers.length; i++) {
      if (wrappers[i]._vpInitialized) continue;
      wrappers[i]._vpInitialized = true;
      try {
        new VideoPlayer(wrappers[i]);
      } catch (e) {
        // Never let one broken wrapper stop the page.
        try { console.error("[VideoPlayer] Failed to initialize player for element", wrappers[i], e); } catch (err) {}
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAllPlayers);
  } else {
    initAllPlayers();
  }

  window.VideoPlayerInit = initAllPlayers;
})(window);
