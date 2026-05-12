
/**
 * ══════════════════════════════════════════════════════════════
 *  Track & Trace AI Worker ROI Calculator
 *  Source: T&T ROI Calculator spreadsheet (Sheet: T&T ROI Calculator)
 *  All constants map 1:1 to spreadsheet cells.
 *  Dynamic inputs: B6, B14, B15
 * ══════════════════════════════════════════════════════════════
 */

/* ─── 1. STATIC CONSTANTS (spreadsheet hardcoded values) ─────────────────
   Naming: Section_Description_CellRef
   These are the non-dynamic values from the spreadsheet.
   Do NOT change unless the underlying model changes.
   ──────────────────────────────────────────────────────────────────────── */

// ── Shipment Volume section (non-dynamic) ──
const SV_AtpS_B7       = 5;     // Calls + emails + portal checks per shipment lifecycle
const SV_PctExc_B8  = 0.10;  // Benchmark: 15-22% for FTL/LTL

// ── Labor Costs section (non-dynamic) ──
const LC_Ampmt_B11       = 3;     // Benchmark: 8-15 min per touch
const LC_Hblr_B13         = 32;    // Fully-loaded rate, ~1,950 working hrs/FTE annually
const LC_Ampi_B16           = 8;     // Research, respond, and log time

// ── Exception & Delay Costs section ──
const EC_Acple_B19    = 350;   // Includes rebooking, expediting, penalties, chargebacks

// ── AI Performance & Impact Assumptions ──
const AI_Ar_B21              = 0.70;  // Benchmark: 70-90% structured T&T workflows
const AI_Pip_B22       = 0.70;  // Benchmark: 70-85% reduction in WISMO inquiries
const AI_Pede_B23= 0.50;  // Benchmark: 70-90% earlier vs manual tracking
const AI_Pcaed_B24   = 0.15;  // Benchmark: 30-50% cost reduction via early intervention

// ── Derived constant: FTE annual working hours ──
const ANNUAL_Whpf = 1950;


/* ─── 2. INPUT COLLECTION ────────────────────────────────────────────────
   Read the three dynamic form fields that map to spreadsheet cells:
     data-field="total-monthly-shipments" → B6
     data-field="num-tt-ftes"             → B14
     data-field="inbound-inquiries"       → B15
   ──────────────────────────────────────────────────────────────────────── */
function getInputs() {
  const parse = (attr, fallback) => {
    const el = document.querySelector(`[data-field="${attr}"]`);
    if (!el) return fallback;
    const v = parseFloat(el.value);
    return isNaN(v) || v < 0 ? fallback : v;
  };

  return {
    // B6 — Total monthly shipments tracked
    totalMonthlyShipments:   parse('total-monthly-shipments', 0),
    // B14 — No. of T&T FTEs (current manual team)
    numTTFtes:               parse('num-tt-ftes', 0),
    // B15 — Inbound shipment status inquiries per month
    inboundInquiriesPerMonth: parse('inbound-inquiries', 0),
  };
}


/* ─── 3. CALCULATION ENGINE ──────────────────────────────────────────────
   All formulas replicate the spreadsheet exactly.
   Section labels match the spreadsheet section names.
   ──────────────────────────────────────────────────────────────────────── */
function calculateAll(inputs) {
  const {
    totalMonthlyShipments,    // B6
    numTTFtes,                // B14
    inboundInquiriesPerMonth, // B15
  } = inputs;

  /* ── Section: Labor Productivity Impact (Carrier Touch Automation) ── */

  // Total manual touches per month = B6 × B7
  const totalManualTouchesPerMonth =
    totalMonthlyShipments * SV_AtpS_B7;

  // Touches automated per month = totalManualTouchesPerMonth × AI automation rate (B23)
  const touchesAutomatedPerMonth =
    totalManualTouchesPerMonth * AI_Ar_B21;

  // Annual touches automated
  const touchesAutomatedAnnual = touchesAutomatedPerMonth * 12;

  // Hours recovered per month = (touchesAutomatedPerMonth × B11) ÷ 60
  const hoursRecoveredPerMonth =
    (touchesAutomatedPerMonth * LC_Ampmt_B11) / 60;

  // Hours recovered annually
  const hoursRecoveredAnnual = hoursRecoveredPerMonth * 12;

  // Labor cost recovered per month = hoursRecoveredPerMonth × B13
  const laborCostRecoveredMonthly =
    hoursRecoveredPerMonth * LC_Hblr_B13;

  // Labor cost recovered annually = laborCostRecoveredMonthly × 12
  const laborCostRecoveredAnnual = laborCostRecoveredMonthly * 12;

  // Equivalent FTE capacity unlocked = hoursRecoveredAnnual ÷ ANNUAL_Whpf
  const equivalentFTECapacityUnlocked =
    hoursRecoveredAnnual / ANNUAL_Whpf;

  /* ── Section: Customer Inquiry Deflection Impact ── */

  // Inquiries avoided per month = B15 × B24
  const inquiriesAvoidedPerMonth =
    inboundInquiriesPerMonth * AI_Pip_B22;

  // Hours recovered from inquiries = (inquiriesAvoidedPerMonth × B16) ÷ 60
  const inquiryHoursRecoveredPerMonth =
    (inboundInquiriesPerMonth * LC_Ampi_B16) / 60;

  // Labor savings from inquiry deflection per month = inquiryHoursRecoveredPerMonth × B13
  const inquiryLaborSavingsMonthly =
    inquiryHoursRecoveredPerMonth * LC_Hblr_B13;

  // Annual inquiry labor savings
  const inquiryLaborSavingsAnnual = inquiryLaborSavingsMonthly * 12;

  /* ── Section: Exception Cost Avoidance (Earlier Detection) ── */

  // Exceptions per month = B6 × B8
  const exceptionsPerMonth =
    totalMonthlyShipments * SV_PctExc_B8;

  // Early detections per month = exceptionsPerMonth × B25
  const earlyDetectionsPerMonth =
    exceptionsPerMonth * AI_Pip_B22;

  // Cost avoided per early-detected shipment = B19 × B26
  const costAvoidedPerShipment =
    EC_Acple_B19 * AI_Pcaed_B24;

  // Cost avoided per month = earlyDetectionsPerMonth × costAvoidedPerShipment
  const exceptionCostAvoidedMonthly =
    earlyDetectionsPerMonth * costAvoidedPerShipment;

  // Cost avoided annually
  const exceptionCostAvoidedAnnual = exceptionCostAvoidedMonthly * 12;

  /* ── Section: Total Financial Impact ── */

  // Total monthly impact = labor + inquiry + exception
  const totalImpactMonthly =
    laborCostRecoveredMonthly + inquiryLaborSavingsMonthly + exceptionCostAvoidedMonthly;

  // Total annual impact
  const totalImpactAnnual = totalImpactMonthly * 12;

  /* ── Section: Summary KPIs ── */

  // Manual workload reduction % = AI automation rate (fixed at 70%)
  const workloadReductionPct = AI_Ar_B21 * 100;

  return {
    // Labor Productivity Impact
    totalManualTouchesPerMonth,
    touchesAutomatedPerMonth,
    touchesAutomatedAnnual,
    hoursRecoveredPerMonth,
    hoursRecoveredAnnual,
    laborCostRecoveredMonthly,
    laborCostRecoveredAnnual,
    equivalentFTECapacityUnlocked,

    // Inquiry Deflection
    inquiriesAvoidedPerMonth,
    inquiryHoursRecoveredPerMonth,
    inquiryLaborSavingsMonthly,
    inquiryLaborSavingsAnnual,

    // Exception Cost Avoidance
    exceptionsPerMonth,
    earlyDetectionsPerMonth,
    costAvoidedPerShipment,
    exceptionCostAvoidedMonthly,
    exceptionCostAvoidedAnnual,

    // Totals
    totalImpactMonthly,
    totalImpactAnnual,

    // Summary
    workloadReductionPct,
  };
}


/* ─── 4. FORMATTING HELPERS ──────────────────────────────────────────────
   Currency and number formatting consistent with the spreadsheet display.
   ──────────────────────────────────────────────────────────────────────── */
function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return '$' + Math.round(value).toLocaleString('en-US');
}

function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatFTE(value) {
  if (isNaN(value)) return '—';
  return Number(value).toFixed(2);
}

function formatPct(value) {
  return Math.round(value) + '%';
}


/* ─── 5. OUTPUT RENDERING ────────────────────────────────────────────────
   Writes every calculated value into the [data-output] DOM nodes.
   Visible outputs update the UI. Hidden outputs populate the invisible
   placeholder elements for future Webflow CMS/binding integration.
   ──────────────────────────────────────────────────────────────────────── */
function setOutput(attr, value) {
  document.querySelectorAll(`[data-output="${attr}"]`).forEach(el => {
    el.textContent = value;
  });
}

function renderOutputs(r) {
  // ── Summary KPIs ──
  setOutput('capacity-unlocked-ftes',       formatFTE(r.equivalentFTECapacityUnlocked));
  setOutput('capacity-unlocked-ftes-raw',   r.equivalentFTECapacityUnlocked.toFixed(6));
  setOutput('workload-reduction-pct',       Math.round(r.workloadReductionPct));
  setOutput('workload-reduction-display',   formatPct(r.workloadReductionPct));
  setOutput('exception-cost-annual',        formatCurrency(r.exceptionCostAvoidedAnnual));

  // ── Assumption rate display (hidden, for Webflow binding) ──
  setOutput('ai-automation-rate-display',       formatPct(AI_Ar_B21 * 100));
  setOutput('inquiry-prevention-rate-display',  formatPct(AI_Pip_B22 * 100));
  setOutput('exception-detection-rate-display', formatPct(AI_Pede_B23 * 100));

  // ── Financial Table ──
  setOutput('labor-automation-monthly',      formatCurrency(r.laborCostRecoveredMonthly));
  setOutput('labor-automation-annual',       formatCurrency(r.laborCostRecoveredAnnual));
  setOutput('inquiry-deflection-monthly',    formatCurrency(r.inquiryLaborSavingsMonthly));
  setOutput('inquiry-deflection-annual',     formatCurrency(r.inquiryLaborSavingsAnnual));
  setOutput('exception-avoidance-monthly',   formatCurrency(r.exceptionCostAvoidedMonthly));
  setOutput('exception-avoidance-annual',    formatCurrency(r.exceptionCostAvoidedAnnual));
  setOutput('total-impact-monthly',          formatCurrency(r.totalImpactMonthly));
  setOutput('total-impact-annual',           formatCurrency(r.totalImpactAnnual));
  setOutput('total-impact-monthly-raw',      r.totalImpactMonthly.toFixed(2));
  setOutput('total-impact-annual-raw',       r.totalImpactAnnual.toFixed(2));

  // ── Detailed stat boxes ──
  setOutput('total-manual-touches',         formatNumber(r.totalManualTouchesPerMonth));
  setOutput('touches-automated-monthly',    formatNumber(r.touchesAutomatedPerMonth));
  setOutput('touches-automated-annual',     formatNumber(r.touchesAutomatedAnnual));
  setOutput('hours-recovered-monthly',      formatNumber(r.hoursRecoveredPerMonth));
  setOutput('hours-recovered-annual',       formatNumber(r.hoursRecoveredAnnual));
  setOutput('labor-cost-recovered-monthly', formatCurrency(r.laborCostRecoveredMonthly));
  setOutput('labor-cost-recovered-annual',  formatCurrency(r.laborCostRecoveredAnnual));

  // ── Inquiry Deflection detail ──
  setOutput('inquiries-avoided-monthly',        formatNumber(r.inquiriesAvoidedPerMonth));
  setOutput('inquiry-hours-recovered-monthly',  formatNumber(r.inquiryHoursRecoveredPerMonth, 2));
  setOutput('inquiry-labor-savings-monthly',    formatCurrency(r.inquiryLaborSavingsMonthly));
  setOutput('inquiry-labor-savings-annual',     formatCurrency(r.inquiryLaborSavingsAnnual));

  // ── Exception Avoidance detail ──
  setOutput('exceptions-per-month',          formatNumber(r.exceptionsPerMonth));
  setOutput('early-detections-monthly',      formatNumber(r.earlyDetectionsPerMonth));
  setOutput('early-detections-annual',       formatNumber(r.earlyDetectionsPerMonth * 12));
  setOutput('cost-avoided-per-shipment',     formatCurrency(r.costAvoidedPerShipment));
  setOutput('cost-avoided-per-exception',    formatCurrency(r.costAvoidedPerShipment));
  setOutput('exception-cost-monthly',        formatCurrency(r.exceptionCostAvoidedMonthly));
  setOutput('exception-cost-annual-raw',     r.exceptionCostAvoidedAnnual.toFixed(2));
}


/* ─── 6. MAIN RECALCULATION FUNCTION ─────────────────────────────────── */
function recalculate() {
  const inputs  = getInputs();
  const results = calculateAll(inputs);
  renderOutputs(results);
}


/* ─── 7. EVENT LISTENERS ──────────────────────────────────────────────── */
function attachListeners() {
  // All three dynamic input fields
  const fields = [
    'total-monthly-shipments',
    'num-tt-ftes',
    'inbound-inquiries',
  ];

  fields.forEach(attr => {
    const el = document.querySelector(`[data-field="${attr}"]`);
    if (!el) return;
    // Recalculate on every keystroke (input) and on blur (change)
    el.addEventListener('input',  recalculate);
    el.addEventListener('change', recalculate);
  });
}


/* ─── 8. STEP NAVIGATION & FORM SUBMISSION ───────────────────────────── */

// Step 1 → Step 2
function goStep2() {
  var step1 = document.querySelector('[successstate]:not([data-step])');
  var step2 = document.querySelector('[data-step="2"]');
  if (step1) step1.style.display = 'none';
  if (step2) step2.style.display = 'block';

  // Mirror reduction % into the Step 2 heading
  var pct = document.querySelector('[data-output="workload-reduction-pct"]');
  var s2  = document.querySelector('[data-output="workload-reduction-pct-s2"]');
  if (pct && s2) s2.textContent = pct.textContent;
}

// Step 2 → Step 1 (back)
function goStep1() {
  var step1 = document.querySelector('[successstate]:not([data-step])');
  var step2 = document.querySelector('[data-step="2"]');
  if (step2) step2.style.display = 'none';
  if (step1) step1.style.display = 'block';
}

// Validate email and reveal results on success
function submitForm() {
  var emailEl  = document.querySelector('[data-field="work-email"]');
  var errorEl  = document.querySelector('[data-error="email"]');
  var val      = emailEl ? emailEl.value.trim() : '';
  var valid    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  if (emailEl) emailEl.classList.toggle('input-error', !valid);
  if (errorEl) errorEl.style.display = valid ? 'none' : 'block';
  if (!valid) return;

  // Hide every [successstate] element
  document.querySelectorAll('[successstate]').forEach(function(el) {
    el.style.display = 'none';
  });

  // Show every [successsection] element
  document.querySelectorAll('[successsection]').forEach(function(el) {
    el.style.display = 'block';
  });
}

// Single delegated click listener for all data-action buttons
function attachNavListeners() {
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    if (action === 'go-step2')    goStep2();
    if (action === 'go-step1')    goStep1();
    if (action === 'submit-form') submitForm();
  });
}

/* ─── 9. INIT — Run after DOM is ready ───────────────────────────────── */
(function init() {
  attachListeners();
  recalculate();
  // attachNavListeners();
})();

