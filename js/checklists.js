/* =============================================================================
   AIOS · Grupos VIP — o que precisa estar pronto antes de abrir o grupo.

   Os passos são os mesmos para todo cliente: é o procedimento da casa, não uma
   lista que cada painel inventa. Por isso moram aqui, no código. O que muda de
   cliente para cliente é só o estado de cada passo, que fica em
   dados.preparacao no banco.

   Mexer aqui muda o checklist de todos os painéis de uma vez. Passo novo entra
   pendente em todo mundo; passo removido some da tela, mas o que já estava
   gravado continua no banco.

   TRÊS COISAS QUE A AUDITORIA DA MICHELE (09/2026) ENSINOU:

   1. Caixa de marcar não dá conta. Aquele levantamento fechou em 26 feito,
      14 PARCIAL, 40 pendente e 28 NÃO USAR. Com dois estados só, "parcial"
      vira mentira (marca como feito) ou some (fica pendente para sempre), e
      "não se aplica" prende o painel abaixo de 100% para sempre.

   2. Nem todo passo pesa igual. O levantamento separou "o que trava a grade"
      de "o que não trava". Sem horário da abertura, sem handle do Instagram,
      sem link do grupo e sem tamanho da base não há roteiro para gerar — o
      resto pode esperar. Quem tem `trava: true` é isso.

   3. Faltava um bloco. Vertical da abertura, quem grava, Instagram: nada disso
      existia no painel, e é justamente o que o roteiro pede entre colchetes.
      Pior: a vertical é o que decide se o roteiro padrão serve. Ele é de pele
      e face; na Michele, que é corpo e verão, os 25 itens viraram "não usar"
      inteiros.
   ========================================================================== */
(function (raiz) {
  'use strict';

  /* pendente → parcial → feito, mais "não se aplica" para o que não é deste
     cliente. Resolvido = feito ou não se aplica. */
  var ESTADOS = [
    { id: 'pendente', nome: 'Pendente' },
    { id: 'parcial',  nome: 'Parcial' },
    { id: 'feito',    nome: 'Feito' },
    { id: 'na',       nome: 'Não se aplica' }
  ];

  var CHECKLISTS = [
    {
      id: 'definicoes',
      nome: 'Definições da campanha',
      resumo: 'As decisões que destravam todo o resto. Enquanto faltarem, não há roteiro para gerar nem grade para montar, e é aqui que a campanha costuma parar sem ninguém perceber.',
      passos: [
        { id: 'def-1', titulo: 'Data e horário da abertura confirmados', trava: true,
          ajuda: 'A data sozinha não basta. Todo story fecha com "no dia X, às Y horas" e o roteiro não fecha sem a hora. Confirmado com a clínica, não sugerido.' },
        { id: 'def-2', titulo: 'Vertical desta abertura', trava: true,
          ajuda: 'Pele e face, corpo, injetáveis? É o que decide se o roteiro padrão serve. Ele é de pele e face: em outra vertical os 25 itens têm que ser trocados, não adaptados.' },
        { id: 'def-3', titulo: 'Instagram da clínica', trava: true,
          ajuda: 'O @ onde os stories vão ao ar. Sem isso não dá para combinar horário de publicação nem conferir se saiu.' },
        { id: 'def-4', titulo: 'Quem grava e aparece',
          ajuda: 'O roteiro é escrito em primeira pessoa, com voz de dona da clínica. Se quem aparece for outra pessoa, várias falas mudam de tom.' },
        { id: 'def-5', titulo: 'Autorização de imagem assinada',
          ajuda: 'Antes e depois e depoimento de cliente só entram com autorização assinada. Sem ela, esses dias do roteiro caem.' },
        { id: 'def-6', titulo: 'Time do dia da abertura definido',
          ajuda: 'Quem responde o WhatsApp, quem posta e quem fecha a venda no dia. Nome e função, não "a equipe".' }
      ]
    },
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
          ajuda: 'Conta nova começa com limite baixo. Só fecha contra o tamanho da base: conferir antes de prometer volume por dia.' },
        { id: 'api-7', titulo: 'Número conectado ao CRM',
          ajuda: 'Canal criado no WTS/FLW e recebendo mensagem de verdade, não só configurado.' },
        { id: 'api-8', titulo: 'Templates enviados e aprovados',
          ajuda: 'Todo primeiro contato fora da janela de 24h é template. Aprovação leva tempo: enviar junto com o resto do setup.' },
        { id: 'api-9', titulo: 'Teste ponta a ponta em número real',
          ajuda: 'Disparar para um celular do time e responder. Tem que aparecer como conversa no CRM, com a etiqueta certa.' },
        { id: 'api-10', titulo: 'Grupo de pacientes criado e link testado', trava: true,
          ajuda: 'É este link que vai em todo story: sem ele o aquecimento não tem para onde mandar ninguém. Abrir numa conta que não é do time e confirmar que entra.' }
      ]
    },
    {
      id: 'base',
      nome: 'Base de contatos e campanhas',
      resumo: 'De onde vem a gente que entra no grupo. Feito a cada campanha, porque a base muda e quem já comprou não pode receber o mesmo convite de novo.',
      passos: [
        { id: 'base-1', titulo: 'Base extraída e tamanho conhecido', trava: true,
          ajuda: 'ERP, CRM ou planilha. O tamanho não é detalhe: é ele que define as ondas, o limite da API e a meta de membros. Contar, nunca estimar.' },
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

  /* Lê o estado aceitando o formato antigo: painel gravado antes dos quatro
     estados guardava só { feito: true }. */
  function estadoDe(registro) {
    if (!registro) return 'pendente';
    if (registro.estado) return registro.estado;
    return registro.feito ? 'feito' : 'pendente';
  }

  function progressoChecklists(preparacao) {
    var p = preparacao || {};
    var r = { total: 0, feitos: 0, parciais: 0, pendentes: 0, na: 0, bloqueios: [] };

    CHECKLISTS.forEach(function (bloco) {
      bloco.passos.forEach(function (passo) {
        r.total++;
        var e = estadoDe(p[passo.id]);
        if (e === 'feito') r.feitos++;
        else if (e === 'parcial') r.parciais++;
        else if (e === 'na') r.na++;
        else r.pendentes++;

        /* Bloqueio é passo que trava a grade e ainda não está resolvido.
           Parcial continua travando: "API ligada, número em branco" não gera
           roteiro nenhum. */
        if (passo.trava && (e === 'pendente' || e === 'parcial')) {
          r.bloqueios.push({ id: passo.id, titulo: passo.titulo, estado: e, bloco: bloco.nome });
        }
      });
    });

    /* Passo que não vale para esta clínica conta como resolvido: senão o
       painel fica preso abaixo de 100% para sempre. */
    r.resolvidos = r.feitos + r.na;
    r.pct = r.total ? Math.round(r.resolvidos / r.total * 100) : 0;
    return r;
  }

  /* Serve aos dois lados: no navegador vira window.CHECKLISTS, no servidor é
     require() de api/lembretes.js. Assim o total de passos tem uma fonte só. */
  raiz.CHECKLISTS = CHECKLISTS;
  raiz.ESTADOS_PREP = ESTADOS;
  raiz.estadoPrepDe = estadoDe;
  raiz.progressoChecklists = progressoChecklists;
  if (typeof module === 'object' && module.exports) {
    module.exports = {
      CHECKLISTS: CHECKLISTS, ESTADOS: ESTADOS,
      estadoDe: estadoDe, progressoChecklists: progressoChecklists
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
