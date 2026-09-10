/* =============================================================================
   Disparo das ofertas no grupo VIP (o grupo do paciente, não o de organização).

   Mesma divisão de trabalho de /api/lembretes: A DECISÃO MORA AQUI. O n8n pede
   a lista de mensagens da janela, reserva uma por uma e posta. Nenhuma regra e
   nenhum texto de oferta vive dentro de Code node.

   GET  /api/oferta?slug=x&janela=j1     -> as mensagens da janela, prontas
   POST /api/oferta {slug,janela,ordem}  -> reserva UMA mensagem antes de enviar
   POST /api/oferta {...,liberar:true}   -> devolve a reserva quando o envio falhou

   POR QUE A RESERVA É POR MENSAGEM E NÃO POR JANELA
   Em /api/lembretes a reserva é do dia inteiro, e está certo: é uma mensagem
   só. Aqui uma janela tem uma dúzia. Reservar o bloco inteiro deixaria só duas
   saídas ruins quando a Evolution piscar no meio: perder o resto da janela, ou
   repetir tudo num grupo de 219 pacientes. Com a chave (slug,dia,janela,ordem)
   a retomada continua exatamente de onde parou.
   ========================================================================== */

const URL = process.env.SUPABASE_URL;
const CHAVE = process.env.SUPABASE_SERVICE_KEY;
const TOKEN = process.env.LEMBRETE_TOKEN;   // mesmo segredo do lembrete

const FUSO = 'America/Sao_Paulo';

/* Espera entre mensagens, em segundos. O número é novo na instância e o grupo
   tem centenas de pessoas: doze mensagens em dez segundos é comportamento de
   robô, e quem paga por isso é o número da cliente. */
const ESPERA_COMBO = 45;
const ESPERA_ABERTURA = 20;

function rest(caminho, opcoes = {}) {
  return fetch(URL + '/rest/v1/' + caminho, {
    ...opcoes,
    headers: {
      apikey: CHAVE,
      Authorization: 'Bearer ' + CHAVE,
      'Content-Type': 'application/json',
      ...(opcoes.headers || {})
    }
  });
}

function hojeSP() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

const brl = n => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
});

/* ---------------------------------------------------------------------------
   RECADO INTERNO NÃO VAI PARA O GRUPO.

   A descrição do combo é escrita pela equipe e às vezes carrega instrução de
   operação junto com a oferta. O Combo 9 da Spazio Andela termina com
   "⚠️ NUNCA no Instagram. Fármaco só dentro do grupo, com indicação do
   nutrólogo." — que é ordem para quem posta, não texto para paciente ler.

   Regra da casa: linha que começa com ⚠️ é interna e nunca sai. Fica escrito
   aqui e no painel, para que quem escrever a próxima descrição saiba onde
   colocar o recado sem que ele vaze.
--------------------------------------------------------------------------- */
const ehInterna = linha => /^\s*⚠️/.test(linha);

function limpar(descricao) {
  return String(descricao || '')
    .split('\n')
    .filter(l => !ehInterna(l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* A auditoria da Michele proíbe promessa de quilo ("emagreça X kg"). Não apago
   sozinho: apagar mudaria a oferta calado. Devolvo como aviso, para aparecer na
   conferência antes de a janela ir ao ar. */
function avisosDe(texto, nome) {
  const fora = [];
  if (/\b\d+\s*(kg|quilos?)\b/i.test(texto)) {
    fora.push(nome + ': fala em quilo, e a auditoria proíbe promessa de peso');
  }
  if (/emagre[çc]a/i.test(texto)) {
    fora.push(nome + ': usa "emagreça", que a auditoria proíbe em oferta');
  }
  return fora;
}

/* ---------------------------------------------------------------------------
   As janelas.

   A estratégia da Andela, escrita no próprio painel: "abre, sai a condição, as
   meninas pedem, fecha. Horas depois abre de novo, com coisa que ainda não
   saiu." Ou seja, a reabertura é REAÇÃO ao grupo, não relógio — por isso só a
   primeira janela tem hora marcada. As outras existem prontas e são disparadas
   à mão, quando a equipe decidir.

   A composição fica em dados.janelas, editável no painel. Sem isso, cai numa
   janela única com tudo — que funciona, mas não é a estratégia.
--------------------------------------------------------------------------- */
function janelasDe(d) {
  const definidas = Array.isArray(d.janelas) && d.janelas.length ? d.janelas : null;
  if (definidas) return definidas;
  return [{
    id: 'j1',
    titulo: 'Carrinho aberto',
    produtos: (d.produtos || []).map(p => p.id)
  }];
}

function montarJanela(painel, janelaId, hoje, jaEnviadas) {
  const d = painel.dados || {};
  const g = d.grupo || {};

  /* Falha fechado de propósito. grupoOperacao é o grupo interno, de 6 pessoas;
     grupoVip é o do paciente, de centenas. Cair de um para o outro mandaria a
     oferta para a sala errada — ou, no sentido inverso, o recado interno para
     todo mundo. Sem grupoVip preenchido, não existe envio. */
  if (!g.grupoVip) {
    return { erro: 'sem_grupo_vip', detalhe: 'Preencha o grupo VIP em Parâmetros do grupo.' };
  }

  const janelas = janelasDe(d);
  const j = janelas.find(x => x.id === janelaId);
  if (!j) {
    return { erro: 'janela_desconhecida', detalhe: 'Janelas: ' + janelas.map(x => x.id).join(', ') };
  }

  const porId = Object.fromEntries((d.produtos || []).map(p => [p.id, p]));
  const escolhidos = (j.produtos || []).map(id => porId[id]).filter(Boolean);

  const mensagens = [];
  const avisos = [];
  let ordem = 0;

  const push = (rotulo, texto, espera) => {
    mensagens.push({
      ordem: ++ordem,
      rotulo,
      texto: texto.trim(),
      esperaDepois: espera,
      jaEnviada: jaEnviadas.includes(ordem)
    });
  };

  if (j.abertura) push('abertura', j.abertura, ESPERA_ABERTURA);

  escolhidos.forEach(p => {
    const corpo = limpar(p.descricao);
    const texto = ['*' + p.nome + '*', '', corpo, '', '💰 ' + brl(p.vip)]
      .filter((l, i, a) => !(l === '' && a[i - 1] === ''))
      .join('\n');
    avisos.push(...avisosDe(texto, p.nome));
    if (!corpo) avisos.push(p.nome + ': sem descrição, vai só com nome e preço');
    if (!Number(p.vip)) avisos.push(p.nome + ': valor zerado');
    push(p.id, texto, ESPERA_COMBO);
  });

  if (j.fechamento) push('fechamento', j.fechamento, 0);

  /* A última não precisa esperar por nada. */
  if (mensagens.length) mensagens[mensagens.length - 1].esperaDepois = 0;

  return {
    slug: painel.slug,
    cliente: painel.cliente,
    grupo: g.grupoVip,
    dia: hoje,
    janela: j.id,
    titulo: j.titulo || j.id,
    total: mensagens.length,
    pendentes: mensagens.filter(m => !m.jaEnviada).length,
    duracaoEstimada: mensagens.reduce((s, m) => s + m.esperaDepois, 0),
    avisos,
    mensagens
  };
}

async function reservadas(slug, dia, janela) {
  const r = await rest('gvip_disparos?select=ordem&slug=eq.' + encodeURIComponent(slug) +
                       '&dia=eq.' + dia + '&janela=eq.' + encodeURIComponent(janela));
  return r.ok ? (await r.json()).map(x => x.ordem) : [];
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (!URL || !CHAVE) return res.status(503).json({ erro: 'banco_nao_configurado' });
  if (!TOKEN) return res.status(503).json({ erro: 'token_nao_configurado' });
  if (req.headers['x-lembrete-token'] !== TOKEN) return res.status(401).json({ erro: 'nao_autorizado' });

  const corpo = req.method === 'POST'
    ? (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}))
    : {};

  const slug = String(corpo.slug || req.query?.slug || '');
  const janela = String(corpo.janela || req.query?.janela || 'j1');
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) return res.status(400).json({ erro: 'slug_invalido' });
  if (!/^[a-z0-9-]{1,20}$/.test(janela)) return res.status(400).json({ erro: 'janela_invalida' });

  /* O dia de referência é o de São Paulo. Uma janela que abre 10h da manhã
     nunca cruza a meia-noite, mas o servidor roda em UTC e a data dele já
     virou — sem isso a reserva iria para o dia seguinte. */
  const dia = String(corpo.dia || req.query?.dia || hojeSP());

  try {
    const rp = await rest('gvip_paineis?select=slug,cliente,dados&slug=eq.' + encodeURIComponent(slug));
    if (!rp.ok) throw new Error('leitura falhou: ' + (await rp.text()));
    const [painel] = await rp.json();
    if (!painel) return res.status(404).json({ erro: 'painel_nao_encontrado', slug });

    if (req.method === 'GET') {
      const ja = await reservadas(slug, dia, janela);
      const r = montarJanela(painel, janela, dia, ja);
      return res.status(r.erro ? 409 : 200).json(r);
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ erro: 'metodo_nao_permitido' });
    }

    const ordem = Number(corpo.ordem);
    if (!Number.isInteger(ordem) || ordem < 1) return res.status(400).json({ erro: 'ordem_invalida' });

    /* Devolver a reserva. Só em falha de REQUISIÇÃO — a API recusou e nada foi
       enviado. Nunca em status de entrega ambíguo: o ERROR do MessageUpdate
       não prova que a mensagem não chegou, e liberar nesse caso duplicaria a
       oferta no grupo. */
    if (corpo.liberar) {
      const r = await rest('gvip_disparos?slug=eq.' + encodeURIComponent(slug) +
                           '&dia=eq.' + dia + '&janela=eq.' + encodeURIComponent(janela) +
                           '&ordem=eq.' + ordem, {
        method: 'DELETE', headers: { Prefer: 'return=representation' }
      });
      if (!r.ok) throw new Error('liberação falhou: ' + (await r.text()));
      const apagadas = await r.json();
      return res.status(200).json({ liberado: apagadas.length > 0, slug, dia, janela, ordem });
    }

    const ja = await reservadas(slug, dia, janela);
    const montada = montarJanela(painel, janela, dia, ja);
    if (montada.erro) return res.status(409).json(montada);

    const msg = montada.mensagens.find(m => m.ordem === ordem);
    if (!msg) return res.status(404).json({ erro: 'mensagem_inexistente', ordem, total: montada.total });

    const r = await rest('gvip_disparos?on_conflict=slug,dia,janela,ordem', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=ignore-duplicates' },
      body: JSON.stringify({ slug, dia, janela, ordem, rotulo: msg.rotulo })
    });
    if (!r.ok) throw new Error('reserva falhou: ' + (await r.text()));
    const linhas = await r.json();
    const reservado = linhas.length > 0;

    /* O texto volta junto com a reserva: o n8n posta exatamente o que acabou de
       reservar, sem buscar em outro nó. Uma etapa a menos para divergir. */
    return res.status(200).json({
      reservado, slug, dia, janela, ordem,
      rotulo: msg.rotulo,
      grupo: montada.grupo,
      texto: reservado ? msg.texto : null,
      esperaDepois: msg.esperaDepois,
      total: montada.total
    });
  } catch (e) {
    return res.status(500).json({ erro: 'falha', detalhe: String(e.message || e) });
  }
};
