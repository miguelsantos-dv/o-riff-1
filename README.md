# O RIFF • Protótipo navegável das 10 telas (Entrega 2.4)

Plataforma de Assinatura de Instrumentos Regulados e Comunidade Musical.  
Disciplina 218161, Gerenciamento de Projetos (Escola Politécnica, PUC-Campinas) • Profa. Dra. Joice Ariane Marin • **Grupo 8**

## Como abrir

Não precisa instalar nada nem rodar build.

* **Local:** baixe o repositório e dê dois cliques em index.html (ou abra com Live Server).
* **Online:** protótipo interativo em produção no Netlify: **https://o-riff-puc.netlify.app**

Na barra do topo troque a visão entre **Cliente / Aluno**, **Luthier Técnico** e **Administrador Backoffice**. A página inicial lista as 10 telas e o roteiro sugerido de navegação. O botão ↺ no canto direito volta todos os dados para o lote piloto original.

> Dica de demonstração: abra o site em **duas abas** (Aluno em uma, Administrador na outra). Denúncias, tickets e laudos técnicos refletem na outra aba em tempo real via evento storage.

## Arquitetura (HTML5 + CSS3 + Vanilla JS modular)

| Arquivo | Integrante / Autor | Escopo | Conteúdo |
|---|---|---|---|
| index.html, styles.css, pp.js | @miguelsantos-dv | Núcleo & Design System | Estado em memória + localStorage, rotas #/tela-N, seletor de perfil, modal, toast, máscaras, validação de CPF e dados oficiais |
| modulo1-vitrine-auth.js | @MateusSoares77 | Módulo 1 (Telas 1 e 2) | Cadastro, Login, Quiz de Nivelamento por IA, LGPD, Vitrine do Kit Físico, Rent to Own, Marketplace e Checkout (US #01, US #02) |
| modulo2-aluno-afinador.js | @Leo2913k | Módulo 2 (Telas 3, 4 e 5) | Rastreio, Passaporte de Regulagem, Manutenção Preventiva, Tickets, Afinador Digital, Trilha Gamificada e Player Tudo em Um (US #03, US #05, US #06) |
| modulo3-comunidade.js | @GiovanniFerigato | Módulo 3 (Telas 6 e 7) | Salas Virtuais ao Vivo (WebRTC), Match Musical Explicável por IA, Feed Social, Denúncias e Publicidade Nativa (US #08, US #09) |
| modulo5-bruno.js | @brunosaraiva01 | Módulo 4 (Telas 8, 9 e 10) | Dashboard das 4 Receitas, Inventário Serializado, Laudo Técnico do Luthier, Central de Tickets e Moderação (US #04, US #07, US #10) |

Cada módulo registra suas telas via RIFF.register(n, {...}), mantendo o acoplamento desacoplado e seguro durante o desenvolvimento paralelo da equipe.

## Integrações entre telas

* **Tela 1 → Telas 5 e 6:** o quiz de nivelamento por IA define o nível e a trilha de estudo (Tela 5) e a compatibilidade do Match Musical (Tela 6).
* **Tela 2 → Telas 3 e 8:** o checkout gera o pedido #RIFF-2026-0842, reserva um kit no estoque serializado e contabiliza receita no Dashboard (Tela 8).
* **Tela 9 → Telas 8 e 3:** o laudo técnico do Luthier muda o kit de *Em Manutenção* para *Disponível*, remove o alerta de estoque baixo (Tela 8) e atualiza o Passaporte do Aluno (Tela 3).
* **Tela 4 → Tela 10:** agendamentos e chamados abertos pelo aluno caem na fila de suporte do Administrador, cuja resposta retorna para a Tela 4.
* **Tela 7 → Tela 10 e Tela 2:** denúncias caem na fila de Moderação (Tela 10) para ocultar o post do feed; cliques no post patrocinado levam ao Marketplace (Tela 2) e somam receita de Ads na Tela 8.

## Equipe — Grupo 8 (Validação de Commits Individuais)

* **Miguel Santos da Silva** (@miguelsantos-dv): Base Core UI, Design System, Roteador SPA & Orquestrador
* **Bruno Saraiva de Sousa** (@brunosaraiva01): Módulo 4 — Painel do Luthier & Backoffice (modulo5-bruno.js)
* **Giovanni Ferigato Siqueira** (@GiovanniFerigato): Módulo 3 — Comunidade Musical & Feed Social (modulo3-comunidade.js)
* **Leonardo Santos de Araujo Regos** (@Leo2913k): Módulo 2 — Área do Aluno, Logística & Afinador (modulo2-aluno-afinador.js)
* **Mateus de Moraes Soares** (@MateusSoares77): Módulo 1 — Vitrine do Kit Físico & Checkout (modulo1-vitrine-auth.js)

> ℹ️ **Nota de Auditoria de Commits:** O integrante **Mateus Soares** (@MateusSoares77) realizou a entrega do código do Módulo 1 inicialmente em formato compactado (.zip no commit 4be3c92) e, na sequência, realizou a extração direta do arquivo-fonte modulo1-vitrine-auth.js na raiz do repositório (commit 5c61883) com exclusão do arquivo zip para fins de padronização da base de código, validando integralmente sua autoria e contribuição individual de frontend.

## Observações técnicas

* Valores de referência configuráveis em pp.js (RIFF.CONST): valor de referência para *Rent to Own* (R$ 1.990), caução reembolsável (R$ 350), comissão de marketplace (12%) e CPC do anúncio nativo.
* O afinador digital usa captura real via Web Audio API com alternativa em simulador interativo de frequência (Hz).
* As salas de estudo ao vivo utilizam RTCPeerConnection (WebRTC) em loopback local com áudio/vídeo do dispositivo.
* Recursos de microfone e câmera exigem contexto seguro (https ou localhost).
