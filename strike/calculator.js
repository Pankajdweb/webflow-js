document.querySelectorAll("[step-text]").forEach(el => {
  el.textContent = el.textContent
    .replace(/\s*R&D Tax Credits\s*/gi, " ")
    .trim();
});


// Search Functionlllity
  const searchInput = document.querySelector("[search-input]");
  const searchableTexts = document.querySelectorAll("[search-text]");

  let debounceTimeoutId;

  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimeoutId);

    debounceTimeoutId = setTimeout(() => {
      const searchQuery = searchInput.value.toLowerCase().trim();

      searchableTexts.forEach((textElement) => {
        const textContent = textElement.textContent.toLowerCase();
        const parentStepItem = textElement.closest("[step-item]");

        const isMatch = textContent.includes(searchQuery);

        if (parentStepItem) {
          parentStepItem.style.display = isMatch ? "block" : "none";
        }
      });
    }, 500);
  });

// Step 

  
function addClass(element, className) {
  element.classList.add(className);
}

function removeClass(element, className) {
  element.classList.remove(className);
}

const secoundStepbtn = document.querySelector("[go-to-step-2]");
const backtoStep1 = document.querySelector("[go-back-step-1]");
const backtoStep2 = document.querySelector("[go-back-step-2]");
const thirdStepbtn = document.querySelector("[go-to-step-3]");
const fourthStepbtn = document.querySelector("[go-to-step-4]");
const calculatorForm = document.querySelector("[calculator-form]");

secoundStepbtn.addEventListener("click", function () {
  addClass(calculatorForm, "step-2-show");
  removeClass(calculatorForm, "step-1-show");
});

backtoStep1.addEventListener("click", function () {
  addClass(calculatorForm, "step-1-show");
  removeClass(calculatorForm, "step-2-show");
});

thirdStepbtn.addEventListener("click", function () {
  addClass(calculatorForm, "step-3-show");
  removeClass(calculatorForm, "step-2-show");
});

backtoStep2.addEventListener("click", function () {
  addClass(calculatorForm, "step-2-show");
  removeClass(calculatorForm, "step-3-show");
});

fourthStepbtn.addEventListener("click", function () {
  addClass(calculatorForm, "step-4-show");
  removeClass(calculatorForm, "step-3-show");
});
