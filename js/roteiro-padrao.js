/* =============================================================================
   AIOS · Grupos VIP — roteiro padrão de aquecimento.

   Nasceu do roteiro da Dra. Joelma e virou o padrão da casa: 17 stories, um por
   dia, nos 17 dias que antecedem a abertura, mais 8 reels nos mesmos dias.

   O que muda de unidade para unidade entra por marcador:
     {{CLINICA}}  nome do cliente, vem do painel
     {{DATA}}     "25 de setembro", calculado da data de abertura
     {{HORA}}     "10 horas", calculado da hora de abertura
     {{CURTA}}    "25/09 · 10h", para o overlay na tela

   O que a clínica precisa preencher fica entre colchetes no texto — [QUEM
   GRAVA], [N] sessões, [NOME DO PLANO]. É de propósito: some na tela como
   lacuna visível em vez de virar informação inventada.

   Os dias são relativos (offset -17 a -1, sendo 0 o dia da abertura), então o
   mesmo roteiro serve para qualquer data. Cada item gerado guarda o código em
   `padrao`, o que deixa o painel reconhecer o que veio daqui e só corrigir as
   datas quando a abertura mudar, sem duplicar nada.
   ========================================================================== */
(function () {
  'use strict';

  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
               'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  var FECHAMENTO = 'No dia {{DATA}}, às {{HORA}}, eu solto as condições dentro do grupo. ' +
                   'O link está aqui no story.';

  /* ---- os 17 stories, um por dia ---------------------------------------- */
  var STORIES = [
    { off: -17, cod: 'AP-A', assunto: 'Apresentação', topo: 'Quem eu sou',
      aparece: 'Celular em pé, luz de janela no rosto, olhando a bolinha da câmera. Fundo da clínica ou recepção.',
      fala: 'Eu sou a [QUEM GRAVA]. Eu atendo aqui na {{CLINICA}} e trabalho com procedimentos de pele e face: [LISTAR OS PRINCIPAIS]. Tudo começa com avaliação. No dia {{DATA}}, às {{HORA}}, eu abro o grupo e solto as condições lá dentro. O link está neste story. Entra.',
      fig: 'LINK — escrever "entrar no grupo" e colar o link do WhatsApp. Sem figurinha, escreva "link na bio".',
      extra: 'Enquete opcional: "Você já está no grupo? Sim / Ainda não"',
      nao: 'Sem preço. Sem nome de promoção.' },

    { off: -16, cod: 'CV-A', assunto: 'Convite', topo: 'Condição só no grupo',
      aparece: 'Close no rosto. Sem tabela, sem print de preço.',
      fala: 'Isso que eu vou soltar no dia {{DATA}} não vai aparecer no Instagram e não fica exposto no balcão. É condição de quem está dentro do grupo, no horário. Abre dia {{DATA}}, às {{HORA}}. O link está aqui. Quem entrar agora ainda acompanha tudo até lá.',
      fig: 'LINK — "entrar no grupo"',
      extra: 'Neste dia também grava o Reel 1 (mesmo texto, 15 a 20 segundos, hook na primeira frase).',
      nao: 'Não falar valor. Não falar plano de recorrência ainda.' },

    { off: -15, cod: 'TR-A', assunto: 'Tratamento', topo: '[TRATAMENTO 1]: o que é',
      aparece: 'Na sala. Pode mostrar o produto de longe, sem rótulo de preço.',
      fala: '[TRATAMENTO 1] serve para quem [situação concreta que a pessoa reconhece em si]. A sessão é [tempo] e a maior parte das pessoas [volta para a rotina no mesmo dia / precisa de repouso]. Eu indico na avaliação, não é para todo mundo. Dia {{DATA}}, às {{HORA}}, eu falo as condições no grupo. Link aqui.',
      fig: 'LINK — "entrar no grupo"',
      extra: 'Coloque aqui o tratamento mais desejado da casa: é ele que abre a série e puxa mais gente para o grupo.',
      nao: 'Sem sessões por X reais. Sem "baratinho".' },

    { off: -14, cod: 'OB-A', assunto: 'Objeção', topo: 'Dói?',
      aparece: 'Close no rosto. Fala olhando a câmera.',
      fala: 'Sobre dor: [tratamento A] é uma sensação de picada rápida, passa. [tratamento B] dá calor e um desconforto maior em região óssea. Tem gente que quase não sente. Eu não vou dizer que não sente nada. Na avaliação eu explico o seu caso. Dia {{DATA}}, às {{HORA}}, as condições saem no grupo.',
      fig: 'LINK + caixa de pergunta: "Manda tua dúvida sobre dor"',
      extra: 'Neste dia também grava o Reel 2. Hook: "Dói?"',
      nao: 'Sensação real. Sem "não dói nada". Sem preço.' },

    { off: -13, cod: 'PR-A', assunto: 'Prova social', topo: 'Mensagem que chegou',
      aparece: 'Print real de WhatsApp na tela. Nome e foto cobertos com tarja ou emoji. Não edite o texto da mensagem.',
      fala: 'Isso chegou no meu WhatsApp. Eu cubro o nome porque ninguém autorizou aparecer. Depoimento real. Resultado de cada uma é individual. Se você quer estar dentro no dia {{DATA}}, às {{HORA}}, o link do grupo está aqui.',
      fig: 'LINK — "entrar no grupo"',
      extra: 'Se não tiver print bom, use um print de agradecimento. Não invente mensagem.',
      nao: 'Autorização de uso do print. Nome e foto cobertos. Texto original.' },

    { off: -12, cod: 'TR-C', assunto: 'Tratamento', topo: '[TRATAMENTO 2]: para quem serve',
      aparece: 'Na sala, falando. Sem instrumento em close agressivo.',
      fala: '[TRATAMENTO 2] é para quem [incômodo específico]. Não é para todo mundo e não é o mesmo protocolo para todas. Eu vejo o seu rosto na avaliação e só então indico. Dia {{DATA}}, às {{HORA}}, eu solto as condições no grupo.',
      fig: 'LINK — "entrar no grupo"',
      extra: 'Pode falar variações como "quantidade diferente conforme o caso", sem unidade nem preço.',
      nao: 'Sem número de unidade se isso virar conversa de tabela. Sem valor.' },

    { off: -11, cod: 'AD-A', assunto: 'Antes e depois', topo: '[REGIÃO] · resultado dela',
      aparece: 'Antes e depois da mesma paciente, mesma luz, mesmo ângulo. Autorização assinada.',
      fala: 'Essa foi a [região] dela. Repara neste ponto. Foram [N] sessões. Esse foi o resultado dela. O seu caso eu só sei dizer na avaliação. Dia {{DATA}}, às {{HORA}}, as condições saem no grupo. O link está aqui.',
      fig: 'LINK — "entrar no grupo"',
      extra: 'Troque [N] pelo número real. Se for impulsionar story, NÃO use este post.',
      nao: 'Autorização assinada. Sem prometer o mesmo resultado. Sem preço.' },

    { off: -10, cod: 'DP-A', assunto: 'Depoimento', topo: 'O que ela achou',
      aparece: 'Cliente autorizada falando. Quem grava só aparece no fim, 5 segundos.',
      fala: 'A cliente fala do resultado com as palavras dela, sem script de propaganda e sem citar preço. No fim: "Obrigada. Quem quiser estar no grupo no dia {{DATA}}, às {{HORA}}, o link está neste story."',
      fig: 'LINK — "entrar no grupo"',
      extra: 'Neste dia também grava o Reel 3: recorte de 15 a 20 segundos do depoimento + CTA.',
      nao: 'Autorização de imagem e de voz. Sem preço na fala da cliente.' },

    { off: -9, cod: 'TR-D', assunto: 'Tratamento', topo: '[TRATAMENTO 3]: o que faz',
      aparece: 'Sala. Aparelho pode aparecer ao fundo, sem foco em marca se não quiser.',
      fala: '[TRATAMENTO 3] é [o que é, em uma frase, sem termo técnico]. Serve para quem sente [situação concreta]. A sessão dura cerca de [tempo], conforme a área, e a maior parte volta para a rotina no mesmo dia. Resultado vai construindo ao longo das semanas. Eu indico na avaliação. Dia {{DATA}}, às {{HORA}}, no grupo.',
      fig: 'LINK — "entrar no grupo"',
      extra: 'Pode citar as áreas atendidas, sem preço de cada uma.',
      nao: 'Sem "de graça". Sem valor.' },

    { off: -8, cod: 'OB-B', assunto: 'Objeção', topo: 'Quanto tempo dura',
      aparece: 'Close no rosto.',
      fala: 'Depende do procedimento e de cada organismo. Quem mantém cuidado em casa e volta na reavaliação costuma segurar melhor. Número exato do seu caso eu falo na avaliação, não no story. Dia {{DATA}}, às {{HORA}}, o grupo abre.',
      fig: 'LINK + enquete: "Já fez algum procedimento? Sim / Ainda não"',
      extra: '',
      nao: 'Sem garantia. Sem preço de retorno.' },

    { off: -7, cod: 'BT-B', assunto: 'Bastidor', topo: 'Como é a avaliação',
      aparece: 'Na cadeira de avaliação ou na sala, mostrando o que se olha (sem expor paciente).',
      fala: 'Antes de qualquer procedimento eu olho o seu rosto, sua pele, o que te incomoda e o que não está indicado para você. Só depois eu falo o caminho. Isso vale também para quem comprar no grupo. Dia {{DATA}}, às {{HORA}}. O link está aqui.',
      fig: 'LINK — "entrar no grupo"',
      extra: 'Neste dia também grava o Reel 4. Hook: "Antes de qualquer procedimento, eu faço isso."',
      nao: 'Sem "avaliação grátis" como isca, a menos que seja verdade. Sem preço.' },

    { off: -6, cod: 'TR-E', assunto: 'Tratamento', topo: '[TRATAMENTO 4]',
      aparece: 'Falando. Pode apontar regiões no próprio rosto, sem desenho de "antes milagroso".',
      fala: '[TRATAMENTO 4] não é o mesmo para todo mundo. [Região A] é uma conversa. [Região B] e [região C] são outras. Eu vejo a harmonia do seu rosto na avaliação e só então indico onde faz sentido. Dia {{DATA}}, às {{HORA}}, as condições saem no grupo.',
      fig: 'LINK — "entrar no grupo"',
      extra: '',
      nao: 'Sem medida por reais. Sem "resolve tudo".' },

    { off: -5, cod: 'AD-E', assunto: 'Antes e depois', topo: 'Olha aqui · [REGIÃO]',
      aparece: 'Antes e depois. Apontar COM O DEDO o ponto que mudou. Mesma luz, mesmo ângulo. Autorização assinada.',
      fala: 'Não olha a foto inteira. Olha este ponto: [região]. O que mudou foi aqui. Esse foi o resultado dela. O seu eu só falo na avaliação. Dia {{DATA}}, às {{HORA}}, no grupo. Link neste story.',
      fig: 'LINK — "entrar no grupo"',
      extra: 'Neste dia também grava o Reel 5: 1 ponto na cara + "seu caso é na avaliação". Não impulsionar.',
      nao: 'Autorização. Sem promessa. Sem preço. Não boostar este story.' },

    { off: -4, cod: 'CV-B', assunto: 'Convite', topo: 'Como o grupo funciona',
      aparece: 'Close no rosto. Sem print de tabela.',
      fala: 'O grupo abre em horário marcado. Cada abertura tem condição e número de vaga. Não fica aberto o dia inteiro do mesmo jeito. No dia {{DATA}}, às {{HORA}}, eu solto as condições. [Se a clínica tiver plano ou clube de recorrência, cita aqui: "e também lanço o [NOME DO PLANO]".] O detalhe sai lá dentro. O link está aqui.',
      fig: 'LINK — "entrar no grupo"',
      extra: 'Neste dia grava o Reel 6. Pode citar o plano pelo nome. NÃO falar parcela nem valor.',
      nao: 'O plano existe e pode ser citado. Valor só no WhatsApp.' },

    { off: -3, cod: 'AD-B', assunto: 'Antes e depois', topo: '[REGIÃO] · o tempo entre as fotos',
      aparece: 'Antes e depois. Diga na fala quanto tempo passou entre as duas. Autorização assinada.',
      fala: 'Essa é a [região] dela. Entre as duas fotos passaram [N] dias. O que mudou está neste contorno. Resultado dela. O seu caso depende de avaliação. Amanhã eu começo a contagem. Dia {{DATA}}, às {{HORA}}, o grupo abre. Link aqui.',
      fig: 'LINK — "entrar no grupo"',
      extra: 'Troque [N] pelo intervalo real.',
      nao: 'Autorização. Sem preço. Sem "todo mundo fica assim".' },

    { off: -2, cod: 'CT-A', assunto: 'Contagem', topo: 'Faltam 2 dias',
      aparece: 'Close. Pode usar sticker de contagem regressiva até {{CURTA}}.',
      fala: 'Faltam dois dias. Dia {{DATA}}, às {{HORA}}, eu abro o grupo e solto as condições. Quem entrar agora ainda pega tudo. Quem chegar depois do primeiro horário, no dia, já perde a primeira condição. O link está neste story.',
      fig: 'LINK + sticker de contagem regressiva, se tiver.',
      extra: 'Neste dia grava o Reel 7. Hook: "Faltam 2 dias."',
      nao: 'Sem lista de preço mesmo na reta final.' },

    { off: -1, cod: 'CT-B', assunto: 'Véspera', topo: 'É amanhã · {{CURTA}}',
      aparece: 'Close. Energia de véspera, sem gritaria de liquidação.',
      fala: 'É amanhã. {{HORA}}. Eu abro o grupo e solto as condições. Quem chegar depois do primeiro horário já perdeu a primeira condição. O link está aqui. Te vejo amanhã.',
      fig: 'LINK — "entrar no grupo"',
      extra: 'Neste dia grava o Reel 8. DEPOIS DESTE STORY NÃO POSTA MAIS NADA até o grupo abrir.',
      nao: 'Último story. Sem preço. Sem "última chance".' }
  ];

  /* ---- os 8 reels, nos mesmos dias -------------------------------------- */
  var REELS = [
    { off: -16, n: 1, assunto: 'Convite',
      roteiro: 'Hook na tela: "Isso não vai no feed." Fala do convite em 15 a 20 segundos.' },
    { off: -14, n: 2, assunto: 'Dói?',
      roteiro: 'Hook: "Dói?" Recorte da fala do dia, com a sensação real.' },
    { off: -10, n: 3, assunto: 'Depoimento',
      roteiro: 'Recorte de 15 a 20 segundos do depoimento da cliente + CTA. Autorização de imagem e voz.' },
    { off: -7,  n: 4, assunto: 'Avaliação',
      roteiro: 'Hook: "Antes de qualquer procedimento, eu faço isso." Fala do bastidor da avaliação.' },
    { off: -5,  n: 5, assunto: 'Um ponto na cara',
      roteiro: '1 ponto no rosto + "seu caso é na avaliação". NÃO impulsionar: tem antes e depois.' },
    { off: -4,  n: 6, assunto: 'Como o grupo funciona',
      roteiro: 'Pode citar o plano de recorrência pelo nome. NÃO falar parcela nem valor — só dentro do grupo.' },
    { off: -2,  n: 7, assunto: 'Faltam 2 dias',
      roteiro: 'Hook: "Faltam 2 dias." Contagem para o dia da abertura.' },
    { off: -1,  n: 8, assunto: 'Véspera',
      roteiro: 'Véspera. Depois deste conteúdo não posta mais nada até o grupo abrir.' }
  ];

  var REGRAS = [
    'Um story por dia, nem mais nem menos.',
    'Celular em pé, de frente para uma janela, luz no rosto. Olhe a bolinha da câmera, não o próprio vídeo. Até 40 segundos.',
    'Nunca fale preço, condição em reais ou parcela. Isso é no grupo, no dia da abertura.',
    'Link do grupo em todos os stories.',
    'Antes e depois: autorização assinada, mesma luz, mesmo ângulo. "Esse foi o resultado dela."',
    'A última fala é sempre a frase de fechamento, igual em todos os dias.',
    'Story ruim no ar vale mais que story ótimo na galeria.'
  ];

  function troca(txt, ctx) {
    return String(txt)
      .replace(/\{\{CLINICA\}\}/g, ctx.clinica)
      .replace(/\{\{DATA\}\}/g, ctx.data)
      .replace(/\{\{HORA\}\}/g, ctx.hora)
      .replace(/\{\{CURTA\}\}/g, ctx.curta);
  }

  function iso(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  /* Monta o calendário para uma abertura. Sem data de abertura ainda, os itens
     nascem sem data e o título carrega o D- para manter a ordem: quando a data
     for definida, aplicar de novo só preenche as datas. */
  window.gerarRoteiroPadrao = function (abertura, clinica) {
    var ab = abertura ? new Date(abertura) : null;
    var temData = ab && isFinite(ab.getTime());

    var ctx = {
      clinica: clinica || 'clínica',
      data: temData ? ab.getDate() + ' de ' + MESES[ab.getMonth()] : '[DATA DA ABERTURA]',
      hora: temData
        ? (ab.getMinutes() ? ab.getHours() + 'h' + String(ab.getMinutes()).padStart(2, '0')
                           : ab.getHours() + ' horas')
        : '[HORÁRIO]',
      curta: temData
        ? String(ab.getDate()).padStart(2, '0') + '/' + String(ab.getMonth() + 1).padStart(2, '0') +
          ' · ' + ab.getHours() + 'h'
        : '[DATA] · [HORA]'
    };

    function dataDo(off) {
      if (!temData) return '';
      var d = new Date(ab.getTime());
      d.setDate(d.getDate() + off);
      return iso(d);
    }

    var itens = STORIES.map(function (s) {
      return {
        data: dataDo(s.off), hora: '', tipo: 'Story',
        titulo: 'D' + s.off + ' · ' + s.cod + ' · ' + troca(s.topo, ctx),
        conteudo: [
          'TEXTO NO TOPO: ' + troca(s.topo, ctx),
          '',
          'O QUE APARECE: ' + troca(s.aparece, ctx),
          '',
          'FALA (até 40s):',
          troca(s.fala, ctx),
          '',
          'FIGURINHAS: ' + troca(s.fig, ctx),
          'OVERLAY: ' + ctx.curta,
          '',
          'FECHA SEMPRE IGUAL:',
          troca(FECHAMENTO, ctx),
          s.extra ? '\nEXTRA: ' + troca(s.extra, ctx) : '',
          '\nNÃO PODE: ' + troca(s.nao, ctx)
        ].filter(Boolean).join('\n'),
        status: 'Planejado', alcance: 0, respostas: 0, midias: [],
        padrao: s.cod, offset: s.off
      };
    }).concat(REELS.map(function (r) {
      return {
        data: dataDo(r.off), hora: '', tipo: 'Reel',
        titulo: 'D' + r.off + ' · Reel ' + r.n + ' · ' + r.assunto,
        conteudo: troca(r.roteiro, ctx) +
          '\n\nVertical, 15 a 30 segundos, texto na tela, sem preço. ' +
          'CTA para o grupo no dia ' + ctx.data + ', às ' + ctx.hora + '.',
        status: 'Planejado', alcance: 0, respostas: 0, midias: [],
        padrao: 'REEL-' + r.n, offset: r.off
      };
    }));

    /* em ordem de data, e o story do dia antes do reel do mesmo dia */
    itens.sort(function (a, b) {
      if (a.offset !== b.offset) return a.offset - b.offset;
      return a.tipo === 'Story' ? -1 : 1;
    });
    return itens;
  };

  window.ROTEIRO_PADRAO = {
    nome: 'Aquecimento de 17 dias',
    origem: 'Roteiro da Dra. Joelma, adotado como padrão da casa.',
    stories: STORIES.length,
    reels: REELS.length,
    regras: REGRAS
  };
})();
