
/* ══════════════════════════════════════════════
   GLOBAL ATTRIBUTE-DRIVEN ANIMATION SYSTEM
   ══════════════════════════════════════════════

   USAGE — add to any HTML element:

   data-anim="fade-up"        → fade in + rise up
   data-anim="fade-down"      → fade in + drop down
   data-anim="fade-left"      → fade in + slide from left
   data-anim="fade-right"     → fade in + slide from right
   data-anim="fade-scale"     → fade in + scale up from 0.88
   data-anim="clip-up"        → clip reveal from bottom (display text)
   data-anim="line"           → horizontal line width expand

   OPTIONAL modifiers (add to same element):
   data-anim-delay="0.2"      → extra delay in seconds
   data-anim-duration="1.2"   → override duration
   data-anim-ease="power3.out"→ override GSAP ease

   STAGGER GROUPS — siblings with same stagger value animate as a group:
   data-anim-stagger="0.1"    → stagger offset applied to siblings
                                 (all siblings sharing this attr are grouped)
   ══════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

const DEFAULTS = {
  duration:  0.9,
  ease:      "power3.out",
  threshold: 0.15,   // fraction of element visible before trigger
  once:      true,
};

/* ── from-state map ── */
const FROM = {
  "fade-up":    { opacity: 0, y: 40 },
  "fade-down":  { opacity: 0, y: -40 },
  "fade-left":  { opacity: 0, x: -48 },
  "fade-right": { opacity: 0, x: 48 },
  "fade-scale": { opacity: 0, scale: 0.88, transformOrigin: "center bottom" },
  "clip-up":    { clipPath: "inset(100% 0 0 0)", opacity: 1 },
  "line":       { scaleX: 0, transformOrigin: "left center" },
};

/* ── make all animated elements invisible before JS runs ── */
document.querySelectorAll("[data-anim]").forEach(el => {
  el.style.visibility = "hidden";
});

/* ──────────────────────────────────────────────
   Group siblings that share [data-anim-stagger]
   so we can tween them together with stagger.
   Returns Map<ParentEl, Map<staggerValue, el[]>>
────────────────────────────────────────────── */
function buildStaggerGroups() {
  const staggerEls = document.querySelectorAll("[data-anim-stagger]");
  // group by (parent, staggerValue)
  const groups = new Map(); // key: parent el → value: Map(stagger → [els])

  staggerEls.forEach(el => {
    const parent = el.parentElement;
    const sv = el.getAttribute("data-anim-stagger");

    if (!groups.has(parent)) groups.set(parent, new Map());
    const parentMap = groups.get(parent);
    if (!parentMap.has(sv)) parentMap.set(sv, []);
    parentMap.get(sv).push(el);
  });

  return groups;
}

/* ──────────────────────────────────────────────
   Create a single ScrollTrigger animation for
   a group of staggered siblings.
────────────────────────────────────────────── */
function animateStaggerGroup(els, staggerVal) {
  const animType  = els[0].getAttribute("data-anim") || "fade-up";
  const baseDelay = parseFloat(els[0].getAttribute("data-anim-delay") || 0);
  const duration  = parseFloat(els[0].getAttribute("data-anim-duration") || DEFAULTS.duration);
  const ease      = els[0].getAttribute("data-anim-ease") || DEFAULTS.ease;
  const fromVars  = FROM[animType] || FROM["fade-up"];

  // reveal them
  els.forEach(el => { el.style.visibility = "visible"; });

  gsap.fromTo(els, fromVars, {
    opacity:  1,
    x:        0,
    y:        0,
    scale:    1,
    scaleX:   1,
    clipPath: animType === "clip-up" ? "inset(0% 0 0 0)" : undefined,
    duration,
    ease,
    delay:    baseDelay,
    stagger:  parseFloat(staggerVal),
    scrollTrigger: {
      trigger:  els[0].closest("section, div, footer") || els[0].parentElement,
      start:    `top ${Math.round((1 - DEFAULTS.threshold) * 100)}%`,
      once:     DEFAULTS.once,
    },
  });
}

/* ──────────────────────────────────────────────
   Create a ScrollTrigger animation for
   a single (non-stagger) element.
────────────────────────────────────────────── */
function animateSingle(el) {
  const animType = el.getAttribute("data-anim");
  const delay    = parseFloat(el.getAttribute("data-anim-delay") || 0);
  const duration = parseFloat(el.getAttribute("data-anim-duration") || DEFAULTS.duration);
  const ease     = el.getAttribute("data-anim-ease") || DEFAULTS.ease;
  const fromVars = FROM[animType] || FROM["fade-up"];

  el.style.visibility = "visible";

  gsap.fromTo(el, fromVars, {
    opacity:  1,
    x:        0,
    y:        0,
    scale:    1,
    scaleX:   1,
    clipPath: animType === "clip-up" ? "inset(0% 0 0 0)" : undefined,
    duration,
    ease,
    delay,
    scrollTrigger: {
      trigger: el,
      start:   `top ${Math.round((1 - DEFAULTS.threshold) * 100)}%`,
      once:    DEFAULTS.once,
    },
  });
}

/* ──────────────────────────────────────────────
   Bootstrap — run after DOM ready
────────────────────────────────────────────── */
(function init() {
  const staggerGroups = buildStaggerGroups();
  const processedEls  = new Set();

  // 1. Handle stagger groups
  staggerGroups.forEach((staggerMap) => {
    staggerMap.forEach((els, staggerVal) => {
      animateStaggerGroup(els, staggerVal);
      els.forEach(el => processedEls.add(el));
    });
  });

  // 2. Handle all remaining [data-anim] elements
  document.querySelectorAll("[data-anim]").forEach(el => {
    if (!processedEls.has(el)) animateSingle(el);
  });
})();

/* ──────────────────────────────────────────────
   NAV scroll state
────────────────────────────────────────────── */
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 50);
}, { passive: true });

/* ──────────────────────────────────────────────
   POG tab switcher
────────────────────────────────────────────── */
document.querySelectorAll(".pog-card").forEach(card => {
  card.addEventListener("click", () => {
    const key = card.dataset.pog;
    document.querySelectorAll(".pog-card").forEach(c => c.classList.remove("is-active"));
    document.querySelectorAll(".pog-panel").forEach(p => p.classList.remove("is-active"));
    card.classList.add("is-active");
    const panel = document.getElementById("panel-" + key);
    if (panel) {
      panel.classList.add("is-active");
      gsap.fromTo(panel, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
    }
  });
});
