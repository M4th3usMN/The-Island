/* =====================================================================
   A GRANDE ILHA — COMUNIDADE (apoio por PIX, apoiadores, aviso e diário)
   Este é o segundo arquivo do dia a dia, junto com moradores.js.

   APOIO
     chavePix   e-mail, celular (+5592999999999), CPF/CNPJ (só números)
                ou chave aleatória. Vazio = o painel diz "em breve".
     recebedor  nome que aparece no app do banco (até 25 letras)
     cidade     cidade do recebedor (até 15 letras)
     valores    sugestões em reais; quem apoia pode digitar outro valor

   APOIADORES (só entra quem teve o PIX conferido no extrato)
     arroba     @ do Instagram, sem o @
     mascote    caranguejo, tartaruga, papagaio, sapinho ou ourico
     desde      data e hora em que o selo é liberado (horário de Manaus).
                Nesse horário o mascote desembarca no cais e a ilha
                inteira vê o aviso "NOVO APOIADOR".
     cor        opcional, ex.: '#3a7ad0'. Sem cor, quem repete um mascote
                ganha uma variação de cor automática (nenhum fica igual).

   AVISO (opcional): popup que aparece uma vez para cada visitante.
     id muda = aparece de novo para todo mundo. desde/ate limitam o período.

   DIÁRIO: anotações à mão do escriba Natã. Chegadas, metas e apoiadores
     já entram sozinhos; aqui vão só os acontecimentos especiais.
   ===================================================================== */
window.COMUNIDADE = {
  instagram: 'the_island.lab',

  apoio: {
    chavePix: 'b892cf62-409e-47de-8cc7-6782b06db1e6',
    recebedor: '',
    cidade: '',
    valores: [5, 10, 20]
  },

  apoiadores: [
    // { arroba: 'fulano', mascote: 'caranguejo', desde: '2026-11-04T17:00:00-04:00' },
    { arroba: 'jaraeeljt', mascote: 'sapinho', desde: '2026-11-04T18:24:00-04:00' }, // PIX de R$ 5,00 (Jareel, o ferreiro)
  ],

  aviso: null,
  // aviso: {
  //   id: 'ep3', titulo: 'Desembarque hoje às 18h',
  //   texto: 'Novos moradores chegam de barco ao cais. Fique de olho!',
  //   desde: '2026-11-04T08:00:00-04:00', ate: '2026-11-04T19:00:00-04:00'
  // },

  diario: [
    { quando: '2026-11-01T00:00:00-04:00', texto: 'Dois náufragos acendem a primeira fogueira na praia e decidem chamar mais gente.' }
  ]
};
