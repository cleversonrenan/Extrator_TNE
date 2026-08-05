# CSM Dashboard — TNE

Dashboard operacional para acompanhamento de chamados técnicos do TNE (TNE1: AL,
BA, SE, PI • TNE2: PE, PB, RN, CE), reconstruído a partir do HTML legado de arquivo
único (`CSM_EXTRATOR_TNE_v4_1.html`) seguindo o prompt mestre de arquitetura.

## ⚠️ Como rodar

Este projeto usa **ES Modules nativos** (`import`/`export`). Isso **não funciona**
abrindo `index.html` direto no navegador (`file://`) — o Chrome/Edge bloqueiam por
CORS. Rode com um servidor local ou publique num host estático:

```bash
# opção 1: servidor rápido com Node
npx serve .

# opção 2: servidor rápido com Python
python3 -m http.server 8000

# opção 3: extensão "Live Server" do VS Code
```

Ou publique em GitHub Pages / Netlify / servidor interno da TIM — qualquer host
HTTP/HTTPS serve.

## Arquitetura

```
/CSM-Dashboard
  index.html          → esqueleto HTML + <link> dos CSS + <script type="module" src="app.js">
  app.js              → bootstrap: estado único da aplicação + orquestração dos componentes
  /css                → 1 responsabilidade visual por arquivo (variables/reset/layout/cards/tables/...)
  /components         → funções de render + wiring de eventos, sem lógica de negócio
  /services           → lógica de negócio pura (parsers, filtros, SLA, exportação, storage)
  /utils              → funções puras reaproveitáveis (sem estado, sem DOM)
  DIAGNOSTICO_E_ARQUITETURA.md → Fase 1 (diagnóstico do HTML legado) e Fase 2 (plano desta arquitetura)
```

### Fluxo de dados

```
Upload (arquivo ou texto)
  → ImportService            (orquestra: ExcelService lê → Parser normaliza → estatísticas)
  → app.js: state.raw[tipo]  (guarda os itens normalizados dessa fonte)
  → FilterService.mergeSources()       → junta Agendadas + Não Agendadas + Eventos, dedup, exclui Concluída/Cancelada
  → FilterService.applyCrossReference() → marca isConcentrador / isMissaoCritica usando a Base Auxiliar
  → state.combined            (dataset único, "verdade" da aplicação)
  → FilterService.applyFilters() + Table.sortItems()  → o que é exibido agora
  → Table.renderTable() + StatsCards.renderStatsCards() + Header.renderHeader()
```

Não existem variáveis globais soltas: tudo vive em `state` (dentro de `app.js`) e é
passado explicitamente para cada serviço/componente.

## Como adicionar um novo parser (nova planilha)

1. Crie `/services/MinhaNovaPlanilhaParser.js`, estendendo `BaseParser` se o
   formato for "linha de atividade" (mesmas colunas de UF/TSK/Prioridade/Estado),
   ou implementando o contrato do zero (como `EventosParser`) se o formato for
   diferente (texto colado, por exemplo).
2. Registre no `ParserFactory.js` (`PARSER_REGISTRY`).
3. Adicione um card de upload em `index.html` e uma função `wire*Card()` em
   `app.js` (copie `wireAtividadesCard` como molde).

## Como adicionar um novo filtro

1. Adicione a chave/lista em `utils/constants.js` (siga o padrão de `ESTADO_KEYS`).
2. Adicione o `case` correspondente em `FilterService.applyFilters()`.
3. Adicione o(s) botão(ões) em `index.html` (`data-filter="sua-chave"`) — o clique
   já é capturado automaticamente pelo listener delegado em `Filters.js`, desde
   que a chave apareça em algum dos arrays de `constants.js` verificados em
   `refreshActiveStates`/`initFilters`.

## Como adicionar um novo gráfico

Ainda não implementado nesta entrega (ver seção "Próxima iteração" abaixo).
Quando entrar: criar `services/ChartService.js` (monta os datasets a partir de
`state.combined`) + `components/Charts.js` (desenha com Chart.js), seguindo o
mesmo padrão de "serviço calcula, componente desenha" usado em `StatsCards`.

## Como depurar

- Erros de import/módulo aparecem no console do navegador com o caminho exato do
  arquivo — abra o DevTools (F12) e olhe a aba Console/Network.
- Erros de parsing de planilha aparecem no card de upload (mensagem vermelha) e
  também via toast no canto inferior direito.
- `ExcelService` cacheia por nome+tamanho+data do arquivo — se parecer que uma
  alteração no arquivo não "pegou", confirme que o arquivo foi realmente salvo
  com conteúdo novo (o cache usa `file.lastModified`).

## Regras de negócio já migradas do HTML legado (preservadas)

- **TNE1/TNE2** por UF: `TNE1 = AL,BA,SE,PI` / `TNE2 = PE,PB,RN,CE` (`resolveTneRegion`).
- **Missão Crítica (MC)**: Sites Dependentes por Tx ≥ 4 **e** campo Falha contendo
  "energia", vindo da planilha Base Auxiliar (u_task_evento).
- **Exclusão automática** de chamados com Estado "Concluída" ou "Cancelada" — não
  aparecem em nenhuma tela nem contam nas estatísticas.
- **Cores de linha por prioridade** (P1-P5, tons bem claros) e destaque mais forte
  para linhas de Concentrador.

## Próxima iteração (fora do escopo desta entrega — ver DIAGNOSTICO_E_ARQUITETURA.md)

- Gráficos (`ChartService.js` + `Charts.js`, via Chart.js).
- Paginação / scroll virtual (tabela hoje renderiza tudo de uma vez — ok até
  poucos milhares de linhas, precisa de trabalho extra para 35k+).
- Suporte a `.ods`.
- Exportação em PDF.
- Web Workers para arquivos muito grandes.
- Painel de log lateral (`LogPanel.js`) e assistente de workflow visual (`Workflow.js`).
- Testes automatizados formais (hoje a validação é manual, com as planilhas reais).
