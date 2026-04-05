document.addEventListener("DOMContentLoaded", function () {

  const accGroups = document.querySelectorAll("[acc-group]");

  accGroups.forEach((group) => {
    const heads = group.querySelectorAll("[acc-head]");

    heads.forEach((head) => {
      const content = head.parentElement.querySelector("[acc-content]");
      if (!content) return;

      content.style.height = "0px";
      content.style.overflow = "hidden";
      content.style.transition = "height 0.3s ease";

      head.addEventListener("click", () => {

        const isAlreadyOpen = head.classList.contains("open");

        // Close all
        heads.forEach((h) => {
          const c = h.parentElement.querySelector("[acc-content]");
          h.classList.remove("open");
          if (c) c.style.height = "0px";
        });

        // If it was NOT already open → open it
        if (!isAlreadyOpen) {
          head.classList.add("open");
          content.style.height = content.scrollHeight + "px";
        }

      });
    });

  });

});
