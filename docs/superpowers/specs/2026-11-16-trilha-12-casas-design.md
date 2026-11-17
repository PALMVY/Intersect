# Trilha das 12 Casas — Design

Data: 2026-11-16 · Autor: Sam (dono do projeto) · Status: aprovado por Sam em 2026-11-16 (com a troca de stack para Next.js)

## 1. Intenção e porquê

Sam estuda filosofia, mente e estratégia e se dispersa: pula de autor em autor sem terminar nada. Os quatro cadernos que ele montou no Gemini Notebook viraram uma trilha fixa de 12 unidades ("Casas"). O app existe para **manter Sam estudando a trilha até o fim**, com um mapa visual de afinidades que mostra para onde sua leitura está inclinada.

Usuários: Sam primeiro; depois uma amiga que também gosta de filosofia. Duas pessoas de confiança. Não é um produto público agora.

Hipótese mais arriscada a validar: **uma trilha fixa e progressiva mantém essa pessoa estudando**, ou ela abandona na Casa 2 ou 3.

## 2. Goals

- Sam e a amiga conseguem entrar, ver a trilha, marcar o progresso e passar nas mini-provas, com o progresso salvo e sincronizado entre dispositivos.
- Dá para ver, depois de uma semana de uso, onde cada um parou (datas de atividade e Casas concluídas).
- Cada Casa tem conteúdo curado e revisado por Sam (textos próprios, checklist, mini-prova).

## 3. Non-goals (por enquanto)

- Cena 3D em Three.js (Etapa 3 do roadmap).
- Mapa de afinidades (Etapa 2), exceto guardar os dados de leitura/prova/favorito desde o início para ele nascer com histórico.
- Diagnóstico de entrada ramificado (entra junto com a Fase 2 de conteúdo; ver §6).
- Cadastro público, planos, pagamentos, outros idiomas, gamificação, IA em tempo de execução.
- Correção de provas no servidor (RPC). Volta se o app virar público.

## 4. Anti-goals

- Passar semanas no 3D ou no grafo antes de alguém terminar a Casa 1.
- Reproduzir trechos de livros: todo conteúdo é síntese de Sam, com citações curtas e raras.
- Defender contra trapaça numa trilha que só duas pessoas de confiança usam.

## 5. Abordagens consideradas

| | Descrição | Custo / risco |
|---|---|---|
| A | Spec original: conteúdo no Postgres com RLS, RPCs atômicas para correção, estados e pesos | Mais cara; protege contra um ataque que não existe agora |
| **B (escolhida)** | Conteúdo em JSON dentro do app; Supabase só para auth e progresso; correção no cliente | Gabarito visível no código; migração simples para RPC se virar público |
| C | Sem backend, tudo no navegador | Mais rápida, mas sem sincronização entre dispositivos e sem login |

Sam escolheu B. Motivo: protege o que importa (o progresso de cada pessoa) sem pagar por defesas desnecessárias.

## 6. Primeiro corte (o que se constrói primeiro)

Auth + trilha plana com **Casas 1 a 3 (Fase 1)** + checklist por Casa + mini-prova por Casa + progresso salvo. Todos começam na Casa 1.

O diagnóstico de entrada fica **fora do primeiro corte**: ele só leva a pessoa às Casas 4, 7 ou 10, que ainda não têm conteúdo, e não testa a hipótese da §1. Entra quando houver conteúdo das Fases 2 a 4.

Critério de sucesso do corte: Sam e a amiga usam por uma semana; sabemos pelas datas em `user_progress` quantos dias cada um voltou e onde parou.

## 7. Decisões de Sam (como ele decidiu)

- Abordagem B, com Supabase só para progresso.
- Primeiro corte focado nas Casas 1 a 3.
- Estrutura curricular: 4 cadernos, 12 Casas, exatamente como na spec original (pensadores por Casa listados lá).
- Estados das Casas: `locked`, `bypassed`, `in_progress`, `completed`.
- Conteúdo curado offline no Gemini Notebook, sem IA em tempo real.

## 8. Design técnico (calls do autor, marcadas como tal)

**Stack (decisão de Sam):** React + Next.js (App Router) + TypeScript, deploy na Vercel (plano grátis) + Supabase (grátis). Auth com `@supabase/ssr`; um middleware redireciona quem não está logado para a página de login. As páginas da trilha são client components, porque o estado vem do progresso do usuário. O conteúdo em JSON é importado no servidor. Como a correção das provas continua no cliente (abordagem B), um Route Handler do Next.js fica como caminho natural para mover a correção ao servidor se o app virar público.

**Conteúdo (call):** `content/houses/casa-01.json` … `casa-12.json`, validados por schema (zod) no build. Cada arquivo tem: `id`, `title`, `phase`, `thinkers[]` (id, nome), `summary` (texto de Sam), `checklist[]` (id, texto), `quiz[]` (id, enunciado, 4 opções, índice da correta, explicação curta). O schema fica no repositório para Sam pedir ao Notebook a saída já no formato. Sam revisa tudo antes de commitar.

**Banco (Supabase):**
- `user_profile(user_id pk, entry_house int default 1, diagnostic_answers jsonb null, created_at)`
- `user_progress(user_id, house_id, state, checklist_done jsonb, best_quiz_score int, updated_at, pk(user_id, house_id))`
- `user_thinker_signal(user_id, thinker_id, read bool, favorite bool, quiz_passed bool, pk(user_id, thinker_id))` — guarda os sinais da Etapa 2 desde já.
- RLS nas três: `auth.uid() = user_id` para select/insert/update. Nada de service role no cliente; a anon key é pública por design e a RLS é o que protege.
- Cadastro público desligado; Sam cria as duas contas pelo painel do Supabase.

**Regras de estado (call):**
- A Casa 1 nasce `in_progress`; as demais `locked`.
- Concluir uma Casa exige checklist 100% e mini-prova aprovada (nota ≥ 70%, tentativas ilimitadas). Ao concluir a Casa N, a N+1 vira `in_progress`.
- `bypassed` só será usado quando o diagnóstico existir; nasce de lá.
- A lógica de transição é uma função pura e testada, fácil de portar para uma RPC depois.

**Mini-prova (call):** 5 questões de múltipla escolha por Casa, corrigidas no cliente, com explicação curta após cada resposta.

**Pesos de afinidade (call, ajustável na Etapa 2):** lido +1, prova aprovada +2, favorito +1, normalizado pelo maior peso. Calculados no cliente a partir de `user_thinker_signal`.

**Interface:** lista das 12 Casas agrupadas por fase, com o estado visível; página da Casa com resumo, checklist e botão da prova. Toda tela e componente tem estados de carregamento, erro, vazio e sucesso. Navegação por teclado, contraste adequado e `aria-label` nos controles.

## 9. Testes

- Unitários (Vitest): transições de estado, cálculo de nota da prova, cálculo de pesos, validação do schema de conteúdo.
- Segurança de dados: teste de que a conta A não lê nem escreve o progresso da conta B (RLS).
- Um teste de ponta a ponta do fluxo principal: login → concluir checklist da Casa 1 → passar na prova → Casa 2 liberada.

## 10. Fica para quem constrói

Estrutura de pastas, estilo visual (minimalista), textos das telas, escolha de biblioteca de testes de ponta a ponta, formato exato de migração do banco.

## 11. Dependência de Sam

Conteúdo das Casas 1 a 3 no formato JSON da §8, revisado por ele. É o item que mais pode atrasar o corte.

## 12. Calls do autor para Sam conferir

1. (Alterada por Sam) React + Next.js em vez de Vite; deploy na Vercel.
2. Conteúdo em JSON no repositório, não no banco.
3. Conclusão da Casa = checklist completo + prova ≥ 70%.
4. 5 questões de múltipla escolha por Casa, correção no cliente.
5. Diagnóstico fora do primeiro corte (muda o que eu havia proposto antes).
6. Pesos de afinidade iniciais: lido +1, prova +2, favorito +1.
