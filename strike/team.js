function teamAccordian() {
  const groups = document.querySelectorAll("[team-accordian-list]");

  groups.forEach((group, groupIndex) => {
    const items = group.querySelectorAll("[team-accordian]");

    items.forEach((item, itemIndex) => {
      const head = item.querySelector("[team-accordian-head]");
      const body = item.querySelector("[team-accordian-body]");

      if (!head || !body) return;

      const headId = `faq-head-${groupIndex}-${itemIndex}`;
      const bodyId = `faq-panel-${groupIndex}-${itemIndex}`;

      head.id = headId;
      body.id = bodyId;

      head.setAttribute("aria-controls", bodyId);
      head.setAttribute("aria-expanded", "false");

      body.setAttribute("role", "region");
      body.setAttribute("aria-labelledby", headId);

      body.style.overflow = "hidden";
      body.style.transition = "height 0.3s ease";
      body.style.height = "0px";
      head.textContent = "View Bio";

      const toggleAccordion = () => {
        const isOpen = head.getAttribute("aria-expanded") === "true";

        items.forEach((i) => {
          const h = i.querySelector("[team-accordian-head]");
          const b = i.querySelector("[team-accordian-body]");

          h.classList.remove("open");
          h.setAttribute("aria-expanded", "false");
          b.style.height = "0px";
          h.textContent = "View Bio";
        });

        if (!isOpen) {
          head.classList.add("open");
          head.setAttribute("aria-expanded", "true");
          body.style.height = body.scrollHeight + "px";
          head.textContent = "Hide Bio";
        }
      };

      head.addEventListener("click", toggleAccordion);
    });
  });
}


  teamAccordian()
