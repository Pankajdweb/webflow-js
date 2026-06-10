/* ============================================================
   ANIMATE.JS  — Webflow attribute-driven GSAP animation system
   ============================================================

   PASTE INTO WEBFLOW
   ──────────────────
   Site Settings → Custom Code → Footer Code
   Wrap the ENTIRE file contents in <script> tags:
   <script> ...paste here... </script>

   DO NOT paste the <script> tags into a .js file —
   Webflow's footer code box expects raw HTML, so the
   <script> wrapper is required there. If hosting this
   as a file and loading via <script src="...">, remove
   the <script> wrapper tags.

   ============================================================
   HOW TO USE — add data attributes to any Webflow element
   ============================================================

   ANIMATION TYPE  →  data-anim="..."
   ──────────────────────────────────
   fade-up       fade + rise up           ↑
   fade-down     fade + drop down         ↓
   fade-left     fade + slide from left   →
   fade-right    fade + slide from right  ←
   fade-scale    fade + scale up (0.88→1)
   clip-up       clip-path wipe upward
   clip-left     clip-path wipe leftward
   line          scaleX expand left→right

   OPTIONAL MODIFIERS  (on the same element)
   ──────────────────────────────────────────
   data-anim-delay="0.2"        extra delay in seconds
   data-anim-duration="1.2"     override duration (default: 0.9s)
   data-anim-ease="back.out"    any GSAP ease string

   STAGGER  (siblings cascade in sequence)
   ────────────────────────────────────────
   Add data-anim-stagger="0.12" to each sibling element.
   Siblings are grouped automatically by shared parent.
   Type/delay/duration/ease are read from the first sibling.

   GLOBAL DEFAULTS  (edit the DEFAULTS object below)
   ──────────────────────────────────────────────────
   duration → 0.9
   ease     → "power3.out"
   start    → "top 88%"
   once     → true

   ============================================================ */

(function () {
  "use strict";

  var LOG = "[animate.js]";

  console.log(LOG, "Script executing...");

  /* ─────────────────────────────────────────────────────────
     FAIL-SAFE
     If anything goes wrong we call this so elements are never
     stuck invisible.
  ───────────────────────────────────────────────────────── */
  function revealAll() {
    var els = document.querySelectorAll("[data-anim]");
    console.warn(LOG, "revealAll() called — making", els.length, "elements visible without animation.");
    els.forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
      el.style.clipPath = "none";
    });
  }

  /* ─────────────────────────────────────────────────────────
     LOAD SCROLLTRIGGER FROM CDN
     Webflow bundles GSAP core but NOT ScrollTrigger.
     We inject it ourselves and call cb() when ready.
  ───────────────────────────────────────────────────────── */
  var ST_CDN = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js";

  function loadScrollTrigger(cb) {
    /* Already loaded — skip */
    if (window.ScrollTrigger) {
      console.log(LOG, "ScrollTrigger already present, skipping CDN load.");
      cb();
      return;
    }

    console.log(LOG, "Loading ScrollTrigger from CDN:", ST_CDN);
    var s   = document.createElement("script");
    s.src   = ST_CDN;
    s.async = false; /* keep execution order predictable */

    s.onload = function () {
      console.log(LOG, "ScrollTrigger loaded successfully.");
      cb();
    };

    s.onerror = function () {
      console.error(LOG, "FAILED to load ScrollTrigger from CDN. Check network / CSP settings.");
      revealAll();
    };

    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────────────────────
     WAIT FOR WEBFLOW
     window.Webflow.push() fires after Webflow's own runtime
     (IX2, interactions, etc.) has finished booting — the
     correct hook for any third-party JS on a Webflow site.
     Falls back to DOMContentLoaded for non-Webflow contexts.
  ───────────────────────────────────────────────────────── */
  function waitForWebflow(cb) {
    if (window.Webflow && typeof window.Webflow.push === "function") {
      console.log(LOG, "Webflow runtime detected — using Webflow.push().");
      window.Webflow.push(cb);
    } else if (document.readyState === "loading") {
      console.log(LOG, "No Webflow runtime — waiting for DOMContentLoaded.");
      document.addEventListener("DOMContentLoaded", cb);
    } else {
      console.log(LOG, "No Webflow runtime — DOM already ready, running via setTimeout.");
      setTimeout(cb, 0);
    }
  }

  /* ─────────────────────────────────────────────────────────
     GLOBAL DEFAULTS  — edit freely
  ───────────────────────────────────────────────────────── */
  var DEFAULTS = {
    duration : 0.9,
    ease     : "power3.out",
    start    : "top 88%",
    once     : true,
  };

  /* ─────────────────────────────────────────────────────────
     FROM-STATE MAP
     The "hidden" start state GSAP tweens away from.
  ───────────────────────────────────────────────────────── */
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

  /* ─────────────────────────────────────────────────────────
     TO-STATE  — every animation lands here
  ───────────────────────────────────────────────────────── */
  var TO_BASE = {
    opacity  : 1,
    x        : 0,
    y        : 0,
    scale    : 1,
    scaleX   : 1,
    clipPath : "inset(0% 0% 0% 0%)",
  };

  /* ─────────────────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────────────────── */

  function getOptions(el) {
    return {
      animType : el.getAttribute("data-anim")          || "fade-up",
      delay    : parseFloat(el.getAttribute("data-anim-delay")    || 0),
      duration : parseFloat(el.getAttribute("data-anim-duration") || DEFAULTS.duration),
      ease     : el.getAttribute("data-anim-ease")     || DEFAULTS.ease,
    };
  }

  function makeST(triggerEl) {
    return {
      trigger : triggerEl,
      start   : DEFAULTS.start,
      once    : DEFAULTS.once,
      onEnter : function () {
        console.log(LOG, "ScrollTrigger fired for:", triggerEl);
      },
    };
  }

  /* ─────────────────────────────────────────────────────────
     ANIMATE SINGLE ELEMENT
  ───────────────────────────────────────────────────────── */
  function animateSingle(el) {
    var opts     = getOptions(el);
    var fromVars = FROM[opts.animType];

    if (!fromVars) {
      console.warn(LOG, "Unknown data-anim type:", opts.animType, "— falling back to fade-up.", el);
      fromVars = FROM["fade-up"];
    }

    console.log(LOG, "animateSingle →", opts.animType, "| delay:", opts.delay, "| el:", el);

    var toVars = Object.assign({}, TO_BASE, {
      duration      : opts.duration,
      ease          : opts.ease,
      delay         : opts.delay,
      scrollTrigger : makeST(el),
    });

    gsap.fromTo(el, fromVars, toVars);
  }

  /* ─────────────────────────────────────────────────────────
     ANIMATE STAGGER GROUP
  ───────────────────────────────────────────────────────── */
  function animateStaggerGroup(els, staggerVal) {
    var opts     = getOptions(els[0]);
    var fromVars = FROM[opts.animType];

    if (!fromVars) {
      console.warn(LOG, "Unknown data-anim type in stagger group:", opts.animType, "— falling back to fade-up.");
      fromVars = FROM["fade-up"];
    }

    /* Trigger on the nearest block ancestor so all siblings fire together */
    var trigger = els[0].closest("section, article, footer, header, [data-anim-trigger]")
                  || els[0].parentElement;

    console.log(
      LOG,
      "animateStaggerGroup →", els.length, "els |",
      opts.animType, "| stagger:", staggerVal, "| trigger:", trigger
    );

    var toVars = Object.assign({}, TO_BASE, {
      duration      : opts.duration,
      ease          : opts.ease,
      delay         : opts.delay,
      stagger       : parseFloat(staggerVal),
      scrollTrigger : makeST(trigger),
    });

    gsap.fromTo(els, fromVars, toVars);
  }

  /* ─────────────────────────────────────────────────────────
     BUILD STAGGER GROUPS
     Groups siblings sharing the same (parentElement, staggerValue).
  ───────────────────────────────────────────────────────── */
  function buildStaggerGroups() {
    var groups = new Map();

    document.querySelectorAll("[data-anim-stagger]").forEach(function (el) {
      var parent = el.parentElement;
      var sv     = el.getAttribute("data-anim-stagger");
      if (!groups.has(parent))      groups.set(parent, new Map());
      if (!groups.get(parent).has(sv)) groups.get(parent).set(sv, []);
      groups.get(parent).get(sv).push(el);
    });

    return groups;
  }

  /* ─────────────────────────────────────────────────────────
     MAIN INIT — called after GSAP + Webflow are both ready
  ───────────────────────────────────────────────────────── */
  function init() {
    console.log(LOG, "init() running.");

    /* Confirm GSAP is available */
    if (typeof gsap === "undefined") {
      console.error(LOG, "gsap is undefined inside init(). GSAP did not load.");
      revealAll();
      return;
    }
    console.log(LOG, "GSAP version:", gsap.version);

    /* Register ScrollTrigger */
    gsap.registerPlugin(ScrollTrigger);
    console.log(LOG, "ScrollTrigger registered.");

    /* Count all animated elements */
    var allAnimEls = document.querySelectorAll("[data-anim]");
    console.log(LOG, "Found", allAnimEls.length, "elements with [data-anim].");

    if (allAnimEls.length === 0) {
      console.warn(LOG, "No [data-anim] elements found. Did you add the attribute in Webflow?");
      return;
    }

    /* Build stagger groups and animate them */
    var staggerGroups = buildStaggerGroups();
    var processed     = new Set();
    var staggerCount  = 0;

    staggerGroups.forEach(function (staggerMap) {
      staggerMap.forEach(function (els, sv) {
        animateStaggerGroup(els, sv);
        els.forEach(function (el) { processed.add(el); });
        staggerCount += els.length;
      });
    });

    console.log(LOG, "Stagger groups processed:", staggerCount, "elements.");

    /* Animate remaining single elements */
    var singleCount = 0;
    allAnimEls.forEach(function (el) {
      if (!processed.has(el)) {
        animateSingle(el);
        singleCount++;
      }
    });

    console.log(LOG, "Single elements processed:", singleCount);
    console.log(LOG, "✓ Initialisation complete. Total animated:", staggerCount + singleCount);
  }

  /* ─────────────────────────────────────────────────────────
     ENTRY POINT
     1. Load ScrollTrigger
     2. Wait for Webflow to finish booting
     3. Run init()
  ───────────────────────────────────────────────────────── */
  loadScrollTrigger(function () {
    waitForWebflow(function () {
      console.log(LOG, "Webflow ready callback fired.");
      init();
    });
  });

  console.log(LOG, "Script parsed — waiting for ScrollTrigger + Webflow...");

})();
