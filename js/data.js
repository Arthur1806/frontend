/* =========================================================================
 * data.js — Dados fictícios + motor de prazos (frontend)
 * -------------------------------------------------------------------------
 * PROTÓTIPO DE VALIDAÇÃO VISUAL. Os dados aqui são FICTÍCIOS e a lógica de
 * cálculo de prazos espelha, em JavaScript, o que o backend (Flask) fará.
 * Quando o backend estiver pronto, este arquivo será substituído por chamadas
 * à API local (fetch('/api/...')).
 * ========================================================================= */

/* ---------- Configurações (espelho da aba "Configurações" do Excel) ---------- */
let CONFIG = {
  prazoPadrao: 20,
  unidade: 'Dias úteis',
  diasAntesVencimento: 2,
  considerarSabado: false,
  considerarDomingo: false,
  considerarFeriados: true,
  fusoHorario: 'America/Sao_Paulo'
};

/* ---------- Feriados (espelho da aba "Feriados") ---------- */
let FERIADOS = [
  { data: '2026-01-01', descricao: 'Confraternização Universal', tipo: 'Nacional' },
  { data: '2026-02-16', descricao: 'Carnaval', tipo: 'Ponto facultativo' },
  { data: '2026-02-17', descricao: 'Carnaval', tipo: 'Ponto facultativo' },
  { data: '2026-04-03', descricao: 'Sexta-feira Santa', tipo: 'Nacional' },
  { data: '2026-04-21', descricao: 'Tiradentes', tipo: 'Nacional' },
  { data: '2026-05-01', descricao: 'Dia do Trabalho', tipo: 'Nacional' },
  { data: '2026-06-04', descricao: 'Corpus Christi', tipo: 'Ponto facultativo' },
  { data: '2026-09-07', descricao: 'Independência do Brasil', tipo: 'Nacional' },
  { data: '2026-10-12', descricao: 'Nossa Senhora Aparecida', tipo: 'Nacional' },
  { data: '2026-11-02', descricao: 'Finados', tipo: 'Nacional' },
  { data: '2026-11-15', descricao: 'Proclamação da República', tipo: 'Nacional' },
  { data: '2026-11-20', descricao: 'Consciência Negra', tipo: 'Nacional' },
  { data: '2026-12-25', descricao: 'Natal', tipo: 'Nacional' }
];

/* ---------- Áreas (espelho da aba "Áreas") ---------- */
let AREAS = [
  {
    nome: 'Saúde',
    contatos: [
      { tipo: 'Chefe', nome: 'Dra. Renata Lima', email: 'renata.lima@ouvidoria.gov.br', ativo: true },
      { tipo: 'Ponto focal', nome: 'Carlos Mendes', email: 'carlos.mendes@ouvidoria.gov.br', ativo: true },
      { tipo: 'Ponto focal', nome: 'Patrícia Alves', email: 'patricia.alves@ouvidoria.gov.br', ativo: true }
    ]
  },
  {
    nome: 'Educação',
    contatos: [
      { tipo: 'Chefe', nome: 'Prof. Marcos Vinícius', email: 'marcos.vinicius@ouvidoria.gov.br', ativo: true },
      { tipo: 'Ponto focal', nome: 'Juliana Costa', email: 'juliana.costa@ouvidoria.gov.br', ativo: true }
    ]
  },
  {
    nome: 'Obras e Infraestrutura',
    contatos: [
      { tipo: 'Chefe', nome: 'Eng. Sérgio Barros', email: 'sergio.barros@ouvidoria.gov.br', ativo: true },
      { tipo: 'Ponto focal', nome: 'André Nogueira', email: 'andre.nogueira@ouvidoria.gov.br', ativo: true },
      { tipo: 'Ponto focal', nome: 'Tatiane Rocha', email: 'tatiane.rocha@ouvidoria.gov.br', ativo: true }
    ]
  },
  {
    nome: 'Assistência Social',
    contatos: [
      { tipo: 'Chefe', nome: 'Sra. Helena Martins', email: 'helena.martins@ouvidoria.gov.br', ativo: true },
      { tipo: 'Ponto focal', nome: 'Rafael Souza', email: 'rafael.souza@ouvidoria.gov.br', ativo: true }
    ]
  },
  {
    nome: 'Meio Ambiente',
    contatos: [
      { tipo: 'Chefe', nome: 'Dr. Otávio Freitas', email: 'otavio.freitas@ouvidoria.gov.br', ativo: true },
      { tipo: 'Ponto focal', nome: 'Camila Dias', email: 'camila.dias@ouvidoria.gov.br', ativo: true },
      { tipo: 'Ponto focal', nome: 'Bruno Teixeira', email: 'bruno.teixeira@ouvidoria.gov.br', ativo: true }
    ]
  }
];

/* ---------- Modelos de e-mail (espelho da aba "Modelos_Email") ---------- */
let MODELOS_EMAIL = {
  Inicial: {
    assunto: 'Manifestação registrada — NUP {NUP}',
    corpo: 'Prezados,\n\nInformamos que foi registrada manifestação referente ao NUP {NUP}, relacionada à área {AREA}.\n\nResumo da manifestação: {RESUMO}\n\nData de abertura: {DATA_ABERTURA}\nPrazo de resposta: {PRAZO_RESPOSTA}\n\nSolicitamos as providências cabíveis dentro do prazo estabelecido.\n\nAtenciosamente,\nOuvidoria'
  },
  Lembrete: {
    assunto: 'Último dia para solicitar prorrogação — NUP {NUP}',
    corpo: 'Prezados,\n\nInformamos que o processo referente ao NUP {NUP}, relacionado à manifestação "{RESUMO}", encontra-se próximo do vencimento.\n\nO prazo para resposta é {PRAZO_RESPOSTA}.\n\nEste é o último dia para solicitar prorrogação do prazo.\n\nAtenciosamente,\nOuvidoria'
  },
  Vencimento: {
    assunto: 'Prazo vence hoje — NUP {NUP}',
    corpo: 'Prezados,\n\nInformamos que o prazo do processo referente ao NUP {NUP}, relacionado à manifestação "{RESUMO}", encerra-se hoje ({PRAZO_RESPOSTA}).\n\nEste é o último dia do prazo para resposta.\n\nAtenciosamente,\nOuvidoria'
  }
};

/* ---------- Datas relativas a "hoje" ---------- */
const _hoje = new Date(); _hoje.setHours(12, 0, 0, 0);

function _dataISO(d) { return d.toISOString().slice(0, 10); }
function _diasPara(dias) { const d = new Date(_hoje); d.setDate(d.getDate() + dias); return _dataISO(d); }

/* Motor de dias úteis (espelha o futuro prazo_service do backend). */
let _feriadosISO = new Set(FERIADOS.map(f => f.data));
function _ehFeriado(d) { return _feriadosISO.has(_dataISO(d)); }
function _ehDiaUtil(d) {
  if (CONFIG.considerarSabado === false && d.getDay() === 6) return false;
  if (CONFIG.considerarDomingo === false && d.getDay() === 0) return false;
  if (CONFIG.considerarFeriados && _ehFeriado(d)) return false;
  return true;
}
function _addDiasUteis(isoInicial, n) {
  const d = new Date(isoInicial + 'T12:00:00');
  let count = 0;
  while (count < n) {
    d.setDate(d.getDate() + 1);
    if (_ehDiaUtil(d)) count++;
  }
  return _dataISO(d);
}
function _subDiasUteis(isoInicial, n) {
  const d = new Date(isoInicial + 'T12:00:00');
  let count = 0;
  while (count < n) {
    d.setDate(d.getDate() - 1);
    if (_ehDiaUtil(d)) count++;
  }
  return _dataISO(d);
}
function _diasUteisEntre(isoA, isoB) {
  const a = new Date(isoA + 'T12:00:00');
  const b = new Date(isoB + 'T12:00:00');
  let count = 0;
  const d = new Date(a);
  while (d < b) {
    d.setDate(d.getDate() + 1);
    if (d <= b && _ehDiaUtil(d)) count++;
  }
  return count;
}

/* ---------- Processos (espelho da aba "Processos") ---------- */
let PROCESSOS = [
  { nup: '2026.000101', area: 'Saúde', resumo: 'Reclamação sobre demora no atendimento em unidade básica de saúde', dataAbertura: _diasPara(-25), prazoInterno: 20, prazoResposta: _diasPara(0), status: 'Em andamento', novaDataResposta: null, observacao: '' },
  { nup: '2026.000102', area: 'Educação', resumo: 'Solicitação de vaga em creche municipal', dataAbertura: _diasPara(-22), prazoInterno: 20, prazoResposta: _diasPara(-3), status: 'Em andamento', novaDataResposta: null, observacao: 'Aguardando retorno da escola.' },
  { nup: '2026.000103', area: 'Obras e Infraestrutura', resumo: 'Denúncia de buraco em via pública no bairro Centro', dataAbertura: _diasPara(-20), prazoInterno: 20, prazoResposta: _diasPara(1), status: 'Em andamento', novaDataResposta: null, observacao: '' },
  { nup: '2026.000104', area: 'Saúde', resumo: 'Pedido de informação sobre fila de exames de imagem', dataAbertura: _diasPara(-19), prazoInterno: 20, prazoResposta: _diasPara(-2), status: 'Prorrogado', novaDataResposta: _diasPara(8), observacao: 'Prorrogação concedida pela Ouvidoria.' },
  { nup: '2026.000105', area: 'Assistência Social', resumo: 'Reclamação sobre atraso na análise do benefício assistencial', dataAbertura: _diasPara(-24), prazoInterno: 20, prazoResposta: _diasPara(0), status: 'Em andamento', novaDataResposta: null, observacao: '' },
  { nup: '2026.000106', area: 'Meio Ambiente', resumo: 'Denúncia de descarte irregular de lixo em área de preservação', dataAbertura: _diasPara(-18), prazoInterno: 20, prazoResposta: _diasPara(2), status: 'Em andamento', novaDataResposta: null, observacao: '' },
  { nup: '2026.000107', area: 'Educação', resumo: 'Manifestação sobre falta de material escolar', dataAbertura: _diasPara(-30), prazoInterno: 20, prazoResposta: _diasPara(-6), status: 'Concluído', novaDataResposta: null, observacao: 'Resolvido após envio de material.' },
  { nup: '2026.000108', area: 'Obras e Infraestrutura', resumo: 'Pedido de reparo em iluminação pública', dataAbertura: _diasPara(-16), prazoInterno: 20, prazoResposta: _diasPara(-1), status: 'Prorrogado', novaDataResposta: _diasPara(5), observacao: 'Serviço agendado para a próxima semana.' },
  { nup: '2026.000109', area: 'Saúde', resumo: 'Elogio ao atendimento prestado pela equipe do posto de saúde', dataAbertura: _diasPara(-15), prazoInterno: 20, prazoResposta: _diasPara(-8), status: 'Concluído', novaDataResposta: null, observacao: '' },
  { nup: '2026.000110', area: 'Assistência Social', resumo: 'Solicitação de acompanhamento de caso em CRAS', dataAbertura: _diasPara(-21), prazoInterno: 20, prazoResposta: _diasPara(-4), status: 'Em andamento', novaDataResposta: null, observacao: '' },
  { nup: '2026.000111', area: 'Meio Ambiente', resumo: 'Reclamação sobre poda de árvores em via pública', dataAbertura: _diasPara(-14), prazoInterno: 20, prazoResposta: _diasPara(3), status: 'Em andamento', novaDataResposta: null, observacao: '' },
  { nup: '2026.000112', area: 'Educação', resumo: 'Pedido de informação sobre calendário de matrícula', dataAbertura: _diasPara(-12), prazoInterno: 20, prazoResposta: _diasPara(6), status: 'Em andamento', novaDataResposta: null, observacao: '' },
  { nup: '2026.000113', area: 'Obras e Infraestrutura', resumo: 'Denúncia de calçada danificada em frente a escola', dataAbertura: _diasPara(-11), prazoInterno: 20, prazoResposta: _diasPara(7), status: 'Em andamento', novaDataResposta: null, observacao: '' },
  { nup: '2026.000114', area: 'Saúde', resumo: 'Solicitação de medicamento em falta na farmácia popular', dataAbertura: _diasPara(-10), prazoInterno: 20, prazoResposta: _diasPara(9), status: 'Em andamento', novaDataResposta: null, observacao: '' }
];

/* ---------- Histórico de ações (espelho do banco SQLite, temporário em memória) ---------- */
let HISTORICO = [
  { data: _diasPara(-1) + ' 09:15', tipo: 'identificado', texto: 'Processo identificado na planilha.', nup: '2026.000101' },
  { data: _diasPara(-1) + ' 09:20', tipo: 'preparado', texto: 'E-mail inicial preparado.', nup: '2026.000101' },
  { data: _diasPara(-1) + ' 09:25', tipo: 'confirmado', texto: 'Envio confirmado pelo usuário.', nup: '2026.000101' },
  { data: _diasPara(0) + ' 08:10', tipo: 'identificado', texto: 'Processo identificado na planilha.', nup: '2026.000105' },
  { data: _diasPara(0) + ' 08:30', tipo: 'preparado', texto: 'E-mail de lembrete preparado.', nup: '2026.000105' },
  { data: _diasPara(0) + ' 08:31', tipo: 'aberto', texto: 'Outlook aberto.', nup: '2026.000105' }
];

/* ---------- Serviço de prazos (frontend — espelho do prazo_service backend) ---------- */
function calcularPrazo(isoAbertura, prazoInterno) {
  return _addDiasUteis(isoAbertura, prazoInterno || CONFIG.prazoPadrao);
}
function calcularLembrete(isoVencimento) {
  return _subDiasUteis(isoVencimento, CONFIG.diasAntesVencimento);
}
function diasUteisRestantes(isoVencimento, isoRef) {
  return _diasUteisEntre(isoRef || _dataISO(_hoje), isoVencimento);
}

/* Status derivado a partir do estado manual + datas. */
function derivarStatus(p) {
  if (p.status === 'Concluído') return 'Concluído';
  const vencimento = p.novaDataResposta || p.prazoResposta;
  const hojeISO = _dataISO(_hoje);
  const restantes = diasUteisRestantes(vencimento, hojeISO);
  if (p.status === 'Prorrogado') return 'Prorrogado';
  if (vencimento < hojeISO) return 'Vencido';
  if (vencimento === hojeISO) return 'Vence hoje';
  if (restantes <= CONFIG.diasAntesVencimento) return 'Próximo do vencimento';
  return 'Em andamento';
}

/* Contatos da área (chefe + pontos focais ativos) para preparo de e-mail. */
function contatosDaArea(nomeArea) {
  const area = AREAS.find(a => a.nome === nomeArea);
  if (!area) return { chefe: null, pontosFocais: [] };
  const chefe = area.contatos.find(c => c.tipo === 'Chefe' && c.ativo);
  const pontosFocais = area.contatos.filter(c => c.tipo === 'Ponto focal' && c.ativo);
  return { chefe, pontosFocais };
}

/* Substitui variáveis {VAR} nos modelos de e-mail. */
function montarEmail(processo, tipoModelo) {
  const modelo = MODELOS_EMAIL[tipoModelo];
  if (!modelo) return null;
  const vencimento = processo.novaDataResposta || processo.prazoResposta;
  const variaveis = {
    NUP: processo.nup,
    AREA: processo.area,
    RESUMO: processo.resumo,
    DATA_ABERTURA: processo.dataAbertura,
    PRAZO_RESPOSTA: vencimento,
    PRAZO_ORIGINAL: processo.prazoResposta,
    NOVA_DATA: processo.novaDataResposta || ''
  };
  let assunto = modelo.assunto;
  let corpo = modelo.corpo;
  for (const [chave, valor] of Object.entries(variaveis)) {
    const re = new RegExp('\\{' + chave + '\\}', 'g');
    assunto = assunto.replace(re, valor);
    corpo = corpo.replace(re, valor);
  }
  return { tipo: tipoModelo, assunto, corpo, destinatarios: contatosDaArea(processo.area) };
}

/* Timeline do processo: eventos visuais + e-mails. */
function timelineDoProcesso(processo) {
  const vencimento = processo.novaDataResposta || processo.prazoResposta;
  const lembrete = calcularLembrete(vencimento);
  const eventos = [
    { tipo: 'inicio', rotulo: 'INÍCIO', data: processo.dataAbertura, descricao: 'Abertura da manifestação' },
    { tipo: 'email', modelo: 'Inicial', rotulo: 'E-MAIL INICIAL', data: processo.dataAbertura, descricao: 'Comunicar abertura à área' },
    { tipo: 'email', modelo: 'Lembrete', rotulo: 'LEMBRETE', data: lembrete, descricao: 'Último dia para solicitar prorrogação' },
    { tipo: 'vencimento', rotulo: 'VENCIMENTO', data: vencimento, descricao: processo.novaDataResposta ? 'Novo prazo (prorrogado)' : 'Prazo final' }
  ];
  if (processo.novaDataResposta) {
    eventos.splice(3, 0, { tipo: 'prorrogacao', rotulo: 'PRORROGAÇÃO', data: processo.prazoResposta, descricao: 'Prazo original: ' + processo.prazoResposta });
  }
  return eventos.sort((a, b) => a.data.localeCompare(b.data));
}

/* ---------- Validação (espelho das regras de validação do backend) ---------- */
function validarDados() {
  const problemas = [];
  const nupsVistos = new Set();
  const areasValidas = new Set(AREAS.map(a => a.nome));
  for (const p of PROCESSOS) {
    if (!p.nup || !p.nup.trim()) problemas.push({ nup: '(vazio)', msg: 'NUP vazio.' });
    if (nupsVistos.has(p.nup)) problemas.push({ nup: p.nup, msg: 'NUP duplicado.' });
    nupsVistos.add(p.nup);
    if (!areasValidas.has(p.area)) problemas.push({ nup: p.nup, msg: 'Área "' + p.area + '" não está cadastrada.' });
    if (!p.dataAbertura) problemas.push({ nup: p.nup, msg: 'Data de abertura inválida.' });
    const c = contatosDaArea(p.area);
    if (c.chefe === null && c.pontosFocais.length === 0)
      problemas.push({ nup: p.nup, msg: 'Área "' + p.area + '": nenhum e-mail cadastrado.' });
  }
  return problemas;
}

/* =========================================================================
 * Duas planilhas: Ouvidoria e LAI.
 * -------------------------------------------------------------------------
 * Cada módulo representa uma planilha diferente. Por enquanto os itens são
 * idênticos; quando as planilhas reais forem conectadas, cada dataset terá
 * seus próprios PROCESSOS / AREAS / HISTORICO / MODELOS_EMAIL.
 * ========================================================================= */
function _clone(o) { return JSON.parse(JSON.stringify(o)); }

const DATASETS = {
  ouvidoria: { nome: 'Ouvidoria', CONFIG, FERIADOS, AREAS, MODELOS_EMAIL, PROCESSOS, HISTORICO },
  lai: { nome: 'LAI', CONFIG: _clone(CONFIG), FERIADOS: _clone(FERIADOS), AREAS: _clone(AREAS), MODELOS_EMAIL: _clone(MODELOS_EMAIL), PROCESSOS: _clone(PROCESSOS), HISTORICO: _clone(HISTORICO) }
};

let _modulo = 'ouvidoria';
function setModulo(modulo) {
  if (!DATASETS[modulo]) modulo = 'ouvidoria';
  _modulo = modulo;
  const d = DATASETS[modulo];
  CONFIG = d.CONFIG; FERIADOS = d.FERIADOS; AREAS = d.AREAS;
  MODELOS_EMAIL = d.MODELOS_EMAIL; PROCESSOS = d.PROCESSOS; HISTORICO = d.HISTORICO;
  _feriadosISO = new Set(FERIADOS.map(f => f.data));
  window.CONFIG = CONFIG; window.FERIADOS = FERIADOS; window.AREAS = AREAS;
  window.MODELOS_EMAIL = MODELOS_EMAIL; window.PROCESSOS = PROCESSOS; window.HISTORICO = HISTORICO;
  return _modulo;
}
function getModulo() { return _modulo; }

/* Exporta para uso nos demais módulos (escopo global do navegador). */
setModulo('ouvidoria');
window.DATASETS = DATASETS;
window.Dados = {
  hojeISO: _dataISO(_hoje),
  calcularPrazo, calcularLembrete, diasUteisRestantes, derivarStatus,
  contatosDaArea, montarEmail, timelineDoProcesso, validarDados,
  setModulo, getModulo, datasets: DATASETS
};
