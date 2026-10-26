/* =========================================================================
 * charts.js — Gráficos interativos em SVG puro (sem dependências externas)
 * -------------------------------------------------------------------------
 * Renderiza gráficos de rosca (doughnut), barras horizontais e barras
 * verticais, todos em SVG inline, com tooltip, hover e legenda rica.
 * ========================================================================= */

const ChartPalette = {
  emAndamento: '#1f5bd8',
  proximo: '#d97706',
  venceHoje: '#e04444',
  prorrogado: '#7c3aed',
  vencido: '#c22626',
  concluido: '#0e9f6e',
  neutro: '#94a3b8'
};

function el(tag, attrs, children) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
  (children || []).forEach(c => e.appendChild(c));
  return e;
}

function _tooltipFor(container) {
  let tt = container.querySelector('.chart-tooltip');
  if (!tt) { tt = document.createElement('div'); tt.className = 'chart-tooltip'; container.appendChild(tt); }
  return tt;
}
function _showTip(container, tt, x, y, html) {
  tt.innerHTML = html; tt.style.opacity = '1'; tt.style.left = x + 'px'; tt.style.top = y + 'px';
}
function _hideTip(tt) { tt.style.opacity = '0'; }

/* ---------------- Doughnut chart (Processos por status) ---------------- */
function renderDoughnut(container, items) {
  container.classList.add('chart-wrap', 'chart-doughnut');
  container.innerHTML = '';
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) { container.innerHTML = '<div class="empty-state">Sem dados</div>'; return; }
  const size = 200, r = 76, stroke = 28;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const svg = el('svg', { viewBox: '0 0 ' + size + ' ' + size, width: size, height: size, style: 'display:block;margin:0 auto;' });
  const tt = _tooltipFor(container);

  svg.appendChild(el('circle', { cx, cy, r, fill: 'none', stroke: '#eef2f7', 'stroke-width': stroke }));

  let offset = 0;
  const segments = items.map(item => {
    const frac = item.value / total;
    const len = frac * circ;
    const seg = { ...item, dash: len + ' ' + (circ - len), dashoffset: -offset };
    offset += len;
    return seg;
  });

  segments.forEach(seg => {
    const circle = el('circle', {
      cx, cy, r, fill: 'none', stroke: seg.color, 'stroke-width': stroke,
      'stroke-dasharray': seg.dash, 'stroke-dashoffset': seg.dashoffset,
      'stroke-linecap': 'round',
      transform: 'rotate(-90 ' + cx + ' ' + cy + ')',
      style: 'transition: opacity .15s, stroke-width .15s; cursor: pointer;'
    });
    circle.addEventListener('mouseenter', (e) => {
      circle.setAttribute('stroke-width', stroke + 6);
      const rect = container.getBoundingClientRect();
      _showTip(container, tt, e.clientX - rect.left + 10, e.clientY - rect.top - 30,
        '<strong>' + seg.label + '</strong><br>' + seg.value + ' processo' + (seg.value !== 1 ? 's' : '') + ' (' + Math.round(seg.value / total * 100) + '%)');
    });
    circle.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      tt.style.left = (e.clientX - rect.left + 10) + 'px'; tt.style.top = (e.clientY - rect.top - 30) + 'px';
    });
    circle.addEventListener('mouseleave', () => { circle.setAttribute('stroke-width', stroke); _hideTip(tt); });
    if (seg.onClick) circle.addEventListener('click', () => seg.onClick());
    svg.appendChild(circle);
  });

  const center = el('g', {});
  center.appendChild(el('text', { x: cx, y: cy - 4, 'text-anchor': 'middle', 'font-size': '30', 'font-weight': '800', fill: '#1c2a3a' }, [document.createTextNode(String(total))]));
  center.appendChild(el('text', { x: cx, y: cy + 16, 'text-anchor': 'middle', 'font-size': '11', fill: '#7c8ba0' }, [document.createTextNode('processos')]));
  svg.appendChild(center);
  container.appendChild(svg);

  const legend = document.createElement('div');
  legend.className = 'chart-legend';
  items.forEach(it => {
    const item = document.createElement('div');
    item.className = 'chart-legend-item';
    const pct = Math.round(it.value / total * 100);
    item.innerHTML = '<span class="swatch" style="background:' + it.color + '"></span>' +
      '<span class="lname">' + it.label + '</span>' +
      '<span class="lval">' + it.value + '</span>' +
      '<span class="lpct">' + pct + '%</span>';
    if (it.onClick) item.addEventListener('click', () => it.onClick());
    legend.appendChild(item);
  });
  container.appendChild(legend);
}

/* ---------------- Horizontal bar chart (Processos por área) ---------------- */
function renderHBarChart(container, items) {
  container.classList.add('chart-wrap');
  container.innerHTML = '';
  const max = Math.max(1, ...items.map(i => i.value));
  const barH = 26, gap = 12, labelW = 150, valW = 30;
  const width = 460, height = items.length * (barH + gap);
  const svg = el('svg', { viewBox: '0 0 ' + width + ' ' + height, width: '100%', height: height, style: 'display:block;' });
  const tt = _tooltipFor(container);

  items.forEach((item, idx) => {
    const y = idx * (barH + gap);
    const w = (item.value / max) * (width - labelW - valW);
    const lbl = el('text', { x: 0, y: y + barH / 2 + 4, 'font-size': '12', fill: '#4a5a6e', 'text-anchor': 'start' }, [document.createTextNode(item.label)]);
    svg.appendChild(lbl);
    svg.appendChild(el('rect', { x: labelW, y, width: width - labelW - valW, height: barH, rx: 8, fill: '#eef2f7' }));
    const bar = el('rect', { x: labelW, y, width: w, height: barH, rx: 8, fill: item.color || ChartPalette.emAndamento, style: 'transition: width .5s cubic-bezier(.2,.7,.3,1); cursor: pointer;' });
    bar.addEventListener('mouseenter', (e) => {
      const rect = container.getBoundingClientRect();
      _showTip(container, tt, e.clientX - rect.left + 10, e.clientY - rect.top - 30, '<strong>' + item.label + '</strong><br>' + item.value + ' processo' + (item.value !== 1 ? 's' : ''));
    });
    bar.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      tt.style.left = (e.clientX - rect.left + 10) + 'px'; tt.style.top = (e.clientY - rect.top - 30) + 'px';
    });
    bar.addEventListener('mouseleave', () => _hideTip(tt));
    if (item.onClick) bar.addEventListener('click', () => item.onClick());
    svg.appendChild(bar);
    if (item.value > 0) {
      svg.appendChild(el('text', { x: labelW + w + 8, y: y + barH / 2 + 4, 'font-size': '12', 'font-weight': '700', fill: '#1c2a3a' }, [document.createTextNode(String(item.value))]));
    }
  });
  container.appendChild(svg);
}

/* ---------------- Vertical bar chart (Evolução de vencimentos) ---------------- */
function renderVBarChart(container, labels, values, opts) {
  container.classList.add('chart-wrap');
  container.innerHTML = '';
  opts = opts || {};
  const max = Math.max(1, ...values);
  const width = 460, height = 200;
  const padTop = 26, padBottom = 26;
  const plotH = height - padTop - padBottom;
  const svg = el('svg', { viewBox: '0 0 ' + width + ' ' + height, width: '100%', height: height, style: 'display:block;' });
  const tt = _tooltipFor(container);

  for (let g = 0; g <= 4; g++) {
    const gy = padTop + (plotH * g / 4);
    svg.appendChild(el('line', { x1: 0, y1: gy, x2: width, y2: gy, stroke: '#eef2f7', 'stroke-width': 1 }));
  }

  const n = labels.length;
  const step = width / n;
  const barW = Math.min(40, step * 0.5);

  labels.forEach((label, i) => {
    const v = values[i];
    const x = i * step + (step - barW) / 2;
    const h = (v / max) * plotH;
    const y = padTop + (plotH - h);
    const bar = el('rect', { x, y, width: barW, height: Math.max(h, 0), rx: 6, fill: opts.color || ChartPalette.emAndamento, style: 'transition: opacity .15s; cursor: pointer;' });
    bar.addEventListener('mouseenter', (e) => {
      const rect = container.getBoundingClientRect();
      _showTip(container, tt, e.clientX - rect.left + 10, e.clientY - rect.top - 30, '<strong>' + label + '</strong><br>' + v + ' processo' + (v !== 1 ? 's' : ''));
    });
    bar.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      tt.style.left = (e.clientX - rect.left + 10) + 'px'; tt.style.top = (e.clientY - rect.top - 30) + 'px';
    });
    bar.addEventListener('mouseleave', () => _hideTip(tt));
    svg.appendChild(bar);
    if (v > 0) {
      svg.appendChild(el('text', { x: i * step + step / 2, y: y - 6, 'text-anchor': 'middle', 'font-size': '11', 'font-weight': '700', fill: '#1c2a3a' }, [document.createTextNode(String(v))]));
    }
    const lbl = el('text', { x: i * step + step / 2, y: height - 8, 'text-anchor': 'middle', 'font-size': '10.5', fill: '#7c8ba0' }, [document.createTextNode(label)]);
    svg.appendChild(lbl);
  });
  container.appendChild(svg);
}

/* ---------------- Area/line chart (Evolução de vencimentos) ---------------- */
function renderAreaChart(container, labels, values, opts) {
  container.classList.add('chart-wrap');
  container.innerHTML = '';
  opts = opts || {};
  const max = Math.max(1, ...values);
  const width = 460, height = 210;
  const padTop = 26, padBottom = 30, padLeft = 30, padRight = 12;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const svg = el('svg', { viewBox: '0 0 ' + width + ' ' + height, width: '100%', height: height, style: 'display:block;' });
  const tt = _tooltipFor(container);
  const color = opts.color || ChartPalette.emAndamento;

  // Grid horizontal + eixo Y
  for (let g = 0; g <= 4; g++) {
    const gy = padTop + (plotH * g / 4);
    svg.appendChild(el('line', { x1: padLeft, y1: gy, x2: width - padRight, y2: gy, stroke: '#eef2f7', 'stroke-width': 1 }));
    svg.appendChild(el('text', { x: padLeft - 6, y: gy + 3, 'text-anchor': 'end', 'font-size': '9.5', fill: '#7c8ba0' },
      [document.createTextNode(String(Math.round(max * (1 - g / 4))))]));
  }

  const n = labels.length;
  const step = n > 1 ? plotW / (n - 1) : plotW;
  const points = values.map((v, i) => ({
    x: padLeft + i * step,
    y: padTop + (plotH - (v / max) * plotH),
    v
  }));

  // Área preenchida
  if (points.length > 0) {
    const baseY = padTop + plotH;
    let areaPath = 'M ' + points[0].x + ' ' + baseY;
    points.forEach(p => { areaPath += ' L ' + p.x + ' ' + p.y; });
    areaPath += ' L ' + points[points.length - 1].x + ' ' + baseY + ' Z';
    svg.appendChild(el('path', { d: areaPath, fill: color, 'fill-opacity': '0.12' }));

    // Linha
    const linePath = 'M ' + points.map(p => p.x + ' ' + p.y).join(' L ');
    svg.appendChild(el('path', { d: linePath, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
  }

  // Pontos + rótulos
  points.forEach((pt, i) => {
    if (pt.v > 0) {
      svg.appendChild(el('text', { x: pt.x, y: pt.y - 10, 'text-anchor': 'middle', 'font-size': '10.5', 'font-weight': '700', fill: '#1c2a3a' },
        [document.createTextNode(String(pt.v))]));
    }
    const circle = el('circle', { cx: pt.x, cy: pt.y, r: 4, fill: '#fff', stroke: color, 'stroke-width': 2.5, style: 'cursor:pointer;transition:r .12s;' });
    circle.addEventListener('mouseenter', (e) => {
      circle.setAttribute('r', 6);
      const rect = container.getBoundingClientRect();
      _showTip(container, tt, e.clientX - rect.left + 10, e.clientY - rect.top - 30,
        '<strong>' + labels[i] + '</strong><br>' + pt.v + ' processo' + (pt.v !== 1 ? 's' : ''));
    });
    circle.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      tt.style.left = (e.clientX - rect.left + 10) + 'px'; tt.style.top = (e.clientY - rect.top - 30) + 'px';
    });
    circle.addEventListener('mouseleave', () => { circle.setAttribute('r', 4); _hideTip(tt); });
    svg.appendChild(circle);
    svg.appendChild(el('text', { x: pt.x, y: height - 8, 'text-anchor': 'middle', 'font-size': '10', fill: '#7c8ba0' },
      [document.createTextNode(labels[i])]));
  });

  container.appendChild(svg);
}

window.ChartPalette = ChartPalette;
window.renderDoughnut = renderDoughnut;
window.renderHBarChart = renderHBarChart;
window.renderVBarChart = renderVBarChart;
window.renderAreaChart = renderAreaChart;
