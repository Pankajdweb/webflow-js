document.addEventListener("DOMContentLoaded", () => {
  const twTabsWrappers = document.querySelectorAll('[tw-tabs="wrapper"]');

  twTabsWrappers.forEach((twTabsWrapper, wrapperIndex) => {
    const twTabsMenu = twTabsWrapper.querySelector('[tw-tabs="menu"]');
    const twTabsTriggers = twTabsWrapper.querySelectorAll("[tw-tabs-trigger]");
    const twTabsPanes = twTabsWrapper.querySelectorAll("[tw-tabs-pane]");

    if (twTabsMenu) {
      twTabsMenu.setAttribute("role", "tablist");
      twTabsMenu.setAttribute("aria-label", "Tabs Navigation");
    }

    twTabsTriggers.forEach((twTabsTrigger, triggerIndex) => {
      const twTabsValue = twTabsTrigger.getAttribute("tw-tabs-trigger");
      const twTabsTriggerId = `tw-tab-${wrapperIndex}-${triggerIndex}`;
      const twTabsPaneId = `tw-pane-${wrapperIndex}-${triggerIndex}`;

      twTabsTrigger.setAttribute("role", "tab");
      twTabsTrigger.setAttribute("id", twTabsTriggerId);
      twTabsTrigger.setAttribute("aria-controls", twTabsPaneId);
      twTabsTrigger.setAttribute("aria-selected", "false");

      const twTabsPane = twTabsWrapper.querySelector(
        `[tw-tabs-pane="${twTabsValue}"]`,
      );
      if (twTabsPane) {
        twTabsPane.setAttribute("role", "tabpanel");
        twTabsPane.setAttribute("id", twTabsPaneId);
        twTabsPane.setAttribute("aria-labelledby", twTabsTriggerId);
        twTabsPane.hidden = true;
      }
    });

    function twTabsActivateTab(targetValue) {
      twTabsTriggers.forEach((twTabsTrigger) => {
        const isActive =
          twTabsTrigger.getAttribute("tw-tabs-trigger") === targetValue;
        twTabsTrigger.setAttribute(
          "aria-selected",
          isActive ? "true" : "false",
        );
        twTabsTrigger.classList.toggle("is-active", isActive);
      });

      twTabsPanes.forEach((twTabsPane) => {
        const isActive =
          twTabsPane.getAttribute("tw-tabs-pane") === targetValue;
        twTabsPane.hidden = !isActive;
        twTabsPane.classList.toggle("is-active", isActive);
      });
    }

    twTabsTriggers.forEach((twTabsTrigger) => {
      twTabsTrigger.addEventListener("click", () => {
        const twTabsTargetValue = twTabsTrigger.getAttribute("tw-tabs-trigger");
        twTabsActivateTab(twTabsTargetValue);
        twTabsTrigger.focus();
      });

      twTabsTrigger.addEventListener("keydown", (event) => {
        const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
        if (!keys.includes(event.key)) return;
        event.preventDefault();

        const twTabsCurrentIndex = [...twTabsTriggers].indexOf(twTabsTrigger);
        let twTabsNextIndex = twTabsCurrentIndex;

        if (event.key === "ArrowRight")
          twTabsNextIndex = (twTabsCurrentIndex + 1) % twTabsTriggers.length;
        if (event.key === "ArrowLeft")
          twTabsNextIndex =
            (twTabsCurrentIndex - 1 + twTabsTriggers.length) %
            twTabsTriggers.length;
        if (event.key === "Home") twTabsNextIndex = 0;
        if (event.key === "End") twTabsNextIndex = twTabsTriggers.length - 1;

        const twTabsNextTrigger = twTabsTriggers[twTabsNextIndex];
        const twTabsNextValue =
          twTabsNextTrigger.getAttribute("tw-tabs-trigger");
        twTabsActivateTab(twTabsNextValue);
        twTabsNextTrigger.focus();
      });
    });

    if (twTabsTriggers.length) {
      const twTabsDefaultValue =
        twTabsTriggers[0].getAttribute("tw-tabs-trigger");
      twTabsActivateTab(twTabsDefaultValue);
    }
  });
});
