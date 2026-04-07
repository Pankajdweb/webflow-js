// ═══════════════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════════════
const CALC = {
  stateRates: {
    none:0, CA:.15, NY:.09, TX:.05, MA:.10,
    FL:0, IL:.065, WA:.015, CO:.03, GA:.10,
    AZ:.24, NC:.25, PA:.10, OH:0, VA:.15, MN:.10
  },
  stateNames: {
    none:'No State Credit', CA:'California', NY:'New York', TX:'Texas',
    MA:'Massachusetts', FL:'Florida', IL:'Illinois', WA:'Washington',
    CO:'Colorado', GA:'Georgia', AZ:'Arizona', NC:'North Carolina',
    PA:'Pennsylvania', OH:'Ohio', VA:'Virginia', MN:'Minnesota'
  },
  industryRatios: {
    software:.65, biotech:.75, manufacturing:.55,
    engineering:.60, architecture:.45, food:.40,
    aerospace:.70, energy:.58
  },
  years: ['2025','2024','2023','2022']
};
 
// ═══════════════════════════════════════════════════════════
//  DOM HELPERS — only query via JS-functional data attributes
// ═══════════════════════════════════════════════════════════
const q  = (sel, ctx=document) => ctx.querySelector(sel);
const qa = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];
 
function getField(key)      { return q(`[data-calc-field="${key}"]`)?.value?.trim() || ''; }
function setField(key, val) { const el = q(`[data-calc-field="${key}"]`); if (el) el.value = val; }
function getYear(yr)        { return q(`[data-calc-year="${yr}"]`)?.value?.replace(/[^0-9]/g,'') || ''; }
function parseYear(yr)      { const v = getYear(yr); return v ? parseFloat(v) : 0; }
function getRadio(name)     { return q(`input[name="${name}"]:checked`)?.value || ''; }
function setHidden(key,val) { const el = q(`[data-calc-hidden="${key}"]`); if (el) el.value = val; }
 
function fmtM(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'm';
  if (n >= 1_000)     return Math.round(n / 1_000) + 'k';
  return Math.round(n).toLocaleString();
}
 
function fmtYearInput(el) {
  const raw = el.value.replace(/[^0-9]/g, '');
  el.value = raw ? Number(raw).toLocaleString() : '';
}
 
// ═══════════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════════
function goStep(n) {
  qa('[data-calc-step]').forEach(panel => {
    panel.setAttribute('data-state', panel.getAttribute('data-calc-step') === String(n) ? 'active' : '');
  });
  qa('[data-calc-step-ind]').forEach(ind => {
    const num = parseInt(ind.getAttribute('data-calc-step-ind'));
    if      (num === n) ind.setAttribute('data-state', 'active');
    else if (num < n)   ind.setAttribute('data-state', 'done');
    else                ind.removeAttribute('data-state');
  });
  window.scrollTo({ top:0, behavior:'smooth' });
}
 
// ═══════════════════════════════════════════════════════════
//  STEP 1 VALIDATION
// ═══════════════════════════════════════════════════════════
function validateStep1() {
  const hasAny = CALC.years.some(yr => parseYear(yr) > 0);
  const errEl  = q('[data-calc-error="step1"]');
  const inputs = qa('[data-calc-year]');
 
  if (!hasAny) {
    errEl.setAttribute('data-state', 'visible');
    inputs.forEach(inp => {
      inp.setAttribute('data-state', 'error');
      inp.style.animation = 'none';
      void inp.offsetWidth;
      inp.style.animation = '';
    });
    return;
  }
  errEl.removeAttribute('data-state');
  inputs.forEach(inp => inp.removeAttribute('data-state'));
  goStep(2);
}
 
// ═══════════════════════════════════════════════════════════
//  CALCULATE (Step 4 → Step 5)
// ═══════════════════════════════════════════════════════════
function calculate() {
  const email   = getField('email');
  const emailEl = q('[data-calc-field="email"]');
 
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    emailEl.setAttribute('data-state', 'error');
    emailEl.focus();
    emailEl.addEventListener('input', () => emailEl.removeAttribute('data-state'), { once:true });
    return;
  }
 
  const years = {};
  CALC.years.forEach(yr => { years[yr] = parseYear(yr); });
 
  if (!Object.values(years).some(v => v > 0)) { goStep(1); validateStep1(); return; }
 
  const currentExp = years['2025'] || years['2024'] || years['2023'] || years['2022'];
  const priorVals  = ['2024','2023','2022'].map(yr => years[yr]).filter(v => v > 0);
  const avg3       = priorVals.length ? priorVals.reduce((a,b) => a+b, 0) / 3 : currentExp;
 
  const stateKey      = getField('state');
  const industry      = getRadio('calc-industry');
  const qreRatio      = CALC.industryRatios[industry] || 0.65;
  const qualifiedQRE  = currentExp * qreRatio;
  const baseQRE       = avg3 * qreRatio;
  const incrementalQRE = Math.max(qualifiedQRE - 0.5 * baseQRE, qualifiedQRE * 0.20);
  const federalCredit  = incrementalQRE * 0.14;
  const stateRate      = CALC.stateRates[stateKey] || 0;
  const stateCredit    = qualifiedQRE * 0.70 * stateRate;
  const totalCredit    = federalCredit + stateCredit;
 
  // Populate hidden form
  setHidden('states',   stateKey);
  setHidden('industry', industry);
  setHidden('amount',   Math.round(totalCredit));
 
  CALC.years.forEach(yr => {
    const key = 'year' + yr;
    let el = q(`[data-calc-hidden="${key}"]`);
    if (!el) {
      el = document.createElement('input');
      el.type = 'hidden';
      el.name = 'Year' + yr;
      el.setAttribute('data-calc-hidden', key);
      q('[data-calc-hidden-form]').appendChild(el);
    }
    el.value = years[yr];
  });
 
  // Render result range
  q('[data-calc-result="low"]').textContent  = fmtM(totalCredit * 0.80);
  q('[data-calc-result="high"]').textContent = fmtM(totalCredit * 1.20);
 
  goStep(5);
 
  // Pop animation on hero card
  const hero = q('[data-calc-estimate-hero]');
  hero.removeAttribute('data-anim');
  void hero.offsetWidth;
  hero.setAttribute('data-anim', 'pop');
}
 
// ═══════════════════════════════════════════════════════════
//  SUBMIT CONTACT (Step 5)
// ═══════════════════════════════════════════════════════════
function submitContact() {
  const phoneEl = q('[data-calc-field="phone"]');
  const phone   = phoneEl?.value?.trim() || '';
  const method  = getRadio('calc-method');
 
  if (!phone) {
    phoneEl.setAttribute('data-state', 'error');
    phoneEl.focus();
    phoneEl.addEventListener('input', () => phoneEl.removeAttribute('data-state'), { once:true });
    return;
  }
 
  setHidden('phone',  phone);
  setHidden('method', method);
 
  // In production: q('[data-calc-hidden-form]').submit();
 
  q('[data-calc-speak-section]').style.display = 'none';
  q('[data-calc-disclaimer]').style.display    = 'none';
 
  const ty = q('[data-calc-thankyou]');
  ty.setAttribute('data-state', 'visible');
  ty.style.animation = 'none';
  void ty.offsetWidth;
  ty.style.animation = '';
}
 
// ═══════════════════════════════════════════════════════════
//  RESTART
// ═══════════════════════════════════════════════════════════
function restartCalc() {
  qa('[data-calc-year]').forEach(el => { el.value = ''; el.removeAttribute('data-state'); });
  ['name','email','phone'].forEach(key => setField(key, ''));
  q('[data-calc-error="step1"]')?.removeAttribute('data-state');
 
  const speakSec   = q('[data-calc-speak-section]');
  const disclaimer = q('[data-calc-disclaimer]');
  const ty         = q('[data-calc-thankyou]');
  if (speakSec)   speakSec.style.display   = '';
  if (disclaimer) disclaimer.style.display = '';
  if (ty)         ty.removeAttribute('data-state');
 
  goStep(1);
}
 
// ═══════════════════════════════════════════════════════════
//  EVENT DELEGATION — single listener for all interactions
// ═══════════════════════════════════════════════════════════
document.addEventListener('click', function(e) {
  const btn = e.target.closest('[data-calc-action],[data-calc-goto]');
  if (!btn) return;
 
  const action = btn.getAttribute('data-calc-action');
  const goto   = btn.getAttribute('data-calc-goto');
 
  if (action === 'next-1')  return validateStep1();
  if (action === 'submit')  return calculate();
  if (action === 'contact') return submitContact();
  if (action === 'restart') return restartCalc();
 
  if (goto) {
    // Step indicator — only navigate to already-completed steps
    const stepInd = btn.closest('[data-calc-step-ind]');
    if (stepInd && stepInd.getAttribute('data-state') !== 'done') return;
    goStep(parseInt(goto));
  }
});
 
// Year input formatting — delegated
document.addEventListener('input', function(e) {
  if (!e.target.hasAttribute('data-calc-year')) return;
  fmtYearInput(e.target);
  if (e.target.value) {
    q('[data-calc-error="step1"]')?.removeAttribute('data-state');
    qa('[data-calc-year]').forEach(inp => inp.removeAttribute('data-state'));
  }
});
 
// ═══════════════════════════════════════════════════════════
//  postMessage — pre-fill from parent window (Webflow iframe)
// ═══════════════════════════════════════════════════════════
window.addEventListener('message', function(e) {
  try {
    const obj = JSON.parse(e.data);
    if (!obj?.contact) return;
    setField('name',  obj.contact.fullname || '');
    setField('email', obj.contact.email    || '');
    Object.entries(obj.years || {}).forEach(([yr, val]) => {
      const el = q(`[data-calc-year="${yr}"]`);
      if (el) el.value = Number(val).toLocaleString();
    });
    if (obj.states)   setField('state', obj.states);
    if (obj.industry) {
      const r = q(`input[name="calc-industry"][value="${obj.industry}"]`);
      if (r) r.checked = true;
    }
  } catch(err) {}
});
