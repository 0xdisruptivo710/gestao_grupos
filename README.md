# Painéis de Grupos VIP — AIOS

Um painel por cliente para planejar e acompanhar a campanha de grupo VIP:
captação, aquecimento, remarketing, promoções, iscas, o dia da abertura e o
relatório. No ar em <https://aios-grupos-vip.vercel.app>.

Painel aberto, sem senha. Quem edita escolhe no topo se está como **Equipe
AIOS** ou como a equipe da clínica — é esse nome que assina o histórico.

## Como está montado

```
index.html          hub: lista os clientes de js/clientes.js
app/                as telas, iguais para todos os clientes
css/app.css         o sistema visual inteiro
js/clientes.js      QUEM TEM PAINEL — fonte única da verdade
js/checklists.js    OS PASSOS DE PREPARAÇÃO — iguais em todo cliente
js/store.js         estado, cache local e conversa com o banco
js/app.js           shell (barra lateral, topo) e componentes de tela
api/painel.js       a única coisa que fala com o Supabase
vercel.json         faz /cliente/tela.html servir app/tela.html
```

Antes existia **uma pasta por cliente com as telas copiadas dentro**. Eram
nove arquivos idênticos vezes o número de clientes, e todo ajuste de tela
precisava ser repetido em cada pasta — com o risco de uma ficar para trás. Hoje
a tela é uma só: `vercel.json` reescreve `/botoclinic-riomar/iscas.html` para
`app/iscas.html` sem mudar a URL, e a tela descobre de quem é o painel lendo o
primeiro pedaço do caminho.

Rewrite na Vercel roda **depois** da checagem de arquivo, então `/css/app.css`,
`/js/app.js` e a função `/api/painel` continuam sendo servidos direto. Por isso
também não pode voltar a existir pasta com nome de cliente: um arquivo real
sobrepõe a regra.

## Abrir um painel para um cliente novo

São dois passos, e **os dois são obrigatórios**:

1. Acrescente o cliente em `js/clientes.js` (slug, nome, nome da equipe).
2. Crie a linha dele na tabela `gvip_paineis` com o **mesmo slug**:

```sql
insert into gvip_paineis (slug, cliente, dados, atualizado_por)
values ('slug-do-cliente', 'Nome do Cliente',
  jsonb_build_object(
    'grupo', jsonb_build_object('cliente','Nome do Cliente','nome','Grupo VIP',
             'abertura','','metaMembros',0,'saidas',0,'metaVendas',0),
    'preparacao','{}'::jsonb,
    'captacao','[]'::jsonb, 'aquecimento','[]'::jsonb, 'remarketing','[]'::jsonb,
    'produtos','[]'::jsonb,
    'promocao', jsonb_build_object('condicao','','validade','','status','Em análise'),
    'brinde',   jsonb_build_object('nome','','custo',0,'unidades',0),
    'iscas','[]'::jsonb, 'ranking','[]'::jsonb, 'roteiro','[]'::jsonb,
    'vendas','[]'::jsonb, 'historico','[]'::jsonb),
  'Equipe AIOS');
```

Sem o passo 2 o painel abre, mas não grava: `PATCH` em linha inexistente volta
200 com lista vazia. O painel avisa **"Painel não existe no banco"** em vermelho
no topo em vez de dizer "Salvo" — antes essa situação passava como sucesso e o
que era digitado se perdia.

Não é preciso mexer em `api/painel.js`: quem autoriza um slug é a existência da
linha no banco, não uma lista no código.

## Preparação

`Preparação` é a primeira tela do menu e traz dois checklists, iguais para todo
cliente:

- **Canal oficial no ar** — BM verificada, chip novo, WABA, cartão na BM,
  perfil, limite de envio, conexão com o CRM, templates, teste ponta a ponta e
  link do grupo. Feito uma vez por cliente.
- **Base de contatos e campanhas** — extração, normalização, cruzamento com
  quem já comprou, exclusão de quem já está no grupo, segmentação, ondas, copy,
  etiqueta de origem, disparo teste e acompanhamento. Feito a cada campanha.

Os passos moram em `js/checklists.js`, porque são o procedimento da casa e não
uma lista que cada painel inventa: mexer lá muda o checklist de todos os
painéis. O que fica no banco é só o estado de cada passo — feito, quem marcou,
quando e a anotação. Marcar registra a assinatura porque, numa operação de duas
equipes, "está feito" sem nome vira discussão.

## Conteúdo de aquecimento

O calendário aceita seis formatos. `Mensagem`, `Enquete` e `Vídeo` vão para
dentro do grupo, no WhatsApp. `Story`, `Reel` e `Arte` são o que puxa gente para
o grupo, publicado no Instagram — é onde entra o roteiro que a clínica recebe
pronto, com a fala já escrita em cada item.

## Banco

Supabase da AIOS (`ehlpmukjdknnyhkycncb`), duas tabelas:

- `gvip_paineis` — uma linha por cliente (`slug` é a chave). `dados` é o painel
  inteiro em jsonb.
- `gvip_versoes` — a versão anterior é guardada a cada gravação, com poda nas 30
  últimas. É a rede de proteção de um painel aberto por link.

As tabelas têm RLS ligado e nenhuma policy: só a chave de serviço enxerga, e ela
só existe dentro de `api/painel.js`, no servidor. O navegador nunca vê chave —
por isso o painel fala com `/api/painel` e não direto com o Supabase.

Variáveis na Vercel: `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`.

## Publicar

```bash
vercel deploy            # pré-visualização, para conferir antes
vercel deploy --prod     # produção
```

## Convenções de tela

- **Um número aparece em um lugar só.** Se está no funil, não repete na faixa.
- **A faixa (`A.faixa`) substitui os cartões de indicador.** Uma caixa dividida
  por fios, com um único número em `destaque` — o que aquela tela responde.
- **Campo vazio é traço, nunca estimativa.** O relatório inteiro sai do que foi
  digitado à mão.
- **Texto de tela em pt-BR**, direto, sem jargão de produto.
