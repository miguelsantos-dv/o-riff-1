/* =====================================================================
   O RIFF | Módulo 4: Painel do Luthier e Backoffice do Administrador
   Arquivo: modulo4-backoffice-luthier.js
   Responsável: Mateus de Moraes Soares (Grupo 8)

   Tela 8  (US #04): Dashboard das 4 fontes de receita e inventário serializado
   Tela 9  (US #07): Laudo técnico de regulagem (visão luthier)
   Tela 10 (US #10): Central de tickets de suporte e moderação de denúncias

   Integrações:
   • Tela 8 soma em tempo real os pedidos do checkout (Tela 2), os cliques
     no post patrocinado (Tela 7) e reage ao laudo da Tela 9
   • Tela 9 muda o kit de Em Manutenção para Disponível, remove o alerta de
     estoque baixo e atualiza o Passaporte do aluno (Tela 3)
   • Tela 10 responde tickets da Tela 4 e oculta posts denunciados na Tela 7
   ===================================================================== */
(function () {
  'use strict';
  var R = window.RIFF;
  if (!R) return;
  var esc = R.esc;
  var LUTHIER = 'Rafael Tavares';

  /* ===============================================================
     TELA 8: Dashboard das 4 receitas e inventário
     =============================================================== */
  var COLORS = { kits: '#E58E26', app: '#10B981', market: '#5b9cf5', ads: '#b48cf2' };

  function metrics() {
    var st = R.state;
    var active = st.orders.filter(function (o) { return o.kind === 'assinatura' && o.status === 'ativo'; });
    var mrr = active.reduce(function (s, o) { return s + R.PLANS[o.plan].price; }, 0);
    var premium = st.revenue.premiumBase + active.filter(function (o) { return o.app === 'premium'; }).length;
    var app = premium * R.APP_PLANS.premium.price;
    return {
      active: active, mrr: mrr, rentals: active.filter(function (o) { return o.serial; }).length,
      premium: premium, app: app, market: st.revenue.marketplace, ads: st.revenue.ads,
      total: mrr + app + st.revenue.marketplace + st.revenue.ads,
      waiting: active.filter(function (o) { return !o.serial; })
    };
  }

  function renderTela8(root) {
    var st = R.state;
    var m = metrics();
    var avail = R.stockAvailable();
    var flash = st.ui.flash;
    var count = function (s) { return st.inventory.filter(function (i) { return i.status === s; }).length; };

    var alert = avail <= 1
      ? '<div class="alert alert-warn pulse">' + R.icon('alert', 22) + '<div><b>Alerta de Estoque:</b> ' +
          (avail === 1 ? 'Apenas 1 Kit O RIFF disponível para novas locações em Campinas.' : 'Nenhum Kit O RIFF disponível para novas locações em Campinas.') +
          (m.waiting.length ? ' <b>' + m.waiting.length + (m.waiting.length > 1 ? ' pedidos' : ' pedido') + ' na fila de espera.</b>' : '') +
          '<div class="small" style="opacity:.85">Disparado automaticamente quando há 1 kit ou menos com status Disponível. Libere kits da bancada na Tela 9.</div></div></div>'
      : '<div class="alert alert-ok">' + R.icon('check', 20) + '<div><b>Estoque saudável:</b> ' + avail + ' kits disponíveis para novas locações em Campinas.</div></div>';

    var parts = [
      { k: 'kits', label: '1. Aluguéis de Kits (MRR)', v: m.mrr, sub: m.rentals + (m.rentals === 1 ? ' kit alugado' : ' kits alugados') + ' • ' + m.active.length + ' assinaturas ativas', icon: 'guitar' },
      { k: 'app', label: '2. App Premium IA', v: m.app, sub: m.premium + ' assinantes × ' + R.money(19.9), icon: 'sparkle' },
      { k: 'market', label: '3. Comissões do Marketplace', v: m.market, sub: Math.round(R.CONST.COMMISSION * 100) + '% sobre vendas dos parceiros', icon: 'cart' },
      { k: 'ads', label: '4. Receita de Ads no Feed', v: m.ads, sub: (st.revenue.adClicks || 0) + ' cliques nesta sessão • ' + R.money(R.CONST.AD_CPC) + ' por clique', icon: 'star' }
    ];

    root.innerHTML =
      alert +
      '<div class="grid cols-4 mt-lg">' + parts.map(function (p) {
        return '<div class="card kpi"><div class="kpi-label"><span class="dot" style="background:' + COLORS[p.k] + '"></span>' + p.label + '</div>' +
          '<div class="kpi-value">' + R.money(p.v) + '</div><div class="kpi-sub">' + p.sub + '</div></div>';
      }).join('') + '</div>' +

      '<div class="grid split mt">' +
        '<div class="card">' +
          '<div class="card-head"><h3>' + R.icon('chart', 20) + 'Composição da receita mensal</h3><b class="kpi-value" style="margin:0;font-size:22px">' + R.money(m.total) + '</b></div>' +
          '<div class="mix" role="img" aria-label="Participação de cada fonte de receita">' + parts.map(function (p) {
            return '<span style="width:' + (p.v / m.total * 100).toFixed(1) + '%;background:' + COLORS[p.k] + '" title="' + esc(p.label) + ': ' + R.money(p.v) + '"></span>';
          }).join('') + '</div>' +
          '<div class="legend">' + parts.map(function (p) {
            return '<span><i style="background:' + COLORS[p.k] + '"></i>' + p.label.replace(/^\d\.\s/, '') + ' • ' + Math.round(p.v / m.total * 100) + '%</span>';
          }).join('') + '</div>' +
        '</div>' +
        '<div class="card kpi">' +
          '<div class="kpi-label">' + R.icon('users', 16) + 'Taxa de retenção dos iniciantes</div>' +
          '<div class="kpi-value" style="color:var(--emerald)">' + st.revenue.retention + '%</div>' +
          '<div class="progress ok"><span style="width:' + st.revenue.retention + '%"></span></div>' +
          '<div class="kpi-sub mt">Alunos de nível iniciante que seguem ativos após 90 dias</div>' +
        '</div>' +
      '</div>' +

      '<div class="card mt">' +
        '<div class="card-head"><h3>' + R.icon('box', 20) + 'Inventário por Nº de Série / Patrimônio (lote piloto)</h3>' +
          '<div class="row wrap">' + R.statusBadge('Disponível') + '<b>' + count('Disponível') + '</b>' + R.statusBadge('Alugado') + '<b>' + count('Alugado') + '</b>' + R.statusBadge('Em Manutenção') + '<b>' + count('Em Manutenção') + '</b></div></div>' +
        '<div class="table-wrap"><table class="table"><thead><tr><th>Patrimônio</th><th>Modelo</th><th>Cliente atual</th><th>Última regulagem</th><th>Status</th><th></th></tr></thead><tbody>' +
          st.inventory.map(function (i) {
            return '<tr' + (i.serial === flash ? ' class="flash"' : '') + '><td class="serial">' + esc(i.serial) + '</td><td>' + esc(i.model) + '</td>' +
              '<td>' + (i.client ? esc(i.client) : '<span class="muted">Sem cliente</span>') + '</td><td>' + R.fmtDate(i.lastReg) + '</td><td>' + R.statusBadge(i.status) + '</td>' +
              '<td style="text-align:right;white-space:nowrap">' +
                (i.status === 'Disponível' ? '<button class="btn btn-ghost btn-sm" data-bench="' + i.serial + '">' + R.icon('wrench', 14) + 'Enviar à bancada</button> ' : '') +
                '<button class="btn btn-ghost btn-sm" data-laudo="' + i.serial + '">' + R.icon('shield', 14) + 'Laudo</button></td></tr>';
          }).join('') +
        '</tbody></table></div>' +
        (m.waiting.length ? '<p class="small mt" style="margin-bottom:0">' + R.icon('clock', 14) + ' Fila de espera: ' + m.waiting.map(function (o) { return esc(o.id) + ' (' + esc(o.name) + ')'; }).join(', ') + '. O próximo kit liberado pelo luthier vai automaticamente para o primeiro da fila.</p>' : '') +
      '</div>';

    if (flash) { st.ui.flash = null; R.save(); }

    root.querySelectorAll('[data-laudo]').forEach(function (b) {
      b.addEventListener('click', function () {
        st.ui.laudoSerial = b.getAttribute('data-laudo');
        R.save();
        R.go(9);
      });
    });
    root.querySelectorAll('[data-bench]').forEach(function (b) {
      b.addEventListener('click', function () {
        var inv = st.inventory.find(function (i) { return i.serial === b.getAttribute('data-bench'); });
        inv.status = 'Em Manutenção';
        inv.client = 'Hub Campinas (bancada)';
        R.save();
        R.toast(inv.serial + ' enviado à bancada do luthier.', { icon: 'wrench', type: 'info', action: { label: 'Abrir laudo', onClick: function () { st.ui.laudoSerial = inv.serial; R.save(); R.go(9); } } });
        R.rerender();
      });
    });
  }

  R.register(8, {
    lead: 'Visão do negócio em tempo real: as 4 fontes de receita da Seção 3.3, alerta automático de estoque baixo e o inventário serializado do lote piloto.',
    live: true,
    render: renderTela8
  });

  /* ===============================================================
     TELA 9: Laudo técnico de regulagem
     =============================================================== */
  var CHECKS = [
    { k: 'trastes', t: 'Trastes', d: 'Nivelamento e polimento' },
    { k: 'braco', t: 'Braço', d: 'Tensor e ação de 1,5 mm no 12º traste' },
    { k: 'ponte', t: 'Ponte e Tarraxas', d: 'Oitavas e estabilidade de afinação' },
    { k: 'eletrica', t: 'Parte Elétrica', d: 'Blindagem e captadores sem ruído' }
  ];
  var lastResult = null;

  function renderTela9(root) {
    var st = R.state;
    var serial = st.ui.laudoSerial;
    if (!st.inventory.some(function (i) { return i.serial === serial; })) {
      var bench = st.inventory.find(function (i) { return i.status === 'Em Manutenção'; });
      serial = (bench || st.inventory[0]).serial;
    }
    var inv = st.inventory.find(function (i) { return i.serial === serial; });
    var pass = st.passports[serial] || {};
    var checks = { trastes: false, braco: false, ponte: false, eletrica: false };
    var isMaint = inv.status === 'Em Manutenção';
    var laudos = st.laudos.slice().reverse().slice(0, 6);

    root.innerHTML =
      (lastResult ? '<div class="alert alert-ok mb">' + R.icon('check', 20) + '<div>' + lastResult + '</div></div>' : '') +
      '<div class="grid split">' +
        '<div class="stack">' +
          '<div class="card">' +
            '<div class="card-head"><h3>' + R.icon('search', 20) + 'Busca por número de série</h3><span class="small muted">Luthier: ' + LUTHIER + ' • Hub Campinas</span></div>' +
            '<form class="row" id="fSearch"><input type="search" id="q" list="serials" placeholder="Ex.: RIFF-GTR-003" value="' + esc(serial) + '" autocomplete="off">' +
              '<datalist id="serials">' + st.inventory.map(function (i) { return '<option value="' + i.serial + '">'; }).join('') + '</datalist>' +
              '<button class="btn btn-ghost" type="submit">' + R.icon('search') + 'Buscar</button></form>' +
            '<div class="chips mt">' + st.inventory.map(function (i) {
              return '<button class="opt" data-sel="' + i.serial + '" aria-pressed="' + (i.serial === serial) + '"><span class="mono">' + i.serial + '</span>' + (i.status === 'Em Manutenção' ? R.icon('wrench', 13) : '') + '</button>';
            }).join('') + '</div>' +
          '</div>' +

          '<form class="card" id="fLaudo" novalidate>' +
            '<div class="card-head"><h3>' + R.icon('guitar', 20) + 'Guitarra <span class="serial">' + esc(serial) + '</span></h3>' + R.statusBadge(inv.status) + '</div>' +
            '<dl class="kv mb"><dt>Modelo</dt><dd>' + esc(inv.model) + ' • escala Jacarandá, 22 trastes</dd><dt>Cliente</dt><dd>' + (inv.client ? esc(inv.client) : '<span class="muted">Sem cliente</span>') + '</dd>' +
              '<dt>Última regulagem</dt><dd>' + R.fmtDate(inv.lastReg) + (pass.obs ? ' • <span class="muted">' + esc(pass.obs) + '</span>' : '') + '</dd></dl>' +
            '<p class="section-title">Checklist técnico obrigatório (US #07)</p>' +
            '<div class="checklist">' + CHECKS.map(function (c) {
              return '<label class="check-item" data-ci="' + c.k + '"><input type="checkbox" data-ck="' + c.k + '"><span><b>' + c.t + '</b><small>' + c.d + '</small></span></label>';
            }).join('') + '</div>' +
            '<div class="form-grid mt-lg">' +
              '<div class="field span-2"><label for="acao">Ação aferida no 12º traste (mm)</label><input type="number" id="acao" step="0.1" min="1" max="2.5" value="1.5"></div>' +
              '<div class="field span-4"><label for="cordas">Troca de cordas</label><select id="cordas"><option>.009 novas</option><option>.010 novas</option><option>Mantidas (em bom estado)</option></select></div>' +
              '<div class="field span-6"><label for="obs">Observações do laudo</label><textarea id="obs" placeholder="Encordoamento .009 novo instalado"></textarea></div>' +
            '</div>' +
            '<p class="small muted mt" id="ckHint">Marque os 4 itens do checklist para liberar o salvamento.</p>' +
            '<button class="btn btn-ok btn-lg btn-block" type="submit" id="btnSave" disabled>' + R.icon('check') +
              (isMaint ? 'Salvar Laudo Técnico e Liberar Kit para o Estoque' : 'Salvar Laudo Técnico') + '</button>' +
          '</form>' +
        '</div>' +

        '<aside class="stack sticky">' +
          '<div class="card">' +
            '<div class="card-head"><h3>' + R.icon('wrench', 20) + 'Bancada agora</h3></div>' +
            '<div class="list">' + st.inventory.map(function (i) {
              return '<div class="list-item" style="align-items:center"><span class="serial grow">' + i.serial + '</span>' + R.statusBadge(i.status) + '</div>';
            }).join('') + '</div>' +
            '<p class="tiny muted mt" style="margin-bottom:0">Kits disponíveis: <b>' + R.stockAvailable() + '</b> ' + (R.stockAvailable() <= 1 ? '(alerta de estoque ativo no painel do Admin)' : '') + '</p>' +
          '</div>' +
          '<div class="card">' +
            '<div class="card-head"><h3>' + R.icon('clock', 20) + 'Laudos recentes</h3></div>' +
            (laudos.length
              ? '<div class="list">' + laudos.map(function (l) {
                  return '<div class="list-item" style="display:grid;gap:2px"><span><span class="serial">' + l.serial + '</span> • ' + String(l.acao).replace('.', ',') + ' mm • ' + esc(l.cordas) + '</span>' +
                    '<span class="tiny muted">' + R.fmtDateTime(l.at) + (l.released ? ' • liberado para o estoque' : '') + '</span></div>';
                }).join('') + '</div>'
              : '<p class="small muted" style="margin:0">Nenhum laudo salvo nesta sessão.</p>') +
          '</div>' +
        '</aside>' +
      '</div>';

    lastResult = null;

    function select(s) {
      var found = st.inventory.find(function (i) { return i.serial.toUpperCase() === String(s).trim().toUpperCase(); });
      if (!found) return R.toast('Número de série não encontrado no inventário.', { type: 'warn' });
      st.ui.laudoSerial = found.serial;
      R.save();
      R.rerender();
    }
    root.querySelector('#fSearch').addEventListener('submit', function (e) { e.preventDefault(); select(root.querySelector('#q').value); });
    root.querySelector('#q').addEventListener('change', function () { if (this.value.trim().toUpperCase() !== serial) select(this.value); });
    root.querySelectorAll('[data-sel]').forEach(function (b) {
      b.addEventListener('click', function () { select(b.getAttribute('data-sel')); });
    });

    var btn = root.querySelector('#btnSave');
    root.querySelectorAll('[data-ck]').forEach(function (c) {
      c.addEventListener('change', function () {
        checks[c.getAttribute('data-ck')] = c.checked;
        root.querySelector('[data-ci="' + c.getAttribute('data-ck') + '"]').classList.toggle('on', c.checked);
        var n = CHECKS.filter(function (x) { return checks[x.k]; }).length;
        btn.disabled = n < 4;
        root.querySelector('#ckHint').textContent = n < 4 ? n + ' de 4 itens conferidos.' : 'Checklist completo. Pronto para salvar o laudo.';
      });
    });

    root.querySelector('#fLaudo').addEventListener('submit', function (e) {
      e.preventDefault();
      var acao = Number(root.querySelector('#acao').value);
      if (!(acao >= 1 && acao <= 2.5)) return R.toast('Informe a ação aferida entre 1,0 e 2,5 mm.', { type: 'warn' });
      var cordas = root.querySelector('#cordas').value;
      var obs = root.querySelector('#obs').value.trim() || (cordas.indexOf('novas') > 0 ? 'Encordoamento ' + cordas.replace(' novas', '') + ' novo instalado.' : 'Regulagem completa conferida.');
      var now = Date.now();
      var before = inv.status;
      st.passports[serial] = { serial: serial, acao: acao, cordas: cordas, trastes: true, braco: true, ponte: true, eletrica: true, luthier: LUTHIER, date: now, obs: obs };
      inv.lastReg = R.isoDay();
      var released = before === 'Em Manutenção';
      var msg = 'Laudo de <b class="serial">' + serial + '</b> salvo e Passaporte Digital atualizado.';
      if (released) {
        inv.status = 'Disponível';
        inv.client = '';
        var waiting = st.orders.find(function (o) { return o.kind === 'assinatura' && o.status === 'ativo' && !o.serial; });
        if (waiting) {
          inv.status = 'Alugado';
          inv.client = waiting.name;
          waiting.serial = serial;
          waiting.log.push({ at: now, text: 'Kit ' + serial + ' liberado pelo luthier e destinado ao seu pedido. Em separação no Hub Campinas.' });
          msg += ' Status: Em Manutenção → Disponível e destinado ao pedido ' + esc(waiting.id) + ' da fila de espera.';
        } else {
          msg += ' Status no inventário: Em Manutenção → <b>Disponível</b>.' + (R.stockAvailable() > 1 ? ' Alerta de estoque baixo removido.' : '');
        }
      }
      st.orders.filter(function (o) { return o.serial === serial && o.kind === 'assinatura'; }).forEach(function (o) {
        o.log.push({ at: now, text: 'Passaporte de Regulagem atualizado pelo luthier ' + LUTHIER + ' (ação ' + String(acao).replace('.', ',') + ' mm, cordas ' + cordas + ').' });
      });
      st.laudos.push({ serial: serial, at: now, luthier: LUTHIER, acao: acao, cordas: cordas, obs: obs, released: released });
      st.ui.flash = serial;
      R.save();
      lastResult = msg;
      R.toast(released ? serial + ' liberado para o estoque.' : 'Laudo de ' + serial + ' salvo.', { action: { label: 'Ver estoque (Tela 8)', go: 8 } });
      R.rerender();
    });
  }

  R.register(9, {
    lead: 'O luthier localiza a guitarra pelo número de série, cumpre o checklist obrigatório e salva o laudo: o kit volta ao estoque e o Passaporte do aluno é atualizado na hora.',
    render: renderTela9
  });

  /* ===============================================================
     TELA 10: Tickets de suporte e moderação
     =============================================================== */
  var MAINT_STEPS = ['Agendado', 'Na Bancada do Luthier', 'Pronto para Devolução'];
  var seen = null;

  function renderTela10(root) {
    var st = R.state;
    var openT = st.tickets.filter(function (t) { return t.status !== 'Encerrado'; }).sort(function (a, b) { return a.createdAt - b.createdAt; });
    var closedT = st.tickets.filter(function (t) { return t.status === 'Encerrado'; });
    var pend = st.reports.filter(function (r) { return r.status === 'Pendente'; }).sort(function (a, b) { return a.at - b.at; });
    var done = st.reports.filter(function (r) { return r.status !== 'Pendente'; });
    var maint = st.maintenance.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var firstVisit = !seen;
    seen = seen || {};

    function isNew(id) {
      var n = !firstVisit && !seen[id];
      seen[id] = true;
      return n;
    }

    root.innerHTML =
      '<div class="grid cols-2">' +
        /* Painel 1 */
        '<div class="card">' +
          '<div class="card-head"><h3>' + R.icon('ticket', 20) + 'Painel 1: Chamados de Suporte</h3><span class="count-pill' + (openT.length ? '' : ' zero') + '">' + openT.length + '</span></div>' +
          '<p class="card-sub">Em ordem de chegada. Recebidos automaticamente da Tela 4.</p>' +
          (openT.length
            ? '<div class="stack" style="gap:12px">' + openT.map(function (t) {
                return '<div class="queue-item' + (isNew(t.id) ? ' new' : '') + '" data-t="' + t.id + '">' +
                  '<div class="row between wrap"><div class="row">' + R.avatar(t.name, 34) + '<div><b>' + esc(t.name) + '</b><div class="tiny muted">' + esc(t.id) + ' • ' + R.timeAgo(t.createdAt) + (t.serial ? ' • ' + esc(t.serial) : '') + '</div></div></div>' + R.statusBadge(t.status) + '</div>' +
                  '<span class="tag">' + esc(t.reason) + '</span>' +
                  '<div class="quote">' + esc(t.desc) + '</div>' +
                  t.replies.map(function (r) { return '<div class="reply"><b>Você respondeu:</b> ' + esc(r.text) + '</div>'; }).join('') +
                  '<textarea placeholder="Resposta direta ao cliente…" data-reply style="min-height:64px"></textarea>' +
                  '<div class="row wrap"><button class="btn btn-primary btn-sm" data-send>' + R.icon('send', 15) + 'Enviar Resposta Direta ao Cliente</button>' +
                  '<button class="btn btn-ghost btn-sm" data-close>' + R.icon('check', 15) + 'Encerrar Ticket</button></div>' +
                  '</div>';
              }).join('') + '</div>'
            : '<div class="card inner empty">' + R.icon('check', 28) + '<p class="muted small" style="margin:6px 0 0">Nenhum chamado aberto.</p></div>') +
          (closedT.length ? '<details class="mt"><summary class="small muted" style="cursor:pointer">Encerrados (' + closedT.length + ')</summary><div class="list mt">' + closedT.map(function (t) {
            return '<div class="list-item small"><span class="grow"><b>' + esc(t.id) + '</b> • ' + esc(t.name) + ' • ' + esc(t.reason) + '</span>' + R.statusBadge('Encerrado') + '</div>';
          }).join('') + '</div></details>' : '') +
        '</div>' +

        /* Painel 2 */
        '<div class="card">' +
          '<div class="card-head"><h3>' + R.icon('flag', 20) + 'Painel 2: Moderação de Denúncias</h3><span class="count-pill' + (pend.length ? '' : ' zero') + '">' + pend.length + '</span></div>' +
          '<p class="card-sub">Recebe em tempo real os posts denunciados no Feed (Tela 7).</p>' +
          (pend.length
            ? '<div class="stack" style="gap:12px">' + pend.map(function (r) {
                var p = st.posts.find(function (x) { return x.id === r.postId; }) || { author: '?', text: '(publicação removida)' };
                return '<div class="queue-item' + (isNew(r.id) ? ' new' : '') + '" data-r="' + r.id + '">' +
                  '<div class="row between wrap"><div class="row">' + R.avatar(p.author, 34) + '<div><b>' + esc(p.author) + '</b><div class="tiny muted">' + esc(r.id) + ' • denunciado ' + R.timeAgo(r.at) + ' por ' + esc(r.by) + '</div></div></div>' + R.statusBadge('Pendente') + '</div>' +
                  '<div class="quote">' + esc(p.text || '(publicação com mídia)') + (p.media ? '<div class="tiny muted mt">' + R.icon('camera', 12) + ' contém mídia anexada</div>' : '') + '</div>' +
                  '<span class="small"><b>Motivo:</b> ' + esc(r.reason) + '</span>' +
                  '<div class="row wrap"><button class="btn btn-danger btn-sm" data-hide>' + R.icon('eyeoff', 15) + 'Ocultar Postagem que Viola as Regras</button>' +
                  '<button class="btn btn-ghost btn-sm" data-ignore>' + R.icon('x', 15) + 'Ignorar Denúncia</button></div>' +
                  '</div>';
              }).join('') + '</div>'
            : '<div class="card inner empty">' + R.icon('shield', 28) + '<p class="muted small" style="margin:6px 0 0">Nenhuma denúncia pendente. Denuncie um post na Tela 7 para testar.</p></div>') +
          (done.length ? '<details class="mt"><summary class="small muted" style="cursor:pointer">Histórico de moderação (' + done.length + ')</summary><div class="list mt">' + done.map(function (r) {
            return '<div class="list-item small"><span class="grow"><b>' + esc(r.id) + '</b> • ' + esc(r.reason) + '</span><span class="badge ' + (r.status === 'Removido' ? 's-red' : 's-muted') + '">' + (r.status === 'Removido' ? 'Post ocultado' : 'Ignorada') + '</span></div>';
          }).join('') + '</div></details>' : '') +
        '</div>' +
      '</div>' +

      /* Agenda de manutenção (vinda da Tela 4) */
      '<div class="card mt">' +
        '<div class="card-head"><h3>' + R.icon('calendar', 20) + 'Agendamentos de manutenção (Tela 4)</h3></div>' +
        (maint.length
          ? '<div class="table-wrap"><table class="table"><thead><tr><th>Protocolo</th><th>Aluno</th><th>Data</th><th>Serviços</th><th>Modalidade</th><th>Status</th><th></th></tr></thead><tbody>' +
              maint.map(function (mm) {
                var idx = MAINT_STEPS.indexOf(mm.status);
                return '<tr><td class="mono">' + esc(mm.id) + '</td><td>' + esc(mm.name) + '</td><td>' + R.fmtDate(mm.date) + ' ' + esc(mm.time) + '</td><td class="small">' + esc(mm.services.join(', ')) + '</td>' +
                  '<td class="small">' + (mm.mode === 'coleta' ? 'Coleta <span class="mono">' + esc(mm.code) + '</span>' : 'Hub Campinas') + '</td><td>' + R.statusBadge(mm.status) + '</td>' +
                  '<td style="text-align:right">' + (idx < 2 ? '<button class="btn btn-ghost btn-sm" data-adv="' + mm.id + '">' + R.icon('arrow', 14) + MAINT_STEPS[idx + 1] + '</button>' : '') + '</td></tr>';
              }).join('') + '</tbody></table></div>'
          : '<p class="small muted" style="margin:0">Nenhum agendamento.</p>') +
      '</div>';

    /* Ações dos tickets */
    root.querySelectorAll('[data-t]').forEach(function (el) {
      var t = st.tickets.find(function (x) { return x.id === el.getAttribute('data-t'); });
      el.querySelector('[data-send]').addEventListener('click', function () {
        var txt = el.querySelector('[data-reply]').value.trim();
        if (txt.length < 3) return R.toast('Escreva a resposta antes de enviar.', { type: 'warn' });
        t.replies.push({ text: txt, at: Date.now() });
        t.status = 'Respondido';
        R.save();
        R.toast('Resposta enviada para ' + t.name.split(' ')[0] + ' (aparece na Tela 4 do aluno).');
        R.rerender();
      });
      el.querySelector('[data-close]').addEventListener('click', function () {
        t.status = 'Encerrado';
        t.closedAt = Date.now();
        R.save();
        R.toast('Ticket ' + t.id + ' encerrado.');
        R.rerender();
      });
    });

    /* Ações de moderação */
    root.querySelectorAll('[data-r]').forEach(function (el) {
      var r = st.reports.find(function (x) { return x.id === el.getAttribute('data-r'); });
      var p = st.posts.find(function (x) { return x.id === r.postId; });
      el.querySelector('[data-hide]').addEventListener('click', function () {
        if (p) { p.hidden = true; p.reported = false; }
        st.reports.forEach(function (x) { if (x.postId === r.postId && x.status === 'Pendente') x.status = 'Removido'; });
        R.save();
        R.toast('Postagem ocultada e removida do Feed.', { icon: 'eyeoff', action: { label: 'Conferir no Feed', go: 7 } });
        R.rerender();
      });
      el.querySelector('[data-ignore]').addEventListener('click', function () {
        r.status = 'Ignorada';
        if (p && !st.reports.some(function (x) { return x.postId === p.id && x.status === 'Pendente'; })) p.reported = false;
        R.save();
        R.toast('Denúncia ignorada. A postagem continua no Feed.', { type: 'info' });
        R.rerender();
      });
    });

    root.querySelectorAll('[data-adv]').forEach(function (b) {
      b.addEventListener('click', function () {
        var mm = st.maintenance.find(function (x) { return x.id === b.getAttribute('data-adv'); });
        mm.status = MAINT_STEPS[MAINT_STEPS.indexOf(mm.status) + 1];
        R.save();
        R.toast(mm.id + ': ' + mm.status + '. O aluno vê o novo status na Tela 4.');
        R.rerender();
      });
    });
  }

  R.register(10, {
    lead: 'Central única do Administrador: responde e encerra os chamados abertos pelos alunos e modera, em tempo real, os posts denunciados na comunidade.',
    live: true,
    render: renderTela10
  });
})();
