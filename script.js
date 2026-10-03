'use strict';

/* ============================================================
   1. CONFIG & STATIC DATA
   ============================================================ */
const GAME_VERSION = 11;

const CONFIG = {
  SAVE_KEY: 'landlordEmpire_save_v2',
  TICK_MS: 30_000,            // one rent / bank cycle
  MAX_OFFLINE_TICKS: 2880,    // offline progress capped at 24h
  UI_REFRESH_MS: 250,
  AUTOSAVE_MS: 10_000,
  LOAN_TERM_CYCLES: 240,      // a loan is repaid over 240 cycles (2 hours)
  MAX_NEGATIVE_CYCLES: 6,     // cash below $0 this many cycles in a row = bankruptcy
  MAX_LOANS: 4,
  BREAKDOWN_CHANCE: 0.05,     // per rented property, per live cycle
  WORK_COOLDOWN_MS: 400,
  CHART_EVERY: 2,             // chart gets a new point every 2 cycles
  CHART_POINTS: 60,
};

// rate = total interest added to the loan, repaid in equal installments each cycle
const LOAN_OPTIONS = [
  { id: 'family',   name: 'Family loan',     amount: 30000,  rate: 0.03, desc: 'Cheap, but small.' },
  { id: 'bank',     name: 'Community bank',  amount: 60000,  rate: 0.06, desc: 'A balanced start.' },
  { id: 'investor', name: 'Investor credit', amount: 120000, rate: 0.12, desc: 'Big budget, heavy interest.' },
];

// Size of the map on the page. It matches .map-world in style.css: 1200 x 675, a 16:9 picture.
const WORLD = { w: 1200, h: 675 };

// rect = the district's area on the map, in % of the map (x, y = top-left corner, w, h = size).
// unlockAt = properties owned to open it. Locked districts are dimmed on the map.
const DISTRICTS = [
  { id: 'rustbelt', name: 'Rustbelt Row',   unlockAt: 0,  rect: { x: 15, y: 70, w: 60, h: 25 } },   // industrial, bottom
  { id: 'maple',    name: 'Maple Heights',  unlockAt: 3,  rect: { x: 5,  y: 36, w: 30, h: 28 } },   // suburbs, mid-left
  { id: 'midtown',  name: 'Midtown',        unlockAt: 7,  rect: { x: 36, y: 41, w: 28, h: 28 } },   // city center, middle
  { id: 'harbor',   name: 'Harbor Quarter', unlockAt: 11, rect: { x: 70, y: 36, w: 28, h: 28 } },   // waterfront, mid-right
  { id: 'skyline',  name: 'Skyline Crown',  unlockAt: 15, rect: { x: 25, y: 4,  w: 50, h: 28 } },   // skyscrapers, top
];

// Every property and its pin position.
// x = across the map (0 = left edge, 100 = right edge), y = down the map (0 = top, 100 = bottom).
// The pin's tip sits exactly on (x, y), so to move a pin just change these two numbers.
const BUILDINGS = [
  // rustbelt
  { id: 'r1', zone: 'rustbelt', name: 'Tannery Flats',  x: 22, y: 80, price: 18000, rent: 220, repairLabel: 'Fix plumbing',           repairCost: 4000 },
  { id: 'r2', zone: 'rustbelt', name: 'Mill St Duplex', x: 40, y: 86, price: 24000, rent: 300, repairLabel: 'Replace flooring',       repairCost: 5000 },
  { id: 'r3', zone: 'rustbelt', name: 'Bakery Loft',    x: 55, y: 78, price: 15000, rent: 190, repairLabel: 'Rewire electrics',       repairCost: 3500 },
  { id: 'r4', zone: 'rustbelt', name: 'Depot Row',      x: 68, y: 88, price: 32000, rent: 420, repairLabel: 'Repaint and patch roof', repairCost: 7000 },
  // maple
  { id: 'maple-1', zone: 'maple', name: 'Linden Court',   x: 12, y: 43, price: 60000,   rent: 750,  repairLabel: 'Fix plumbing',     repairCost: 13000 },
  { id: 'maple-2', zone: 'maple', name: 'Maple Terrace',  x: 27, y: 45, price: 78000,   rent: 980,  repairLabel: 'Replace flooring', repairCost: 17000 },
  { id: 'maple-3', zone: 'maple', name: 'Orchard Villas', x: 14, y: 57, price: 99000,   rent: 1240, repairLabel: 'Rewire electrics', repairCost: 22000 },
  { id: 'maple-4', zone: 'maple', name: 'Parkgate Homes', x: 28, y: 59, price: 126000,  rent: 1580, repairLabel: 'Renovate roof',    repairCost: 27500 },
  // midtown
  { id: 'midtown-1', zone: 'midtown', name: 'Metro Lofts',    x: 42, y: 48, price: 160000,  rent: 2000, repairLabel: 'Fix plumbing',     repairCost: 35000 },
  { id: 'midtown-2', zone: 'midtown', name: 'Bank St Flats',  x: 57, y: 50, price: 208000,  rent: 2600, repairLabel: 'Replace flooring', repairCost: 46000 },
  { id: 'midtown-3', zone: 'midtown', name: 'Theatre Row',    x: 44, y: 62, price: 264000,  rent: 3300, repairLabel: 'Rewire electrics', repairCost: 58000 },
  { id: 'midtown-4', zone: 'midtown', name: 'Civic Suites',   x: 58, y: 63, price: 336000,  rent: 4200, repairLabel: 'Renovate roof',    repairCost: 74000 },
  // harbor
  { id: 'harbor-1', zone: 'harbor', name: 'Pier Homes',     x: 78, y: 44, price: 400000,  rent: 5000, repairLabel: 'Fix plumbing',     repairCost: 88000 },
  { id: 'harbor-2', zone: 'harbor', name: 'Beacon Flats',   x: 92, y: 46, price: 520000,  rent: 6500, repairLabel: 'Replace flooring', repairCost: 114500 },
  { id: 'harbor-3', zone: 'harbor', name: 'Marina Lofts',   x: 80, y: 57, price: 660000,  rent: 8250, repairLabel: 'Rewire electrics', repairCost: 145000 },
  { id: 'harbor-4', zone: 'harbor', name: 'Quay Towers',    x: 93, y: 59, price: 840000,  rent: 10500, repairLabel: 'Renovate roof',    repairCost: 185000 },
  // skyline
  { id: 'skyline-1', zone: 'skyline', name: 'Crown Suites',   x: 33, y: 16, price: 1000000, rent: 12500, repairLabel: 'Fix plumbing',     repairCost: 220000 },
  { id: 'skyline-2', zone: 'skyline', name: 'Sky Gardens',    x: 48, y: 13, price: 1300000, rent: 16250, repairLabel: 'Replace flooring', repairCost: 286000 },
  { id: 'skyline-3', zone: 'skyline', name: 'Apex Tower',     x: 62, y: 21, price: 1650000, rent: 20630, repairLabel: 'Rewire electrics', repairCost: 363000 },
  { id: 'skyline-4', zone: 'skyline', name: 'Regent Hall',    x: 54, y: 28, price: 2100000, rent: 26250, repairLabel: 'Renovate roof',    repairCost: 462000 },
];

// Renovation styles: pct = total cost as a share of the purchase price, bonus = permanent rent increase.
const RENO = [
  { name: 'None',   pct: 0,    bonus: 0 },
  { name: 'Modern', pct: 0.15, bonus: 0.25 },
  { name: 'Luxury', pct: 0.35, bonus: 0.6 },
];

// Education: pay `cost` (High School is free), then wait `secs` real seconds.
const DEGREES = [
  { id: 'highschool',   name: 'High School Diploma', cost: 0,     secs: 20,  needs: null },
  { id: 'management',   name: 'Management Degree',   cost: 15000, secs: 45,  needs: 'highschool' },
  { id: 'arts',         name: 'Arts Degree',         cost: 10000, secs: 40,  needs: 'highschool' },
  { id: 'architecture', name: 'Architecture Degree', cost: 30000, secs: 75,  needs: 'highschool' },
  { id: 'medical',      name: 'Medical Degree',      cost: 80000, secs: 120, needs: 'highschool' },
];

// Career paths. Each path has promotion tiers: pay = cash per Work tap,
// fee = what it costs to be promoted INTO that tier. needs = degree required to switch to the path.
const CAREERS = [
  { id: 'retail', name: 'Retail & Service', needs: null, tiers: [
    { name: 'Cleaner',         pay: 8,  fee: 0 },
    { name: 'Fastfood Worker', pay: 15, fee: 400 },
    { name: 'Shop Assistant',  pay: 30, fee: 1500 },
    { name: 'Sales Agent',     pay: 60, fee: 5000 },
  ] },
  { id: 'arts', name: 'Arts & Design', needs: 'arts', tiers: [
    { name: 'Street Painter', pay: 70,  fee: 0 },
    { name: 'Studio Painter', pay: 130, fee: 3000 },
    { name: 'Gallery Artist', pay: 240, fee: 8000 },
    { name: 'Master Artist',  pay: 420, fee: 20000 },
  ] },
  { id: 'business', name: 'Business', needs: 'management', tiers: [
    { name: 'Office Associate',   pay: 90,  fee: 0 },
    { name: 'Sales Executive',    pay: 180, fee: 5000 },
    { name: 'Department Manager', pay: 350, fee: 15000 },
    { name: 'Corporate Director', pay: 650, fee: 40000 },
  ] },
  { id: 'architecture', name: 'Architecture', needs: 'architecture', tiers: [
    { name: 'Draftsman',       pay: 110, fee: 0 },
    { name: 'Junior Architect', pay: 220, fee: 8000 },
    { name: 'Urban Planner',   pay: 420, fee: 25000 },
    { name: 'Chief Architect', pay: 800, fee: 60000 },
  ] },
  { id: 'medicine', name: 'Medicine', needs: 'medical', tiers: [
    { name: 'Intern',           pay: 150,  fee: 0 },
    { name: 'Resident',         pay: 300,  fee: 10000 },
    { name: 'Attending',        pay: 600,  fee: 35000 },
    { name: 'Chief of Surgery', pay: 1000, fee: 100000 },
  ] },
];

const STATUS = { repair: 'Needs repair', ready: 'Ready to rent', rented: 'Rented', broken: 'Broken' };
const PIN_ICON = { sale: '🏷️', repair: '🔧', ready: '🔑', rented: '🏠', broken: '⚠️' };

/* ============================================================
   2. STATE & SAVE MANAGER
   ============================================================ */
const newState = () => ({
  version: 2,
  hasStarted: false,        // false until the first loan is taken
  lightMode: true,
  cash: 0,
  loans: [],                // { id, name, principal, balance, rate, payment }
  properties: [],           // see Game.act('buy') for the fields
  unlockedDistricts: [DISTRICTS[0].id],
  career: { path: 'retail', tiers: { retail: 0 }, degrees: [], study: null, lastWork: 0 },
  lastTick: Date.now(),
  negativeCycles: 0,
  history: [],              // chart points: { cash, debt }
  stats: { totalRent: 0, ticks: 0, loanPaid: 0, breakdowns: 0 },
});

const SaveManager = {
  load() {
    try {
      const raw = localStorage.getItem(CONFIG.SAVE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw), base = newState();
      const career = { ...base.career, ...saved.career };
      delete career.job;    // left over from the old job ladder
      delete career.held;
      return { ...base, ...saved, career, stats: { ...base.stats, ...saved.stats } };
    } catch (err) {
      console.warn('Could not read save, starting fresh.', err);
      return null;
    }
  },
  save(state) {
    try { localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(state)); }
    catch (err) { console.warn('Could not save.', err); }
  },
  wipe() { localStorage.removeItem(CONFIG.SAVE_KEY); },
};

/* ============================================================
   3. HELPERS
   ============================================================ */
const $ = (id) => document.getElementById(id);
const fmtMoney = (n) => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US');
const fmtShort = (n) => (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.abs(n) >= 1000 ? Math.round(n / 1000) + 'k' : String(Math.round(n)));
function fmtDuration(ms) {
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return m > 0 ? `${m}m` : `${Math.floor(ms / 1000)}s`;
}
const tenantRent = (base, kind) => Math.round(base * (kind === 'premium' ? 1.5 : 1));
const findBuilding = (id) => BUILDINGS.find((b) => b.id === id);
const findProp = (s, id) => s.properties.find((p) => p.id === id);
const totalDebt = (s) => s.loans.reduce((a, l) => a + l.balance, 0);
const baseRentOf = (p) => Math.round(p.origRent * (1 + RENO[p.reno].bonus));
const offerOf = (p) => Math.round((p.buyPrice + p.repairCost + p.renoSpent) * p.market);   // what the market pays today
const renoCost = (p, level) => Math.round((RENO[level].pct * p.buyPrice) / 100) * 100 - p.renoSpent;
const statusKey = (p) => (p.broken ? 'broken' : p.status);
const pinKey = (s, id) => { const p = findProp(s, id); return p ? statusKey(p) : 'sale'; };

/* ============================================================
   4. ENGINE  (game rules; no DOM access)
   ============================================================ */
const Engine = {
  // Rent earned in one cycle. Broken or unrented properties pay $0.
  tickIncome(s) {
    return s.properties.reduce((sum, p) => sum + (p.status === 'rented' && !p.broken ? p.rent : 0), 0);
  },

  // Deducts every loan installment (interest + principal). Cash is allowed to go negative;
  // staying below $0 for too many cycles in a row is bankruptcy.
  payLoans(s) {
    const due = s.loans.reduce((a, l) => a + Math.min(l.payment, l.balance), 0);
    if (due > 0) {
      s.cash -= due;
      s.stats.loanPaid += due;
      s.loans.forEach((l) => { l.balance -= Math.min(l.payment, l.balance); });
      s.loans = s.loans.filter((l) => l.balance > 0);
    }
    s.negativeCycles = s.cash < 0 ? s.negativeCycles + 1 : 0;
    if (s.negativeCycles >= CONFIG.MAX_NEGATIVE_CYCLES) s.bankrupt = true;
    return due;
  },

  // Each rented, working property has a small chance to break down.
  rollBreakdowns(s) {
    let n = 0;
    for (const p of s.properties) {
      if (p.status === 'rented' && !p.broken && Math.random() < CONFIG.BREAKDOWN_CHANCE) {
        p.broken = true;
        p.fixCost = Math.max(500, Math.round((p.repairCost * 0.4) / 100) * 100);
        n++;
      }
    }
    s.stats.breakdowns += n;
    return n;
  },

  // Adds a chart point (or, with replaceLast, refreshes the newest one).
  record(s, replaceLast) {
    const point = { cash: s.cash, debt: totalDebt(s) };
    if (replaceLast && s.history.length) s.history[s.history.length - 1] = point;
    else s.history.push(point);
    if (s.history.length > CONFIG.CHART_POINTS) s.history.shift();
  },

  // One 30s cycle. `live` is false while catching up on time the game was closed
  // (nothing breaks while you're away).
  processTick(s, live) {
    const rent = this.tickIncome(s);
    s.cash += rent;
    s.stats.totalRent += rent;
    s.stats.ticks += 1;
    this.payLoans(s);
    s.properties.forEach((p) => { p.market = 0.9 + Math.random() * 0.25; });   // sell offer: -10% .. +15%
    if (live) this.rollBreakdowns(s);
    if (s.stats.ticks % CONFIG.CHART_EVERY === 0) this.record(s, false);
    return rent;
  },

  // Runs every cycle elapsed since s.lastTick (live play and offline catch-up).
  advance(s, now) {
    if (s.lastTick > now) s.lastTick = now;
    const due = Math.floor((now - s.lastTick) / CONFIG.TICK_MS);
    if (due <= 0) return null;

    const ticks = Math.min(due, CONFIG.MAX_OFFLINE_TICKS);
    const before = { ...s.stats };
    let earned = 0;
    for (let i = 0; i < ticks && !s.bankrupt; i++) earned += this.processTick(s, due === 1);

    s.lastTick += due * CONFIG.TICK_MS;
    return { ticks, earned, capped: due > CONFIG.MAX_OFFLINE_TICKS,
      paid: s.stats.loanPaid - before.loanPaid, breaks: s.stats.breakdowns - before.breakdowns };
  },

  msToNextTick(s, now) { return CONFIG.TICK_MS - (now - s.lastTick); },
};

/* ============================================================
   5. UI  (all DOM work)
   ============================================================ */
const UI = {
  district: 'rustbelt',   // district selected on the map
  building: null,         // pin selected on the map
  openId: null,           // property open in the popup
  buyId: null,            // property open in the buy popup
  mapPos: null,           // remembered map scroll position
  justDragged: false,     // true right after a mouse drag, so the drag doesn't count as a pin tap
  toastTimer: null,

  init() {
    document.querySelectorAll('.nav-btn').forEach((btn) =>
      btn.addEventListener('click', () => this.showTab(btn.dataset.tab)));

    $('district-tabs').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      this.district = chip.dataset.district;
      this.building = null;
      this.renderMap(Game.state);
      this.focusDistrict(this.district, false);
    });

    // Tap a pin: For Sale pins open the buy popup, owned pins open the management popup.
    $('map-pins').addEventListener('click', (e) => {
      const pin = e.target.closest('.pin');
      if (!pin || this.justDragged) return;
      const b = findBuilding(pin.dataset.id);
      this.building = b.id;
      this.district = b.zone;
      if (findProp(Game.state, b.id)) this.openProperty(b.id);
      else this.openBuy(b.id);
      this.renderMap(Game.state);
    });

    // Mouse users can drag the map to pan it. Touch screens scroll it natively.
    const sc = $('map-scroll');
    let drag = null;
    sc.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') drag = { x: e.clientX, y: e.clientY, left: sc.scrollLeft, top: sc.scrollTop, moved: false };
    });
    document.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 5) { drag.moved = true; sc.classList.add('dragging'); }
      if (drag.moved) { sc.scrollLeft = drag.left - dx; sc.scrollTop = drag.top - dy; }
    });
    document.addEventListener('pointerup', () => {
      if (drag && drag.moved) { this.justDragged = true; setTimeout(() => { this.justDragged = false; }, 0); }
      drag = null;
      sc.classList.remove('dragging');
    });

    $('buy-close').addEventListener('click', () => this.closeBuy());
    $('buy-modal').addEventListener('click', (e) => { if (e.target === $('buy-modal')) this.closeBuy(); });

    // Every button with a data-act attribute (Buy, Repair, Rent, Work, Study...) is handled here.
    document.body.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (b) Game.act(b.dataset.act, b.dataset.id, b.dataset.arg);
    });

    // Loan cards appear on the start screen and in the Bank tab.
    const cards = LOAN_OPTIONS.map((o) => `
      <button class="loan-card" data-id="${o.id}">
        <strong>${o.name}</strong><span class="amount">${fmtMoney(o.amount)}</span>
        <small>${(o.rate * 100).toFixed(0)}% interest. ${o.desc}</small>
      </button>`).join('');
    ['loan-options', 'new-loans'].forEach((id) => {
      $(id).innerHTML = cards;
      $(id).addEventListener('click', (e) => {
        const card = e.target.closest('.loan-card');
        if (card) Game.borrow(card.dataset.id);
      });
    });

    $('pay-btn').addEventListener('click', () => Game.payEarly($('pay-amount').value));
    $('theme-btn').addEventListener('click', () => Game.toggleTheme());
    $('dev-cash-btn').addEventListener('click', () => Game.addCash(100000));
    $('reset-btn').addEventListener('click', () => { if (confirm('Erase your save and start over?')) Game.reset(); });
    $('offline-close').addEventListener('click', () => $('offline-modal').classList.add('hidden'));
    $('pm-close').addEventListener('click', () => this.closeProperty());
    $('property-modal').addEventListener('click', (e) => { if (e.target === $('property-modal')) this.closeProperty(); });

    $('version').textContent = `Game version ${GAME_VERSION}`;
  },

  showTab(name) {
    const sc = $('map-scroll');
    if ($('view-map').classList.contains('active')) this.mapPos = { left: sc.scrollLeft, top: sc.scrollTop };   // remember the map position
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${name}`));
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    if (name === 'map' && this.mapPos) { sc.scrollLeft = this.mapPos.left; sc.scrollTop = this.mapPos.top; }
  },

  applyTheme(light) {
    document.body.classList.toggle('light-mode', light);
    $('theme-btn').textContent = light ? 'Switch to dark mode' : 'Switch to light mode';
  },

  showLoanScreen() { $('app').classList.add('hidden'); $('loan-screen').classList.remove('hidden'); },
  hideLoanScreen() { $('loan-screen').classList.add('hidden'); $('app').classList.remove('hidden'); },

  showOffline(res) {
    $('offline-text').textContent =
      `You were away for ${fmtDuration(res.ticks * CONFIG.TICK_MS)}${res.capped ? ' (capped at 24h)' : ''}. ` +
      `${res.ticks} cycles paid ${fmtMoney(res.earned)} in rent. Loan payments took ${fmtMoney(res.paid)}.`;
    $('offline-modal').classList.remove('hidden');
  },

  toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.add('hidden'), 3000);
  },

  bankMsg(msg) { $('bank-msg').textContent = msg; },

  // A button that also enables/disables itself as cash changes (see refreshHud).
  btn(act, id, label, cost = 0, cls = '', arg = '') {
    return `<button class="btn ${cls}" data-act="${act}" data-id="${id}" data-arg="${arg}" data-cost="${cost}" ${Game.state.cash < cost ? 'disabled' : ''}>${label}</button>`;
  },

  // Cheap per-frame update: numbers, cycle bar, meters and button states.
  refreshHud(s, now = Date.now()) {
    const debt = totalDebt(s);
    $('cash').textContent = fmtMoney(s.cash);
    $('cash').classList.toggle('neg', s.cash < 0);
    $('debt').textContent = fmtMoney(debt);
    $('income').textContent = fmtMoney(Engine.tickIncome(s));
    const left = Math.max(0, Engine.msToNextTick(s, now));
    $('tick-fill').style.width = `${100 - (left / CONFIG.TICK_MS) * 100}%`;
    $('tick-text').textContent = s.cash < 0
      ? `Cash is negative! Work to avoid bankruptcy (${CONFIG.MAX_NEGATIVE_CYCLES - s.negativeCycles} cycles left)`
      : `Next cycle in ${Math.ceil(left / 1000)}s`;

    const pos = Math.max(s.cash, 0), sum = pos + debt || 1;
    $('meter-cash').style.width = `${(pos / sum) * 100}%`;
    $('meter-debt').style.width = `${(debt / sum) * 100}%`;
    $('meter-cash-text').textContent = fmtMoney(s.cash);
    $('meter-debt-text').textContent = fmtMoney(debt);

    document.querySelectorAll('[data-cost]').forEach((b) => { b.disabled = s.cash < Number(b.dataset.cost); });
  },

  renderAll(s) {
    this.refreshHud(s);
    this.renderMap(s);
    this.renderCareer(s);
    this.renderBank(s);
    this.renderModal(s);
    this.renderBuy(s);
  },

  /* ---------- Map tab: pins for every property in an open district ---------- */
  renderMap(s) {
    $('district-tabs').innerHTML = DISTRICTS.map((d) => {
      const open = s.unlockedDistricts.includes(d.id);
      return `<button class="chip${d.id === this.district ? ' active' : ''}${open ? '' : ' locked'}" data-district="${d.id}">${open ? '' : '🔒 '}${d.name}</button>`;
    }).join('');

    const countOwned = (id) => s.properties.filter((p) => findBuilding(p.id).zone === id).length;
    const countAll = (id) => BUILDINGS.filter((b) => b.zone === id).length;

    // Locked districts are dimmed with a label. The selected open district gets a gold outline.
    $('map-zones').innerHTML = DISTRICTS.map((d) => {
      const open = s.unlockedDistricts.includes(d.id), r = d.rect;
      const label = open ? '' : `<div class="zone-label">🔒 ${d.name}<small>Unlocks at ${d.unlockAt} properties owned</small></div>`;
      return `<div class="zone${open ? '' : ' locked'}${d.id === this.district ? ' sel' : ''}" style="left:${r.x}%;top:${r.y}%;width:${r.w}%;height:${r.h}%">${label}</div>`;
    }).join('');

    // One pin per property, placed at the hardcoded x / y of the BUILDINGS array.
    $('map-pins').innerHTML = BUILDINGS.filter((b) => s.unlockedDistricts.includes(b.zone)).map((b) => {
      const key = pinKey(s, b.id);
      return `<button class="pin ${key}${this.building === b.id ? ' sel' : ''}" data-id="${b.id}" style="left:${b.x}%;top:${b.y}%">
        <span class="pin-dot">${PIN_ICON[key]}</span><span class="pin-tag">${b.name}${key === 'sale' ? ` $${fmtShort(b.price)}` : ''}</span></button>`;
    }).join('');

    const d = DISTRICTS.find((x) => x.id === this.district);
    $('district-panel').innerHTML = s.unlockedDistricts.includes(d.id)
      ? `<h2>${d.name}</h2><p class="muted">${countOwned(d.id)} of ${countAll(d.id)} properties owned. Tap a yellow pin to buy, or any other pin to manage that property.</p>`
      : `<h2>${d.name}</h2><p class="muted">Locked. Own ${d.unlockAt} properties to open this district (you own ${s.properties.length}).</p>`;
  },

  // Scrolls the map window so the middle of the district is in view.
  focusDistrict(id, instant) {
    const d = DISTRICTS.find((x) => x.id === id), sc = $('map-scroll'), r = d.rect;
    const cx = ((r.x + r.w / 2) / 100) * WORLD.w, cy = ((r.y + r.h / 2) / 100) * WORLD.h;
    sc.scrollTo({ left: Math.max(0, cx - sc.clientWidth / 2), top: Math.max(0, cy - sc.clientHeight / 2), behavior: instant ? 'auto' : 'smooth' });
  },

  /* ---------- Buy popup (opened by tapping a For Sale pin) ---------- */
  openBuy(id) {
    this.buyId = id;
    $('buy-modal').classList.remove('hidden');
    this.renderBuy(Game.state);
  },

  closeBuy() {
    this.buyId = null;
    $('buy-modal').classList.add('hidden');
  },

  renderBuy(s) {
    if (!this.buyId) return;
    const b = findBuilding(this.buyId);
    if (!b || findProp(s, b.id)) { this.closeBuy(); return; }
    const zone = DISTRICTS.find((d) => d.id === b.zone), short = b.price - s.cash;
    $('buy-title').textContent = b.name;
    $('buy-body').innerHTML = `
      <span class="pill sale">For sale</span>
      <div class="stats">
        <div class="row"><span>District</span><span>${zone.name}</span></div>
        <div class="row"><span>Price</span><strong>${fmtMoney(b.price)}</strong></div>
        <div class="row"><span>Base rent</span><span>${fmtMoney(b.rent)} per cycle</span></div>
        <div class="row"><span>First repair</span><span>${b.repairLabel}, ${fmtMoney(b.repairCost)}</span></div>
      </div>
      ${short > 0 ? `<p class="muted">You need ${fmtMoney(short)} more cash.</p>` : ''}
      ${this.btn('buy', b.id, `Buy for ${fmtMoney(b.price)}`, b.price)}
      <button class="btn ghost" data-act="closebuy">Cancel</button>`;
  },

  /* ---------- Property popup (opened by tapping an owned pin) ---------- */
  openProperty(id) {
    this.openId = id;
    $('property-modal').classList.remove('hidden');
    this.renderModal(Game.state);
  },

  closeProperty() {
    this.openId = null;
    $('property-modal').classList.add('hidden');
  },

  renderModal(s) {
    if (!this.openId) return;
    const p = findProp(s, this.openId);
    if (!p) { this.closeProperty(); return; }
    const b = findBuilding(p.id), key = statusKey(p);
    const swing = Math.round((p.market - 1) * 100);
    $('pm-title').textContent = b.name;

    let actions = '';
    if (p.broken) actions += this.btn('repair', p.id, `Repair for ${fmtMoney(p.fixCost)}`, p.fixCost, 'wide');
    else if (p.status === 'repair') actions += this.btn('repair', p.id, `${p.repairLabel} for ${fmtMoney(p.repairCost)}`, p.repairCost, 'wide');
    if (p.status === 'ready' && !p.broken) {
      actions += this.btn('rent', p.id, `Normal tenant<br>${fmtMoney(tenantRent(p.baseRent, 'normal'))} per cycle`, 0, 'ghost', 'normal');
      actions += this.btn('rent', p.id, `Premium tenant<br>${fmtMoney(tenantRent(p.baseRent, 'premium'))} per cycle`, 0, '', 'premium');
    }
    if (p.status === 'rented') actions += this.btn('evict', p.id, 'Evict tenant', 0, 'ghost wide');
    if (p.status !== 'repair') {
      [1, 2].forEach((lvl) => {
        const done = p.reno >= lvl, cost = renoCost(p, lvl);
        actions += done
          ? `<button class="btn ghost" disabled>${RENO[lvl].name}<br>Done</button>`
          : this.btn('reno', p.id, `Renovate: ${RENO[lvl].name}<br>${fmtMoney(cost)}, +${Math.round(RENO[lvl].bonus * 100)}% rent`, cost, '', String(lvl));
      });
    }
    actions += this.btn('sell', p.id, `Sell for ${fmtMoney(offerOf(p))} (${swing >= 0 ? '+' : ''}${swing}% market)`, 0, 'sell wide');

    $('pm-body').innerHTML = `
      <span class="pill ${key}">${STATUS[key]}</span>
      <div class="stats">
        <div class="row"><span>Rent per cycle</span><strong>${p.status === 'rented' && !p.broken ? fmtMoney(p.rent) : '$0'}</strong></div>
        <div class="row"><span>Base rent</span><span>${fmtMoney(p.baseRent)}</span></div>
        <div class="row"><span>Tenant</span><span>${p.tenant ? (p.tenant === 'premium' ? 'Premium' : 'Normal') : 'None'}</span></div>
        <div class="row"><span>Renovation</span><span>${RENO[p.reno].name}</span></div>
        <div class="row"><span>Invested</span><span>${fmtMoney(p.buyPrice + p.repairCost + p.renoSpent)}</span></div>
      </div>
      <div class="manage">${actions}</div>`;
  },

  /* ---------- Career tab ---------- */
  renderCareer(s) {
    const c = s.career, { path, idx, tier } = Game.jobInfo();
    const degName = (id) => DEGREES.find((d) => d.id === id).name;

    const ladder = path.tiers.map((t, i) => `<div class="row center"><span>${i < idx ? '✓ ' : ''}<strong>${t.name}</strong></span>
      <span>${fmtMoney(t.pay)} per tap ${i === idx ? '<span class="pill rented">Current</span>' : ''}</span></div>`).join('');
    const next = path.tiers[idx + 1];
    const promote = next
      ? this.btn('promote', path.id, `Promote to ${next.name}<br>${fmtMoney(next.fee)} fee, ${fmtMoney(next.pay)} per tap`, next.fee)
      : '<p class="muted">You reached the top of this career.</p>';

    const others = CAREERS.filter((p) => p.id !== path.id).map((p) => {
      const reached = c.tiers[p.id];
      const note = reached === undefined ? `Starts as ${p.tiers[0].name}.` : `You reached: ${p.tiers[reached].name}.`;
      const tail = Game.canSwitch(p)
        ? `<button class="btn ghost" data-act="switch" data-id="${p.id}">Switch to ${p.name}</button>`
        : `<p class="muted">Locked: ${degName(p.needs)} required.</p>`;
      return `<div class="item"><div class="row"><strong>${p.name}</strong><span>${fmtMoney(p.tiers[0].pay)}+ per tap</span></div><p class="muted">${note}</p>${tail}</div>`;
    }).join('');

    const degrees = DEGREES.map((d) => {
      let tail;
      if (c.degrees.includes(d.id)) tail = '<span class="pill ready">Earned</span>';
      else if (c.study && c.study.id === d.id) tail = '<div class="bar"><i id="study-fill"></i></div><p class="muted" id="study-text"></p>';
      else if (d.needs && !c.degrees.includes(d.needs)) tail = `<p class="muted">Locked: ${degName(d.needs)} required.</p>`;
      else if (c.study) tail = '<button class="btn ghost" disabled>Busy studying</button>';
      else tail = this.btn('study', d.id, d.cost ? 'Study' : 'Study (free)', d.cost, 'ghost');
      return `<div class="item"><div class="row"><strong>${d.name}</strong><span>${d.cost ? fmtMoney(d.cost) : 'Free'}, ${d.secs}s</span></div>${tail}</div>`;
    }).join('');

    $('career-root').innerHTML = `
      <div class="panel"><h2>Work</h2>
        <p class="muted">${tier.name} (${path.name}): ${fmtMoney(tier.pay)} per tap</p>
        <button class="btn work-btn" data-act="work">Work +${fmtMoney(tier.pay)}</button></div>
      <div class="panel"><h2>Your career: ${path.name}</h2>${ladder}${promote}</div>
      <div class="panel"><h2>Switch career</h2>${others}</div>
      <div class="panel"><h2>Education</h2>${degrees}</div>`;
    this.tickCareer(s, Date.now());
  },

  // Updates the study progress bar every frame (the rest only re-renders on changes).
  tickCareer(s, now) {
    const st = s.career.study, fill = $('study-fill');
    if (!st || !fill) return;
    const d = DEGREES.find((x) => x.id === st.id), left = Math.max(0, st.endsAt - now);
    fill.style.width = `${100 - (left / (d.secs * 1000)) * 100}%`;
    $('study-text').textContent = `Studying: ${Math.ceil(left / 1000)}s left`;
  },

  /* ---------- Bank tab ---------- */
  renderBank(s) {
    $('loan-list').innerHTML = s.loans.length
      ? s.loans.map((l) => `<div class="row"><span>${l.name}</span><span>${fmtMoney(l.balance)} left, ${fmtMoney(l.payment)} per cycle</span></div>`).join('')
      : '<p class="muted">No active loans.</p>';
    this.drawChart(s);
  },

  // Line graph of cash (gold) and debt (red). Plain canvas, no libraries.
  drawChart(s) {
    const cv = $('finance-chart'), ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height, L = 62, R = 12, T = 14, B = 30;
    const css = getComputedStyle(document.body);
    const col = (name) => css.getPropertyValue(name).trim();
    const pts = s.history;
    ctx.clearRect(0, 0, W, H);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = col('--muted');
    if (pts.length < 2) { ctx.fillText('Collecting data... check back after a couple of cycles.', L, H / 2); return; }

    const vals = pts.flatMap((p) => [p.cash, p.debt]);
    const lo = Math.min(0, ...vals), hi = Math.max(1, ...vals);
    const x = (i) => L + (i / (pts.length - 1)) * (W - L - R);
    const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);

    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const v = lo + ((hi - lo) * i) / 4;
      ctx.strokeStyle = col('--line');
      ctx.beginPath(); ctx.moveTo(L, y(v)); ctx.lineTo(W - R, y(v)); ctx.stroke();
      ctx.fillStyle = col('--muted');
      ctx.fillText((v < 0 ? '-$' : '$') + fmtShort(Math.abs(v)), 4, y(v) + 4);
    }
    ctx.fillStyle = col('--muted');
    ctx.fillText('Time (older  >  newer)', L, H - 8);

    const line = (key, color) => {
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath();
      pts.forEach((p, i) => { if (i) ctx.lineTo(x(i), y(p[key])); else ctx.moveTo(x(i), y(p[key])); });
      ctx.stroke();
    };
    line('debt', col('--red'));
    line('cash', col('--gold'));
  },
};

/* ============================================================
   6. GAME CONTROLLER  (state, loop, player actions)
   ============================================================ */
const Game = {
  state: null,
  loopTimer: null,
  saveTimer: null,

  init() {
    this.state = SaveManager.load() || newState();
    UI.init();
    UI.applyTheme(this.state.lightMode);
    UI.renderAll(this.state);
    if (this.state.hasStarted) this.resume();
    else UI.showLoanScreen();
  },

  // Returning player: collect everything earned while the game was closed.
  resume() {
    const res = Engine.advance(this.state, Date.now());
    this.checkStudy(Date.now());
    if (this.checkBankruptcy()) return;
    SaveManager.save(this.state);
    UI.hideLoanScreen();
    UI.focusDistrict(UI.district, true);
    UI.renderAll(this.state);
    if (res && res.ticks >= 2) UI.showOffline(res);
    this.startLoop();
  },

  startLoop() {
    clearInterval(this.loopTimer);
    clearInterval(this.saveTimer);
    this.loopTimer = setInterval(() => this.frame(), CONFIG.UI_REFRESH_MS);
    this.saveTimer = setInterval(() => SaveManager.save(this.state), CONFIG.AUTOSAVE_MS);
  },

  // Runs 4x per second. Timestamp-based, so background tabs catch up correctly.
  frame() {
    const now = Date.now();
    const res = Engine.advance(this.state, now);
    if (this.checkBankruptcy()) return;
    if (this.checkStudy(now)) UI.renderAll(this.state);
    if (res) {
      SaveManager.save(this.state);
      UI.renderAll(this.state);
      if (res.ticks > 1) UI.showOffline(res);
      else {
        const parts = [];
        if (res.earned > 0) parts.push(`+${fmtMoney(res.earned)} Rent`);
        if (res.paid > 0) parts.push(`-${fmtMoney(res.paid)} Bank Rate`);
        if (res.breaks > 0) parts.push('Breakdown!');
        if (parts.length) UI.toast(parts.join(' | '));
      }
    }
    UI.refreshHud(this.state, now);
    UI.tickCareer(this.state, now);
  },

  // Saves, refreshes everything. Called after every player action.
  commit() {
    this.checkUnlocks();
    Engine.record(this.state, true);
    SaveManager.save(this.state);
    UI.renderAll(this.state);
  },

  checkUnlocks() {
    const s = this.state;
    DISTRICTS.forEach((d) => {
      if (s.properties.length >= d.unlockAt && !s.unlockedDistricts.includes(d.id)) {
        s.unlockedDistricts.push(d.id);
        UI.toast(`${d.name} unlocked: new properties listed`);
      }
    });
  },

  /* ----- Bank ----- */
  // Takes a loan. The very first one starts the game.
  borrow(id) {
    const s = this.state, opt = LOAN_OPTIONS.find((o) => o.id === id);
    if (!opt) return;
    if (s.hasStarted && s.loans.length >= CONFIG.MAX_LOANS) { UI.bankMsg(`You can have at most ${CONFIG.MAX_LOANS} loans at once.`); return; }
    const total = Math.round(opt.amount * (1 + opt.rate));   // principal + interest
    s.cash += opt.amount;
    s.loans.push({ id: `${opt.id}-${Date.now()}`, name: opt.name, principal: opt.amount, balance: total, rate: opt.rate,
      payment: Math.ceil(total / CONFIG.LOAN_TERM_CYCLES) });
    if (!s.hasStarted) {
      s.hasStarted = true;
      s.lastTick = Date.now();
      s.history = [];
      Engine.record(s, false);
      UI.hideLoanScreen();
      UI.focusDistrict(UI.district, true);
      this.startLoop();
    } else {
      UI.bankMsg(`Loan received: ${fmtMoney(opt.amount)}. You owe ${fmtMoney(total)} on it.`);
    }
    this.commit();
  },

  // Pays a custom amount toward the debt, oldest loan first.
  payEarly(raw) {
    const s = this.state, debt = totalDebt(s), amount = Math.floor(Number(raw));
    if (!(amount > 0)) { UI.bankMsg('Enter an amount to pay.'); return; }
    if (debt <= 0) { UI.bankMsg('You have no debt.'); return; }
    const pay = Math.min(amount, debt);
    if (s.cash < pay) { UI.bankMsg(`Not enough cash. You have ${fmtMoney(s.cash)}.`); return; }
    let left = pay;
    for (const l of s.loans) {
      const x = Math.min(l.balance, left);
      l.balance -= x;
      left -= x;
      if (left <= 0) break;
    }
    s.loans = s.loans.filter((l) => l.balance > 0);
    s.cash -= pay;
    s.stats.loanPaid += pay;
    $('pay-amount').value = '';
    UI.bankMsg(`Paid ${fmtMoney(pay)} toward your loans.`);
    this.commit();
  },

  /* ----- Settings ----- */
  toggleTheme() {
    this.state.lightMode = !this.state.lightMode;
    UI.applyTheme(this.state.lightMode);
    this.commit();
  },

  addCash(n) {
    this.state.cash += n;
    UI.toast(`Developer: added ${fmtMoney(n)}`);
    this.commit();
  },

  /* ----- Properties and career actions (all buttons with data-act land here) ----- */
  act(type, id, arg) {
    const s = this.state;
    if (type === 'closebuy') { UI.closeBuy(); return; }
    if (type === 'work') { this.work(); return; }
    if (type === 'switch') { this.switchPath(id); return; }
    if (type === 'promote') { this.promote(); return; }
    if (type === 'study') { this.startStudy(id); return; }

    const b = findBuilding(id), p = findProp(s, id);
    if (!b) return;

    if (type === 'buy') {
      if (p || !s.unlockedDistricts.includes(b.zone) || s.cash < b.price) return;
      s.cash -= b.price;
      s.properties.push({ id, buyPrice: b.price, origRent: b.rent, baseRent: b.rent, repairLabel: b.repairLabel, repairCost: b.repairCost,
        status: 'repair', tenant: null, rent: 0, broken: false, fixCost: 0, reno: 0, renoSpent: 0, market: 1 });
      UI.closeBuy();
      UI.toast(`Bought ${b.name}. Tap its pin to manage it.`);
    } else if (!p) {
      return;
    } else if (type === 'repair') {
      const cost = p.broken ? p.fixCost : p.status === 'repair' ? p.repairCost : -1;
      if (cost < 0 || s.cash < cost) return;
      s.cash -= cost;
      p.broken = false;
      if (p.status === 'repair') p.status = 'ready';
    } else if (type === 'rent') {
      if (p.status !== 'ready' || p.broken) return;
      p.tenant = arg === 'premium' ? 'premium' : 'normal';
      p.rent = tenantRent(p.baseRent, p.tenant);
      p.status = 'rented';
    } else if (type === 'evict') {
      if (p.status !== 'rented') return;
      p.status = 'ready';
      p.tenant = null;
      p.rent = 0;
    } else if (type === 'reno') {
      const lvl = Number(arg);
      if (!RENO[lvl] || lvl <= p.reno || p.status === 'repair') return;
      const cost = renoCost(p, lvl);
      if (s.cash < cost) return;
      s.cash -= cost;
      p.renoSpent += cost;
      p.reno = lvl;
      p.baseRent = baseRentOf(p);
      if (p.status === 'rented') p.rent = tenantRent(p.baseRent, p.tenant);
    } else if (type === 'sell') {
      const offer = offerOf(p);
      s.cash += offer;
      s.properties = s.properties.filter((x) => x.id !== id);
      UI.closeProperty();
      UI.toast(`Sold ${b.name} for ${fmtMoney(offer)}`);
    } else {
      return;
    }
    this.commit();
  },

  /* ----- Career ----- */
  // The player's current path, tier number and tier.
  jobInfo() {
    const c = this.state.career, path = CAREERS.find((p) => p.id === c.path), idx = c.tiers[c.path] || 0;
    return { path, idx, tier: path.tiers[idx] };
  },

  work() {
    const c = this.state.career, now = Date.now();
    if (now - c.lastWork < CONFIG.WORK_COOLDOWN_MS) return;
    c.lastWork = now;
    this.state.cash += this.jobInfo().tier.pay;
    UI.refreshHud(this.state, now);
  },

  // A path can be joined if it needs no degree or you own the degree.
  canSwitch(path) {
    return !path.needs || this.state.career.degrees.includes(path.needs);
  },

  // Switching keeps your progress in every path: going back resumes at your old tier.
  switchPath(id) {
    const c = this.state.career, path = CAREERS.find((p) => p.id === id);
    if (!path || id === c.path || !this.canSwitch(path)) return;
    c.path = id;
    if (c.tiers[id] === undefined) c.tiers[id] = 0;
    this.commit();
  },

  // Pays the fee to move up one tier inside the current path.
  promote() {
    const c = this.state.career, { path, idx } = this.jobInfo(), next = path.tiers[idx + 1];
    if (!next || this.state.cash < next.fee) return;
    this.state.cash -= next.fee;
    c.tiers[path.id] = idx + 1;
    this.commit();
  },

  startStudy(id) {
    const c = this.state.career, d = DEGREES.find((x) => x.id === id);
    if (!d || c.study || c.degrees.includes(id)) return;
    if (d.needs && !c.degrees.includes(d.needs)) return;
    if (this.state.cash < d.cost) return;
    this.state.cash -= d.cost;
    c.study = { id, endsAt: Date.now() + d.secs * 1000 };
    this.commit();
  },

  // Awards a degree once its timer is up (also works after being offline).
  checkStudy(now) {
    const c = this.state.career;
    if (!c.study || now < c.study.endsAt) return false;
    const d = DEGREES.find((x) => x.id === c.study.id);
    c.degrees.push(d.id);
    c.study = null;
    UI.toast(`Degree earned: ${d.name}`);
    SaveManager.save(this.state);
    return true;
  },

  /* ----- Game over / restart ----- */
  checkBankruptcy() {
    if (!this.state.bankrupt) return false;
    alert('Bankruptcy! Your cash stayed below $0 for too long. You lost everything. Starting over.');
    this.reset();
    return true;
  },

  reset() {
    clearInterval(this.loopTimer);
    clearInterval(this.saveTimer);
    SaveManager.wipe();
    const light = this.state.lightMode;
    this.state = newState();
    this.state.lightMode = light;
    UI.closeProperty();
    UI.closeBuy();
    UI.district = 'rustbelt';
    UI.building = null;
    UI.showTab('map');
    UI.renderAll(this.state);
    UI.showLoanScreen();
  },

  // Console helper: Game.debugRewind(120), then reload to test offline progress.
  debugRewind(minutes) {
    this.state.lastTick -= minutes * 60_000;
    SaveManager.save(this.state);
  },
};

document.addEventListener('DOMContentLoaded', () => Game.init());