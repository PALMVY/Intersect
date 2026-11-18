# Retoque visual (Arché) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar o visual do Stitch (obsidiana, dourado, três fontes, vidro) em login, trilha e Casa, com a trilha em caminho de 12 nós em zigue-zague, sem mudar lógica, banco, rotas nem conteúdo.

**Architecture:** Tokens de cor em `:root` de `globals.css`, fontes por `next/font/google` expostas como variáveis CSS. A trilha nasce de uma função pura `buildTrail` (JSON das Casas + constante `ROADMAP` + progresso) que alimenta um componente `Trail` sem estado. O zigue-zague é CSS grid por fase mais uma linha SVG tracejada; no celular vira coluna única.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, `next/font/google`, CSS puro (sem Tailwind), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-18-redesign-visual-design.md` (aprovada por Sam em 18/11/2026, com as decisões abaixo).

## Decisões de Sam na aprovação (18/11/2026)

- Os 4 pontos da §11 da spec estão aprovados.
- "Validada" (`bypassed`) aparece em **dourado vazado** (borda dourada, fundo transparente) com o texto "Validada", e é clicável.
- O zigue-zague em SVG entra já neste corte, **com tempo limitado** (Task 5).
- O README ganha o registro da data do deploy, para separar a medição em antes e depois.

## Global Constraints

- Não mudar lógica (`src/lib/progress`, `src/lib/quiz`, `src/lib/content`), banco, rotas, autenticação nem `content/houses`. Os 58 testes atuais continuam passando (só `house-list.test.tsx` é substituído).
- Fluxo de trabalho: copiar o projeto para o ambiente do Claude (`device_stage_files`), rodar `npm install`/`npm test` lá e devolver os arquivos com `device_commit_files`. **Nunca rodar git no shell do dispositivo e nunca gravar `.env*`.** Sam faz `git add -A` e `git commit` na máquina dele ao final (os passos "Commit" abaixo são marcos de revisão, não comandos para o Claude).
- Tokens (valores exatos da spec §6): fundo `#090A0F`; vidro `rgba(14,17,24,0.7)` + `backdrop-filter: blur(16px)`; vidro elevado `rgba(20,24,34,0.85)` + `blur(24px)`; dourado `#E2B96F`; brilho `0 0 24px -4px rgba(226,185,111,0.15)`; texto `#F8FAFC`; borda `rgba(255,255,255,0.08)`; borda do vidro elevado `rgba(226,185,111,0.2)`; raio `4px`.
- Texto secundário: `#94A3B8` (7,7:1 sobre o fundo; 6,9:1 sobre o vidro elevado). Nunca `#64748B` (4,16:1, reprova).
- Dourado só em ações, estados ativos e brilho; nunca em fundos grandes.
- Fontes: Playfair Display (títulos e citações), Plus Jakarta Sans (texto), JetBrains Mono (rótulos em caixa alta com espaçamento). Subset `latin`, `display: "swap"`, só os pesos listados na Task 2.
- Botão principal: transparente, borda dourada, texto dourado em mono; hover com fundo dourado a 10% e brilho.
- Nada inventado na interface: sem coordenadas, Hz, percentuais de integração, média da comunidade, oráculo, conceitos-chave ou diagrama.
- Cabeçalho da trilha: marca "ARCHÉ" + botão Sair, sem as abas do Stitch.
- A mini-prova continua sempre aberta.
- Acessibilidade: texto ≥ 4,5:1; anel de foco `2px solid #E2B96F` com `outline-offset: 2px` em `:focus-visible`; estado sempre em texto, nunca só por cor; animações desligadas com `prefers-reduced-motion: reduce`.
- Esmaecido = cor `--text-muted` e borda neutra, **não** `opacity` (opacidade derruba o contraste do texto abaixo de 4,5:1).

## Review Focus

- Nenhuma Casa no JSON (`houses = []`): a trilha mostra os 12 nós "Em breve" e **não** mostra "Você concluiu todas as Casas disponíveis" (`[].every(...)` é `true`, armadilha). Teste na Task 3.
- Casa com conteúdo sem linha de progresso (Casa nova adicionada antes da reconciliação): o nó fica bloqueado e sem link, não quebra. Teste na Task 3.
- Casa com conteúdo fora de 1 a 12 no `ROADMAP`: aparece como nó extra no fim, com o título e a fase do JSON, em vez de sumir. Teste na Task 3.
- Nó esmaecido com texto ilegível: o par `--text-muted` sobre o vidro precisa passar 4,5:1. Teste na Task 1.
- Navegação por teclado na trilha: Tab passa só pelos nós clicáveis e pelo Sair, com anel de foco visível. Teste na Task 4 (nós inativos sem `tabindex` e sem link) e verificação manual na Task 7.

---

### Task 1: Tokens de cor e teste de contraste

**Files:**
- Modify: `src/app/globals.css` (bloco `:root`)
- Create: `src/lib/theme/contrast.ts`
- Test: `tests/unit/contrast.test.ts`

**Interfaces:**
- Produces: `contrastRatio(foreground: string, background: string): number` (hex `#RRGGBB`, fórmula de luminância relativa da WCAG 2.x); `readCssColorTokens(css: string): Record<string, string>` (lê as variáveis `--nome: #hex;` do primeiro bloco `:root`, ignora valores que não são hex). Variáveis CSS: `--bg`, `--glass`, `--glass-elevated`, `--surface-solid` (`#141822`, cor sólida equivalente ao vidro elevado para cálculo), `--gold`, `--glow`, `--text`, `--text-muted`, `--border`, `--border-gold`, `--danger`, `--success`, `--radius`, `--font-serif`, `--font-sans`, `--font-mono` (as três últimas vêm da Task 2).

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from "node:fs";
import { contrastRatio, readCssColorTokens } from "@/lib/theme/contrast";

const tokens = readCssColorTokens(readFileSync("src/app/globals.css", "utf8"));

it("calcula a razão conhecida de preto sobre branco", () => {
  expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
});
it("reprova o cinza original do Stitch", () => {
  expect(contrastRatio("#64748B", "#090A0F")).toBeLessThan(4.5);
});
it.each(["--text", "--text-muted", "--gold", "--danger", "--success"])(
  "%s passa 4,5:1 sobre o fundo e sobre o vidro elevado",
  (name) => {
    expect(contrastRatio(tokens[name], tokens["--bg"])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(tokens[name], tokens["--surface-solid"])).toBeGreaterThanOrEqual(4.5);
  },
);
```

- [ ] **Step 2:** `npx vitest run tests/unit/contrast.test.ts` → FAIL (módulo não existe).
- [ ] **Step 3:** Implementar `contrast.ts` e trocar o `:root` de `globals.css` pelos tokens das Global Constraints. `--danger: #FCA5A5`, `--success: #86EFAC`. `--glass`, `--glow` e bordas em `rgba(...)` (o leitor ignora, não são texto).
- [ ] **Step 4:** `npx vitest run tests/unit/contrast.test.ts` → PASS.
- [ ] **Step 5: Commit** — `style: tokens do Arché com teste de contraste`

### Task 2: Fontes e estilos base

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/globals.css` (base, botões, inputs, foco, vidro, estados, movimento reduzido)

**Interfaces:**
- Consumes: tokens da Task 1.
- Produces: classes `.glass`, `.glass-elevated`, `.btn-primary`, `.label-mono` (mono, caixa alta, `letter-spacing: 0.12em`), `.state`, `.state-error`, `.notice`, `.notice-success`, usadas pelas Tasks 4 a 6.

- [ ] **Step 1:** Em `layout.tsx`, carregar `Playfair_Display` (pesos 400 e 600, estilos normal e itálico), `Plus_Jakarta_Sans` (400, 500, 600) e `JetBrains_Mono` (400, 500), todas com `subsets: ["latin"]`, `display: "swap"` e `variable` = `--font-serif`, `--font-sans`, `--font-mono`; aplicar as três classes `variable` no `<html>`.
- [ ] **Step 2:** Em `globals.css`: `body` com `--font-sans` e `--bg`; `h1, h2, h3` com `--font-serif`; `button` padrão vira o botão principal das Global Constraints; `.btn-primary:hover` com fundo `rgba(226,185,111,0.1)` e `box-shadow: var(--glow)`; `:focus-visible` como nas Global Constraints; `.state`, `.state-error` (texto `--danger`, borda `--danger`) e `.notice` dentro de `.glass`; `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }`. `main` passa a `max-width: 1100px`.
- [ ] **Step 3:** `npm test` → 58 testes atuais + Task 1 passam. `npm run typecheck` → sem erros.
- [ ] **Step 4:** `npm run build`. Se falhar só por não alcançar o Google Fonts a partir do ambiente do Claude, registrar e seguir: o build real roda na Vercel e na máquina do Sam (mesma limitação de rede já descrita no HANDOFF).
- [ ] **Step 5: Commit** — `style: fontes e estilos base do Arché`

### Task 3: Dados da trilha (`ROADMAP` + `buildTrail`)

**Files:**
- Create: `src/lib/trail/roadmap.ts`
- Test: `tests/unit/trail-data.test.ts`

**Interfaces:**
- Consumes: `House` (`@/lib/content/schema`), `ProgressRow`, `HouseState` (`@/lib/progress/state`).
- Produces:
  - `type RoadmapEntry = { orderIndex: number; title: string; phase: 1 | 2 | 3 | 4 }`
  - `PHASE_NAMES: Record<1 | 2 | 3 | 4, string>` = `{1: "O Despertar", 2: "A Engrenagem e o Cosmos", 3: "Os Porões da Mente", 4: "O Tabuleiro de Xadrez"}`
  - `ROADMAP: RoadmapEntry[]` com as 12 Casas da tabela da spec §8, títulos exatamente como na tabela (ex.: `{ orderIndex: 6, title: "Neurociência Básica e Neuroplasticidade", phase: 2 }`).
  - `type TrailStatus = HouseState | "coming_soon"`
  - `type TrailNode = { orderIndex: number; title: string; subtitle: string | null; phase: number; status: TrailStatus; href: string | null }`
  - `buildTrail(houses: House[], progress: ProgressRow[]): TrailNode[]` — ordenado por `orderIndex`. Casa com conteúdo: título e subtítulo do JSON, status da linha de progresso (sem linha → `"locked"`), fase do `ROADMAP` (ou `notebook_phase` se fora dele). Casa sem conteúdo: título do `ROADMAP`, `subtitle: null`, `"coming_soon"`. `href = "/casa/{n}"` só para `in_progress`, `completed` e `bypassed`.
  - `allAvailableCompleted(nodes: TrailNode[]): boolean` — `true` só se existe ao menos um nó com conteúdo e todos os nós com conteúdo estão `completed`.

- [ ] **Step 1: Write the failing tests** (use `makeHouse` de `tests/unit/fixtures.ts`)
  - `buildTrail([], [])` → 12 nós, todos `coming_soon`, `href` nulo; `allAvailableCompleted` → `false`.
  - Casa 1 `in_progress` → nó 1 com o título do JSON e `href "/casa/1"`; nó 2 com título `"Sócrates, Platão e Aristóteles"` e `coming_soon`.
  - Casa 1 `bypassed` → `href "/casa/1"`, status `"bypassed"`.
  - Casa 2 com conteúdo e sem linha de progresso → status `"locked"`, `href` nulo.
  - Casa 13 com conteúdo → 13 nós; o último tem o título do JSON e `phase` igual a `notebook_phase`.
  - Casas 1 e 2 `completed` → `allAvailableCompleted` `true`; Casa 2 `in_progress` → `false`.
- [ ] **Step 2:** `npx vitest run tests/unit/trail-data.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `roadmap.ts`.
- [ ] **Step 4:** `npx vitest run tests/unit/trail-data.test.ts` → PASS.
- [ ] **Step 5: Commit** — `feat: dados da trilha de 12 Casas`

### Task 4: Componente `Trail` e página da trilha

**Files:**
- Create: `src/components/Trail.tsx`
- Modify: `src/app/page.tsx` (cabeçalho ARCHÉ, troca `HouseList` por `Trail`), `src/app/globals.css` (estilos dos nós)
- Delete: `src/components/HouseList.tsx`, `tests/unit/house-list.test.tsx`, `src/app/page.module.css` (sem uso)
- Test: `tests/unit/trail.test.tsx`

**Interfaces:**
- Consumes: `buildTrail`, `allAvailableCompleted`, `PHASE_NAMES`, `TrailNode` (Task 3); classes da Task 2.
- Produces: `Trail({ houses, progress }: { houses: House[]; progress: ProgressRow[] })`. Marcação: uma `<section aria-labelledby>` por fase com `<h2>` "Fase N · Nome" e `<ol start={primeiro orderIndex da fase} className="trail-phase">`; cada `<li className="trail-node trail-node--{status}">`. Nós clicáveis são `<Link>`; os demais são `<div aria-disabled="true">` sem `tabindex`. Rótulos de estado: `locked` "Bloqueada", `bypassed` "Validada", `in_progress` "Em andamento", `completed` "Concluída", `coming_soon` "Em breve". Aviso final (texto exato): "Você concluiu todas as Casas disponíveis — as próximas chegam em breve."

- [ ] **Step 1: Write the failing tests**
  - Renderiza 12 `listitem` com Casa 1 `in_progress` e sem outras Casas.
  - Só a Casa 1 é link (`getAllByRole("link")` tem tamanho 1, `href "/casa/1"`).
  - Os nós "Em breve" têm `aria-disabled="true"` e nenhum elemento focável dentro (`querySelector("a, button, [tabindex]")` nulo).
  - Mostra os textos "Em andamento", "Em breve", "Validada" (com uma Casa `bypassed`) e "Bloqueada".
  - Mostra os 4 títulos de fase (ex.: heading "Fase 1 · O Despertar").
  - Mostra o aviso final quando todas as Casas com conteúdo estão concluídas; não mostra com `houses = []`.
- [ ] **Step 2:** `npx vitest run tests/unit/trail.test.tsx` → FAIL.
- [ ] **Step 3:** Implementar `Trail.tsx`; em `page.tsx`, cabeçalho com marca "ARCHÉ" (`.label-mono` grande, `<h1>` visível "Trilha das 12 Casas" logo abaixo) e `SignOutButton`; manter o `Suspense` e o `AsyncState` de erro. CSS dos nós: cartão `.glass` com `.label-mono` "CASA N", título em serif e o rótulo de estado; `in_progress` com borda dourada + `box-shadow: var(--glow)`; `completed` com fundo dourado sólido no marcador do nó e texto escuro `#090A0F`; `bypassed` com marcador em dourado vazado; `locked` e `coming_soon` com texto `--text-muted` e borda `--border`. Layout de coluna única com linha tracejada `border-left: 1px dashed rgba(226,185,111,0.4)` (é o layout do celular e o de reserva da Task 5).
- [ ] **Step 4:** `npm test` → todos passam (o total muda: saem os 5 de `house-list`, entram os novos).
- [ ] **Step 5: Commit** — `feat: trilha das 12 Casas com o visual Arché`

### Task 5: Zigue-zague no desktop (limite: 2 horas)

> Se passar de 2 horas de trabalho, parar, reverter só esta Task e entregar a coluna única da Task 4 em todas as larguras. Anotar no HANDOFF que o zigue-zague ficou para depois.

**Files:**
- Modify: `src/lib/trail/roadmap.ts`, `src/components/Trail.tsx`, `src/app/globals.css`
- Test: `tests/unit/trail-data.test.ts`

**Interfaces:**
- Consumes: `TrailNode` (Task 3), marcação da Task 4.
- Produces: `zigzagColumn(indexInPhase: number, phase: number): 1 | 2 | 3` — fases ímpares descem da esquerda para a direita (1, 2, 3), fases pares da direita para a esquerda (3, 2, 1). Fora de 0 a 2 → `1`.

- [ ] **Step 1: Write the failing test** — `zigzagColumn(0, 1) === 1`, `zigzagColumn(2, 1) === 3`, `zigzagColumn(0, 2) === 3`, `zigzagColumn(2, 2) === 1`.
- [ ] **Step 2:** `npx vitest run tests/unit/trail-data.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `zigzagColumn`. Em `Trail`, cada `li` recebe `style={{ gridColumn: zigzagColumn(i, phase) }}`, a `ol` vira grid de 3 colunas a partir de `min-width: 768px`, e cada fase recebe um `<svg aria-hidden="true" focusable="false" viewBox="0 0 100 100" preserveAspectRatio="none">` absoluto atrás dos nós, com uma `polyline` pelos centros das células (x = 16,67 / 50 / 83,33; y = 16,67 / 50 / 83,33), `stroke` dourado a 40%, `stroke-dasharray="2 2"`, `vector-effect="non-scaling-stroke"`. Abaixo de 768px o SVG some (`display: none`) e vale a coluna da Task 4. Brilho pulsante opcional só no nó `in_progress`, desligado pelo `prefers-reduced-motion` da Task 2.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** — `feat: zigue-zague da trilha no desktop`

### Task 6: Login e página da Casa

**Files:**
- Modify: `src/app/login/page.tsx` (só `className`), `src/components/HouseView.tsx` (cabeçalho de fase), `src/app/globals.css` (login, Casa, pensadores, checklist, prova)

**Interfaces:**
- Consumes: `ROADMAP`, `PHASE_NAMES` (Task 3), classes da Task 2.

- [ ] **Step 1:** Login: o `<form className="login">` vira cartão `.glass-elevated` centralizado (`min-height: 100dvh`, grid centralizado); a marca "ARCHÉ" em `.label-mono` acima do título "Entrar"; erro com `.state-error` (já existe); botão com o texto "Entrando…" enquanto carrega (já existe).
- [ ] **Step 2:** `HouseView`: acima do `<h1>`, um `<p className="label-mono">` com "Fase N · Nome" (fase do `ROADMAP` para o `order_index` da Casa; se não houver, `notebook_phase` sem nome); o subtítulo existente em serif itálico. Sem novos dados.
- [ ] **Step 3:** CSS: `.thinkers` em grid `repeat(auto-fill, minmax(220px, 1fr))`, cada `.thinker` como `.glass` (era e conceito em `.label-mono`); `.checklist` com cada item como `.glass`, caixa de seleção com `accent-color: #E2B96F` e área clicável ≥ 44px; `.quiz` como `.glass-elevated`, opções com borda `--border` e foco dourado; `.quiz-result` e `.notice-success` com `--success`.
- [ ] **Step 4:** `npm test` → todos passam (checklist, quiz e demais testes atuais não mudam). `npm run typecheck` → sem erros.
- [ ] **Step 5: Commit** — `style: login e Casa com o visual Arché`

### Task 7: README, verificação visual e entrega

**Files:**
- Modify: `README.md` (seção da consulta de medição), `docs/HANDOFF.md` (estado e pendências)

- [ ] **Step 1:** No `README.md`, logo abaixo da consulta SQL de medição, adicionar a linha "Deploy do retoque visual: AAAA-MM-DD HH:MM (horário de Brasília)" e uma frase: para separar antes e depois, comparar os dias de retorno anteriores e posteriores a essa data. Sam preenche a data quando fizer o deploy.
- [ ] **Step 2:** `npm test`, `npm run typecheck`, `npm run lint` → tudo passa. Devolver os arquivos para `D:\React\Intersect` com `device_commit_files`.
- [ ] **Step 3 (Sam, na máquina dele):** `npm run dev`, abrir login, trilha e Casa no desktop e no celular (ou DevTools em 390px). Conferir: Tab percorre só os nós clicáveis e o Sair com anel dourado visível; texto esmaecido legível; nada do Stitch inventado aparece.
- [ ] **Step 4 (Sam):** `git add -A`, `git commit -m "feat: retoque visual Arché"`, push e conferir o deploy na Vercel; preencher a data no README.
- [ ] **Step 5:** Atualizar `docs/HANDOFF.md`: retoque no ar, data do deploy, pendência 1 concluída.
