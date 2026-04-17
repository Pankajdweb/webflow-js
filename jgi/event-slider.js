const slides     = [...document.querySelectorAll('[book-slide]')];
  const btnUp      = document.querySelector('[data-btn="up"]');
  const btnDown    = document.querySelector('[data-btn="down"]');
  const barMeta    = document.querySelector('[data-bar-meta]');
  const barEyebrow = document.querySelector('[data-bar-eyebrow]');
  const barTitle   = document.querySelector('[data-bar-title]');
  const barLink    = document.querySelector('[data-bar-link]');
 
  // Dynamically assign data-index based on DOM order — no manual markup needed
  slides.forEach((s, i) => s.setAttribute('data-index', i));
 
  let current = 2;
//let current = total - 1;
  let isAnim  = false;
  const total = slides.length;
 
  function assignStates() {
    slides.forEach((s, i) => {
      const diff = i - current;
      let state;
      if      (diff === 0)  state = 'active';
      else if (diff === -1) state = 'behind-1';
      else if (diff === -2) state = 'behind-2';
      else if (diff === -3) state = 'behind-3';
      else if (diff === 1)  state = 'next';
      else                  state = 'hidden';
      s.setAttribute('data-state', state);
    });
  }
 
  function updateBar(i) {
    const slide = slides[i];
    const num   = String(i + 1).padStart(2, '0');
    barMeta.classList.remove('anim');
    void barMeta.offsetWidth;
    // barEyebrow.textContent = `${num} — ${slide.getAttribute('data-header-line') || ''}`;
    barEyebrow.textContent = slide.getAttribute('data-header-line') || '';
    barTitle.textContent   = slide.getAttribute('data-title') || '';
    // barLink.textContent = slide.getAttribute('data-link') || '';
    // barLink.href        = slide.getAttribute('data-link') || '#';
 
    const vieweventLink = slide.getAttribute('data-link');
    barLink.href = `/main-event/${vieweventLink}`;
    barMeta.classList.add('anim');
  }
 
  function updateArrows() {
    btnUp.classList.toggle('disabled', current === 0);
    btnDown.classList.toggle('disabled', current === total - 1);
    btnUp.disabled   = current === 0;
    btnDown.disabled = current === total - 1;
  }



 
  function goTo(index) {
    if (isAnim || index === current || index < 0 || index >= total) return;
    isAnim  = true;
    current = index;
    assignStates();
    updateBar(current);
    updateArrows();
 
    // Clear lock as soon as the active slide finishes transitioning
    const activeSlide = slides[current];
    const onEnd = () => {
      isAnim = false;
      activeSlide.removeEventListener('transitionend', onEnd);
    };
    activeSlide.addEventListener('transitionend', onEnd);
 
    // Fallback in case transitionend doesn't fire
    setTimeout(() => {
      isAnim = false;
      activeSlide.removeEventListener('transitionend', onEnd);
    }, 500);
  }
 
  slides.forEach(s => {
    s.addEventListener('click', () => {
      const i = +s.getAttribute('data-index');
      if (i !== current) goTo(i);
    });
  });
 
  btnUp.addEventListener('click',   () => goTo(current - 1));
  btnDown.addEventListener('click', () => goTo(current + 1));
 
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp')   goTo(current - 1);
    if (e.key === 'ArrowDown') goTo(current + 1);
  });
 
  let ty = 0;
  window.addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend',   e => {
    const d = ty - e.changedTouches[0].clientY;
    if (d >  50) goTo(current + 1);
    if (d < -50) goTo(current - 1);
  });
 
  assignStates();
  updateBar(current);
  updateArrows();
