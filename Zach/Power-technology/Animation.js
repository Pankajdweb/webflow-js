/* ============================================================
   ANIMATE.JS  —  Global attribute-driven GSAP animation system
   Requires: GSAP 3 + ScrollTrigger plugin (loaded before this)

   HOW TO USE
   ──────────────────────────────────────────────────────────

   1. Load GSAP + ScrollTrigger before this file:
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
      <link rel="stylesheet" href="animate.css">
      <script src="animate.js" defer></script>

   ──────────────────────────────────────────────────────────
   ANIMATION TYPES  →  data-anim="..."
   ──────────────────────────────────────────────────────────

   "fade-up"      fade in + rise up              ↑
   "fade-down"    fade in + drop down            ↓
   "fade-left"    fade in + slide from left      →
   "fade-right"   fade in + slide from right     ←
   "fade-scale"   fade in + scale up from 88%
   "clip-up"      clip-path wipe from bottom     clip ↑
   "clip-left"    clip-path wipe from left       clip →
   "line"         scaleX expand left → right     ─────

   ──────────────────────────────────────────────────────────
   OPTIONAL MODIFIERS  (add to the same element)
   ──────────────────────────────────────────────────────────

   data-anim-delay="0.2"        extra delay in seconds
   data-anim-duration="1.2"     override duration (default 0.9s)
   data-anim-ease="back.out"    any GSAP ease string

   ──────────────────────────────────────────────────────────
   STAGGER  (siblings animate in sequence)
   ──────────────────────────────────────────────────────────

   Add data-anim-stagger="0.1" to siblings that share a parent.
   The JS groups them automatically — no wrapper class needed.
   The data-anim, delay, duration, and ease are read from the
   first sibling; stagger offset is the value of this attribute.

   Example — three cards in a row:
   <div class="card" data-anim="fade-up" data-anim-stagger="0.12"> ... </div>
   <div class="card" data-anim="fade-up" data-anim-stagger="0.12"> ... </div>
   <div class="card" data-anim="fade-up" data-anim-stagger="0.12"> ... </div>

   ──────────────────────────────────────────────────────────
   SCROLL TRIGGER CONFIG  (global defaults, edit below)
   ──────────────────────────────────────────────────────────

   DEFAULTS.duration   — base animation duration  (0.9s)
   DEFAULTS.ease       — base GSAP ease           ("power3.out")
   DEFAULTS.start      — ScrollTrigger start      ("top 88%")
   DEFAULTS.once       — only animate once        (true)

   ============================================================ */

(function () {
  "use strict";

  /* ── Guard: GSAP must be loaded first ── */
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("[animate.js] GSAP or ScrollTrigger not found. Load them before this script.");
    /* Reveal everything so content isn't hidden */
    document.querySelectorAll("[data-anim]").forEach(function (el) {
      el.style.visibility = "visible";
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ─────────────────────────────────────────
     GLOBAL DEFAULTS  — edit these freely
  ───────────────────────────────────────── */
  var DEFAULTS = {
    duration : 0.9,
    ease     : "power3.out",
    start    : "top 88%",   /* when element top hits 88% from viewport top */
    once     : true,        /* set false to re-trigger on scroll back up */
  };

  /* ─────────────────────────────────────────
     FROM-STATE DEFINITIONS
     Each key maps to the "from" vars GSAP
     animates away from into the natural state.
  ───────────────────────────────────────── */
  var FROM = {
    "fade-up"    : { opacity: 0, y: 40 },
    "fade-down"  : { opacity: 0, y: -40 },
    "fade-left"  : { opacity: 0, x: -52 },
    "fade-right" : { opacity: 0, x: 52 },
    "fade-scale" : { opacity: 0, scale: 0.88, transformOrigin: "center bottom" },
    "clip-up"    : { clipPath: "inset(100% 0 0 0)" },
    "clip-left"  : { clipPath: "inset(0 100% 0 0)" },
    "line"       : { scaleX: 0, transformOrigin: "left center" },
  };

  /* ─────────────────────────────────────────
     TO-STATE: what every animation lands on.
     Keys not set here default to GSAP's
     "natural" value for that property.
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
     HELPERS
  ───────────────────────────────────────── */

  /* Read per-element overrides */
  function getOptions(el) {
    return {
      animType : el.getAttribute("data-anim") || "fade-up",
      delay    : parseFloat(el.getAttribute("data-anim-delay")    || 0),
      duration : parseFloat(el.getAttribute("data-anim-duration") || DEFAULTS.duration),
      ease     : el.getAttribute("data-anim-ease")                || DEFAULTS.ease,
    };
  }

  /* Reveal element (un-hide set by CSS) */
  function show(el) {
    el.style.visibility = "visible";
  }

  /* Build the ScrollTrigger config for a trigger element */
  function scrollTriggerFor(triggerEl) {
    return {
      trigger : triggerEl,
      start   : DEFAULTS.start,
      once    : DEFAULTS.once,
    };
  }

  /* ─────────────────────────────────────────
     SINGLE ELEMENT ANIMATION
  ───────────────────────────────────────── */
  function animateSingle(el) {
    var opts     = getOptions(el);
    var fromVars = FROM[opts.animType] || FROM["fade-up"];

    show(el);

    var toVars = Object.assign({}, TO_BASE, {
      duration      : opts.duration,
      ease          : opts.ease,
      delay         : opts.delay,
      scrollTrigger : scrollTriggerFor(el),
    });

    gsap.fromTo(el, fromVars, toVars);
  }

  /* ─────────────────────────────────────────
     STAGGER GROUP ANIMATION
     els   — array of sibling elements
     staggerVal — seconds between each item
  ───────────────────────────────────────── */
  function animateStaggerGroup(els, staggerVal) {
    /* Use the first element's options for the whole group */
    var opts     = getOptions(els[0]);
    var fromVars = FROM[opts.animType] || FROM["fade-up"];

    /* Reveal all before animating */
    els.forEach(show);

    /*
      Pick the closest scrollable ancestor section/article/div/footer
      as the trigger so the whole group fires together, not one-by-one.
    */
    var trigger = els[0].closest("section, article, footer, [data-anim-trigger]")
                  || els[0].parentElement;

    var toVars = Object.assign({}, TO_BASE, {
      duration      : opts.duration,
      ease          : opts.ease,
      delay         : opts.delay,
      stagger       : parseFloat(staggerVal),
      scrollTrigger : scrollTriggerFor(trigger),
    });

    gsap.fromTo(els, fromVars, toVars);
  }

  /* ─────────────────────────────────────────
     BUILD STAGGER GROUPS
     Groups siblings that share the same
     (parentElement, data-anim-stagger value).
  ───────────────────────────────────────── */
  function buildStaggerGroups() {
    /*
      groups structure:
        Map<parentEl, Map<staggerValue, El[]>>
    */
    var groups = new Map();

    document.querySelectorAll("[data-anim-stagger]").forEach(function (el) {
      var parent = el.parentElement;
      var sv     = el.getAttribute("data-anim-stagger");

      if (!groups.has(parent)) {
        groups.set(parent, new Map());
      }
      var parentMap = groups.get(parent);
      if (!parentMap.has(sv)) {
        parentMap.set(sv, []);
      }
      parentMap.get(sv).push(el);
    });

    return groups;
  }

  /* ─────────────────────────────────────────
     INIT — wire everything up
  ───────────────────────────────────────── */
  function init() {
    var staggerGroups = buildStaggerGroups();
    var processedEls  = new Set();

    /* 1 ── Stagger groups */
    staggerGroups.forEach(function (staggerMap) {
      staggerMap.forEach(function (els, staggerVal) {
        animateStaggerGroup(els, staggerVal);
        els.forEach(function (el) { processedEls.add(el); });
      });
    });

    /* 2 ── All remaining [data-anim] elements (non-stagger) */
    document.querySelectorAll("[data-anim]").forEach(function (el) {
      if (!processedEls.has(el)) {
        animateSingle(el);
      }
    });
  }

  /* Run after DOM is ready */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
