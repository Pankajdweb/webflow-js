// Script to set today's date in elements with the attribute "set-today-date"

const todayDate = new Date();

const todayDateEls = document.querySelectorAll("[set-today-date]");

// Stop script if no elements found
if (!todayDateEls.length) return;

todayDateEls.forEach(el => {
  const type = el.getAttribute("set-today-date");

  let options;

  if (type === "month") {
    options = { month: "long" };
  } else {
    options = {
      weekday: "long",
      month: type || "long",
      day: "numeric"
    };
  }

  const formatted = todayDate
    .toLocaleDateString("en-US", options)
    .toUpperCase();

  el.textContent = formatted;
});

// end the script for elements with the attribute "set-today-date" to prevent it from running on other elements