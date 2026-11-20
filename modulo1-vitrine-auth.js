/* =====================================================================
   O RIFF | Módulo 1: Acesso, Vitrine do Kit Físico, Marketplace e Assinatura
   Arquivo: modulo1-vitrine-auth.js
   Responsável: Giovanni Ferigato Siqueira (Grupo 8)

   Tela 1 (US #01): Cadastro, Login, Quiz de Nivelamento por IA e LGPD
   Tela 2 (US #02): Vitrine do Kit, Planos, Rent to Own, Marketplace e Checkout

   Integrações:
   • O quiz da Tela 1 define o nível e a trilha da Tela 5 e o Match IA da Tela 6
   • O checkout da Tela 2 gera o pedido rastreado na Tela 3, reserva um kit
     do inventário (Tela 8) e soma as receitas no dashboard (Tela 8)
   ===================================================================== */
(function () {
  'use strict';
  var R = window.RIFF;
  if (!R) return;
  var esc = R.esc;

  /* ---------------------------------------------------------------
     Ilustrações do Kit Físico (SVG próprio)
     --------------------------------------------------------------- */
  R.guitarSVG = function (h) {
    h = h || 300;
    var w = Math.round((h * 200) / 520);
    var L = 347.5, y0 = 64, pos = [], n;
    for (n = 0; n <= 22; n++) pos.push(y0 + L * (1 - Math.pow(2, -n / 12)));
    var frets = '';
    for (n = 1; n <= 22; n++) frets += '<line x1="89" x2="111" y1="' + pos[n].toFixed(1) + '" y2="' + pos[n].toFixed(1) + '" stroke="#cfc8b8" stroke-width="1"/>';
    var inlays = '';
    [3, 5, 7, 9, 15, 17, 19, 21].forEach(function (f) {
      inlays += '<circle cx="100" cy="' + ((pos[f - 1] + pos[f]) / 2).toFixed(1) + '" r="2.1" fill="#efe6d2"/>';
    });
    var y12 = ((pos[11] + pos[12]) / 2).toFixed(1);
    inlays += '<circle cx="95.5" cy="' + y12 + '" r="2.1" fill="#efe6d2"/><circle cx="104.5" cy="' + y12 + '" r="2.1" fill="#efe6d2"/>';
    var strings = '';
    for (n = 0; n < 6; n++) {
      strings += '<line x1="' + (92.5 + n * 3) + '" y1="64" x2="' + (90 + n * 4) + '" y2="452" stroke="#e9e4da" stroke-width="' + (1.3 - n * 0.14).toFixed(2) + '" opacity=".85"/>';
    }
    var poles = function (y) {
      var s = '';
      for (var i = 0; i < 6; i++) s += '<circle cx="' + (86 + i * 5.6) + '" cy="' + y + '" r="1.5" fill="#9aa0ab"/>';
      return s;
    };
    var pegs = '';
    [20, 34, 48].forEach(function (y) {
      pegs += '<rect x="74" y="' + (y - 3.5) + '" width="9" height="7" rx="2.5" fill="#c9c9c9"/><circle cx="90.5" cy="' + y + '" r="2.4" fill="#d8d8d8"/>';
      pegs += '<rect x="119" y="' + (y - 5.5) + '" width="9" height="7" rx="2.5" fill="#c9c9c9"/><circle cx="111.5" cy="' + (y - 2) + '" r="2.4" fill="#d8d8d8"/>';
    });
    return (
      '<svg width="' + w + '" height="' + h + '" viewBox="0 0 200 520" role="img" aria-label="Guitarra O RIFF em Cedro Rosa com braço em Marfim">' +
      '<defs><radialGradient id="cedro" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="#d98a58"/><stop offset=".6" stop-color="#a9532e"/><stop offset="1" stop-color="#6e3018"/></radialGradient>' +
      '<linearGradient id="chrome" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f2f2f2"/><stop offset="1" stop-color="#8d8d8d"/></linearGradient>' +
      '<linearGradient id="marfim" x1="0" x2="1"><stop offset="0" stop-color="#d9c79f"/><stop offset=".5" stop-color="#f1e5c8"/><stop offset="1" stop-color="#d9c79f"/></linearGradient></defs>' +
      '<path d="M78 292C60 270 36 272 34 300C32 326 50 340 46 360C40 385 18 400 20 440C22 490 60 512 100 512C140 512 178 490 180 440C182 400 160 385 154 360C150 342 160 330 158 312C156 296 140 290 124 300C116 305 108 306 100 306C92 306 86 300 78 292Z" fill="url(#cedro)" stroke="#f0e2c4" stroke-width="2"/>' +
      '<path d="M124 330c18 6 22 40 10 70" stroke="rgba(255,255,255,.12)" stroke-width="6" fill="none" stroke-linecap="round"/>' +
      '<rect x="87" y="62" width="26" height="262" rx="4" fill="url(#marfim)"/>' +
      '<rect x="89" y="64" width="22" height="252" rx="2" fill="#3a2418"/>' + frets + inlays +
      '<rect x="88" y="62.5" width="24" height="3" rx="1" fill="#f6f0e2"/>' +
      '<rect x="78" y="368" width="44" height="17" rx="4" fill="#121318" stroke="#2c2f38"/>' + poles(376.5) +
      '<rect x="78" y="414" width="44" height="17" rx="4" fill="#121318" stroke="#2c2f38"/>' + poles(422.5) +
      '<rect x="75" y="446" width="50" height="12" rx="3" fill="url(#chrome)"/>' +
      strings +
      '<circle cx="141" cy="452" r="7" fill="#1b1c22" stroke="#c9a35a" stroke-width="1.5"/>' +
      '<circle cx="151" cy="474" r="7" fill="#1b1c22" stroke="#c9a35a" stroke-width="1.5"/>' +
      '<circle cx="135" cy="490" r="7" fill="#1b1c22" stroke="#c9a35a" stroke-width="1.5"/>' +
      '<path d="M88 66L84.5 22C84 12 90 6 98 5L114 3C120 2.5 122.5 7 120.5 14L112 66Z" fill="url(#cedro)" stroke="#f0e2c4" stroke-width="1.2"/>' +
      pegs +
      '<text x="102" y="60" font-size="7" fill="#E58E26" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-weight="700">O RIFF</text>' +
      '</svg>'
    );
  };

  function tunerSVG(h) {
    h = h || 200;
    return (
      '<svg height="' + h + '" viewBox="0 0 120 150" role="img" aria-label="Afinador digital clip piezoelétrico">' +
      '<rect x="16" y="8" width="88" height="66" rx="15" fill="#1c1f27" stroke="#3a3f4d" stroke-width="2"/>' +
      '<rect x="26" y="18" width="68" height="44" rx="7" fill="#06251a"/>' +
      '<path d="M34 30q26-14 52 0" stroke="#1d5c45" stroke-width="2" fill="none"/>' +
      '<line x1="60" y1="24" x2="60" y2="33" stroke="#10B981" stroke-width="2.4" stroke-linecap="round"/>' +
      '<text x="60" y="51" font-size="15" fill="#10B981" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-weight="700">E2</text>' +
      '<text x="60" y="59" font-size="6" fill="#6ff0c0" text-anchor="middle" font-family="Inter, sans-serif">82,4 Hz</text>' +
      '<rect x="53" y="74" width="14" height="22" fill="#2a2e38"/>' +
      '<path d="M34 96h52a6 6 0 0 1 6 6v6H28v-6a6 6 0 0 1 6-6z" fill="#E58E26"/>' +
      '<rect x="28" y="108" width="64" height="7" fill="#111"/>' +
      '<path d="M28 115h64v6a6 6 0 0 1-6 6H34a6 6 0 0 1-6-6z" fill="#a8621a"/>' +
      '<text x="60" y="142" font-size="7" fill="#8d93a1" text-anchor="middle" font-family="Inter, sans-serif">piezoelétrico</text>' +
      '</svg>'
    );
  }

  function caseSVG(h) {
    h = h || 300;
    return (
      '<svg height="' + h + '" viewBox="0 0 150 380" role="img" aria-label="Hardcase rígida de polietileno">' +
      '<path d="M55 12h40a9 9 0 0 1 9 9v128c0 22 34 32 34 84v98a32 32 0 0 1-32 32H44a32 32 0 0 1-32-32v-98c0-52 34-62 34-84V21a9 9 0 0 1 9-9z" fill="#1d2029" stroke="#454b5b" stroke-width="2.5"/>' +
      '<path d="M62 30h26v120c0 16 26 26 26 74v90a20 20 0 0 1-20 20H56a20 20 0 0 1-20-20v-90c0-48 26-58 26-74z" fill="none" stroke="#2f3442" stroke-width="2"/>' +
      '<rect x="128" y="250" width="8" height="44" rx="4" fill="#E58E26"/>' +
      '<rect x="8" y="220" width="10" height="16" rx="2" fill="#c9c9c9"/><rect x="8" y="300" width="10" height="16" rx="2" fill="#c9c9c9"/><rect x="132" y="320" width="10" height="16" rx="2" fill="#c9c9c9"/>' +
      '<text x="75" y="300" font-size="12" fill="#E58E26" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-weight="700">O RIFF</text>' +
      '<text x="75" y="316" font-size="7" fill="#8d93a1" text-anchor="middle" font-family="Inter, sans-serif">POLIETILENO</text>' +
      '</svg>'
    );
  }

  var STYLES = ['Rock', 'MPB', 'Blues', 'Indie', 'Metal'];
  var LEVELS = ['Iniciante', 'Intermediário', 'Avançado'];
  var INSTRUMENTS = ['Guitarra', 'Violão', 'Baixo', 'Bateria', 'Teclado', 'Vocal'];

  /* ===============================================================
     TELA 1: Cadastro, Login, Quiz IA e LGPD
     =============================================================== */
  var QUIZ = [
    { key: 'played', q: 'Já tocou antes?', opts: [['0', 'Nunca toquei'], ['1', 'Já arranhei uns acordes'], ['2', 'Toco há mais de 1 ano']] },
    { key: 'minutes', q: 'Quantos minutos por dia pretende praticar?', opts: [['0', '10 min'], ['1', '20 min'], ['2', '30 min ou mais']] },
    { key: 'song', q: 'Qual música quer tocar primeiro?', opts: Object.keys(R.SONGS).map(function (k) { return [k, R.SONGS[k].label]; }) }
  ];

  function termsHTML() {
    return (
      '<div class="small" style="display:grid;gap:10px">' +
      '<p><b>Termos de Uso e Política de Privacidade do O RIFF</b><br><span class="muted">Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</span></p>' +
      '<p><b>1. Dados que coletamos.</b> Nome, e-mail, telefone, CPF, endereço de entrega, perfil musical e respostas do quiz de nivelamento.</p>' +
      '<p><b>2. Para que usamos.</b> Entregar e recolher o kit físico, emitir cobranças da assinatura, personalizar a trilha de estudo por IA e sugerir conexões na comunidade.</p>' +
      '<p><b>3. Base legal.</b> Execução do contrato de locação (entrega, cobrança e suporte) e consentimento (personalização por IA e perfil público na comunidade), que pode ser revogado a qualquer momento.</p>' +
      '<p><b>4. Minimização.</b> O CPF fica armazenado de forma mascarada e dados de cartão não são guardados pela plataforma.</p>' +
      '<p><b>5. Seus direitos.</b> Acesso, correção, portabilidade e exclusão dos dados pelo canal do encarregado (DPO): privacidade@oriff.com.br.</p>' +
      '<p><b>6. Compartilhamento.</b> Somente com transportadora e meio de pagamento, na medida necessária para a entrega e a cobrança.</p>' +
      '</div>'
    );
  }

  function renderTela1(root) {
    var st = R.state;
    var user = R.user();
    var form = { quiz: {}, styles: [], level: null, levelManual: false, instrument: 'Guitarra', addrAuto: false };

    root.innerHTML =
      '<div class="tabs" role="tablist" style="max-width:520px">' +
        '<button class="tab" role="tab" data-tab="cadastro" aria-selected="true">' + R.icon('user') + 'Criar conta</button>' +
        '<button class="tab" role="tab" data-tab="login" aria-selected="false">' + R.icon('lock') + 'Já tenho conta</button>' +
      '</div>' +

      /* ---------- Cadastro ---------- */
      '<form id="fCad" class="grid split" novalidate data-pane="cadastro">' +
        '<div class="stack">' +
          '<div class="card">' +
            '<p class="section-title"><span class="num">1</span>Dados pessoais</p>' +
            '<div class="form-grid">' +
              field('span-6', 'name', 'Nome completo', '<input type="text" name="name" autocomplete="name" placeholder="Como está no seu documento">') +
              field('span-3', 'email', 'E-mail', '<input type="email" name="email" autocomplete="email" placeholder="voce@email.com">') +
              field('span-3', 'pass', 'Senha', '<input type="password" name="pass" autocomplete="new-password" placeholder="Mínimo de 8 caracteres">') +
              field('span-3', 'phone', 'Telefone / WhatsApp', '<input type="tel" name="phone" inputmode="numeric" placeholder="(19) 99999-9999">') +
              field('span-3', 'cpf', 'CPF', '<input type="text" name="cpf" inputmode="numeric" placeholder="000.000.000-00">', 'Validado pelos dígitos verificadores') +
            '</div>' +
          '</div>' +
          '<div class="card">' +
            '<p class="section-title"><span class="num">2</span>Endereço de entrega do kit físico</p>' +
            '<div class="form-grid">' +
              field('span-2', 'cep', 'CEP', '<input type="text" name="cep" inputmode="numeric" placeholder="13000-000">') +
              '<div class="span-4" style="align-self:end;padding-bottom:10px"><span class="hint" id="covHint">' + R.icon('pin', 15) + ' Atendemos Campinas e região (CEP 13000 a 13349)</span></div>' +
              field('span-4', 'street', 'Rua / Avenida', '<input type="text" name="street" autocomplete="address-line1">') +
              field('span-2', 'number', 'Número', '<input type="text" name="number" inputmode="numeric">') +
              field('span-3', 'complement', 'Complemento', '<input type="text" name="complement" placeholder="Opcional">', '', true) +
              field('span-3', 'bairro', 'Bairro', '<input type="text" name="bairro">') +
              field('span-4', 'city', 'Cidade', '<input type="text" name="city">') +
              field('span-2', 'uf', 'UF', '<input type="text" name="uf" maxlength="2" placeholder="SP">') +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="stack">' +
          '<div class="card">' +
            '<p class="section-title"><span class="num">3</span>Perfil musical inicial</p>' +
            '<div class="field" data-f="level"><span class="label">Nível <span class="req">*</span></span><div class="chips" id="levels">' +
              LEVELS.map(function (l) { return '<button type="button" class="opt" data-level="' + l + '" aria-pressed="false">' + l + '</button>'; }).join('') +
            '</div><span class="err"></span></div>' +
            '<div class="field mt" data-f="styles"><span class="label">Estilos favoritos <span class="req">*</span></span><div class="chips" id="styles">' +
              STYLES.map(function (s) { return '<button type="button" class="opt ok" data-style="' + s + '" aria-pressed="false">' + R.icon('music', 14) + s + '</button>'; }).join('') +
            '</div><span class="err"></span></div>' +
            '<div class="field mt"><label for="instr">Instrumento principal</label><select id="instr" name="instrument">' +
              INSTRUMENTS.map(function (i) { return '<option>' + i + '</option>'; }).join('') + '</select></div>' +
          '</div>' +

          '<div class="card">' +
            '<div class="row between"><p class="section-title" style="margin:0"><span class="num">4</span>Quiz rápido de nivelamento por IA</p><span class="tag" id="quizCount">0 de 3 cliques</span></div>' +
            '<div class="mt" data-f="quiz">' +
              QUIZ.map(function (q, i) {
                return '<div class="quiz-q"><p>' + R.icon('sparkle', 15) + (i + 1) + '. ' + q.q + '</p><div class="chips">' +
                  q.opts.map(function (o) { return '<button type="button" class="opt" data-q="' + q.key + '" data-v="' + o[0] + '" aria-pressed="false">' + esc(o[1]) + '</button>'; }).join('') +
                  '</div></div>';
              }).join('') +
              '<span class="err"></span>' +
            '</div>' +
            '<div id="aiBox" class="mt"></div>' +
          '</div>' +

          '<div class="card">' +
            '<p class="section-title"><span class="num">5</span>Privacidade</p>' +
            '<div class="field" data-f="lgpd">' +
              '<label class="check"><input type="checkbox" name="lgpd"><span>Li e aceito os <a href="#" data-terms>Termos de Uso e a Política de Privacidade</a>, conforme a Lei nº 13.709/2018 (LGPD). <span class="req">*</span></span></label>' +
              '<span class="err"></span>' +
            '</div>' +
            '<label class="check mt"><input type="checkbox" name="news"><span>Quero receber novidades e convites para salas ao vivo por WhatsApp (opcional).</span></label>' +
            '<button type="submit" class="btn btn-primary btn-lg btn-block mt-lg">' + R.icon('check') + 'Criar Conta</button>' +
          '</div>' +
        '</div>' +
      '</form>' +

      /* ---------- Login ---------- */
      '<div class="grid split-r" data-pane="login" hidden>' +
        '<form class="card" id="fLogin" novalidate>' +
          '<div class="card-head"><h3>' + R.icon('lock', 20) + 'Entrar na sua conta</h3></div>' +
          '<div class="stack" style="gap:14px">' +
            field('', 'lemail', 'E-mail', '<input type="email" name="lemail" autocomplete="username">') +
            field('', 'lpass', 'Senha', '<input type="password" name="lpass" autocomplete="current-password">') +
            '<button class="btn btn-primary btn-block" type="submit">' + R.icon('arrow') + 'Entrar</button>' +
            '<button class="btn btn-link small" type="button" id="forgot">Esqueci minha senha</button>' +
          '</div>' +
        '</form>' +
        '<div class="card">' +
          '<div class="card-head"><h3>' + R.icon('users', 20) + 'Contas da demonstração</h3></div>' +
          '<p class="muted small">Sessão atual: <b>' + esc(user.name) + '</b> (' + esc(user.email) + ')</p>' +
          '<div class="list" id="demoAccounts">' +
            st.accounts.map(function (a) {
              return '<div class="list-item">' + R.avatar(a.name, 36) + '<div class="grow"><b>' + esc(a.name) + '</b><div class="muted small">' + esc(a.email) +
                (a.email.indexOf('@aluno.oriff') > 0 ? ' • senha: oriff2026' : '') + '</div></div>' +
                '<button class="btn btn-sm btn-ghost" data-use="' + esc(a.email) + '">Usar</button></div>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>';

    function field(span, name, label, input, hint, optional) {
      return '<div class="field ' + span + '" data-f="' + name + '"><label>' + label + (optional ? '' : ' <span class="req">*</span>') + '</label>' + input +
        (hint ? '<span class="hint">' + hint + '</span>' : '') + '<span class="err"></span></div>';
    }

    var fCad = root.querySelector('#fCad');
    var $ = function (n) { return fCad.querySelector('[name="' + n + '"]'); };

    /* Abas */
    root.querySelectorAll('[data-tab]').forEach(function (t) {
      t.addEventListener('click', function () {
        var tab = t.getAttribute('data-tab');
        root.querySelectorAll('[data-tab]').forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); });
        root.querySelectorAll('[data-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== tab; });
      });
    });

    /* Máscaras */
    R.mask($('cpf'), 'cpf');
    R.mask($('phone'), 'phone');
    R.mask($('cep'), 'cep');

    /* CEP: cobertura + preenchimento automático (ViaCEP quando houver internet) */
    var covHint = root.querySelector('#covHint');
    $('cep').addEventListener('input', function () {
      var d = R.digits(this.value);
      if (d.length < 8) {
        covHint.className = 'hint';
        covHint.innerHTML = R.icon('pin', 15) + ' Atendemos Campinas e região (CEP 13000 a 13349)';
        return;
      }
      var cov = R.coverage(d);
      covHint.className = 'hint ' + (cov.ok ? 'ok' : 'bad');
      covHint.innerHTML = cov.ok
        ? R.icon('check', 15) + ' Entregamos o kit neste CEP (' + cov.zone + ', frete ' + (cov.freight ? R.money(cov.freight) : 'grátis') + ')'
        : R.icon('alert', 15) + ' Ainda não entregamos neste CEP. ' + cov.reason + '.';
      setErr('cep', '');
      lookupCEP(d);
    });

    function lookupCEP(d) {
      if (!window.fetch) return;
      var ctrl = window.AbortController ? new AbortController() : null;
      if (ctrl) setTimeout(function () { ctrl.abort(); }, 4000);
      fetch('https://viacep.com.br/ws/' + d + '/json/', ctrl ? { signal: ctrl.signal } : {})
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j || j.erro) return;
          [['street', j.logradouro], ['bairro', j.bairro], ['city', j.localidade], ['uf', j.uf]].forEach(function (p) {
            if (p[1] && (!$(p[0]).value || form.addrAuto)) $(p[0]).value = p[1];
          });
          form.addrAuto = true;
          $('number').focus();
        })
        .catch(function () { /* sem internet: o aluno preenche manualmente */ });
    }

    /* Nível, estilos e instrumento */
    root.querySelectorAll('[data-level]').forEach(function (b) {
      b.addEventListener('click', function () {
        form.level = b.getAttribute('data-level');
        form.levelManual = true;
        syncLevel();
        setErr('level', '');
      });
    });
    function syncLevel() {
      root.querySelectorAll('[data-level]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-level') === form.level)); });
    }
    root.querySelectorAll('[data-style]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = b.getAttribute('data-style');
        var i = form.styles.indexOf(s);
        if (i >= 0) form.styles.splice(i, 1); else form.styles.push(s);
        b.setAttribute('aria-pressed', String(i < 0));
        setErr('styles', '');
      });
    });

    /* Quiz IA (3 cliques) */
    root.querySelectorAll('[data-q]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-q');
        var v = b.getAttribute('data-v');
        form.quiz[k] = k === 'song' ? v : Number(v);
        root.querySelectorAll('[data-q="' + k + '"]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        setErr('quiz', '');
        updateQuiz();
      });
    });

    function updateQuiz() {
      var answered = ['played', 'minutes', 'song'].filter(function (k) { return form.quiz[k] != null; }).length;
      root.querySelector('#quizCount').textContent = answered + ' de 3 cliques';
      var box = root.querySelector('#aiBox');
      if (answered < 3) { box.innerHTML = ''; return; }
      var lvl = R.levelFromQuiz(form.quiz);
      if (!form.levelManual) { form.level = lvl; syncLevel(); setErr('level', ''); }
      var path = R.aiPath({ level: lvl, quiz: form.quiz }).slice(0, 3);
      box.innerHTML =
        '<div class="ai-box"><h4>' + R.icon('sparkle', 17) + 'A IA do O RIFF montou seu ponto de partida</h4>' +
        '<p class="small" style="margin:0 0 8px">Nível sugerido: <b>' + lvl + '</b> • Meta diária: <b>' + R.MINUTES[form.quiz.minutes] + '</b> • Primeira música: <b>' + esc(R.SONGS[form.quiz.song].label) + '</b></p>' +
        '<ol class="small" style="margin:0;padding-left:18px">' + path.map(function (p) { return '<li><b>' + esc(p.lesson.title) + '</b> <span class="muted">(' + esc(p.reason) + ')</span></li>'; }).join('') + '</ol>' +
        '<p class="tiny muted" style="margin:8px 0 0">Essas respostas alimentam a trilha adaptativa (Tela 5) e a taxa de compatibilidade da Comunidade (Tela 6).</p></div>';
    }

    /* Termos LGPD */
    root.querySelector('[data-terms]').addEventListener('click', function (e) {
      e.preventDefault();
      R.modal({
        title: 'Termos de Uso e Política de Privacidade', icon: 'shield', body: termsHTML(),
        actions: [{ label: 'Fechar' }, { label: 'Li e aceito', kind: 'primary', onClick: function () { $('lgpd').checked = true; setErr('lgpd', ''); } }]
      });
    });

    function setErr(name, msg) {
      var f = root.querySelector('[data-f="' + name + '"]');
      if (!f) return;
      f.classList.toggle('invalid', !!msg);
      var e = f.querySelector('.err');
      if (e) e.textContent = msg || '';
    }

    fCad.querySelectorAll('input').forEach(function (i) {
      i.addEventListener('input', function () { if (i.name) setErr(i.name, ''); });
      i.addEventListener('change', function () { if (i.name) setErr(i.name, ''); });
    });

    /* Envio do cadastro */
    fCad.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = {};
      ['name', 'email', 'pass', 'phone', 'cpf', 'cep', 'street', 'number', 'complement', 'bairro', 'city', 'uf'].forEach(function (k) { v[k] = $(k).value.trim(); });
      var errs = {};
      if (v.name.split(/\s+/).length < 2) errs.name = 'Informe nome e sobrenome.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) errs.email = 'E-mail inválido.';
      else if (R.state.accounts.some(function (a) { return a.email.toLowerCase() === v.email.toLowerCase(); })) errs.email = 'Já existe uma conta com este e-mail.';
      if (v.pass.length < 8) errs.pass = 'A senha precisa ter pelo menos 8 caracteres.';
      if (R.digits(v.phone).length < 10) errs.phone = 'Telefone incompleto.';
      if (!R.validCPF(v.cpf)) errs.cpf = 'CPF inválido.';
      var cov = R.coverage(v.cep);
      if (R.digits(v.cep).length !== 8) errs.cep = 'CEP incompleto.';
      else if (!cov.ok) errs.cep = 'Fora da área de entrega do piloto.';
      if (!v.street) errs.street = 'Informe a rua.';
      if (!v.number) errs.number = 'Informe o número.';
      if (!v.bairro) errs.bairro = 'Informe o bairro.';
      if (!v.city) errs.city = 'Informe a cidade.';
      if (!/^[A-Za-z]{2}$/.test(v.uf)) errs.uf = 'UF com 2 letras.';
      if (!form.level) errs.level = 'Escolha seu nível (ou responda o quiz).';
      if (!form.styles.length) errs.styles = 'Escolha pelo menos um estilo.';
      if (form.quiz.played == null || form.quiz.minutes == null || !form.quiz.song) errs.quiz = 'Responda as 3 perguntas do quiz.';
      if (!$('lgpd').checked) errs.lgpd = 'O aceite dos Termos e da Política de Privacidade é obrigatório.';

      ['name', 'email', 'pass', 'phone', 'cpf', 'cep', 'street', 'number', 'bairro', 'city', 'uf', 'level', 'styles', 'quiz', 'lgpd'].forEach(function (k) { setErr(k, errs[k]); });
      var keys = Object.keys(errs);
      if (keys.length) {
        R.toast('Revise ' + keys.length + (keys.length > 1 ? ' campos destacados.' : ' campo destacado.'), { type: 'warn' });
        var first = root.querySelector('.field.invalid');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      var cpfD = R.digits(v.cpf);
      var acc = {
        name: v.name, email: v.email.toLowerCase(), pass: R.hash(v.pass), phone: v.phone,
        cpf: '***.***.' + cpfD.slice(6, 9) + '-' + cpfD.slice(9), // LGPD: armazenamos mascarado
        cep: v.cep, street: v.street, number: v.number, complement: v.complement, bairro: v.bairro, city: v.city, uf: v.uf.toUpperCase(),
        level: form.level, styles: form.styles.slice(), instrument: root.querySelector('#instr').value,
        quiz: { played: form.quiz.played, minutes: form.quiz.minutes, song: form.quiz.song },
        news: $('news').checked, createdAt: Date.now(), lgpdAt: Date.now()
      };
      R.state.accounts.push(acc);
      R.state.session = acc.email;
      R.learning(acc.email);
      R.save();

      R.modal({
        title: 'Conta criada', icon: 'check', noFocus: true,
        body:
          '<div class="alert alert-ok">' + R.icon('check', 20) + '<div><b>Confirmação de cadastro enviada por e-mail!</b><br>' +
          '<span class="small">Enviamos o link de confirmação para <b>' + esc(acc.email) + '</b>.</span></div></div>' +
          '<dl class="kv mt"><dt>Aluno</dt><dd>' + esc(acc.name) + '</dd><dt>Nível</dt><dd>' + esc(acc.level) + '</dd>' +
          '<dt>Estilos</dt><dd>' + esc(acc.styles.join(', ')) + '</dd><dt>Entrega</dt><dd>' + esc(acc.bairro + ', ' + acc.city + '/' + acc.uf) + '</dd>' +
          '<dt>LGPD</dt><dd>Aceite registrado em ' + R.fmtDateTime(acc.lgpdAt) + '</dd></dl>',
        actions: [
          { label: 'Ver minha trilha', icon: 'sparkle', onClick: function () { R.go(5); } },
          { label: 'Escolher kit e plano', kind: 'primary', icon: 'guitar', onClick: function () { R.go(2); } }
        ],
        onClose: function () { R.rerender(); }
      });
    });

    /* Login */
    var fLogin = root.querySelector('#fLogin');
    fLogin.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = fLogin.querySelector('[name="lemail"]').value.trim().toLowerCase();
      var pw = fLogin.querySelector('[name="lpass"]').value;
      var acc = R.state.accounts.find(function (a) { return a.email.toLowerCase() === em; });
      if (!acc || acc.pass !== R.hash(pw)) {
        R.toast('E-mail ou senha incorretos.', { type: 'warn' });
        return;
      }
      R.state.session = acc.email;
      R.save();
      R.toast('Bem-vindo de volta, ' + acc.name.split(' ')[0] + '!', { action: { label: 'Ir para Rastreio', go: 3 } });
      R.rerender();
    });
    root.querySelector('#forgot').addEventListener('click', function () {
      R.toast('Link de redefinição de senha enviado para o e-mail informado.', { type: 'info' });
    });
    root.querySelectorAll('[data-use]').forEach(function (b) {
      b.addEventListener('click', function () {
        var acc = R.state.accounts.find(function (a) { return a.email === b.getAttribute('data-use'); });
        fLogin.querySelector('[name="lemail"]').value = acc.email;
        fLogin.querySelector('[name="lpass"]').value = acc.email.indexOf('@aluno.oriff') > 0 ? 'oriff2026' : '';
        fLogin.querySelector('[name="lpass"]').focus();
      });
    });
  }

  R.register(1, {
    lead: 'Cadastro em 5 blocos: dados pessoais, endereço com checagem de cobertura para o kit físico, perfil musical, quiz de 3 cliques que monta a trilha por IA e aceite LGPD.',
    render: renderTela1
  });

  /* ===============================================================
     TELA 2: Vitrine do Kit, Planos, Rent to Own, Marketplace, Checkout
     =============================================================== */
  var PRODUCTS = [
    { id: 'cordas-009', name: 'Jogo de cordas .009', partner: 'Loja parceira • Cambuí', price: 39.9, icon: 'music', promo: true },
    { id: 'cordas-010', name: 'Jogo de cordas .010', partner: 'Loja parceira • Cambuí', price: 42.9, icon: 'music', promo: true },
    { id: 'cabo', name: 'Cabo blindado 3 m', partner: 'Loja parceira • Centro', price: 59.9, icon: 'headphones', promo: true },
    { id: 'correia', name: 'Correia acolchoada', partner: 'Luthier parceiro • Barão Geraldo', price: 49.9, icon: 'guitar' },
    { id: 'palhetas', name: 'Kit 12 palhetas (0,46 a 1,0 mm)', partner: 'Loja parceira • Centro', price: 19.9, icon: 'star' },
    { id: 'miniamp', name: 'Mini amp de estudo 10 W', partner: 'Loja parceira • Taquaral', price: 289, icon: 'mic' }
  ];
  var PROMO = 0.15; // 15% OFF para assinantes (post patrocinado da Tela 7)

  function isSubscriber() {
    var o = R.userOrder();
    return !!(o && o.status === 'ativo');
  }
  function productPrice(p) {
    return p.promo && isSubscriber() ? Math.round(p.price * (1 - PROMO) * 100) / 100 : p.price;
  }
  function cartLines() {
    return R.state.ui.cart.map(function (c) {
      var p = PRODUCTS.find(function (x) { return x.id === c.id; });
      return p ? { id: p.id, name: p.name, qty: c.qty, price: productPrice(p) } : null;
    }).filter(Boolean);
  }
  function cartTotal() {
    return cartLines().reduce(function (s, l) { return s + l.qty * l.price; }, 0);
  }

  function luhn(num) {
    var d = R.digits(num), sum = 0, alt = false;
    if (d.length < 13) return false;
    for (var i = d.length - 1; i >= 0; i--) {
      var n = Number(d[i]);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n; alt = !alt;
    }
    return sum % 10 === 0;
  }

  function renderTela2(root) {
    var ui = R.state.ui;
    if (!R.PLANS[ui.plan]) ui.plan = 'trimestral';
    if (!R.APP_PLANS[ui.app]) ui.app = 'premium';
    var gallery = 'guitar';
    var rtoMonths = 6;
    var sub = isSubscriber();
    var myOrder = R.userOrder();

    root.innerHTML =
      '<div class="tabs" role="tablist" style="max-width:640px">' +
        '<button class="tab" role="tab" data-tab="kit" aria-selected="' + (ui.tab !== 'market') + '">' + R.icon('guitar') + 'Kit Físico e Assinatura</button>' +
        '<button class="tab" role="tab" data-tab="market" aria-selected="' + (ui.tab === 'market') + '">' + R.icon('cart') + 'Marketplace Parceiros (Campinas)</button>' +
      '</div>' +
      '<div class="grid split">' +
        '<div class="stack" id="mainCol"></div>' +
        '<aside class="sticky"><div class="card" id="summary"></div></aside>' +
      '</div>';

    var mainCol = root.querySelector('#mainCol');
    var summary = root.querySelector('#summary');

    root.querySelectorAll('[data-tab]').forEach(function (t) {
      t.addEventListener('click', function () {
        ui.tab = t.getAttribute('data-tab');
        R.save();
        root.querySelectorAll('[data-tab]').forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); });
        drawMain();
      });
    });

    function drawMain() {
      if (ui.tab === 'market') drawMarket(); else drawKit();
      drawSummary();
    }

    /* ---------- Aba Kit ---------- */
    function drawKit() {
      var plan = R.PLANS[ui.plan];
      mainCol.innerHTML =
        '<div class="grid cols-2">' +
          '<div class="card">' +
            '<div class="gallery-main" id="gMain"></div>' +
            '<div class="thumbs">' +
              [['guitar', 'Guitarra'], ['tuner', 'Afinador Clip'], ['case', 'Hardcase']].map(function (g) {
                return '<button class="thumb" data-g="' + g[0] + '" aria-pressed="' + (g[0] === gallery) + '">' + (g[0] === 'guitar' ? R.guitarSVG(54) : g[0] === 'tuner' ? tunerSVG(54) : caseSVG(54)) + g[1] + '</button>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<div class="card">' +
            '<div class="card-head"><h3>' + R.icon('guitar', 20) + 'Ficha técnica do Kit O RIFF</h3><span class="badge s-ok">' + R.icon('check', 13) + 'Regulado em bancada</span></div>' +
            '<ul class="spec">' +
              '<li><span>Corpo</span><span>Cedro Rosa, ergonômico (3,4 kg)</span></li>' +
              '<li><span>Braço</span><span>Marfim</span></li>' +
              '<li><span>Escala</span><span>Jacarandá, 22 trastes</span></li>' +
              '<li><span>Ponte</span><span>Fixa</span></li>' +
              '<li><span>Tarraxas</span><span>Com trava</span></li>' +
              '<li><span>Elétrica</span><span>Blindada (menos ruído)</span></li>' +
              '<li><span>Regulagem</span><span>Ação baixa de 1,5 mm no 12º traste</span></li>' +
              '<li><span>Afinador</span><span>Digital Clip piezoelétrico</span></li>' +
              '<li><span>Estojo</span><span>Hardcase Rígida de Polietileno</span></li>' +
            '</ul>' +
            '<p class="small muted mt" style="margin-bottom:0">Cada kit sai com Passaporte Digital de Regulagem assinado pelo luthier do Hub Campinas.</p>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card-head"><h3>' + R.icon('calendar', 20) + 'Escolha o plano de assinatura do kit</h3></div>' +
          '<div class="grid cols-3">' +
            Object.keys(R.PLANS).map(function (k) {
              var p = R.PLANS[k];
              return '<button class="plan" data-plan="' + k + '" aria-pressed="' + (k === ui.plan) + '">' +
                (k === 'semestral' ? '<span class="ribbon">Melhor valor</span>' : k === 'trimestral' ? '<span class="ribbon" style="background:var(--amber)">Mais escolhido</span>' : '') +
                '<b>' + p.name + '</b><span class="price">' + R.money(p.price) + '<small>/mês</small></span>' +
                '<span class="small muted">' + p.note + '</span>' +
                '<span class="tiny muted">' + (p.months > 1 ? 'Total do período: ' + R.money(p.price * p.months) : 'Cancele quando quiser') + '</span></button>';
            }).join('') +
          '</div>' +
          '<p class="section-title mt-lg">Add on digital: app de estudo</p>' +
          '<div class="grid cols-2">' +
            '<button class="plan" data-app="freemium" aria-pressed="' + (ui.app === 'freemium') + '"><b>O RIFF App Freemium</b><span class="price">R$ 0<small>/mês</small></span><span class="small muted">Afinador e lições básicas</span></button>' +
            '<button class="plan" data-app="premium" aria-pressed="' + (ui.app === 'premium') + '"><span class="ribbon">IA</span><b>O RIFF App Premium IA</b><span class="price">' + R.money(19.9) + '<small>/mês</small></span><span class="small muted">Trilha adaptativa por IA, Player Tudo em Um e Match IA</span></button>' +
          '</div>' +
        '</div>' +

        '<div class="card hl">' +
          '<div class="card-head"><h3>' + R.icon('star', 20) + 'Rent to Own: a guitarra pode ser sua</h3><span class="badge s-amber">Compra definitiva</span></div>' +
          '<p class="small">Gostou do instrumento? A qualquer momento você compra a guitarra alugada e <b>50% de todas as mensalidades já pagas</b> são abatidas do preço.</p>' +
          '<div class="grid cols-2 mt">' +
            '<div class="field"><label for="rto">Meses de assinatura pagos: <b id="rtoM">' + rtoMonths + '</b></label><input type="range" id="rto" min="1" max="24" value="' + rtoMonths + '"><span class="hint">Simulação com o plano ' + plan.name + ' (' + R.money(plan.price) + '/mês)</span></div>' +
            '<div id="rtoCalc"></div>' +
          '</div>' +
        '</div>';

      drawGallery();
      drawRto();
      mainCol.querySelectorAll('[data-g]').forEach(function (b) {
        b.addEventListener('click', function () {
          gallery = b.getAttribute('data-g');
          mainCol.querySelectorAll('[data-g]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          drawGallery();
        });
      });
      mainCol.querySelectorAll('[data-plan]').forEach(function (b) {
        b.addEventListener('click', function () { ui.plan = b.getAttribute('data-plan'); R.save(); drawKit(); drawSummary(); });
      });
      mainCol.querySelectorAll('[data-app]').forEach(function (b) {
        b.addEventListener('click', function () { ui.app = b.getAttribute('data-app'); R.save(); drawKit(); drawSummary(); });
      });
      mainCol.querySelector('#rto').addEventListener('input', function () {
        rtoMonths = Number(this.value);
        mainCol.querySelector('#rtoM').textContent = rtoMonths;
        drawRto();
      });
    }

    function drawGallery() {
      var g = mainCol.querySelector('#gMain');
      g.innerHTML = gallery === 'guitar' ? R.guitarSVG(320) : gallery === 'tuner' ? tunerSVG(220) : caseSVG(310);
    }

    function drawRto() {
      var plan = R.PLANS[ui.plan];
      var paid = plan.price * rtoMonths;
      var off = paid * R.CONST.RENT_TO_OWN_RATE;
      var final = Math.max(0, R.CONST.KIT_PRICE_REF - off);
      mainCol.querySelector('#rtoCalc').innerHTML =
        '<div class="summary-line"><span class="muted">Preço de referência do kit</span><span>' + R.money(R.CONST.KIT_PRICE_REF) + '</span></div>' +
        '<div class="summary-line"><span class="muted">Mensalidades pagas</span><span>' + R.money(paid) + '</span></div>' +
        '<div class="summary-line"><span class="muted">Abatimento (50%)</span><span class="ok-text">− ' + R.money(off) + '</span></div>' +
        '<div class="summary-line total"><span>Você paga para ficar com ela</span><span class="price-big" style="font-size:22px">' + R.money(final) + '</span></div>';
    }

    /* ---------- Aba Marketplace ---------- */
    function drawMarket() {
      mainCol.innerHTML =
        '<div class="card">' +
          '<div class="card-head"><h3>' + R.icon('cart', 20) + 'Marketplace de Lojas e Luthiers Parceiros (Campinas)</h3></div>' +
          '<p class="card-sub">Compra avulsa e direta de acessórios. O O RIFF recebe ' + Math.round(R.CONST.COMMISSION * 100) + '% de comissão por venda, sem estoque próprio.</p>' +
          (sub ? '<div class="alert alert-amber mb">' + R.icon('star', 18) + '<div>Você é assinante: <b>15% OFF</b> em encordoamentos e cabos (oferta da loja parceira divulgada no Feed).</div></div>' : '') +
          '<div class="grid cols-3">' +
            PRODUCTS.map(function (p) {
              var price = productPrice(p);
              var inCart = R.state.ui.cart.find(function (c) { return c.id === p.id; });
              return '<div class="card inner product">' +
                '<div class="product-art">' + R.icon(p.icon, 40) + '</div>' +
                '<h4>' + esc(p.name) + '</h4>' +
                '<span class="tiny muted">' + R.icon('pin', 12) + ' ' + esc(p.partner) + '</span>' +
                '<div class="row between"><b>' + R.money(price) + '</b>' + (price !== p.price ? '<s class="tiny muted">' + R.money(p.price) + '</s>' : '') + '</div>' +
                (inCart
                  ? '<div class="row between"><span class="qty"><button data-dec="' + p.id + '" aria-label="Diminuir">−</button><span>' + inCart.qty + '</span><button data-inc="' + p.id + '" aria-label="Aumentar">+</button></span><span class="badge s-ok">No carrinho</span></div>'
                  : '<button class="btn btn-ghost btn-sm" data-add="' + p.id + '">' + R.icon('cart', 15) + 'Adicionar</button>') +
                '</div>';
            }).join('') +
          '</div>' +
        '</div>';
      mainCol.querySelectorAll('[data-add]').forEach(function (b) {
        b.addEventListener('click', function () { addCart(b.getAttribute('data-add'), 1); });
      });
      mainCol.querySelectorAll('[data-inc]').forEach(function (b) {
        b.addEventListener('click', function () { addCart(b.getAttribute('data-inc'), 1); });
      });
      mainCol.querySelectorAll('[data-dec]').forEach(function (b) {
        b.addEventListener('click', function () { addCart(b.getAttribute('data-dec'), -1); });
      });
    }

    function addCart(id, d) {
      var cart = R.state.ui.cart;
      var it = cart.find(function (c) { return c.id === id; });
      if (!it) cart.push({ id: id, qty: 1 });
      else {
        it.qty += d;
        if (it.qty <= 0) cart.splice(cart.indexOf(it), 1);
      }
      R.save();
      drawMarket();
      drawSummary();
    }

    /* ---------- Resumo do pedido ---------- */
    function drawSummary() {
      var plan = R.PLANS[ui.plan];
      var app = R.APP_PLANS[ui.app];
      var lines = cartLines();
      var items = cartTotal();
      var monthly = plan.price + app.price;
      summary.innerHTML =
        '<div class="card-head"><h3>' + R.icon('box', 20) + 'Seu pedido</h3></div>' +
        (myOrder ? '<div class="alert alert-info small mb">' + R.icon('bell', 16) + '<div>Você já tem o pedido <b>' + esc(myOrder.id) + '</b>' + (myOrder.serial ? ' com o kit ' + esc(myOrder.serial) : '') + '. Um novo checkout gera outro kit.</div></div>' : '') +
        '<div class="summary-line"><span>Kit O RIFF • Plano ' + plan.name + '</span><b>' + R.money(plan.price) + '/mês</b></div>' +
        '<div class="summary-line"><span>' + app.name + '</span><b>' + (app.price ? R.money(app.price) + '/mês' : 'Grátis') + '</b></div>' +
        '<div class="summary-line"><span class="muted">Seguro de transporte na hardcase</span><span class="ok-text">Incluso</span></div>' +
        '<div class="summary-line total"><span>Mensalidade</span><span>' + R.money(monthly) + '</span></div>' +
        (lines.length
          ? '<p class="section-title mt">Marketplace (avulso)</p>' + lines.map(function (l) {
              return '<div class="summary-line small"><span>' + l.qty + '× ' + esc(l.name) + '</span><span>' + R.money(l.qty * l.price) + '</span></div>';
            }).join('') + '<div class="summary-line"><span>Itens avulsos</span><b>' + R.money(items) + '</b></div>'
          : '<p class="small muted mt">Precisa de cordas, cabo ou palhetas? <a href="#" id="goMarket">Veja o Marketplace</a>.</p>') +
        '<button class="btn btn-primary btn-block btn-lg mt" id="toCheckout">' + R.icon('lock') + 'Continuar para o checkout</button>' +
        (lines.length ? '<button class="btn btn-ghost btn-block mt" id="onlyItems">Comprar só os itens do marketplace</button>' : '') +
        '<p class="tiny muted center mt" style="margin-bottom:0">' + R.icon('shield', 13) + ' Caução reembolsável e contrato digital na próxima etapa</p>';
      var gm = summary.querySelector('#goMarket');
      if (gm) gm.addEventListener('click', function (e) { e.preventDefault(); root.querySelector('[data-tab="market"]').click(); });
      summary.querySelector('#toCheckout').addEventListener('click', function () { openCheckout('assinatura'); });
      var oi = summary.querySelector('#onlyItems');
      if (oi) oi.addEventListener('click', function () { openCheckout('avulso'); });
    }

    /* ---------- Checkout ---------- */
    function openCheckout(mode) {
      var user = R.user();
      var plan = R.PLANS[ui.plan];
      var app = R.APP_PLANS[ui.app];
      var lines = cartLines();
      var items = cartTotal();
      var freight = null;
      var isSub = mode === 'assinatura';

      var body = document.createElement('div');
      body.innerHTML =
        '<div class="grid split">' +
          '<div class="stack">' +
            '<div><p class="section-title"><span class="num">1</span>Entrega</p>' +
              '<div class="row top wrap">' +
                '<div class="field" style="width:170px" data-f="ccep"><label>CEP</label><input type="text" name="ccep" inputmode="numeric" value="' + esc(user.cep || '') + '"><span class="err"></span></div>' +
                '<button class="btn btn-ghost" type="button" id="calcFrete" style="margin-top:25px">' + R.icon('truck') + 'Calcular frete</button>' +
              '</div>' +
              '<p class="small muted" style="margin:8px 0 0">' + esc([user.street, user.number, user.bairro, user.city].filter(Boolean).join(', ')) + '</p>' +
              '<div id="freteOut" class="small mt"></div>' +
            '</div>' +
            (isSub
              ? '<div class="grid cols-2">' +
                  '<div class="card inner ok"><b class="row">' + R.icon('shield', 18) + 'Seguro de Transporte</b><p class="small" style="margin:6px 0 0">Seguro na Hardcase Rígida <span class="badge s-ok">Incluso</span>. Cobre danos no trajeto de ida e de volta.</p></div>' +
                  '<div class="card inner"><b class="row">' + R.icon('lock', 18) + 'Caução reembolsável</b><p class="small" style="margin:6px 0 0">Pré autorização de <b>' + R.money(R.CONST.CAUCAO) + '</b> no cartão. Não é cobrança: o valor é liberado na devolução do kit em bom estado.</p></div>' +
                '</div>'
              : '') +
            '<div><p class="section-title"><span class="num">' + (isSub ? 2 : 2) + '</span>Pagamento</p>' +
              '<div class="form-grid">' +
                '<div class="field span-6" data-f="cnum"><label>Número do cartão</label><input type="text" name="cnum" inputmode="numeric" placeholder="0000 0000 0000 0000" autocomplete="off"><span class="hint">Ambiente de demonstração: use 4111 1111 1111 1111. Nada é enviado ou salvo.</span><span class="err"></span></div>' +
                '<div class="field span-6" data-f="cname"><label>Nome impresso</label><input type="text" name="cname" value="' + esc(user.name.toUpperCase()) + '" autocomplete="off"><span class="err"></span></div>' +
                '<div class="field span-3" data-f="cexp"><label>Validade</label><input type="text" name="cexp" inputmode="numeric" placeholder="MM/AA" autocomplete="off"><span class="err"></span></div>' +
                '<div class="field span-3" data-f="ccvv"><label>CVV</label><input type="password" name="ccvv" inputmode="numeric" placeholder="123" autocomplete="off"><span class="err"></span></div>' +
              '</div>' +
            '</div>' +
            (isSub
              ? '<div><p class="section-title"><span class="num">3</span>Contrato</p>' +
                  '<details class="card inner small"><summary style="cursor:pointer;font-weight:600">Ler o Contrato Digital de Locação</summary>' +
                    '<ol style="padding-left:18px;margin:10px 0 0;display:grid;gap:6px">' +
                      '<li>O O RIFF loca ao aluno o kit (guitarra, afinador clip e hardcase) regulado e com Passaporte Digital de Regulagem.</li>' +
                      '<li>A mensalidade do plano ' + plan.name + ' é de ' + R.money(plan.price) + (plan.months > 1 ? ', com permanência de ' + plan.months + ' meses' : ', sem fidelidade') + '.</li>' +
                      '<li>A caução de ' + R.money(R.CONST.CAUCAO) + ' é apenas pré autorizada e liberada na devolução sem danos.</li>' +
                      '<li>O transporte é feito na hardcase rígida, com seguro incluso nos dois sentidos.</li>' +
                      '<li>O aluno pode exercer a compra (Rent to Own) com abatimento de 50% das mensalidades pagas.</li>' +
                      '<li>Manutenção preventiva pelo Hub Campinas conforme o plano contratado.</li>' +
                    '</ol></details>' +
                  '<div class="field mt" data-f="contract"><label class="check"><input type="checkbox" name="contract"><span>Li e aceito o Contrato Digital de Locação.</span></label><span class="err"></span></div>' +
                '</div>'
              : '') +
          '</div>' +
          '<div class="card inner" id="ckSummary"></div>' +
        '</div>';

      var m = R.modal({
        title: isSub ? 'Checkout da assinatura' : 'Checkout do marketplace', icon: 'lock', wide: true, body: body, noFocus: true,
        actions: [
          { label: 'Voltar' },
          { label: isSub ? 'Confirmar Assinatura' : 'Confirmar compra', kind: 'primary', icon: 'check', onClick: function (close) { return confirm(close); } }
        ]
      });
      var q = function (n) { return body.querySelector('[name="' + n + '"]'); };
      R.mask(q('ccep'), 'cep');
      R.mask(q('cnum'), 'card');
      R.mask(q('cexp'), 'exp');
      R.mask(q('ccvv'), 'cvv');

      function setErr(name, msg) {
        var f = body.querySelector('[data-f="' + name + '"]');
        if (!f) return;
        f.classList.toggle('invalid', !!msg);
        f.querySelector('.err').textContent = msg || '';
      }

      function calc() {
        var cov = R.coverage(q('ccep').value);
        var out = body.querySelector('#freteOut');
        if (!cov.ok) {
          freight = null;
          out.innerHTML = '<span class="bad-text">' + R.icon('alert', 15) + ' ' + esc(cov.reason) + '.</span>';
        } else {
          freight = cov.freight;
          out.innerHTML = '<span class="ok-text">' + R.icon('truck', 15) + ' ' + cov.zone + ': ' + (freight ? R.money(freight) : 'frete grátis (entrega própria do Hub)') + ' • prazo de 2 a 4 dias úteis</span>';
        }
        setErr('ccep', '');
        drawCk();
      }
      body.querySelector('#calcFrete').addEventListener('click', calc);
      q('ccep').addEventListener('input', function () { if (R.digits(this.value).length === 8) calc(); });
      if (R.digits(q('ccep').value).length === 8) calc();

      function drawCk() {
        var first = (isSub ? plan.price + app.price : 0) + items + (freight || 0);
        body.querySelector('#ckSummary').innerHTML =
          '<p class="section-title">Resumo</p>' +
          (isSub
            ? '<div class="summary-line small"><span>Plano ' + plan.name + '</span><span>' + R.money(plan.price) + '</span></div>' +
              '<div class="summary-line small"><span>' + app.name + '</span><span>' + (app.price ? R.money(app.price) : 'Grátis') + '</span></div>'
            : '') +
          lines.map(function (l) { return '<div class="summary-line small"><span>' + l.qty + '× ' + esc(l.name) + '</span><span>' + R.money(l.qty * l.price) + '</span></div>'; }).join('') +
          '<div class="summary-line small"><span>Frete</span><span>' + (freight == null ? 'calcule pelo CEP' : freight ? R.money(freight) : 'Grátis') + '</span></div>' +
          (isSub ? '<div class="summary-line small"><span>Seguro de transporte</span><span class="ok-text">Incluso</span></div>' : '') +
          '<div class="summary-line total"><span>Primeira cobrança</span><span>' + R.money(first) + '</span></div>' +
          (isSub ? '<div class="summary-line small muted"><span>Caução (pré autorização)</span><span>' + R.money(R.CONST.CAUCAO) + '</span></div>' +
            '<div class="summary-line small muted"><span>Próximas mensalidades</span><span>' + R.money(plan.price + app.price) + '</span></div>' : '');
      }
      drawCk();

      function confirm(close) {
        var errs = {};
        var cov = R.coverage(q('ccep').value);
        if (!cov.ok) errs.ccep = 'CEP fora da área de entrega.';
        if (!luhn(q('cnum').value)) errs.cnum = 'Número de cartão inválido.';
        if (q('cname').value.trim().length < 3) errs.cname = 'Informe o nome impresso.';
        var ex = R.digits(q('cexp').value);
        var mm = Number(ex.slice(0, 2)), yy = Number(ex.slice(2));
        var now = new Date();
        if (ex.length !== 4 || mm < 1 || mm > 12 || 2000 + yy < now.getFullYear() || (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1)) errs.cexp = 'Validade inválida.';
        if (R.digits(q('ccvv').value).length < 3) errs.ccvv = 'CVV inválido.';
        if (isSub && !q('contract').checked) errs.contract = 'Aceite o contrato para continuar.';
        ['ccep', 'cnum', 'cname', 'cexp', 'ccvv', 'contract'].forEach(function (k) { setErr(k, errs[k]); });
        if (Object.keys(errs).length) { R.toast('Revise os dados do checkout.', { type: 'warn' }); return true; }
        if (freight == null) calc();

        var st = R.state;
        var now2 = Date.now();
        var num = String(st.nextOrder++).padStart(4, '0');
        var order;
        if (isSub) {
          var kit = st.inventory.find(function (i) { return i.status === 'Disponível'; });
          if (kit) { kit.status = 'Alugado'; kit.client = user.name; }
          order = {
            id: '#RIFF-2026-' + num, kind: 'assinatura', email: user.email, name: user.name, plan: ui.plan, app: ui.app,
            serial: kit ? kit.serial : null, tracking: 'RIFF-CPS-' + (88413 + Math.floor(Math.random() * 900)) + '-BR',
            stage: 1, status: 'ativo', createdAt: now2, items: lines, freight: freight || 0, caucao: R.CONST.CAUCAO,
            log: [{ at: now2, text: kit
              ? 'Pedido confirmado. Kit ' + kit.serial + ' em separação e regulagem em bancada no Hub Campinas.'
              : 'Pedido confirmado. Sem kit disponível agora: você entrou na fila e recebe o próximo kit liberado pelo luthier.' }]
          };
        } else {
          order = { id: '#RIFF-MKT-2026-' + num, kind: 'avulso', email: user.email, name: user.name, items: lines, freight: freight || 0, createdAt: now2, status: 'ativo', log: [] };
        }
        st.orders.push(order);
        st.revenue.marketplace += items * R.CONST.COMMISSION;
        st.ui.cart = [];
        R.save();
        close();

        R.modal({
          title: isSub ? 'Assinatura confirmada' : 'Compra confirmada', icon: 'check', noFocus: true,
          body:
            '<div class="center"><p class="eyebrow">Número do pedido</p><p class="price-big" style="margin:0 0 6px">' + esc(order.id) + '</p></div>' +
            (isSub
              ? '<dl class="kv mt"><dt>Plano</dt><dd>' + plan.name + ' • ' + R.money(plan.price) + '/mês</dd><dt>App</dt><dd>' + app.name + '</dd>' +
                '<dt>Kit</dt><dd>' + (order.serial ? '<span class="serial">' + order.serial + '</span>' : '<span class="badge s-amber">Fila de espera</span>') + '</dd>' +
                '<dt>Rastreio</dt><dd class="mono">' + order.tracking + '</dd><dt>Caução</dt><dd>' + R.money(R.CONST.CAUCAO) + ' pré autorizados</dd></dl>' +
                (order.serial && R.stockAvailable() <= 1 ? '<div class="alert alert-amber small mt">' + R.icon('alert', 16) + '<div>O estoque ficou baixo e o Administrador foi alertado na Tela 8.</div></div>' : '')
              : '<p class="small center muted">Os parceiros já receberam o pedido. Comissão do O RIFF registrada no dashboard.</p>'),
          actions: isSub
            ? [{ label: 'Ver no dashboard (Admin)', onClick: function () { R.go(8); } }, { label: 'Acompanhar envio', kind: 'primary', icon: 'truck', onClick: function () { R.go(3); } }]
            : [{ label: 'Fechar', kind: 'primary' }],
          onClose: function () { if (R.current() === 2) R.rerender(); }
        });
      }
    }

    drawMain();
  }

  R.register(2, {
    lead: 'Vitrine do kit físico com ficha técnica real, escolha de plano e do app, simulador Rent to Own, marketplace de parceiros de Campinas e checkout com seguro, caução e contrato digital.',
    render: renderTela2
  });
})();
