/* =============================================================================
   Função de servidor: a única coisa que fala com o banco.

   O painel é um site estático e aberto. Se ele falasse direto com o Supabase,
   precisaria de uma chave pública no código-fonte da página — e a chave anon
   deste projeto alcança as tabelas de produção da AIOS. Então não falamos
   direto: o navegador chama /api/painel, e é ESTA função (rodando no servidor
   da Vercel) que usa a chave secreta.

   A chave nunca sai do servidor. As tabelas gvip_* têm RLS ligado e nenhuma
   policy — só a chave secreta enxerga.

   GET  /api/painel?slug=botoclinic-riomar   -> { dados, atualizado_em, ... }
   POST /api/painel  { slug, dados, quem }   -> grava e versiona a anterior
   ========================================================================== */

const SLUGS = ['botoclinic-riomar', 'dr-colageno'];   // whitelist: nada além disto
const VERSOES_MANTIDAS = 30;

const URL = process.env.SUPABASE_URL;
const CHAVE = process.env.SUPABASE_SERVICE_KEY;

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

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (!URL || !CHAVE) {
    return res.status(503).json({
      erro: 'banco_nao_configurado',
      detalhe: 'Faltam as variáveis SUPABASE_URL e SUPABASE_SERVICE_KEY na Vercel.'
    });
  }

  const slug = (req.query?.slug || req.body?.slug || '').toString();
  if (!SLUGS.includes(slug)) {
    return res.status(400).json({ erro: 'slug_invalido' });
  }

  try {
    /* ---------- ler o painel ---------- */
    if (req.method === 'GET') {
      const r = await rest(
        'gvip_paineis?slug=eq.' + encodeURIComponent(slug) +
        '&select=slug,cliente,dados,atualizado_em,atualizado_por'
      );
      if (!r.ok) throw new Error('leitura falhou: ' + (await r.text()));
      const linhas = await r.json();
      if (!linhas.length) return res.status(404).json({ erro: 'painel_nao_encontrado' });
      return res.status(200).json(linhas[0]);
    }

    /* ---------- gravar o painel ---------- */
    if (req.method === 'POST') {
      const corpo = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const dados = corpo.dados;
      const quem = (corpo.quem || 'Desconhecido').toString().slice(0, 80);

      if (!dados || typeof dados !== 'object') {
        return res.status(400).json({ erro: 'dados_invalidos' });
      }

      /* Rede de proteção: guarda a versão que está lá ANTES de sobrescrever.
         O painel é aberto por link; se alguém zerar, dá para voltar. */
      const atual = await rest(
        'gvip_paineis?slug=eq.' + encodeURIComponent(slug) + '&select=dados'
      );
      if (atual.ok) {
        const [linha] = await atual.json();
        const anterior = linha?.dados;
        if (anterior && Object.keys(anterior).length) {
          await rest('gvip_versoes', {
            method: 'POST',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({ slug, dados: anterior, quem })
          });
        }
      }

      const r = await rest('gvip_paineis?slug=eq.' + encodeURIComponent(slug), {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          dados,
          atualizado_em: new Date().toISOString(),
          atualizado_por: quem
        })
      });
      if (!r.ok) throw new Error('gravação falhou: ' + (await r.text()));
      const [salvo] = await r.json();

      /* poda: mantém só as últimas versões */
      const velhas = await rest(
        'gvip_versoes?slug=eq.' + encodeURIComponent(slug) +
        '&select=id&order=criado_em.desc&offset=' + VERSOES_MANTIDAS
      );
      if (velhas.ok) {
        const ids = (await velhas.json()).map(function (v) { return v.id; });
        if (ids.length) {
          await rest('gvip_versoes?id=in.(' + ids.join(',') + ')', {
            method: 'DELETE',
            headers: { Prefer: 'return=minimal' }
          });
        }
      }

      return res.status(200).json({
        ok: true,
        atualizado_em: salvo?.atualizado_em,
        atualizado_por: salvo?.atualizado_por
      });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ erro: 'metodo_nao_permitido' });
  } catch (e) {
    return res.status(500).json({ erro: 'falha_no_banco', detalhe: String(e.message || e) });
  }
};
