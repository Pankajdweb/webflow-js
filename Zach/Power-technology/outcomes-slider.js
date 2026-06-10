const outcomeSliderViewport = document.querySelector("[outcome-slider]");
const outcomeSliderTrack = document.querySelector("[outcome-content]");
const outcomeNextButton = document.querySelector("[outcome-next]");
const outcomePreviousButton = document.querySelector("[outcome-prev]");

let currentOutcomeTranslateX = 0;
const outcomeSlideStep = 190;

const outcomeViewportWidth = outcomeSliderViewport.offsetWidth;
const outcomeTrackWidth = outcomeSliderTrack.scrollWidth;
const outcomeMaxTranslate = outcomeTrackWidth - outcomeViewportWidth;

function updateOutcomeSliderButtons() {
  // Beginning of slider
  outcomePreviousButton.classList.toggle(
    "disabled",
    currentOutcomeTranslateX === 0
  );

  // End of slider
  outcomeNextButton.classList.toggle(
    "disabled",
    Math.abs(currentOutcomeTranslateX) >= outcomeMaxTranslate
  );
}

function updateOutcomeSliderPosition() {
  outcomeSliderTrack.style.transform = `translateX(${currentOutcomeTranslateX}px)`;
  updateOutcomeSliderButtons();
}

outcomeNextButton.addEventListener("click", () => {
  currentOutcomeTranslateX -= outcomeSlideStep;

  if (Math.abs(currentOutcomeTranslateX) > outcomeMaxTranslate) {
    currentOutcomeTranslateX = -outcomeMaxTranslate;
  }

  updateOutcomeSliderPosition();
});

outcomePreviousButton.addEventListener("click", () => {
  currentOutcomeTranslateX += outcomeSlideStep;

  if (currentOutcomeTranslateX > 0) {
    currentOutcomeTranslateX = 0;
  }

  updateOutcomeSliderPosition();
});

// Set initial button states
updateOutcomeSliderButtons();
