const outcomeSliderViewport = document.querySelector("[outcome-slider]");
const outcomeSliderTrack = document.querySelector("[outcome-content]");
const outcomeNextButton = document.querySelector("[outcome-next]");
const outcomePreviousButton = document.querySelector("[outcome-prev]");

let currentOutcomeTranslateX = 0;
const outcomeSlideStep = 190;

// Get dimensions on page load
const outcomeViewportWidth = outcomeSliderViewport.offsetWidth;
const outcomeTrackWidth = outcomeSliderTrack.scrollWidth;

// Maximum distance the track can move
const outcomeMaxTranslate = outcomeTrackWidth - outcomeViewportWidth;

function updateOutcomeSliderPosition() {
  outcomeSliderTrack.style.transform = `translateX(${currentOutcomeTranslateX}px)`;
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
