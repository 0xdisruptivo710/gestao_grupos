/* =============================================================================
   AIOS · Grupos VIP — o que precisa estar pronto antes de abrir o grupo.

   Os passos são os mesmos para todo cliente: é o procedimento da casa, não uma
   lista que cada painel inventa. Por isso moram aqui, no código. O que muda de
   cliente para cliente é só o estado de cada passo (feito, quem marcou, quando
   e a anotação), que fica em dados.preparacao no banco.

   Mexer aqui muda o checklist de todos os painéis de uma vez. Passo novo entra
   desmarcado em todo mundo; passo removido some da tela, mas o que já estava
   gravado continua no banco.
   ========================================================================== */
(function (raiz) {
  'use strict';

  var CHECKLISTS = [
    {
      id: 'api',
      nome: 'Canal oficial no ar',
      resumo: 'Sem WABA aprovada e conectada ao CRM não existe disparo. Este bloco é feito uma vez por cliente e costuma ser o que atrasa a data de abertura.',
      passos: [
        { id: 'api-1', titulo: 'Business Manager da clínica criada e verificada',
          ajuda: 'A BM tem que ser da clínica, com CNPJ dela. BM emprestada trava a verificação depois.' },
        { id: 'api-2', titulo: 'Número novo separado para o disparo',
          ajuda: 'Chip que nunca teve WhatsApp ativo. Migrar o número do atendimento derruba o histórico e o time fica sem canal.' },
        { id: 'api-3', titulo: 'WABA criada dentro da BM',
          ajuda: 'WhatsApp Business Account. É ela que recebe o número e os templates.' },
        { id: 'api-4', titulo: 'Cartão de crédito cadastrado na BM',
          ajuda: 'Sem forma de pagamento a conta entra em modo restrito no meio da campanha, normalmente no dia de maior volume.' },
        { id: 'api-5', titulo: 'Perfil do WhatsApp preenchido',
          ajuda: 'Nome de exibição, foto, descrição, endereço e categoria. O nome de exibição passa por aprovação da Meta.' },
        { id: 'api-6', titulo: 'Limite de envio conferido',
          ajuda: 'Conta nova começa com limite baixo. Conferir antes de prometer volume de disparo por dia.' },
        { id: 'api-7', titulo: 'Número conectado ao CRM',
          ajuda: 'Canal criado no WTS/FLW e recebendo mensagem de verdade, não só configurado.' },
        { id: 'api-8', titulo: 'Templates enviados e aprovados',
          ajuda: 'Todo primeiro contato fora da janela de 24h é template. Aprovação leva tempo: enviar junto com o resto do setup.' },
        { id: 'api-9', titulo: 'Teste ponta a ponta em número real',
          ajuda: 'Disparar para um celular do time e responder. Tem que aparecer como conversa no CRM, com a etiqueta certa.' },
        { id: 'api-10', titulo: 'Link do grupo criado e testado',
          ajuda: 'Abrir o link numa conta que não é do time e confirmar que entra. É este link que vai em todo story.' }
      ]
    },
    {
      id: 'base',
      nome: 'Base de contatos e campanhas',
      resumo: 'De onde vem a gente que entra no grupo. Feito a cada campanha, porque a base muda e quem já comprou não pode receber o mesmo convite de novo.',
      passos: [
        { id: 'base-1', titulo: 'Base extraída da fonte',
          ajuda: 'ERP, CRM ou planilha da clínica. Anotar aqui de onde veio e quantos contatos brutos.' },
        { id: 'base-2', titulo: 'Telefones normalizados e duplicados removidos',
          ajuda: 'Formato 55 + DDD + número. Normalizar pelo telefone formatado, não pelo cru: o dígito 9 costuma se perder.' },
        { id: 'base-3', titulo: 'Cruzada com quem já comprou',
          ajuda: 'Convite de reativação para quem comprou semana passada queima a base. Cruzar com as vendas do ERP antes.' },
        { id: 'base-4', titulo: 'Quem já está no grupo foi excluído',
          ajuda: 'Se a clínica já montou um grupo por conta, esses contatos não entram no disparo de convite.' },
        { id: 'base-5', titulo: 'Base segmentada por recência e valor',
          ajuda: 'Ordenar do mais quente ao mais frio. Quem comprou nos últimos meses e gastou mais vai nas primeiras ondas.' },
        { id: 'base-6', titulo: 'Ondas de disparo definidas',
          ajuda: 'Quantos por dia e em que ordem, respeitando o limite da conta. Onda inteira de uma vez derruba a entrega.' },
        { id: 'base-7', titulo: 'Copy do convite aprovada pela clínica',
          ajuda: 'Sem valor e sem promessa. O convite vende a entrada no grupo, não o procedimento.' },
        { id: 'base-8', titulo: 'Etiqueta de origem configurada no CRM',
          ajuda: 'Toda entrada precisa de etiqueta de origem. Sem isso não dá para saber depois qual canal encheu o grupo.' },
        { id: 'base-9', titulo: 'Disparo teste numa amostra pequena',
          ajuda: 'Vinte a cinquenta contatos. Conferir entrega, texto quebrado e se a entrada no grupo está sendo contada.' },
        { id: 'base-10', titulo: 'Disparo em ondas acompanhado',
          ajuda: 'Acompanhar bloqueio, descadastro e entrada no grupo a cada onda. Onda ruim se corrige na seguinte, não depois.' }
      ]
    }
  ];

  /* Quantos passos existem e quantos estão feitos. O painel usa nos indicadores
     e na linha do tempo da visão geral. */
  function progressoChecklists(preparacao) {
    var p = preparacao || {};
    var total = 0, feitos = 0;
    CHECKLISTS.forEach(function (bloco) {
      bloco.passos.forEach(function (passo) {
        total++;
        if (p[passo.id] && p[passo.id].feito) feitos++;
      });
    });
    return { total: total, feitos: feitos, pct: total ? Math.round(feitos / total * 100) : 0 };
  }

  /* Serve aos dois lados: no navegador vira window.CHECKLISTS, no servidor é
     require() de api/lembretes.js. Assim o total de passos tem uma fonte só —
     antes a API repetia "20" na mão e passaria a mentir no dia em que alguém
     acrescentasse um passo aqui. */
  raiz.CHECKLISTS = CHECKLISTS;
  raiz.progressoChecklists = progressoChecklists;
  if (typeof module === 'object' && module.exports) {
    module.exports = { CHECKLISTS: CHECKLISTS, progressoChecklists: progressoChecklists };
  }
})(typeof window !== 'undefined' ? window : globalThis);
