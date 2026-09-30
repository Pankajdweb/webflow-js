
  /* =====================================================
     PORTFOLIO SCRIPTS — WEBFLOW-READY
     -----------------------------------------------------
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
  // Custom cursor
  const dot = document.querySelector('[data-el="cursor-dot"]');
  const ring = document.querySelector('[data-el="cursor-ring"]');
  const isTouch = window.matchMedia('(pointer:coarse)').matches;
  if(!isTouch){
    let rx=0, ry=0, mx=0, my=0;
    window.addEventListener('mousemove', e=>{
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
    });
    function loop(){
      rx += (mx-rx)*0.15; ry += (my-ry)*0.15;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    }
    loop();
    document.querySelectorAll('[data-hover], a').forEach(el=>{
      el.addEventListener('mouseenter', ()=>ring.classList.add('is-hovering'));
      el.addEventListener('mouseleave', ()=>ring.classList.remove('is-hovering'));
    });
  } else {
    dot.style.display='none'; ring.style.display='none';
  }

  // Scroll reveal
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      }
    });
  }, {threshold:0.15});
  document.querySelectorAll('[data-reveal]').forEach(el=>io.observe(el));

  // Staggered reveal for project + service cards + testimonials
  document.querySelectorAll('[data-reveal-group]').forEach(group=>{
    Array.from(group.children).forEach((child, i)=>{
      child.setAttribute('data-reveal', '');
      child.style.transitionDelay = (i*70)+'ms';
      io.observe(child);
    });
  });

  // Hero canvas: soft dot grid with mouse parallax
  const canvas = document.querySelector('[data-el="grid-canvas"]');
  const ctx = canvas.getContext('2d');
  let w,h,dots=[];
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
  let mouseX=-9999, mouseY=-9999;
  window.addEventListener('mousemove', e=>{
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX-rect.left)*devicePixelRatio;
    mouseY = (e.clientY-rect.top)*devicePixelRatio;
  });
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    if(!prefersReduced) requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  resize();
  draw();
  if(prefersReduced) draw();

  // ---------- Lottie icons for expertise cards ----------
  // Animations are built inline (real Lottie JSON, no external files needed).
  if(window.lottie){
    const V=[0.486,0.424,0.941,1], C=[0.247,0.878,0.816,1];
    let IND=0;
    const st=(c,wd=3.5)=>({ty:'st',c:{a:0,k:c},o:{a:0,k:100},w:{a:0,k:wd},lc:2,lj:2});
    const fl=c=>({ty:'fl',c:{a:0,k:c},o:{a:0,k:100}});
    const tr=()=>({ty:'tr',p:{a:0,k:[0,0]},a:{a:0,k:[0,0]},s:{a:0,k:[100,100]},r:{a:0,k:0},o:{a:0,k:100}});
    const gr=(...it)=>({ty:'gr',it:[...it,tr()]});
    const rc=(x,y,w2,h2,r=3)=>({ty:'rc',p:{a:0,k:[x,y]},s:{a:0,k:[w2,h2]},r:{a:0,k:r}});
    const el=(x,y,d)=>({ty:'el',p:{a:0,k:[x,y]},s:{a:0,k:[d,d]}});
    const sh=v=>({ty:'sh',ks:{a:0,k:{c:false,v:v,i:v.map(()=>[0,0]),o:v.map(()=>[0,0])}}});
    const shc=v=>({ty:'sh',ks:{a:0,k:{c:true,v:v,i:v.map(()=>[0,0]),o:v.map(()=>[0,0])}}});
    const std=(c,wd,da,ga)=>({ty:'st',c:{a:0,k:c},o:{a:0,k:100},w:{a:0,k:wd},lc:2,lj:2,d:[{n:'d',v:{a:0,k:da}},{n:'g',v:{a:0,k:ga}}]});
    const el2=(x,y,w2,h2)=>({ty:'el',p:{a:0,k:[x,y]},s:{a:0,k:[w2,h2]}});
    const GY=[0.55,0.57,0.62,1], DK=[0.07,0.08,0.1,1];
    const kf=(...fr)=>({a:1,k:fr.map(f=>({t:f[0],s:f[1],i:{x:[0.35],y:[1]},o:{x:[0.65],y:[0]}}))});
    const layer=(shapes,ks)=>({ddd:0,ind:++IND,ty:4,sr:1,ao:0,ip:0,op:90,st:0,bm:0,
      ks:Object.assign({o:{a:0,k:100},r:{a:0,k:0},p:{a:0,k:[50,50,0]},a:{a:0,k:[0,0,0]},s:{a:0,k:[100,100,100]}},ks||{}),
      shapes:shapes});
    const anim=layers=>({v:'5.7.4',fr:30,ip:0,op:90,w:100,h:100,nm:'icon',ddd:0,assets:[],layers:layers});

    const ANIMS = {
      // stacked CMS collection bars, pulsing in sequence
      cms: anim([
        layer([gr(rc(0,0,44,12,6),st(V))],{p:{a:0,k:[50,30,0]},s:kf([0,[100,100,100]],[45,[114,114,100]],[90,[100,100,100]])}),
        layer([gr(rc(0,0,44,12,6),st(C))],{p:{a:0,k:[50,50,0]},s:kf([0,[114,114,100]],[45,[100,100,100]],[90,[114,114,100]])}),
        layer([gr(rc(0,0,44,12,6),st(V))],{p:{a:0,k:[50,70,0]},s:kf([0,[100,100,100]],[45,[114,114,100]],[90,[100,100,100]])})
      ]),
      // speed gauge: arc fills + needle sweeps
      speed: anim([
        layer([gr(el(0,4,58),{ty:'tm',s:{a:0,k:0},e:kf([0,[10]],[45,[78]],[90,[10]]),o:{a:0,k:130},m:1},st(C,4))]),
        layer([gr(sh([[0,4],[0,-22]]),st(V,4))],{p:{a:0,k:[50,54,0]},r:kf([0,[-55]],[45,[55]],[90,[-55]])}),
        layer([gr(el(0,0,10),fl(V))],{p:{a:0,k:[50,54,0]}})
      ]),
      // bouncing ball over a baseline
      motion: anim([
        layer([gr(el(0,0,16),fl(C))],{p:kf([0,[50,34,0]],[45,[50,62,0]],[90,[50,34,0]])}),
        layer([gr(rc(0,0,44,4,2),fl(V))],{p:{a:0,k:[50,76,0]}})
      ]),
      // code brackets breathing + blinking cursor
      code: anim([
        layer([gr(sh([[9,-11],[-7,0],[9,11]]),st(V,4))],{p:kf([0,[33,50,0]],[45,[27,50,0]],[90,[33,50,0]])}),
        layer([gr(sh([[-9,-11],[7,0],[-9,11]]),st(V,4))],{p:kf([0,[67,50,0]],[45,[73,50,0]],[90,[67,50,0]])}),
        layer([gr(rc(0,0,4,24,2),fl(C))],{p:{a:0,k:[50,50,0]},
          o:{a:1,k:[{t:0,s:[100],h:1},{t:20,s:[0],h:1},{t:45,s:[100],h:1},{t:65,s:[0],h:1},{t:90,s:[100]}]}})
      ]),
      // pixel-perfect: inner block snapping to fit the frame
      pixel: anim([
        layer([gr(rc(0,0,54,54,10),st(V))]),
        layer([gr(rc(0,0,22,22,5),fl(C))],{s:kf([0,[55,55,100]],[45,[110,110,100]],[90,[55,55,100]])})
      ]),
      // responsive: viewport morphing desktop -> mobile
      resp: anim([
        layer([gr(rc(0,-4,58,40,6),st(C))],{s:kf([0,[100,100,100]],[45,[55,115,100]],[90,[100,100,100]])}),
        layer([gr(rc(0,26,30,4,2),fl(V))])
      ]),
      // discovery: full radar scene — dashed ring, crosshairs, sweep wedge, blips with pings
      radar: anim([
        layer([gr(el(0,0,92),std(V,1.2,3,6))],{r:kf([0,[0]],[90,[40]])}),
        layer([gr(el(0,0,66),st(GY,1))]),
        layer([gr(el(0,0,40),st(GY,1))]),
        layer([gr(sh([[-46,0],[46,0]]),sh([[0,-46],[0,46]]),st(GY,.8))],{o:{a:0,k:35}}),
        layer([gr(shc([[0,0],[15,-46],[-15,-46]]),fl(C))],{o:{a:0,k:13},r:kf([0,[0]],[90,[360]])}),
        layer([gr(sh([[0,0],[0,-46]]),st(C,2))],{r:kf([0,[0]],[90,[360]])}),
        layer([gr(el(26,-10,6),fl(C))],
          {o:{a:1,k:[{t:0,s:[0]},{t:20,s:[100]},{t:44,s:[100]},{t:56,s:[0]},{t:90,s:[0]}]}}),
        layer([gr(el(26,-10,6),st(C,1.5))],
          {s:kf([20,[100,100,100]],[46,[280,280,100]]),
           o:{a:1,k:[{t:0,s:[0]},{t:20,s:[80]},{t:46,s:[0]},{t:90,s:[0]}]}}),
        layer([gr(el(-28,20,5),fl(V))],
          {o:{a:1,k:[{t:0,s:[0]},{t:55,s:[100]},{t:78,s:[100]},{t:88,s:[0]}]}}),
        layer([gr(el(-28,20,5),st(V,1.5))],
          {s:kf([55,[100,100,100]],[82,[260,260,100]]),
           o:{a:1,k:[{t:0,s:[0]},{t:55,s:[75]},{t:82,s:[0]},{t:90,s:[0]}]}}),
        layer([gr(el(0,0,16),st(V,1.5))],{s:kf([0,[100,100,100]],[45,[150,150,100]],[90,[100,100,100]]),o:{a:0,k:45}}),
        layer([gr(el(0,0,8),fl(V))])
      ]),

      // build: a webpage assembling itself inside a browser window
      assemble: anim([
        layer([gr(rc(0,0,86,68,7),st(GY,1.5))]),
        layer([gr(sh([[-43,-23],[43,-23]]),st(GY,1))],{o:{a:0,k:70}}),
        layer([gr(el(-35,-28,4),el(-27,-28,4),el(-19,-28,4),fl(GY))],{o:{a:0,k:60}}),
        layer([gr(rc(-14,-10,48,14,3),st(C,2))],
          {p:kf([4,[38,50,0]],[18,[50,50,0]]),
           o:{a:1,k:[{t:0,s:[0]},{t:6,s:[100]},{t:74,s:[100]},{t:88,s:[0]}]}}),
        layer([gr(rc(-14,6,48,5,2),fl(V))],
          {p:kf([14,[40,50,0]],[28,[50,50,0]]),
           o:{a:1,k:[{t:14,s:[0]},{t:20,s:[70]},{t:74,s:[70]},{t:88,s:[0]}]}}),
        layer([gr(rc(-19,15,38,5,2),fl(V))],
          {p:kf([22,[41,50,0]],[36,[50,50,0]]),
           o:{a:1,k:[{t:22,s:[0]},{t:28,s:[70]},{t:74,s:[70]},{t:88,s:[0]}]}}),
        layer([gr(rc(29,2,20,28,3),st(V,2))],
          {p:kf([30,[50,58,0]],[44,[50,50,0]]),
           o:{a:1,k:[{t:30,s:[0]},{t:38,s:[100]},{t:74,s:[100]},{t:88,s:[0]}]}}),
        layer([gr(rc(31,-10,3,9,1),fl(C))],
          {o:{a:1,k:[{t:0,s:[0]},{t:44,s:[100],h:1},{t:56,s:[0],h:1},{t:66,s:[100],h:1},{t:76,s:[0]},{t:90,s:[0]}]}}),
        layer([gr(sh([[-43,26],[43,26]]),st(GY,1.5))],{o:{a:0,k:50}}),
        layer([gr(sh([[-43,26],[43,26]]),{ty:'tm',s:{a:0,k:0},e:kf([6,[0]],[70,[100]]),o:{a:0,k:0},m:1},st(C,3))],
          {o:{a:1,k:[{t:0,s:[100]},{t:74,s:[100]},{t:88,s:[0]},{t:90,s:[0]}]}})
      ]),

      // review & speed: instrument gauge with ticks, whoosh lines and a passing check
      qa: anim([
        layer([gr(el(0,2,90),std(GY,1,3,6))],{r:kf([0,[0]],[90,[-30]])}),
        layer([gr(el(0,4,64),st(GY,1.5))],{o:{a:0,k:40}}),
        layer([gr(el(0,4,64),{ty:'tm',s:{a:0,k:0},e:kf([0,[8]],[50,[72]],[90,[8]]),o:{a:0,k:130},m:1},st(C,3.5))]),
        layer([gr(el(-24,-13,3),el(0,-26,3),el(24,-13,3),fl(GY))],{o:{a:0,k:70}}),
        layer([gr(sh([[0,6],[0,-20]]),st(V,3.5))],{p:{a:0,k:[50,54,0]},r:kf([0,[-58]],[50,[58]],[90,[-58]])}),
        layer([gr(el(0,0,9),fl(V))],{p:{a:0,k:[50,54,0]}}),
        layer([gr(sh([[-46,-4],[-32,-4]]),st(C,2))],
          {o:{a:1,k:[{t:0,s:[0]},{t:12,s:[80]},{t:22,s:[0]},{t:40,s:[0]},{t:50,s:[80]},{t:60,s:[0]},{t:90,s:[0]}]}}),
        layer([gr(sh([[-48,4],[-36,4]]),st(V,2))],
          {o:{a:1,k:[{t:6,s:[0]},{t:18,s:[70]},{t:28,s:[0]},{t:46,s:[0]},{t:56,s:[70]},{t:66,s:[0]},{t:90,s:[0]}]}}),
        layer([gr(el(0,0,26),fl(V))],
          {p:{a:0,k:[76,72,0]},o:{a:1,k:[{t:0,s:[0]},{t:48,s:[0]},{t:54,s:[22]},{t:80,s:[22]},{t:90,s:[0]}]}}),
        layer([gr(sh([[-6,0],[-2,4],[7,-7]]),st(C,3))],
          {p:{a:0,k:[76,72,0]},s:kf([48,[0,0,100]],[58,[115,115,100]],[64,[100,100,100]]),
           o:{a:1,k:[{t:0,s:[0]},{t:48,s:[100]},{t:80,s:[100]},{t:90,s:[0]}]}})
      ]),

      // launch: a proper little rocket — body, window, fins, flickering flame, trail and burst
      launch: anim([
        layer([gr(el(-34,-30,3),fl(GY))],{o:{a:1,k:[{t:0,s:[20]},{t:22,s:[85]},{t:44,s:[20]},{t:90,s:[20]}]}}),
        layer([gr(el(36,-18,2.5),fl(GY))],{o:{a:1,k:[{t:10,s:[20]},{t:34,s:[85]},{t:58,s:[20]},{t:90,s:[20]}]}}),
        layer([gr(el(-24,28,2.5),fl(GY))],{o:{a:1,k:[{t:30,s:[20]},{t:52,s:[85]},{t:74,s:[20]},{t:90,s:[20]}]}}),
        layer([gr(rc(0,0,44,3,2),fl(GY))],{p:{a:0,k:[50,86,0]},o:{a:0,k:45}}),
        layer([gr(rc(0,19,3,18,2),fl(V))],
          {p:kf([8,[50,70,0]],[60,[50,22,0]]),
           o:{a:1,k:[{t:0,s:[0]},{t:16,s:[60]},{t:56,s:[60]},{t:66,s:[0]},{t:90,s:[0]}]}}),
        layer([gr(shc([[0,14],[4.5,22],[0,29],[-4.5,22]]),fl(V))],
          {p:kf([8,[50,70,0]],[60,[50,22,0]]),
           s:kf([8,[100,100,100]],[16,[100,135,100]],[26,[100,95,100]],[36,[100,130,100]],[46,[100,100,100]],[56,[100,125,100]]),
           o:{a:1,k:[{t:0,s:[0]},{t:10,s:[95]},{t:58,s:[95]},{t:66,s:[0]},{t:90,s:[0]}]}}),
        layer([gr(shc([[-7,10],[-14,19],[-7,16]]),shc([[7,10],[14,19],[7,16]]),fl(V))],
          {p:kf([8,[50,70,0]],[60,[50,22,0]]),
           o:{a:1,k:[{t:0,s:[0]},{t:10,s:[100]},{t:60,s:[100]},{t:68,s:[0]},{t:90,s:[0]}]}}),
        layer([gr(rc(0,0,15,28,7),fl(DK),st(C,2.2))],
          {p:kf([8,[50,70,0]],[60,[50,22,0]]),
           o:{a:1,k:[{t:0,s:[0]},{t:10,s:[100]},{t:60,s:[100]},{t:68,s:[0]},{t:90,s:[0]}]}}),
        layer([gr(shc([[0,-22],[7.5,-13],[-7.5,-13]]),fl(C))],
          {p:kf([8,[50,70,0]],[60,[50,22,0]]),
           o:{a:1,k:[{t:0,s:[0]},{t:10,s:[100]},{t:60,s:[100]},{t:68,s:[0]},{t:90,s:[0]}]}}),
        layer([gr(el(0,-4,7),st(C,1.8))],
          {p:kf([8,[50,70,0]],[60,[50,22,0]]),
           o:{a:1,k:[{t:0,s:[0]},{t:10,s:[100]},{t:60,s:[100]},{t:68,s:[0]},{t:90,s:[0]}]}}),
        layer([gr(el(0,0,22),st(C,2))],
          {p:{a:0,k:[50,22,0]},s:kf([58,[60,60,100]],[86,[200,200,100]]),
           o:{a:1,k:[{t:0,s:[0]},{t:58,s:[0]},{t:62,s:[90]},{t:88,s:[0]}]}}),
        layer([gr(el(0,0,4),fl(C))],
          {p:kf([60,[50,22,0]],[80,[76,4,0]]),
           o:{a:1,k:[{t:0,s:[0]},{t:60,s:[100]},{t:80,s:[0]},{t:90,s:[0]}]}}),
        layer([gr(el(0,0,4),fl(V))],
          {p:kf([60,[50,22,0]],[80,[24,6,0]]),
           o:{a:1,k:[{t:0,s:[0]},{t:60,s:[100]},{t:80,s:[0]},{t:90,s:[0]}]}})
      ]),

      // support: planet with ring, orbiting moons, heartbeat pulse and a shooting star
      orbit: anim([
        layer([gr(el(0,0,88),std(GY,1,4,7))]),
        layer([gr(el(0,0,60),st(GY,.8))],{o:{a:0,k:35}}),
        layer([gr(el(0,0,26),fl(V))],{o:{a:0,k:92}}),
        layer([gr(el(-5,-6,8),fl([1,1,1,1]))],{o:{a:0,k:22}}),
        layer([gr(el2(0,2,52,15),st(C,1.8))],{r:{a:0,k:-16},o:{a:0,k:85}}),
        layer([gr(el(44,0,6),fl(C))],{r:kf([0,[0]],[90,[360]])}),
        layer([gr(el(-30,0,4),fl(V))],{r:kf([0,[360]],[90,[0]])}),
        layer([gr(el(0,0,30),st(V,1.5))],
          {s:kf([10,[100,100,100]],[42,[210,210,100]]),
           o:{a:1,k:[{t:0,s:[0]},{t:10,s:[70]},{t:42,s:[0]},{t:90,s:[0]}]}}),
        layer([gr(el(0,0,30),st(V,1.5))],
          {s:kf([52,[100,100,100]],[84,[210,210,100]]),
           o:{a:1,k:[{t:0,s:[0]},{t:52,s:[70]},{t:84,s:[0]},{t:90,s:[0]}]}}),
        layer([gr(sh([[0,0],[13,-7]]),st(C,2))],
          {p:kf([28,[12,16,0]],[44,[80,50,0]]),
           o:{a:1,k:[{t:0,s:[0]},{t:28,s:[90]},{t:44,s:[0]},{t:90,s:[0]}]}}),
        layer([gr(sh([[-3,0],[3,0]]),sh([[0,-3],[0,3]]),st(C,1.5))],
          {p:{a:0,k:[24,-30,0]},o:{a:1,k:[{t:0,s:[15]},{t:20,s:[90]},{t:40,s:[15]},{t:90,s:[15]}]}}),
        layer([gr(sh([[-3,0],[3,0]]),sh([[0,-3],[0,3]]),st(V,1.5))],
          {p:{a:0,k:[-34,26,0]},o:{a:1,k:[{t:24,s:[15]},{t:44,s:[90]},{t:64,s:[15]},{t:90,s:[15]}]}})
      ]),

      // migration: content dot traveling from old platform box to Webflow box
      migrate: anim([
        layer([gr(rc(0,0,24,34,5),st(V))],{p:{a:0,k:[26,50,0]}}),
        layer([gr(rc(0,0,24,34,5),st(C))],{p:{a:0,k:[74,50,0]}}),
        layer([gr(el(0,0,10),fl(C))],{
          p:kf([5,[28,50,0]],[65,[72,50,0]]),
          o:{a:1,k:[{t:0,s:[0]},{t:12,s:[100]},{t:58,s:[100]},{t:72,s:[0]},{t:90,s:[0]}]}
        })
      ])
    };

    document.querySelectorAll('[data-anim]').forEach(box=>{
      const data = ANIMS[box.dataset.anim];
      if(!data) return;
      const hoverPlay = false;
      const inst = lottie.loadAnimation({
        container:box, renderer:'svg', loop:true,
        autoplay:!prefersReduced && !hoverPlay, animationData:data
      });
      if(prefersReduced || hoverPlay) inst.goToAndStop(30, true);
      if(box.hasAttribute('data-ambient') && !prefersReduced){
        inst.setSpeed(0.45);
        const sec = box.closest('section');
        if(sec){
          sec.addEventListener('mouseenter', ()=>inst.setSpeed(1));
          sec.addEventListener('mouseleave', ()=>inst.setSpeed(0.45));
        }
        return;
      }
      const card = box.closest('[data-scrub-card="service"]');
      if(card && !prefersReduced){
        card.addEventListener('mouseenter', ()=>inst.setSpeed(2.2));
        card.addEventListener('mouseleave', ()=>inst.setSpeed(1));
      }
    });

  }

  // ---------- Projects: subtle parallax inside project cards ----------
  (function(){
    const medias = Array.from(document.querySelectorAll('[data-media] img'));
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
  })();

  // ---------- Hero: cursor spotlight, magnetic CTAs, count-up stats, parallax ----------
  (function(){
    const hero = document.querySelector('[data-el="hero"]');
    const glow = document.querySelector('[data-el="hero-glow"]');
    const inner = document.querySelector('[data-el="hero-inner"]');

    // spotlight lags behind cursor
    if(glow && !isTouch && !prefersReduced){
      let gx = innerWidth/2, gy = innerHeight*0.4, tx = gx, ty = gy;
      hero.addEventListener('mousemove', e=>{
        const r = hero.getBoundingClientRect();
        tx = e.clientX - r.left; ty = e.clientY - r.top;
      });
      (function glowLoop(){
        gx += (tx-gx)*0.06; gy += (ty-gy)*0.06;
        glow.style.left = gx+'px'; glow.style.top = gy+'px';
        requestAnimationFrame(glowLoop);
      })();
    }

    // magnetic buttons
    if(!isTouch && !prefersReduced){
      document.querySelectorAll('[data-magnetic]').forEach(btn=>{
        btn.addEventListener('mousemove', e=>{
          const r = btn.getBoundingClientRect();
          const x = e.clientX - r.left - r.width/2;
          const y = e.clientY - r.top - r.height/2;
          btn.style.transform = `translate(${x*0.25}px, ${y*0.35}px)`;
        });
        btn.addEventListener('mouseleave', ()=>{ btn.style.transform=''; });
      });
    }

    // typing terminal + boot intro sequence
    const term = document.querySelector('[data-el="term-body"]');
    if(term){
      const T = [
        ['c','// pankaj.config.js\n\n'],
        ['k','const '],['v','developer'],['pr',' = {\n'],
        ['pr','  name: '],['s','"Pankaj Kumar"'],['pr',',\n'],
        ['pr','  role: '],['s','"Webflow Developer"'],['pr',',\n'],
        ['pr','  experience: '],['s','"4+ years"'],['pr',',\n'],
        ['pr','  sitesShipped: '],['n','100'],['pr',',\n'],
        ['pr','  happyClients: '],['n','50'],['pr',',\n'],
        ['pr','  upwork: { topRated: '],['b','true'],['pr',', jobSuccess: '],['s','"100%"'],['pr',' },\n'],
        ['pr','  stack: ['],['s','"Webflow"'],['pr',', '],['s','"GSAP"'],['pr',', '],['s','"Lottie"'],['pr',', '],['s','"Webflow Cloud"'],['pr','],\n'],
        ['pr','  status: '],['s','"available_for_projects"'],['pr','\n};\n\n'],
        ['c','// let\u2019s build something that moves \u2192']
      ];
      // short token codes in T -> descriptive .token-* class names
      const TOKEN = {c:'comment', k:'keyword', v:'variable', pr:'punctuation', s:'string', n:'number', b:'boolean'};
      const caret = document.createElement('span');
      caret.className = 'terminal-caret';
      const heroTerm = document.querySelector('[data-el="hero-terminal"]');
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
        const skipHint = document.querySelector('[data-el="boot-skip"]');
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
      const card = document.querySelector('[data-el="term-card"]');
      const wrap = document.querySelector('[data-el="hero-terminal"]');
      if(card && wrap && !isTouch && !prefersReduced){
        wrap.addEventListener('mousemove', e=>{
          const r2 = wrap.getBoundingClientRect();
          const x=(e.clientX-r2.left)/r2.width-.5, y=(e.clientY-r2.top)/r2.height-.5;
          card.style.transform = `rotateY(${x*6}deg) rotateX(${-y*6}deg)`;
        });
        wrap.addEventListener('mouseleave', ()=>{ card.style.transform=''; });
      }
    } else {
      document.body.classList.remove('is-booting');
    }

    // gentle parallax + fade of hero content on scroll
    if(inner && !prefersReduced){
      let pTick = false;
      window.addEventListener('scroll', ()=>{
        if(pTick) return; pTick = true;
        requestAnimationFrame(()=>{
          pTick = false;
          const y = window.scrollY;
          const vh = window.innerHeight;
          if(y < vh){
            inner.style.transform = `translateY(${y*0.16}px)`;
            inner.style.opacity = Math.max(0, 1 - y/(vh*0.85));
          }
        });
      }, {passive:true});
    }
  })();

  // ---------- Abstract background parallax ----------
  (function(){
    const shapes = document.querySelectorAll('[data-speed]');
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
  })();

  // ---------- 3D tilt on the avatar scene ----------
  (function(){
    const vis = document.querySelector('[data-el="about-visual"]');
    const scene = vis && vis.querySelector('[data-el="avatar-scene"]');
    if(!vis || !scene || isTouch || prefersReduced) return;
    vis.addEventListener('mousemove', e=>{
      const r = vis.getBoundingClientRect();
      const x = (e.clientX - r.left)/r.width - .5;
      const y = (e.clientY - r.top)/r.height - .5;
      scene.style.transform = `rotateY(${x*10}deg) rotateX(${-y*10}deg)`;
    });
    vis.addEventListener('mouseleave', ()=>{ scene.style.transform=''; });
  })();

  // ---------- Scroll-scrubbed word reveals (quote + all section headings) ----------
  (function(){
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
    const quote = document.querySelector('[data-el="quote"]');
    if(quote){
      const attr = quote.querySelector('[data-el="quote-attr"]');
      targets.push({el:quote, spans:splitWords(quote, ['Passion','ceiling']), attr, start:.88, end:.42});
    }

    // every section heading gets the same treatment, on a quicker scrub window
    document.querySelectorAll('[data-split="heading"]').forEach(h=>{
      targets.push({el:h, spans:splitWords(h, null), attr:null, start:.94, end:.62});
    });

    // soft scrub for prose only — card text stays static, whole cards scrub instead
    document.querySelectorAll('[data-split="soft"]').forEach(el=>{
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
  })();

  // ---------- Whole-card scroll scrub ----------
  (function(){
    const cards = Array.from(document.querySelectorAll('[data-scrub-card]'));
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
  })();

  // ---------- Navbar: progress bar, scrolled state, scrollspy ----------
  (function(){
    const bar = document.querySelector('[data-el="scroll-progress"]');
    const header = document.querySelector('[data-el="header"]');
    const links = Array.from(document.querySelectorAll('[data-nav-link]'));
    const secs = links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
    let tick=false;
    function upd(){
      tick=false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if(bar) bar.style.width = (max>0 ? (y/max*100) : 0) + '%';
      if(header) header.classList.toggle('is-scrolled', y > 40);
      // scrollspy
      let current = -1;
      secs.forEach((sec,i)=>{ if(sec.getBoundingClientRect().top <= window.innerHeight*0.35) current = i; });
      links.forEach((a,i)=>a.classList.toggle('is-active', i===current));
    }
    window.addEventListener('scroll', ()=>{ if(!tick){tick=true;requestAnimationFrame(upd);} }, {passive:true});
    upd();
  })();

  // ---------- Testimonial spotlight rotator ----------
  // [data-testi] stage, [data-testi-slide] quotes, [data-testi-dot] progress dots.
  // Auto-advances every 7s (matches the dot fill animation), pauses on hover.
  (function(){
    const stage = document.querySelector('[data-testi]');
    if(!stage) return;
    const slides = Array.from(stage.querySelectorAll('[data-testi-slide]'));
    const dots = Array.from(stage.querySelectorAll('[data-testi-dot]'));
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
  })();

  // ---------- FAQ accordion ----------
  // [data-faq] items; one open at a time; height animates via CSS grid rows.
  (function(){
    const items = Array.from(document.querySelectorAll('[data-faq]'));
    if(!items.length) return;
    items.forEach(item=>{
      const btn = item.querySelector('[data-faq-btn]');
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
  })();

  // ---------- Mobile menu toggle ----------
  // [data-el="menu-toggle"] flips the burger; [data-menu-link] closes on navigate.
  (function(){
    const toggle = document.querySelector('[data-el="menu-toggle"]');
    const menu = document.querySelector('[data-el="mobile-menu"]');
    if(!toggle || !menu) return;
    function setOpen(open){
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    }
    toggle.addEventListener('click', ()=>setOpen(!menu.classList.contains('is-open')));
    menu.querySelectorAll('[data-menu-link]').forEach(a=>a.addEventListener('click', ()=>setOpen(false)));
    window.addEventListener('keydown', e=>{ if(e.key==='Escape' && menu.classList.contains('is-open')) setOpen(false); });
  })();

  // ---------- Hire drawer ----------
  (function(){
    const drawer = document.querySelector('[data-el="hire-drawer"]');
    const overlay = document.querySelector('[data-el="hire-overlay"]');
    if(!drawer || !overlay) return;
    const form = document.querySelector('[data-el="hire-form"]');
    const success = drawer.querySelector('[data-el="drawer-success"]');
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
    document.querySelectorAll('[data-hire]').forEach(b=>{
      b.addEventListener('click', e=>{ e.preventDefault(); open(); });
    });
    overlay.addEventListener('click', close);
    document.querySelector('[data-el="drawer-close"]').addEventListener('click', close);
    window.addEventListener('keydown', e=>{ if(e.key==='Escape' && drawer.classList.contains('is-open')) close(); });

    // pill selection (single vs multi)
    drawer.querySelectorAll('[data-name]').forEach(group=>{
      const single = group.hasAttribute('data-single');
      group.querySelectorAll('button').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          if(single){
            group.querySelectorAll('button').forEach(b=>b.removeAttribute('data-selected'));
            btn.setAttribute('data-selected','');
          } else {
            btn.toggleAttribute('data-selected');
          }
        });
      });
    });

    // submit -> composed mailto with all answers
    form.addEventListener('submit', e=>{
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
      const pick = n => Array.from(drawer.querySelectorAll(`[data-name="${n}"] [data-selected]`))
        .map(b=>b.textContent.trim()).join(', ') || '\u2014';
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
      window.location.href = 'mailto:uidevux@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      form.hidden = true;
      success.hidden = false;
      setTimeout(()=>{
        close();
        setTimeout(()=>{ form.hidden = false; success.hidden = true; }, 700);
      }, 3000);
    });
  })();

  // ---------- Copy email to clipboard ----------
  (function(){
    const chip = document.querySelector('[data-el="copy-chip"]');
    if(!chip) return;
    const txt = chip.querySelector('[data-el="copy-txt"]');
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
  })();

  // ---------- Design-flow tabs (choose your starting point) ----------
  (function(){
    const tabs = Array.from(document.querySelectorAll('[data-flow-tab]'));
    const panels = Array.from(document.querySelectorAll('[data-flow-panel]'));
    const ind = document.querySelector('[data-el="flow-indicator"]');
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
    window.addEventListener('resize', ()=>moveInd(tabs.find((t,i)=>t.classList.contains('is-active')) || tabs[0]));
    requestAnimationFrame(()=>moveInd(tabs[0]));
    window.addEventListener('load', ()=>moveInd(tabs.find(t=>t.classList.contains('is-active')) || tabs[0]));
  })();
