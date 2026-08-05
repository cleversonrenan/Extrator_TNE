# CSM Dashboard (TMG/TNE) — Fase 1: Diagnóstico & Fase 2: Planejamento

> Antes de sair reescrevendo tudo, segui o próprio roteiro do prompt mestre: primeiro
> diagnóstico real do que existe, depois arquitetura, e só então código. Entrego isso
> aqui pra você validar antes de eu partir pra Fase 3/4 (que é o grosso do trabalho).

---

## FASE 1 — DIAGNÓSTICO

Analisei o `CSM_EXTRATOR_TNE_v4_1.html` (versão atual, pós os ajustes de MC, TNE1/2,
Estado, layout etc.). Números reais do arquivo:

| Métrica | Valor |
|---|---|
| Linhas totais | 1.422 |
| Linhas só de `<script>` | ~1.022 (72% do arquivo) |
| Regras CSS | ~142 |
| Funções JS | 30 |
| Variáveis globais no escopo do script | 25 (dataStore, combinedData, selectedUF, selectedTNE, selectedEstado, currentSort, etc.) |
| Uso de `innerHTML` sem sanitização | 4 pontos |
| Uso de `eval()` | 0 (ok) |
| Handlers inline (`onclick=`) | 0 (ok, já usa `addEventListener`) |
| Estilos inline (`style="..."`) | 30 ocorrências |
| Biblioteca Excel | SheetJS (`xlsx.full.min.js`) via CDN |
| Gráficos | Nenhum ainda (só cards de estatística) |
| Persistência | Nenhuma (tudo se perde ao recarregar a página) |
| Paginação / scroll virtual | Não existe — tabela renderiza tudo de uma vez |
| Tema escuro | Não existe |
| Web Workers | Não existe |
| Testes automatizados | Não existem |

### Problemas identificados (reais, não hipotéticos)

1. **Tudo em um arquivo só.** HTML, CSS e JS misturados em `<style>`/`<script>` inline.
   Qualquer alteração pequena (como as que fizemos nas últimas mensagens) exige
   reabrir um arquivo de 1.400+ linhas e caçar o trecho certo.
2. **25 variáveis globais** compartilhando o mesmo escopo de script — alto
   acoplamento. Uma função pode alterar `selectedTNE` sem que isso fique óbvio pra
   quem lê `applyFiltersAndSort`.
3. **Parsers de planilha misturados** dentro da mesma função (`processRow` cobre
   Agendadas e Não Agendadas ao mesmo tempo, com `if/else` internos).
4. **Renderização "burra" da tabela** — a cada filtro, o `innerHTML` inteiro do
   `<tbody>` é reconstruído via concatenação de string. Funciona bem até ~2-3 mil
   linhas; acima disso trava a UI (sem paginação nem scroll virtual, isso vira
   gargalo real com 35 mil+ registros, que é a escala mencionada no prompt mestre).
5. **Sem cache/persistência.** Toda vez que você atualiza a página, precisa
   re-subir as 4 planilhas de novo.
6. **Sem separação Parser → Service → Component.** A leitura do Excel, a lógica de
   cruzamento (concentrador/missão crítica), o cálculo de SLA e a renderização da
   tabela estão todos no mesmo `<script>`, sem fronteiras.
7. **Feedback do upload é mínimo** — mostra "X IDs carregados", não o nível de
   detalhe que o prompt mestre pede (válidos, ignorados, duplicados, erros).
8. **Sem gráficos.** O prompt mestre pede vários (prioridade, UF, tipo de falha
   etc.) — hoje não existe nenhum.
9. **Sem testes e sem README** de arquitetura.

### O que está bom e deve ser preservado

- Lógica de negócio já validada em produção: cruzamento com concentradores, marcador
  de Missão Crítica (MC), regra TNE1/TNE2 por UF, SLA por prioridade, exclusão de
  Concluídos/Cancelados, exportação XLSX.
- Nenhum uso de `eval()`, nenhum handler inline — a base de segurança já é decente.
- Já existe uma "Factory" embrionária: `findColumn()` já tenta várias variações de
  nome de coluna, é a semente do `ParserFactory`.

---

## FASE 2 — PLANEJAMENTO DA NOVA ARQUITETURA

### Decisão arquitetural crítica (preciso alinhar com você antes de codar)

O prompt mestre pede módulos ES (`/components`, `/services`, `/utils` como arquivos
`.js` separados). Isso normalmente é feito com **ES Modules** (`import`/`export`).
Problema real: **ES Modules não funcionam abrindo o HTML direto por duplo-clique**
(`file://`) no Chrome/Edge — o navegador bloqueia por CORS. Como você hoje
provavelmente abre o dashboard direto do arquivo (sem servidor), isso quebraria o
uso diário.

Duas opções:

- **Opção A (recomendada): manter tudo nativo sem `import/export`.**
  Cada arquivo em `/services` e `/components` vira um script comum (`<script src="...">`),
  registrando-se num namespace único (`window.CSM = window.CSM || {}`). Funciona
  em `file://`, sem servidor, sem build step — 100% alinhado com "usar apenas
  tecnologias nativas" e "sem frameworks pesados" do prompt mestre.
- **Opção B: ES Modules de verdade**, mas exige rodar com um mini-servidor local
  (ex: `npx serve`, extensão Live Server do VS Code, ou publicar no GitHub Pages).
  Mais "correto" estruturalmente, porém muda seu fluxo de uso atual.

**Vou seguir a Opção A por padrão**, porque preserva seu fluxo de trabalho atual
(abrir o HTML direto), a não ser que você prefira a B (por exemplo, se for hospedar
isso num servidor interno da TIM).

### Mapa de arquivos proposto (adaptado à Opção A)

```
/CSM-Dashboard
  /index.html                → esqueleto de HTML + <script src="..."> em ordem de dependência
  /css
    variables.css            → cores, espaçamentos, tipografia (design tokens)
    reset.css                → normalize básico
    layout.css                → grid geral, header, sidebar/topbar, responsividade
    cards.css                → cartões de upload, stats cards
    tables.css                → tabela, badges de prioridade/SLA/cruzamento
    charts.css                → contêineres dos gráficos
    upload.css                → drag-and-drop, barra de progresso
    modal.css                → modal de detalhes de linha
    theme.css                → variáveis do tema claro/escuro
  /utils
    constants.js              → TNE_MAP, PRIORITY_KEYS, SLA_KEYS, ESTADO_KEYS...
    helpers.js                → normalizeEndId, findColumn, toggleSet...
    dates.js                  → parse de datas BR, cálculo de SLA/tempo restante
    colors.js                 → paletas de UF/TNE/prioridade
    validators.js             → arquivo vazio, colunas ausentes, duplicados
    icons.js                  → mapa de emojis/ícones usados nos badges
  /services
    ExcelService.js           → wrapper único do SheetJS (ler 1x, cachear)
    ParserFactory.js          → decide qual parser usar por nome/colunas do arquivo
    BaseParser.js             → contrato comum (validate → parse → normalize)
    AgendadasParser.js
    NaoAgendadasParser.js
    EventosParser.js          → cobre Genesis + u_task_evento (Concentradores/MC)
    FilterService.js          → toda a lógica de applyFiltersAndSort
    SLAService.js             → getSLAInfo, cálculo de estourado/no prazo
    ChartService.js           → monta datasets pros gráficos (Chart.js)
    ExportService.js          → XLSX/CSV/JSON/clipboard
    StorageService.js         → tema, filtros e colunas no LocalStorage
  /components
    Header.js
    Workflow.js                → os 7 passos do assistente de importação
    UploadCard.js               → 1 componente reutilizado 4x (Agendadas/Não Agendadas/Genesis/Concentradores)
    StatsCards.js
    Filters.js
    Table.js                    → renderização + ordenação + paginação
    Charts.js
    Toolbar.js                  → busca + exportação
    LogPanel.js                 → console lateral de eventos
    Toast.js
    Loading.js
  /app.js                      → bootstrap: carrega dataStore, liga eventos, orquestra os componentes
  /assets
    /icons
  README.md
```

### Fluxo de dados (Clean Architecture simplificada)

```
Upload (arquivo)
   → ExcelService.readOnce(file)         [lê 1x, cacheia AOA/JSON bruto]
   → ParserFactory.getParser(fileMeta)   [decide: Agendadas | NãoAgendadas | Eventos]
   → BaseParser.validate() → .parse() → .normalize()
   → StorageService.cacheDataset()       [opcional: localStorage p/ sessão]
   → dataStore (estado único, sem variáveis soltas)
   → FilterService.apply(dataStore, filtros ativos)
   → Table.render() + Charts.render() + StatsCards.render()  [todos leem o mesmo resultado filtrado]
```

Isso resolve o problema #2 do diagnóstico (25 globais soltas): passam a existir
**um único objeto de estado** (`dataStore`) e serviços puros que recebem/retornam
dados, sem mexer em variável global espalhada.

### O que muda de verdade vs. o HTML atual

| Hoje | Depois |
|---|---|
| 1 arquivo de 1.400 linhas | ~28 arquivos pequenos, cada um com uma responsabilidade |
| Parser único com `if/else` | 1 parser por planilha + Factory |
| `applyFiltersAndSort()` gigante | `FilterService` com funções pequenas testáveis |
| Sem paginação | Paginação + opção de scroll virtual acima de N linhas |
| Sem gráficos | `ChartService` + `Charts.js` (Chart.js via CDN) |
| Sem persistência | Tema/filtros/colunas salvos no LocalStorage |
| Log só no `console.log` | Painel de log lateral, copiável |

### O que fica para uma 2ª rodada (não travar a entrega)

Pra ser honesto sobre escopo: os itens abaixo do prompt mestre são reais mas
grandes o suficiente pra merecer sprints próprios depois que o esqueleto novo
estiver rodando e validado com dados reais:

- Suporte a ODS (SheetJS cobre XLSX/XLS/CSV nativamente; ODS exige biblioteca
  adicional ou conversão).
- PDF na exportação (precisa de uma lib extra tipo jsPDF).
- Web Workers para o parse (só vale a pena a partir de arquivos realmente grandes,
  ex. 20k+ linhas — vou medir antes de adicionar complexidade).
- Scroll virtual "de verdade" (vou começar com paginação inteligente, que resolve
  99% do uso diário, e evoluo pra virtual scroll se a paginação não bastar).
- Suíte de testes automatizados formal — vou validar manualmente com as planilhas
  reais que você já usa (as 4 que você mandou) a cada etapa, e documentar os casos
  no README.

---

## Próximo passo

Se você validar esse diagnóstico e a decisão da Opção A (scripts nativos, sem
servidor), eu começo a Fase 3/4: monto a estrutura de pastas de verdade com código
funcionando, migrando a lógica que já existe (cruzamento, MC, TNE1/2, SLA, Estado)
sem perder nada, e entrego incrementalmente pra você testar em cima das suas
planilhas reais.

Prefere que eu já comece pelos `/utils` e `/services` (a base, sem interface ainda),
ou que eu monte o `index.html` + `app.js` funcionando de ponta a ponta primeiro
(mesmo que mais simples) e vá refinando componente por componente?
