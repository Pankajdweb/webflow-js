
 (function () {
  function initAccordion() {
    const groups = document.querySelectorAll("[accordian-list]");

    groups.forEach((group, groupIndex) => {
      const items = group.querySelectorAll("[accordian]");

      items.forEach((item, itemIndex) => {
        const head = item.querySelector("[accordian-head]");
        const body = item.querySelector("[accordian-body]");
        if (!head || !body) return;

        /* -----------------------------
           Generate unique IDs
        ----------------------------- */
        const headId = `faq-head-${groupIndex}-${itemIndex}`;
        const bodyId = `faq-panel-${groupIndex}-${itemIndex}`;
        head.id = headId;
        body.id = bodyId;

        /* -----------------------------
           ARIA setup
        ----------------------------- */
        head.setAttribute("aria-controls", bodyId);
        head.setAttribute("aria-expanded", "false");
        body.setAttribute("role", "region");
        body.setAttribute("aria-labelledby", headId);

        /* -----------------------------
           Initial styles
        ----------------------------- */
        body.style.overflow = "hidden";
        body.style.transition = "height 0.3s ease";
        body.style.height = "0px";

        // Default: disable focus
        body.setAttribute("inert", "");

        // If pre-opened
        if (head.classList.contains("open")) {
          body.style.height = body.scrollHeight + "px";
          head.setAttribute("aria-expanded", "true");
          body.removeAttribute("inert"); // allow focus
        }

        /* -----------------------------
           Toggle logic
        ----------------------------- */
        const toggleAccordion = () => {
          const isOpen = head.getAttribute("aria-expanded") === "true";

          // Close all in this group
          items.forEach((i) => {
            const h = i.querySelector("[accordian-head]");
            const b = i.querySelector("[accordian-body]");

            h.classList.remove("open");
            h.setAttribute("aria-expanded", "false");

            b.style.height = "0px";
            b.setAttribute("inert", ""); // block focus
          });

          // Open current if it was closed
          if (!isOpen) {
            head.classList.add("open");
            head.setAttribute("aria-expanded", "true");

            body.style.height = body.scrollHeight + "px";
            body.removeAttribute("inert"); // allow focus
          }
        };

        /* -----------------------------
           Events
        ----------------------------- */
        head.addEventListener("click", toggleAccordion);

        head.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleAccordion();
          }
        });
      });
    });
  }

  /* Safe init */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAccordion);
  } else {
    initAccordion();
  }
})();

$(document).ready(function () {
  $("[accordian-head]").first().trigger("click");
});

