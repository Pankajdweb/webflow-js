// Script to set today's date in elements with the attribute "set-today-date"
document.addEventListener("DOMContentLoaded", () => {
  const todayDate = new Date();
  const todayDateEls = document.querySelectorAll("[set-today-date]");

  if (!todayDateEls.length) {
    console.warn("No elements found with [set-today-date]");
    return;
  }

  todayDateEls.forEach(el => {
    const type = el.getAttribute("set-today-date");

    let options;

    if (type === "month") {
      options = { month: "long" };
    } else {
      const validMonthFormats = ["long", "short", "narrow"];
      const monthFormat = validMonthFormats.includes(type) ? type : "long";

      options = {
        weekday: "long",
        month: monthFormat,
        day: "numeric"
      };
    }

    const formatted = todayDate
      .toLocaleDateString("en-US", options)
      .toUpperCase();

    el.textContent = formatted;
  });
});

// end the script for elements with the attribute "set-today-date" to prevent it from running on other elements