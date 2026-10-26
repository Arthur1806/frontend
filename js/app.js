/* =========================================================================
 * app.js — Controlador da interface (SPA com roteamento por hash)
 * ========================================================================= */

const App = (() => {
  const views = ['dashboard', 'processos', 'processo', 'calendario', 'configuracoes', 'selecao'];
  let state = {
    route: 'dashboard',
    processoNup: null,
    modulo: null,
    filtros: { area: '', status: '', periodo: '30', prorrogado: 'todos', busca: '' },
    sort: { key: 'prazo', dir: 'asc' }
  };

  /* ---------- Helpers ---------- */
  function $ (sel, root) { return (root || document).querySelector(sel); }
  function $$ (sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function fmtData(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return d + '/' + m + '/' + y;
  }
  function fmtDataLonga(iso) {
    if (!iso) return '—';
    const dt = new Date(iso + 'T12:00:00');
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const STATUS_META = {
    'Em andamento': { cls: 'em-andamento', cor: ChartPalette.emAndamento, soft: '#e7effd' },
    'Próximo do vencimento': { cls: 'proximo', cor: ChartPalette.proximo, soft: '#fdf1de' },
    'Vence hoje': { cls: 'vence-hoje', cor: ChartPalette.venceHoje, soft: '#fde7e7' },
    'Prorrogado': { cls: 'prorrogado', cor: ChartPalette.prorrogado, soft: '#f0e9fd' },
    'Vencido': { cls: 'vencido', cor: ChartPalette.vencido, soft: '#fbe3e3' },
    'Concluído': { cls: 'concluido', cor: ChartPalette.concluido, soft: '#e2f6ee' }
  };

  function badge(status) {
    const m = STATUS_META[status] || { cls: 'em-andamento' };
    return '<span class="badge badge-' + m.cls + '"><span class="b-dot"></span>' + esc(status) + '</span>';
  }

  function statusDe(p) { return Dados.derivarStatus(p); }
  function vencimentoDe(p) { return p.novaDataResposta || p.prazoResposta; }

  function processosComStatus() {
    return PROCESSOS.map(p => ({ ...p, statusDerivado: statusDe(p), vencimento: vencimentoDe(p) }));
  }

  /* ---------- Ícones ---------- */
  const ICONS = {
    total: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5h16v14H4z" stroke="currentColor" stroke-width="1.6"/><path d="M8 3v4M16 3v4M4 9h16" stroke="currentColor" stroke-width="1.6"/></svg>',
    andamento: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6"/><path d="M12 8v4l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    proximo: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l9 9-9 9M21 12H3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    venceHoje: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v6M12 16.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    prorrogado: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 108-8M20 8V4h-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    vencido: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    concluido: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 12.5l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M4 7l8 6 8-6" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    alerta: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l9 16H3L12 3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 10v4M12 17v.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 12.5l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  /* ---------- Roteamento ---------- */
  function parseHash() {
    const h = (location.hash || '').replace(/^#\//, '');
    const parts = h.split('/');
    return { route: parts[0] || 'dashboard', param: parts[1] ? decodeURIComponent(parts[1]) : null };
  }
  function navigate(route, param) {
    if (param != null) location.hash = '#/' + route + '/' + encodeURIComponent(param);
    else location.hash = '#/' + route;
  }
  function setActiveNav(route) {
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.route === route));
    const titles = { dashboard: 'Dashboard', processos: 'Processos', processo: 'Detalhe do processo', calendario: 'Calendário', configuracoes: 'Configurações' };
    const subtitles = {
      dashboard: 'Visão geral dos prazos e das ações prioritárias.',
      processos: 'Lista completa de processos com filtros e ordenação.',
      processo: 'Acompanhamento, timeline e comunicações do processo.',
      calendario: 'Vencimentos, lembretes e prorrogações no mês.',
      configuracoes: 'Regras de prazo, áreas, feriados e modelos de e-mail.'
    };
    $('#pageTitle').textContent = titles[route] || 'Dashboard';
    const sub = $('#pageSubtitle'); if (sub) sub.textContent = subtitles[route] || '';
    const dt = $('#pageHeadDate'); if (dt) dt.textContent = fmtDataLonga(Dados.hojeISO);
  }

  function nomeModulo() { return state.modulo === 'lai' ? 'LAI' : 'Ouvidoria'; }
  function updateBrand() {
    const bt = $('.brand-title'); if (bt) bt.textContent = nomeModulo();
    const sub = $('.brand-sub'); if (sub) sub.textContent = 'Monitoramento de Prazos';
  }

  function render() {
    const p = parseHash();
    if (!state.modulo && p.route !== 'selecao') { navigate('selecao'); return; }
    state.route = p.route;
    state.processoNup = p.param;
    document.body.classList.toggle('is-landing', p.route === 'selecao');
    updateBrand();
    setActiveNav(p.route);
    const content = $('#content');
    switch (p.route) {
      case 'selecao': content.innerHTML = renderSelecao(); bindSelecao(); break;
      case 'dashboard': content.innerHTML = renderDashboard(); bindDashboard(); break;
      case 'processos': content.innerHTML = renderProcessos(); bindProcessos(); break;
      case 'processo': content.innerHTML = renderProcesso(p.param); bindProcesso(p.param); break;
      case 'calendario': content.innerHTML = renderCalendario(); bindCalendario(); break;
      case 'configuracoes': content.innerHTML = renderConfiguracoes(); break;
      default: content.innerHTML = renderDashboard(); bindDashboard();
    }
    window.scrollTo(0, 0);
  }

  /* ---------- Dashboard ---------- */
  function contar() {
    const list = processosComStatus();
    const c = {
      total: list.length,
      emAndamento: 0, proximo: 0, venceHoje: 0, prorrogado: 0, vencido: 0, concluido: 0,
      pendenteConfirmacao: 0, ultimoDiaProrrogacao: 0, emailsPreparar: 0
    };
    const hojeISO = Dados.hojeISO;
    list.forEach(p => {
      const st = p.statusDerivado;
      if (st === 'Em andamento') c.emAndamento++;
      else if (st === 'Próximo do vencimento') c.proximo++;
      else if (st === 'Vence hoje') c.venceHoje++;
      else if (st === 'Prorrogado') c.prorrogado++;
      else if (st === 'Vencido') c.vencido++;
      else if (st === 'Concluído') c.concluido++;

      const lembrete = Dados.calcularLembrete(p.vencimento);
      if (lembrete === hojeISO && st !== 'Concluído') c.ultimoDiaProrrogacao++;
      if (p.vencimento === hojeISO) c.emailsPreparar++;
    });
    c.emailsPreparar = c.venceHoje;
    return c;
  }
  /* ▶ NOVO — Distribuição de processos por proximidade do vencimento (dias úteis). */
function distribuirPorUrgencia(list) {
  const buckets = {
    'Vencidos':       { count: 0, color: ChartPalette.vencido },
    'Vencem hoje':    { count: 0, color: ChartPalette.venceHoje },
    '1–3 dias úteis': { count: 0, color: ChartPalette.proximo },
    '4–7 dias úteis': { count: 0, color: '#f59e0b' },
    '8–15 dias úteis':{ count: 0, color: ChartPalette.emAndamento },
    '16+ dias úteis': { count: 0, color: ChartPalette.concluido }
  };
  list.filter(p => p.statusDerivado !== 'Concluído').forEach(p => {
    if (p.vencimento < Dados.hojeISO) buckets['Vencidos'].count++;
    else if (p.vencimento === Dados.hojeISO) buckets['Vencem hoje'].count++;
    else {
      const d = Dados.diasUteisRestantes(p.vencimento, Dados.hojeISO);
      if (d <= 3) buckets['1–3 dias úteis'].count++;
      else if (d <= 7) buckets['4–7 dias úteis'].count++;
      else if (d <= 15) buckets['8–15 dias úteis'].count++;
      else buckets['16+ dias úteis'].count++;
    }
  });
  return Object.entries(buckets).map(([label, v]) => ({ label, value: v.count, color: v.color }));
}
  function renderHero(c) {
    const h = new Date().getHours();
    const saud = h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    const stats = [
      { v: c.total, l: 'Total de processos', cor: '#475569', soft: '#eef1f6', status: '' },
      { v: c.emAndamento, l: 'Em andamento', cor: '#1f5bd8', soft: '#e7effd', status: 'Em andamento' },
      { v: c.proximo, l: 'Próximos do venc.', cor: '#d97706', soft: '#fdf1e2', status: 'Próximo do vencimento' },
      { v: c.venceHoje, l: 'Vencem hoje', cor: '#e04444', soft: '#fde7e7', status: 'Vence hoje' },
      { v: c.vencido, l: 'Vencidos', cor: '#c22626', soft: '#f9e3e3', status: 'Vencido' }
    ];
    const statHtml = stats.map(s =>
      '<div class="hero-stat" role="button" tabindex="0" data-status="' + s.status + '" style="--hc:' + s.cor + ';--hs:' + s.soft + '">' +
        '<span class="hero-stat-dot"></span>' +
        '<div class="v">' + s.v + '</div>' +
        '<div class="l">' + s.l + '</div>' +
      '</div>'
    ).join('');
    return '<div class="hero">' +
      '<div class="hero-top">' +
        '<div>' +
          '<div class="hero-greeting">' + saud + ' · ' + fmtDataLonga(Dados.hojeISO) + '</div>' +
          '<h2 class="hero-title">Monitoramento de prazos da ' + nomeModulo() + '</h2>' +
          '<p class="hero-desc">' + c.emAndamento + ' processos em andamento, ' + c.proximo + ' próximos do vencimento e ' + c.venceHoje + ' vencem hoje.</p>' +
        '</div>' +
        '<button class="hero-cta" data-hero-cta="processos">' + ICONS.proximo + ' Ver processos</button>' +
      '</div>' +
      '<div class="hero-stats">' + statHtml + '</div>' +
    '</div>';
  }

  function renderKpi(c) {
    const items = [
      { label: 'Total de processos', value: c.total, icon: ICONS.total, cor: ChartPalette.emAndamento, soft: '#e7effd', route: 'processos', param: null },
      { label: 'Em andamento', value: c.emAndamento, icon: ICONS.andamento, cor: ChartPalette.emAndamento, soft: '#e7effd', route: 'processos', param: 'st:em-andamento' },
      { label: 'Próximos do vencimento', value: c.proximo, icon: ICONS.proximo, cor: ChartPalette.proximo, soft: '#fdf1de', route: 'processos', param: 'st:proximo' },
      { label: 'Vencendo hoje', value: c.venceHoje, icon: ICONS.venceHoje, cor: ChartPalette.venceHoje, soft: '#fde7e7', route: 'processos', param: 'st:vence-hoje' },
      { label: 'Prorrogados', value: c.prorrogado, icon: ICONS.prorrogado, cor: ChartPalette.prorrogado, soft: '#f0e9fd', route: 'processos', param: 'st:prorrogado' },
      { label: 'Vencidos', value: c.vencido, icon: ICONS.vencido, cor: ChartPalette.vencido, soft: '#fbe3e3', route: 'processos', param: 'st:vencido' },
      { label: 'Concluídos', value: c.concluido, icon: ICONS.concluido, cor: ChartPalette.concluido, soft: '#e2f6ee', route: 'processos', param: 'st:concluido' },
      { label: 'E-mails pendentes', value: c.pendenteConfirmacao, icon: ICONS.email, cor: '#64748b', soft: '#eef2f7', route: 'processos', param: null }
    ];
    return '<div class="kpi-grid">' + items.map(it =>
      '<div class="kpi-card clickable" style="--kpi-color:' + it.cor + ';--kpi-soft:' + it.soft + '" data-route="' + it.route + '" data-param="' + (it.param || '') + '">' +
        '<div class="kpi-top"><div class="kpi-icon">' + it.icon + '</div></div>' +
        '<div class="kpi-value">' + it.value + '</div>' +
        '<div class="kpi-label">' + it.label + '</div>' +
      '</div>').join('') + '</div>';
  }

  function renderAcoesHoje(c) {
    return '<div class="actions-banner">' +
      '<span class="actions-title">' + ICONS.alerta + ' Ações de hoje</span>' +
      '<div class="actions-list">' +
        '<span class="action-chip red"><span class="n">' + c.venceHoje + '</span> processo' + (c.venceHoje !== 1 ? 's' : '') + ' vence' + (c.venceHoje !== 1 ? 'm' : '') + ' hoje</span>' +
        '<span class="action-chip orange"><span class="n">' + c.ultimoDiaProrrogacao + '</span> no último dia para prorrogação</span>' +
        '<span class="action-chip blue"><span class="n">' + c.emailsPreparar + '</span> e-mail' + (c.emailsPreparar !== 1 ? 's' : '') + ' a preparar</span>' +
        '<span class="action-chip amber"><span class="n">' + c.pendenteConfirmacao + '</span> e-mail' + (c.pendenteConfirmacao !== 1 ? 's' : '') + ' aguardando confirmação</span>' +
      '</div>' +
    '</div>';
  }

  /* ▶ NOVO — Seção "Lembretes de hoje" (Dashboard) */
  function renderLembretesHoje(list) {
    const hoje = Dados.hojeISO;
    const lembretes = list.filter(p =>
      p.statusDerivado !== 'Concluído' &&
      Dados.calcularLembrete(p.vencimento) === hoje
    );
    const count = lembretes.length;

    const header =
      '<div class="card-head">' +
        '<h3>' + ICONS.alerta + ' Lembretes de hoje' +
          (count > 0 ? '<span class="lembrete-count">' + count + '</span>' : '') +
        '</h3>' +
        '<span class="sub">último dia para prorrogação</span>' +
      '</div>';

    let bodyHtml;
    if (count === 0) {
      bodyHtml =
        '<div class="lembrete-empty">' + ICONS.check +
          '<div class="t">Nenhum lembrete programado para hoje</div>' +
          '<div class="s">Você será avisado quando um prazo se aproximar.</div>' +
        '</div>';
    } else {
      bodyHtml = '<ul class="lembrete-list">' + lembretes.map(p => {
        const dias = Dados.diasUteisRestantes(p.vencimento, hoje);
        return '<li class="lembrete-item" data-nup="' + esc(p.nup) + '">' +
          '<div class="lembrete-info">' +
            '<div class="lembrete-top">' +
              '<span class="lembrete-nup">' + esc(p.nup) + '</span>' +
              '<span class="lembrete-area">' + esc(p.area) + '</span>' +
              badge(p.statusDerivado) +
            '</div>' +
            '<div class="lembrete-resumo">' + esc(p.resumo) + '</div>' +
            '<div class="lembrete-meta">' +
              '<span>Vence em <strong>' + fmtData(p.vencimento) + '</strong></span>' +
              '<span><strong>' + dias + '</strong> dia' + (dias !== 1 ? 's' : '') + ' útil' + (dias !== 1 ? 'eis' : '') + ' restante' + (dias !== 1 ? 's' : '') + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="lembrete-action">' +
            '<button class="btn btn-primary btn-sm btn-lembrete-email" data-nup="' + esc(p.nup) + '">' +
              ICONS.email + ' Preparar e-mail' +
            '</button>' +
          '</div>' +
        '</li>';
      }).join('') + '</ul>';
    }

    return '<div class="card lembretes-card">' + header + '<div class="card-body">' + bodyHtml + '</div></div>';
  }

  /* ▶ NOVO — Bind da seção "Lembretes de hoje" */
  function bindLembretesHoje() {
    $$('.btn-lembrete-email').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nup = btn.dataset.nup;
        const p = processosComStatus().find(x => x.nup === nup);
        if (p) abrirModalEmail(p, 'Lembrete');
      });
    });
    $$('.lembrete-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        navigate('processo', item.dataset.nup);
      });
    });
  }

  function renderAtencao(list) {
    const prioridade = ['Vence hoje', 'Vencido', 'Próximo do vencimento', 'Prorrogado'];
    const rank = st => { const i = prioridade.indexOf(st); return i === -1 ? 99 : i; };
    const ordenados = list
      .filter(p => p.statusDerivado !== 'Concluído' && p.statusDerivado !== 'Em andamento')
      .sort((a, b) => rank(a.statusDerivado) - rank(b.statusDerivado) || a.vencimento.localeCompare(b.vencimento))
      .slice(0, 8);
    if (ordenados.length === 0) {
      return '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M12 21a9 9 0 110-18 9 9 0 010 18z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="t">Nenhum processo exige atenção agora</div></div>';
    }
    return '<ul class="attention-list">' + ordenados.map((p, i) =>
      '<li class="attention-item" data-nup="' + esc(p.nup) + '">' +
        '<span class="attention-rank">' + (i + 1) + '</span>' +
        '<div class="attention-body">' +
          '<div class="top"><span class="nup">' + esc(p.nup) + '</span>' + badge(p.statusDerivado) + '</div>' +
          '<div class="resumo">' + esc(p.resumo) + '</div>' +
        '</div>' +
        '<div class="attention-side"><div class="tl-data">vence <strong>' + fmtData(p.vencimento) + '</strong></div></div>' +
      '</li>').join('') + '</ul>';
  }

  function renderDashboard() {
    const c = contar();
    const list = processosComStatus();

    return '<div class="dash">' +
      renderHero(c) +
      /* ▶ MUDOU — nova seção logo abaixo de "Ações de hoje" */
      '<div style="margin-top:16px">' + renderLembretesHoje(list) + '</div>' +

      '<div class="grid-2" style="margin-top:18px">' +
        '<div class="card"><div class="card-head"><h3>Processos por status</h3></div><div class="card-body"><div id="chart-status"></div></div></div>' +
        '<div class="card"><div class="card-head"><h3>Processos por área</h3></div><div class="card-body"><div id="chart-area"></div></div></div>' +
      '</div>' +

      '<div class="grid-2" style="margin-top:16px">' +
        '<div class="card"><div class="card-head"><h3>Evolução de vencimentos</h3><span class="sub">próximas 6 semanas</span></div><div class="card-body"><div id="chart-evolucao"></div></div></div>' +
        '<div class="card"><div class="card-head"><h3>Urgência dos prazos</h3><span class="sub">processos por proximidade do vencimento</span></div><div class="card-body"><div id="chart-urgencia"></div></div></div>' +
      '</div>' +
      '<div style="margin-top:16px">' +
        '<div class="card"><div class="card-head"><h3>Processos que exigem atenção</h3></div><div class="card-body" style="padding-top:8px">' + renderAtencao(list) + '</div></div>' +
  '</div>' +
    '</div>';
  }

  function bindDashboard() {
    $$('.hero-cta').forEach(b => b.addEventListener('click', () => navigate('processos')));
    $$('.hero-stat').forEach(s => s.addEventListener('click', () => {
      const status = s.dataset.status || '';
      state.filtros = resetFiltros();
      if (status) state.filtros.status = status;
      navigate('processos');
    }));
    $$('.hero-stat').forEach(s => s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); s.click(); } }));
    const porStatus = contar();
    const list = processosComStatus();
    const statusItems = [
      { label: 'Em andamento', value: porStatus.emAndamento, color: ChartPalette.emAndamento, onClick: () => irParaStatus('Em andamento') },
      { label: 'Próximos do vencimento', value: porStatus.proximo, color: ChartPalette.proximo, onClick: () => irParaStatus('Próximo do vencimento') },
      { label: 'Vencem hoje', value: porStatus.venceHoje, color: ChartPalette.venceHoje, onClick: () => irParaStatus('Vence hoje') },
      { label: 'Prorrogados', value: porStatus.prorrogado, color: ChartPalette.prorrogado, onClick: () => irParaStatus('Prorrogado') },
      { label: 'Vencidos', value: porStatus.vencido, color: ChartPalette.vencido, onClick: () => irParaStatus('Vencido') },
      { label: 'Concluídos', value: porStatus.concluido, color: ChartPalette.concluido, onClick: () => irParaStatus('Concluído') }
    ].filter(d => d.value > 0);
    renderDoughnut($('#chart-status'), statusItems);

    const areaItems = AREAS.map(a => ({ label: a.nome, value: list.filter(p => p.area === a.nome).length, color: ChartPalette.emAndamento, onClick: () => { state.filtros = resetFiltros(); state.filtros.area = a.nome; navigate('processos'); } }));
    renderHBarChart($('#chart-area'), areaItems);

    const vencimentos = list.filter(p => p.statusDerivado !== 'Concluído').map(p => p.vencimento).sort();
    const hoje = new Date(Dados.hojeISO + 'T12:00:00');
    const labels = [], values = [];
    for (let i = 0; i < 6; i++) {
      const ini = new Date(hoje); ini.setDate(ini.getDate() + i * 7);
      const fim = new Date(ini); fim.setDate(fim.getDate() + 6);
      const iniISO = ini.toISOString().slice(0, 10), fimISO = fim.toISOString().slice(0, 10);
      labels.push(fmtData(iniISO)); values.push(vencimentos.filter(v => v >= iniISO && v <= fimISO).length);
    }
renderAreaChart($('#chart-evolucao'), labels, values, { color: ChartPalette.emAndamento });

const urgenciaItems = distribuirPorUrgencia(list);
renderHBarChart($('#chart-urgencia'), urgenciaItems);
    $$('.attention-item').forEach(i => i.addEventListener('click', () => navigate('processo', i.dataset.nup)));

    /* ▶ MUDOU — bind da nova seção */
    bindLembretesHoje();
  }

  function irParaStatus(status) {
    state.filtros = resetFiltros();
    state.filtros.status = status;
    navigate('processos');
  }
  function resetFiltros() { return { area: '', status: '', periodo: '30', prorrogado: 'todos', busca: '' }; }
  function aplicarFiltroPorParam(prm) {
    if (!prm) return;
    if (prm.startsWith('st:')) {
      const map = { 'em-andamento': 'Em andamento', 'proximo': 'Próximo do vencimento', 'vence-hoje': 'Vence hoje', 'prorrogado': 'Prorrogado', 'vencido': 'Vencido', 'concluido': 'Concluído' };
      state.filtros.status = map[prm.slice(3)] || '';
    }
  }

  /* ---------- Lista de processos ---------- */
  function filtrar(list) {
    const f = state.filtros;
    return list.filter(p => {
      if (f.area && p.area !== f.area) return false;
      if (f.status && p.statusDerivado !== f.status) return false;
      if (f.prorrogado === 'sim' && !p.novaDataResposta) return false;
      if (f.prorrogado === 'nao' && p.novaDataResposta) return false;
      if (f.busca) {
        const q = f.busca.toLowerCase();
        if (!(p.nup.toLowerCase().includes(q) || p.resumo.toLowerCase().includes(q))) return false;
      }
      if (f.periodo && f.periodo !== 'todos') {
        const dias = parseInt(f.periodo, 10);
        const limite = new Date(); limite.setDate(limite.getDate() + dias);
        if (p.vencimento > limite.toISOString().slice(0, 10)) return false;
      }
      return true;
    });
  }

  function ordenar(list) {
    const { key, dir } = state.sort;
    const k = key === 'prazo' ? 'vencimento' : key;
    return [...list].sort((a, b) => {
      let r = 0;
      if (k === 'nup' || k === 'area' || k === 'statusDerivado' || k === 'dataAbertura' || k === 'vencimento') {
        r = String(a[k] || '').localeCompare(String(b[k] || ''));
      }
      return dir === 'asc' ? r : -r;
    });
  }

  function renderProcessos() {
    const list = ordenar(filtrar(processosComStatus()));
    const areasOpts = AREAS.map(a => '<option value="' + esc(a.nome) + '">' + esc(a.nome) + '</option>').join('');
    const statusOpts = Object.keys(STATUS_META).map(s => '<option value="' + esc(s) + '">' + esc(s) + '</option>').join('');
    const f = state.filtros;

    const ths = [
      { key: 'nup', label: 'NUP' }, { key: 'area', label: 'Área' }, { key: 'resumo', label: 'Resumo' },
      { key: 'dataAbertura', label: 'Abertura' }, { key: 'prazo', label: 'Prazo' }, { key: 'statusDerivado', label: 'Status' }
    ];
    const thead = ths.map(t => {
      const sorted = state.sort.key === t.key ? ' sorted' : '';
      const arrow = state.sort.key === t.key ? (state.sort.dir === 'asc' ? '↑' : '↓') : '';
      return '<th data-sort="' + t.key + '" class="' + sorted + '">' + t.label + ' <span class="sort-arrow">' + arrow + '</span></th>';
    }).join('');

    const rows = list.map(p => {
      return '<tr class="clickable" data-nup="' + esc(p.nup) + '">' +
        '<td class="cell-nup">' + esc(p.nup) + '</td>' +
        '<td class="cell-area">' + esc(p.area) + '</td>' +
        '<td class="cell-resumo">' + esc(p.resumo) + '</td>' +
        '<td class="cell-date">' + fmtData(p.dataAbertura) + '</td>' +
        '<td class="cell-date">' + fmtData(p.vencimento) + '</td>' +
        '<td>' + badge(p.statusDerivado) + '</td>' +
      '</tr>';
    }).join('');

    return '<div>' +
      '<div class="card" style="margin-bottom:16px"><div class="card-body"><div class="filter-bar">' +
        '<div class="field"><label>Área</label><select class="select" id="f-area"><option value="">Todas</option>' + areasOpts + '</select></div>' +
        '<div class="field"><label>Status</label><select class="select" id="f-status"><option value="">Todos</option>' + statusOpts + '</select></div>' +
        '<div class="field"><label>Período</label><select class="select" id="f-periodo"><option value="todos">Todos</option><option value="7">Próximos 7 dias</option><option value="30">Próximos 30 dias</option><option value="60">Próximos 60 dias</option><option value="90">Próximos 90 dias</option></select></div>' +
        '<div class="field"><label>Prorrogado</label><select class="select" id="f-prorrogado"><option value="todos">Todos</option><option value="sim">Somente prorrogados</option><option value="nao">Não prorrogados</option></select></div>' +
        '<div class="field"><label>Buscar NUP</label><input class="input" id="f-busca" placeholder="NUP ou resumo…" /></div>' +
        '<button class="btn btn-ghost" id="f-limpar" style="margin-top:20px">Limpar</button>' +
      '</div></div></div>' +

      '<div class="card"><div class="card-head"><h3>Todos os processos</h3><span class="sub">' + list.length + ' processo' + (list.length !== 1 ? 's' : '') + '</span></div>' +
      '<div class="card-body" style="padding-top:8px"><div class="table-wrap"><table class="data-table"><thead><tr>' + thead + '</tr></thead><tbody>' +
      (rows || '<tr><td colspan="6"><div class="empty-state"><svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><div class="t">Nenhum processo encontrado</div></div></td></tr>') +
      '</tbody></table></div></div></div>' +
    '</div>';
  }

  function proximaAcaoDe(p) {
    const hoje = Dados.hojeISO;
    if (p.statusDerivado === 'Concluído') return '—';
    const lembrete = Dados.calcularLembrete(p.vencimento);
    if (p.vencimento === hoje) return 'Preparar e-mail de vencimento';
    if (p.vencimento < hoje) return 'Processo vencido';
    if (lembrete === hoje) return 'Último dia para prorrogação';
    return 'Acompanhar';
  }

  function bindProcessos() {
    $('#f-area').value = state.filtros.area;
    $('#f-status').value = state.filtros.status;
    $('#f-periodo').value = state.filtros.periodo;
    $('#f-prorrogado').value = state.filtros.prorrogado;
    $('#f-busca').value = state.filtros.busca;

    $('#f-area').addEventListener('change', e => { state.filtros.area = e.target.value; rerender(); });
    $('#f-status').addEventListener('change', e => { state.filtros.status = e.target.value; rerender(); });
    $('#f-periodo').addEventListener('change', e => { state.filtros.periodo = e.target.value; rerender(); });
    $('#f-prorrogado').addEventListener('change', e => { state.filtros.prorrogado = e.target.value; rerender(); });
    let deb;
    $('#f-busca').addEventListener('input', e => { clearTimeout(deb); deb = setTimeout(() => { state.filtros.busca = e.target.value; rerender(); }, 250); });
    $('#f-limpar').addEventListener('click', () => { state.filtros = resetFiltros(); rerender(); });

    $$('.data-table th').forEach(th => th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (state.sort.key === key) state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
      else state.sort = { key, dir: 'asc' };
      rerender();
    }));
    $$('tbody tr[data-nup]').forEach(tr => tr.addEventListener('click', () => navigate('processo', tr.dataset.nup)));
  }
  function rerender() {
    $('#content').innerHTML = renderProcessos();
    bindProcessos();
  }

  /* ======================================================================
   * ▶ MUDOU — Detalhe do processo (redesenhado, completo e moderno)
   * ====================================================================== */

  /* Progresso do prazo baseado no prazo interno original (não muda com prorrogação). */
  function progressoDoPrazo(p) {
    const total = p.prazoInterno || CONFIG.prazoPadrao;
    const vencOriginal = Dados.calcularPrazo(p.dataAbertura, total);
    const restantesOrig = Dados.diasUteisRestantes(vencOriginal, Dados.hojeISO);
    const decorridos = Math.max(0, Math.min(total, total - restantesOrig));
    return {
      total,
      decorridos,
      percent: total > 0 ? Math.round((decorridos / total) * 100) : 0
    };
  }

  function renderProcesso(nup) {
    const p = processosComStatus().find(x => x.nup === nup);
    if (!p) return '<div class="empty-state" style="padding:60px"><svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><div class="t">Processo não encontrado</div></div>';

    const st = p.statusDerivado;
    const meta = STATUS_META[st] || { cor: ChartPalette.neutro, soft: '#eef2f7' };
    const tl = Dados.timelineDoProcesso(p);
    const hist = HISTORICO.filter(h => h.nup === nup);
    const hoje = Dados.hojeISO;
    const fim = p.vencimento;
    const lembrete = Dados.calcularLembrete(fim);
    const diasRestantes = Dados.diasUteisRestantes(fim, hoje);
    const prog = progressoDoPrazo(p);

    /* ---- HERO ---- */
    const heroHtml =
      '<div class="proc-hero" style="--proc-color:' + meta.cor + ';--proc-soft:' + meta.soft + '">' +
        '<div class="proc-hero-main">' +
          '<div class="proc-hero-breadcrumb">' +
            '<a href="#/processos">← Processos</a>' +
            '<span class="sep">/</span>' +
            '<span>' + esc(p.nup) + '</span>' +
          '</div>' +
          '<div class="proc-hero-title">' + esc(p.resumo) + '</div>' +
          '<div class="proc-hero-meta">' +
            '<span class="proc-hero-nup">' + esc(p.nup) + '</span>' +
            '<span class="proc-hero-area">' + esc(p.area) + '</span>' +
            badge(st) +
          '</div>' +
        '</div>' +
        '<div class="proc-hero-action">' +
          '<button class="btn btn-primary btn-lg" id="btn-email-principal" data-nup="' + esc(p.nup) + '">' +
            ICONS.email + ' Preparar e-mail' +
          '</button>' +
        '</div>' +
      '</div>';

    /* ---- BARRA DE PROGRESSO ---- */
    let diasTxt = '';
    if (hoje === fim) diasTxt = '<strong>Vence hoje</strong>';
    else if (fim < hoje) diasTxt = '<strong>Vencido</strong>';
    else diasTxt = '<strong>' + diasRestantes + '</strong> dia' + (diasRestantes !== 1 ? 's' : '') + ' útil' + (diasRestantes !== 1 ? 'eis' : '') + ' restante' + (diasRestantes !== 1 ? 's' : '');

    const progressHtml =
      '<div class="proc-progress">' +
        '<div class="proc-progress-head">' +
          '<div>' +
            '<div class="k">Progresso do prazo</div>' +
            '<div class="v">' + prog.percent + '% concluído</div>' +
          '</div>' +
          '<div class="proc-progress-meta">' + diasTxt + '</div>' +
        '</div>' +
        '<div class="proc-progress-bar">' +
          '<div class="proc-progress-fill" style="width:' + prog.percent + '%;background:' + meta.cor + '"></div>' +
        '</div>' +
        '<div class="proc-progress-dates">' +
          '<span>Abertura ' + fmtData(p.dataAbertura) + '</span>' +
          '<span>Lembrete ' + fmtData(lembrete) + '</span>' +
          '<span>Vencimento ' + fmtData(fim) + '</span>' +
        '</div>' +
      '</div>';

    /* ---- CARDS DE MÉTRICA ---- */
    const metrics = [
      {
        k: 'Vencimento',
        v: fmtData(fim),
        s: p.novaDataResposta ? 'Prorrogado (era ' + fmtData(p.prazoResposta) + ')' : 'Prazo original',
        icon: ICONS.venceHoje,
        cor: meta.cor,
        soft: meta.soft
      },
      {
        k: 'Dias úteis restantes',
        v: diasRestantes > 0 ? String(diasRestantes) : (hoje === fim ? '0' : '—'),
        s: diasRestantes > 0 ? 'para o vencimento' : (hoje === fim ? 'vence hoje' : 'prazo encerrado'),
        icon: ICONS.andamento,
        cor: ChartPalette.emAndamento,
        soft: '#e7effd'
      },
      {
        k: 'Lembrete',
        v: fmtData(lembrete),
        s: CONFIG.diasAntesVencimento + ' dias úteis antes',
        icon: ICONS.proximo,
        cor: ChartPalette.proximo,
        soft: '#fdf1de'
      },
      {
        k: 'Abertura',
        v: fmtData(p.dataAbertura),
        s: 'Prazo: ' + (p.prazoInterno || CONFIG.prazoPadrao) + ' dias úteis',
        icon: ICONS.total,
        cor: ChartPalette.concluido,
        soft: '#e2f6ee'
      }
    ];
    const metricsHtml = '<div class="proc-metrics">' + metrics.map(m =>
      '<div class="proc-metric" style="--m-color:' + m.cor + ';--m-soft:' + m.soft + '">' +
        '<div class="proc-metric-icon">' + m.icon + '</div>' +
        '<div class="proc-metric-body">' +
          '<div class="k">' + m.k + '</div>' +
          '<div class="v">' + m.v + '</div>' +
          '<div class="s">' + m.s + '</div>' +
        '</div>' +
      '</div>'
    ).join('') + '</div>';

    /* ---- TIMELINE ---- */
    const tlHtml = tl.map((ev, i) => {
      let cor = ChartPalette.neutro, soft = '#eef2f7', ic = ICONS.andamento;
      if (ev.tipo === 'inicio') { cor = ChartPalette.emAndamento; soft = '#e7effd'; ic = ICONS.total; }
      else if (ev.tipo === 'email') { cor = ChartPalette.proximo; soft = '#fdf1de'; ic = ICONS.email; }
      else if (ev.tipo === 'vencimento') { cor = ChartPalette.venceHoje; soft = '#fde7e7'; ic = ICONS.venceHoje; }
      else if (ev.tipo === 'prorrogacao') { cor = ChartPalette.prorrogado; soft = '#f0e9fd'; ic = ICONS.prorrogado; }
      const isPast = ev.data <= hoje;
      return '<div class="proc-tl-item ' + (isPast ? 'past' : '') + '" style="--tl-color:' + cor + ';--tl-soft:' + soft + '">' +
        '<div class="proc-tl-marker">' +
          '<div class="proc-tl-dot">' + ic + '</div>' +
          (i < tl.length - 1 ? '<div class="proc-tl-line"></div>' : '') +
        '</div>' +
        '<div class="proc-tl-content">' +
          '<div class="proc-tl-head">' +
            '<span class="proc-tl-rotulo">' + ev.rotulo + '</span>' +
            '<span class="proc-tl-date">' + fmtData(ev.data) + '</span>' +
          '</div>' +
          '<div class="proc-tl-desc">' + esc(ev.descricao) + '</div>' +
          (ev.tipo === 'email' ? '<button class="btn btn-ghost btn-sm btn-preparar-email" data-modelo="' + ev.modelo + '" data-nup="' + esc(p.nup) + '">' + ICONS.email + ' Preparar e-mail</button>' : '') +
        '</div>' +
      '</div>';
    }).join('');
    const timelineHtml = '<div class="proc-timeline">' + tlHtml + '</div>';

    /* ---- HISTÓRICO ---- */
    const histHtml = hist.length ? hist.map(h => {
      const tipo = h.tipo;
      let ic = ICONS.andamento, cor = '#64748b', soft = '#eef2f7';
      if (tipo === 'confirmado') { ic = ICONS.check; cor = '#0e9f6e'; soft = '#e2f6ee'; }
      else if (tipo === 'preparado') { ic = ICONS.email; cor = '#1f5bd8'; soft = '#e7effd'; }
      else if (tipo === 'aberto') { ic = ICONS.email; cor = '#7c3aed'; soft = '#f0e9fd'; }
      else if (tipo === 'nao-enviado') { ic = ICONS.alerta; cor = '#c22626'; soft = '#fde3e3'; }
      return '<li class="proc-hist-item">' +
        '<span class="proc-hist-icon" style="background:' + soft + ';color:' + cor + '">' + ic + '</span>' +
        '<div class="proc-hist-body">' +
          '<div class="proc-hist-text">' + esc(h.texto) + '</div>' +
          '<div class="proc-hist-time">' + esc(h.data) + '</div>' +
        '</div>' +
      '</li>';
    }).join('') : '<div class="empty-state" style="padding:24px"><div class="t">Nenhum registro ainda</div></div>';
    const historyHtml = '<ul class="proc-history-list">' + histHtml + '</ul>';

    /* ---- INFO DO PROCESSO ---- */
    const info = [
      { k: 'Área', v: esc(p.area) },
      { k: 'Data de abertura', v: fmtData(p.dataAbertura) },
      { k: 'Prazo interno', v: (p.prazoInterno || CONFIG.prazoPadrao) + ' ' + CONFIG.unidade.toLowerCase() },
      { k: 'Prazo de resposta', v: p.novaDataResposta ? '<span style="text-decoration:line-through;color:var(--text-muted)">' + fmtData(p.prazoResposta) + '</span> → ' + fmtData(p.novaDataResposta) : fmtData(p.prazoResposta) },
      { k: 'Status', v: badge(st) },
      { k: 'Nova data', v: p.novaDataResposta ? fmtData(p.novaDataResposta) : '—' },
      { k: 'Observação', v: esc(p.observacao || '—') }
    ];
    const infoHtml = '<div class="proc-info-grid">' + info.map(i =>
      '<div class="proc-info-cell"><div class="k">' + i.k + '</div><div class="v">' + i.v + '</div></div>'
    ).join('') + '</div>';

    /* ---- MONTAGEM ---- */
    return '<div class="proc-detail">' +
      heroHtml +
      progressHtml +
      metricsHtml +
      '<div class="proc-grid">' +
        '<div class="card proc-card">' +
          '<div class="card-head"><h3>Linha do tempo</h3><span class="sub">eventos e comunicações</span></div>' +
          '<div class="card-body">' + timelineHtml + '</div>' +
        '</div>' +
        '<div class="card proc-card">' +
          '<div class="card-head"><h3>Histórico</h3><span class="sub">' + hist.length + ' registro' + (hist.length !== 1 ? 's' : '') + '</span></div>' +
          '<div class="card-body" style="padding-top:8px">' + historyHtml + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="card proc-info-card">' +
        '<div class="card-head"><h3>Informações do processo</h3></div>' +
        '<div class="card-body" style="padding:0">' + infoHtml + '</div>' +
      '</div>' +
    '</div>';
  }

  function bindProcesso(nup) {
    const p = processosComStatus().find(x => x.nup === nup);
    if (!p) return;
    $$('.btn-preparar-email').forEach(b => b.addEventListener('click', () => abrirModalEmail(p, b.dataset.modelo)));
    $('#btn-email-principal').addEventListener('click', () => abrirModalEmail(p, escolherModelo(p)));
  }

  function escolherModelo(p) {
    const hoje = Dados.hojeISO;
    if (p.vencimento === hoje) return 'Vencimento';
    if (p.dataAbertura === hoje) return 'Inicial';
    return 'Lembrete';
  }

  /* ---------- Modais de e-mail ---------- */
  function abrirModalEmail(processo, tipoModelo) {
    const email = Dados.montarEmail(processo, tipoModelo);
    if (!email) { toast('Modelo de e-mail não encontrado', 'warn'); return; }
    const d = email.destinatarios;
    const para = d.chefe ? [d.chefe] : [];
    const cc = d.pontosFocais;

    const paraHtml = para.length ? para.map(c => '<span class="email-chip chefe"><span class="t">' + esc(c.tipo) + '</span>' + esc(c.nome) + ' &lt;' + esc(c.email) + '&gt;</span>').join('') : '<span class="email-chip"><span class="t">—</span>sem chefe cadastrado</span>';
    const ccHtml = cc.length ? cc.map(c => '<span class="email-chip"><span class="t">' + esc(c.tipo) + '</span>' + esc(c.nome) + ' &lt;' + esc(c.email) + '&gt;</span>').join('') : '<span class="email-chip"><span class="t">—</span>sem pontos focais</span>';

    const modalHtml =
      '<div class="modal-overlay" data-modal="preparar">' +
        '<div class="modal wide">' +
          '<div class="modal-head"><h3>Preparar e-mail — ' + esc(tipoModelo) + '</h3><button class="modal-close" data-close>✕</button></div>' +
          '<div class="modal-body">' +
            '<div class="email-block"><div class="field-label">Para</div><div class="email-to">' + paraHtml + '</div></div>' +
            '<div class="email-block"><div class="field-label">CC (pontos focais)</div><div class="email-to">' + ccHtml + '</div></div>' +
            '<div class="email-block"><div class="field-label">Assunto</div><div class="email-subject">' + esc(email.assunto) + '</div></div>' +
            '<div class="email-block"><div class="field-label">Corpo</div><div class="email-body">' + esc(email.corpo) + '</div></div>' +
            '<div class="note"><strong>Revisão antes do Outlook.</strong> Os destinatários, assunto e corpo já estão preenchidos. O sistema <strong>não enviará</strong> o e-mail automaticamente.</div>' +
            '<div class="modal-actions">' +
              '<button class="btn btn-ghost" data-close>Cancelar</button>' +
              '<button class="btn btn-primary" id="btn-abrir-outlook">' + ICONS.email + ' Abrir Outlook</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    $('#modal-root').innerHTML = modalHtml;
    $('#btn-abrir-outlook').addEventListener('click', () => abrirConfirmacaoOutlook(processo, tipoModelo, email));
    bindModalClose();
  }

  function abrirConfirmacaoOutlook(processo, tipoModelo, email) {
    const modalHtml =
      '<div class="modal-overlay" data-modal="outlook">' +
        '<div class="modal">' +
          '<div class="modal-head"><h3>Abrir o Outlook?</h3><button class="modal-close" data-close>✕</button></div>' +
          '<div class="modal-body">' +
            '<p>Você será encaminhado para o Outlook com um novo e-mail previamente preenchido.</p>' +
            '<p>Os destinatários, assunto e corpo da mensagem serão preenchidos automaticamente.</p>' +
            '<p>Revise todas as informações antes de enviar.</p>' +
            '<div class="note warn"><strong>O sistema não enviará o e-mail automaticamente.</strong> O envio deverá ser realizado manualmente pelo Outlook.</div>' +
            '<div class="modal-actions">' +
              '<button class="btn btn-ghost" data-close>Cancelar</button>' +
              '<button class="btn btn-primary" id="btn-confirmar-outlook">Abrir Outlook</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    $('#modal-root').innerHTML = modalHtml;
    $('#btn-confirmar-outlook').addEventListener('click', () => {
      registrarHistorico(processo.nup, 'aberto', 'Outlook aberto.');
      toast('Abrindo o Outlook com a mensagem preparada…', 'success');
      setTimeout(() => abrirModalPosOutlook(processo, tipoModelo, email), 350);
    });
    bindModalClose();
  }

  function abrirModalPosOutlook(processo, tipoModelo, email) {
    const modalHtml =
      '<div class="modal-overlay" data-modal="pos-outlook">' +
        '<div class="modal">' +
          '<div class="modal-head"><h3>O e-mail foi enviado?</h3><button class="modal-close" data-close>✕</button></div>' +
          '<div class="modal-body">' +
            '<p>Você enviou este e-mail pelo Outlook?</p>' +
            '<p>O sistema somente registrará o envio como confirmado se você confirmar manualmente.</p>' +
            '<div class="modal-actions" style="flex-direction:column;align-items:stretch">' +
              '<button class="btn btn-primary" id="btn-enviado-sim">Sim, foi enviado</button>' +
              '<button class="btn btn-ghost" id="btn-enviado-nao">Não / Ainda não</button>' +
              '<button class="btn btn-ghost" id="btn-voltar-depois">Voltar depois</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    $('#modal-root').innerHTML = modalHtml;
    $('#btn-enviado-sim').addEventListener('click', () => {
      registrarHistorico(processo.nup, 'confirmado', 'Envio confirmado pelo usuário.');
      toast('Envio confirmado pelo usuário', 'success');
      $('#modal-root').innerHTML = '';
      if (state.route === 'processo') { $('#content').innerHTML = renderProcesso(processo.nup); bindProcesso(processo.nup); }
      else render();
    });
    $('#btn-enviado-nao').addEventListener('click', () => {
      registrarHistorico(processo.nup, 'nao-enviado', '⚠ Envio não confirmado.');
      toast('⚠ Envio não confirmado — você poderá preparar novamente', 'warn');
      $('#modal-root').innerHTML = '';
      if (state.route === 'processo') { $('#content').innerHTML = renderProcesso(processo.nup); bindProcesso(processo.nup); }
    });
    $('#btn-voltar-depois').addEventListener('click', () => {
      registrarHistorico(processo.nup, 'aguardando', 'Aguardando confirmação.');
      $('#modal-root').innerHTML = '';
    });
    bindModalClose();
  }

  function registrarHistorico(nup, tipo, texto) {
    const agora = new Date();
    const pad = n => String(n).padStart(2, '0');
    const data = agora.toISOString().slice(0, 10) + ' ' + pad(agora.getHours()) + ':' + pad(agora.getMinutes());
    HISTORICO.push({ data, tipo, texto, nup });
  }

  function bindModalClose() {
    $$('[data-close]').forEach(b => b.addEventListener('click', () => { $('#modal-root').innerHTML = ''; }));
    $$('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) $('#modal-root').innerHTML = ''; }));
  }

  /* ---------- Calendário ---------- */
  function renderCalendario() {
    const hoje = new Date(Dados.hojeISO + 'T12:00:00');
    const list = processosComStatus();
    const dow = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

    const first = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const startOffset = first.getDay();
    const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    const diasPrevMes = new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate();

    let cells = '';
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = diasPrevMes - i;
      const iso = new Date(hoje.getFullYear(), hoje.getMonth() - 1, d).toISOString().slice(0, 10);
      cells += celulaDia(d, iso, true);
    }
    for (let d = 1; d <= diasNoMes; d++) {
      const iso = new Date(hoje.getFullYear(), hoje.getMonth(), d).toISOString().slice(0, 10);
      cells += celulaDia(d, iso, false, list);
    }
    const total = startOffset + diasNoMes;
    const restante = (7 - (total % 7)) % 7;
    for (let d = 1; d <= restante; d++) {
      const iso = new Date(hoje.getFullYear(), hoje.getMonth() + 1, d).toISOString().slice(0, 10);
      cells += celulaDia(d, iso, true);
    }

    const mesNome = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return '<div class="card"><div class="card-head"><h3>Calendário de vencimentos</h3>' +
      '<div class="legend">' +
        '<span class="legend-item"><span class="legend-dot" style="background:' + ChartPalette.venceHoje + '"></span>Vencimento</span>' +
        '<span class="legend-item"><span class="legend-dot" style="background:' + ChartPalette.proximo + '"></span>Lembrete</span>' +
        '<span class="legend-item"><span class="legend-dot" style="background:' + ChartPalette.prorrogado + '"></span>Prorrogado</span>' +
        '<span class="legend-item"><span class="legend-dot" style="background:' + ChartPalette.vencido + '"></span>Vencido</span>' +
      '</div></div>' +
      '<div class="card-body">' +
        '<div class="calendar-head"><button class="btn btn-ghost btn-sm" id="cal-prev">← Anterior</button>' +
        '<span class="calendar-month">' + mesNome + '</span>' +
        '<button class="btn btn-ghost btn-sm" id="cal-next">Próximo →</button></div>' +
        '<div class="calendar-grid">' +
          dow.map(d => '<div class="calendar-dow">' + d + '</div>').join('') +
          cells +
        '</div>' +
        '<div id="cal-detalhe" style="margin-top:16px"></div>' +
      '</div></div>';
  }

  function celulaDia(d, iso, out, list) {
    const marcadores = [];
    if (list) {
      list.forEach(p => {
        if (p.vencimento === iso) {
          const cls = p.statusDerivado === 'Vencido' ? 'background:' + ChartPalette.vencido : (p.statusDerivado === 'Vence hoje' ? 'background:' + ChartPalette.venceHoje : (p.novaDataResposta ? 'background:' + ChartPalette.prorrogado : 'background:' + ChartPalette.proximo));
          marcadores.push('<span class="cd-dot" style="' + cls + '" title="' + esc(p.nup) + '"></span>');
        }
        if (Dados.calcularLembrete(p.vencimento) === iso && p.statusDerivado !== 'Concluído') {
          marcadores.push('<span class="cd-dot" style="background:' + ChartPalette.proximo + ';opacity:.5" title="Lembrete ' + esc(p.nup) + '"></span>');
        }
      });
    }
    const hojeCls = iso === Dados.hojeISO ? ' today' : '';
    return '<div class="calendar-day' + (out ? ' out' : '') + hojeCls + '" data-iso="' + iso + '">' +
      '<span class="dnum">' + d + '</span>' +
      '<div class="cd-dots">' + marcadores.join('') + '</div>' +
    '</div>';
  }

  function bindCalendario() {
    $$('.calendar-day[data-iso]').forEach(cd => cd.addEventListener('click', () => mostrarDetalheDia(cd.dataset.iso)));
  }
  function mostrarDetalheDia(iso) {
    const list = processosComStatus().filter(p => p.vencimento === iso || Dados.calcularLembrete(p.vencimento) === iso);
    const el = $('#cal-detalhe');
    if (!list.length) { el.innerHTML = '<div class="empty-state" style="padding:16px"><div class="t">Nenhum processo nesta data</div></div>'; return; }
    el.innerHTML = '<h3 style="font-size:13px;font-weight:700;margin:0 0 8px">Processos em ' + fmtData(iso) + '</h3><ul class="attention-list">' + list.map(p =>
      '<li class="attention-item" data-nup="' + esc(p.nup) + '"><div class="attention-body"><div class="top"><span class="nup">' + esc(p.nup) + '</span>' + badge(p.statusDerivado) + '</div><div class="resumo">' + esc(p.resumo) + '</div></div></li>'
    ).join('') + '</ul>';
    $$('#cal-detalhe .attention-item').forEach(i => i.addEventListener('click', () => navigate('processo', i.dataset.nup)));
  }

  /* ---------- Configurações ---------- */
  function renderConfiguracoes() {
    const cfg = Object.entries(CONFIG).map(([k, v]) => {
      let label = k;
      const rotulos = { prazoPadrao: 'Prazo padrão', unidade: 'Unidade', diasAntesVencimento: 'Dias antes do vencimento', considerarSabado: 'Considerar sábado', considerarDomingo: 'Considerar domingo', considerarFeriados: 'Considerar feriados', fusoHorario: 'Fuso horário' };
      label = rotulos[k] || k;
      const val = typeof v === 'boolean' ? (v ? 'Sim' : 'Não') : v;
      return '<div class="info-cell"><div class="k">' + label + '</div><div class="v">' + esc(val) + '</div></div>';
    }).join('');
    return '<div class="card"><div class="card-head"><h3>Configurações de prazo</h3><span class="sub">fonte: aba "Configurações" do Excel</span></div>' +
      '<div class="card-body" style="padding:0"><div class="info-grid">' + cfg + '</div></div></div>' +
      '<div class="card" style="margin-top:16px"><div class="card-head"><h3>Feriados cadastrados</h3><span class="sub">' + FERIADOS.length + ' feriados</span></div>' +
      '<div class="card-body" style="padding-top:8px"><div class="table-wrap"><table class="data-table"><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th></tr></thead><tbody>' +
      FERIADOS.map(f => '<tr><td class="cell-date">' + fmtData(f.data) + '</td><td>' + esc(f.descricao) + '</td><td>' + esc(f.tipo) + '</td></tr>').join('') +
      '</tbody></table></div></div></div>';
  }

  /* ---------- Toast ---------- */
  function toast(msg, tipo) {
    let wrap = $('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const t = document.createElement('div');
    t.className = 'toast ' + (tipo || '');
    t.innerHTML = (tipo === 'success' ? ICONS.check : ICONS.alerta) + '<span>' + esc(msg) + '</span>';
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 3200);
  }

  /* ---------- Seleção de módulo (landing) ---------- */
  function renderSelecao() {
    const mods = [
      { id: 'ouvidoria', nome: 'Ouvidoria', desc: 'Processos de ouvidoria e manifestações', icone: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 8v8M8 10.5v5M16 10.5v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' },
      { id: 'lai', nome: 'LAI', desc: 'Processos de Lei de Acesso à Informação', icone: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5h16v14H4z" stroke="currentColor" stroke-width="1.6"/><path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' }
    ];
    const cards = mods.map(m =>
      '<button class="landing-card" data-modulo="' + m.id + '">' +
        '<span class="landing-icone">' + m.icone + '</span>' +
        '<span class="landing-nome">' + m.nome + '</span>' +
        '<span class="landing-desc">' + m.desc + '</span>' +
      '</button>'
    ).join('');
    return '<div class="landing">' +
      '<div class="landing-inner">' +
        '<div class="landing-marca">' + ICONS.total + '</div>' +
        '<h1 class="landing-titulo">Monitoramento de Prazos</h1>' +
        '<p class="landing-subtitulo">Escolha a planilha que deseja visualizar</p>' +
        '<div class="landing-cards">' + cards + '</div>' +
      '</div>' +
    '</div>';
  }

  function bindSelecao() {
    $$('.landing-card').forEach(c => c.addEventListener('click', () => {
      const modulo = c.dataset.modulo;
      state.modulo = modulo;
      Dados.setModulo(modulo);
      try { localStorage.setItem('ouvidoria.modulo', modulo); } catch (e) {}
      navigate('dashboard');
    }));
  }

  /* ---------- Bootstrap ---------- */
  function bindGlobal() {
    const sw = $('#switchModuloBtn');
    if (sw) sw.addEventListener('click', () => {
      state.modulo = null;
      try { localStorage.removeItem('ouvidoria.modulo'); } catch (e) {}
      navigate('selecao');
    });
    $('#refreshBtn').addEventListener('click', () => { toast('Dados atualizados a partir da planilha (simulada)', 'success'); render(); });
    $('#globalSearch').addEventListener('input', e => {
      state.filtros = resetFiltros(); state.filtros.busca = e.target.value;
      if (state.route !== 'processos') navigate('processos'); else rerender();
    });
    window.addEventListener('hashchange', render);
  }

  function init() {
    let saved = null;
    try { saved = localStorage.getItem('ouvidoria.modulo'); } catch (e) {}
    if (saved === 'ouvidoria' || saved === 'lai') { state.modulo = saved; Dados.setModulo(saved); }
    bindGlobal();
    render();
  }

  return { init, navigate };
})();

document.addEventListener('DOMContentLoaded', () => App.init());