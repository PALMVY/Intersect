# Trilha das 12 Casas

Plataforma de estudo de filosofia, mente e estratégia em 12 Casas. **Primeiro corte:** login, trilha, checklist de módulos, mini-prova e progresso salvo.

- Design: `docs/superpowers/specs/2026-11-16-trilha-12-casas-design.md`
- Plano: `docs/superpowers/plans/2026-11-16-trilha-12-casas-primeiro-corte.md`

## Colocar para rodar

1. **Banco:** no painel do Supabase, abra *SQL Editor*, cole o conteúdo de `supabase/migrations/0001_init.sql` e execute uma vez.
2. **Contas:** em *Authentication > Users > Add user*, crie a sua conta e a da sua amiga (marque *Auto Confirm User*). Depois, em *Authentication > Sign In / Providers > Email*, desligue *Allow new users to sign up*. Assim ninguém mais consegue criar conta.
3. **Variáveis:** copie `.env.local.example` para `.env.local` e preencha a URL e a chave *publishable* do projeto. A chave é pública por design; quem protege os dados é a RLS.
4. **Rodar:** `npm install` e `npm run dev`, depois abra http://localhost:3000.
5. **Deploy:** importe o repositório na Vercel e cadastre as duas variáveis de ambiente.

## Conteúdo das Casas

Cada Casa é um arquivo `content/houses/casa-NN.json` no formato que o Notebook gera (veja `casa-01.json`). Regras validadas no build:

- `order_index` único; módulos únicos por (`level`, `order_index`); filósofos com `slug` único.
- Prova com **pelo menos 3 questões**, cada uma com **4 opções** e `correct_option_index` entre 0 e 3.

`npm run build` roda a validação antes de compilar e para com a mensagem do arquivo que está errado. Uma Casa nova só libera quando a anterior estiver concluída.

Regras de progresso: a Casa conclui com **todos os módulos marcados** e **nota de pelo menos 70%** na mini-prova (tentativas ilimitadas). Com 3 questões, 70% significa acertar as 3; a constante é `PASS_THRESHOLD` em `src/lib/quiz/grade.ts`.

## Ver como a semana de uso foi

No SQL Editor do Supabase:

```sql
select user_id, date(updated_at) as dia, count(*) as gravacoes
from user_progress
group by 1, 2
order by 1, 2;
```

Deploy do retoque visual: **AAAA-MM-DD HH:MM** (horário de Brasília). Preencha ao fazer o deploy. Para separar o efeito do visual novo, compare os dias de retorno antes e depois dessa data.

## Testes

- `npm test`: testes unitários (conteúdo, nota, estados, repositório, componentes).
- `tests/rls/`: testes de RLS contra o Supabase real. Precisam das duas contas de teste: defina `RLS_USER_A_EMAIL`, `RLS_USER_A_PASSWORD`, `RLS_USER_B_EMAIL`, `RLS_USER_B_PASSWORD` (e as variáveis do `.env.local`).
- `npm run test:e2e`: Playwright (`npx playwright install chromium` na primeira vez). Para o fluxo completo, defina `E2E_EMAIL` e `E2E_PASSWORD` de uma conta de teste dedicada, porque o teste grava progresso.

## Notas de versão

Esta versão do Next.js (16) chama o antigo `middleware` de `proxy`: a proteção de rotas está em `src/proxy.ts`.
