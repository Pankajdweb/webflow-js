
  document.addEventListener('DOMContentLoaded', () => {
    const tabGroups = document.querySelectorAll('[tw-tabs]');

    tabGroups.forEach(group => {
      const buttons = group.querySelectorAll('[tw-tab-trigger]');
      const panes = group.querySelectorAll('[tw-tab-pane]');

      function activateTab(tabName) {
        buttons.forEach(btn => {
          const isActive = btn.getAttribute('tw-tab-trigger') === tabName;
          btn.classList.toggle('tab-active', isActive);
        });

        panes.forEach(pane => {
          const isActive = pane.getAttribute('tw-tab-pane') === tabName;
          pane.classList.toggle('tab-active', isActive);
        });
      }

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          activateTab(btn.getAttribute('tw-tab-trigger'));
        });
      });

      if (buttons.length) {
        activateTab(buttons[0].getAttribute('tw-tab-trigger'));
      }
    });
  });
