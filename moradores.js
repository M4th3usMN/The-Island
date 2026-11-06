/* =====================================================================
   A GRANDE ILHA — LISTA DE MORADORES
   Para adicionar alguém: use o admin.html (ele monta o bloco pronto)
   e cole no final da lista, antes do  ];
   Campos:
     id         identificador único, sem espaços nem acentos
     arroba     @ do Instagram de quem comentou (sem o @). Com ele, a pessoa joga
                com o próprio morador no modo viajante.
     nome, profissao, historia   aparecem no card do morador
     rotina     uma das rotinas de rotinas.js (ex.: ferreiro, pescador)
     casa       "auto" (ganha casa nova), "com:<id>" (mora com alguém),
                "torre", "taverna", "mercearia", "santuario" ou "lote:x,y"
     chegada    data e hora em que aparece na ilha (horário de Manaus)
     visual     aparência do sprite (tipo: humano, crianca, gato, cao)
   ===================================================================== */
window.MORADORES = [
  {
    id: 'fundador', nome: 'Fundador', profissao: 'Lenhador',
    historia: 'Um dos dois náufragos que acenderam a primeira fogueira da ilha. Foi ele quem teve a ideia de chamar mais gente.',
    rotina: 'lenhador', casa: 'auto', chegada: '2026-11-01T00:00:00-04:00',
    visual: { tipo: 'humano', pele: '#e8b896', cabelo: 'curto', corCabelo: '#5a3424', roupa: '#b8424e', detalhe: '#d9707a', calca: '#3c3656', acessorio: 'machado' }
  },
  {
    id: 'fundadora', nome: 'Fundadora', profissao: 'Pastora',
    historia: 'A outra náufraga da primeira noite. Cuida das ovelhas e recebe cada novo morador na fogueira.',
    rotina: 'pastora', casa: 'com:fundador', chegada: '2026-11-01T00:00:00-04:00',
    visual: { tipo: 'humano', pele: '#f0c4a0', cabelo: 'longo', corCabelo: '#6a3e2a', roupa: '#4a78c8', detalhe: '#8fb6ee', calca: '#3c3656', acessorio: 'cajado' }
  },
  {
    id: 'fernando', arroba: 'fe._.tavares', nome: 'Fernando', profissao: 'Mago',
    historia: 'Exilado de um reino distante por praticar magia das trevas.',
    rotina: 'mago', casa: 'torre', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#d9a882', cabelo: 'longo', corCabelo: '#1e1a24', barba: '#2a2230', roupa: '#2e2340', manto: true, calca: '#1e1a24', chapeu: 'mago', corChapeu: '#1f1830', acessorio: 'cajado_magico', magia: '#a066ff' }
  },
  {
    id: 'silva', arroba: 'silva__smk', nome: 'Silva', profissao: 'Taverneiro',
    historia: 'Antigo guerreiro que, cansado de uma vida de morte e sangue, decidiu viver em paz com o próprio comércio.',
    rotina: 'taverneiro', casa: 'taverna', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#c98d66', cabelo: 'careca', barba: '#4a2e1e', roupa: '#7a4e2e', avental: '#e8dcc0', calca: '#3a2e28', acessorio: 'caneca' }
  },
  {
    id: 'nata', arroba: 'natans0uza', nome: 'Natã', profissao: 'Escriba',
    historia: 'Faz parte de uma ordem de escribas que percorre o mundo recolhendo conhecimento. Veio testemunhar a história da ilha e anotar seus eventos.',
    rotina: 'escriba', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#8d5a3c', cabelo: 'curto', corCabelo: '#1a120e', roupa: '#6b5636', manto: true, detalhe: '#c8a24a', calca: '#3a2e28', acessorio: 'pena' }
  },
  {
    id: 'jareel', arroba: 'jaraeeljt', nome: 'Jareel', profissao: 'Ferreiro',
    historia: 'Expulso de uma família de ferreiros que o considerava inútil, mesmo sendo um ferreiro de nível profissional.',
    rotina: 'ferreiro', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#6e432c', cabelo: 'espetado', corCabelo: '#120c0a', roupa: '#4c4c56', avental: '#6b4228', calca: '#2e2a28', chapeu: 'faixa', corChapeu: '#b03a2a', acessorio: 'martelo' }
  },
  {
    id: 'isaque', arroba: 'isaque_smv', nome: 'Isaque', profissao: 'Fazendeiro',
    historia: 'Náufrago que viajava em busca de conhecimento e, por acaso, encontrou a ilha enquanto estava à deriva.',
    rotina: 'fazendeiro', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#f0c8a8', cabelo: 'curto', corCabelo: '#b88a4a', roupa: '#7a9a4a', calca: '#5a4630', chapeu: 'palha', acessorio: 'enxada' }
  },
  {
    id: 'blazvathan', arroba: 'ryan_feroiz', nome: 'Blazvathan', profissao: 'Caçador de recompensas',
    historia: 'Caçador de recompensas em busca de vingança.',
    rotina: 'cacador_recompensa', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#c7987a', cabelo: 'longo', corCabelo: '#8a8a92', roupa: '#2a2a2e', detalhe: '#8e1f22', calca: '#1c1c20', chapeu: 'capuz', corChapeu: '#3a1418', acessorio: 'espada' }
  },
  {
    id: 'antonio', arroba: 'antonio_mel0__', nome: 'Antônio', profissao: 'Pescador',
    historia: 'Perdeu a família e busca um recomeço.',
    rotina: 'pescador', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#b57e56', cabelo: 'curto', corCabelo: '#e2e2e2', barba: '#d8d8d8', roupa: '#3f6f7a', calca: '#4a4038', chapeu: 'gorro', corChapeu: '#c9a14a', acessorio: 'vara' }
  },
  {
    id: 'vitor', arroba: 'vitorh.celio', nome: 'Vitor', profissao: 'Inventor',
    historia: 'Movido pela criatividade, sempre inventou todo tipo de coisa onde morava. Enjoou de lá e quis encontrar um lugar novo.',
    rotina: 'inventor', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#f2cfae', cabelo: 'espetado', corCabelo: '#d06a2a', roupa: '#a06a2a', calca: '#3a3a4a', chapeu: 'oculos', acessorio: 'chave' }
  },
  {
    id: 'peregrino', arroba: 'sr37adrian', nome: 'Peregrino', profissao: 'Lenhador',
    historia: 'Fugiu da Escócia depois de uma guerra e chegou à ilha num naufrágio, junto com outros sobreviventes.',
    rotina: 'lenhador', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#f4d0b4', cabelo: 'curto', corCabelo: '#c0461e', barba: '#b03e1a', roupa: '#e2d8c4', kilt: true, calca: '#f4d0b4', acessorio: 'machado' }
  },
  {
    id: 'morato', arroba: 'senecpo', nome: 'Morato', profissao: 'Marinheiro',
    historia: 'Se perdeu do navio enquanto procurava pessoas que desapareceram em naufrágios.',
    rotina: 'marinheiro', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#a87452', cabelo: 'curto', corCabelo: '#2a1a12', roupa: '#f2f2f2', listras: '#2f4f8a', calca: '#2a3a5a', chapeu: 'marinheiro', acessorio: 'luneta' }
  },
  {
    id: 'patobelick', arroba: 'dhiey420', nome: 'PatoBelick', profissao: 'Gladiador',
    historia: 'Um dos únicos sobreviventes de uma guerra em Esparta. Viaja em busca de abrigo e comida, e ensina luta e defesa a quem quiser.',
    rotina: 'gladiador', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#d4a07a', cabelo: 'curto', corCabelo: '#2a1a12', roupa: '#8e2420', detalhe: '#b8862e', calca: '#c48e66', chapeu: 'elmo', acessorio: 'escudo_lanca' }
  },
  {
    id: 'davi', arroba: 'davizxzy', nome: 'Davi', profissao: 'Aventureiro e agricultor',
    historia: 'Filho do fundador, nascido na ilha. Forte e inteligente desde pequeno.',
    rotina: 'crianca', casa: 'com:fundador', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'crianca', pele: '#ecbc98', cabelo: 'curto', corCabelo: '#6a3e2a', roupa: '#d68a3a', calca: '#3c3656', acessorio: 'cesta' }
  },
  {
    id: 'herobrine', arroba: 'alexyzsb', nome: 'Herobrine', profissao: 'Caçador',
    historia: 'Sofreu um naufrágio e, por coincidência, estava perto da ilha.',
    rotina: 'cacador', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#c99a74', cabelo: 'curto', corCabelo: '#3a2a1a', roupa: '#5a6a32', detalhe: '#7a5a3a', calca: '#4a3a28', chapeu: 'capuz', corChapeu: '#46552a', acessorio: 'arco' }
  },
  {
    id: 'gustavo', arroba: 'gus_tavo_mathias', nome: 'Gustavo Trigo', profissao: 'Gato falante',
    historia: 'Um gato roxo falante.',
    rotina: 'gato', casa: 'taverna', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'gato', roupa: '#8a4ed0' }
  },
  {
    id: 'bidu', arroba: 'mr.vanitas_', nome: 'Bidu', profissao: 'Cão pastor',
    historia: 'Veio até a ilha perseguindo o gato roxo falante.',
    rotina: 'cao', casa: 'com:fundadora', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'cao', roupa: '#8a5a30', detalhe: '#f2efe6' }
  },
  {
    id: 'caua', arroba: 'cauahenri.xw', nome: 'Cauã', profissao: 'Químico',
    historia: 'Perdeu tudo e foi demitido. Não quer saber da cidade grande e busca um recomeço com gente nova, usando o que sabe.',
    rotina: 'quimico', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#8a5a3a', cabelo: 'rabo', corCabelo: '#1a120e', roupa: '#e6e2d6', manto: true, detalhe: '#3f8a5a', calca: '#2e2a28', acessorio: 'frasco' }
  },
  {
    id: 'yukine', arroba: 'kami_akiyama_459', nome: 'Yukine', profissao: 'Aprendiz de magia',
    historia: 'Jovem que está aprendendo a usar magia e a se comunicar com o mundo espiritual. Vive sozinho na beira da ilha.',
    rotina: 'aprendiz_magia', casa: 'santuario', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#f2d6be', cabelo: 'espetado', corCabelo: '#e8e8f0', roupa: '#e9e6f2', manto: true, detalhe: '#c03a4a', calca: '#2e2a38', acessorio: 'espirito' }
  },
  {
    id: 'kauan', arroba: 'kauan_junqxr', nome: 'Kauan', profissao: 'Engenheiro',
    historia: 'Construiu uma ponte incrível sobre um abismo, mas o reino caiu na guerra e a ponte foi destruída. Perseguido, precisa de um lar.',
    rotina: 'engenheiro', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#b87a52', cabelo: 'coque', corCabelo: '#2a1a12', roupa: '#3a5a8a', avental: '#8a6a4a', calca: '#3a3028', chapeu: 'bandana', corChapeu: '#d0a040', acessorio: 'planta' }
  },
  // ---------------------------------------------------------------- Dia 3: chegam pelo cais, um por minuto, a partir das 17h de Brasília (16h Manaus)
  {
    id: 'danillo', arroba: 'souto.dn', nome: 'Danillo', profissao: 'Relojoeiro',
    historia: 'Veio à ilha atrás de uma vida mais tranquila e de espaço para seus experimentos com engrenagens e máquinas.',
    rotina: 'relojoeiro', casa: 'auto', chegada: '2026-11-04T16:00:00-04:00',
    visual: { tipo: 'humano', pele: '#d9a882', cabelo: 'curto', corCabelo: '#7a5a3a', roupa: '#5a4a6a', detalhe: '#c9a14a', calca: '#2e2a28', chapeu: 'monoculo', acessorio: 'engrenagem' }
  },
  {
    id: 'igor', arroba: 'igor.mussel', nome: 'Igor', profissao: 'Construtor',
    historia: 'Andarilho que passou a vida na estrada e procura, enfim, um lugar para se estabelecer.',
    rotina: 'construtor', casa: 'auto', chegada: '2026-11-04T16:01:00-04:00',
    visual: { tipo: 'humano', pele: '#e8b896', cabelo: 'curto', corCabelo: '#c8a050', barba: '#b89040', roupa: '#c86a2a', avental: '#8a5a30', calca: '#4a4038', acessorio: 'tabua' }
  },
  {
    id: 'felipao', arroba: 'felipefontenele153', nome: 'Felipão', profissao: 'Encarregado e merceeiro',
    historia: 'Encarregado da ilha e dono da mercearia.',
    rotina: 'merceeiro', casa: 'mercearia', chegada: '2026-11-04T16:02:00-04:00',
    visual: { tipo: 'humano', pele: '#c98d66', cabelo: 'curto', corCabelo: '#1a120e', barba: '#1a120e', roupa: '#3f7a4a', avental: '#efe6cf', calca: '#3a3028', chapeu: 'feltro', corChapeu: '#6a4428', acessorio: 'saco' }
  },
  {
    id: 'bordon', arroba: 'eu_vinyms', nome: 'Bordon', profissao: 'Capitão de caravelas',
    historia: 'Chegou à ilha precisando de alimentos. Hoje comanda a caravela que faz a travessia de mantimentos, roupas, móveis, pessoas, animais e encomendas.',
    rotina: 'capitao', casa: 'auto', chegada: '2026-11-04T16:03:00-04:00',
    visual: { tipo: 'humano', pele: '#b57e56', cabelo: 'longo', corCabelo: '#3a2a1a', barba: '#3a2a1a', roupa: '#22305a', detalhe: '#c9a14a', calca: '#2a2a2e', chapeu: 'tricornio', corChapeu: '#1c1c24', acessorio: 'mapa' }
  },
  {
    id: 'brutos', arroba: 'brutocervejeiro', nome: 'Brutos', profissao: 'Taverneiro',
    historia: 'Foi expulso da antiga ilha por vender hidromel contrabandeado. Aqui, deu sua palavra: nada de contrabando.',
    rotina: 'cervejeiro', casa: 'taverna', chegada: '2026-11-04T16:04:00-04:00',
    visual: { tipo: 'humano', pele: '#f0c4a0', cabelo: 'rabo', corCabelo: '#d8a850', barba: '#c89840', roupa: '#7a2e3a', avental: '#6b4228', calca: '#3a2e28', acessorio: 'barril' }
  },
  {
    id: 'kimura', arroba: 'julianokimura', nome: 'Kimura', profissao: 'Líder revolucionário',
    historia: 'O líder revolucionário da ilha.',
    rotina: 'revolucionario', casa: 'auto', chegada: '2026-11-04T16:05:00-04:00',
    visual: { tipo: 'humano', pele: '#e6c09a', cabelo: 'espetado', corCabelo: '#141018', roupa: '#3a3a46', detalhe: '#e2c040', calca: '#3a3028', acessorio: 'bandeira', corBandeira: '#c0392b' }
  },
  {
    id: 'ramonye', arroba: 'ramonyedb', nome: 'Ramonye', profissao: 'Ferreiro',
    historia: 'Homem de uns 30 anos que já foi pescador. Virou ferreiro, de perna de pau e tudo, para ajudar um amigo que precisava.',
    rotina: 'ferreiro_pescador', casa: 'auto', chegada: '2026-11-04T16:06:00-04:00',
    visual: { tipo: 'humano', pele: '#a87452', cabelo: 'curto', corCabelo: '#2a1a12', barba: '#2a1a12', roupa: '#4a5a6a', avental: '#5a3a20', calca: '#3a3028', chapeu: 'bandana', corChapeu: '#2f6a9a', acessorio: 'tenaz', pernaDePau: true }
  },
  {
    id: 'charles', arroba: 'mikael_drake085', nome: 'Charles', profissao: 'Bardo',
    historia: 'Amigo de Yukine, mora perto da casa dele. Adora ir às tavernas cantar suas canções e espalhar suas histórias.',
    rotina: 'bardo', casa: 'lote:592,320', chegada: '2026-11-04T16:07:00-04:00',
    visual: { tipo: 'humano', pele: '#f2cfae', cabelo: 'longo', corCabelo: '#b8602a', roupa: '#2f8a6a', detalhe: '#f2c040', calca: '#5a3a6a', chapeu: 'bardo', corChapeu: '#6a2a5a', acessorio: 'alaude' }
  },
  {
    id: 'vane', arroba: 'wilranbreno', nome: 'Sargento Vane', profissao: 'Atirador de elite',
    historia: 'Desertor de guerra que encontrou refúgio na ilha. Carrega o peso do passado, mas oferece sua mira letal e sua experiência tática ao exército da ilha.',
    rotina: 'atirador', casa: 'auto', chegada: '2026-11-04T16:08:00-04:00',
    visual: { tipo: 'humano', pele: '#8a5a3a', cabelo: 'curto', corCabelo: '#1a120e', barba: '#2a2018', roupa: '#4a5a32', detalhe: '#3a4428', calca: '#3a3a2a', chapeu: 'boina', corChapeu: '#2e3a22', acessorio: 'besta' }
  },
  {
    id: 'egil', arroba: 'egilmontfort', nome: 'Egil Montfort', profissao: 'Estrategista de guerra',
    historia: 'Herdeiro legítimo do Sul, estrategista de guerra e guerreiro forjado no aço. Teve o trono usurpado, mas não confundam seu exílio com fraqueza.',
    rotina: 'estrategista', casa: 'auto', chegada: '2026-11-04T16:09:00-04:00',
    visual: { tipo: 'humano', pele: '#f4d0b4', cabelo: 'longo', corCabelo: '#e8d8a8', barba: '#d8c898', roupa: '#2a4a8a', manto: true, detalhe: '#c9ced8', calca: '#2a2a2e', chapeu: 'elmo_aco', acessorio: 'espada' }
  },
  // ---------------------------------------------------------------- Dia 4: chegam pelo cais, um por minuto, a partir das 17h de Brasília (16h Manaus)
  {
    id: 'caio', arroba: 'magal_xyz', nome: 'Caio', profissao: 'Batedor',
    historia: 'Explorador experiente que chegou após uma longa jornada, mestre em rastrear, sobreviver e lutar com machado. Prefere a estratégia ao confronto e quer proteger os moradores e descobrir o que existe além da ilha.',
    rotina: 'batedor', casa: 'auto', chegada: '2026-11-05T16:00:00-04:00',
    visual: { tipo: 'humano', pele: '#9c6a48', cabelo: 'rabo', corCabelo: '#4a3424', roupa: '#6a5440', detalhe: '#3e4a3a', calca: '#2c3a30', chapeu: 'mascara', corChapeu: '#2e3436', acessorio: 'machadinha' }
  },
  {
    id: 'wodysvel', arroba: 'therevolutiondistrict', nome: 'Wodysvel', profissao: 'Sacerdote do tempo',
    historia: 'Quer fundar um santuário no topo da ilha, onde os moradores possam se purificar e receber bênçãos. É o sacerdote do tempo e cuida dele até que sua vida chegue ao fim.',
    rotina: 'sacerdote', casa: 'auto', chegada: '2026-11-05T16:01:00-04:00',
    visual: { tipo: 'humano', pele: '#e2b28e', cabelo: 'coque', corCabelo: '#141018', roupa: '#b0242a', manto: true, detalhe: '#f2e6c8', calca: '#2a1a1e', chapeu: 'eboshi', corChapeu: '#1c1418', acessorio: 'ampulheta' }
  },
  // ---------------------------------------------------------------- Dia 4, segunda leva (17h02 de Brasília em diante)
  {
    id: 'masteredux', arroba: 'matheus_schreibeer', nome: 'Masteredux', profissao: 'Líder do Clube das Mentes',
    historia: 'Veio de um lugar tão distante onde sua fé e seus poderes mentais despertaram, e quem o encontrou escolheu segui-lo. Chega à ilha para comandar o Clube das Mentes e mostrar que a maior força está na mente.',
    rotina: 'mentalista', casa: 'auto', chegada: '2026-11-05T16:02:00-04:00',
    visual: { tipo: 'humano', pele: '#d9a882', cabelo: 'curto', corCabelo: '#2a1a3a', roupa: '#3a2a6a', manto: true, detalhe: '#e8b830', calca: '#1e1830', chapeu: 'coroa', corChapeu: '#ff7ad9', acessorio: 'orbe_mental', magia: '#ff7ad9' }
  },
  {
    id: 'kauan_xavier', arroba: 'kauan_xavier7', nome: 'Kauan Xavier', profissao: 'Ex-chefe dos Cavaleiros Negros',
    historia: 'Comandou os Cavaleiros Negros e largou a ordem para proteger quem não pode se defender. Acredita que um bom rei sabe o que é melhor para o povo, e escolheu defendê-lo.',
    rotina: 'cavaleiro_negro', casa: 'auto', chegada: '2026-11-05T16:03:00-04:00',
    visual: { tipo: 'humano', pele: '#b07a54', cabelo: 'curto', corCabelo: '#121212', roupa: '#24242c', detalhe: '#8a1c22', calca: '#16161c', chapeu: 'elmo_negro', corChapeu: '#b0242a', acessorio: 'montante' }
  },
  {
    id: 'arthur', arroba: 'arthur.znxs_26', nome: 'Arthur', profissao: 'Lenhador de força mágica',
    historia: 'Nasceu com um dom mágico de força que nenhum mestre soube explicar. Na ilha, derruba pinheiros com um golpe só e quer aprender a usar a magia que corre nos braços.',
    rotina: 'lenhador_magico', casa: 'auto', chegada: '2026-11-05T16:04:00-04:00',
    visual: { tipo: 'humano', pele: '#f0c8a0', cabelo: 'espetado', corCabelo: '#e8c860', roupa: '#3a6a3a', detalhe: '#ffaa3c', calca: '#4a3a26', acessorio: 'machado_runico' }
  },
  // ---------------------------------------------------------------- Dia 5 (9h30 de Brasília, antes do Ep. 4 sair)
  {
    id: 'abdula', arroba: 'arkhancon', nome: 'Abdula', profissao: 'Contrabandista disfarçado',
    historia: 'Veio ver se a ilha servia para os seus "negócios", mas encontrou gente perigosa demais e agora vive disfarçado no meio de todo mundo. Diz que é ex-marinheiro, mas mente mal, e os mais experientes desconfiam dele.',
    rotina: 'contrabandista', casa: 'auto', chegada: '2026-11-06T08:30:00-04:00',
    visual: { tipo: 'humano', pele: '#a8724a', cabelo: 'curto', corCabelo: '#141010', barba: '#141010', roupa: '#5a2a3a', detalhe: '#e8b830', calca: '#2a2420', chapeu: 'turbante', corChapeu: '#7a1e2a', acessorio: 'bau' }
  },
  // ---------------------------------------------------------------- Dia 6 (18h de Brasília)
  {
    id: 'werner', arroba: 'lucax_w23', nome: 'Werner', profissao: 'Cuidador de dragões',
    historia: 'Cuida da alimentação, da saúde e do treino de dragões. Veio criar um laço de confiança entre a ilha e o dragão que pousou na praia.',
    rotina: 'cuidador_dragoes', casa: 'auto', chegada: '2026-11-06T17:00:00-04:00',
    visual: { tipo: 'humano', pele: '#e0b48a', cabelo: 'rabo', corCabelo: '#7a4a2a', roupa: '#3f6a46', detalhe: '#d0342c', avental: '#6a4428', calca: '#3a3026', acessorio: 'balde' }
  },
  {
    id: 'guilherme', arroba: 'guilhermemarianocavalcanti', nome: 'Guilherme', profissao: 'Ferreiro andarilho',
    historia: 'Chegou montado num touro, com uma oficina portátil nas costas. Some por dias atrás dos melhores materiais e jura que é o ferreiro mais habilidoso do mundo.',
    rotina: 'ferreiro_andarilho', casa: 'auto', chegada: '2026-11-06T17:01:00-04:00',
    visual: { tipo: 'humano', pele: '#c89064', cabelo: 'curto', corCabelo: '#d8b04a', barba: '#c89a3a', roupa: '#8a5a2a', avental: '#3a2a1e', calca: '#4a3a2a', acessorio: 'bigorna' }
  },
  {
    id: 'velhomu', arroba: 'steve_standuser', nome: 'Velho Mu', profissao: 'Caçador de recompensas veterano',
    historia: 'Veio de propósito: soube que a ilha virou refúgio de náufragos e criminosos procurados. Muita gente odeia ele, então torce para ninguém o reconhecer.',
    rotina: 'cacador_veterano', casa: 'auto', chegada: '2026-11-06T17:02:00-04:00',
    visual: { tipo: 'humano', pele: '#9a6a48', cabelo: 'careca', corCabelo: '#b8b8b0', barba: '#cfcfc8', roupa: '#2e2e34', manto: true, detalhe: '#6a1e1e', calca: '#24242a', chapeu: 'tapaolho', corChapeu: '#141010', acessorio: 'corrente' }
  },
  {
    id: 'jester', arroba: 'jester_12007', nome: 'Jester', profissao: 'Flautista encantador de animais',
    historia: 'O Guardião da Sinfonia Selvagem: com uma flauta mágica ele acalma, chama e comanda animais. Manda aves vigiarem longe e usa os animais para achar gente perdida e proteger a vila.',
    rotina: 'flautista', casa: 'auto', chegada: '2026-11-06T17:03:00-04:00',
    visual: { tipo: 'humano', pele: '#f0c8a0', cabelo: 'curto', corCabelo: '#3a2a1a', roupa: '#6a3a8a', detalhe: '#2a8a5a', calca: '#2a2a3a', listras: '#ffd046', chapeu: 'bobo', corChapeu: '#8a2a4a', acessorio: 'flauta' }
  },
  {
    id: 'reed', arroba: 'kayky.l.m', nome: 'Reed', profissao: 'Necromante',
    historia: 'Chegou à meia-noite, sem barco que ninguém tenha visto. Diz que conversa com os mortos e que esta ilha guarda ossos muito antigos.',
    rotina: 'necromante', casa: 'auto', chegada: '2026-11-06T17:04:00-04:00',
    visual: { tipo: 'humano', pele: '#d8d4cc', cabelo: 'longo', corCabelo: '#101418', roupa: '#1e2a24', manto: true, detalhe: '#4ac07a', calca: '#141a16', acessorio: 'cranio', magia: '#7affa0' }
  }
];
