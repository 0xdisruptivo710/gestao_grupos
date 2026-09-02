/* =============================================================================
   AIOS · Grupos VIP — quem tem painel.

   Esta lista é a única fonte da verdade sobre os clientes. O hub monta os
   cartões a partir dela e cada painel descobre de quem ele é lendo o primeiro
   pedaço da URL:

     /botoclinic-riomar/captacao.html  ->  slug 'botoclinic-riomar'

   Antes existia uma pasta por cliente com as nove telas copiadas dentro. Eram
   nove arquivos iguais vezes o número de clientes, e qualquer ajuste de tela
   precisava ser repetido em todas elas. Agora as telas moram em /app e valem
   para todo mundo.

   Para abrir um painel novo, duas linhas:
     1. acrescente o cliente aqui;
     2. crie a linha dele na tabela gvip_paineis com o mesmo slug.
   O passo 2 não é opcional: sem a linha no banco o painel abre, mas não salva.
   ========================================================================== */
(function () {
  'use strict';

  var LISTA = [
    {
      slug: 'botoclinic-riomar',
      cliente: 'Botoclinic Riomar',
      equipeCliente: 'Equipe Botoclinic',
      grupo: 'Grupo VIP'
    },
    {
      slug: 'dr-colageno',
      cliente: 'Dr. Colágeno',
      equipeCliente: 'Equipe Dr. Colágeno',
      grupo: 'Grupo VIP'
    },
    {
      slug: 'dra-joelma-torigoi',
      cliente: 'Dra. Joelma Torigoi',
      equipeCliente: 'Equipe Dra. Joelma',
      grupo: 'Grupo VIP'
    },
    {
      slug: 'andela-michele',
      cliente: 'Andela Michele',
      equipeCliente: 'Equipe Andela Michele',
      grupo: 'Grupo VIP'
    },
    {
      slug: 'fd-duque-de-caxias',
      cliente: 'FD Duque de Caxias',
      equipeCliente: 'Equipe FD Duque',
      grupo: 'Grupo VIP'
    }
  ];

  /* O slug é o primeiro pedaço do caminho. Serve tanto para /cliente/ quanto
     para /cliente/captacao.html. */
  function slugAtual() {
    var partes = location.pathname.split('/').filter(Boolean);
    return partes.length ? decodeURIComponent(partes[0]).toLowerCase() : '';
  }

  function achar(slug) {
    for (var i = 0; i < LISTA.length; i++) {
      if (LISTA[i].slug === slug) return LISTA[i];
    }
    return null;
  }

  window.Clientes = {
    lista: function () { return LISTA.slice(); },
    slugAtual: slugAtual,
    achar: achar,
    atual: function () { return achar(slugAtual()); },
    /* Iniciais para o quadradinho colorido do hub e do topo. */
    iniciais: function (nome) {
      return String(nome).split(/\s+/).filter(function (p) {
        return p.length > 2 || /^[A-Z]/.test(p);
      }).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase();
    }
  };
})();
