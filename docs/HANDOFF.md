# Handoff — Trilha das 12 Casas (Arché)

Escrito em 2026-11-18 para abrir um chat novo sem perder contexto. Leia este arquivo primeiro; os detalhes estão nos documentos linkados.

## O que é

Plataforma de estudo de filosofia, mente e estratégia: trilha fixa de 12 Casas (4 fases) com módulos de estudo, mini-prova por Casa e, no futuro, um mapa de afinidades entre pensadores. Uso pessoal do Sam e de uma amiga. Hipótese central: **uma trilha fixa mantém essa pessoa estudando até o fim**, em vez de abandonar na Casa 2 ou 3.

## Documentos

- Design do primeiro corte: `docs/superpowers/specs/2026-11-16-trilha-12-casas-design.md` (aprovado; stack trocada para Next.js).
- Plano do primeiro corte: `docs/superpowers/plans/2026-11-16-trilha-12-casas-primeiro-corte.md` (executado).
- Design do retoque visual: `docs/superpowers/specs/2026-11-18-redesign-visual-design.md` (aprovado em 18/11).
- Plano do retoque visual: `docs/superpowers/plans/2026-11-18-retoque-visual.md` (executado em 18/11).
- Referências do Stitch: `docs/design/stitch/` (`DESIGN.md`, três telas em PNG, referência 3D para a Etapa 3).
- Como rodar e configurar: `README.md`.

## Estado atual (2026-11-18)

- **No ar na Vercel e funcionando.** Login, trilha, Casa 1 (checklist, mini-prova), progresso salvo no Supabase.
- Testado por Sam: o progresso persiste entre sessões; a conta da amiga vê os dados separados (RLS confirmada na prática).
- Retoque visual (Arché) implementado em 18/11: tokens, fontes, trilha de 12 nós em zigue-zague no desktop e coluna no celular, login e Casa. Falta Sam commitar, fazer o deploy e anotar a data no `README.md`.
- Testes: 81 passando (eram 58 antes do retoque) (lógica, repositório, componentes); build ok. Os testes de RLS (`tests/rls`) e o ponto a ponto (`tests/e2e`) existem, mas só rodam com contas de teste e nunca foram executados.
- Só a **Casa 1** tem conteúdo (`content/houses/casa-01.json`, formato gerado pelo Notebook do Sam).
- **Semana de medição em andamento** (começou em 16 a 17/11, termina por volta de 24/11). Medir: dias em que cada pessoa voltou e onde parou, pela consulta SQL no `README.md`.

## Decisões que valem (não reabrir sem motivo)

- Abordagem B: conteúdo em JSON no repositório; Supabase só para login e progresso; correção da prova no cliente. Se o app virar público, a correção vai para o servidor.
- Next.js 16 (App Router), TypeScript, Supabase (`@supabase/ssr`), Vitest, Playwright, Vercel. Em Next 16 o `middleware` se chama `proxy` (`src/proxy.ts`), e `cookies()` exige `<Suspense>`.
- Casa conclui com **todos os módulos marcados** e **nota ≥ 70%** (constante `PASS_THRESHOLD`). Com 3 questões isso exige acertar as 3. Sam testou, tirou 67 e escolheu manter 70%.
- A mini-prova fica sempre aberta (sem exigir módulos antes).
- Sem diagnóstico de entrada por enquanto (só faz sentido com conteúdo nas Casas 4, 7 e 10).
- O `npm run build` roda a validação do conteúdo antes; JSON inválido falha o build com o nome do arquivo.

## Pendências, em ordem

1. Sam confere o retoque no celular e no desktop, commita, faz o deploy e anota a data no `README.md`.
2. Fim da semana de medição: Sam traz os números; decide-se o que construir a seguir.
3. Conteúdo das Casas 2 e 3 (Sam, pelo Notebook) — só se a Casa 1 funcionar.
4. Etapa 2: mapa de afinidades (2D, os sinais de leitura/prova/favorito já são gravados em `user_thinker_signal`). Etapa 3: cena 3D.

## Armadilhas já encontradas

- **Arquivos `.env*` não podem ser gravados pelas ferramentas**; Sam cria `.env.local` à mão. Na Vercel é preciso cadastrar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e **fazer redeploy**; sem elas todas as rotas dão "Internal Server Error".
- Instalar dependências direto na pasta do Windows (via o shell do dispositivo) é lento e falha. Também **não rode git no shell do dispositivo**: ele deixa arquivos `.lock` que travam o git do Sam.
- A rede do ambiente de trabalho do Claude não alcança o Supabase nem baixa o Chromium: login real, salvamento e Playwright só podem ser testados na máquina do Sam.
- Sam precisa rodar `git add -A` e `git commit` na máquina dele; o histórico de commits do ambiente de trabalho não foi levado para a pasta.

## Como retomar em um chat novo

1. Conecte a pasta `D:\React\Intersect` ao chat.
2. O Claude copia o projeto para o ambiente de trabalho (`device_stage_files`), roda `npm install` e `npm test` lá (rápido), edita e devolve os arquivos com `device_commit_files`.
3. Mensagem sugerida para colar no chat novo:

> Continuando o projeto "Trilha das 12 Casas" (pasta `D:\React\Intersect`). Leia `docs/HANDOFF.md` e depois `docs/superpowers/specs/2026-11-18-redesign-visual-design.md`. Quero revisar e aprovar o design do retoque visual e seguir para o plano de implementação. Responda em português.

## Como o Sam trabalha (para o próximo Claude)

Sam é fundador da PALMVY, estudante de Engenharia de Software e muito visual. Prefere o menor experimento que gere aprendizado real e quer ser lembrado de não cair em perfeccionismo. Este projeto é um passatempo de estudo: ele deve ser tratado como hipótese a validar com uso, não como produto a polir.
