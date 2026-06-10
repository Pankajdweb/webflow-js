document.addEventListener("DOMContentLoaded", function () {
  const twModalTrigger = document.querySelectorAll("[tw-modal-trigger]");
  const twModals = document.querySelectorAll("[tw-modal-content]");

  twModals.forEach((popup) => {
    popup.style.opacity = "0";
    popup.style.display = "none";

    popup.querySelectorAll("[tw_modal-animation]").forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateX(100%)";
    });
  });

  function closePopup(popup) {
    if (!popup || popup.style.opacity === "0") return;

    popup.style.transition = "opacity 0.3s ease";
    popup.style.opacity = "0";

    popup.querySelectorAll("[tw_modal-animation]").forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateX(100%)";
    });

    popup.addEventListener("transitionend", function handler() {
      popup.style.display = "none";
      document.body.style.overflow = "auto";
      popup.removeEventListener("transitionend", handler);
    });
  }

  twModalTrigger.forEach((btn) => {
    btn.addEventListener("click", function () {
      const popupAttr = this.getAttribute("tw-modal-trigger");
      if (!popupAttr) return;

      const popup = document.querySelector(
        `[tw-modal-content="${popupAttr}"]`
      );

      if (popup) {
        popup.style.display = "block";

        popup.getBoundingClientRect();

        popup.style.transition = "opacity 0.5s ease";
        popup.style.opacity = "1";
        document.body.style.overflow = "hidden";

        // Animate inner elements after 0.3s
        setTimeout(() => {
          popup.querySelectorAll("[tw_modal-animation]").forEach((el) => {
            el.style.transition =
              "opacity 0.5s ease, transform 0.5s ease";
            el.style.opacity = "1";
            el.style.transform = "translateX(0)";
          });
        }, 300);
      }
    });
  });

  document.querySelectorAll("[tw-modal-close]").forEach((closeBtn) => {
    closeBtn.addEventListener("click", function () {
      closePopup(this.closest("[tw-modal-content]"));
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;

    const openPopup = [...twModals].find(
      (p) => p.style.opacity === "1"
    );

    if (openPopup) closePopup(openPopup);
  });
});
