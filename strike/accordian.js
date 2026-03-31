
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
           Initial styles (height animation)
        ----------------------------- */
        body.style.overflow = "hidden";
        body.style.transition = "height 0.3s ease";

        // Close all by default
        body.style.height = "0px";

        // Open if `.open` class exists
        if (head.classList.contains("open")) {
          body.style.height = body.scrollHeight + "px";
          head.setAttribute("aria-expanded", "true");
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
          });

          // Open current if it was closed
          if (!isOpen) {
            head.classList.add("open");
            head.setAttribute("aria-expanded", "true");
            body.style.height = body.scrollHeight + "px";
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
