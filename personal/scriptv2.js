/* =====================================================
   PORTFOLIO SCRIPTS — WEBFLOW-READY
   -----------------------------------------------------
   HOW THIS FILE IS ORGANIZED
   - One init function per section / feature (initFaq,
     initFlowTabs, …). Each one finds its own elements and
     quietly does nothing if they are not on the page.
   - The SECTIONS list at the very bottom runs them in order.
     Set a section to false there to switch its script off.

   RULES
   - Elements are targeted with [data-*] attributes ONLY,
     never IDs or classes -> rename classes freely in the
     Webflow Designer without breaking any behavior.
   - State is applied via is-* classes (.is-open .is-active .is-lit .is-visible)
     but never used to FIND elements.
   - Every effect respects prefers-reduced-motion and is
     throttled with requestAnimationFrame.

   WEBFLOW: paste this whole block into
   Site Settings -> Custom Code -> Footer (before </body>).
   ===================================================== */
(function(){

  /* =====================================================
     SHARED — helpers + environment flags used by many sections
     ===================================================== */
  // shorthand for querySelector / querySelectorAll
  function getEl(sel, root){
    return (root || document).querySelector(sel);
  }
  function getAll(sel, root){
    return (root || document).querySelectorAll(sel);
  }

  const isTouch = window.matchMedia('(pointer:coarse)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* =====================================================
     CUSTOM CURSOR — dot follows the mouse, ring trails behind
     [data-el="cursor-dot"] [data-el="cursor-ring"]
     ===================================================== */
  function initCursor(){
    const dot = getEl('[data-el="cursor-dot"]');
    const ring = getEl('[data-el="cursor-ring"]');
    if(!dot || !ring) return;
    if(isTouch){
      dot.style.display='none'; ring.style.display='none';
      return;
    }
    let rx=0, ry=0, mx=0, my=0, running=false;
    // the ring eases toward the mouse; the loop sleeps once it has caught up
    // and wakes on the next mousemove (no idle 60fps work)
    function loop(){
      rx += (mx-rx)*0.15; ry += (my-ry)*0.15;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      if(Math.abs(mx-rx) < 0.1 && Math.abs(my-ry) < 0.1){ running = false; return; }
      requestAnimationFrame(loop);
    }
    window.addEventListener('mousemove', e=>{
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      if(!running){ running = true; requestAnimationFrame(loop); }
    });
    document.querySelectorAll('[data-hover], a').forEach(el=>{
      el.addEventListener('mouseenter', ()=>ring.classList.add('is-hovering'));
      el.addEventListener('mouseleave', ()=>ring.classList.remove('is-hovering'));
    });
  }


  /* =====================================================
     SCROLL REVEAL — one-shot fade-up when elements enter view
     [data-reveal] items, [data-reveal-group] staggers its children
     ===================================================== */
  function initScrollReveal(){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{
        if(en.isIntersecting){
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, {threshold:0.15});
    getAll('[data-reveal]').forEach(el=>io.observe(el));

    // staggered reveal for project + service cards
    getAll('[data-reveal-group]').forEach(group=>{
      Array.from(group.children).forEach((child, i)=>{
        child.setAttribute('data-reveal', '');
        child.style.transitionDelay = (i*70)+'ms';
        io.observe(child);
      });
    });
  }


  /* =====================================================
     HERO — dot-grid canvas, cursor spotlight, content parallax
     [data-el="grid-canvas"] [data-el="hero"] [data-el="hero-glow"] [data-el="hero-inner"]
     ===================================================== */
  function initHero(){
    // soft dot grid with mouse parallax
    const canvas = getEl('[data-el="grid-canvas"]');
    if(canvas){
      const ctx = canvas.getContext('2d');
      let w,h,dots=[];
      let mouseX=-9999, mouseY=-9999;
      function resize(){
        w = canvas.width = canvas.offsetWidth * devicePixelRatio;
        h = canvas.height = canvas.offsetHeight * devicePixelRatio;
        const gap = 46 * devicePixelRatio;
        dots = [];
        for(let x=gap/2; x<w; x+=gap){
          for(let y=gap/2; y<h; y+=gap){
            dots.push({x,y,ox:x,oy:y});
          }
        }
      }
      function draw(){
        ctx.clearRect(0,0,w,h);
        for(const d of dots){
          const dx = d.ox-mouseX, dy = d.oy-mouseY;
          const dist = Math.sqrt(dx*dx+dy*dy);
          const influence = Math.max(0, 1 - dist/260);
          const push = influence * 14;
          const angle = Math.atan2(dy,dx);
          d.x = d.ox + Math.cos(angle)*push;
          d.y = d.oy + Math.sin(angle)*push;
          const r = 1.4 + influence*2.2;
          ctx.beginPath();
          ctx.arc(d.x, d.y, r, 0, Math.PI*2);
          ctx.fillStyle = influence>0.05 ? `rgba(124,108,240,${0.25+influence*0.55})` : 'rgba(139,144,156,0.18)';
          ctx.fill();
        }
      }
      // each frame depends only on the mouse position, so redraw when the
      // mouse moves (once per frame) instead of looping 60fps forever
      let drawQueued = false;
      function requestDraw(){
        if(drawQueued) return;
        drawQueued = true;
        requestAnimationFrame(()=>{ drawQueued = false; draw(); });
      }
      window.addEventListener('mousemove', e=>{
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX-rect.left)*devicePixelRatio;
        mouseY = (e.clientY-rect.top)*devicePixelRatio;
        if(!prefersReduced) requestDraw();
      });
      window.addEventListener('resize', ()=>{ resize(); draw(); });
      resize();
      draw();
    }

    // spotlight lags behind cursor
    const hero = getEl('[data-el="hero"]');
    const glow = getEl('[data-el="hero-glow"]');
    if(hero && glow && !isTouch && !prefersReduced){
      let gx = innerWidth/2, gy = innerHeight*0.4, tx = gx, ty = gy, glowRunning = false;
      // eases toward the cursor; sleeps once caught up, wakes on mousemove
      function glowLoop(){
        gx += (tx-gx)*0.06; gy += (ty-gy)*0.06;
        glow.style.left = gx+'px'; glow.style.top = gy+'px';
        if(Math.abs(tx-gx) < 0.1 && Math.abs(ty-gy) < 0.1){ glowRunning = false; return; }
        requestAnimationFrame(glowLoop);
      }
      hero.addEventListener('mousemove', e=>{
        const r = hero.getBoundingClientRect();
        tx = e.clientX - r.left; ty = e.clientY - r.top;
        if(!glowRunning){ glowRunning = true; requestAnimationFrame(glowLoop); }
      });
      glowRunning = true; glowLoop();
    }

    // gentle parallax + fade of hero content on scroll.
    // Desktop only: once the hero stacks (≤900px) it's taller than the screen,
    // so fading it would hide the terminal while you're scrolling to it.
    const inner = getEl('[data-el="hero-inner"]');
    const heroStacked = window.matchMedia('(max-width:900px)');
    if(inner && !prefersReduced){
      let pTick = false;
      window.addEventListener('scroll', ()=>{
        if(pTick) return; pTick = true;
        requestAnimationFrame(()=>{
          pTick = false;
          if(heroStacked.matches){ inner.style.transform = ''; inner.style.opacity = ''; return; }
          const y = window.scrollY;
          const vh = window.innerHeight;
          if(y < vh){
            inner.style.transform = `translateY(${y*0.16}px)`;
            inner.style.opacity = Math.max(0, 1 - y/(vh*0.85));
          }
        });
      }, {passive:true});
    }
  }


  /* =====================================================
     PROJECTS — subtle image parallax inside project cards
     [data-media] img
     ===================================================== */
  function initProjectsParallax(){
    const medias = Array.from(getAll('[data-media] img'));
    if(!medias.length || prefersReduced) return;
    let ticking = false;
    function update(){
      ticking = false;
      const vh = window.innerHeight;
      medias.forEach(img=>{
        const r = img.parentElement.getBoundingClientRect();
        if(r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height/2 - vh/2) / vh; // -0.5..0.5 through viewport
        img.style.transform = `translateY(${p * -22}px)` + (img.matches(':hover') ? ' scale(1.045)' : '');
      });
    }
    window.addEventListener('scroll', ()=>{
      if(!ticking){ ticking = true; requestAnimationFrame(update); }
    }, {passive:true});
    update();
  }


  /* =====================================================
     MAGNETIC BUTTONS — buttons lean toward the cursor (all sections)
     [data-magnetic]
     ===================================================== */
  function initMagneticButtons(){
    if(isTouch || prefersReduced) return;
    getAll('[data-magnetic]').forEach(btn=>{
      btn.addEventListener('mousemove', e=>{
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width/2;
        const y = e.clientY - r.top - r.height/2;
        btn.style.transform = `translate(${x*0.25}px, ${y*0.35}px)`;
      });
      btn.addEventListener('mouseleave', ()=>{ btn.style.transform=''; });
    });
  }


  /* =====================================================
     HERO TERMINAL — typing code card + boot intro (loader) + tilt
     [data-el="term-body"] [data-el="hero-terminal"] [data-el="term-card"] [data-el="boot-skip"]
     The boot intro only plays when the page starts at the very top.
     ===================================================== */
  function initHeroTerminal(){
    const term = getEl('[data-el="term-body"]');
    if(!term){
      document.body.classList.remove('is-booting');
      return;
    }

    const T = [
      ['c','// pankaj.config.js\n\n'],
      ['k','const '],['v','developer'],['pr',' = {\n'],
      ['pr','  name: '],['s','"Pankaj Kumar"'],['pr',',\n'],
      ['pr','  role: '],['s','"Webflow Developer"'],['pr',',\n'],
      ['pr','  buildingSince: '],['n','2019'],['pr',',\n'],
      ['pr','  projects: '],['s','"60+"'],['pr',',\n'],
      ['pr','  happyClients: '],['s','"50+"'],['pr',',\n'],
      ['pr','  upwork: { topRatedPlus: '],['b','true'],['pr',', jobSuccess: '],['s','"100%"'],['pr',' },\n'],
      ['pr','  stack: ['],['s','"Webflow"'],['pr',', '],['s','"GSAP"'],['pr',', '],['s','"HubSpot"'],['pr',', '],['s','"Lottie"'],['pr','],\n'],
      ['pr','  status: '],['s','"available_for_projects"'],['pr','\n};\n\n'],
      ['c','// let\u2019s build something that moves \u2192']
    ];
    // short token codes in T -> descriptive .token-* class names
    const TOKEN = {c:'comment', k:'keyword', v:'variable', pr:'punctuation', s:'string', n:'number', b:'boolean'};
    const caret = document.createElement('span');
    caret.className = 'terminal-caret';
    const heroTerm = getEl('[data-el="hero-terminal"]');

    // only play the boot intro when the page starts at the very top.
    // scrollY alone isn't enough: on reload / back-forward the browser restores
    // the old position AFTER this runs, so remember it ourselves across loads.
    const BOOT_SCROLL_KEY = 'boot-scroll-y';
    window.addEventListener('pagehide', ()=>{
      try{ sessionStorage.setItem(BOOT_SCROLL_KEY, String(window.scrollY)); }catch(e){}
    });
    function startsAtTop(){
      if(window.scrollY !== 0) return false;
      // deep link to a section further down (#about, #contact…)
      const id = location.hash.length > 1 ? decodeURIComponent(location.hash.slice(1)) : '';
      const target = id && document.getElementById(id);
      if(target && target.getBoundingClientRect().top + window.scrollY > 1) return false;
      // reload / back-forward to a scrolled position
      const nav = performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
      if(nav && (nav.type === 'reload' || nav.type === 'back_forward')){
        let saved = 0;
        try{ saved = Number(sessionStorage.getItem(BOOT_SCROLL_KEY)) || 0; }catch(e){}
        if(saved > 0) return false;
      }
      return true;
    }
    const isBooting = document.body.classList.contains('is-booting') && startsAtTop();
    let bootDone = false;
    let ti=0, ci=0, cur=null;

    function finishBoot(){
      if(bootDone) return; bootDone = true;
      const skipHint = getEl('[data-el="boot-skip"]');
      if(skipHint) skipHint.style.opacity = '0';
      setTimeout(()=>{
        if(heroTerm) heroTerm.style.transform = '';
        document.body.classList.remove('is-booting');
        document.body.style.overflow = '';
        setTimeout(()=>{
          if(heroTerm){ heroTerm.style.transition=''; heroTerm.style.willChange=''; }
        }, 1200);
      }, 420);
    }

    function flushAll(){
      while(ti < T.length){
        if(!cur){
          cur = document.createElement('span');
          cur.className = 'token-'+TOKEN[T[ti][0]];
          term.insertBefore(cur, caret);
        }
        cur.textContent = T[ti][1];
        ti++; ci=0; cur=null;
      }
    }

    if(prefersReduced || !isBooting || !heroTerm){
      // no intro: render instantly (reduced motion) or type in place
      document.body.classList.remove('is-booting');
      document.body.style.overflow = '';
      if(prefersReduced){
        flushAll();
        term.appendChild(caret);
      } else {
        term.appendChild(caret);
        (function type(){
          if(ti>=T.length) return;
          if(!cur){ cur=document.createElement('span'); cur.className='token-'+TOKEN[T[ti][0]]; term.insertBefore(cur, caret); }
          const txt=T[ti][1];
          cur.textContent = txt.slice(0, ++ci);
          if(ci>=txt.length){ ti++; ci=0; cur=null; }
          setTimeout(type, 14 + Math.random()*26);
        })();
      }
    } else {
      // BOOT SEQUENCE: center + enlarge the terminal before anything else exists
      window.scrollTo(0,0);
      document.body.style.overflow = 'hidden';
      const r = heroTerm.getBoundingClientRect();
      const vw = window.innerWidth, vh = window.innerHeight;
      const k = Math.min(1.4, Math.max(1, (Math.min(620, vw*0.92)) / r.width));
      const dx = vw/2 - (r.left + r.width/2);
      const dy = vh/2 - (r.top + r.height/2);
      heroTerm.style.willChange = 'transform';
      heroTerm.style.transition = 'none';
      heroTerm.style.transform = `translate(${dx}px, ${dy}px) scale(${k})`;
      void heroTerm.offsetWidth;
      heroTerm.style.transition = 'transform 1.1s cubic-bezier(.2,.8,.2,1)';

      term.appendChild(caret);
      (function type(){
        if(bootDone){ return; }
        if(ti>=T.length){ finishBoot(); return; }
        if(!cur){ cur=document.createElement('span'); cur.className='token-'+TOKEN[T[ti][0]]; term.insertBefore(cur, caret); }
        const txt=T[ti][1];
        cur.textContent = txt.slice(0, ++ci);
        if(ci>=txt.length){ ti++; ci=0; cur=null; }
        setTimeout(type, 7 + Math.random()*15);
      })();

      // skip: click / key / safety timeout
      function skipNow(){ if(bootDone) return; flushAll(); finishBoot(); }
      window.addEventListener('click', skipNow);
      window.addEventListener('keydown', skipNow);
      setTimeout(skipNow, 9000);
    }

    // subtle tilt on the card
    const card = getEl('[data-el="term-card"]');
    const wrap = heroTerm;
    if(card && wrap && !isTouch && !prefersReduced){
      wrap.addEventListener('mousemove', e=>{
        const r2 = wrap.getBoundingClientRect();
        const x=(e.clientX-r2.left)/r2.width-.5, y=(e.clientY-r2.top)/r2.height-.5;
        card.style.transform = `rotateY(${x*6}deg) rotateX(${-y*6}deg)`;
      });
      wrap.addEventListener('mouseleave', ()=>{ card.style.transform=''; });
    }
  }


  /* =====================================================
     BACKGROUND FIELD — abstract shapes drift at their own speed
     [data-speed] (optional [data-rot])
     ===================================================== */
  function initBackgroundParallax(){
    const shapes = getAll('[data-speed]');
    if(!shapes.length || prefersReduced) return;
    let tick=false;
    function upd(){
      tick=false;
      const y = window.scrollY;
      shapes.forEach(sp=>{
        const f = parseFloat(sp.dataset.speed||0.08);
        let t = `translateY(${-y*f}px)`;
        if(sp.dataset.rot) t += ` rotate(${24 + y*0.015}deg)`;
        sp.style.transform = t;
      });
    }
    window.addEventListener('scroll', ()=>{ if(!tick){tick=true;requestAnimationFrame(upd);} }, {passive:true});
    upd();
  }


  /* =====================================================
     ABOUT — 3D tilt on the avatar scene
     [data-el="about-visual"] > [data-el="avatar-scene"]
     ===================================================== */
  function initAboutTilt(){
    const vis = getEl('[data-el="about-visual"]');
    const scene = vis && getEl('[data-el="avatar-scene"]', vis);
    if(!vis || !scene || isTouch || prefersReduced) return;
    vis.addEventListener('mousemove', e=>{
      const r = vis.getBoundingClientRect();
      const x = (e.clientX - r.left)/r.width - .5;
      const y = (e.clientY - r.top)/r.height - .5;
      scene.style.transform = `rotateY(${x*10}deg) rotateX(${-y*10}deg)`;
    });
    vis.addEventListener('mouseleave', ()=>{ scene.style.transform=''; });
  }


  /* =====================================================
     SPLIT WORDS — scroll-scrubbed word reveals (quote + headings + prose)
     [data-el="quote"] [data-el="quote-attr"] [data-split="heading"] [data-split="soft"]
     ===================================================== */
  function initSplitWords(){
    function splitWords(el, accents, soft){
      const out = [];
      Array.from(el.childNodes).forEach(node=>{
        if(node.nodeType===3 && node.textContent.trim()){
          const parts = node.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(w=>{
            if(!w) return;
            if(/^\s+$/.test(w)){ frag.appendChild(document.createTextNode(w)); return; }
            const sp = document.createElement('span');
            const clean = w.replace(/[^A-Za-z0-9%+]/g,'');
            sp.className = (soft ? 'split-word split-word--soft' : 'split-word') + (accents && accents.indexOf(clean)>-1 ? ' split-word--accent' : '');
            sp.textContent = w;
            frag.appendChild(sp);
            out.push(sp);
          });
          el.replaceChild(frag, node);
        }
      });
      return out;
    }

    const targets = [];

    // the about quote: slower scrub + gradient accent words + attribution punchline
    const quote = getEl('[data-el="quote"]');
    if(quote){
      const attr = getEl('[data-el="quote-attr"]', quote);
      targets.push({el:quote, spans:splitWords(quote, ['Passion','ceiling']), attr, start:.88, end:.42});
    }

    // every section heading gets the same treatment, on a quicker scrub window
    getAll('[data-split="heading"]').forEach(h=>{
      targets.push({el:h, spans:splitWords(h, null), attr:null, start:.94, end:.62});
    });

    // soft scrub for prose only — card text stays static, whole cards scrub instead
    getAll('[data-split="soft"]').forEach(el=>{
      targets.push({el, spans:splitWords(el, null, true), attr:null, start:.97, end:.72});
    });

    if(!targets.length) return;

    if(prefersReduced){
      targets.forEach(t=>{
        t.spans.forEach(sp=>sp.classList.add('is-lit'));
        if(t.attr) t.attr.classList.add('is-lit');
      });
      return;
    }

    let ticking = false;
    function update(){
      ticking = false;
      const vh = window.innerHeight;
      targets.forEach(t=>{
        const r = t.el.getBoundingClientRect();
        if(r.bottom < -60 || r.top > vh + 60) return;
        const start = vh * t.start, end = vh * t.end;
        const p = Math.max(0, Math.min(1, (start - r.top)/(start - end)));
        const lit = Math.round(p * t.spans.length);
        t.spans.forEach((sp,i)=>sp.classList.toggle('is-lit', i < lit));
        if(t.attr) t.attr.classList.toggle('is-lit', p >= 1);
      });
    }
    function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
    update();
  }


  /* =====================================================
     SCRUB CARDS — whole cards fade/slide in with scroll position
     (expertise, projects, process, testimonials)
     [data-scrub-card]
     Must run AFTER initScrollReveal: it takes these cards back out of it.
     ===================================================== */
  function initScrubCards(){
    const cards = Array.from(getAll('[data-scrub-card]'));
    if(!cards.length) return;
    // take these cards out of the one-shot reveal system — the scrub drives them now
    cards.forEach(c=>{
      c.removeAttribute('data-reveal');
      c.classList.remove('is-visible');
      c.style.transitionDelay = '';
      c.style.willChange = 'transform, opacity';
    });
    if(prefersReduced){
      cards.forEach(c=>{ c.style.opacity=''; c.style.transform=''; });
      return;
    }
    let ticking=false;
    function upd(){
      ticking=false;
      const vh = window.innerHeight;
      cards.forEach(c=>{
        const r = c.getBoundingClientRect();
        if(r.width===0) return;               // hidden (e.g. inside a closed tab panel)
        if(r.bottom < -80 || r.top > vh + 80) return;
        const start = vh * 0.99, end = vh * 0.72;
        const p = Math.max(0, Math.min(1, (start - r.top)/(start - end)));
        const ease = 1 - Math.pow(1-p, 2);
        c.style.opacity = (0.1 + 0.9*ease).toFixed(3);
        c.style.transform = `translateY(${(1-ease)*36}px) scale(${(0.965 + 0.035*ease).toFixed(4)})`;
      });
    }
    function onScroll(){ if(!ticking){ ticking=true; requestAnimationFrame(upd); } }
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
    upd();
  }


  /* =====================================================
     NAVBAR — progress bar, scrolled state, scrollspy
     [data-el="scroll-progress"] [data-el="header"] [data-nav-link]
     ===================================================== */
  function initNavbar(){
    const bar = getEl('[data-el="scroll-progress"]');
    const header = getEl('[data-el="header"]');
    const links = Array.from(getAll('[data-nav-link]'));
    // keep secs index-aligned with links (a missing target must not shift the highlight)
    const secs = links.map(a=>{
      const href = a.getAttribute('href');
      return href && href.length > 1 && href[0]==='#' ? document.querySelector(href) : null;
    });
    let tick=false;
    function upd(){
      tick=false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if(bar) bar.style.width = (max>0 ? (y/max*100) : 0) + '%';
      if(header) header.classList.toggle('is-scrolled', y > 40);
      // scrollspy
      let current = -1;
      secs.forEach((sec,i)=>{ if(sec && sec.getBoundingClientRect().top <= window.innerHeight*0.35) current = i; });
      links.forEach((a,i)=>a.classList.toggle('is-active', i===current));
    }
    window.addEventListener('scroll', ()=>{ if(!tick){tick=true;requestAnimationFrame(upd);} }, {passive:true});
    upd();
  }


  /* =====================================================
     TESTIMONIALS — spotlight rotator
     [data-testi] stage, [data-testi-slide] quotes, [data-testi-dot] progress dots.
     Auto-advances every 7s (matches the dot fill animation), pauses on hover.
     ===================================================== */
  function initTestimonials(){
    const stage = getEl('[data-testi]');
    if(!stage) return;
    const slides = Array.from(getAll('[data-testi-slide]', stage));
    const dots = Array.from(getAll('[data-testi-dot]', stage));
    if(slides.length < 2) return;
    let idx = 0, timer = null, paused = false;
    function show(i){
      idx = i;
      slides.forEach((sl,j)=>sl.classList.toggle('is-active', j===i));
      dots.forEach((d,j)=>{
        d.classList.remove('is-active');
        if(j===i){ void d.offsetWidth; d.classList.add('is-active'); } // restart fill animation
      });
    }
    function startAuto(){
      if(prefersReduced) return;
      if(timer) clearInterval(timer);
      timer = setInterval(()=>{ if(!paused) show((idx+1)%slides.length); }, 7000);
    }
    dots.forEach((d,i)=>d.addEventListener('click', ()=>{ show(i); startAuto(); }));
    stage.addEventListener('mouseenter', ()=>{ paused = true; });
    stage.addEventListener('mouseleave', ()=>{ paused = false; });
    show(0);
    startAuto();
  }


  /* =====================================================
     FAQ — accordion, one item open at a time
     [data-faq] items, [data-faq-btn] toggles; height animates via CSS grid rows.
     ===================================================== */
  function initFaq(){
    const items = Array.from(getAll('[data-faq]'));
    if(!items.length) return;
    items.forEach(item=>{
      const btn = getEl('[data-faq-btn]', item);
      if(!btn) return;
      btn.addEventListener('click', ()=>{
        const isOpen = item.classList.contains('is-open');
        items.forEach(i=>{
          i.classList.remove('is-open');
          const b = i.querySelector('[data-faq-btn]');
          if(b) b.setAttribute('aria-expanded','false');
        });
        if(!isOpen){
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded','true');
        }
      });
    });
  }


  /* =====================================================
     HIRE DRAWER — slide-in inquiry form, sends a pre-filled email
     [data-hire] openers, [data-el="hire-drawer"] [data-el="hire-overlay"]
     [data-el="hire-form"] [data-el="drawer-success"] [data-el="drawer-close"]
     ===================================================== */
  function initHireDrawer(){
    const drawer = getEl('[data-el="hire-drawer"]');
    const overlay = getEl('[data-el="hire-overlay"]');
    if(!drawer || !overlay) return;
    const form = getEl('[data-el="hire-form"]');
    const success = getEl('[data-el="drawer-success"]', drawer);
    let lastFocus = null;

    // Populate hidden tracking fields (UTMs, page, referrer, timestamp, viewport).
    // WEBFLOW NOTE: with a native Webflow Form these values submit automatically;
    // here we also append them to the mailto body so nothing is lost.
    function fillTracking(){
      const params = new URLSearchParams(location.search);
      const set = (key, val)=>{
        const f = drawer.querySelector('[data-track="'+key+'"]');
        if(f) f.value = val || '';
      };
      ['utm_source','utm_medium','utm_campaign','utm_term','utm_content']
        .forEach(k=>set(k, params.get(k)));
      set('page_url', location.href);
      set('referrer', document.referrer);
      set('submitted_at', new Date().toISOString());
      set('viewport', window.innerWidth + 'x' + window.innerHeight);
    }
    function open(){
      lastFocus = document.activeElement;
      fillTracking();
      drawer.classList.add('is-open');
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setTimeout(()=>{ const f = drawer.querySelector('[data-autofocus]'); if(f) f.focus(); }, 620);
    }
    function close(){
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      if(lastFocus) lastFocus.focus();
    }
    getAll('[data-hire]').forEach(b=>{
      b.addEventListener('click', e=>{ e.preventDefault(); open(); });
    });
    overlay.addEventListener('click', close);
    const closeBtn = getEl('[data-el="drawer-close"]');
    if(closeBtn) closeBtn.addEventListener('click', close);
    window.addEventListener('keydown', e=>{ if(e.key==='Escape' && drawer.classList.contains('is-open')) close(); });

    // submit -> composed mailto with all answers
    if(form) form.addEventListener('submit', e=>{
      e.preventDefault();
      // honeypot: if a bot filled the invisible field, silently drop the submission
      const hp = form.querySelector('[data-honeypot]');
      if(hp && hp.value){ return; }
      const name = form.elements['name'].value.trim();
      const email = form.elements['email'].value.trim();
      if(!name || !email){
        (!name ? form.elements['name'] : form.elements['email']).focus();
        return;
      }
      // pills are native radios (single choice) / checkboxes (multi choice)
      const pick = n => Array.from(drawer.querySelectorAll(`[data-name="${n}"] input:checked`))
        .map(i=>i.value).join(', ') || '\u2014';
      const body = [
        `Name: ${name}`,
        `Email: ${email}`,
        `Starting point: ${pick('start')}`,
        `Needs: ${pick('needs')}`,
        `Budget: ${pick('budget')}`,
        `Timeline: ${pick('timeline')}`,
        '',
        'Project details:',
        form.elements['details'].value.trim() || '\u2014',
        '',
        '--- tracking ---',
        'Page: ' + (form.elements['page_url'] ? form.elements['page_url'].value : ''),
        'Referrer: ' + (form.elements['referrer'] ? form.elements['referrer'].value : '\u2014'),
        'UTM: ' + ['utm_source','utm_medium','utm_campaign'].map(k=>form.elements[k] ? (form.elements[k].value||'\u2014') : '\u2014').join(' / '),
        'Time: ' + (form.elements['submitted_at'] ? form.elements['submitted_at'].value : '')
      ].join('\n');
      const subject = `New project inquiry \u2014 ${name}`;
      window.location.href = 'mailto:hello@pankajbuilds.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      form.hidden = true;
      if(success) success.hidden = false;
      setTimeout(()=>{
        close();
        setTimeout(()=>{ form.hidden = false; if(success) success.hidden = true; }, 700);
      }, 3000);
    });
  }


  /* =====================================================
     CONTACT — copy email to clipboard
     [data-el="copy-chip"] (data-email="…") > [data-el="copy-txt"]
     ===================================================== */
  function initCopyEmail(){
    const chip = getEl('[data-el="copy-chip"]');
    if(!chip) return;
    const txt = getEl('[data-el="copy-txt"]', chip);
    if(!txt) return;
    const orig = txt.textContent;
    let busy = false;
    chip.addEventListener('click', ()=>{
      if(busy) return;
      const email = chip.dataset.email;
      const write = navigator.clipboard ? navigator.clipboard.writeText(email) : Promise.reject();
      write.then(()=>{
        busy = true;
        txt.textContent = 'Copied \u2713';
        chip.classList.add('is-copied');
        setTimeout(()=>{ txt.textContent = orig; chip.classList.remove('is-copied'); busy = false; }, 1800);
      }).catch(()=>{ location.href = 'mailto:' + email; });
    });
  }


  /* =====================================================
     DESIGN-FLOW TABS — choose your starting point
     [data-flow-tab] tabs, [data-flow-panel] panels, [data-el="flow-indicator"]
     ===================================================== */
  function initFlowTabs(){
    const tabs = Array.from(getAll('[data-flow-tab]'));
    const panels = Array.from(getAll('[data-flow-panel]'));
    const ind = getEl('[data-el="flow-indicator"]');
    if(!tabs.length || !ind) return;

    function moveInd(tab){
      ind.style.left = tab.offsetLeft + 'px';
      ind.style.top = tab.offsetTop + 'px';
      ind.style.width = tab.offsetWidth + 'px';
      ind.style.height = tab.offsetHeight + 'px';
    }
    function activate(i){
      tabs.forEach((t,j)=>{
        const on = i===j;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on);
      });
      panels.forEach((p,j)=>{
        const on = i===j;
        // retrigger the step-in animation on every switch
        p.classList.remove('is-active');
        if(on){
          p.hidden = false;
          void p.offsetWidth;
          p.classList.add('is-active');
        } else {
          p.hidden = true;
        }
      });
      moveInd(tabs[i]);
    }
    tabs.forEach((t,i)=>{
      t.addEventListener('click', ()=>activate(i));
      t.addEventListener('keydown', e=>{
        if(e.key==='ArrowRight'){ e.preventDefault(); const n=(i+1)%tabs.length; tabs[n].focus(); activate(n); }
        if(e.key==='ArrowLeft'){ e.preventDefault(); const n=(i-1+tabs.length)%tabs.length; tabs[n].focus(); activate(n); }
      });
    });
    // position the indicator once fonts/layout settle
    window.addEventListener('resize', ()=>moveInd(tabs.find(t=>t.classList.contains('is-active')) || tabs[0]));
    requestAnimationFrame(()=>moveInd(tabs[0]));
    window.addEventListener('load', ()=>moveInd(tabs.find(t=>t.classList.contains('is-active')) || tabs[0]));
  }


  /* =====================================================
     RUN — switch a section's script off by setting it to false.
     Order matters, keep it as is:
     - scrollReveal before scrubCards (scrub cards opt out of the reveal)
     - heroTerminal before splitWords (the boot intro measures the
       terminal before the hero text is split into words)
     ===================================================== */
  const SECTIONS = [
    // name               init function            on?
    ['cursor',            initCursor,              true],
    ['scrollReveal',      initScrollReveal,        true],
    ['hero',              initHero,                true],
    ['projectsParallax',  initProjectsParallax,    true],
    ['magneticButtons',   initMagneticButtons,     true],
    ['heroTerminal',      initHeroTerminal,        true],
    ['backgroundParallax',initBackgroundParallax,  true],
    ['aboutTilt',         initAboutTilt,           true],
    ['splitWords',        initSplitWords,          true],
    ['scrubCards',        initScrubCards,          true],
    ['navbar',            initNavbar,              true],
    ['testimonials',      initTestimonials,        true],
    ['faq',               initFaq,                 true],
    ['hireDrawer',        initHireDrawer,          true],
    ['copyEmail',         initCopyEmail,           true],
    ['flowTabs',          initFlowTabs,            true]
  ];

  SECTIONS.forEach(([, init, on])=>{ if(on) init(); });

  // the boot intro hides the page until heroTerminal finishes it —
  // if that section is switched off, make sure the page is never left hidden
  if(!SECTIONS.some(([name, , on])=>name==='heroTerminal' && on)){
    document.body.classList.remove('is-booting');
  }

})();
