# Retoque visual (Arché) — Design

Data: 2026-11-18 · Autor: Sam (dono do projeto) · Status: **aguardando aprovação de Sam** (a direção foi combinada na conversa; falta ele ler este documento e aprovar)

## 1. Intenção e porquê

Sam é uma pessoa muito visual e precisa ver o app para se engajar. Ele desenhou telas no Google Stitch (em `docs/design/stitch/`) e quer esse clima no app, **sem o exagero** do protótipo. A hipótese é que um visual que ele goste ajuda a voltar a estudar. O retoque não muda lógica, dados, rotas nem banco, para que a semana de medição de uso (dias em que cada pessoa voltou) continue válida.

## 2. Goals

- Aplicar o visual do Stitch (obsidiana escuro, dourado, três fontes, linhas finas) em todas as telas atuais: login, trilha e página da Casa.
- **Trilha em caminho espacial 2D com as 12 Casas visíveis.** A Casa com conteúdo e liberada é clicável; as outras ficam esmaecidas, com o rótulo "Em breve", sem clique e fora da ordem de tabulação.
- Manter acessibilidade: contraste de texto de pelo menos 4,5:1, foco visível, navegação por teclado, rótulos acessíveis, `prefers-reduced-motion` respeitado.

## 3. Non-goals

- Três.js e a cena 3D (Etapa 3); mapa de afinidades (Etapa 2).
- Qualquer dado inventado: coordenadas, "estado cognitivo" em Hz, percentuais de integração ou assimilação, "média da comunidade", telemetria, citação do oráculo, "conceitos-chave", diagrama epistêmico.
- Mudar quando a mini-prova abre. No Stitch ela só abre depois de todos os módulos; **no app ela continua sempre aberta** (decisão do autor, para não mudar o comportamento durante a medição).
- Mudar lógica, banco, rotas, autenticação ou conteúdo.

## 4. Anti-goals

- Ficar bonito e mostrar algo que não é verdade sobre o progresso.
- Perder legibilidade por causa do clima escuro (o Stitch usa cinzas quase invisíveis; aqui não).
- Gastar a semana em acabamento visual em vez de estudar a Casa 1.

## 5. Abordagens consideradas

| | Descrição | Custo / risco |
|---|---|---|
| **A (escolhida)** | Retoque em CSS e marcação dos componentes existentes, com tokens em `globals.css` e fontes via `next/font` | Baixo; não toca na lógica; testes atuais seguem valendo |
| B | Reconstruir as telas com biblioteca de componentes ou Tailwind | Mais caro, sem ganho para o objetivo |
| C | Esperar o fim da semana de medição | Sam não vê o visual que o motiva |

Sam concordou com A e com aplicar durante a semana.

## 6. Tokens (do `DESIGN.md` do Stitch)

- Fundo base `#090A0F`; vidro (cartões) `rgba(14,17,24,0.7)` com blur 16px; vidro elevado `rgba(20,24,34,0.85)` com blur 24px.
- Dourado astral `#E2B96F` para ações, estados ativos e brilho (`0 0 24px -4px rgba(226,185,111,0.15)`); nunca em fundos grandes.
- Texto `#F8FAFC`; borda fina `rgba(255,255,255,0.08)`; borda do vidro elevado `rgba(226,185,111,0.2)`.
- **Texto secundário: o cinza `#64748B` do Stitch não atinge 4,5:1 sobre o fundo escuro nos tamanhos pequenos.** O autor usa um cinza mais claro, calculado para passar em 4,5:1 (a verificação é um teste, ver §9).
- Fontes: Playfair Display (títulos e citações), Plus Jakarta Sans (texto), JetBrains Mono (rótulos em caixa alta com espaçamento). Raio padrão 4px.
- Botão principal: transparente, borda dourada, texto dourado em mono; hover com fundo dourado a 10% e brilho.

## 7. Mapeamento por tela

**Login:** cartão de vidro centralizado sobre o fundo escuro, mesmos campos e mensagens de hoje.

**Trilha (`/`):** cabeçalho com a marca "ARCHÉ" e o botão Sair (sem as abas do Stitch). Abaixo, o caminho espacial descrito em §8.

**Casa (`/casa/[id]`):** cabeçalho de fase e título (Playfair), subtítulo em itálico; "Pensadores" como grade de cartões (nome, era, conceito central, resumo, caixa "Li sobre…" e favoritar); "Roteiro de estudo" com os módulos (nível, minutos, fonte, descrição) como checklist; "Mini-prova" com a melhor nota, a regra dos 70% e o resultado. Só aparece o que existe nos dados da Casa.

## 8. Trilha espacial

- **12 nós** em quatro grupos de três (fases), ligados por linhas tracejadas desenhadas em SVG, em zigue-zague no desktop e em coluna única no celular. Sem Three.js.
- **Fonte dos dados:** Casas com conteúdo vêm do JSON (`content/houses`). As demais vêm de uma constante de exibição em `src/lib/trail/roadmap.ts` com `order_index`, título curto, fase e eixos de pensadores, tirados do design original:

| Fase | Casas |
|---|---|
| 1 · O Despertar | 1 Mitologia Grega e Pré-Socráticos · 2 Sócrates, Platão e Aristóteles · 3 Santo Agostinho e Tomás de Aquino |
| 2 · A Engrenagem e o Cosmos | 4 Carl Sagan e Descartes · 5 Spinoza, Locke, Hume e Kant · 6 Neurociência Básica e Neuroplasticidade |
| 3 · Os Porões da Mente | 7 Nietzsche, Marx e Foucault · 8 Sigmund Freud · 9 Heidegger, Dostoiévski e Kafka |
| 4 · O Tabuleiro de Xadrez | 10 Robert Cialdini · 11 Maquiavel e Sun Tzu · 12 Robert Greene e George Orwell |

  Quando uma Casa tem conteúdo, o título do JSON prevalece sobre o da constante.
- **Estados:** concluída (dourado cheio), em andamento (brilho dourado, clicável), bloqueada com conteúdo (esmaecida, sem clique), sem conteúdo (esmaecida, "Em breve", sem clique). A Casa 1 hoje é o único nó clicável.
- **Semântica:** lista ordenada (`<ol>`); nós inativos com `aria-disabled="true"`, sem `tabindex` e sem link; o estado vai por texto, nunca só por cor. A frase "Você concluiu todas as Casas disponíveis — as próximas chegam em breve." continua aparecendo.

## 9. Testes

- Os 58 testes atuais continuam passando. O teste de `HouseList` muda para o novo componente da trilha.
- Novos: a trilha mostra 12 nós; só os nós com conteúdo e liberados são links; os demais têm `aria-disabled` e não são focáveis.
- Um teste puro calcula a razão de contraste dos pares de cor do texto sobre o fundo e exige 4,5 ou mais.
- Verificação visual manual por Sam no celular e no desktop (login, trilha, Casa), antes do deploy.

## 10. Fica para quem constrói

Estrutura dos CSS (global ou por componente), geometria exata do zigue-zague e do SVG, animações discretas de brilho (desligadas com `prefers-reduced-motion`), ordem de carregamento das fontes.

## 11. Calls do autor para Sam conferir

1. Mini-prova sempre aberta (o Stitch a bloqueia até os módulos terminarem).
2. Cabeçalho sem as abas "Mapa de afinidades" e "Síntese cósmica" até existirem.
3. Texto secundário mais claro que o do Stitch, por causa do contraste.
4. Os nomes das 12 Casas esmaecidas vêm do design original, não do Notebook.
