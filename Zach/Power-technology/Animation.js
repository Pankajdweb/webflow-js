
gsap.registerPlugin(ScrollTrigger);

const DEBUG = true;

function log(...args) {
  if (DEBUG) console.log("[ANIM]", ...args);
}

const DEFAULTS = {
  duration: 0.9,
  ease: "power3.out",
  threshold: 0.15,
  once: true
};

const FROM = {
  "fade-up":    { opacity: 0, y: 40 },
  "fade-down":  { opacity: 0, y: -40 },
  "fade-left":  { opacity: 0, x: -48 },
  "fade-right": { opacity: 0, x: 48 },
  "fade-scale": { opacity: 0, scale: 0.88 },
  "clip-up":    { clipPath: "inset(100% 0 0 0)" },
  "line":       { scaleX: 0, transformOrigin: "left center" }
};

log("Initializing animation system...");

/* Hide animated elements */
document.querySelectorAll("[data-anim]").forEach(el => {
  el.style.visibility = "hidden";
});

log(
  "Found elements:",
  document.querySelectorAll("[data-anim]").length
);

/* Build stagger groups */
function buildStaggerGroups() {
  const groups = new Map();

  document.querySelectorAll("[data-anim-stagger]").forEach(el => {
    const parent = el.parentElement;
    const stagger = el.dataset.animStagger;

    if (!groups.has(parent)) {
      groups.set(parent, new Map());
    }

    const parentMap = groups.get(parent);

    if (!parentMap.has(stagger)) {
      parentMap.set(stagger, []);
    }

    parentMap.get(stagger).push(el);
  });

  log("Stagger groups built:", groups);

  return groups;
}

/* Animate stagger group */
function animateGroup(elements, stagger) {
  const first = elements[0];

  const type = first.dataset.anim || "fade-up";
  const delay = parseFloat(first.dataset.animDelay || 0);
  const duration = parseFloat(
    first.dataset.animDuration || DEFAULTS.duration
  );
  const ease = first.dataset.animEase || DEFAULTS.ease;

  log(
    "Creating stagger animation",
    {
      type,
      stagger,
      count: elements.length,
      duration,
      delay
    }
  );

  elements.forEach(el => {
    el.style.visibility = "visible";
  });

  gsap.fromTo(
    elements,
    FROM[type] || FROM["fade-up"],
    {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      scaleX: 1,
      clipPath:
        type === "clip-up"
          ? "inset(0% 0 0 0)"
          : undefined,

      duration,
      ease,
      delay,
      stagger: parseFloat(stagger),

      onComplete: () => {
        log("Group animation complete", type);
      },

      scrollTrigger: {
        trigger: first.parentElement,
        start: `top ${Math.round((1 - DEFAULTS.threshold) * 100)}%`,
        once: DEFAULTS.once,

        onEnter: () => {
          log(
            "ScrollTrigger ENTER (group)",
            type,
            first.parentElement
          );
        }
      }
    }
  );
}

/* Animate single element */
function animateSingle(el) {
  const type = el.dataset.anim || "fade-up";
  const delay = parseFloat(el.dataset.animDelay || 0);
  const duration = parseFloat(
    el.dataset.animDuration || DEFAULTS.duration
  );
  const ease = el.dataset.animEase || DEFAULTS.ease;

  log(
    "Creating animation",
    {
      element: el,
      type,
      duration,
      delay
    }
  );

  el.style.visibility = "visible";

  gsap.fromTo(
    el,
    FROM[type] || FROM["fade-up"],
    {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      scaleX: 1,
      clipPath:
        type === "clip-up"
          ? "inset(0% 0 0 0)"
          : undefined,

      duration,
      ease,
      delay,

      onComplete: () => {
        log("Animation complete", el);
      },

      scrollTrigger: {
        trigger: el,
        start: `top ${Math.round((1 - DEFAULTS.threshold) * 100)}%`,
        once: DEFAULTS.once,

        onEnter: () => {
          log(
            "ScrollTrigger ENTER",
            type,
            el
          );
        }
      }
    }
  );
}

/* Init */
window.addEventListener("DOMContentLoaded", () => {
  log("DOM Ready");

  const processed = new Set();

  buildStaggerGroups().forEach(groupMap => {
    groupMap.forEach((elements, stagger) => {
      animateGroup(elements, stagger);
      elements.forEach(el => processed.add(el));
    });
  });

  document.querySelectorAll("[data-anim]").forEach(el => {
    if (!processed.has(el)) {
      animateSingle(el);
    }
  });

  log(
    "Initialization complete",
    {
      triggers: ScrollTrigger.getAll().length
    }
  );

  // List all triggers
  ScrollTrigger.getAll().forEach((st, index) => {
    log(`Trigger #${index + 1}`, st);
  });
});
