/* =============================================================================
   Lembrete diário dos grupos de organização.

   A DECISÃO DO QUE MANDAR MORA AQUI, não no n8n. O n8n é encanamento: pede a
   lista, reserva o dia e posta. Toda a regra de o que é urgente, o que ficou
   para trás e o que nem vale mencionar fica neste arquivo, num lugar só, em
   JavaScript comum — em vez de espalhada por Code node, onde ninguém consegue
   ler nem testar.

   GET  /api/lembretes            -> quem tem lembrete para hoje, com o texto pronto
        ?slug=x                   -> só um cliente, para conferir
        ?todos=1                  -> inclui quem já recebeu hoje (para inspeção)
   POST /api/lembretes {slug}     -> reserva o dia ANTES de enviar

   A reserva é o que impede envio repetido: a chave (slug, dia) da tabela
   gvip_lembretes só aceita uma linha por dia. Segunda execução no mesmo dia
   não reserva e portanto não manda. Reservar antes de enviar (e não depois) é
   de propósito: se o envio falhar, perde-se um lembrete — o que é muito melhor
   que mandar o mesmo recado duas vezes no grupo do cliente.
   ========================================================================== */

/* Mesma lista que a tela de Preparação usa: o total de passos tem uma fonte
   só. Repetir o número aqui daria certo hoje e mentiria no dia em que alguém
   acrescentasse um passo no checklist. */
const { progressoChecklists } = require('../js/checklists.js');

const URL = process.env.SUPABASE_URL;
const CHAVE = process.env.SUPABASE_SERVICE_KEY;
const TOKEN = process.env.LEMBRETE_TOKEN;

const SITE = 'https://aios-grupos-vip.vercel.app';
const DIAS_A_FRENTE = 3;      // "vem aí" olha os próximos dias
const MAX_ATRASADAS = 6;      // lista longa demais ninguém lê
const FUSO = 'America/Sao_Paulo';

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

/* O servidor roda em UTC. "Hoje" tem que ser o dia de São Paulo, senão entre
   21h e meia-noite o lembrete pula um dia. */
function hojeSP() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

function somaDias(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const brl = n => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
const dataBR = iso => (iso || '').slice(0, 10).split('-').reverse().slice(0, 2).join('/');

/* ---------------------------------------------------------------------------
   A REGRA. Devolve o texto do lembrete, ou null quando não há o que dizer.

   Prioridade, na ordem em que aparece na mensagem:
   1. o que gravar hoje       — é o que trava o aquecimento se não sair
   2. o que ficou para trás   — o mais importante: conteúdo perdido não volta
   3. o que vem aí            — deixa gravar em lote, que rende mais
   4. disparos em andamento   — o "o que está sendo feito"
   5. preparação em aberto    — só quando ainda falta algo

   Mensagem que chega todo dia sem ter o que dizer vira ruído e para de ser
   lida. Por isso: sem gravação hoje, sem atraso e sem nada nos próximos dias,
   este cliente não recebe nada.
--------------------------------------------------------------------------- */
function montarLembrete(painel, hoje) {
  const d = painel.dados || {};
  const g = d.grupo || {};
  const aquecimento = d.aquecimento || [];

  if (!g.grupoOperacao) return null;   // sem grupo, não há para onde mandar
  if (!g.abertura) return null;        // sem data, o calendário não tem dia

  const abertura = g.abertura.slice(0, 10);
  const pendente = i => i.status === 'Planejado' && i.data;

  const hojeItens = aquecimento.filter(i => pendente(i) && i.data === hoje);
  const atrasadas = aquecimento.filter(i => pendente(i) && i.data < hoje)
                               .sort((a, b) => a.data.localeCompare(b.data));
  const limite = somaDias(hoje, DIAS_A_FRENTE);
  const proximas = aquecimento.filter(i => pendente(i) && i.data > hoje && i.data <= limite)
                              .sort((a, b) => a.data.localeCompare(b.data));

  /* Bloqueio conta como motivo para mandar: um passo que trava a grade é
     urgente mesmo num dia sem gravação marcada. */
  const prep = progressoChecklists(d.preparacao);
  if (!hojeItens.length && !atrasadas.length && !proximas.length && !prep.bloqueios.length) {
    return null;
  }

  const faltam = Math.round(
    (new Date(abertura + 'T12:00:00Z') - new Date(hoje + 'T12:00:00Z')) / 86400000
  );

  const linhas = [];
  linhas.push('*' + g.cliente + '*');
  linhas.push(faltam > 0
    ? 'Abertura ' + dataBR(abertura) + ' · faltam ' + faltam + (faltam === 1 ? ' dia' : ' dias')
    : faltam === 0 ? 'Abertura é *hoje*' : 'Abertura foi em ' + dataBR(abertura));

  if (hojeItens.length) {
    linhas.push('', '*Gravar hoje (' + dataBR(hoje) + ')*');
    hojeItens.forEach(i => linhas.push('• ' + i.tipo + ' · ' + i.titulo));
  }

  /* O bloco que o cliente mais pediu: nada de conteúdo ficar para trás sem
     ninguém perceber. Vem antes do "vem aí" porque é o que já está perdendo. */
  if (atrasadas.length) {
    linhas.push('', '*Ficou para trás — ' + atrasadas.length +
      (atrasadas.length === 1 ? ' item*' : ' itens*'));
    atrasadas.slice(0, MAX_ATRASADAS).forEach(i =>
      linhas.push('• ' + dataBR(i.data) + ' · ' + i.titulo));
    if (atrasadas.length > MAX_ATRASADAS) {
      linhas.push('• e mais ' + (atrasadas.length - MAX_ATRASADAS) + ' no painel');
    }
    linhas.push('_Se já foi ao ar, marque como enviado no painel._');
  }

  if (proximas.length) {
    linhas.push('', '*Vem aí*');
    proximas.forEach(i => linhas.push('• ' + dataBR(i.data) + ' · ' + i.titulo));
  }

  const disparos = (d.captacao || []).filter(c => Number(c.disparos) > 0 || Number(c.investimento) > 0);
  if (disparos.length) {
    linhas.push('', '*Disparos*');
    disparos.forEach(c => {
      const partes = [];
      if (Number(c.disparos)) partes.push(Number(c.disparos).toLocaleString('pt-BR') + ' disparos');
      if (Number(c.investimento)) partes.push(brl(c.investimento));
      if (Number(c.entradas)) partes.push(Number(c.entradas) + ' entraram');
      linhas.push('• ' + (c.canal || 'sem nome') + ': ' + partes.join(' · '));
    });
  }

  /* Bloqueio é a informação mais acionável do lembrete: enquanto estiver
     aberto, gravar story não adianta porque a frase de fechamento não fecha. */
  if (prep.bloqueios.length) {
    linhas.push('', '*Travando a grade*');
    prep.bloqueios.forEach(b => linhas.push('• ' + b.titulo +
      (b.estado === 'parcial' ? ' _(parcial)_' : '')));
  } else if (prep.resolvidos < prep.total) {
    linhas.push('', '*Preparação* ' + prep.resolvidos + ' de ' + prep.total + ' passos');
  }

  linhas.push('', SITE + '/' + painel.slug + '/');

  return {
    texto: linhas.join('\n'),
    resumo: [
      hojeItens.length + ' hoje',
      atrasadas.length + ' atrasadas',
      proximas.length + ' próximas'
    ].join(' · ')
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (!URL || !CHAVE) {
    return res.status(503).json({ erro: 'banco_nao_configurado' });
  }
  if (!TOKEN) {
    return res.status(503).json({
      erro: 'token_nao_configurado',
      detalhe: 'Falta a variável LEMBRETE_TOKEN na Vercel.'
    });
  }
  const enviado = req.headers['x-lembrete-token'];
  if (enviado !== TOKEN) {
    return res.status(401).json({ erro: 'nao_autorizado' });
  }

  const hoje = hojeSP();

  try {
    /* ---------- reservar o dia (chamado ANTES de enviar) ---------- */
    if (req.method === 'POST') {
      const corpo = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const slug = (corpo.slug || '').toString();
      if (!/^[a-z0-9-]{2,40}$/.test(slug)) return res.status(400).json({ erro: 'slug_invalido' });

      const r = await rest('gvip_lembretes?on_conflict=slug,dia', {
        method: 'POST',
        headers: { Prefer: 'return=representation,resolution=ignore-duplicates' },
        body: JSON.stringify({ slug, dia: hoje, resumo: corpo.resumo || null })
      });
      if (!r.ok) throw new Error('reserva falhou: ' + (await r.text()));
      const linhas = await r.json();
      const reservado = linhas.length > 0;

      /* Devolve o texto junto com a reserva. Assim o n8n manda o que veio desta
         mesma resposta, sem precisar buscar o texto num nó anterior: uma etapa
         a menos para dar errado, e o que foi reservado é exatamente o que vai
         ser postado. */
      let grupo = null, texto = null;
      if (reservado) {
        const rp = await rest('gvip_paineis?select=slug,cliente,dados&slug=eq.' +
                              encodeURIComponent(slug));
        if (rp.ok) {
          const [painel] = await rp.json();
          const l = painel && montarLembrete(painel, hoje);
          if (l) { grupo = painel.dados.grupo.grupoOperacao; texto = l.texto; }
        }
      }

      /* reservado=false: já existia reserva para hoje. Não é erro, é a proteção
         funcionando. O n8n lê `reservado` e só envia se for true. */
      return res.status(200).json({ reservado, slug, dia: hoje, grupo, texto });
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ erro: 'metodo_nao_permitido' });
    }

    /* ---------- montar a lista do dia ---------- */
    const rp = await rest('gvip_paineis?select=slug,cliente,dados');
    if (!rp.ok) throw new Error('leitura falhou: ' + (await rp.text()));
    const paineis = await rp.json();

    const rl = await rest('gvip_lembretes?select=slug&dia=eq.' + hoje);
    const jaEnviados = rl.ok ? (await rl.json()).map(x => x.slug) : [];

    const um = (req.query?.slug || '').toString();
    const todos = String(req.query?.todos || '') === '1';

    const lista = [];
    for (const p of paineis) {
      if (um && p.slug !== um) continue;
      if (!todos && !um && jaEnviados.includes(p.slug)) continue;
      const l = montarLembrete(p, hoje);
      if (!l) continue;
      lista.push({
        slug: p.slug,
        cliente: p.cliente,
        grupo: p.dados.grupo.grupoOperacao,
        texto: l.texto,
        resumo: l.resumo,
        jaEnviadoHoje: jaEnviados.includes(p.slug)
      });
    }

    return res.status(200).json({ dia: hoje, total: lista.length, lembretes: lista });
  } catch (e) {
    return res.status(500).json({ erro: 'falha', detalhe: String(e.message || e) });
  }
};
