const STAGGER_MS = 150;
 
  function reveal(el, delay) {
    el.style.transitionDelay = delay + 'ms';
    el.setAttribute('data-revealed', '');
  }
 
  // Cards — each observed individually, stagger by column index within its row
  document.querySelectorAll('[data-cards-group]').forEach(group => {
    const cards = Array.from(group.querySelectorAll('[data-animate]'));
    const done  = new Set();
 
    function colIndex(card) {
      const top = card.offsetTop;
      const row = cards.filter(c => c.offsetTop === top);
      return row.indexOf(card);
    }
 
    const obs = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting || done.has(target)) return;
        done.add(target);
        obs.unobserve(target);
        reveal(target, colIndex(target) * STAGGER_MS);
      });
    }, { threshold: 0.45 });
 
    cards.forEach(c => obs.observe(c));
  });
 
  // Everything else — siblings in same parent stagger in DOM order
  const cardEls = new Set(document.querySelectorAll('[data-cards-group] [data-animate]'));
 
  const parents = new Set(
    [...document.querySelectorAll('[data-animate]')]
      .filter(el => !cardEls.has(el))
      .map(el => el.parentElement)
  );
 
  parents.forEach(parent => {
    const kids = [...parent.querySelectorAll(':scope > [data-animate]')]
      .filter(el => !cardEls.has(el));
    if (!kids.length) return;
 
    const obs = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      kids.forEach((el, i) => reveal(el, i * STAGGER_MS));
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
 
    obs.observe(parent);
  });
