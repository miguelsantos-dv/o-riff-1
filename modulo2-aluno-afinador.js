/* =====================================================================
   O RIFF | Módulo 2: Área do Aluno (Logística, Passaporte, Manutenção,
   Afinador e Estudo)
   Arquivo: modulo2-aluno-afinador.js
   Responsável: Miguel Santos da Silva (Grupo 8)

   Tela 3 (US #03): Rastreio de envio e devolução, Passaporte de Regulagem
                    e gestão da assinatura
   Tela 4 (US #06): Agendamento de manutenção e abertura de chamado
   Tela 5 (US #05): Afinador digital, trilha gamificada e Player Tudo em Um

   Integrações:
   • Passaporte (Tela 3) lê o laudo gravado pelo luthier na Tela 9
   • Tickets e agendamentos (Tela 4) caem na fila do Admin (Tela 10)
   • Trilha (Tela 5) usa o nível e o quiz do cadastro (Tela 1)
   ===================================================================== */
(function () {
  'use strict';
  var R = window.RIFF;
  if (!R) return;
  var esc = R.esc;
  var DAY = 86400000;

  /* ===============================================================
     TELA 3: Rastreio, Passaporte e Assinatura
     =============================================================== */
  var STAGES = [
    { t: 'Em Separação e Regulagem em Bancada', s: 'Hub Campinas' },
    { t: 'Em Trânsito', s: 'Transporte em Hardcase Rígida' },
    { t: 'Entregue ao Aluno', s: 'Kit na sua casa' }
  ];

  function monthsPaid(o) {
    return Math.max(1, Math.ceil((Date.now() - o.createdAt) / (30 * DAY)));
  }

  function passportCode(p) {
    return 'PRT-' + R.hash(p.serial + p.date).slice(1, 7).toUpperCase();
  }

  function renderTela3(root) {
    var st = R.state;
    var user = R.user();
    var order = R.userOrder();

    if (!order) {
      root.innerHTML =
        '<div class="card empty">' + R.icon('truck', 40) + '<h3>Você ainda não tem um kit a caminho</h3>' +
        '<p class="muted">Escolha o plano na vitrine e o rastreio do seu kit aparece aqui, com o Passaporte de Regulagem assinado pelo luthier.</p>' +
        '<a class="btn btn-primary mt" href="#/tela-2">' + R.icon('guitar') + 'Ir para a vitrine do kit</a></div>';
      return;
    }

    var plan = R.PLANS[order.plan];
    var pass = order.serial ? st.passports[order.serial] : null;
    var recent = pass && Date.now() - pass.date < 3600000;
    var stage = order.stage;

    root.innerHTML =
      '<div class="grid split">' +
        '<div class="stack">' +
          /* Rastreamento */
          '<div class="card">' +
            '<div class="card-head"><h3>' + R.icon('truck', 20) + 'Pedido ' + esc(order.id) + '</h3>' +
              '<div class="row"><span class="tag mono">' + esc(order.tracking) + '</span><button class="icon-btn" id="copyTrk" title="Copiar código de rastreio" aria-label="Copiar código de rastreio">' + R.icon('copy', 16) + '</button></div></div>' +
            '<div class="stepper">' +
              STAGES.map(function (s, i) {
                var n = i + 1;
                var cls = n < stage || (stage === 3 && n === 3) ? 'done' : n === stage ? 'current' : '';
                return '<div class="step ' + cls + '"><div class="step-dot">' + (cls === 'done' ? R.icon('check', 18) : n) + '</div><b>' + s.t + '</b><small>' + s.s + '</small></div>';
              }).join('') +
            '</div>' +
            '<div class="row between wrap mt">' +
              '<span class="small muted">' + (order.serial ? 'Kit <span class="serial">' + esc(order.serial) + '</span>' : '<span class="badge s-amber">Aguardando kit liberado pelo luthier</span>') + '</span>' +
              '<button class="btn btn-ghost btn-sm" id="nextStage"' + (stage >= 3 || !order.serial ? ' disabled' : '') + '>' + R.icon('arrow', 15) + 'Avançar etapa de envio</button>' +
            '</div>' +
            '<hr class="divider">' +
            '<p class="section-title">' + R.icon('bell', 15) + 'Notificações a cada mudança de status</p>' +
            '<ul class="log">' + order.log.slice().reverse().map(function (l) {
              return '<li><div>' + esc(l.text) + '<small>' + R.fmtDateTime(l.at) + '</small></div></li>';
            }).join('') + '</ul>' +
          '</div>' +

          /* Passaporte */
          (pass
            ? '<div class="cert">' +
                '<div class="row between wrap"><span class="cert-seal">' + R.icon('shield', 16) + 'Passaporte / Certificado Digital de Regulagem</span>' +
                (recent ? '<span class="badge s-ok">' + R.icon('check', 13) + 'Atualizado agora pelo luthier</span>' : '<span class="tag mono">' + passportCode(pass) + '</span>') + '</div>' +
                '<h3 style="margin-top:10px;font-size:22px">Guitarra <span class="serial">' + esc(pass.serial) + '</span></h3>' +
                '<p class="small muted" style="margin:2px 0 0">Ficha técnica validada da guitarra que está com você</p>' +
                '<div class="cert-grid">' +
                  certItem('Nº de série', '<span class="serial">' + esc(pass.serial) + '</span>') +
                  certItem('Ação aferida', String(pass.acao).replace('.', ',') + ' mm no 12º traste') +
                  certItem('Cordas', esc(pass.cordas)) +
                  certItem('Trastes / Ponte / Elétrica', pass.trastes && pass.ponte && pass.eletrica ? '<span class="ok-text">Aprovados</span>' : '<span class="bad-text">Pendências na revisão</span>') +
                  certItem('Braço e tensor', pass.braco ? '<span class="ok-text">Aprovado</span>' : '<span class="bad-text">Ajuste pendente</span>') +
                  certItem('Luthier responsável', esc(pass.luthier) + ' • ' + R.fmtDate(pass.date)) +
                '</div>' +
                (pass.obs ? '<p class="small" style="margin:12px 0 0"><b>Observações do laudo:</b> ' + esc(pass.obs) + '</p>' : '') +
              '</div>'
            : '<div class="card empty">' + R.icon('shield', 32) + '<h3>Passaporte em emissão</h3><p class="muted small">Assim que o luthier salvar o laudo na bancada (Tela 9), o certificado da sua guitarra aparece aqui.</p></div>') +
        '</div>' +

        /* Assinatura e logística reversa */
        '<aside class="stack sticky">' +
          '<div class="card">' +
            '<div class="card-head"><h3>' + R.icon('calendar', 20) + 'Minha assinatura</h3>' + subBadge(order) + '</div>' +
            '<dl class="kv">' +
              '<dt>Plano</dt><dd>' + plan.name + ' • ' + R.money(plan.price) + '/mês</dd>' +
              '<dt>App</dt><dd>' + R.APP_PLANS[order.app].name + '</dd>' +
              '<dt>Desde</dt><dd>' + R.fmtDate(order.createdAt) + ' (' + monthsPaid(order) + (monthsPaid(order) > 1 ? ' meses pagos' : ' mês pago') + ')</dd>' +
              (order.status === 'pausado' ? '<dt>Pausado até</dt><dd>' + R.fmtDate(order.pausedUntil) + '</dd>' : '') +
              (order.caucao || order.id === '#RIFF-2026-0817' ? '<dt>Caução</dt><dd>' + R.money(R.CONST.CAUCAO) + ' pré autorizados</dd>' : '') +
            '</dl>' +
            '<div class="stack mt" style="gap:10px">' +
              (order.status === 'comprado'
                ? '<div class="alert alert-ok small">' + R.icon('star', 16) + '<div>Guitarra comprada via Rent to Own. Ela é sua!</div></div>'
                : '<button class="btn btn-ghost btn-block" id="btnPlan">' + R.icon('calendar') + (order.status === 'pausado' ? 'Reativar / Alterar Plano' : 'Alterar / Pausar Plano') + '</button>' +
                  '<button class="btn btn-primary btn-block" id="btnBuy"' + (order.serial ? '' : ' disabled') + '>' + R.icon('star') + 'Exercer Compra (Rent to Own)</button>') +
              '<button class="btn btn-ghost btn-block" id="btnReturn"' + (order.status === 'comprado' && !order.serial ? ' disabled' : '') + '>' + R.icon('box') + 'Solicitar Coleta / Devolução da Hardcase</button>' +
            '</div>' +
            (order.returnReq
              ? '<div class="alert alert-info small mt">' + R.icon('truck', 16) + '<div><b>Coleta agendada</b> para ' + R.fmtDate(order.returnReq.date) + ' (' + esc(order.returnReq.reason) + '). Código <span class="mono">' + esc(order.returnReq.code) + '</span></div></div>'
              : '') +
          '</div>' +
          '<div class="card">' +
            '<div class="card-head"><h3>' + R.icon('wrench', 20) + 'Precisa de ajuda?</h3></div>' +
            '<p class="small muted">Corda rompeu, apareceu ruído ou quer revisar a regulagem?</p>' +
            '<a class="btn btn-ghost btn-block" href="#/tela-4">' + R.icon('ticket') + 'Manutenção e suporte</a>' +
          '</div>' +
        '</aside>' +
      '</div>';

    function certItem(k, v) { return '<div class="cert-item"><small>' + k + '</small><b>' + v + '</b></div>'; }

    root.querySelector('#copyTrk').addEventListener('click', function () {
      try { navigator.clipboard.writeText(order.tracking); } catch (e) { /* ignora */ }
      R.toast('Código de rastreio copiado: ' + order.tracking);
    });

    var ns = root.querySelector('#nextStage');
    ns.addEventListener('click', function () {
      if (order.stage >= 3) return;
      order.stage++;
      var msg = order.stage === 2
        ? 'Kit ' + order.serial + ' saiu do Hub Campinas na Hardcase Rígida com seguro. Notificação enviada por e-mail e WhatsApp.'
        : 'Kit entregue ao aluno ' + order.name.split(' ')[0] + '. Notificação enviada por e-mail e WhatsApp.';
      order.log.push({ at: Date.now(), text: msg });
      R.save();
      R.toast(order.stage === 2 ? 'Status atualizado: Em Trânsito' : 'Status atualizado: Entregue ao Aluno', { icon: 'bell', type: 'info' });
      R.rerender();
    });

    var bp = root.querySelector('#btnPlan');
    if (bp) bp.addEventListener('click', function () { planModal(order); });
    var bb = root.querySelector('#btnBuy');
    if (bb) bb.addEventListener('click', function () { buyModal(order); });
    root.querySelector('#btnReturn').addEventListener('click', function () { returnModal(order); });
  }

  function subBadge(o) {
    if (o.status === 'pausado') return '<span class="badge s-amber">Pausado</span>';
    if (o.status === 'comprado') return '<span class="badge s-ok">Comprado</span>';
    return '<span class="badge s-ok">Ativo</span>';
  }

  function planModal(order) {
    var pick = order.plan;
    var pause = 1;
    var body = document.createElement('div');
    body.innerHTML =
      '<p class="section-title">Alterar plano</p>' +
      '<div class="grid cols-3">' + Object.keys(R.PLANS).map(function (k) {
        var p = R.PLANS[k];
        return '<button class="plan" data-p="' + k + '" aria-pressed="' + (k === pick) + '"><b>' + p.name + '</b><span class="price" style="font-size:20px">' + R.money(p.price) + '<small>/mês</small></span></button>';
      }).join('') + '</div>' +
      '<p class="small muted mt">A mudança vale a partir da próxima fatura.</p>' +
      '<hr class="divider">' +
      '<p class="section-title">Pausar plano</p>' +
      '<p class="small">Viagem ou provas? Pause sem perder a trilha e o Passaporte. O kit continua com você.</p>' +
      '<div class="chips">' + [1, 2].map(function (m) { return '<button class="opt" data-m="' + m + '" aria-pressed="' + (m === pause) + '">' + m + (m > 1 ? ' meses' : ' mês') + '</button>'; }).join('') + '</div>';
    body.querySelectorAll('[data-p]').forEach(function (b) {
      b.addEventListener('click', function () {
        pick = b.getAttribute('data-p');
        body.querySelectorAll('[data-p]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
    body.querySelectorAll('[data-m]').forEach(function (b) {
      b.addEventListener('click', function () {
        pause = Number(b.getAttribute('data-m'));
        body.querySelectorAll('[data-m]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
    var actions = [{ label: 'Cancelar' }];
    if (order.status === 'pausado') {
      actions.push({ label: 'Reativar agora', kind: 'ok', onClick: function () {
        order.status = 'ativo'; order.pausedUntil = null;
        order.log.push({ at: Date.now(), text: 'Assinatura reativada pelo aluno.' });
        R.save(); R.toast('Assinatura reativada.'); R.rerender();
      } });
    } else {
      actions.push({ label: 'Pausar', kind: 'ghost', icon: 'pause', onClick: function () {
        order.status = 'pausado'; order.pausedUntil = Date.now() + pause * 30 * DAY;
        order.log.push({ at: Date.now(), text: 'Assinatura pausada por ' + pause + (pause > 1 ? ' meses.' : ' mês.') });
        R.save(); R.toast('Plano pausado até ' + R.fmtDate(order.pausedUntil) + '.', { type: 'info' }); R.rerender();
      } });
    }
    actions.push({ label: 'Salvar plano', kind: 'primary', onClick: function () {
      if (pick === order.plan) return;
      order.plan = pick;
      order.log.push({ at: Date.now(), text: 'Plano alterado para ' + R.PLANS[pick].name + ' a partir da próxima fatura.' });
      R.save(); R.toast('Plano alterado para ' + R.PLANS[pick].name + '.'); R.rerender();
    } });
    R.modal({ title: 'Alterar / Pausar Plano', icon: 'calendar', body: body, actions: actions, noFocus: true });
  }

  function buyModal(order) {
    var plan = R.PLANS[order.plan];
    var months = monthsPaid(order);
    var paid = months * plan.price;
    var off = paid * R.CONST.RENT_TO_OWN_RATE;
    var final = Math.max(0, R.CONST.KIT_PRICE_REF - off);
    R.modal({
      title: 'Exercer Compra (Rent to Own)', icon: 'star', noFocus: true,
      body:
        '<p class="small">A guitarra <span class="serial">' + esc(order.serial) + '</span> passa a ser sua, com o afinador e a hardcase.</p>' +
        '<div class="summary-line"><span class="muted">Preço de referência do kit</span><span>' + R.money(R.CONST.KIT_PRICE_REF) + '</span></div>' +
        '<div class="summary-line"><span class="muted">' + months + ' mensalidades pagas (' + plan.name + ')</span><span>' + R.money(paid) + '</span></div>' +
        '<div class="summary-line"><span class="muted">Abatimento de 50%</span><span class="ok-text">− ' + R.money(off) + '</span></div>' +
        '<div class="summary-line total"><span>Valor para comprar</span><span class="price-big" style="font-size:24px">' + R.money(final) + '</span></div>' +
        '<p class="tiny muted">A caução pré autorizada é liberada no mesmo dia.</p>',
      actions: [
        { label: 'Agora não' },
        { label: 'Comprar por ' + R.money(final), kind: 'primary', onClick: function () {
          order.status = 'comprado';
          var inv = R.state.inventory.find(function (i) { return i.serial === order.serial; });
          if (inv) inv.status = 'Vendido (Rent to Own)';
          order.log.push({ at: Date.now(), text: 'Compra definitiva (Rent to Own) concluída por ' + R.money(final) + '.' });
          R.save();
          R.toast('Parabéns! A ' + order.serial + ' agora é sua.', { icon: 'star' });
          R.rerender();
        } }
      ]
    });
  }

  function returnModal(order) {
    var days = [];
    var d = new Date();
    while (days.length < 6) {
      d = new Date(d.getTime() + DAY);
      if (d.getDay() !== 0) days.push(R.isoDay(d));
    }
    var body = document.createElement('div');
    body.innerHTML =
      '<div class="field"><label>Motivo</label><select name="reason">' +
        (order.status === 'comprado'
          ? '<option>Devolver só a hardcase vazia</option>'
          : '<option>Fim do plano: devolver o kit completo</option><option>Devolver só a hardcase vazia</option><option>Trocar de instrumento</option>') +
      '</select></div>' +
      '<div class="field mt"><label>Data da coleta</label><select name="date">' + days.map(function (x) {
        return '<option value="' + x + '">' + new Date(x + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }) + '</option>';
      }).join('') + '</select></div>' +
      '<p class="small muted mt">A transportadora retira o kit na hardcase rígida, com seguro incluso. Você recebe o código de coleta por e-mail e WhatsApp.</p>';
    R.modal({
      title: 'Solicitar Coleta / Devolução', icon: 'box', body: body,
      actions: [
        { label: 'Cancelar' },
        { label: 'Agendar coleta', kind: 'primary', onClick: function () {
          var req = {
            reason: body.querySelector('[name="reason"]').value,
            date: body.querySelector('[name="date"]').value,
            code: 'COL-' + Math.floor(100000 + Math.random() * 899999)
          };
          order.returnReq = req;
          order.log.push({ at: Date.now(), text: 'Logística reversa: coleta agendada para ' + R.fmtDate(req.date) + ' (' + req.reason + ').' });
          R.save();
          R.toast('Coleta agendada. Código ' + req.code + '.');
          R.rerender();
        } }
      ]
    });
  }

  R.register(3, {
    lead: 'Acompanhe o kit do Hub Campinas até sua casa, veja o certificado de regulagem da sua guitarra e gerencie plano, compra e devolução.',
    live: true,
    render: renderTela3
  });

  /* ===============================================================
     TELA 4: Manutenção preventiva e chamado de suporte
     =============================================================== */
  var SLOTS = ['09:00', '10:30', '14:00', '16:30'];
  var SERVICES = ['Troca de cordas', 'Limpeza de escala', 'Ajuste de ação'];
  var MAINT_STEPS = ['Agendado', 'Na Bancada do Luthier', 'Pronto para Devolução'];
  var REASONS = ['Corda rompida', 'Ruído elétrico', 'Dúvida sobre coleta/fatura'];

  function renderTela4(root) {
    var st = R.state;
    var user = R.user();
    var order = R.userOrder();
    var plan = order ? R.PLANS[order.plan] : null;
    var sel = { day: null, slot: null, mode: 'coleta', services: SERVICES.slice() };

    var days = [];
    var d = new Date();
    while (days.length < 14) {
      d = new Date(d.getTime() + DAY);
      days.push(new Date(d));
    }

    var myMaint = st.maintenance.filter(function (m) { return m.email === user.email; });
    var myTickets = st.tickets.filter(function (t) { return t.email === user.email; });

    root.innerHTML =
      '<div class="grid cols-2">' +
        '<div class="stack">' +
          '<div class="card">' +
            '<div class="card-head"><h3>' + R.icon('calendar', 20) + 'Revisão periódica</h3>' +
              (plan && plan.id === 'semestral' ? '<span class="badge s-ok">Inclusa no plano Semestral</span>' : '<span class="badge s-muted">Avulsa na próxima fatura</span>') + '</div>' +
            '<p class="section-title">Serviços</p>' +
            '<div class="chips" id="svc">' + SERVICES.map(function (s) { return '<button class="opt ok" data-svc="' + s + '" aria-pressed="true">' + R.icon('check', 14) + s + '</button>'; }).join('') + '</div>' +
            '<p class="section-title mt-lg">Data</p>' +
            '<div class="days">' + days.map(function (x, i) {
              var off = x.getDay() === 0;
              return '<button class="day" data-day="' + R.isoDay(x) + '"' + (off ? ' disabled title="Hub fechado aos domingos"' : '') + ' aria-pressed="false">' +
                x.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '') + '<b>' + x.getDate() + '</b>' + x.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') + '</button>';
            }).join('') + '</div>' +
            '<p class="section-title mt-lg">Horário</p>' +
            '<div class="chips" id="slots"><span class="small muted">Escolha uma data para ver os horários livres.</span></div>' +
            '<p class="section-title mt-lg">Modalidade de atendimento</p>' +
            '<div class="grid cols-2">' +
              '<button class="plan" data-mode="coleta" aria-pressed="true"><b class="row">' + R.icon('truck', 18) + 'Coleta em casa</b><span class="small muted">Geramos o código de postagem e a transportadora retira na hardcase.</span></button>' +
              '<button class="plan" data-mode="hub" aria-pressed="false"><b class="row">' + R.icon('pin', 18) + 'Entrega no Hub Campinas</b><span class="small muted">Leve o kit pessoalmente e acompanhe a regulagem.</span></button>' +
            '</div>' +
            '<button class="btn btn-primary btn-block btn-lg mt-lg" id="btnSched">' + R.icon('check') + 'Confirmar agendamento</button>' +
          '</div>' +

          '<div class="card">' +
            '<div class="card-head"><h3>' + R.icon('wrench', 20) + 'Meus agendamentos</h3></div>' +
            (myMaint.length
              ? '<div class="list">' + myMaint.slice().reverse().map(function (m) {
                  var idx = MAINT_STEPS.indexOf(m.status);
                  return '<div class="list-item" style="display:grid;gap:8px"><div class="row between wrap"><b>' + esc(m.id) + ' • ' + R.fmtDate(m.date) + ' às ' + esc(m.time) + '</b>' + R.statusBadge(m.status) + '</div>' +
                    '<div class="mini-steps">' + MAINT_STEPS.map(function (s, i) { return '<span class="' + (i < idx ? 'on' : i === idx ? 'cur' : '') + '">' + s + '</span>'; }).join('') + '</div>' +
                    '<span class="small muted">' + esc(m.services.join(', ')) + ' • ' + (m.mode === 'coleta' ? 'Coleta em casa, código <span class="mono">' + esc(m.code) + '</span>' : 'Entrega presencial no Hub Campinas') + '</span></div>';
                }).join('') + '</div>'
              : '<p class="small muted" style="margin:0">Nenhum agendamento ainda. O status aparece aqui: Agendado, Na Bancada do Luthier e Pronto para Devolução.</p>') +
          '</div>' +
        '</div>' +

        '<div class="stack">' +
          '<form class="card" id="fTicket" novalidate>' +
            '<div class="card-head"><h3>' + R.icon('ticket', 20) + 'Abrir Chamado de Suporte / Acionar Assistência</h3></div>' +
            '<div class="field" data-f="reason"><label>Motivo</label><div class="chips">' + REASONS.map(function (r) {
              return '<button type="button" class="opt" data-reason="' + r + '" aria-pressed="false">' + r + '</button>';
            }).join('') + '</div><span class="err"></span></div>' +
            '<div class="field mt" data-f="desc"><label for="tDesc">Descrição</label><textarea id="tDesc" name="desc" maxlength="600" placeholder="Conte o que aconteceu. Ex.: a 1ª corda rompeu durante o exercício de bend."></textarea><span class="err"></span></div>' +
            '<button class="btn btn-primary btn-block mt" type="submit">' + R.icon('send') + 'Enviar Ticket</button>' +
            '<p class="tiny muted center" style="margin:10px 0 0">O chamado vai em tempo real para a fila do Administrador (Tela 10).</p>' +
          '</form>' +

          '<div class="card">' +
            '<div class="card-head"><h3>' + R.icon('chat', 20) + 'Meus chamados</h3></div>' +
            (myTickets.length
              ? '<div class="list">' + myTickets.slice().reverse().map(function (t) {
                  return '<div class="list-item" style="display:grid;gap:6px"><div class="row between wrap"><b>' + esc(t.id) + ' • ' + esc(t.reason) + '</b>' + R.statusBadge(t.status) + '</div>' +
                    '<span class="small">' + esc(t.desc) + '</span><span class="tiny muted">Aberto ' + R.timeAgo(t.createdAt) + '</span>' +
                    t.replies.map(function (r) { return '<div class="reply"><b>Suporte O RIFF:</b> ' + esc(r.text) + '<div class="tiny muted">' + R.timeAgo(r.at) + '</div></div>'; }).join('') +
                    '</div>';
                }).join('') + '</div>'
              : '<p class="small muted" style="margin:0">Você não tem chamados abertos.</p>') +
          '</div>' +
        '</div>' +
      '</div>';

    /* Serviços */
    root.querySelectorAll('[data-svc]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = b.getAttribute('data-svc');
        var i = sel.services.indexOf(s);
        if (i >= 0) sel.services.splice(i, 1); else sel.services.push(s);
        b.setAttribute('aria-pressed', String(i < 0));
      });
    });

    /* Datas e horários */
    root.querySelectorAll('[data-day]').forEach(function (b) {
      b.addEventListener('click', function () {
        sel.day = b.getAttribute('data-day');
        sel.slot = null;
        root.querySelectorAll('[data-day]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        drawSlots();
      });
    });
    function drawSlots() {
      var dayN = Number(sel.day.slice(8));
      var taken = st.maintenance.filter(function (m) { return m.date === sel.day; }).map(function (m) { return m.time; });
      var box = root.querySelector('#slots');
      box.innerHTML = SLOTS.map(function (s, i) {
        var busy = (dayN + i) % 3 === 0 || taken.indexOf(s) >= 0;
        return '<button class="opt" data-slot="' + s + '"' + (busy ? ' disabled style="opacity:.35;cursor:not-allowed" title="Ocupado"' : '') + ' aria-pressed="false">' + R.icon('clock', 14) + s + (busy ? ' (ocupado)' : '') + '</button>';
      }).join('');
      box.querySelectorAll('[data-slot]:not([disabled])').forEach(function (b) {
        b.addEventListener('click', function () {
          sel.slot = b.getAttribute('data-slot');
          box.querySelectorAll('[data-slot]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        });
      });
    }

    root.querySelectorAll('[data-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        sel.mode = b.getAttribute('data-mode');
        root.querySelectorAll('[data-mode]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });

    root.querySelector('#btnSched').addEventListener('click', function () {
      if (!sel.services.length) return R.toast('Escolha pelo menos um serviço.', { type: 'warn' });
      if (!sel.day) return R.toast('Escolha a data da revisão.', { type: 'warn' });
      if (!sel.slot) return R.toast('Escolha um horário livre.', { type: 'warn' });
      var m = {
        id: 'MN-' + st.nextMaint++, email: user.email, name: user.name, serial: order && order.serial,
        date: sel.day, time: sel.slot, mode: sel.mode, services: sel.services.slice(),
        code: sel.mode === 'coleta' ? 'POST-' + Math.floor(100000 + Math.random() * 899999) : 'Hub Campinas',
        status: 'Agendado', createdAt: Date.now()
      };
      st.maintenance.push(m);
      R.save();
      R.modal({
        title: 'Revisão agendada', icon: 'check', noFocus: true,
        body: '<dl class="kv"><dt>Protocolo</dt><dd>' + m.id + '</dd><dt>Quando</dt><dd>' + R.fmtDate(m.date) + ' às ' + m.time + '</dd>' +
          '<dt>Serviços</dt><dd>' + esc(m.services.join(', ')) + '</dd><dt>Modalidade</dt><dd>' +
          (m.mode === 'coleta' ? 'Coleta em casa<br><span class="mono">Código de postagem: ' + m.code + '</span>' : 'Entrega presencial no Hub Campinas') + '</dd></dl>' +
          '<p class="small muted mt">O agendamento já está na central do Administrador (Tela 10), que atualiza o status quando o kit chega à bancada.</p>',
        actions: [{ label: 'Ver na Tela 10 (Admin)', onClick: function () { R.go(10); } }, { label: 'Fechar', kind: 'primary' }],
        onClose: function () { if (R.current() === 4) R.rerender(); }
      });
    });

    /* Ticket */
    var reason = null;
    root.querySelectorAll('[data-reason]').forEach(function (b) {
      b.addEventListener('click', function () {
        reason = b.getAttribute('data-reason');
        root.querySelectorAll('[data-reason]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        setErr('reason', '');
      });
    });
    function setErr(name, msg) {
      var f = root.querySelector('[data-f="' + name + '"]');
      f.classList.toggle('invalid', !!msg);
      f.querySelector('.err').textContent = msg || '';
    }
    root.querySelector('#fTicket').addEventListener('submit', function (e) {
      e.preventDefault();
      var desc = root.querySelector('#tDesc').value.trim();
      setErr('reason', reason ? '' : 'Escolha o motivo.');
      setErr('desc', desc.length >= 10 ? '' : 'Descreva com pelo menos 10 caracteres.');
      if (!reason || desc.length < 10) return;
      var t = { id: 'TK-' + st.nextTicket++, email: user.email, name: user.name, reason: reason, desc: desc, status: 'Aberto', createdAt: Date.now(), replies: [], serial: order && order.serial };
      st.tickets.push(t);
      R.save();
      R.toast('Ticket ' + t.id + ' enviado para a fila do Administrador.', { action: { label: 'Ver na Tela 10', go: 10 } });
      R.rerender();
    });
  }

  R.register(4, {
    lead: 'Agende a revisão periódica (cordas, limpeza de escala e ação) com coleta em casa ou no Hub Campinas, e abra chamados que chegam na hora para o suporte.',
    live: true,
    render: renderTela4
  });

  /* ===============================================================
     TELA 5: Afinador, Trilha Gamificada e Player Tudo em Um
     =============================================================== */
  var STRINGS = [
    { n: 6, note: 'E2', f: 82.41 }, { n: 5, note: 'A2', f: 110.0 }, { n: 4, note: 'D3', f: 146.83 },
    { n: 3, note: 'G3', f: 196.0 }, { n: 2, note: 'B3', f: 246.94 }, { n: 1, note: 'E4', f: 329.63 }
  ];
  var OPEN = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63]; // 6ª até 1ª
  var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  var CHORDS = {
    Em: [0, 2, 2, 0, 0, 0], Am: ['x', 0, 2, 2, 1, 0], C: ['x', 3, 2, 0, 1, 0],
    G: [3, 2, 0, 0, 0, 3], D: ['x', 'x', 0, 2, 3, 2], E5: [0, 2, 2, 'x', 'x', 'x'], A5: ['x', 0, 2, 2, 'x', 'x']
  };

  /* Conteúdo das aulas (exercícios autorais do O RIFF) */
  var LESSON_CONTENT = {
    'acordes-abertos': { bpm: 60, chords: ['Em', 'Am', 'C', 'G', 'D'], steps: ['Posicione o polegar atrás do braço, na altura do 2º traste.', 'Monte o Em: dedos 2 e 3 no 2º traste das cordas 5 e 4.', 'Toque corda por corda e confira se todas soam limpas.', 'Agora passe por Am, C, G e D, 4 tempos em cada um.'] },
    'troca-em-g': { bpm: 60, chords: ['Em', 'G'], steps: ['Deixe o dedo 3 como pivô entre os dois acordes.', 'Troque de Em para G no tempo 4, sem parar a mão direita.', 'Faça 8 trocas a 60 BPM no metrônomo.', 'Quando sair limpo, suba para 70 e depois 80 BPM.'] },
    'primeiro-riff': { bpm: 70, chords: ['E5', 'A5'], tab: 'e|--------------------------------|\nB|--------------------------------|\nG|--------------------------------|\nD|-------------------2---2--------|\nA|-----2---2---4-----2---2---0----|\nE|-----0---0---2-----0---0--------|', steps: ['Power chord: só duas cordas, dedo 1 e dedo 3.', 'Abafe as outras cordas com a lateral da mão direita.', 'Toque o riff da tablatura em colcheias a 70 BPM.', 'Repita 4 vezes e grave um vídeo para o Feed!'] },
    'batida-pop': { bpm: 70, chords: ['C', 'G', 'Am', 'Em'], tab: 'Batida:  ↓   ↓   ↑   ↑   ↓   ↑\nContagem: 1   2   e   3   e   4  e', steps: ['Mão direita sempre em movimento, para baixo e para cima.', 'Toque a batida no Em abafado, só ritmo.', 'Aplique na sequência C, G, Am, Em.', 'Mantenha 70 BPM por 2 minutos sem parar.'] },
    'power-chords': { bpm: 80, chords: ['E5', 'A5'], tab: 'D|---------2---4---2-------|\nA|---2---2-2---4---2---0---|\nE|---0---0-----2-------0---|', steps: ['Shape móvel: mesma forma em qualquer casa.', 'Deslize o shape mantendo a pressão leve.', 'Use palhetadas só para baixo.', 'Acelere de 80 para 100 BPM.'] },
    pentatonica: { bpm: 70, chords: ['Am'], tab: 'e|-------------------5-8-|\nB|---------------5-8-----|\nG|-----------5-7---------|\nD|-------5-7-------------|\nA|---5-7-----------------|\nE|-5-8-------------------|', steps: ['Desenho 1 da pentatônica de Lá menor, casa 5.', 'Um dedo por casa: dedo 1 na 5ª, dedo 3 ou 4 na 7ª e 8ª.', 'Suba e desça devagar com palhetada alternada.', 'Improvise sobre o Am com 3 notas apenas.'] },
    bends: { bpm: 60, chords: ['Am'], tab: 'B|---8b10---8b10r8---5----|\nG|----------------------7-|', steps: ['Empurre a corda com 3 dedos juntos.', 'Ligue o afinador: o bend precisa chegar na nota alvo.', 'Adicione vibrato no final da nota.', 'Combine bend e vibrato numa frase curta.'] }
  };

  var tuner = { stream: null, ctx: null, analyser: null, raf: 0, buf: null, smooth: null };
  var metro = { timer: 0, next: 0, beat: 0, bpm: 60, on: false };
  var videoTimer = 0;

  function stopMic() {
    if (tuner.raf) cancelAnimationFrame(tuner.raf);
    tuner.raf = 0;
    if (tuner.stream) tuner.stream.getTracks().forEach(function (t) { t.stop(); });
    tuner.stream = null;
    tuner.analyser = null;
    tuner.smooth = null;
  }
  function stopMetro() {
    metro.on = false;
    clearInterval(metro.timer);
    metro.timer = 0;
  }
  function stopAll() {
    stopMic();
    stopMetro();
    clearInterval(videoTimer);
  }

  function detectPitch(buf, sr) {
    var n = buf.length, rms = 0, i, j, lag;
    for (i = 0; i < n; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / n);
    if (rms < 0.012) return null;
    var minLag = Math.floor(sr / 1000), maxLag = Math.min(Math.floor(sr / 65), n - 2);
    var corr = new Float32Array(maxLag + 2);
    for (lag = minLag; lag <= maxLag + 1; lag++) {
      var s = 0;
      for (j = 0; j < n - lag; j++) s += buf[j] * buf[j + lag];
      corr[lag] = s / (n - lag);
    }
    var dd = minLag;
    while (dd < maxLag && corr[dd] > corr[dd + 1]) dd++;
    var best = -Infinity, bestLag = -1;
    for (lag = dd; lag <= maxLag; lag++) if (corr[lag] > best) { best = corr[lag]; bestLag = lag; }
    if (bestLag < 1 || best / (rms * rms) < 0.6) return null;
    var x1 = corr[bestLag - 1], x2 = corr[bestLag], x3 = corr[bestLag + 1];
    var a = (x1 + x3 - 2 * x2) / 2, b = (x3 - x1) / 2;
    var T = a ? bestLag - b / (2 * a) : bestLag;
    return sr / T;
  }

  function noteName(f) {
    var m = Math.round(12 * Math.log2(f / 440) + 69);
    return NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  }

  function pluck(freq, when, vol) {
    var ctx = R.audioCtx();
    if (!ctx) return;
    var sr = ctx.sampleRate, N = Math.floor(sr * 1.6);
    var buffer = ctx.createBuffer(1, N, sr), d = buffer.getChannelData(0);
    var period = Math.max(2, Math.round(sr / freq)), ring = new Float32Array(period), idx = 0, i;
    for (i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
    for (i = 0; i < N; i++) {
      var nx = (idx + 1) % period;
      var v = ring[idx];
      ring[idx] = 0.996 * 0.5 * (ring[idx] + ring[nx]);
      d[i] = v;
      idx = nx;
    }
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var g = ctx.createGain();
    g.gain.value = vol || 0.32;
    src.connect(g);
    g.connect(ctx.destination);
    src.start(when || ctx.currentTime);
  }

  function refTone(freq) {
    var ctx = R.audioCtx();
    if (!ctx) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 1.7);
  }

  function renderTela5(root) {
    var user = R.user();
    var lr = R.learning();
    var sel = 0;
    var simHz = STRINGS[0].f - 4.2;
    var path = R.aiPath(user);
    var recIds = path.filter(function (p) { return lr.done.indexOf(p.lesson.id) < 0; }).slice(0, 3).map(function (p) { return p.lesson.id; });
    var level = Math.floor(lr.xp / 200) + 1;
    var inLevel = lr.xp % 200;
    var minutes = user.quiz && user.quiz.minutes != null ? R.MINUTES[user.quiz.minutes] : '20 min';

    /* Ponteiro do afinador: arco de -50 a +50 cents */
    var ticks = '';
    for (var c = -50; c <= 50; c += 10) {
      var ang = (c / 50) * 60 * Math.PI / 180;
      var r1 = c === 0 ? 112 : 118, r2 = 130;
      ticks += '<line x1="' + (180 + r1 * Math.sin(ang)).toFixed(1) + '" y1="' + (150 - r1 * Math.cos(ang)).toFixed(1) + '" x2="' + (180 + r2 * Math.sin(ang)).toFixed(1) + '" y2="' + (150 - r2 * Math.cos(ang)).toFixed(1) + '" stroke="' + (c === 0 ? '#10B981' : '#4a5060') + '" stroke-width="' + (c === 0 ? 3 : 2) + '"/>';
    }
    function arc(a0, a1, r) {
      var p0 = [180 + r * Math.sin(a0), 150 - r * Math.cos(a0)], p1 = [180 + r * Math.sin(a1), 150 - r * Math.cos(a1)];
      return 'M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' A' + r + ' ' + r + ' 0 0 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1);
    }
    var okA = (5 / 50) * 60 * Math.PI / 180;

    root.innerHTML =
      '<div class="grid cols-2">' +
        '<div class="card tuner">' +
          '<div class="card-head"><h3>' + R.icon('mic', 20) + 'Afinador Digital</h3><span class="badge s-muted" id="micState">Modo simulador</span></div>' +
          '<button class="btn btn-ok btn-block" id="btnMic">' + R.icon('mic') + 'Ativar Microfone do Dispositivo</button>' +
          '<p class="tiny muted" style="margin:8px 0 14px">Web Audio API com detecção de frequência em tempo real. Sem microfone? Use o simulador em Hz abaixo.</p>' +
          '<div class="strings">' + STRINGS.map(function (s, i) {
            return '<button class="string-btn" data-s="' + i + '" aria-pressed="' + (i === sel) + '"><b>' + s.note + '</b><small>' + s.n + 'ª • ' + String(s.f).replace('.', ',') + ' Hz</small></button>';
          }).join('') + '</div>' +
          '<div class="gauge"><svg viewBox="0 0 360 160" aria-hidden="true">' +
            '<path d="' + arc(-Math.PI / 3, Math.PI / 3, 124) + '" stroke="#22262f" stroke-width="16" fill="none" stroke-linecap="round"/>' +
            '<path d="' + arc(-okA, okA, 124) + '" stroke="rgba(16,185,129,.55)" stroke-width="16" fill="none"/>' +
            ticks +
            '<text x="40" y="150" fill="#5b9cf5" font-size="12" font-family="Inter, sans-serif">grave</text>' +
            '<text x="292" y="150" fill="#ef5a5a" font-size="12" font-family="Inter, sans-serif">agudo</text>' +
            '<g id="needle" transform="rotate(0 180 150)"><line x1="180" y1="150" x2="180" y2="34" stroke="#E58E26" stroke-width="4" stroke-linecap="round"/></g>' +
            '<circle cx="180" cy="150" r="9" fill="#E58E26"/>' +
          '</svg></div>' +
          '<div class="tuner-read" id="tRead">--</div>' +
          '<div class="small muted" id="tSub">&nbsp;</div>' +
          '<div class="tuner-state"><span data-st="low">Abaixo (Grave)</span><span data-st="ok">Afinada (Perfeita)</span><span data-st="high">Acima (Agudo)</span></div>' +
          '<div class="field mt-lg" style="text-align:left"><label for="sim">Simulador interativo (Hz): <b id="simV"></b></label><input type="range" id="sim" step="0.1"></div>' +
          '<button class="btn btn-ghost btn-sm mt" id="btnRef">' + R.icon('headphones', 15) + 'Ouvir nota de referência</button>' +
        '</div>' +

        '<div class="stack">' +
          '<div class="card">' +
            '<div class="card-head"><h3>' + R.icon('sparkle', 20) + 'Trilha gamificada com IA</h3><span class="tag">' + esc(user.level || 'Iniciante') + '</span></div>' +
            '<div class="xp-head">' +
              '<span class="stat">' + R.icon('star', 18) + 'Nível ' + level + '</span>' +
              '<span class="stat">' + lr.xp + ' XP</span>' +
              '<span class="stat fire">' + R.icon('fire', 18) + 'Ofensiva de ' + lr.streak + (lr.streak === 1 ? ' dia' : ' dias') + '</span>' +
              '<span class="stat">' + R.icon('clock', 18) + 'Meta: ' + minutes + '/dia</span>' +
            '</div>' +
            '<div class="row between small mt"><span class="muted">Progresso para o nível ' + (level + 1) + '</span><span>' + inLevel + ' / 200 XP</span></div>' +
            '<div class="progress mt" style="margin-top:6px"><span style="width:' + (inLevel / 2) + '%"></span></div>' +
          '</div>' +
          '<div class="card">' +
            '<div class="card-head"><h3>' + R.icon('music', 20) + 'Lições recomendadas pela IA</h3></div>' +
            '<div class="list">' + path.map(function (p) {
              var done = lr.done.indexOf(p.lesson.id) >= 0;
              var rec = recIds.indexOf(p.lesson.id) >= 0;
              return '<button class="lesson' + (done ? ' done' : '') + (rec ? ' rec' : '') + '" data-lesson="' + p.lesson.id + '" style="text-align:left;cursor:pointer;color:inherit;width:100%">' +
                '<span class="lesson-ic">' + R.icon(done ? 'check' : rec ? 'sparkle' : 'play', 20) + '</span>' +
                '<span class="grow"><b>' + esc(p.lesson.title) + '</b><br><span class="small muted">' + esc(p.lesson.desc) + ' • ' + p.lesson.min + ' min</span>' +
                (rec ? '<br><span class="tiny" style="color:#6ff0c0">' + R.icon('sparkle', 12) + ' ' + esc(p.reason) + '</span>' : '') + '</span>' +
                (done ? '<span class="badge s-ok">Concluída</span>' : '<span class="badge s-amber">+50 XP</span>') +
                '</button>';
            }).join('') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var needle = root.querySelector('#needle');
    var sim = root.querySelector('#sim');

    function setString(i) {
      sel = i;
      root.querySelectorAll('[data-s]').forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.getAttribute('data-s')) === i)); });
      var f = STRINGS[i].f;
      sim.min = (f - 15).toFixed(1);
      sim.max = (f + 15).toFixed(1);
      simHz = Math.round((f - 4.2) * 10) / 10;
      sim.value = simHz;
      if (!tuner.stream) show(simHz);
    }

    function show(hz) {
      var target = STRINGS[sel].f;
      var stEl = root.querySelectorAll('[data-st]');
      if (!hz) {
        root.querySelector('#tRead').textContent = '--';
        root.querySelector('#tSub').textContent = 'Toque a corda ' + STRINGS[sel].n + 'ª (' + STRINGS[sel].note + ') perto do microfone';
        stEl.forEach(function (s) { s.className = ''; });
        needle.setAttribute('transform', 'rotate(0 180 150)');
        return;
      }
      var cents = 1200 * Math.log2(hz / target);
      var clamped = Math.max(-50, Math.min(50, cents));
      needle.setAttribute('transform', 'rotate(' + (clamped / 50 * 60).toFixed(2) + ' 180 150)');
      root.querySelector('#tRead').textContent = hz.toFixed(1).replace('.', ',') + ' Hz';
      root.querySelector('#tSub').textContent = 'Nota ' + noteName(hz) + ' • alvo ' + STRINGS[sel].note + ' (' + String(target).replace('.', ',') + ' Hz) • ' + (cents > 0 ? '+' : '') + Math.round(cents) + ' cents';
      var state = Math.abs(cents) <= 5 ? 'ok' : cents < 0 ? 'low' : 'high';
      stEl.forEach(function (s) {
        var k = s.getAttribute('data-st');
        s.className = k === state ? 'on ' + k : '';
      });
      root.querySelector('#simV').textContent = tuner.stream ? '(microfone ativo)' : Number(sim.value).toFixed(1).replace('.', ',') + ' Hz';
    }

    root.querySelectorAll('[data-s]').forEach(function (b) {
      b.addEventListener('click', function () { setString(Number(b.getAttribute('data-s'))); });
    });
    sim.addEventListener('input', function () {
      simHz = Number(sim.value);
      if (!tuner.stream) show(simHz);
    });
    root.querySelector('#btnRef').addEventListener('click', function () { refTone(STRINGS[sel].f); });

    var btnMic = root.querySelector('#btnMic');
    btnMic.addEventListener('click', function () {
      if (tuner.stream) {
        stopMic();
        btnMic.innerHTML = R.icon('mic') + 'Ativar Microfone do Dispositivo';
        root.querySelector('#micState').className = 'badge s-muted';
        root.querySelector('#micState').textContent = 'Modo simulador';
        show(simHz);
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        R.toast('Este navegador não libera o microfone aqui. Use o simulador em Hz.', { type: 'warn' });
        return;
      }
      navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
        .then(function (stream) {
          var ctx = R.audioCtx();
          tuner.stream = stream;
          tuner.analyser = ctx.createAnalyser();
          tuner.analyser.fftSize = 2048;
          ctx.createMediaStreamSource(stream).connect(tuner.analyser);
          tuner.buf = new Float32Array(tuner.analyser.fftSize);
          btnMic.innerHTML = R.icon('micoff') + 'Desligar microfone';
          root.querySelector('#micState').className = 'badge s-ok';
          root.querySelector('#micState').textContent = 'Microfone ativo';
          var frame = 0;
          (function loop() {
            tuner.raf = requestAnimationFrame(loop);
            if (++frame % 3) return;
            tuner.analyser.getFloatTimeDomainData(tuner.buf);
            var hz = detectPitch(tuner.buf, ctx.sampleRate);
            if (hz && hz > 60 && hz < 1000) {
              tuner.smooth = tuner.smooth ? tuner.smooth * 0.7 + hz * 0.3 : hz;
              if (Math.abs(hz - tuner.smooth) > tuner.smooth * 0.08) tuner.smooth = hz;
              show(tuner.smooth);
            }
          })();
        })
        .catch(function () {
          R.toast('Permissão de microfone negada. O simulador em Hz continua disponível.', { type: 'warn' });
        });
    });

    root.querySelectorAll('[data-lesson]').forEach(function (b) {
      b.addEventListener('click', function () { openPlayer(b.getAttribute('data-lesson')); });
    });

    setString(0);
  }

  /* ---------- Player de Aula Tudo em Um ---------- */
  function chordSVG(name) {
    var shape = CHORDS[name];
    var w = 220, h = 218, x0 = 30, y0 = 34, sx = 32, sy = 32;
    var s = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Diagrama do acorde ' + name + '">';
    s += '<rect x="' + x0 + '" y="' + (y0 - 4) + '" width="' + sx * 5 + '" height="5" fill="#f1e5c8"/>';
    for (var f = 1; f <= 5; f++) s += '<line x1="' + x0 + '" x2="' + (x0 + sx * 5) + '" y1="' + (y0 + f * sy) + '" y2="' + (y0 + f * sy) + '" stroke="#b9b2a3" stroke-width="1.5"/>';
    for (var i = 0; i < 6; i++) {
      var x = x0 + i * sx;
      s += '<line x1="' + x + '" x2="' + x + '" y1="' + y0 + '" y2="' + (y0 + sy * 5) + '" stroke="#e9e4da" stroke-width="' + (2.4 - i * 0.3).toFixed(1) + '"/>';
      var v = shape[i];
      if (v === 'x') s += '<text x="' + x + '" y="' + (y0 - 12) + '" fill="#ef5a5a" font-size="15" text-anchor="middle" font-family="Inter">×</text>';
      else if (v === 0) s += '<g class="fret-dot" data-str="' + i + '" data-fret="0"><circle cx="' + x + '" cy="' + (y0 - 16) + '" r="8" fill="rgba(16,185,129,.15)" stroke="#10B981" stroke-width="2"/></g>';
      else s += '<g class="fret-dot" data-str="' + i + '" data-fret="' + v + '"><circle cx="' + x + '" cy="' + (y0 + v * sy - sy / 2) + '" r="11" fill="#E58E26"/><text x="' + x + '" y="' + (y0 + v * sy - sy / 2 + 4.5) + '" fill="#1a1209" font-size="12" font-weight="700" text-anchor="middle" font-family="Inter" pointer-events="none">' + v + '</text></g>';
    }
    ['6ª', '5ª', '4ª', '3ª', '2ª', '1ª'].forEach(function (lab, i) {
      s += '<text x="' + (x0 + i * sx) + '" y="' + (h - 6) + '" fill="#8d93a1" font-size="10" text-anchor="middle" font-family="Inter">' + lab + '</text>';
    });
    return s + '</svg>';
  }

  function openPlayer(id) {
    var lesson = R.LESSONS.find(function (l) { return l.id === id; });
    var content = LESSON_CONTENT[id];
    var lr = R.learning();
    var chord = content.chords[0];
    var playing = false, t = 0, dur = 48;
    metro.bpm = content.bpm;

    var body = document.createElement('div');
    body.innerHTML =
      '<div class="player">' +
        '<div class="stack" style="gap:14px">' +
          '<div class="video" id="vid">' +
            '<canvas id="vcan" width="640" height="360"></canvas>' +
            '<div class="video-caption" id="vcap">Clique em play para começar a aula</div>' +
            '<div class="video-bar"><button class="icon-btn" id="vplay" aria-label="Play">' + R.icon('play') + '</button>' +
              '<div class="progress"><span id="vprog" style="width:0%"></span></div><span class="tiny mono" id="vtime">0:00 / 0:48</span></div>' +
          '</div>' +
          '<div class="card inner">' +
            '<div class="row between wrap"><b class="row">' + R.icon('clock', 18) + 'Metrônomo</b><div class="beats" id="beats"><i></i><i></i><i></i><i></i></div></div>' +
            '<div class="row between wrap mt">' +
              '<div class="row"><button class="icon-btn" id="bpmDown" aria-label="Diminuir BPM">−</button><span class="bpm" id="bpmV">' + metro.bpm + '</span><button class="icon-btn" id="bpmUp" aria-label="Aumentar BPM">+</button><span class="small muted">BPM</span></div>' +
              '<button class="btn btn-ghost" id="metroBtn">' + R.icon('play', 15) + 'Iniciar</button>' +
            '</div>' +
            '<input type="range" id="bpmR" min="40" max="200" value="' + metro.bpm + '" class="mt">' +
          '</div>' +
        '</div>' +
        '<div class="stack" style="gap:14px">' +
          '<div class="card inner">' +
            '<div class="row between wrap"><b class="row">' + R.icon('guitar', 18) + 'Diagrama interativo do braço</b>' +
              '<div class="chips">' + content.chords.map(function (c) { return '<button class="opt" data-ch="' + c + '" aria-pressed="' + (c === chord) + '">' + c + '</button>'; }).join('') + '</div></div>' +
            '<div class="fretboard mt" id="fb"></div>' +
            '<div class="row between mt"><span class="tiny muted">Toque nas bolinhas para ouvir cada nota</span><button class="btn btn-ghost btn-sm" id="strum">' + R.icon('music', 15) + 'Tocar acorde</button></div>' +
          '</div>' +
          (content.tab ? '<div><p class="section-title">Tablatura</p><div class="tab-text">' + esc(content.tab) + '</div></div>' : '') +
          '<div><p class="section-title">Passo a passo</p><ol class="small" style="margin:0;padding-left:18px;display:grid;gap:4px">' + content.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>' +
        '</div>' +
      '</div>';

    var done = lr.done.indexOf(id) >= 0;
    var m = R.modal({
      title: lesson.title + ' • Player de Aula Tudo em Um', icon: 'play', wide: true, body: body, noFocus: true,
      actions: [
        { label: 'Fechar' },
        { label: done ? 'Refazer e ganhar +50 XP' : 'Concluir Aula (+50 XP)', kind: 'ok', icon: 'check', onClick: function () { complete(); } }
      ],
      onClose: function () { stopMetro(); clearInterval(videoTimer); cancelAnimationFrame(anim); }
    });

    /* Vídeo do instrutor (simulado em canvas) */
    var can = body.querySelector('#vcan'), g = can.getContext('2d'), anim = 0;
    function drawVideo() {
      var W = can.width, H = can.height, tt = performance.now() / 1000;
      g.clearRect(0, 0, W, H);
      var grd = g.createLinearGradient(0, 0, W, H);
      grd.addColorStop(0, '#20180f'); grd.addColorStop(1, '#0b0c10');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(229,142,38,.18)';
      g.beginPath(); g.arc(W * 0.32, H * 0.45, 120 + (playing ? Math.sin(tt * 2) * 6 : 0), 0, Math.PI * 2); g.fill();
      // braço da guitarra em perspectiva
      g.save(); g.translate(W * 0.18, H * 0.68); g.rotate(-0.22);
      g.fillStyle = '#3a2418'; g.fillRect(0, -22, W * 0.75, 44);
      g.strokeStyle = '#cfc8b8'; g.lineWidth = 2;
      for (var f = 1; f < 12; f++) { var fx = W * 0.75 * (1 - Math.pow(2, -f / 12)) * 1.35; g.beginPath(); g.moveTo(fx, -22); g.lineTo(fx, 22); g.stroke(); }
      for (var s = 0; s < 6; s++) {
        g.strokeStyle = 'rgba(233,228,218,.8)'; g.lineWidth = 1 + (5 - s) * 0.25;
        var vib = playing ? Math.sin(tt * 40 + s) * (s === Math.floor(tt) % 6 ? 1.6 : 0.3) : 0;
        g.beginPath(); g.moveTo(0, -18 + s * 7.2 + vib); g.lineTo(W * 0.75, -18 + s * 7.2 - vib); g.stroke();
      }
      g.restore();
      g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '600 18px Inter, sans-serif';
      g.fillText('Instrutor O RIFF • ' + lesson.title, 22, 34);
      g.fillStyle = playing ? '#ef5a5a' : '#8d93a1'; g.beginPath(); g.arc(W - 30, 28, 6, 0, Math.PI * 2); g.fill();
      if (!playing) {
        g.fillStyle = 'rgba(229,142,38,.95)'; g.beginPath(); g.arc(W / 2, H / 2 - 20, 34, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#1a1209'; g.beginPath(); g.moveTo(W / 2 - 10, H / 2 - 38); g.lineTo(W / 2 - 10, H / 2 - 2); g.lineTo(W / 2 + 18, H / 2 - 20); g.fill();
      }
      anim = requestAnimationFrame(drawVideo);
    }
    drawVideo();

    function fmt(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
    function togglePlay() {
      playing = !playing;
      body.querySelector('#vplay').innerHTML = R.icon(playing ? 'pause' : 'play');
      clearInterval(videoTimer);
      if (playing) {
        videoTimer = setInterval(function () {
          t = Math.min(dur, t + 0.25);
          body.querySelector('#vprog').style.width = (t / dur * 100) + '%';
          body.querySelector('#vtime').textContent = fmt(t) + ' / ' + fmt(dur);
          body.querySelector('#vcap').textContent = content.steps[Math.min(content.steps.length - 1, Math.floor(t / (dur / content.steps.length)))];
          if (t >= dur) { togglePlay(); t = 0; body.querySelector('#vcap').textContent = 'Aula assistida! Pratique com o metrônomo e conclua para ganhar XP.'; }
        }, 250);
      }
    }
    body.querySelector('#vplay').addEventListener('click', togglePlay);
    can.addEventListener('click', togglePlay);

    /* Diagrama interativo */
    function drawChord() {
      var fb = body.querySelector('#fb');
      fb.innerHTML = chordSVG(chord);
      fb.querySelectorAll('.fret-dot').forEach(function (dot) {
        dot.addEventListener('click', function () {
          var si = Number(dot.getAttribute('data-str')), fr = Number(dot.getAttribute('data-fret'));
          pluck(OPEN[si] * Math.pow(2, fr / 12));
        });
      });
    }
    body.querySelectorAll('[data-ch]').forEach(function (b) {
      b.addEventListener('click', function () {
        chord = b.getAttribute('data-ch');
        body.querySelectorAll('[data-ch]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        drawChord();
      });
    });
    body.querySelector('#strum').addEventListener('click', function () {
      var ctx = R.audioCtx();
      if (!ctx) return;
      CHORDS[chord].forEach(function (v, i) {
        if (v !== 'x') pluck(OPEN[i] * Math.pow(2, v / 12), ctx.currentTime + i * 0.035, 0.22);
      });
    });
    drawChord();

    /* Metrônomo (agendamento preciso com Web Audio) */
    var beats = body.querySelectorAll('#beats i');
    function setBpm(v) {
      metro.bpm = Math.max(40, Math.min(200, v));
      body.querySelector('#bpmV').textContent = metro.bpm;
      body.querySelector('#bpmR').value = metro.bpm;
    }
    body.querySelector('#bpmDown').addEventListener('click', function () { setBpm(metro.bpm - 5); });
    body.querySelector('#bpmUp').addEventListener('click', function () { setBpm(metro.bpm + 5); });
    body.querySelector('#bpmR').addEventListener('input', function () { setBpm(Number(this.value)); });
    var mb = body.querySelector('#metroBtn');
    mb.addEventListener('click', function () {
      if (metro.on) {
        stopMetro();
        mb.innerHTML = R.icon('play', 15) + 'Iniciar';
        beats.forEach(function (b) { b.className = ''; });
        return;
      }
      var ctx = R.audioCtx();
      if (!ctx) return R.toast('Áudio indisponível neste navegador.', { type: 'warn' });
      metro.on = true;
      metro.beat = 0;
      metro.next = ctx.currentTime + 0.08;
      mb.innerHTML = R.icon('pause', 15) + 'Parar';
      metro.timer = setInterval(function () {
        while (metro.next < ctx.currentTime + 0.12) {
          var b = metro.beat % 4, when = metro.next;
          var o = ctx.createOscillator(), gg = ctx.createGain();
          o.frequency.value = b === 0 ? 1500 : 1000;
          gg.gain.setValueAtTime(0.3, when);
          gg.gain.exponentialRampToValueAtTime(0.001, when + 0.05);
          o.connect(gg); gg.connect(ctx.destination);
          o.start(when); o.stop(when + 0.06);
          (function (bb, w) {
            setTimeout(function () {
              beats.forEach(function (el, i) { el.className = i === bb ? 'on' + (bb === 0 ? ' acc' : '') : ''; });
            }, Math.max(0, (w - ctx.currentTime) * 1000));
          })(b, when);
          metro.next += 60 / metro.bpm;
          metro.beat++;
        }
      }, 25);
    });

    function complete() {
      var before = Math.floor(lr.xp / 200) + 1;
      lr.xp += 50;
      if (lr.done.indexOf(id) < 0) lr.done.push(id);
      var today = R.isoDay();
      var yesterday = R.isoDay(new Date(Date.now() - DAY));
      if (lr.lastDay !== today) lr.streak = lr.lastDay === yesterday ? lr.streak + 1 : 1;
      lr.lastDay = today;
      R.save();
      var after = Math.floor(lr.xp / 200) + 1;
      R.toast(after > before ? 'Subiu para o nível ' + after + '! +50 XP' : 'Aula concluída: +50 XP. Ofensiva de ' + lr.streak + (lr.streak === 1 ? ' dia.' : ' dias.'), { icon: 'star' });
      setTimeout(function () { if (R.current() === 5) R.rerender(); }, 180);
    }
  }

  R.register(5, {
    lead: 'Tudo em um só lugar: afinador com microfone, trilha estilo Duolingo montada pela IA e player que junta vídeo, diagrama do braço e metrônomo, sem pular entre YouTube, app de cifras e afinador.',
    render: renderTela5,
    leave: stopAll
  });
})();
