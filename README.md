# Sistema de Monitoramento de Prazos da Ouvidoria — Frontend

Protótipo de validação visual (Etapa Frontend). Ainda **não** há backend — os dados
são fictícios, carregados em `js/data.js` (que espelha a lógica que o Flask fará depois).

## Como abrir

Basta abrir o arquivo `index.html` em qualquer navegador moderno (duplo clique):

```
frontend/index.html
```

Não requer Node.js, npm, servidor nem internet — é HTML + CSS + JavaScript puro,
sem nenhuma dependência externa (gráficos em SVG próprio).

## Estrutura

```
frontend/
├── index.html          # shell da aplicação (sidebar, topbar, containers)
├── css/styles.css      # design system completo (responsivo, institucional)
└── js/
    ├── data.js         # dados fictícios + motor de prazos (dias úteis, feriados)
    ├── charts.js       # gráficos SVG (doughnut, barras) sem CDN
    └── app.js          # controlador SPA (rotas, filtros, modais, calendário)
```

## O que já está implementado

- **Dashboard**: KPIs (total, em andamento, próximos, vence hoje, prorrogados, vencidos, concluídos),
  "Ações de hoje", gráfico de processos por status, por área e evolução de vencimentos, e lista priorizada.
- **Processos**: listagem com filtros (área, status, período, prorrogado, busca por NUP) e ordenação.
- **Detalhe do processo**: dados completos, timeline (início → e-mail inicial → lembrete → vencimento/prorrogação) e histórico.
- **Calendário**: visualização mensal com marcadores de vencimento, lembrete, prorrogação e vencido.
- **Fluxo de e-mail**: modal "Preparar e-mail" → "Abrir o Outlook?" → "O e-mail foi enviado?" (confirmação manual).
  *Nesta etapa o envio é simulado; a integração real com o Outlook entra no backend.*

## Regras respeitadas (do PRD)

- Prazos calculados em **dias úteis**, ignorando sábado, domingo e feriados cadastrados.
- Prazo padrão de 20 dias úteis; lembrete 2 dias úteis antes do vencimento.
- Prorrogação substitui a data de acompanhamento (mostra "Prazo original → Novo prazo").
- O sistema **nunca envia e-mail automaticamente** — sempre registro "Envio confirmado pelo usuário".
- Dados fictícios (14 processos, 5 áreas, feriados nacionais 2026).
