(function () {
  "use strict";

  /* ─────────────────────────────────────────
     STEP 1 — Load ScrollTrigger from CDN.
     Webflow bundles GSAP core but NOT
     ScrollTrigger, so we load it ourselves.
  ───────────────────────────────────────── */
  var ST_CDN = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js";

  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = cb;
    s.onerror = function () {
      console.warn("[animate.js] Failed to load ScrollTrigger from CDN:", src);
      revealAll(); /* fail-safe: show everything */
    };
    document.head.appendChild(s);
  }

  /* Fail-safe: if anything goes wrong, just show all elements */
  function revealAll() {
    document.querySelectorAll("[data-anim]").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
      el.style.clipPath = "none";
    });
  }

  /* ─────────────────────────────────────────
     STEP 2 — Boot after Webflow is ready.
     window.Webflow.push() is the correct
     hook — it fires after Webflow's own JS
     has set up the page, including IX2.
     Falls back to DOMContentLoaded if the
     Webflow object isn't present (e.g. plain
     HTML preview or exported code).
  ───────────────────────────────────────── */
  function boot() {
    if (typeof gsap === "undefined") {
      console.warn("[animate.js] GSAP not found. Is this a Webflow site?");
      revealAll();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    init();
  }

  function waitForWebflow(cb) {
    if (window.Webflow && window.Webflow.push) {
      window.Webflow.push(cb);
    } else {
      /* Non-Webflow or exported site */
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", cb);
      } else {
        /* DOM already ready (script loaded late) */
        setTimeout(cb, 0);
      }
    }
  }

  /* ─────────────────────────────────────────
     GLOBAL DEFAULTS — edit freely
  ───────────────────────────────────────── */
  var DEFAULTS = {
    duration : 0.9,
    ease     : "power3.out",
    start    : "top 88%",
    once     : true,
  };

  /* ─────────────────────────────────────────
     FROM-STATE MAP
     Each key = the "hidden" start state.
     GSAP tweens from this → natural state.
  ───────────────────────────────────────── */
  var FROM = {
    "fade-up"    : { opacity: 0, y: 40 },
    "fade-down"  : { opacity: 0, y: -40 },
    "fade-left"  : { opacity: 0, x: -52 },
    "fade-right" : { opacity: 0, x: 52 },
    "fade-scale" : { opacity: 0, scale: 0.88, transformOrigin: "center bottom" },
    "clip-up"    : { opacity: 1, clipPath: "inset(100% 0 0 0)" },
    "clip-left"  : { opacity: 1, clipPath: "inset(0 100% 0 0)" },
    "line"       : { opacity: 1, scaleX: 0, transformOrigin: "left center" },
  };

  /* ─────────────────────────────────────────
     TO-STATE: what every tween lands on
  ───────────────────────────────────────── */
  var TO_BASE = {
    opacity  : 1,
    x        : 0,
    y        : 0,
    scale    : 1,
    scaleX   : 1,
    clipPath : "inset(0% 0% 0% 0%)",
  };

  /* ─────────────────────────────────────────
     READ PER-ELEMENT OPTIONS
  ───────────────────────────────────────── */
  function getOptions(el) {
    return {
      animType : el.getAttribute("data-anim") || "fade-up",
      delay    : parseFloat(el.getAttribute("data-anim-delay")    || 0),
      duration : parseFloat(el.getAttribute("data-anim-duration") || DEFAULTS.duration),
      ease     : el.getAttribute("data-anim-ease")                || DEFAULTS.ease,
    };
  }

  /* ─────────────────────────────────────────
     SCROLLTRIGGER CONFIG FOR AN ELEMENT
  ───────────────────────────────────────── */
  function makeST(triggerEl) {
    return {
      trigger : triggerEl,
      start   : DEFAULTS.start,
      once    : DEFAULTS.once,
    };
  }

  /* ─────────────────────────────────────────
     ANIMATE A SINGLE ELEMENT
  ───────────────────────────────────────── */
  function animateSingle(el) {
    var opts     = getOptions(el);
    var fromVars = FROM[opts.animType] || FROM["fade-up"];
    var toVars   = Object.assign({}, TO_BASE, {
      duration      : opts.duration,
      ease          : opts.ease,
      delay         : opts.delay,
      scrollTrigger : makeST(el),
    });
    gsap.fromTo(el, fromVars, toVars);
  }

  /* ─────────────────────────────────────────
     ANIMATE A STAGGER GROUP
     els        — array of sibling elements
     staggerVal — seconds between each item
  ───────────────────────────────────────── */
  function animateStaggerGroup(els, staggerVal) {
    var opts     = getOptions(els[0]);
    var fromVars = FROM[opts.animType] || FROM["fade-up"];

    /*
      Trigger on the nearest section/article/footer ancestor
      so all siblings fire at the same scroll position,
      not individually as each one enters the viewport.
    */
    var trigger = els[0].closest("section, article, footer, header, [data-anim-trigger]")
                  || els[0].parentElement;

    var toVars = Object.assign({}, TO_BASE, {
      duration      : opts.duration,
      ease          : opts.ease,
      delay         : opts.delay,
      stagger       : parseFloat(staggerVal),
      scrollTrigger : makeST(trigger),
    });

    gsap.fromTo(els, fromVars, toVars);
  }

  /* ─────────────────────────────────────────
     BUILD STAGGER GROUPS
     Groups siblings sharing (parentEl, staggerValue).
  ───────────────────────────────────────── */
  function buildStaggerGroups() {
    var groups = new Map();

    document.querySelectorAll("[data-anim-stagger]").forEach(function (el) {
      var parent = el.parentElement;
      var sv     = el.getAttribute("data-anim-stagger");

      if (!groups.has(parent)) groups.set(parent, new Map());
      var pMap = groups.get(parent);
      if (!pMap.has(sv)) pMap.set(sv, []);
      pMap.get(sv).push(el);
    });

    return groups;
  }

  /* ─────────────────────────────────────────
     MAIN INIT
  ───────────────────────────────────────── */
  function init() {
    var staggerGroups = buildStaggerGroups();
    var processed     = new Set();

    /* 1. Stagger groups first */
    staggerGroups.forEach(function (staggerMap) {
      staggerMap.forEach(function (els, sv) {
        animateStaggerGroup(els, sv);
        els.forEach(function (el) { processed.add(el); });
      });
    });

    /* 2. All remaining [data-anim] elements */
    document.querySelectorAll("[data-anim]").forEach(function (el) {
      if (!processed.has(el)) animateSingle(el);
    });
  }

  /* ─────────────────────────────────────────
     ENTRY POINT
     Load ScrollTrigger → wait for Webflow → boot
  ───────────────────────────────────────── */

  /*
    If ScrollTrigger is already on the page
    (e.g. someone loaded the full GSAP bundle),
    skip the CDN load and go straight to boot.
  */
  if (window.ScrollTrigger) {
    waitForWebflow(boot);
  } else {
    loadScript(ST_CDN, function () {
      waitForWebflow(boot);
    });
  }

})();
