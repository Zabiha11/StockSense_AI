const $ = (s) => document.querySelector(s);
const els = {
  apiBase: $('#apiBase'), dot: $('#statusDot'), statusText: $('#statusText'),
  search: $('#search'), list: $('#list'), count: $('#count'), more: $('#more'),
  empty: $('#empty'), content: $('#content'), name: $('#pName'), chips: $('#pChips'),
  chart: $('#chart'), tip: $('#tip'), wrap: $('#chartWrap'), fSummary: $('#fSummary'),
  form: $('#riskForm'), error: $('#formError'), result: $('#result'),
};

const PAGE = 40;
let API = window.location.origin;
let products = [], filtered = [], shown = 0, selected = null;


els.apiBase.value = API;

/* ---------- helpers ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n, d = 0) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });

async function api(path) {
  const res = await fetch(API.replace(/\/$/, '') + path);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(errMsg(data) || `Request failed (${res.status})`);
  return data;
}
function errMsg(d) {
  if (!d || !d.detail) return '';
  if (typeof d.detail === 'string') return d.detail;
  return d.detail.map((x) => `${(x.loc || []).slice(-1)[0]}: ${x.msg}`).join(', ');
}

function countUp(el, to, dec = 0, ms = 1100) {
  const start = performance.now();
  const tick = (t) => {
    const p = Math.min((t - start) / ms, 1), e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(to * e, dec);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- connection + products ---------- */
async function connect() {
  els.dot.className = 'dot'; els.statusText.textContent = 'Connecting';
  els.list.innerHTML = '<li class="skeleton"></li>'.repeat(6);
  try {
    await api('/');
    els.dot.className = 'dot ok'; els.statusText.textContent = 'Connected';
    products = await api('/products');
    els.search.value = '';
    applyFilter();
  } catch (e) {
    els.dot.className = 'dot bad'; els.statusText.textContent = 'Offline';
    els.list.innerHTML = '';
    els.count.textContent = 'Could not reach the API. Check the address above and that uvicorn is running.';
    els.more.hidden = true;
  }
}

function applyFilter() {
  const q = els.search.value.trim().toLowerCase();
  filtered = products.filter((p) => !q || String(p.Description).toLowerCase().includes(q) || String(p.StockCode).toLowerCase().includes(q));
  shown = 0; els.list.innerHTML = '';
  renderMore();
  els.count.textContent = filtered.length ? `${fmt(filtered.length)} product${filtered.length === 1 ? '' : 's'}` : 'No products match that search.';
}

function chipsFor(p) {
  return Object.entries(p)
    .filter(([k, v]) => !['StockCode', 'Description'].includes(k) && v !== '' && !isNaN(v))
    .slice(0, 3).map(([k, v]) => `${k.replace(/([a-z])([A-Z])/g, '$1 $2')}: ${fmt(v, 1)}`);
}

function renderMore() {
  const slice = filtered.slice(shown, shown + PAGE);
  slice.forEach((p, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.className = 'item' + (p.StockCode === selected ? ' active' : '');
    b.dataset.code = p.StockCode;
    b.style.animationDelay = `${Math.min(i, 14) * 40}ms`;
    b.innerHTML = `<b>${esc(p.Description || 'Unnamed product')}</b><small>${esc(p.StockCode)}</small>`;
    li.appendChild(b); els.list.appendChild(li);
  });
  shown += slice.length;
  els.more.hidden = shown >= filtered.length;
}

els.list.addEventListener('click', (e) => {
  const b = e.target.closest('.item'); if (!b) return;
  const p = products.find((x) => x.StockCode === b.dataset.code);
  document.querySelectorAll('.item.active').forEach((x) => x.classList.remove('active'));
  b.classList.add('active');
  openProduct(p);
});
els.more.addEventListener('click', renderMore);
let t; els.search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(applyFilter, 180); });
els.apiBase.addEventListener('change', () => { API = els.apiBase.value.trim(); localStorage.setItem('stocksense_api', API); connect(); });

/* ---------- product detail ---------- */
async function openProduct(p) {
  selected = p.StockCode;
  els.empty.hidden = true; els.content.hidden = false;
  els.content.style.animation = 'none'; void els.content.offsetWidth; els.content.style.animation = '';
  els.name.textContent = p.Description || 'Unnamed product';
  els.chips.innerHTML = [`Code ${esc(p.StockCode)}`, ...chipsFor(p).map(esc)].map((c) => `<span class="chip">${c}</span>`).join('');
  els.result.innerHTML = ''; els.error.textContent = '';
  els.fSummary.textContent = 'Loading forecast';
  els.chart.innerHTML = '';
  if (window.innerWidth <= 900) $('#detail').scrollIntoView({ behavior: 'smooth' });
  try {
    const rows = await api(`/forecast/${encodeURIComponent(p.StockCode)}`);
    drawChart(rows);
  } catch (e) {
    els.fSummary.textContent = e.message;
  }
}

function drawChart(rows) {
  const W = 640, H = 240, pad = { l: 40, r: 12, t: 14, b: 26 };
  const vals = rows.map((r) => +r.PredictedUnits);
  const max = Math.max(...vals, 1) * 1.15;
  const step = (W - pad.l - pad.r) / Math.max(rows.length - 1, 1);
  const X = (i) => pad.l + i * step, Y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const total = vals.reduce((a, b) => a + b, 0);
  els.fSummary.textContent = `${rows.length} days, about ${fmt(total)} units in total`;

  let d = `M${X(0)} ${Y(vals[0])}`;
  for (let i = 1; i < vals.length; i++) {
    const mx = (X(i - 1) + X(i)) / 2;
    d += ` C${mx} ${Y(vals[i - 1])} ${mx} ${Y(vals[i])} ${X(i)} ${Y(vals[i])}`;
  }
  const area = `${d} L${X(vals.length - 1)} ${H - pad.b} L${X(0)} ${H - pad.b}Z`;
  const fmtDate = (s) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  let grid = '';
  for (let i = 0; i <= 3; i++) {
    const v = (max / 3) * i, y = Y(v);
    grid += `<line class="grid-line" x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}"/><text class="axis" x="${pad.l - 8}" y="${y + 4}" text-anchor="end">${fmt(v)}</text>`;
  }
  const mid = Math.floor(rows.length / 2);
  const xl = [[0, 'start'], [mid, 'middle'], [rows.length - 1, 'end']].map(([i, a]) => `<text class="axis" x="${X(i)}" y="${H - 6}" text-anchor="${a}">${fmtDate(rows[i].Date)}</text>`).join('');

  els.chart.innerHTML = `
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8fb8" stop-opacity=".35"/><stop offset="1" stop-color="#ff8fb8" stop-opacity="0"/></linearGradient></defs>
    ${grid}${xl}
    <path class="area" d="${area}" fill="url(#g)"/>
    <path class="line" d="${d}"/>
    <line class="hover-line" id="hl" y1="${pad.t}" y2="${H - pad.b}"/>
    <circle id="hd" r="5" fill="#ffd6e5" stroke="#f0568f" stroke-width="2" opacity="0"/>`;

  const line = els.chart.querySelector('.line'), len = line.getTotalLength();
  line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
  void line.getBoundingClientRect();
  line.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.22,1,.36,1)';
  line.style.strokeDashoffset = 0;
  els.chart.querySelector('.area').classList.add('in');

  const hl = $('#hl'), hd = $('#hd');
  els.chart.onmousemove = (e) => {
    const r = els.chart.getBoundingClientRect();
    const i = Math.max(0, Math.min(rows.length - 1, Math.round(((e.clientX - r.left) * W / r.width - pad.l) / step)));
    hl.setAttribute('x1', X(i)); hl.setAttribute('x2', X(i)); hl.style.opacity = 1;
    hd.setAttribute('cx', X(i)); hd.setAttribute('cy', Y(vals[i])); hd.setAttribute('opacity', 1);
    els.tip.style.left = `${(X(i) / W) * 100}%`;
    els.tip.style.top = `${(Y(vals[i]) / H) * els.chart.clientHeight}px`;
    els.tip.innerHTML = `${fmtDate(rows[i].Date)}: <b>${fmt(vals[i], 1)}</b> units`;
    els.tip.style.opacity = 1;
  };
  els.chart.onmouseleave = () => { hl.style.opacity = 0; hd.setAttribute('opacity', 0); els.tip.style.opacity = 0; };
}

/* ---------- risk ---------- */
els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.error.textContent = ''; els.result.innerHTML = '';
  const f = new FormData(els.form), stock = f.get('current_stock');
  if (stock === '' || +stock < 0) {
    const inp = els.form.elements.current_stock;
    inp.classList.remove('field-bad'); void inp.offsetWidth; inp.classList.add('field-bad'); inp.focus();
    els.error.textContent = 'Enter your current stock, 0 or more.'; return;
  }
  const qs = new URLSearchParams({ current_stock: stock, on_order: f.get('on_order') || 0, lead_time_days: f.get('lead_time_days') || 7, service_level: f.get('service_level') });
  const btn = els.form.querySelector('button'); btn.disabled = true; btn.textContent = 'Checking';
  try {
    const r = await api(`/risk/${encodeURIComponent(selected)}?${qs}`);
    showRisk(r);
    els.result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    els.error.textContent = err.message;
  } finally { btn.disabled = false; btn.textContent = 'Check risk'; }
});

function showRisk(r) {
  const level = r.RiskLevel.toLowerCase();
  const pos = r.CurrentStock + r.OnOrder;
  const scale = Math.max(r.ReorderPoint, r.ForecastLeadTimeDemand, pos, 1) * 1.25;
  const pct = (v) => Math.min(100, (v / scale) * 100);
  const verdict = {
    high: `This won't cover the next ${r.LeadTimeDays} days. Order about ${fmt(r.RecommendedOrderQty)} units now.`,
    medium: `You'll cover demand, but with little buffer. Order about ${fmt(r.RecommendedOrderQty)} units to stay safe.`,
    low: `You're covered for the next ${r.LeadTimeDays} days. No order needed yet.`,
  }[level];

  els.result.className = `result risk-${level}`;
  els.result.innerHTML = `
    <span class="badge">${level[0].toUpperCase() + level.slice(1)} risk</span>
    <p class="verdict">${esc(verdict)}</p>
    <div class="meter">
      <div class="fill"></div>
      <div class="tick up" style="left:${pct(r.ForecastLeadTimeDemand)}%"><span>Expected demand</span></div>
      <div class="tick" style="left:${pct(r.ReorderPoint)}%"><span>Reorder point</span></div>
    </div>
    <div class="stats">
      <div class="stat"><small>Stock + on order</small><b data-n="${pos}">0</b></div>
      <div class="stat"><small>Expected demand</small><b data-n="${r.ForecastLeadTimeDemand}" data-d="1">0</b></div>
      <div class="stat"><small>Safety stock</small><b data-n="${r.SafetyStock}" data-d="1">0</b></div>
      <div class="stat"><small>Reorder point</small><b data-n="${r.ReorderPoint}">0</b></div>
      <div class="stat"><small>Suggested order</small><b data-n="${r.RecommendedOrderQty}">0</b></div>
    </div>
    <p class="note">${esc(r.Note)}</p>`;
  requestAnimationFrame(() => { els.result.querySelector('.fill').style.width = pct(pos) + '%'; });
  els.result.querySelectorAll('[data-n]').forEach((el) => countUp(el, +el.dataset.n, +(el.dataset.d || 0)));
}

connect();