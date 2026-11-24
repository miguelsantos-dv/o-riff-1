/* =====================================================================
   O RIFF | Módulo 3: Comunidade Musical (Match com IA, Salas ao Vivo e Feed)
   Arquivo: modulo3-comunidade.js
   Responsável: Leonardo Santos de Araujo Regos (Grupo 8)

   Tela 6 (US #08): Salas Virtuais ao Vivo (WebRTC) e Match Musical por IA
   Tela 7 (US #09): Feed Social, Denúncias e Post Patrocinado (Ads)

   Integrações:
   • O Match IA usa nível, estilos e instrumento do cadastro (Tela 1)
   • A denúncia de um post cai na fila de Moderação do Admin (Tela 10)
   • O post patrocinado leva ao Marketplace (Tela 2) e soma receita de Ads (Tela 8)
   ===================================================================== */
(function () {
  'use strict';
  var R = window.RIFF;
  if (!R) return;
  var esc = R.esc;

  /* ===============================================================
     TELA 6: Salas ao Vivo e Match IA
     =============================================================== */
  var ROOMS = [
    { id: 'r1', name: 'Sala Iniciantes Rock Campinas', n: 4, level: 'Iniciante', tag: 'Rock', host: 'Monitor O RIFF' },
    { id: 'r2', name: 'Tira Dúvidas Acordes e Ritmo', n: 2, level: 'Iniciante', tag: 'Dúvidas', host: 'Luthier Rafael' },
    { id: 'r3', name: 'Jam de Blues Taquaral', n: 3, level: 'Intermediário', tag: 'Blues', host: 'Diego Ramos' },
    { id: 'r4', name: 'Pentatônica sem Medo', n: 5, level: 'Intermediário', tag: 'Solo', host: 'Monitor O RIFF' }
  ];

  var PEOPLE = [
    { id: 'julia', name: 'Júlia Andrade', age: 22, bairro: 'Cambuí', city: 'Campinas', km: 3, instrument: 'Guitarra', level: 'Iniciante', styles: ['Rock', 'Indie'], hue: 330 },
    { id: 'rafa', name: 'Rafael Nunes', age: 27, bairro: 'Taquaral', city: 'Campinas', km: 4.5, instrument: 'Baixo', level: 'Iniciante', styles: ['Rock', 'Blues'], hue: 200 },
    { id: 'thiago', name: 'Thiago Souza', age: 31, bairro: 'Centro', city: 'Campinas', km: 2.2, instrument: 'Bateria', level: 'Intermediário', styles: ['Rock', 'Metal'], hue: 15 },
    { id: 'bia', name: 'Beatriz Lima', age: 19, bairro: 'Barão Geraldo', city: 'Campinas', km: 11, instrument: 'Violão', level: 'Intermediário', styles: ['MPB', 'Indie'], hue: 150 },
    { id: 'gus', name: 'Gustavo Reis', age: 26, bairro: 'Guanabara', city: 'Campinas', km: 4, instrument: 'Guitarra', level: 'Iniciante', styles: ['Metal', 'Rock'], hue: 260 },
    { id: 'carol', name: 'Carolina Prado', age: 24, bairro: 'Centro', city: 'Valinhos', km: 14, instrument: 'Vocal', level: 'Iniciante', styles: ['MPB', 'Blues'], hue: 45 },
    { id: 'pedro', name: 'Pedro Henrique Alves', age: 29, bairro: 'Sousas', city: 'Campinas', km: 9, instrument: 'Guitarra', level: 'Avançado', styles: ['Blues', 'Rock'], hue: 100 },
    { id: 'lari', name: 'Larissa Mendes', age: 21, bairro: 'Vila Arens', city: 'Jundiaí', km: 38, instrument: 'Teclado', level: 'Iniciante', styles: ['Indie', 'MPB'], hue: 290 }
  ];

  var REPLIES = [
    'Opa, tudo certo? Bora tocar junto sim!',
    'Tô travando na troca de Em para G ainda, e você?',
    'Sábado à tarde fica bom pra mim. Pode ser na sala ao vivo?',
    'Fechado! Te mando o link da sala quando eu entrar.'
  ];

  var LEVELS = ['Iniciante', 'Intermediário', 'Avançado'];
  var INSTR = ['Guitarra', 'Violão', 'Baixo', 'Bateria', 'Teclado', 'Vocal'];

  /* Motor de Match por IA (explicável): cada fator vira uma parte da justificativa */
  function match(me, p) {
    var score = 30, why = [];
    var li = LEVELS.indexOf(me.level || 'Iniciante'), lp = LEVELS.indexOf(p.level);
    if (li === lp) { score += 30; why.push('Mesmo nível ' + p.level.toLowerCase()); }
    else if (Math.abs(li - lp) === 1) { score += 12; why.push('Nível próximo (' + p.level.toLowerCase() + ')'); }
    else why.push('Nível ' + p.level.toLowerCase() + ', bom para mentoria');
    var dist = p.km <= 3 ? 14 : p.km <= 5 ? 10 : p.km <= 15 ? 6 : 2;
    score += dist;
    why.push(String(p.km).replace('.', ',') + ' km ' + (p.city === 'Campinas' ? 'no ' + p.bairro : 'em ' + p.city));
    var shared = (me.styles || []).filter(function (s) { return p.styles.indexOf(s) >= 0; });
    score += Math.min(2, shared.length) * 9;
    var inst = (me.instrument || 'Guitarra') === p.instrument;
    score += inst ? 2 : 4;
    var tail = [];
    if (shared.length) tail.push('interesse em ' + shared.join('/'));
    if (!inst) tail.push('toca ' + p.instrument + ', ótimo para jam');
    var text = why.join(', ') + (tail.length ? ' e ' + tail.join(' e ') : '');
    return { score: Math.max(35, Math.min(99, score)), why: text };
  }

  var room = { stream: null, pcs: [], timer: 0 };
  function leaveRoom() {
    clearInterval(room.timer);
    if (room.stream) room.stream.getTracks().forEach(function (t) { t.stop(); });
    room.pcs.forEach(function (pc) { try { pc.close(); } catch (e) { /* ignora */ } });
    room.stream = null;
    room.pcs = [];
  }

  function renderTela6(root) {
    var me = R.user();
    var st = R.state;
    var f = { radius: 'regiao', instrument: 'Todos', level: 'Todos' };

    root.innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h3>' + R.icon('video', 20) + 'Salas Virtuais de Estudo ao Vivo (Jam Rooms)</h3><span class="tag">Áudio e vídeo em tempo real</span></div>' +
        '<div class="rooms">' + ROOMS.map(function (r) {
          return '<div class="card inner room"><span class="live">Ao vivo</span><b>' + esc(r.name) + '</b>' +
            '<span class="small muted">' + R.icon('users', 14) + ' <b data-n="' + r.id + '">' + r.n + '</b> alunos treinando agora • ' + esc(r.level) + '</span>' +
            '<div class="row wrap"><span class="tag">' + esc(r.tag) + '</span><span class="tag">' + esc(r.host) + '</span></div>' +
            '<button class="btn btn-ok btn-sm" data-room="' + r.id + '">' + R.icon('headphones', 15) + 'Entrar na Sala (Áudio/Vídeo)</button></div>';
        }).join('') + '</div>' +
      '</div>' +

      '<div class="card mt-lg">' +
        '<div class="card-head"><h3>' + R.icon('sparkle', 20) + 'Encontre parceiros de estudo com Match IA</h3><span class="small muted">Seu perfil: ' + esc(me.level || 'Iniciante') + ' • ' + esc((me.styles || []).join('/')) + ' • ' + esc(me.instrument || 'Guitarra') + '</span></div>' +
        '<div class="filters">' +
          '<div class="field"><label for="fRad">' + R.icon('pin', 14) + ' Cidade / Proximidade</label><select id="fRad"><option value="5">Campinas • raio de 5 km</option><option value="15">Campinas • raio de 15 km</option><option value="regiao" selected>Campinas e região</option></select></div>' +
          '<div class="field"><label for="fIns">' + R.icon('guitar', 14) + ' Instrumento</label><select id="fIns"><option>Todos</option>' + INSTR.map(function (i) { return '<option>' + i + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label for="fLvl">' + R.icon('star', 14) + ' Nível</label><select id="fLvl"><option>Todos</option>' + LEVELS.map(function (l) { return '<option>' + l + '</option>'; }).join('') + '</select></div>' +
          '<button class="btn btn-ghost" id="fClear">Limpar filtros</button>' +
        '</div>' +
        '<p class="small muted mt" id="fCount"></p>' +
        '<div class="grid cols-3" id="people"></div>' +
      '</div>';

    function drawPeople() {
      var list = PEOPLE.map(function (p) { return { p: p, m: match(me, p) }; }).filter(function (x) {
        var p = x.p;
        if (f.radius === '5' && !(p.city === 'Campinas' && p.km <= 5)) return false;
        if (f.radius === '15' && !(p.city === 'Campinas' && p.km <= 15)) return false;
        if (f.instrument !== 'Todos' && p.instrument !== f.instrument) return false;
        if (f.level !== 'Todos' && p.level !== f.level) return false;
        return true;
      }).sort(function (a, b) { return b.m.score - a.m.score; });

      root.querySelector('#fCount').textContent = list.length + (list.length === 1 ? ' pessoa encontrada' : ' pessoas encontradas') + ', ordenadas pela compatibilidade calculada pela IA.';
      var box = root.querySelector('#people');
      if (!list.length) {
        box.innerHTML = '<div class="card inner empty" style="grid-column:1/-1">' + R.icon('search', 30) + '<p class="muted">Ninguém com esses filtros agora. Tente ampliar o raio.</p></div>';
        return;
      }
      box.innerHTML = list.map(function (x) {
        var p = x.p, req = st.community.requests[p.id];
        return '<div class="card inner profile-card">' +
          '<div class="row">' + R.avatar(p.name, 52, p.hue) + '<div class="grow"><b>' + esc(p.name) + ', ' + p.age + '</b><div class="small muted">' + R.icon('pin', 13) + ' ' + esc(p.bairro + ', ' + p.city) + ' • ' + String(p.km).replace('.', ',') + ' km</div></div>' +
          '<span class="match">' + R.icon('sparkle', 14) + x.m.score + '% Match IA</span></div>' +
          '<div class="row wrap"><span class="tag">' + esc(p.instrument) + '</span><span class="tag">' + esc(p.level) + '</span>' + p.styles.map(function (s) { return '<span class="tag">' + esc(s) + '</span>'; }).join('') + '</div>' +
          '<div class="why"><b>Por que combinam:</b> ' + esc(x.m.why) + '.</div>' +
          '<div class="row">' +
            (req === 'conectado'
              ? '<button class="btn btn-ok btn-sm grow" disabled>' + R.icon('check', 15) + 'Conectados</button>'
              : req === 'pendente'
                ? '<button class="btn btn-ghost btn-sm grow" disabled>' + R.icon('clock', 15) + 'Solicitação enviada</button>'
                : '<button class="btn btn-primary btn-sm grow" data-conn="' + p.id + '">' + R.icon('users', 15) + 'Enviar Solicitação de Conexão</button>') +
            '<button class="btn btn-ghost btn-sm" data-chat="' + p.id + '" title="Enviar mensagem">' + R.icon('chat', 15) + 'Mensagem</button>' +
          '</div></div>';
      }).join('');

      box.querySelectorAll('[data-conn]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-conn');
          var p = PEOPLE.find(function (x) { return x.id === id; });
          st.community.requests[id] = 'pendente';
          R.save();
          drawPeople();
          R.toast('Solicitação de conexão enviada para ' + p.name.split(' ')[0] + '.');
          setTimeout(function () {
            st.community.requests[id] = 'conectado';
            R.save();
            if (R.current() === 6 && root.isConnected) drawPeople();
            R.toast(p.name.split(' ')[0] + ' aceitou sua conexão!', { icon: 'users', type: 'info', action: { label: 'Conversar', onClick: function () { openChat(p); } } });
          }, 3500);
        });
      });
      box.querySelectorAll('[data-chat]').forEach(function (b) {
        b.addEventListener('click', function () {
          openChat(PEOPLE.find(function (x) { return x.id === b.getAttribute('data-chat'); }));
        });
      });
    }

    root.querySelector('#fRad').addEventListener('change', function () { f.radius = this.value; drawPeople(); });
    root.querySelector('#fIns').addEventListener('change', function () { f.instrument = this.value; drawPeople(); });
    root.querySelector('#fLvl').addEventListener('change', function () { f.level = this.value; drawPeople(); });
    root.querySelector('#fClear').addEventListener('click', function () {
      f = { radius: 'regiao', instrument: 'Todos', level: 'Todos' };
      root.querySelector('#fRad').value = 'regiao';
      root.querySelector('#fIns').value = 'Todos';
      root.querySelector('#fLvl').value = 'Todos';
      drawPeople();
    });

    root.querySelectorAll('[data-room]').forEach(function (b) {
      b.addEventListener('click', function () { joinRoom(ROOMS.find(function (r) { return r.id === b.getAttribute('data-room'); }), root); });
    });

    drawPeople();
  }

  /* ---------- Sala ao vivo: câmera e microfone reais trafegando por WebRTC ---------- */
  function joinRoom(r, screenRoot) {
    var me = R.user();
    var others = PEOPLE.filter(function (p) { return p.level === r.level || p.styles.indexOf(r.tag) >= 0; }).slice(0, r.n);
    while (others.length < r.n) others.push(PEOPLE[others.length % PEOPLE.length]);
    var body = document.createElement('div');
    body.innerHTML =
      '<div class="row between wrap mb"><span class="live">Ao vivo • ' + esc(r.name) + '</span><span class="badge s-muted" id="rtcState">Pedindo câmera e microfone…</span></div>' +
      '<div class="vgrid">' +
        '<div class="vtile" id="selfTile">' + R.avatar(me.name, 64) + '<span class="vname">' + R.icon('user', 13) + 'Você</span></div>' +
        others.map(function (p, i) { return '<div class="vtile" data-o="' + i + '">' + R.avatar(p.name, 64, p.hue) + '<span class="vname">' + R.icon('mic', 13) + esc(p.name.split(' ')[0]) + '</span></div>'; }).join('') +
      '</div>' +
      '<div class="row wrap mt" style="justify-content:center">' +
        '<button class="btn btn-ghost" id="tMic">' + R.icon('mic') + 'Microfone</button>' +
        '<button class="btn btn-ghost" id="tCam">' + R.icon('camera') + 'Câmera</button>' +
      '</div>' +
      '<p class="tiny muted center mt" style="margin-bottom:0">Seu vídeo e áudio passam por uma conexão RTCPeerConnection real (P2P em loopback). Os colegas da sala são simulados no protótipo.</p>';

    var countEl = screenRoot.querySelector('[data-n="' + r.id + '"]');
    if (countEl) countEl.textContent = r.n + 1;

    R.modal({
      title: 'Sala ao vivo', icon: 'video', wide: true, body: body, noFocus: true,
      actions: [{ label: 'Sair da sala', kind: 'danger', icon: 'x' }],
      onClose: function () {
        leaveRoom();
        if (countEl) countEl.textContent = r.n;
      }
    });

    var stateEl = body.querySelector('#rtcState');
    room.timer = setInterval(function () {
      var tiles = body.querySelectorAll('[data-o]');
      var k = Math.floor(Math.random() * tiles.length);
      tiles.forEach(function (t, i) { t.classList.toggle('speaking', i === k); });
    }, 1400);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.RTCPeerConnection) {
      stateEl.textContent = 'Navegador sem WebRTC: modo ouvinte';
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .catch(function () { return navigator.mediaDevices.getUserMedia({ audio: true }); })
      .then(function (stream) {
        if (!document.body.contains(body)) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
        room.stream = stream;
        var pc1 = new RTCPeerConnection(), pc2 = new RTCPeerConnection();
        room.pcs = [pc1, pc2];
        pc1.onicecandidate = function (e) { if (e.candidate) pc2.addIceCandidate(e.candidate).catch(function () {}); };
        pc2.onicecandidate = function (e) { if (e.candidate) pc1.addIceCandidate(e.candidate).catch(function () {}); };
        pc2.ontrack = function (e) {
          var tile = body.querySelector('#selfTile');
          if (stream.getVideoTracks().length && !tile.querySelector('video')) {
            var v = document.createElement('video');
            v.autoplay = true; v.playsInline = true; v.muted = true;
            v.srcObject = e.streams[0];
            tile.insertBefore(v, tile.firstChild);
            var av = tile.querySelector('.avatar');
            if (av) av.remove();
          }
        };
        pc1.onconnectionstatechange = function () {
          if (pc1.connectionState === 'connected') { stateEl.className = 'badge s-ok'; stateEl.textContent = 'WebRTC conectado (P2P)'; }
        };
        stream.getTracks().forEach(function (t) { pc1.addTrack(t, stream); });
        stateEl.textContent = 'Negociando conexão WebRTC…';
        pc1.createOffer()
          .then(function (o) { return pc1.setLocalDescription(o); })
          .then(function () { return pc2.setRemoteDescription(pc1.localDescription); })
          .then(function () { return pc2.createAnswer(); })
          .then(function (a) { return pc2.setLocalDescription(a); })
          .then(function () { return pc1.setRemoteDescription(pc2.localDescription); })
          .catch(function () { stateEl.textContent = 'Falha na negociação WebRTC'; });

        body.querySelector('#tMic').addEventListener('click', function () {
          var t = stream.getAudioTracks()[0];
          if (!t) return;
          t.enabled = !t.enabled;
          this.innerHTML = R.icon(t.enabled ? 'mic' : 'micoff') + (t.enabled ? 'Microfone' : 'Mudo');
        });
        body.querySelector('#tCam').addEventListener('click', function () {
          var t = stream.getVideoTracks()[0];
          if (!t) return R.toast('Nenhuma câmera encontrada.', { type: 'warn' });
          t.enabled = !t.enabled;
          this.innerHTML = R.icon(t.enabled ? 'camera' : 'eyeoff') + (t.enabled ? 'Câmera' : 'Câmera desligada');
        });
      })
      .catch(function () {
        stateEl.className = 'badge s-amber';
        stateEl.textContent = 'Permissão negada: você entrou como ouvinte';
      });
  }

  /* ---------- Chat entre alunos ---------- */
  function openChat(p) {
    var st = R.state;
    var log = st.community.chats[p.id] = st.community.chats[p.id] || [];
    var body = document.createElement('div');
    body.className = 'chat';
    body.innerHTML =
      '<div class="chat-log" id="clog"></div>' +
      '<form class="row" id="cform"><input type="text" id="cin" placeholder="Escreva uma mensagem para ' + esc(p.name.split(' ')[0]) + '…" autocomplete="off" maxlength="400">' +
      '<button class="btn btn-primary" type="submit" aria-label="Enviar">' + R.icon('send') + '</button></form>';
    R.modal({ title: p.name, icon: 'chat', body: body });
    var clog = body.querySelector('#clog');
    function draw(typing) {
      clog.innerHTML = (log.length ? '' : '<p class="small muted center">Diga oi! Vocês têm ' + match(R.user(), p).score + '% de compatibilidade.</p>') +
        log.map(function (m) { return '<div class="msg ' + m.from + '">' + esc(m.text) + '<small>' + new Date(m.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + '</small></div>'; }).join('') +
        (typing ? '<div class="typing">' + esc(p.name.split(' ')[0]) + ' está digitando…</div>' : '');
      clog.scrollTop = clog.scrollHeight;
    }
    draw();
    body.querySelector('#cform').addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = body.querySelector('#cin');
      var text = inp.value.trim();
      if (!text) return;
      log.push({ from: 'me', text: text, at: Date.now() });
      inp.value = '';
      R.save();
      draw(true);
      setTimeout(function () {
        var mine = log.filter(function (m) { return m.from === 'them'; }).length;
        log.push({ from: 'them', text: REPLIES[mine % REPLIES.length], at: Date.now() });
        R.save();
        if (document.body.contains(body)) draw();
      }, 1300);
    });
  }

  R.register(6, {
    lead: 'Salas de estudo ao vivo com áudio e vídeo, e um motor de Match por IA que explica por que vocês combinam: nível, distância, estilos e instrumento.',
    render: renderTela6,
    leave: leaveRoom
  });

  /* ===============================================================
     TELA 7: Feed Social, Denúncias e Post Patrocinado
     =============================================================== */
  var REPORT_REASONS = ['Spam ou propaganda enganosa', 'Conteúdo ofensivo', 'Assédio ou bullying', 'Golpe ou venda irregular', 'Outro motivo'];

  function renderTela7(root) {
    var st = R.state;
    var me = R.user();
    var open = {};
    var attach = null;

    root.innerHTML =
      '<div class="grid split">' +
        '<div class="stack">' +
          '<div class="card" id="composer">' +
            '<div class="row top">' + R.avatar(me.name, 42) +
              '<div class="grow"><textarea id="ptext" maxlength="500" placeholder="Compartilhe seu progresso, ' + esc(me.name.split(' ')[0]) + '. Ex.: exercício da semana concluído!"></textarea>' +
              '<div id="pprev"></div>' +
              '<div class="row between wrap mt">' +
                '<div class="row">' +
                  '<label class="btn btn-ghost btn-sm" style="cursor:pointer">' + R.icon('camera', 15) + 'Foto<input type="file" accept="image/*" id="fImg" hidden></label>' +
                  '<label class="btn btn-ghost btn-sm" style="cursor:pointer">' + R.icon('video', 15) + 'Vídeo curto<input type="file" accept="video/*" id="fVid" hidden></label>' +
                '</div>' +
                '<button class="btn btn-primary" id="pub">' + R.icon('send') + 'Publicar</button>' +
              '</div></div></div>' +
          '</div>' +
          '<div id="notice"></div>' +
          '<div class="feed" id="feed"></div>' +
        '</div>' +
        '<aside class="stack sticky">' +
          '<div class="card">' +
            '<div class="card-head"><h3>' + R.icon('shield', 20) + 'Regras da comunidade</h3></div>' +
            '<ul class="small" style="margin:0;padding-left:18px;display:grid;gap:6px;color:var(--text-2)">' +
              '<li>Respeito com quem está começando.</li><li>Sem spam, golpes ou venda irregular.</li><li>Nada de conteúdo ofensivo ou assédio.</li><li>Viu algo errado? Use <b>Denunciar</b>: a moderação analisa na hora.</li>' +
            '</ul>' +
          '</div>' +
          '<div class="card">' +
            '<div class="card-head"><h3>' + R.icon('fire', 20) + 'Desafio da semana</h3></div>' +
            '<p class="small">Grave 30 segundos da troca <b>Em → G</b> a 70 BPM e poste aqui com seu progresso.</p>' +
            '<a class="btn btn-ghost btn-sm" href="#/tela-5">' + R.icon('play', 14) + 'Abrir a lição</a>' +
          '</div>' +
        '</aside>' +
      '</div>';

    /* Anexos */
    function onFile(input, type) {
      input.addEventListener('change', function () {
        var file = input.files[0];
        if (!file) return;
        if (file.size > 30 * 1024 * 1024) return R.toast('Arquivo muito grande (máximo 30 MB).', { type: 'warn' });
        attach = { type: type, name: file.name, url: URL.createObjectURL(file) };
        drawPreview();
        input.value = '';
      });
    }
    onFile(root.querySelector('#fImg'), 'image');
    onFile(root.querySelector('#fVid'), 'video');
    function drawPreview() {
      var box = root.querySelector('#pprev');
      if (!attach) { box.innerHTML = ''; return; }
      box.innerHTML = '<div class="attach-preview">' + (attach.type === 'image' ? '<img src="' + attach.url + '" alt="Prévia da foto">' : '<video src="' + attach.url + '" controls muted playsinline></video>') +
        '<button class="icon-btn" id="rmAtt" aria-label="Remover anexo">' + R.icon('x', 16) + '</button></div>';
      box.querySelector('#rmAtt').addEventListener('click', function () { attach = null; drawPreview(); });
    }

    root.querySelector('#pub').addEventListener('click', function () {
      var text = root.querySelector('#ptext').value.trim();
      if (!text && !attach) return R.toast('Escreva algo ou anexe uma foto ou vídeo.', { type: 'warn' });
      st.posts.unshift({
        id: R.uid('p'), author: me.name, email: me.email, bairro: me.bairro || 'Campinas', createdAt: Date.now(),
        text: text, likes: 0, likedBy: [], comments: [], media: attach, hidden: false, reported: false
      });
      attach = null;
      root.querySelector('#ptext').value = '';
      drawPreview();
      R.save();
      drawFeed();
      R.toast('Publicado no feed da comunidade!');
    });

    function postHTML(p) {
      var liked = (p.likedBy || []).indexOf(me.email) >= 0;
      var mine = p.email === me.email;
      var pending = st.reports.some(function (r) { return r.postId === p.id && r.status === 'Pendente'; });
      var media = '';
      if (p.media) {
        media = p.media.url
          ? '<div class="post-media">' + (p.media.type === 'image' ? '<img src="' + p.media.url + '" alt="Foto da publicação">' : '<video src="' + p.media.url + '" controls playsinline></video>') + '</div>'
          : '<div class="tag mb">' + R.icon(p.media.type === 'image' ? 'camera' : 'video', 13) + ' ' + esc(p.media.name || 'mídia anexada') + '</div>';
      }
      return '<article class="card" data-post="' + p.id + '">' +
        '<div class="post-head">' + R.avatar(p.author, 42) + '<div class="grow"><b>' + esc(p.author) + '</b><span class="small muted">' + esc(p.bairro) + ' • ' + R.timeAgo(p.createdAt) + '</span></div>' +
          (pending ? '<span class="badge s-amber">' + R.icon('flag', 12) + 'Em análise</span>' : '') + '</div>' +
        (p.text ? '<p class="post-text">' + esc(p.text) + '</p>' : '<div style="height:12px"></div>') + media +
        '<div class="post-actions">' +
          '<button class="act' + (liked ? ' liked' : '') + '" data-like>' + R.icon('heart', 17) + '<span>Curtir</span> <b>' + p.likes + '</b></button>' +
          '<button class="act" data-com>' + R.icon('chat', 17) + 'Comentários <b>' + p.comments.length + '</b></button>' +
          (mine ? '<span class="tag" style="margin-left:auto;align-self:center">Sua publicação</span>'
            : '<button class="act danger" data-rep style="margin-left:auto"' + (pending ? ' disabled' : '') + '>' + R.icon('flag', 17) + (pending ? 'Denunciado' : 'Denunciar') + '</button>') +
        '</div>' +
        (open[p.id]
          ? '<div class="comments">' + p.comments.map(function (c) { return '<div class="comment"><b>' + esc(c.author) + '</b> <span class="tiny muted">' + R.timeAgo(c.at) + '</span><br>' + esc(c.text) + '</div>'; }).join('') +
            '<form class="row" data-cform><input type="text" placeholder="Escreva um comentário…" maxlength="300"><button class="btn btn-ghost btn-sm" type="submit">Comentar</button></form></div>'
          : '') +
        '</article>';
    }

    function adHTML() {
      return '<article class="card ad">' +
        '<div class="row between"><span class="badge s-amber">' + R.icon('star', 12) + 'Patrocinado</span><span class="tiny muted">Loja Parceira Campinas</span></div>' +
        '<h3 style="margin:12px 0 6px;font-size:19px">15% OFF em encordoamentos e cabos para assinantes O RIFF</h3>' +
        '<p class="small muted">Cordas .009 e .010 e cabos blindados direto do parceiro, com entrega em Campinas.</p>' +
        '<button class="btn btn-primary btn-sm" id="adCta">' + R.icon('cart', 15) + 'Ver oferta no Marketplace</button>' +
        '</article>';
    }

    function drawFeed() {
      var visible = st.posts.filter(function (p) { return !p.hidden; }).sort(function (a, b) { return b.createdAt - a.createdAt; });
      var hiddenMine = st.posts.filter(function (p) { return p.hidden && p.email === me.email; });
      root.querySelector('#notice').innerHTML = hiddenMine.length
        ? '<div class="alert alert-warn">' + R.icon('eyeoff', 18) + '<div>' + (hiddenMine.length > 1 ? hiddenMine.length + ' publicações suas foram ocultadas' : 'Uma publicação sua foi ocultada') + ' pela moderação por violar as regras da comunidade.</div></div>'
        : '';
      var html = '';
      visible.forEach(function (p, i) {
        html += postHTML(p);
        if (i === 1) html += adHTML();
      });
      if (visible.length < 2) html += adHTML();
      var feed = root.querySelector('#feed');
      feed.innerHTML = html;

      feed.querySelectorAll('[data-post]').forEach(function (el) {
        var p = st.posts.find(function (x) { return x.id === el.getAttribute('data-post'); });
        el.querySelector('[data-like]').addEventListener('click', function () {
          p.likedBy = p.likedBy || [];
          var i = p.likedBy.indexOf(me.email);
          if (i >= 0) { p.likedBy.splice(i, 1); p.likes--; } else { p.likedBy.push(me.email); p.likes++; }
          R.save();
          drawFeed();
        });
        el.querySelector('[data-com]').addEventListener('click', function () {
          open[p.id] = !open[p.id];
          drawFeed();
          if (open[p.id]) { var inp = root.querySelector('[data-post="' + p.id + '"] [data-cform] input'); if (inp) inp.focus(); }
        });
        var cf = el.querySelector('[data-cform]');
        if (cf) cf.addEventListener('submit', function (e) {
          e.preventDefault();
          var v = cf.querySelector('input').value.trim();
          if (!v) return;
          p.comments.push({ author: me.name, text: v, at: Date.now() });
          R.save();
          drawFeed();
        });
        var rep = el.querySelector('[data-rep]');
        if (rep) rep.addEventListener('click', function () { reportModal(p); });
      });

      var cta = feed.querySelector('#adCta');
      if (cta) cta.addEventListener('click', function () {
        st.revenue.ads += R.CONST.AD_CPC;
        st.revenue.adClicks = (st.revenue.adClicks || 0) + 1;
        st.ui.tab = 'market';
        R.save();
        R.go(2);
      });
    }

    function reportModal(p) {
      var reason = null;
      var body = document.createElement('div');
      body.innerHTML =
        '<div class="quote mb">' + esc(p.text.length > 160 ? p.text.slice(0, 160) + '…' : p.text || '(publicação com mídia)') + '<div class="tiny muted mt">' + esc(p.author) + '</div></div>' +
        '<p class="section-title">Motivo da denúncia</p>' +
        '<div class="list">' + REPORT_REASONS.map(function (r, i) {
          return '<label class="check list-item" style="margin:0"><input type="radio" name="rr" value="' + i + '"><span>' + r + '</span></label>';
        }).join('') + '</div>' +
        '<p class="tiny muted mt" style="margin-bottom:0">A denúncia é anônima para o autor e vai direto para a fila de moderação.</p>';
      body.querySelectorAll('input[name="rr"]').forEach(function (inp) {
        inp.addEventListener('change', function () { reason = REPORT_REASONS[Number(inp.value)]; });
      });
      R.modal({
        title: 'Denunciar Postagem Inadequada', icon: 'flag', body: body, noFocus: true,
        actions: [
          { label: 'Cancelar' },
          { label: 'Enviar denúncia', kind: 'danger', icon: 'flag', onClick: function () {
            if (!reason) { R.toast('Escolha o motivo da denúncia.', { type: 'warn' }); return true; }
            st.reports.push({ id: 'DN-' + (st.reports.length + 501), postId: p.id, reason: reason, by: me.name, at: Date.now(), status: 'Pendente' });
            p.reported = true;
            R.save();
            drawFeed();
            R.toast('Denúncia enviada para a fila de Moderação.', { icon: 'flag', type: 'info', action: { label: 'Ver na Tela 10', go: 10 } });
          } }
        ]
      });
    }

    drawFeed();
  }

  R.register(7, {
    lead: 'Feed da comunidade com fotos e vídeos de progresso, curtidas, comentários, denúncia integrada à moderação e publicidade nativa de parceiros (4ª fonte de receita).',
    live: true,
    render: renderTela7
  });
})();
