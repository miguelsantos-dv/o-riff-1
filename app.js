/* =====================================================================
   O RIFF | app.js (núcleo compartilhado do protótipo)
   Responsável pela base: Miguel Santos da Silva (Grupo 8)

   O que este arquivo faz:
   1. Guarda o estado do sistema (em memória + localStorage)
   2. Define as 10 telas, os 3 perfis e as rotas (#/tela-N)
   3. Oferece utilitários para os módulos: modal, toast, máscaras,
      validação de CPF, formatação de moeda e datas, ícones
   4. Renderiza a topbar com o seletor de perfil e a tela ativa

   Cada módulo (modulo1...modulo4) chama RIFF.register(n, {...})
   para desenhar a sua tela. Se um módulo ainda não foi publicado,
   a tela mostra um aviso no lugar (útil durante os commits).
   ===================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'oriff_prototipo_v1';
  var RIFF = (window.RIFF = window.RIFF || {});

  /* ---------------------------------------------------------------
     Dados oficiais do projeto (Entregas 1.1 a 2.1)
     --------------------------------------------------------------- */
  RIFF.PLANS = {
    mensal: { id: 'mensal', name: 'Mensal', price: 119.9, months: 1, note: 'Sem fidelidade' },
    trimestral: { id: 'trimestral', name: 'Trimestral', price: 99.9, months: 3, note: 'Economia de R$ 60,00 no trimestre' },
    semestral: { id: 'semestral', name: 'Semestral', price: 84.9, months: 6, note: 'Inclui revisão preventiva' }
  };

  RIFF.APP_PLANS = {
    freemium: { id: 'freemium', name: 'O RIFF App Freemium', price: 0 },
    premium: { id: 'premium', name: 'O RIFF App Premium IA', price: 19.9 }
  };

  /* Valores de referência do protótipo (o grupo pode ajustar aqui) */
  RIFF.CONST = {
    KIT_PRICE_REF: 1990, // preço de referência do kit para o Rent to Own
    RENT_TO_OWN_RATE: 0.5, // 50% das mensalidades pagas abatem o preço
    CAUCAO: 350, // pré autorização de caução reembolsável no cartão
    COMMISSION: 0.12, // comissão do marketplace de parceiros
    AD_CPC: 0.8, // receita por clique no post patrocinado
    FREIGHT_REGION: 24.9 // frete para cidades da região (Campinas é grátis)
  };

  /* Músicas do quiz de nivelamento (Tela 1) e lições da trilha (Tela 5) */
  RIFF.SONGS = {
    wonderwall: { label: 'Wonderwall (Oasis)', lesson: 'acordes-abertos' },
    tempo: { label: 'Tempo Perdido (Legião Urbana)', lesson: 'batida-pop' },
    smoke: { label: 'Smoke on the Water (Deep Purple)', lesson: 'primeiro-riff' },
    comeas: { label: 'Come As You Are (Nirvana)', lesson: 'primeiro-riff' }
  };

  RIFF.LESSONS = [
    { id: 'acordes-abertos', title: 'Acordes Abertos', level: 'Iniciante', min: 8, desc: 'Em, Am, C, G e D com digitação limpa' },
    { id: 'troca-em-g', title: 'Troca Rápida Em → G', level: 'Iniciante', min: 6, desc: 'Trocar sem parar a batida, de 60 a 80 BPM' },
    { id: 'primeiro-riff', title: 'Seu 1º Riff', level: 'Iniciante', min: 10, desc: 'Riff em power chords na 6ª corda' },
    { id: 'batida-pop', title: 'Batida Pop em 4/4', level: 'Iniciante', min: 7, desc: 'Baixo, baixo, cima, cima, baixo, cima' },
    { id: 'power-chords', title: 'Power Chords no Rock', level: 'Intermediário', min: 9, desc: 'Shapes móveis na 5ª e 6ª cordas' },
    { id: 'pentatonica', title: 'Pentatônica de Lá menor', level: 'Intermediário', min: 12, desc: 'Desenho 1 da escala e primeiro solo' },
    { id: 'bends', title: 'Bends e Vibrato', level: 'Avançado', min: 12, desc: 'Afinação do bend com o afinador ligado' }
  ];

  /* IA de nivelamento: 3 respostas do quiz viram nível + trilha */
  RIFF.levelFromQuiz = function (q) {
    if (!q || q.played == null || q.minutes == null) return null;
    var score = q.played * 2 + q.minutes;
    return score <= 1 ? 'Iniciante' : score <= 4 ? 'Intermediário' : 'Avançado';
  };

  RIFF.MINUTES = ['10 min', '20 min', '30 min ou mais'];

  RIFF.aiPath = function (acc) {
    var level = (acc && acc.level) || 'Iniciante';
    var base = {
      'Iniciante': ['acordes-abertos', 'troca-em-g', 'primeiro-riff', 'batida-pop', 'power-chords', 'pentatonica', 'bends'],
      'Intermediário': ['troca-em-g', 'power-chords', 'pentatonica', 'primeiro-riff', 'batida-pop', 'bends', 'acordes-abertos'],
      'Avançado': ['pentatonica', 'bends', 'power-chords', 'primeiro-riff', 'troca-em-g', 'batida-pop', 'acordes-abertos']
    }[level] || [];
    var song = acc && acc.quiz && RIFF.SONGS[acc.quiz.song];
    return base.map(function (id) {
      var reason = 'Faz parte da trilha ' + level.toLowerCase();
      if (song && song.lesson === id) reason = 'Prepara você para tocar ' + song.label;
      else if (id === 'troca-em-g') reason = 'Base para quase todas as músicas pop e rock';
      else if (id === 'acordes-abertos') reason = 'Primeiro passo de quem está começando';
      return { lesson: RIFF.LESSONS.find(function (l) { return l.id === id; }), reason: reason };
    });
  };

  RIFF.SCREENS = [
    { n: 1, short: 'Cadastro', title: 'Cadastro, Login, Quiz de Nivelamento por IA e Termos LGPD', profile: 'aluno', module: 1, us: 'US #01' },
    { n: 2, short: 'Kit e Planos', title: 'Vitrine do Kit Físico, Rent to Own, Marketplace e Checkout', profile: 'aluno', module: 1, us: 'US #02' },
    { n: 3, short: 'Rastreio', title: 'Rastreamento, Passaporte de Regulagem e Assinatura', profile: 'aluno', module: 2, us: 'US #03' },
    { n: 4, short: 'Manutenção', title: 'Manutenção Preventiva e Chamado de Suporte', profile: 'aluno', module: 2, us: 'US #06' },
    { n: 5, short: 'Afinador e Trilha', title: 'Afinador Digital, Trilha Gamificada e Player de Aula', profile: 'aluno', module: 2, us: 'US #05' },
    { n: 6, short: 'Comunidade', title: 'Salas ao Vivo (WebRTC) e Match Musical por IA', profile: 'aluno', module: 3, us: 'US #08' },
    { n: 7, short: 'Feed', title: 'Feed Social, Denúncias e Post Patrocinado', profile: 'aluno', module: 3, us: 'US #09' },
    { n: 8, short: 'Receitas e Estoque', title: 'Dashboard das 4 Receitas e Inventário Serializado', profile: 'admin', module: 4, us: 'US #04' },
    { n: 9, short: 'Laudo Técnico', title: 'Laudo Técnico de Regulagem (Visão Luthier)', profile: 'luthier', module: 4, us: 'US #07' },
    { n: 10, short: 'Tickets e Moderação', title: 'Central de Tickets de Suporte e Moderação de Denúncias', profile: 'admin', module: 4, us: 'US #10' }
  ];

  RIFF.PROFILES = {
    aluno: { id: 'aluno', label: 'Cliente / Aluno', icon: 'user', screens: [1, 2, 3, 4, 5, 6, 7] },
    luthier: { id: 'luthier', label: 'Luthier Técnico', icon: 'wrench', screens: [9] },
    admin: { id: 'admin', label: 'Administrador Backoffice', icon: 'chart', screens: [8, 10] }
  };

  RIFF.MODULES = {
    1: { file: 'modulo1-vitrine-auth.js', owner: 'Giovanni Ferigato Siqueira' },
    2: { file: 'modulo2-aluno-afinador.js', owner: 'Miguel Santos da Silva' },
    3: { file: 'modulo3-comunidade.js', owner: 'Leonardo Santos de Araujo Regos' },
    4: { file: 'modulo4-backoffice-luthier.js', owner: 'Mateus de Moraes Soares' }
  };

  /* ---------------------------------------------------------------
     Utilitários
     --------------------------------------------------------------- */
  var DAY = 86400000;

  RIFF.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  RIFF.money = function (n) {
    return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  RIFF.digits = function (s) {
    return String(s || '').replace(/\D/g, '');
  };

  RIFF.uid = function (prefix) {
    return (prefix || 'id') + Math.random().toString(36).slice(2, 9);
  };

  RIFF.hash = function (str) {
    // Hash simples só para o protótipo não guardar senha em texto puro
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return 'h' + h.toString(16);
  };

  RIFF.fmtDate = function (v) {
    if (!v) return '';
    var d = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + 'T12:00:00') : new Date(v);
    return d.toLocaleDateString('pt-BR');
  };

  RIFF.fmtDateTime = function (v) {
    var d = new Date(v);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  RIFF.timeAgo = function (ts) {
    var s = Math.max(1, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return 'agora';
    var m = Math.round(s / 60);
    if (m < 60) return 'há ' + m + ' min';
    var h = Math.round(m / 60);
    if (h < 24) return 'há ' + h + ' h';
    var d = Math.round(h / 24);
    return 'há ' + d + (d === 1 ? ' dia' : ' dias');
  };

  RIFF.isoDay = function (d) {
    d = d || new Date();
    var z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 10);
  };

  RIFF.validCPF = function (value) {
    var c = RIFF.digits(value);
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    for (var t = 9; t < 11; t++) {
      var sum = 0;
      for (var i = 0; i < t; i++) sum += Number(c[i]) * (t + 1 - i);
      var dv = ((sum * 10) % 11) % 10;
      if (dv !== Number(c[t])) return false;
    }
    return true;
  };

  var MASKS = {
    cpf: function (d) {
      d = d.slice(0, 11);
      return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    },
    phone: function (d) {
      d = d.slice(0, 11);
      if (d.length <= 2) return d.length ? '(' + d : '';
      if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    },
    cep: function (d) {
      d = d.slice(0, 8);
      return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
    },
    card: function (d) {
      return d.slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
    },
    exp: function (d) {
      d = d.slice(0, 4);
      return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
    },
    cvv: function (d) {
      return d.slice(0, 4);
    }
  };

  RIFF.maskValue = function (type, value) {
    return MASKS[type](RIFF.digits(value));
  };

  RIFF.mask = function (input, type) {
    if (!input) return;
    input.addEventListener('input', function () {
      input.value = RIFF.maskValue(type, input.value);
    });
    if (input.value) input.value = RIFF.maskValue(type, input.value);
  };

  /* Cobertura de entrega do kit físico: Campinas e região
     Campinas: CEP 13000-000 a 13139-999 (entrega própria do Hub, frete grátis)
     Região:   CEP 13140-000 a 13349-999 (RMC + Jundiaí, frete fixo) */
  RIFF.coverage = function (cep) {
    var d = Number(RIFF.digits(cep).slice(0, 5));
    if (RIFF.digits(cep).length !== 8) return { ok: false, reason: 'CEP incompleto' };
    if (d >= 13000 && d <= 13139) return { ok: true, zone: 'Campinas', freight: 0 };
    if (d >= 13140 && d <= 13349) return { ok: true, zone: 'Região de Campinas', freight: RIFF.CONST.FREIGHT_REGION };
    return { ok: false, reason: 'Fora da área piloto (Campinas e região)' };
  };

  /* Ícones SVG simples (traço) */
  var ICONS = {
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><circle cx="17" cy="9" r="2.8"/><path d="M16 14.6c2.8.2 4.6 2 5.5 5"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.1 2.1 0 0 1-3-3z"/><path d="M14.7 6.3 17 4l3 3-2.3 2.3"/>',
    chart: '<path d="M4 20V11M10 20V5M16 20v-6M2 20h20"/>',
    check: '<path d="M5 12.5 10 17 19.5 7"/>',
    truck: '<rect x="2" y="7" width="12" height="9" rx="1.5"/><path d="M14 10h4l3 3v3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
    shield: '<path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>',
    chat: '<path d="M4 5h16v11H9.5L4 20.5z"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4.5 2 4.5H5"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    micoff: '<path d="M3 3l18 18"/><path d="M9 9v2a3 3 0 0 0 5 2.2M15 10V6a3 3 0 0 0-5.8-1"/><path d="M5 11a7 7 0 0 0 11.5 5.3M19 11a7 7 0 0 1-.5 2.5M12 18v3"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10.5 5-3v9l-5-3"/>',
    play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/>',
    cart: '<path d="M3 4h3l2.4 11h10.2L21 8H7"/><circle cx="10" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
    fire: '<path d="M12 3c.8 3.6 5 5.4 5 10.2a5 5 0 0 1-10 0c0-2.6 1.6-3.8 2-6.4 1.3.9 2 2 2 3.2 1-1.8 1.4-4.2 1-7z"/>',
    star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
    music: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    guitar: '<path d="m13.5 10.5 6.2-6.2M18 3l3 3"/><path d="M10.6 9.2c-1.6-.9-3.6-.6-4.6.7-.8 1-.4 2.3-1.7 3.2-1.9 1.3-1.3 4.4 1 5.9 2.2 1.5 5 1.7 6.2-.4.8-1.4 2.2-1 3-2.1 1-1.3.9-3.2-.2-4.4z"/><circle cx="9.6" cy="14.4" r="1.3"/>',
    reset: '<path d="M4 4v6h6"/><path d="M5 15a7.5 7.5 0 1 0 1.8-7.8L4 10"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    alert: '<path d="M12 3.5 22 20.5H2z"/><path d="M12 10v4.5M12 17.5v.2"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 1 0-4V6H3z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
    eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
    eyeoff: '<path d="M3 3l18 18"/><path d="M10.6 5.6A10 10 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17 17 0 0 1-3.2 3.9M6.6 6.6C3.7 8.4 2 12 2 12s3.6 6.5 10 6.5c1.6 0 3-.4 4.3-1"/>',
    camera: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.4"/>',
    send: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
    sparkle: '<path d="M12 3c.6 4.2 2.4 6.3 7 7-4.6.8-6.4 2.8-7 7-.6-4.2-2.4-6.2-7-7 4.6-.7 6.4-2.8 7-7z"/>',
    home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>'
  };

  RIFF.icon = function (name, size) {
    size = size || 18;
    return (
      '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>'
    );
  };

  RIFF.statusBadge = function (status) {
    var cls = {
      'Disponível': 's-ok',
      'Alugado': 's-amber',
      'Em Manutenção': 's-red',
      'Vendido (Rent to Own)': 's-muted',
      'Aberto': 's-amber',
      'Respondido': 's-blue',
      'Encerrado': 's-muted',
      'Agendado': 's-amber',
      'Na Bancada do Luthier': 's-blue',
      'Pronto para Devolução': 's-ok',
      'Pendente': 's-amber'
    }[status] || 's-muted';
    return '<span class="badge ' + cls + '">' + RIFF.esc(status) + '</span>';
  };

  RIFF.avatar = function (name, size, hue) {
    var parts = String(name || '?').trim().split(/\s+/);
    var ini = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
    if (hue == null) {
      hue = 0;
      for (var i = 0; i < name.length; i++) hue = (hue * 31 + name.charCodeAt(i)) % 360;
    }
    size = size || 40;
    return (
      '<span class="avatar" style="width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * 0.38) +
      'px;background:linear-gradient(135deg,hsl(' + hue + ' 55% 42%),hsl(' + ((hue + 40) % 360) + ' 60% 28%))">' + RIFF.esc(ini) + '</span>'
    );
  };

  /* ---------------------------------------------------------------
     Eventos (integração entre telas)
     --------------------------------------------------------------- */
  var listeners = {};
  RIFF.on = function (evt, fn) {
    (listeners[evt] = listeners[evt] || []).push(fn);
  };
  RIFF.emit = function (evt, data) {
    (listeners[evt] || []).forEach(function (fn) {
      try { fn(data); } catch (e) { console.error(e); }
    });
  };

  /* ---------------------------------------------------------------
     Estado inicial (lote piloto real das Entregas 1.7 e 1.8)
     --------------------------------------------------------------- */
  function seed() {
    var now = Date.now();
    var miguel = 'miguel@aluno.oriff.com.br';
    var lucas = 'lucas@aluno.oriff.com.br';
    return {
      v: 1,
      profile: 'aluno',
      session: miguel,
      accounts: [
        {
          name: 'Miguel Santos da Silva', email: miguel, pass: RIFF.hash('oriff2026'), phone: '(19) 99812-4410',
          cpf: '', cep: '13025-320', street: 'Rua Maria Monteiro', number: '410', complement: '', bairro: 'Cambuí',
          city: 'Campinas', uf: 'SP', level: 'Iniciante', styles: ['Rock', 'Indie'], instrument: 'Guitarra',
          quiz: { played: 1, minutes: 1, song: 'smoke' }, createdAt: now - 125 * DAY, lgpdAt: now - 125 * DAY
        },
        {
          name: 'Lucas Martins', email: lucas, pass: RIFF.hash('oriff2026'), phone: '(19) 98123-7788', cpf: '',
          cep: '13084-010', street: '', number: '', complement: '', bairro: 'Barão Geraldo', city: 'Campinas', uf: 'SP',
          level: 'Intermediário', styles: ['Blues', 'MPB'], instrument: 'Guitarra', quiz: { played: 2, minutes: 1, song: 'tempo' },
          createdAt: now - 70 * DAY, lgpdAt: now - 70 * DAY
        }
      ],
      orders: [
        {
          id: '#RIFF-2026-0817', kind: 'assinatura', email: miguel, name: 'Miguel Santos da Silva', plan: 'trimestral', app: 'premium',
          serial: 'RIFF-GTR-001', tracking: 'RIFF-CPS-88412-BR', stage: 2, status: 'ativo', createdAt: now - 122 * DAY,
          items: [], freight: 0,
          log: [
            { at: now - 122 * DAY, text: 'Pedido confirmado. Kit em separação e regulagem em bancada no Hub Campinas.' },
            { at: now - 2 * DAY, text: 'Kit saiu para entrega na Hardcase Rígida. Notificação enviada por e-mail e WhatsApp.' }
          ]
        },
        {
          id: '#RIFF-2026-0821', kind: 'assinatura', email: lucas, name: 'Lucas Martins', plan: 'mensal', app: 'freemium',
          serial: 'RIFF-GTR-002', tracking: 'RIFF-CPS-88530-BR', stage: 3, status: 'ativo', createdAt: now - 68 * DAY,
          items: [], freight: 0, log: [{ at: now - 66 * DAY, text: 'Kit entregue ao aluno.' }]
        }
      ],
      nextOrder: 842,
      inventory: [
        { serial: 'RIFF-GTR-001', model: 'Cedro Rosa / Marfim', client: 'Miguel Santos da Silva', status: 'Alugado', lastReg: RIFF.isoDay(new Date(now - 14 * DAY)) },
        { serial: 'RIFF-GTR-002', model: 'Cedro Rosa / Marfim', client: 'Lucas Martins', status: 'Alugado', lastReg: RIFF.isoDay(new Date(now - 30 * DAY)) },
        { serial: 'RIFF-GTR-003', model: 'Cedro Rosa / Marfim', client: 'Hub Campinas (bancada)', status: 'Em Manutenção', lastReg: RIFF.isoDay(new Date(now - 45 * DAY)) },
        { serial: 'RIFF-GTR-004', model: 'Cedro Rosa / Marfim', client: '', status: 'Disponível', lastReg: RIFF.isoDay(new Date(now - 9 * DAY)) }
      ],
      passports: {
        'RIFF-GTR-001': { serial: 'RIFF-GTR-001', acao: 1.5, cordas: '.009 novas', trastes: true, braco: true, ponte: true, eletrica: true, luthier: 'Rafael Tavares', date: now - 14 * DAY, obs: 'Regulagem de entrega. Tensor ajustado e oitavas conferidas.' },
        'RIFF-GTR-002': { serial: 'RIFF-GTR-002', acao: 1.5, cordas: '.010 novas', trastes: true, braco: true, ponte: true, eletrica: true, luthier: 'Rafael Tavares', date: now - 30 * DAY, obs: 'Aluno pediu encordoamento .010.' },
        'RIFF-GTR-003': { serial: 'RIFF-GTR-003', acao: 1.8, cordas: 'Rompida (1ª corda)', trastes: true, braco: false, ponte: true, eletrica: false, luthier: 'Rafael Tavares', date: now - 45 * DAY, obs: 'Retornou com ruído no captador da ponte. Aguardando revisão completa.' },
        'RIFF-GTR-004': { serial: 'RIFF-GTR-004', acao: 1.5, cordas: '.009 novas', trastes: true, braco: true, ponte: true, eletrica: true, luthier: 'Rafael Tavares', date: now - 9 * DAY, obs: 'Pronta para nova locação.' }
      },
      laudos: [],
      tickets: [
        {
          id: 'TK-1027', email: lucas, name: 'Lucas Martins', reason: 'Dúvida sobre coleta/fatura',
          desc: 'Minha fatura de novembro veio com a data de vencimento diferente. Posso alinhar com a coleta da hardcase?',
          status: 'Aberto', createdAt: now - 5 * 3600000, replies: []
        }
      ],
      nextTicket: 1028,
      maintenance: [
        { id: 'MN-301', email: lucas, name: 'Lucas Martins', serial: 'RIFF-GTR-002', date: RIFF.isoDay(new Date(now + 5 * DAY)), time: '10:30', mode: 'hub', services: ['Troca de cordas', 'Ajuste de ação'], code: 'Hub Campinas', status: 'Agendado', createdAt: now - DAY }
      ],
      nextMaint: 302,
      posts: [
        {
          id: 'p1', author: 'Ana Clara Lopes', email: 'ana@aluno.oriff.com.br', bairro: 'Barão Geraldo', createdAt: now - 3 * 3600000,
          text: 'Primeira semana tentando a pestana do F. Ainda trasteja, mas hoje saiu limpo duas vezes seguidas! Exercício da semana concluído.',
          likes: 14, liked: false, comments: [{ author: 'Rafa Nunes', text: 'Boa! Aproxima o indicador do traste que melhora muito.', at: now - 2 * 3600000 }], media: null, hidden: false, reported: false
        },
        {
          id: 'p2', author: 'Diego Ramos', email: 'diego@aluno.oriff.com.br', bairro: 'Taquaral', createdAt: now - 7 * 3600000,
          text: 'Alguém do Taquaral topa uma jam de blues no sábado à tarde? Tenho um baixista confirmado, falta guitarra base.',
          likes: 9, liked: false, comments: [], media: null, hidden: false, reported: false
        },
        {
          id: 'p3', author: 'Usuário Promo', email: 'promo@spam.com', bairro: 'Campinas', createdAt: now - 9 * 3600000,
          text: 'GANHE SEGUIDORES AGORA!!! Clique no link da bio e ganhe 5 mil seguidores de graça. Promoção só hoje!!!',
          likes: 0, liked: false, comments: [], media: null, hidden: false, reported: false
        },
        {
          id: 'p4', author: 'Marina Costa', email: 'marina@aluno.oriff.com.br', bairro: 'Cambuí', createdAt: now - 26 * 3600000,
          text: 'Troca rápida de Em para G a 70 BPM no metrônomo do player. Semana passada eu travava em 50. A trilha da IA está funcionando!',
          likes: 21, liked: false, comments: [{ author: 'Lucas Martins', text: 'Mandou bem! Próximo passo é 80 BPM.', at: now - 20 * 3600000 }], media: null, hidden: false, reported: false
        }
      ],
      reports: [],
      community: { requests: {}, chats: {} },
      learning: {},
      revenue: { marketplace: 312.5, ads: 180, premiumBase: 27, retention: 86, adClicks: 0 },
      ui: { cart: [], plan: 'trimestral', app: 'premium', tab: 'kit', laudoSerial: null }
    };
  }

  /* ---------------------------------------------------------------
     Persistência
     --------------------------------------------------------------- */
  var state;

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.v === 1) return parsed;
      }
    } catch (e) { /* navegador sem storage: segue em memória */ }
    return seed();
  }

  RIFF.save = function () {
    try {
      var copy = JSON.parse(JSON.stringify(state, function (k, v) {
        // mídias anexadas ficam só em memória (blob URL não sobrevive ao reload)
        if (k === 'media' && v && v.url && v.url.indexOf('blob:') === 0) return { type: v.type, name: v.name, url: null };
        return v;
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
    } catch (e) { /* ignora */ }
    updateNavBadges();
    RIFF.emit('change', state);
  };

  RIFF.reset = function () {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignora */ }
    state = seed();
    RIFF.save();
    location.hash = '#/inicio';
    render();
  };

  Object.defineProperty(RIFF, 'state', { get: function () { return state; } });

  RIFF.user = function () {
    return state.accounts.find(function (a) { return a.email === state.session; }) || state.accounts[0];
  };

  RIFF.userOrder = function (email) {
    email = email || RIFF.user().email;
    var list = state.orders.filter(function (o) { return o.email === email && o.kind === 'assinatura'; });
    return list[list.length - 1] || null;
  };

  RIFF.learning = function (email) {
    email = email || RIFF.user().email;
    if (!state.learning[email]) {
      state.learning[email] = email === 'miguel@aluno.oriff.com.br'
        ? { xp: 340, streak: 4, lastDay: RIFF.isoDay(new Date(Date.now() - DAY)), done: ['acordes-abertos'] }
        : { xp: 0, streak: 0, lastDay: null, done: [] };
    }
    return state.learning[email];
  };

  RIFF.stockAvailable = function () {
    return state.inventory.filter(function (i) { return i.status === 'Disponível'; }).length;
  };

  /* ---------------------------------------------------------------
     Modal e toast
     --------------------------------------------------------------- */
  RIFF.modal = function (opts) {
    var wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML =
      '<div class="modal' + (opts.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + RIFF.esc(opts.title || '') + '">' +
      '<div class="modal-head"><h3>' + (opts.icon ? RIFF.icon(opts.icon, 20) : '') + RIFF.esc(opts.title || '') + '</h3>' +
      '<button class="icon-btn" data-close aria-label="Fechar">' + RIFF.icon('x') + '</button></div>' +
      '<div class="modal-body"></div>' +
      (opts.actions && opts.actions.length ? '<div class="modal-foot"></div>' : '') +
      '</div>';
    var body = wrap.querySelector('.modal-body');
    if (typeof opts.body === 'string') body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey);
      wrap.classList.add('out');
      setTimeout(function () { wrap.remove(); }, 160);
      if (opts.onClose) opts.onClose();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    if (opts.actions) {
      var foot = wrap.querySelector('.modal-foot');
      opts.actions.forEach(function (a) {
        var b = document.createElement('button');
        b.className = 'btn ' + (a.kind ? 'btn-' + a.kind : 'btn-ghost');
        b.innerHTML = (a.icon ? RIFF.icon(a.icon) : '') + '<span>' + RIFF.esc(a.label) + '</span>';
        b.addEventListener('click', function () {
          var keep = a.onClick ? a.onClick(close, wrap) : false;
          if (keep !== true) close();
        });
        foot.appendChild(b);
      });
    }
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('[data-close]').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(wrap);
    var first = wrap.querySelector('input, select, textarea');
    if (first && !opts.noFocus) setTimeout(function () { first.focus(); }, 60);
    return { el: wrap, body: body, close: close };
  };

  RIFF.toast = function (msg, opts) {
    opts = opts || {};
    var box = document.getElementById('toasts');
    var t = document.createElement('div');
    t.className = 'toast t-' + (opts.type || 'ok');
    t.innerHTML = RIFF.icon(opts.icon || (opts.type === 'warn' ? 'alert' : opts.type === 'info' ? 'bell' : 'check'), 18) +
      '<div class="toast-msg">' + RIFF.esc(msg) + '</div>';
    if (opts.action) {
      var b = document.createElement('button');
      b.className = 'btn btn-sm btn-ghost';
      b.textContent = opts.action.label;
      b.addEventListener('click', function () { opts.action.go ? RIFF.go(opts.action.go) : opts.action.onClick(); t.remove(); });
      t.appendChild(b);
    }
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 250); }, opts.duration || 5200);
  };

  /* ---------------------------------------------------------------
     Áudio compartilhado (afinador, metrônomo, tablatura)
     --------------------------------------------------------------- */
  var audioCtx = null;
  RIFF.audioCtx = function () {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  };

  /* ---------------------------------------------------------------
     Registro de telas e rotas
     --------------------------------------------------------------- */
  var defs = {};
  var active = null;

  RIFF.register = function (n, def) {
    defs[n] = def;
  };

  RIFF.go = function (target) {
    var hash = target === 'inicio' || target == null ? '#/inicio' : '#/tela-' + target;
    if (location.hash === hash) render();
    else location.hash = hash;
  };

  RIFF.rerender = function () {
    render(true);
  };

  function route() {
    var m = location.hash.match(/^#\/tela-(\d+)/);
    var n = m ? Number(m[1]) : null;
    return n && n >= 1 && n <= 10 ? n : null;
  }

  function setProfile(p) {
    state.profile = p;
    RIFF.save();
  }

  function renderTopbar(n) {
    var bar = document.getElementById('topbar');
    var prof = RIFF.PROFILES[state.profile];
    var user = RIFF.user();
    bar.innerHTML =
      '<div class="topbar-row">' +
        '<a class="brand" href="#/inicio" aria-label="O RIFF, início">' +
          '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path d="M16 2.5c7 0 12.5 3.6 12.5 9.5 0 7.6-7.4 15.6-12.5 17.5C10.9 27.6 3.5 19.6 3.5 12 3.5 6.1 9 2.5 16 2.5z" fill="#E58E26"/>' +
          '<path d="M10 17.5c2-1.2 3.4-4.8 6-4.8s3.6 3 6 2" stroke="#0B0C10" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>' +
          '<span class="brand-name">O <b>RIFF</b></span>' +
        '</a>' +
        '<div class="profile-switch" role="tablist" aria-label="Trocar visão do sistema">' +
          Object.keys(RIFF.PROFILES).map(function (k) {
            var p = RIFF.PROFILES[k];
            return '<button role="tab" class="seg" data-profile="' + k + '" aria-selected="' + (k === state.profile) + '">' +
              RIFF.icon(p.icon, 16) + '<span>' + p.label + '</span></button>';
          }).join('') +
        '</div>' +
        '<div class="topbar-right">' +
          (state.profile === 'aluno' ? '<span class="hello">' + RIFF.avatar(user.name, 28) + '<span class="hide-sm">' + RIFF.esc(user.name.split(' ')[0]) + '</span></span>' : '') +
          '<button class="icon-btn" id="btnReset" title="Reiniciar dados da demonstração" aria-label="Reiniciar dados da demonstração">' + RIFF.icon('reset') + '</button>' +
        '</div>' +
      '</div>' +
      '<nav class="screen-nav" aria-label="Telas da visão ' + RIFF.esc(prof.label) + '">' +
        '<a class="chip' + (n ? '' : ' active') + '" href="#/inicio">' + RIFF.icon('home', 15) + '<span>Início</span></a>' +
        prof.screens.map(function (sn) {
          var s = RIFF.SCREENS[sn - 1];
          return '<a class="chip' + (sn === n ? ' active' : '') + '" href="#/tela-' + sn + '"><span class="chip-n">' + sn + '</span><span>' + s.short + '</span><span class="nav-badge" data-badge="' + sn + '"></span></a>';
        }).join('') +
      '</nav>';

    bar.querySelectorAll('[data-profile]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-profile');
        setProfile(p);
        RIFF.go(RIFF.PROFILES[p].screens[0]);
      });
    });
    bar.querySelector('#btnReset').addEventListener('click', function () {
      RIFF.modal({
        title: 'Reiniciar demonstração',
        icon: 'reset',
        body: '<p>Volta todos os dados para o lote piloto original (RIFF-GTR-001 a 004), apagando cadastros, pedidos, tickets e denúncias feitos nesta sessão.</p>',
        actions: [{ label: 'Cancelar' }, { label: 'Reiniciar', kind: 'danger', onClick: function () { RIFF.reset(); } }]
      });
    });
    updateNavBadges();
  }

  function updateNavBadges() {
    if (!state) return;
    var counts = {
      8: RIFF.stockAvailable() <= 1 ? '!' : '',
      10: state.tickets.filter(function (t) { return t.status !== 'Encerrado'; }).length +
        state.reports.filter(function (r) { return r.status === 'Pendente'; }).length
    };
    document.querySelectorAll('[data-badge]').forEach(function (el) {
      var v = counts[el.getAttribute('data-badge')];
      el.textContent = v ? v : '';
      el.classList.toggle('on', !!v);
    });
  }

  function renderHome(root) {
    var groups = ['aluno', 'luthier', 'admin'];
    root.innerHTML =
      '<section class="hero">' +
        '<div class="hero-copy">' +
          '<p class="eyebrow">Entrega 2.4 • Prototipagem de Telas • Grupo 8 • PUC Campinas</p>' +
          '<h1>Aprenda guitarra com um instrumento <span class="hl">regulado</span> e uma comunidade <span class="hl2">de verdade</span>.</h1>' +
          '<p class="lead">O RIFF é a plataforma de assinatura de instrumentos regulados e comunidade musical de Campinas: kit físico com regulagem de bancada, app com afinador e trilha por IA, salas ao vivo e marketplace de parceiros.</p>' +
          '<div class="row wrap">' +
            '<a class="btn btn-primary" href="#/tela-1">' + RIFF.icon('user') + '<span>Começar pelo cadastro</span></a>' +
            '<a class="btn btn-ghost" href="#/tela-2">' + RIFF.icon('guitar') + '<span>Ver o kit e os planos</span></a>' +
          '</div>' +
        '</div>' +
        '<div class="hero-art">' + (RIFF.guitarSVG ? RIFF.guitarSVG(280) : '') + '</div>' +
      '</section>' +
      '<section class="grid cols-3">' +
        groups.map(function (g) {
          var p = RIFF.PROFILES[g];
          return '<div class="card">' +
            '<div class="card-head"><h3>' + RIFF.icon(p.icon, 20) + p.label + '</h3></div>' +
            '<ul class="screen-list">' + p.screens.map(function (sn) {
              var s = RIFF.SCREENS[sn - 1];
              var ok = !!defs[sn];
              return '<li><a href="#/tela-' + sn + '"><span class="chip-n">' + sn + '</span><span><b>' + RIFF.esc(s.title) + '</b>' +
                '<small>' + s.us + ' • Módulo ' + s.module + (ok ? '' : ' • aguardando commit') + '</small></span>' + RIFF.icon('arrow', 16) + '</a></li>';
            }).join('') + '</ul></div>';
        }).join('') +
      '</section>' +
      '<section class="card">' +
        '<div class="card-head"><h3>' + RIFF.icon('sparkle', 20) + 'Roteiro sugerido para a apresentação (Entrega 2.5)</h3></div>' +
        '<ol class="flow">' +
          '<li><b>Dor de mercado e Kit Físico</b> na Tela 2 (ficha técnica, planos e Rent to Own).</li>' +
          '<li><b>Cadastro com LGPD e Quiz IA</b> (Tela 1), depois <b>Rastreio e Passaporte</b> (Tela 3).</li>' +
          '<li><b>Afinador ao vivo e Player Tudo em Um</b> (Tela 5).</li>' +
          '<li><b>Match IA, Salas WebRTC e denúncia no Feed</b> (Telas 6 e 7).</li>' +
          '<li><b>Luthier libera a guitarra</b> (Tela 9) e o <b>Admin</b> responde o ticket e oculta o post (Telas 8 e 10).</li>' +
        '</ol>' +
        '<p class="muted small">Dica: abra o site em duas abas (uma como Aluno e outra como Administrador) para ver as integrações acontecendo em tempo real.</p>' +
      '</section>';
  }

  function renderScreen(n, root) {
    var s = RIFF.SCREENS[n - 1];
    var mod = RIFF.MODULES[s.module];
    var def = defs[n];
    var head = document.createElement('header');
    head.className = 'screen-head';
    head.innerHTML =
      '<p class="eyebrow"><span class="tela-n">Tela ' + n + '</span> • ' + s.us + ' • Módulo ' + s.module + ' • ' + RIFF.PROFILES[s.profile].label + '</p>' +
      '<h1>' + RIFF.esc(s.title) + '</h1>' +
      (def && def.lead ? '<p class="lead">' + def.lead + '</p>' : '');
    root.appendChild(head);
    var body = document.createElement('div');
    body.className = 'screen-body';
    root.appendChild(body);
    if (!def) {
      body.innerHTML =
        '<div class="card empty">' + RIFF.icon('box', 36) +
        '<h3>Módulo ' + s.module + ' ainda não publicado</h3>' +
        '<p class="muted">Esta tela é desenhada pelo arquivo <code>' + mod.file + '</code>, de responsabilidade de ' + mod.owner + '. Assim que o commit entrar no repositório, ela aparece aqui.</p></div>';
      return;
    }
    try {
      def.render(body);
    } catch (e) {
      console.error(e);
      body.innerHTML = '<div class="card empty">' + RIFF.icon('alert', 36) + '<h3>Erro ao desenhar a tela</h3><p class="muted">' + RIFF.esc(e.message) + '</p></div>';
    }
  }

  function render(keepScroll) {
    if (active && active.leave) {
      try { active.leave(); } catch (e) { console.error(e); }
    }
    active = null;
    var n = route();
    if (n) {
      var s = RIFF.SCREENS[n - 1];
      if (s.profile !== state.profile) setProfile(s.profile);
    }
    renderTopbar(n);
    var root = document.getElementById('view');
    var y = window.scrollY;
    root.innerHTML = '';
    if (n) {
      active = defs[n] || null;
      renderScreen(n, root);
      document.title = 'Tela ' + n + ' • ' + RIFF.SCREENS[n - 1].short + ' | O RIFF';
    } else {
      renderHome(root);
      document.title = 'O RIFF | Protótipo navegável (Entrega 2.4)';
    }
    if (keepScroll === true) window.scrollTo(0, y);
    else window.scrollTo(0, 0);
  }

  RIFF.current = route;

  /* Abas diferentes do navegador ficam sincronizadas (tempo real) */
  window.addEventListener('storage', function (e) {
    if (e.key !== STORAGE_KEY) return;
    state = load();
    updateNavBadges();
    var n = route();
    var typing = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    var hasModal = document.querySelector('.modal-backdrop');
    if (n && defs[n] && defs[n].live && !typing && !hasModal) render(true);
  });

  window.addEventListener('hashchange', function () { render(); });

  document.addEventListener('DOMContentLoaded', function () {
    state = load();
    if (!location.hash) location.hash = '#/inicio';
    render();
  });
})();
