/* =============================================================================
   AIOS · Grupos VIP — shell do painel.
   Sidebar, topbar, guarda de login, dois jeitos de editar dados
   (tabela numérica em linha e lista de cards com mídia), drawer e toasts.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AIOS = {};
  var S = window.Store;

  /* ---------- formatadores ------------------------------------------------ */
  A.brl = function (n) {
    return 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  };
  A.brl2 = function (n) {
    return 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  A.iniciais = function (nome) {
    return String(nome).split(' ').filter(Boolean).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase();
  };
  A.dataBR = function (iso) {
    if (!iso) return '-';
    var p = String(iso).slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] : iso;
  };
  A.quando = function (iso) {
    var d = new Date(iso);
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') +
      ' · ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  };
  A.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  A.toast = function (msg) {
    var wrap = document.querySelector('.toasts');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toasts'; document.body.appendChild(wrap); }
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = ico('check', 15) + '<span>' + A.esc(msg) + '</span>';
    wrap.appendChild(t);
    setTimeout(function () { t.style.transition = 'opacity .25s'; t.style.opacity = '0'; }, 2600);
    setTimeout(function () { t.remove(); }, 2900);
  };

  /* ---------- ícones ------------------------------------------------------ */
  var PATHS = {
    grid:    '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    funnel:  '<path d="M3 4h18l-7 8v7l-4 2v-9L3 4z"/>',
    flame:   '<path d="M12 3s5 4.5 5 9a5 5 0 01-10 0c0-2 1-3 1-3s.5 2 2 2c0-3 2-5 2-8z"/>',
    repeat:  '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>',
    tag:     '<path d="M3 11V4a1 1 0 011-1h7l9 9-8 8-9-9z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
    gift:    '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12"/><path d="M12 9c-1.6-2.2-3-3.6-4.6-3.6a2 2 0 100 4M12 9c1.6-2.2 3-3.6 4.6-3.6a2 2 0 110 4"/>',
    play:    '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5v-7z"/>',
    chart:   '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    history: '<path d="M3 12a9 9 0 109-9 9 9 0 00-7 3.4"/><path d="M3 3v4h4"/><path d="M12 7v5l3.5 2"/>',
    menu:    '<path d="M3 6h18M3 12h18M3 18h18"/>',
    close:   '<path d="M6 6l12 12M18 6L6 18"/>',
    check:   '<path d="M4 12.5l5 5L20 6.5"/>',
    plus:    '<path d="M12 5v14M5 12h14"/>',
    trash:   '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
    exit:    '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    clip:    '<path d="M21 11.5l-8.6 8.6a5 5 0 01-7.1-7.1l9-9a3.4 3.4 0 014.8 4.8l-9 9a1.8 1.8 0 01-2.5-2.5l8.1-8.1"/>',
    image:   '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 17l5-5 4 4 3-2 4 4"/>',
    film:    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16M16 4v16M3 12h18"/>',
    link:    '<path d="M10 13a4 4 0 005.7 0l3-3a4 4 0 10-5.7-5.7L11.5 6"/><path d="M14 11a4 4 0 00-5.7 0l-3 3A4 4 0 108 19.7L9.5 18"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    seta:    '<path d="M12 5v14M6 13l6 6 6-6"/>'
  };
  function ico(nome, tam) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round"' + (tam ? ' width="' + tam + '" height="' + tam + '"' : '') +
      '>' + (PATHS[nome] || '') + '</svg>';
  }
  A.ico = ico;

  /* ---------- navegação ----------------------------------------------------
     Agrupada pela ordem real da operação, não numa lista solta de nove itens.
     Quem abre o painel entende a história: encher o grupo → o que foi
     definido → o dia e o resultado.
     ----------------------------------------------------------------------- */
  var NAV = [
    { id: 'dashboard',   href: 'index.html',       nome: 'Visão geral',     icone: 'grid' },

    { grupo: 'Encher o grupo' },
    { id: 'captacao',    href: 'captacao.html',    nome: 'Captação',        icone: 'funnel' },
    { id: 'aquecimento', href: 'aquecimento.html', nome: 'Aquecimento',     icone: 'flame' },
    { id: 'remarketing', href: 'remarketing.html', nome: 'Remarketing',     icone: 'repeat' },

    { grupo: 'O que foi definido' },
    { id: 'promocoes',   href: 'promocoes.html',   nome: 'Promoções',       icone: 'tag' },
    { id: 'iscas',       href: 'iscas.html',       nome: 'Iscas e Brindes', icone: 'gift' },

    { grupo: 'O dia e o resultado' },
    { id: 'abertura',    href: 'abertura.html',    nome: 'Dia da abertura', icone: 'play' },
    { id: 'relatorio',   href: 'relatorio.html',   nome: 'Relatório',       icone: 'chart' },
    { id: 'historico',   href: 'historico.html',   nome: 'Histórico',       icone: 'history' }
  ];

  var TITULOS = {
    dashboard:   ['Visão geral', 'Painel do grupo'],
    captacao:    ['Disparos para captação', 'Funil de entrada'],
    aquecimento: ['Aquecimento do grupo', 'Mensagens, enquetes e vídeos'],
    remarketing: ['Disparos de remarketing', 'Recuperação'],
    promocoes:   ['Decisões de promoções', 'Produtos, valores e brinde'],
    iscas:       ['Iscas e Brindes', 'Brindes, presentes, prêmios e sorteios'],
    abertura:    ['Gestão do dia da abertura', 'Roteiro e vendas'],
    relatorio:   ['Relatório do grupo', 'Consolidado'],
    historico:   ['Histórico de alterações', 'Quem mexeu no quê']
  };

  /* ---------- shell ------------------------------------------------------- */
  function montaShell() {
    var side = document.getElementById('sidebar');
    if (!side) return;

    /* URL que não bate com nenhum cliente da lista. Melhor dizer isso do que
       abrir um painel em branco que parece o de alguém. */
    if (S.semCliente) {
      var app = document.querySelector('.app');
      if (app) {
        app.outerHTML =
          '<div class="recado">' +
            '<h1>Painel não encontrado</h1>' +
            '<p>O endereço <b>' + A.esc(location.pathname) + '</b> não corresponde a ' +
            'nenhum cliente cadastrado. Confira o link ou volte para escolher um painel.</p>' +
            '<a class="btn btn-primary" href="/">Ver todos os painéis</a>' +
          '</div>';
      }
      return;
    }

    var pagina = document.body.dataset.page;
    var u = S.usuario();          // painel aberto: sempre há uma equipe ativa

    /* A barra lateral é do CLIENTE, não da agência. O nome dele é o cabeçalho;
       a marca AIOS não precisa ocupar espaço em toda tela. */
    side.innerHTML =
      '<div class="cli-head">' +
        '<b>' + A.esc(S.dados.grupo.cliente) + '</b>' +
        '<span>' + A.esc(S.dados.grupo.nome || 'Grupo VIP') + '</span>' +
      '</div>' +
      '<nav class="nav">' + NAV.map(function (n) {
        if (n.grupo) return '<div class="nav-grupo">' + n.grupo + '</div>';
        return '<a href="' + n.href + '"' + (n.id === pagina ? ' aria-current="page"' : '') + '>' +
          ico(n.icone) + '<span>' + n.nome + '</span></a>';
      }).join('') + '</nav>';

    var top = document.getElementById('topbar');
    if (top) {
      var t = TITULOS[pagina] || ['', ''];
      /* Status e equipe saíram da barra lateral (eram ruído) e vieram para o
         topo, discretos. O status só fala quando precisa; a equipe é um chip
         de um clique, porque é ele que assina o histórico. */
      top.innerHTML =
        '<button class="hamburger" id="menu-btn" aria-label="Abrir menu">' + ico('menu') + '</button>' +
        '<div class="topbar-titulo"><div class="crumb">' + t[1] + '</div><h1>' + t[0] + '</h1></div>' +
        '<div class="topbar-right">' +
          '<span class="sync" id="sync"></span>' +
          '<button class="quem" id="quem" title="Trocar de equipe. É este nome que fica no histórico.">' +
            '<span class="avatar' + (u.id === 'aios' ? ' on-grad' : '') + '">' + A.iniciais(u.nome) + '</span>' +
            '<span class="quem-nome">' + A.esc(u.nome) + '</span>' +
          '</button>' +
        '</div>';

      pintaSync();

      document.getElementById('quem').addEventListener('click', function () {
        var equipes = S.equipe();
        var outra = equipes.find(function (e) { return e.id !== u.id; });
        if (!outra) return;
        S.trocarEquipe(outra.id);
        montaShell();
        A.toast('Agora editando como ' + outra.nome);
      });

      var mb = document.getElementById('menu-btn');
      if (mb) mb.addEventListener('click', function () {
        side.classList.add('open');
        scrim(true, function () { side.classList.remove('open'); });
      });

      /* O título estava aparecendo duas vezes: pequeno aqui no topo e grande
         logo abaixo. Isso é eco, não hierarquia. Então o topo fica calado
         enquanto o título grande está à vista, e só assume quando você rola e
         o perde. */
      var h1 = document.querySelector('.page-head h1, .rpt-masthead h1');
      var tt = top.querySelector('.topbar-titulo');
      if (h1 && tt && 'IntersectionObserver' in window) {
        tt.classList.add('eco');
        new IntersectionObserver(function (e) {
          tt.classList.toggle('eco', e[0].isIntersecting);
        }, { threshold: 0 }).observe(h1);
      }
    }
  }

  /* ---------- estado da sincronia -----------------------------------------
     O painel é compartilhado: quem edita precisa saber se o que está na tela
     já chegou no banco, e quando o outro time mexeu.
     ----------------------------------------------------------------------- */
  var ESTADOS = {
    carregando:  ['',      'Carregando'],
    salvando:    ['',      'Salvando'],
    ok:          ['ok',    'Salvo'],
    offline:     ['aviso', 'Sem conexão'],
    'sem-banco': ['erro',  'Não está salvando'],
    /* O painel não existe no banco. Antes isto passava como "Salvo" e o que
       era digitado sumia sem aviso. */
    'sem-painel':  ['erro', 'Painel não existe no banco'],
    'sem-cliente': ['erro', 'Endereço desconhecido']
  };

  /* Aberto como arquivo (pré-visualização do editor) em vez de pela URL da
     Vercel: aqui /api/painel não existe, então nunca vai haver banco. Isso
     não é falha — mas a mensagem de "sem conexão" faz parecer que é. */
  var PREVIA = location.protocol === 'file:';

  /* Regra: o status fala pouco. Quando está tudo certo, um ponto verde e a
     palavra "Salvo" bastam — nada de parágrafo. Quando algo deu errado, aí
     sim ele grita, porque perder o que foi digitado é o pior que pode
     acontecer aqui. */
  function pintaSync() {
    var el = document.getElementById('sync');
    if (!el) return;

    if (PREVIA && (S.estado === 'offline' || S.estado === 'sem-banco')) {
      el.className = 'sync aviso';
      el.title = 'O banco só responde na URL publicada. Aqui nada é salvo de verdade.';
      el.innerHTML = '<i></i>Pré-visualização';
      return;
    }

    var e = ESTADOS[S.estado] || ESTADOS.carregando;
    el.className = 'sync ' + (e[0] || '');
    el.title = S.estado === 'ok' && S.atualizadoPor
      ? 'Última gravação por ' + S.atualizadoPor
      : e[1];
    el.innerHTML = '<i></i>' + e[1];
  }

  document.addEventListener('aios:sincronia', pintaSync);

  /* O outro time gravou. Não posso recarregar no meio de uma digitação. */
  var recarregarDepois = false;
  document.addEventListener('aios:remoto', function (ev) {
    var quem = (ev.detail && ev.detail.quem) || 'a outra equipe';
    var digitando = document.activeElement && (
      document.activeElement.tagName === 'INPUT' ||
      document.activeElement.tagName === 'TEXTAREA' ||
      document.activeElement.tagName === 'SELECT'
    );
    A.toast(quem + ' alterou o painel');
    if (digitando) { recarregarDepois = true; return; }
    setTimeout(function () { location.reload(); }, 900);
  });
  document.addEventListener('focusout', function () {
    if (recarregarDepois) setTimeout(function () { location.reload(); }, 400);
  });

  /* ---------- scrim / drawer ---------------------------------------------- */
  var scrimEl;
  function scrim(aberto, aoFechar) {
    if (!scrimEl) {
      scrimEl = document.createElement('div');
      scrimEl.className = 'scrim';
      document.body.appendChild(scrimEl);
    }
    scrimEl.classList.toggle('open', !!aberto);
    scrimEl.onclick = function () {
      scrimEl.classList.remove('open');
      if (aoFechar) aoFechar();
    };
  }

  A.drawer = function (opts) {
    var el = document.getElementById('drawer');
    if (!el) {
      el = document.createElement('aside');
      el.id = 'drawer';
      el.className = 'drawer';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      document.body.appendChild(el);
    }
    el.className = 'drawer' + (opts.largo ? ' drawer-lg' : '');
    el.innerHTML =
      '<div class="drawer-head">' +
        '<div style="flex:1;min-width:0">' +
          (opts.kicker ? '<div class="eyebrow">' + A.esc(opts.kicker) + '</div>' : '') +
          '<h3>' + A.esc(opts.titulo) + '</h3>' +
        '</div>' +
        '<button class="icon-btn" data-close aria-label="Fechar">' + ico('close') + '</button>' +
      '</div>' +
      '<div class="drawer-body">' + opts.corpo + '</div>' +
      (opts.rodape ? '<div class="drawer-foot">' + opts.rodape + '</div>' : '');

    requestAnimationFrame(function () { el.classList.add('open'); });
    scrim(true, fechar);
    el.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', fechar); });
    if (opts.aoAbrir) opts.aoAbrir(el);

    function fechar() {
      el.classList.remove('open');
      scrim(false);
      document.removeEventListener('keydown', esc);
      if (opts.aoFechar) opts.aoFechar();
    }
    function esc(e) { if (e.key === 'Escape') fechar(); }
    document.addEventListener('keydown', esc);
    A.fecharDrawer = fechar;
    return el;
  };

  /* Tabela vazia: a frase diz o que falta e a seta aponta para o botão. A seta
     não repete o texto do botão — o botão já está logo ali, dizendo o que faz.
     Repetir seria o mesmo eco que tiramos do topo. */
  function vazioHTML(texto) {
    return '<div class="empty">' +
      '<b>' + A.esc(texto || 'Nada aqui ainda.') + '</b>' +
      '<div class="dica">' + ico('seta', 16) + '</div>' +
    '</div>';
  }

  /* =========================================================================
     TABELA EDITÁVEL EM LINHA — para grades numéricas (captação, produtos,
     ranking, vendas). Digitou na célula, salvou, virou linha no histórico.
     ====================================================================== */
  A.tabela = function (opts) {
    var el = typeof opts.el === 'string' ? document.getElementById(opts.el) : opts.el;
    var area = opts.area;

    function rotulo(item) { return opts.rotulo ? opts.rotulo(item) : (item.nome || item.titulo || 'item'); }

    function celula(item, c) {
      var v = item[c.k];
      var base = 'data-id="' + item.id + '" data-k="' + c.k + '"';
      switch (c.tipo) {
        case 'num':
        case 'brl':
          return '<input class="cell num" type="number" min="' + (c.min != null ? c.min : 0) +
            '" step="' + (c.tipo === 'brl' ? 10 : 1) + '" value="' + (v == null ? '' : v) + '" ' + base + '>';
        case 'data': return '<input class="cell num" type="date" value="' + A.esc(v) + '" ' + base + '>';
        case 'hora': return '<input class="cell num" type="time" value="' + A.esc(v) + '" ' + base + '>';
        case 'select':
          return '<select class="cell" ' + base + '>' + c.opcoes.map(function (o) {
            return '<option' + (o === v ? ' selected' : '') + '>' + A.esc(o) + '</option>';
          }).join('') + '</select>';
        case 'calc': return '<span class="num small">' + c.calc(item) + '</span>';
        default: return '<input class="cell" type="text" value="' + A.esc(v) + '" ' + base + '>';
      }
    }

    function render() {
      var itens = S.lista(opts.nome);
      var direita = function (c) { return c.tipo === 'num' || c.tipo === 'brl' || c.tipo === 'calc'; };
      var ths = opts.colunas.map(function (c) {
        return '<th' + (c.largura ? ' style="width:' + c.largura + '"' : '') +
          (direita(c) ? ' class="ta-r"' : '') + '>' + c.label + '</th>';
      }).join('');

      var linhas = itens.map(function (item) {
        return '<tr data-row="' + item.id + '">' + opts.colunas.map(function (c) {
          return '<td class="td-cell' + (direita(c) ? ' ta-r' : '') + '">' + celula(item, c) + '</td>';
        }).join('') +
          '<td class="td-cell ta-r"><button class="icon-btn danger" data-del="' + item.id +
            '" title="Remover linha" aria-label="Remover linha">' + ico('trash', 15) + '</button></td></tr>';
      }).join('');

      el.innerHTML =
        '<div class="table-wrap"><table class="table table-edit">' +
          '<thead><tr>' + ths + '<th style="width:44px"></th></tr></thead>' +
          '<tbody>' + (linhas || '<tr><td colspan="' + (opts.colunas.length + 1) + '">' +
            vazioHTML(opts.vazio) + '</td></tr>') + '</tbody>' +
          (opts.total ? '<tfoot><tr>' + opts.total(itens) + '<td></td></tr></tfoot>' : '') +
        '</table></div>' +
        '<button class="btn btn-add" data-add>' + ico('plus', 16) + (opts.rotuloNovo || 'Adicionar linha') + '</button>';

      el.querySelectorAll('.cell').forEach(function (inp) {
        inp.addEventListener('change', function () {
          var item = S.item(opts.nome, inp.dataset.id);
          if (!item) return;
          var val = inp.type === 'number' ? (inp.value === '' ? 0 : Number(inp.value)) : inp.value;
          S.set(opts.nome, item.id, inp.dataset.k, val, area, rotulo(item));
          S.salvar(); render();
          if (opts.aoMudar) opts.aoMudar();
        });
      });

      el.querySelectorAll('[data-del]').forEach(function (b) {
        b.addEventListener('click', function () {
          var item = S.item(opts.nome, b.dataset.del);
          if (!item) return;
          S.remove(opts.nome, item.id, area, rotulo(item));
          S.salvar(); render();
          if (opts.aoMudar) opts.aoMudar();
          A.toast('Linha removida');
        });
      });

      el.querySelector('[data-add]').addEventListener('click', function () {
        var novo = S.add(opts.nome, opts.novo(), area, (opts.rotuloNovo || 'linha').toLowerCase());
        S.salvar(); render();
        if (opts.aoMudar) opts.aoMudar();
        var alvo = el.querySelector('[data-row="' + novo.id + '"] .cell');
        if (alvo) alvo.focus();
      });
    }

    render();
    return { render: render };
  };

  /* =========================================================================
     LISTA DE CARDS — para tarefas com conteúdo e mídia (aquecimento,
     remarketing, roteiro, prêmios). A linha mostra pouco; clicar nela abre o
     card inteiro da tarefa, com todos os campos e a galeria de fotos/vídeos.

     opts: { el, nome, area, colunas:[...], linha(item)->tds, campos:[...],
             novo(), rotulo(item), aoMudar, vazio, rotuloNovo, kicker(item) }
     campos: um bloco por linha do card. Bloco = campo, ou array de campos
             lado a lado. Campo = { k, label, tipo, opcoes, dica, preview }
     ====================================================================== */
  A.cards = function (opts) {
    var el = typeof opts.el === 'string' ? document.getElementById(opts.el) : opts.el;
    var area = opts.area;

    function rotulo(item) { return opts.rotulo ? opts.rotulo(item) : (item.titulo || item.nome || 'item'); }

    /* ---- lista compacta ---- */
    function render() {
      /* opts.filtro: função(item) -> bool. Deixa a página filtrar a lista
         (por tipo, por status) sem duplicar o componente. */
      var itens = S.lista(opts.nome);
      if (typeof opts.filtro === 'function') itens = itens.filter(opts.filtro);
      var ths = opts.colunas.map(function (c) {
        return '<th' + (c.largura ? ' style="width:' + c.largura + '"' : '') +
          (c.ta === 'r' ? ' class="ta-r"' : '') + '>' + c.label + '</th>';
      }).join('');

      var linhas = itens.map(function (item) {
        return '<tr class="row-click" data-open="' + item.id + '" tabindex="0" role="button" ' +
          'aria-label="Abrir card de ' + A.esc(rotulo(item)) + '">' +
          opts.linha(item) +
          '<td class="ta-r nowrap">' +
            '<span class="row-go">' + ico('chevron', 15) + '</span>' +
            '<button class="icon-btn danger" data-del="' + item.id +
              '" title="Remover" aria-label="Remover">' + ico('trash', 15) + '</button>' +
          '</td></tr>';
      }).join('');

      el.innerHTML =
        '<div class="table-wrap"><table class="table table-cards">' +
          '<thead><tr>' + ths + '<th style="width:76px"></th></tr></thead>' +
          '<tbody>' + (linhas || '<tr><td colspan="' + (opts.colunas.length + 1) + '">' +
            vazioHTML(opts.vazio) + '</td></tr>') + '</tbody>' +
        '</table></div>' +
        '<button class="btn btn-add" data-add>' + ico('plus', 16) + (opts.rotuloNovo || 'Adicionar') + '</button>';

      el.querySelectorAll('[data-open]').forEach(function (tr) {
        tr.addEventListener('click', function (e) {
          if (e.target.closest('[data-del]')) return;
          abrir(tr.dataset.open);
        });
        tr.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(tr.dataset.open); }
        });
      });

      el.querySelectorAll('[data-del]').forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          var item = S.item(opts.nome, b.dataset.del);
          if (!item) return;
          S.remove(opts.nome, item.id, area, rotulo(item));
          S.salvar(); render();
          if (opts.aoMudar) opts.aoMudar();
          A.toast('Removido');
        });
      });

      el.querySelector('[data-add]').addEventListener('click', function () {
        var novo = S.add(opts.nome, opts.novo(), area, (opts.rotuloNovo || 'item').toLowerCase());
        S.salvar(); render();
        if (opts.aoMudar) opts.aoMudar();
        abrir(novo.id);                       // já abre o card do novo item
      });
    }

    /* ---- card completo ---- */
    function campoHTML(item, c) {
      var v = item[c.k];
      var id = 'f-' + c.k;
      var dica = c.dica ? '<span class="dica">' + A.esc(c.dica) + '</span>' : '';
      var ctl;
      switch (c.tipo) {
        case 'textarea':
          ctl = '<textarea class="textarea" id="' + id + '" data-k="' + c.k + '"' +
            (c.alto ? ' style="min-height:150px"' : '') + '>' + A.esc(v) + '</textarea>';
          break;
        case 'select':
          ctl = '<select class="select" id="' + id + '" data-k="' + c.k + '">' + c.opcoes.map(function (o) {
            return '<option' + (o === v ? ' selected' : '') + '>' + A.esc(o) + '</option>';
          }).join('') + '</select>';
          break;
        case 'num':
        case 'brl':
          ctl = '<input class="input input-num" id="' + id + '" data-k="' + c.k + '" type="number" min="0" step="' +
            (c.tipo === 'brl' ? 10 : 1) + '" value="' + (v == null ? '' : v) + '">';
          break;
        case 'data': ctl = '<input class="input input-num" id="' + id + '" data-k="' + c.k + '" type="date" value="' + A.esc(v) + '">'; break;
        case 'hora': ctl = '<input class="input input-num" id="' + id + '" data-k="' + c.k + '" type="time" value="' + A.esc(v) + '">'; break;
        case 'check':
          return '<label class="check-line"><input type="checkbox" data-k="' + c.k + '"' + (v ? ' checked' : '') + '>' +
            '<span>' + c.label + '</span></label>';
        default:
          ctl = '<input class="input" id="' + id + '" data-k="' + c.k + '" type="text" value="' + A.esc(v) + '"' +
            (c.placeholder ? ' placeholder="' + A.esc(c.placeholder) + '"' : '') + '>';
      }
      return '<div class="field"><label for="' + id + '">' + c.label + dica + '</label>' + ctl + '</div>';
    }

    function bloco(item, b) {
      if (Array.isArray(b)) {
        return '<div class="grid" style="grid-template-columns:repeat(' + b.length +
          ',minmax(0,1fr));gap:12px">' + b.map(function (c) { return campoHTML(item, c); }).join('') + '</div>';
      }
      return campoHTML(item, b);
    }

    function abrir(id) {
      var item = S.item(opts.nome, id);
      if (!item) return;
      var comPreview = null;
      opts.campos.forEach(function (b) {
        (Array.isArray(b) ? b : [b]).forEach(function (c) { if (c.preview) comPreview = c; });
      });

      var corpo = opts.campos.map(function (b) { return bloco(item, b); }).join('') +
        (comPreview
          ? '<div><div class="eyebrow" style="margin-bottom:8px">Como o grupo vê</div>' +
              '<div class="phone-preview"><div class="bubble"><span id="pv"></span></div></div></div>'
          : '') +
        (opts.midia === false ? '' : galeriaHTML());

      A.drawer({
        largo: true,
        kicker: opts.kicker ? opts.kicker(item) : null,
        titulo: rotulo(item) || 'Nova tarefa',
        corpo: corpo,
        rodape: '<button class="btn btn-danger" id="c-del">Excluir</button>' +
                '<button class="btn btn-primary" data-close>Concluído</button>',
        aoFechar: function () { render(); if (opts.aoMudar) opts.aoMudar(); },
        aoAbrir: function (dr) {
          /* campos — salvam sozinhos e entram no histórico */
          dr.querySelectorAll('[data-k]').forEach(function (inp) {
            inp.addEventListener('change', function () {
              var val = inp.type === 'checkbox' ? inp.checked
                      : inp.type === 'number' ? (inp.value === '' ? 0 : Number(inp.value))
                      : inp.value;
              S.set(opts.nome, item.id, inp.dataset.k, val, area, rotulo(item) || 'nova tarefa');
              S.salvar();
              var h = dr.querySelector('.drawer-head h3');
              if (h) h.textContent = rotulo(item) || 'Nova tarefa';
            });
          });

          /* pré-visualização ao vivo */
          if (comPreview) {
            var ta = dr.querySelector('[data-k="' + comPreview.k + '"]');
            var pv = dr.querySelector('#pv');
            var sync = function () { pv.textContent = ta.value || '—'; };
            ta.addEventListener('input', sync);
            sync();
          }

          if (opts.midia !== false) ligarMidia(dr, item);

          dr.querySelector('#c-del').addEventListener('click', function () {
            S.remove(opts.nome, item.id, area, rotulo(item));
            S.salvar();
            A.fecharDrawer();
            A.toast('Removido');
          });

          var primeiro = dr.querySelector('.drawer-body input, .drawer-body textarea');
          if (primeiro && !rotulo(item)) primeiro.focus();
        }
      });
    }

    /* ---- galeria de fotos e vídeos ---- */
    function galeriaHTML() {
      return '<div class="media-block">' +
        '<div class="card-head" style="margin-bottom:10px">' +
          '<div class="eyebrow">Fotos e vídeos</div>' +
          '<div class="toolbar">' +
            '<label class="btn btn-sm" tabindex="0">' + ico('image', 15) + 'Anexar arquivo' +
              '<input type="file" id="md-file" accept="image/*,video/*" multiple hidden></label>' +
            '<button class="btn btn-sm" id="md-link">' + ico('link', 15) + 'Colar link</button>' +
          '</div>' +
        '</div>' +
        '<div id="md-grid"></div>' +
        '<p class="small muted" style="margin-top:10px">Arquivo até 2 MB fica salvo no navegador. ' +
          'Vídeo maior: suba no YouTube/Drive e cole o link — não pesa nada.</p>' +
      '</div>';
    }

    function ligarMidia(dr, item) {
      var grid = dr.querySelector('#md-grid');

      function pinta() {
        var ms = item.midias || [];
        if (!ms.length) {
          grid.innerHTML = '<div class="media-empty">Nenhuma foto ou vídeo anexado a esta tarefa.</div>';
          return;
        }
        grid.innerHTML = '<div class="media-grid">' + ms.map(function (m) {
          var miolo;
          if (m.origem === 'link' && !ehArquivoVisual(m.src)) {
            miolo = '<a class="m-link" href="' + A.esc(m.src) + '" target="_blank" rel="noopener">' +
              ico('link', 18) + '<span>' + A.esc(encurta(m.src)) + '</span></a>';
          } else if (m.tipo === 'video') {
            miolo = '<video src="' + A.esc(m.src) + '" controls preload="metadata"></video>';
          } else {
            miolo = '<img src="' + A.esc(m.src) + '" alt="' + A.esc(m.nome || 'anexo') + '">';
          }
          return '<div class="media-item">' + miolo +
            '<button class="m-rm" data-rm="' + m.id + '" title="Remover" aria-label="Remover anexo">' +
              ico('close', 13) + '</button>' +
            '<span class="m-tag">' + ico(m.tipo === 'video' ? 'film' : 'image', 11) + '</span>' +
          '</div>';
        }).join('') + '</div>';

        grid.querySelectorAll('[data-rm]').forEach(function (b) {
          b.addEventListener('click', function () {
            S.rmMidia(opts.nome, item.id, b.dataset.rm, area, rotulo(item));
            S.salvar(); pinta();
            A.toast('Anexo removido');
          });
        });
      }

      dr.querySelector('#md-file').addEventListener('change', function (e) {
        Array.prototype.forEach.call(e.target.files, function (f) {
          if (f.size > S.LIMITE_ARQUIVO) {
            A.toast(f.name + ' passa de 2 MB — cole o link do vídeo');
            return;
          }
          var leitor = new FileReader();
          leitor.onload = function () {
            var ok = S.addMidia(opts.nome, item.id, {
              tipo: f.type.indexOf('video') === 0 ? 'video' : 'imagem',
              nome: f.name, src: leitor.result, origem: 'arquivo'
            }, area, rotulo(item));
            if (!ok) { A.toast('Sem espaço no navegador — anexe por link'); return; }
            pinta();
            A.toast(f.name + ' anexado');
          };
          leitor.readAsDataURL(f);
        });
        e.target.value = '';
      });

      dr.querySelector('#md-link').addEventListener('click', function () {
        var url = window.prompt('Cole o link da foto ou do vídeo (YouTube, Drive, CDN…)');
        if (!url) return;
        url = url.trim();
        if (!/^https?:\/\//i.test(url)) { A.toast('O link precisa começar com http'); return; }
        var ok = S.addMidia(opts.nome, item.id, {
          tipo: /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || /youtu|vimeo/i.test(url) ? 'video' : 'imagem',
          nome: encurta(url), src: url, origem: 'link'
        }, area, rotulo(item));
        if (!ok) { A.toast('Não foi possível salvar o link'); return; }
        pinta();
        A.toast('Link anexado');
      });

      pinta();
    }

    function ehArquivoVisual(src) {
      return /^data:/.test(src) || /\.(png|jpe?g|gif|webp|avif|svg|mp4|webm|mov|m4v)(\?|$)/i.test(src);
    }
    function encurta(u) {
      return String(u).replace(/^https?:\/\//, '').slice(0, 32) + (String(u).length > 40 ? '…' : '');
    }

    /* etiqueta de anexos para a linha compacta */
    A.chipMidia = function (item) {
      var n = (item.midias || []).length;
      return n
        ? '<span class="chip-mid">' + ico('clip', 13) + n + '</span>'
        : '<span class="chip-mid vazio">-</span>';
    };

    render();
    return { render: render, abrir: abrir };
  };

  /* etiqueta de anexos disponível mesmo antes de A.cards rodar */
  A.chipMidia = A.chipMidia || function (item) {
    var n = (item.midias || []).length;
    return n ? '<span class="chip-mid">' + ico('clip', 13) + n + '</span>'
             : '<span class="chip-mid vazio">-</span>';
  };

  /* ---------- campo escalar (config do grupo) ------------------------------ */
  A.campo = function (input, grupoNome, campo, area, rotulo, aoMudar) {
    input.value = S.dados[grupoNome][campo];
    input.addEventListener('change', function () {
      var val = input.type === 'number' ? Number(input.value || 0) : input.value;
      S.setCampo(grupoNome, campo, val, area, rotulo);
      S.salvar();
      if (aoMudar) aoMudar();
    });
  };

  /* ---------- faixa de números ---------------------------------------------
     Uma caixa dividida por fios, no lugar de quatro cartões brancos iguais.
     itens: [{ k: rótulo, v: valor, n: nota, barra: 0-100, destaque, vazio }]
     ----------------------------------------------------------------------- */
  A.faixa = function (el, itens) {
    el = typeof el === 'string' ? document.getElementById(el) : el;
    if (!el) return;
    el.className = 'faixa';
    el.innerHTML = itens.filter(Boolean).map(function (m) {
      return '<div' + (m.destaque ? ' class="destaque"' : '') + '>' +
        '<span class="k">' + m.k + '</span>' +
        '<span class="v' + (m.vazio ? ' vazio' : '') + '">' + m.v + '</span>' +
        (m.barra != null
          ? '<div class="bar accent"><i style="width:' + Math.max(0, Math.min(100, m.barra)) + '%"></i></div>'
          : '') +
        (m.n ? '<span class="n">' + m.n + '</span>' : '') +
      '</div>';
    }).join('');
  };

  /* ---------- linha do tempo da campanha -----------------------------------
     A visão geral mostrava seis cartões com seis zeros. Seis zeros não contam
     nada; o que se quer saber ao abrir o painel é em que pé está a campanha.
     etapas: [{ nome, texto, num, href, icone, estado: parada|andando|feita }]
     ----------------------------------------------------------------------- */
  A.etapas = function (el, lista) {
    el = typeof el === 'string' ? document.getElementById(el) : el;
    if (!el) return;
    el.className = 'etapas';
    el.innerHTML = lista.map(function (e) {
      return '<a class="etapa ' + e.estado + '" href="' + e.href + '">' +
        '<span class="et-ico">' + ico(e.estado === 'feita' ? 'check' : e.icone, 15) + '</span>' +
        '<span class="et-nome">' + A.esc(e.nome) + '</span>' +
        '<span class="et-estado">' + e.texto + '</span>' +
        '<span class="et-num">' + e.num + '</span>' +
        '<span class="et-go">' + ico('chevron') + '</span>' +
      '</a>';
    }).join('');
  };

  /* ---------- próximo passo ------------------------------------------------
     Painel novo é uma parede de zeros. Isto diz qual é o próximo campo a
     preencher e some sozinho quando não há mais o que dizer.
     ----------------------------------------------------------------------- */
  A.proximoPasso = function (el, passo) {
    el = typeof el === 'string' ? document.getElementById(el) : el;
    if (!el) return;
    if (!passo) { el.innerHTML = ''; el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML =
      '<div class="proximo">' +
        '<div class="px-txt"><b>' + A.esc(passo.titulo) + '</b><p>' + A.esc(passo.texto) + '</p></div>' +
        (passo.href ? '<a class="btn" href="' + passo.href + '">' + A.esc(passo.acao || 'Abrir') + '</a>' : '') +
      '</div>';
  };

  /* ---------- countdown ----------------------------------------------------
     Passada a data, o contador antigo ficava preso em "AO VIVO · abertura em
     andamento" para sempre. Uma campanha de julho aberta em setembro anunciava
     que estava acontecendo agora — mentira no elemento mais visível da tela.
     Agora a janela ao vivo dura o dia da abertura; depois disso o painel
     assume que aquilo já aconteceu.
     ----------------------------------------------------------------------- */
  var JANELA_AO_VIVO = 12 * 3600 * 1000;   // 12h a partir da hora marcada

  A.countdown = function (el) {
    var relogio;
    function tick() {
      var alvo = new Date(S.dados.grupo.abertura).getTime();
      if (!isFinite(alvo)) {
        el.innerHTML = celula('—', 'sem data definida', true);
        return;
      }
      var falta = alvo - Date.now();

      if (falta > 0) {
        var s = Math.floor(falta / 1000);
        var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600),
            m = Math.floor(s % 3600 / 60), sg = s % 60;
        el.innerHTML = [[d, 'dias'], [h, 'horas'], [m, 'min'], [sg, 'seg']].map(function (c) {
          return '<div class="cd-cell"><b>' + String(c[0]).padStart(2, '0') + '</b><span>' + c[1] + '</span></div>';
        }).join('');
        return;
      }

      var passou = -falta;
      if (passou <= JANELA_AO_VIVO) {
        el.innerHTML = celula('AO VIVO', 'abertura acontecendo agora', true);
        return;
      }

      /* Já era. Diz há quanto tempo, que é o que ajuda a ler o relatório. */
      var dias = Math.floor(passou / 86400000);
      el.innerHTML = celula(
        dias < 1 ? 'ENCERRADA' : String(dias),
        dias < 1 ? 'a abertura já aconteceu'
                 : (dias === 1 ? 'dia desde a abertura' : 'dias desde a abertura'),
        true
      );
      clearInterval(relogio);   // nada mais muda de segundo em segundo
    }

    function celula(valor, rotulo, largo) {
      return '<div class="cd-cell"' + (largo ? ' style="min-width:auto;padding:9px 18px"' : '') +
        '><b>' + valor + '</b><span>' + rotulo + '</span></div>';
    }

    tick();
    relogio = setInterval(tick, 1000);
  };

  /* Espera o DOM E o banco. Assim a tela nunca pinta com cache velho para
     depois pular para o dado real. */
  S.pronto(montaShell);
})();
