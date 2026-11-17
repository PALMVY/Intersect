# Trilha das 12 Casas — Primeiro Corte Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar login, trilha das Casas 1 a 3 com checklist, mini-prova e progresso salvo no Supabase, para Sam e uma amiga usarem por uma semana.

**Architecture:** Next.js (App Router) com conteúdo em JSON validado por zod e importado no servidor. Supabase guarda só auth e progresso, protegido por RLS. A lógica de estado e de correção são funções puras testadas, fáceis de portar para o servidor depois.

**Tech Stack:** Next.js (App Router), React, TypeScript, zod, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Vitest, Playwright. Deploy na Vercel.

**Spec:** `docs/superpowers/specs/2026-11-16-trilha-12-casas-design.md`

## Global Constraints

- Pasta do projeto: `D:\React\Intersect` (repositório git novo). Interface em pt-BR.
- Conteúdo em `content/houses/casa-NN.json`, não no banco. O primeiro corte tem só as Casas 1 a 3.
- Estados: `locked`, `bypassed`, `in_progress`, `completed`. `bypassed` não é usado neste corte.
- Casa concluída = checklist 100% e mini-prova com nota ≥ 70. Cinco questões de 4 opções por Casa. Tentativas ilimitadas.
- A Casa 1 nasce `in_progress`, as demais `locked`. Concluir a Casa N libera a N+1.
- RLS nas três tabelas: `auth.uid() = user_id`. Nunca usar a service role no cliente. Cadastro público desligado.
- Todo componente tem estados de carregamento, erro, vazio e sucesso; navegação por teclado e `aria-label` nos controles.
- Sem diagnóstico, grafo nem 3D neste corte. Conteúdo é síntese de Sam, sem trechos reproduzidos de livros.

## Review Focus

- Abrir `/casa/2` pela URL sem tê-la liberado: deve redirecionar para a trilha, não mostrar o conteúdo.
- Falha de rede ao salvar progresso: mostrar erro e não marcar a Casa como concluída localmente.
- JSON de Casa malformado ou com gabarito fora das opções: o build deve falhar com mensagem clara, não quebrar em tempo de execução.
- Refazer a prova depois de concluir a Casa, com nota menor: a Casa continua `completed` e `bestQuizScore` não diminui.
- Concluir a Casa 3 (última com conteúdo): mostrar "Fim da Fase 1" e não liberar uma Casa 4 sem conteúdo.
- Sessão expirada no meio do uso: redirecionar ao login sem perder o que já foi salvo.

---

## File Structure

- `content/houses/casa-01.json … casa-03.json`: conteúdo de Sam (começam com rascunho de exemplo).
- `src/lib/content/schema.ts`: tipos e validação zod. `src/lib/content/loader.ts`: lê e valida os arquivos.
- `src/lib/quiz/grade.ts`: correção. `src/lib/progress/state.ts`: máquina de estados pura.
- `src/lib/progress/repository.ts`: leitura e escrita no Supabase.
- `src/lib/supabase/{client,server}.ts` e `src/middleware.ts`: sessão.
- `supabase/migrations/0001_init.sql`: tabelas e RLS.
- `src/app/login/page.tsx`, `src/app/page.tsx` (trilha), `src/app/casa/[id]/page.tsx`.
- `src/components/`: `HouseList`, `Checklist`, `ThinkerList`, `QuizRunner`, `AsyncState`.
- Testes: `tests/unit/`, `tests/rls/`, `tests/e2e/`.

### Task 1: Scaffold do projeto

**Files:**
- Create: projeto Next.js em `D:\React\Intersect`, `vitest.config.ts`, `tests/unit/smoke.test.ts`

**Interfaces:**
- Produces: scripts `npm run dev | build | test | test:e2e`, alias `@/` para `src/`.

- [ ] **Step 1: Criar o app** com `create-next-app` (TypeScript, App Router, `src/`, alias `@/*`, ESLint), `git init` e instalar `zod @supabase/supabase-js @supabase/ssr`, `vitest`, `@playwright/test`.
- [ ] **Step 2: Escrever o teste de fumaça** `tests/unit/smoke.test.ts` com `expect(1 + 1).toBe(2)`.
- [ ] **Step 3: Rodar** `npm test` e `npm run build`. Esperado: ambos passam.
- [ ] **Step 4: Commit** `chore: scaffold next app with vitest`.

### Task 2: Schema e carregador de conteúdo

**Files:**
- Create: `src/lib/content/schema.ts`, `src/lib/content/loader.ts`, `content/houses/casa-01.json … casa-03.json`
- Test: `tests/unit/content.test.ts`, `tests/fixtures/house-valid.json`

**Interfaces:**
- Produces: `type QuizQuestion = { id: string; prompt: string; options: string[]; correctIndex: number; explanation: string }`
- Produces: `type House = { id: number; title: string; phase: number; thinkers: { id: string; name: string }[]; summary: string; checklist: { id: string; text: string }[]; quiz: QuizQuestion[] }`
- Produces: `parseHouse(raw: unknown): House` (lança em caso de conteúdo inválido), `loadHouses(): House[]` (só no servidor, ordenado por `id`, falha o build se algum arquivo for inválido).

- [ ] **Step 1: Escrever os testes** em `content.test.ts`: `parseHouse` aceita a fixture válida; rejeita questão com `options.length !== 4`; rejeita `correctIndex` 4 e −1; rejeita quiz com menos de 5 questões; rejeita `id` de checklist duplicado.
- [ ] **Step 2: Rodar** `npx vitest run tests/unit/content.test.ts`. Esperado: FAIL, módulo inexistente.
- [ ] **Step 3: Implementar** o schema zod com essas regras e `parseHouse`. `loadHouses` lê `content/houses/*.json` com `fs` e chama `parseHouse` em cada um.
- [ ] **Step 4: Criar** `casa-01…03.json` com rascunhos de exemplo seguindo o schema (Sam substitui pelo conteúdo do Notebook), cada um com 5 questões.
- [ ] **Step 5: Rodar** os testes e acrescentar um que chama `loadHouses()` e espera 3 casas. Esperado: PASS.
- [ ] **Step 6: Commit** `feat: content schema and loader`.

### Task 3: Correção da mini-prova

**Files:**
- Create: `src/lib/quiz/grade.ts`
- Test: `tests/unit/grade.test.ts`

**Interfaces:**
- Consumes: `QuizQuestion` (Task 2).
- Produces: `const PASS_THRESHOLD = 70`; `gradeQuiz(quiz: QuizQuestion[], answers: Record<string, number>): { score: number; passed: boolean }`.

- [ ] **Step 1: Escrever os testes** com quiz de 5 questões: 5 certas → `{score: 100, passed: true}`; 4 certas → `{80, true}`; 3 certas → `{60, false}`; sem respostas → `{0, false}`; resposta de questão inexistente é ignorada.
- [ ] **Step 2: Rodar** o teste. Esperado: FAIL.
- [ ] **Step 3: Implementar** `gradeQuiz`: score = `Math.round(certas / total * 100)`, questão sem resposta conta como errada.
- [ ] **Step 4: Rodar.** Esperado: PASS.
- [ ] **Step 5: Commit** `feat: quiz grading`.

### Task 4: Máquina de estados do progresso

**Files:**
- Create: `src/lib/progress/state.ts`
- Test: `tests/unit/state.test.ts`

**Interfaces:**
- Consumes: `House`, `PASS_THRESHOLD`.
- Produces: `type HouseState = 'locked' | 'bypassed' | 'in_progress' | 'completed'`; `type ProgressRow = { houseId: number; state: HouseState; checklistDone: string[]; bestQuizScore: number }`
- Produces: `initialProgress(houseIds: number[]): ProgressRow[]`; `setChecklistItem(rows: ProgressRow[], houseId: number, itemId: string, done: boolean): ProgressRow[]`; `recordQuizScore(rows: ProgressRow[], houseId: number, score: number): ProgressRow[]`; `completeIfEligible(rows: ProgressRow[], houses: House[]): ProgressRow[]`.

- [ ] **Step 1: Escrever os testes:** `initialProgress([1,2,3])` dá `in_progress, locked, locked`; checklist completo e score 60 não conclui; checklist completo e score 70 conclui a Casa 1 e leva a Casa 2 a `in_progress`; a ordem inversa (prova antes do checklist) também conclui; refazer com score 40 depois de concluir mantém `completed` e `bestQuizScore` anterior; concluir a Casa 3 não cria linha nova; nenhuma função muta o array recebido.
- [ ] **Step 2: Rodar.** Esperado: FAIL.
- [ ] **Step 3: Implementar** as quatro funções puras. `completed` é terminal; `recordQuizScore` guarda o maior valor; `setChecklistItem` ignora ids que não existem na Casa.
- [ ] **Step 4: Rodar.** Esperado: PASS.
- [ ] **Step 5: Commit** `feat: house progress state machine`.

### Task 5: Banco e RLS

**Files:**
- Create: `supabase/migrations/0001_init.sql`, `tests/rls/rls.test.ts`

**Interfaces:**
- Produces: tabelas `user_profile(user_id, entry_house, diagnostic_answers, created_at)`, `user_progress(user_id, house_id, state, checklist_done jsonb, best_quiz_score, updated_at)` com pk `(user_id, house_id)`, `user_thinker_signal(user_id, thinker_id, read, favorite, quiz_passed)` com pk `(user_id, thinker_id)`. `state` aceita só os quatro valores.

- [ ] **Step 1: Escrever o teste de RLS** (roda só se `SUPABASE_URL`, `SUPABASE_ANON_KEY` e as credenciais de dois usuários de teste estiverem no ambiente, senão `describe.skip`): o usuário A grava uma linha de progresso; A a lê; B lê zero linhas; B falha ao gravar com `user_id` de A; o mesmo vale para as outras duas tabelas.
- [ ] **Step 2: Escrever a migração** com as três tabelas, `enable row level security` e políticas de select/insert/update com `auth.uid() = user_id` (e `with check` no insert e update).
- [ ] **Step 3: Aplicar** com `supabase start` e `supabase db reset`, criar dois usuários de teste e rodar `npx vitest run tests/rls`. Esperado: PASS.
- [ ] **Step 4: Commit** `feat: schema and rls for progress`.

### Task 6: Autenticação e proteção de rotas

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/middleware.ts`, `src/app/login/page.tsx`
- Test: `tests/unit/middleware.test.ts`

**Interfaces:**
- Produces: `createBrowserClient(): SupabaseClient`, `createServerClient(): Promise<SupabaseClient>`; `isPublicPath(pathname: string): boolean` (só `/login` é pública).

- [ ] **Step 1: Escrever o teste** de `isPublicPath`: `/login` verdadeiro; `/`, `/casa/1`, `/qualquer` falso.
- [ ] **Step 2: Rodar.** Esperado: FAIL.
- [ ] **Step 3: Implementar** `isPublicPath` e o middleware: atualiza a sessão com `@supabase/ssr` e redireciona para `/login` quem não tem sessão. Os clientes leem `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`; documentar o `.env.local.example`.
- [ ] **Step 4: Implementar a página de login** (e-mail e senha, `signInWithPassword`) com estados de carregando e erro ("e-mail ou senha inválidos") e rótulos acessíveis. Sem cadastro na interface.
- [ ] **Step 5: Rodar** o teste e `npm run build`. Esperado: PASS.
- [ ] **Step 6: Commit** `feat: login and route protection`.

### Task 7: Repositório de progresso

**Files:**
- Create: `src/lib/progress/repository.ts`
- Test: `tests/unit/repository.test.ts`

**Interfaces:**
- Consumes: `ProgressRow`, `initialProgress`, `SupabaseClient`.
- Produces: `loadProgress(db: SupabaseClient, userId: string, houseIds: number[]): Promise<ProgressRow[]>` (cria as linhas iniciais e o `user_profile` no primeiro acesso); `saveProgress(db: SupabaseClient, userId: string, row: ProgressRow): Promise<void>` (upsert; lança em erro); `saveThinkerSignal(db: SupabaseClient, userId: string, signal: { thinkerId: string; read?: boolean; favorite?: boolean; quizPassed?: boolean }): Promise<void>`.

- [ ] **Step 1: Escrever os testes** com um cliente falso: primeiro acesso insere perfil e 3 linhas iniciais; segundo acesso só lê; `saveProgress` lança quando o cliente devolve erro; `saveThinkerSignal` envia só os campos informados.
- [ ] **Step 2: Rodar.** Esperado: FAIL.
- [ ] **Step 3: Implementar** com `upsert` e `onConflict` na chave primária; nunca engolir erro.
- [ ] **Step 4: Rodar.** Esperado: PASS.
- [ ] **Step 5: Commit** `feat: progress repository`.

### Task 8: Página da trilha

**Files:**
- Create: `src/components/AsyncState.tsx`, `src/components/HouseList.tsx`, `src/app/page.tsx`
- Test: `tests/unit/house-list.test.tsx`

**Interfaces:**
- Consumes: `loadHouses`, `loadProgress`, `createServerClient`.
- Produces: `<AsyncState status="loading"|"error"|"empty"|"ready" ...>` reutilizável; `<HouseList houses={House[]} progress={ProgressRow[]} />`.

- [ ] **Step 1: Escrever o teste** do `HouseList`: mostra as 3 Casas agrupadas pela Fase 1 com o estado de cada uma; Casa `locked` não é link; Casa `in_progress` e `completed` são links para `/casa/{id}`; quando as 3 estão concluídas aparece "Fim da Fase 1 — as próximas Casas chegam em breve"; lista vazia mostra o estado vazio.
- [ ] **Step 2: Rodar.** Esperado: FAIL.
- [ ] **Step 3: Implementar** componentes e a página (servidor carrega o conteúdo e o progresso; erro de carga mostra `AsyncState` de erro com botão "Tentar de novo").
- [ ] **Step 4: Rodar** o teste. Esperado: PASS.
- [ ] **Step 5: Commit** `feat: trail page`.

### Task 9: Página da Casa (checklist, pensadores e prova)

**Files:**
- Create: `src/components/Checklist.tsx`, `src/components/ThinkerList.tsx`, `src/components/QuizRunner.tsx`, `src/app/casa/[id]/page.tsx`
- Test: `tests/unit/quiz-runner.test.tsx`, `tests/unit/checklist.test.tsx`

**Interfaces:**
- Consumes: `gradeQuiz`, `setChecklistItem`, `recordQuizScore`, `completeIfEligible`, `saveProgress`, `saveThinkerSignal`.
- Produces: `<QuizRunner quiz onFinish={(result: { score: number; passed: boolean }) => void} />`; `<Checklist items done onToggle={(itemId: string, done: boolean) => void} />`.

- [ ] **Step 1: Escrever os testes:** `QuizRunner` mostra uma questão por vez, exige resposta antes de avançar, mostra a explicação depois de responder e chama `onFinish` com a nota; é operável só pelo teclado; `Checklist` chama `onToggle` e cada item tem rótulo acessível.
- [ ] **Step 2: Rodar.** Esperado: FAIL.
- [ ] **Step 3: Implementar** os componentes e a página: se a Casa estiver `locked` ou não existir, redirecionar para `/`. Ao marcar item, ao terminar a prova ou ao marcar pensador como lido/favorito, salvar primeiro e só então atualizar a interface com o novo estado; se o salvamento falhar, mostrar o erro e manter o estado anterior. Passar na prova grava `quizPassed` para todos os pensadores da Casa.
- [ ] **Step 4: Rodar** os testes e `npm run build`. Esperado: PASS.
- [ ] **Step 5: Commit** `feat: house page with checklist and quiz`.

### Task 10: Fluxo ponta a ponta e guia de uso

**Files:**
- Create: `tests/e2e/flow.spec.ts`, `README.md`

- [ ] **Step 1: Escrever o teste Playwright:** login com usuário de teste; `/casa/2` redireciona para `/`; marcar todo o checklist da Casa 1, responder a prova com as respostas certas da fixture e ver a Casa 2 liberada na trilha; sem sessão, `/` redireciona para `/login`.
- [ ] **Step 2: Rodar** `npm run test:e2e`. Esperado: PASS, depois de corrigir o que falhar.
- [ ] **Step 3: Escrever o `README.md`:** como criar as duas contas no painel do Supabase, como configurar `.env.local` e a Vercel, como adicionar o conteúdo de uma Casa (formato do JSON) e como consultar no Supabase quantos dias cada pessoa voltou (`select user_id, date(updated_at), count(*) from user_progress group by 1, 2`).
- [ ] **Step 4: Commit** `docs: readme and e2e flow`.

## Autoverificação

- Cobertura da spec: auth e cadastro desligado (T6), conteúdo em JSON (T2), estados e regras (T4), prova (T3), banco e RLS (T5), progresso e sinais (T7 e T9), interface com estados (T8 e T9), testes unitários, de RLS e e2e (T2 a T10), medição da semana de uso (T10). Os pesos de afinidade e o diagnóstico ficam para a Etapa 2 e para a Fase 2 de conteúdo, como na spec; os sinais já são gravados.
- Dependência de Sam: o conteúdo real das Casas 1 a 3 substitui os rascunhos da Task 2 antes do uso real.
