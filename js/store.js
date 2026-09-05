/* =============================================================================
   AIOS · Grupos VIP — estado do painel.

   O dado mora no banco (Supabase), não no navegador. As duas equipes veem a
   mesma coisa. O navegador nunca vê chave nenhuma: quem fala com o banco é a
   função /api/painel, no servidor.

   O localStorage continua, mas só como CACHE: a tela pinta na hora com a
   última cópia conhecida e o banco corrige em seguida. Se a rede cair, o
   painel continua editável e sincroniza quando voltar.

   De quem é este painel sai da URL, não de um arquivo copiado por cliente:
   /botoclinic-riomar/captacao.html -> slug 'botoclinic-riomar'. A lista de
   clientes fica em clientes.js, carregado antes deste arquivo.

   Sem senha, sem login. O seletor de equipe é um rótulo para o histórico.
   ========================================================================== */
(function () {
  'use strict';

  var C = (window.Clientes && window.Clientes.atual()) || null;

  /* URL que não corresponde a nenhum cliente da lista. O painel não tem como
     adivinhar de quem é, então avisa e não grava nada. */
  var semCliente = !C;
  if (semCliente) {
    C = { slug: '', cliente: 'Painel não encontrado', grupo: '', equipeCliente: 'Equipe' };
  }

  var API    = '/api/painel';
  var CACHE  = 'aios:vip:' + C.slug + ':cache';
  var SESSAO = 'aios:equipe:' + C.slug;
  var ESPERA = 900;      // debounce da gravação, em ms
  var RONDA  = 12000;    // de quanto em quanto tempo olha se o outro time mexeu

  var EQUIPES = [
    { id: 'aios',    nome: 'Equipe AIOS',                              papel: 'Gestão do grupo' },
    { id: 'cliente', nome: C.equipeCliente || ('Equipe ' + C.cliente), papel: C.cliente }
  ];

  /* --- estrutura vazia: é isto que um painel novo recebe ------------------ */
  function base() {
    return {
      grupo: {
        cliente: C.cliente,
        nome: C.grupo || 'Grupo VIP',
        abertura: '',
        metaMembros: 0,
        saidas: 0,
        metaVendas: 0,
        /* JID do grupo de organização no WhatsApp (o da equipe, não o dos
           pacientes). É para onde o lembrete diário é postado. Sem isto o
           cliente simplesmente não entra na rotina de lembrete. */
        grupoOperacao: ''
      },
      /* Checklists de preparação. Os passos são fixos (moram em app.js, para
         valerem igual em todo cliente); aqui fica só o estado de cada um:
         { 'wa-1': { feito: true, quem: 'Equipe AIOS', quando: '...', obs: '' } } */
      preparacao: {},

      captacao: [],      /* disparos para captação, por canal */
      aquecimento: [],   /* mensagens, enquetes e vídeos do grupo */
      remarketing: [],   /* disparos de recuperação */
      produtos: [],      /* promoções: produtos e valores */
      promocao: { condicao: '', validade: '', status: 'Em análise' },
      brinde:   { nome: '', custo: 0, unidades: 0 },
      iscas: [],         /* iscas, brindes, presentes, prêmios, sorteios */
      ranking: [],       /* ranking de engajamento */
      roteiro: [],       /* roteiro do dia da abertura */
      vendas: [],        /* vendas registradas no dia */
      historico: []
    };
  }

  var S = window.Store = {};

  S.semCliente = semCliente;

  /* --- estado da sincronia (a barra lateral mostra) ----------------------- */
  S.estado = 'carregando';   // carregando | ok | salvando | offline | sem-banco | sem-cliente
  S.atualizadoEm = null;
  S.atualizadoPor = null;

  function marcar(e) {
    if (S.estado === e) return;
    S.estado = e;
    document.dispatchEvent(new CustomEvent('aios:sincronia', { detail: e }));
  }

  /* --- cache local (pinta rápido, aguenta queda de rede) ------------------ */
  function lerCache() {
    try {
      var b = localStorage.getItem(CACHE);
      if (b) return JSON.parse(b);
    } catch (_) {}
    return null;
  }
  function gravarCache() {
    try { localStorage.setItem(CACHE, JSON.stringify(S.dados)); return true; }
    catch (_) { return false; }
  }

  S.dados = lerCache() || base();

  /* --- conversa com o banco ---------------------------------------------- */
  function vazio(d) {
    return !d || !d.grupo || (
      !d.captacao?.length && !d.aquecimento?.length && !d.remarketing?.length &&
      !d.produtos?.length && !d.iscas?.length && !d.roteiro?.length &&
      !d.vendas?.length && !d.ranking?.length && !d.historico?.length &&
      !d.grupo.abertura && !d.grupo.metaMembros
    );
  }

  function adotar(remoto) {
    S.dados = remoto.dados && remoto.dados.grupo ? remoto.dados : base();
    S.atualizadoEm = remoto.atualizado_em || null;
    S.atualizadoPor = remoto.atualizado_por || null;
    gravarCache();
  }

  var pendente = null, timer = null, enviando = false;

  function enviar() {
    if (enviando) { agendar(); return Promise.resolve(false); }
    enviando = true;
    marcar('salvando');
    var corpo = JSON.stringify({
      slug: C.slug,
      dados: S.dados,
      quem: S.usuario().nome
    });
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (r) {
        enviando = false;
        if (!r.ok) {
          var erro = r.j && r.j.erro;
          /* O painel não existe no banco: insistir não adianta e continuar
             editando só acumula trabalho que não vai ser gravado. */
          marcar(erro === 'painel_nao_encontrado' ? 'sem-painel'
               : erro === 'banco_nao_configurado' ? 'sem-banco'
               : 'offline');
          return false;
        }
        S.atualizadoEm = r.j.atualizado_em;
        S.atualizadoPor = r.j.atualizado_por;
        marcar('ok');
        return true;
      })
      .catch(function () { enviando = false; marcar('offline'); return false; });
  }

  function agendar() {
    clearTimeout(timer);
    timer = setTimeout(enviar, ESPERA);
  }

  /* Chamado por TODA alteração. Grava no cache na hora e empurra ao banco. */
  S.salvar = function () {
    if (semCliente) return false;
    var ok = gravarCache();
    agendar();
    return ok;   // false só quando o navegador ficou sem espaço (mídia pesada)
  };

  /* Grava agora e devolve promessa.

     A gravação normal espera 900 ms para não mandar uma requisição por tecla
     digitada. Quem recarrega a página logo depois de alterar (trocar o nome da
     campanha, zerar o painel, aplicar o roteiro padrão) matava esse timer antes
     de ele disparar: a tela dizia que salvou e a alteração ficava só no cache
     do navegador. Toda ação que termina em reload tem que passar por aqui. */
  S.salvarAgora = function () {
    if (semCliente) return Promise.resolve(false);
    gravarCache();
    clearTimeout(timer);
    timer = null;
    return Promise.resolve(enviar());
  };

  /* --- carga inicial: é o que S.pronto espera ----------------------------- */
  var carga = semCliente
    ? Promise.resolve(marcar('sem-cliente'))
    : fetch(API + '?slug=' + encodeURIComponent(C.slug), { cache: 'no-store' })
    .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
    .then(function (r) {
      if (!r.ok) {
        var erro = r.j && r.j.erro;
        marcar(erro === 'painel_nao_encontrado' ? 'sem-painel'
             : erro === 'banco_nao_configurado' ? 'sem-banco'
             : 'offline');
        return;
      }
      if (vazio(r.j.dados)) {
        /* Painel ainda vazio no banco. Só empurra se EU tiver algo — senão
           todo carregamento gravaria de novo e encheria o versionamento de
           lixo. */
        var meu = (S.dados && S.dados.grupo) ? S.dados : base();
        S.dados = meu;
        marcar('ok');
        if (!vazio(meu)) enviar();
      } else {
        adotar(r.j);
        marcar('ok');
      }
    })
    .catch(function () { marcar('offline'); });

  function domPronto() {
    return new Promise(function (r) {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', r);
      else r();
    });
  }

  /* As telas chamam S.pronto(fn) em vez de esperar só o DOM: assim ninguém
     pinta a tela com o cache velho e depois pula para o dado do banco. */
  var prontoP = Promise.all([domPronto(), carga]);
  S.pronto = function (fn) { prontoP.then(function () { fn(); }); };

  /* --- ronda: o outro time mexeu? ----------------------------------------- */
  setInterval(function () {
    if (semCliente) return;
    if (enviando || timer) return;                  // não atropela gravação minha
    fetch(API + '?slug=' + encodeURIComponent(C.slug), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.atualizado_em) return;
        if (S.estado === 'offline' || S.estado === 'sem-banco') marcar('ok');
        if (j.atualizado_em === S.atualizadoEm) return;
        if (vazio(j.dados)) return;
        adotar(j);
        document.dispatchEvent(new CustomEvent('aios:remoto', {
          detail: { quem: j.atualizado_por }
        }));
      })
      .catch(function () { marcar('offline'); });
  }, RONDA);

  /* --- zerar --------------------------------------------------------------
     A versão anterior fica guardada no banco: nada some de verdade.        */
  S.limparTudo = function () {
    var hist = S.dados.historico.slice();
    S.dados = base();
    S.dados.historico = hist;
    S.log('Painel', 'zerou todos os dados do grupo');
  };

  /* --- quem está editando (sem senha, sem login) -------------------------- */
  S.cliente = function () { return C; };
  S.equipe  = function () { return EQUIPES.slice(); };
  S.usuario = function () {
    var id;
    try { id = localStorage.getItem(SESSAO); } catch (_) {}
    return EQUIPES.find(function (e) { return e.id === id; }) || EQUIPES[0];
  };
  S.trocarEquipe = function (id) {
    var e = EQUIPES.find(function (x) { return x.id === id; });
    if (!e) return null;
    try { localStorage.setItem(SESSAO, e.id); } catch (_) {}
    return e;
  };

  /* --- histórico ---------------------------------------------------------- */
  S.log = function (area, acao) {
    var u = S.usuario();
    S.dados.historico.unshift({
      id: 'h' + Date.now() + Math.floor(Math.random() * 999),
      quando: new Date().toISOString(),
      quem: u.nome,
      quemId: u.id,
      papel: u.papel,
      area: area,
      acao: acao
    });
    if (S.dados.historico.length > 400) S.dados.historico.length = 400;
    S.salvar();
  };

  /* --- CRUD --------------------------------------------------------------- */
  S.lista = function (nome) { return S.dados[nome] || []; };
  S.item = function (nome, id) {
    return (S.dados[nome] || []).find(function (x) { return x.id === id; });
  };
  S.novoId = function () { return 'x' + Date.now().toString(36) + Math.floor(Math.random() * 99); };

  S.add = function (nome, item, area, rotulo) {
    item.id = S.novoId();
    S.dados[nome].push(item);
    S.log(area, 'adicionou ' + rotulo);
    return item;
  };

  S.remove = function (nome, id, area, rotulo) {
    var i = S.dados[nome].findIndex(function (x) { return x.id === id; });
    if (i < 0) return;
    S.dados[nome].splice(i, 1);
    S.log(area, 'removeu ' + rotulo);
  };

  S.set = function (nome, id, campo, valor, area, rotulo) {
    var it = S.item(nome, id);
    if (!it) return;
    var antes = it[campo];
    if (String(antes) === String(valor)) return;
    it[campo] = valor;
    S.log(area, 'alterou ' + campo + ' de ' + rotulo + ': “' + fmt(antes) + '” → “' + fmt(valor) + '”');
  };

  /* --- checklist de preparação -------------------------------------------
     Passo marcado guarda quem marcou e quando: numa operação de duas equipes,
     "está feito" sem assinatura vira discussão.
     ----------------------------------------------------------------------- */
  S.prep = function (id) {
    if (!S.dados.preparacao) S.dados.preparacao = {};
    return S.dados.preparacao[id] || { feito: false, obs: '', quem: '', quando: '' };
  };

  S.marcarPrep = function (id, feito, rotulo, area) {
    if (!S.dados.preparacao) S.dados.preparacao = {};
    var p = S.dados.preparacao[id] || { feito: false, obs: '' };
    if (p.feito === feito) return;
    p.feito = feito;
    p.quem = feito ? S.usuario().nome : '';
    p.quando = feito ? new Date().toISOString() : '';
    S.dados.preparacao[id] = p;
    S.log(area || 'Preparação', (feito ? 'concluiu' : 'reabriu') + ' “' + rotulo + '”');
  };

  S.obsPrep = function (id, obs, rotulo, area) {
    if (!S.dados.preparacao) S.dados.preparacao = {};
    var p = S.dados.preparacao[id] || { feito: false, obs: '' };
    if ((p.obs || '') === obs) return;
    p.obs = obs;
    S.dados.preparacao[id] = p;
    S.log(area || 'Preparação', 'anotou em “' + rotulo + '”: ' + fmt(obs));
  };

  S.setCampo = function (grupoNome, campo, valor, area, rotulo) {
    var alvo = S.dados[grupoNome];
    if (!alvo) return;
    var antes = alvo[campo];
    if (String(antes) === String(valor)) return;
    alvo[campo] = valor;
    S.log(area, 'alterou ' + (rotulo || campo) + ': “' + fmt(antes) + '” → “' + fmt(valor) + '”');
  };

  function fmt(v) {
    if (v === '' || v === null || v === undefined) return '-';
    if (v === true) return 'sim';
    if (v === false) return 'não';
    return String(v).length > 42 ? String(v).slice(0, 42) + '…' : String(v);
  }

  /* --- mídias (fotos e vídeos anexados a uma tarefa) ----------------------
     Arquivo vira data URL e vai junto com o painel para o banco — por isso o
     limite. Vídeo grande entra por link (YouTube, Drive, CDN).
     ----------------------------------------------------------------------- */
  S.LIMITE_ARQUIVO = 2 * 1024 * 1024; // 2 MB

  S.addMidia = function (nome, id, midia, area, rotulo) {
    var it = S.item(nome, id);
    if (!it) return false;
    if (!it.midias) it.midias = [];
    midia.id = S.novoId();
    it.midias.push(midia);
    if (!gravarCache()) {          // cache estourou: desfaz e avisa quem chamou
      it.midias.pop();
      gravarCache();
      return false;
    }
    S.log(area, 'anexou ' + (midia.tipo === 'video' ? 'um vídeo' : 'uma foto') +
      ' em ' + rotulo + (midia.origem === 'link' ? ' (por link)' : ''));
    return true;
  };

  S.rmMidia = function (nome, id, midiaId, area, rotulo) {
    var it = S.item(nome, id);
    if (!it || !it.midias) return;
    var i = it.midias.findIndex(function (m) { return m.id === midiaId; });
    if (i < 0) return;
    var m = it.midias.splice(i, 1)[0];
    S.log(area, 'removeu ' + (m.tipo === 'video' ? 'um vídeo' : 'uma foto') + ' de ' + rotulo);
  };

  /* --- números derivados (o relatório inteiro sai daqui) ------------------ */
  S.totais = function () {
    var d = S.dados;
    var soma = function (arr, k) { return arr.reduce(function (s, x) { return s + (Number(x[k]) || 0); }, 0); };

    var investimento = soma(d.captacao, 'investimento');
    var cliques = soma(d.captacao, 'cliques');
    var leads = soma(d.captacao, 'leads');
    var entradas = soma(d.captacao, 'entradas');
    var membros = Math.max(0, entradas - (Number(d.grupo.saidas) || 0));

    var aqEnviados = d.aquecimento.filter(function (x) { return x.status === 'Enviado'; });
    var alcance = soma(aqEnviados, 'alcance');
    var respostas = soma(aqEnviados, 'respostas');

    var rmEnviados = soma(d.remarketing, 'enviados');
    var rmRespostas = soma(d.remarketing, 'respostas');
    var rmVendas = soma(d.remarketing, 'vendas');
    var rmReceita = soma(d.remarketing, 'receita');

    var vendas = d.vendas.length;
    var faturamentoAbertura = soma(d.vendas, 'valor');
    var faturamento = faturamentoAbertura + rmReceita;
    var compradoras = vendas + rmVendas;

    var vivas = d.iscas.filter(function (i) { return i.status !== 'Descartado'; });
    var custoIscas = vivas.reduce(function (s, i) {
      return s + (Number(i.custo) || 0) * (Number(i.quantidade) || 0);
    }, 0);
    var valorIscas = vivas.reduce(function (s, i) {
      return s + (Number(i.valor) || 0) * (Number(i.quantidade) || 0);
    }, 0);
    var custoBrinde = (Number(d.brinde.custo) || 0) * (Number(d.brinde.unidades) || 0);

    var vip = d.produtos.map(function (p) { return Number(p.vip) || 0; }).filter(Boolean);
    var vipMedio = vip.length ? vip.reduce(function (a, b) { return a + b; }, 0) / vip.length : 0;
    var metaVendas = Number(d.grupo.metaVendas) || 0;

    return {
      investimento: investimento,
      cliques: cliques,
      leads: leads,
      entradas: entradas,
      membros: membros,
      metaMembros: Number(d.grupo.metaMembros) || 0,
      pctMeta: d.grupo.metaMembros ? Math.round(membros / d.grupo.metaMembros * 100) : 0,
      custoLead: leads ? investimento / leads : 0,
      taxaEntrada: leads ? Math.round(entradas / leads * 100) : 0,

      aqTotal: d.aquecimento.length,
      aqEnviados: aqEnviados.length,
      alcance: alcance,
      respostas: respostas,
      engajamento: alcance ? Math.round(respostas / alcance * 100) : 0,

      rmEnviados: rmEnviados,
      rmRespostas: rmRespostas,
      rmVendas: rmVendas,
      rmReceita: rmReceita,
      rmTaxa: rmEnviados ? Math.round(rmRespostas / rmEnviados * 100) : 0,

      vendasAbertura: vendas,
      faturamentoAbertura: faturamentoAbertura,
      compradoras: compradoras,
      faturamento: faturamento,
      ticket: compradoras ? Math.round(faturamento / compradoras) : 0,
      conversao: membros ? Math.round(compradoras / membros * 1000) / 10 : 0,
      cac: compradoras ? investimento / compradoras : 0,
      roi: investimento ? faturamento / investimento : 0,

      iscasAtivas: vivas.length,
      iscasTotal: d.iscas.length,
      custoIscas: custoIscas,
      valorIscas: valorIscas,
      custoBrinde: custoBrinde,
      custoTotal: investimento + custoIscas + custoBrinde,

      metaVendas: metaVendas,
      vipMedio: vipMedio,
      potencial: metaVendas * vipMedio,

      roteiroEnviado: d.roteiro.filter(function (r) { return r.enviado; }).length,
      roteiroTotal: d.roteiro.length
    };
  };
})();
