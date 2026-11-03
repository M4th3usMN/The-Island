/* =====================================================================
   A GRANDE ILHA — LISTA DE MORADORES
   Para adicionar alguém: use o admin.html (ele monta o bloco pronto)
   e cole no final da lista, antes do  ];
   Campos:
     id         identificador único, sem espaços nem acentos
     nome, profissao, historia   aparecem no card do morador
     rotina     uma das rotinas de js/rotinas.js (ex.: ferreiro, pescador)
     casa       "auto" (ganha casa nova), "com:<id>" (mora com alguém),
                "torre", "taverna" ou "santuario"
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
    id: 'fernando', nome: 'Fernando', profissao: 'Mago',
    historia: 'Exilado de um reino distante por praticar magia das trevas.',
    rotina: 'mago', casa: 'torre', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#d9a882', cabelo: 'longo', corCabelo: '#1e1a24', barba: '#2a2230', roupa: '#2e2340', manto: true, calca: '#1e1a24', chapeu: 'mago', corChapeu: '#1f1830', acessorio: 'cajado_magico', magia: '#a066ff' }
  },
  {
    id: 'silva', nome: 'Silva', profissao: 'Taverneiro',
    historia: 'Antigo guerreiro que, cansado de uma vida de morte e sangue, decidiu viver em paz com o próprio comércio.',
    rotina: 'taverneiro', casa: 'taverna', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#c98d66', cabelo: 'careca', barba: '#4a2e1e', roupa: '#7a4e2e', avental: '#e8dcc0', calca: '#3a2e28', acessorio: 'caneca' }
  },
  {
    id: 'nata', nome: 'Natã', profissao: 'Escriba',
    historia: 'Faz parte de uma ordem de escribas que percorre o mundo recolhendo conhecimento. Veio testemunhar a história da ilha e anotar seus eventos.',
    rotina: 'escriba', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#8d5a3c', cabelo: 'curto', corCabelo: '#1a120e', roupa: '#6b5636', manto: true, detalhe: '#c8a24a', calca: '#3a2e28', acessorio: 'pena' }
  },
  {
    id: 'jareel', nome: 'Jareel', profissao: 'Ferreiro',
    historia: 'Expulso de uma família de ferreiros que o considerava inútil, mesmo sendo um ferreiro de nível profissional.',
    rotina: 'ferreiro', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#6e432c', cabelo: 'espetado', corCabelo: '#120c0a', roupa: '#4c4c56', avental: '#6b4228', calca: '#2e2a28', chapeu: 'faixa', corChapeu: '#b03a2a', acessorio: 'martelo' }
  },
  {
    id: 'isaque', nome: 'Isaque', profissao: 'Fazendeiro',
    historia: 'Náufrago que viajava em busca de conhecimento e, por acaso, encontrou a ilha enquanto estava à deriva.',
    rotina: 'fazendeiro', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#f0c8a8', cabelo: 'curto', corCabelo: '#b88a4a', roupa: '#7a9a4a', calca: '#5a4630', chapeu: 'palha', acessorio: 'enxada' }
  },
  {
    id: 'blazvathan', nome: 'Blazvathan', profissao: 'Caçador de recompensas',
    historia: 'Caçador de recompensas em busca de vingança.',
    rotina: 'cacador_recompensa', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#c7987a', cabelo: 'longo', corCabelo: '#8a8a92', roupa: '#2a2a2e', detalhe: '#8e1f22', calca: '#1c1c20', chapeu: 'capuz', corChapeu: '#3a1418', acessorio: 'espada' }
  },
  {
    id: 'antonio', nome: 'Antônio', profissao: 'Pescador',
    historia: 'Perdeu a família e busca um recomeço.',
    rotina: 'pescador', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#b57e56', cabelo: 'curto', corCabelo: '#e2e2e2', barba: '#d8d8d8', roupa: '#3f6f7a', calca: '#4a4038', chapeu: 'gorro', corChapeu: '#c9a14a', acessorio: 'vara' }
  },
  {
    id: 'vitor', nome: 'Vitor', profissao: 'Inventor',
    historia: 'Movido pela criatividade, sempre inventou todo tipo de coisa onde morava. Enjoou de lá e quis encontrar um lugar novo.',
    rotina: 'inventor', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#f2cfae', cabelo: 'espetado', corCabelo: '#d06a2a', roupa: '#a06a2a', calca: '#3a3a4a', chapeu: 'oculos', acessorio: 'chave' }
  },
  {
    id: 'peregrino', nome: 'Peregrino', profissao: 'Lenhador',
    historia: 'Fugiu da Escócia depois de uma guerra e chegou à ilha num naufrágio, junto com outros sobreviventes.',
    rotina: 'lenhador', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#f4d0b4', cabelo: 'curto', corCabelo: '#c0461e', barba: '#b03e1a', roupa: '#e2d8c4', kilt: true, calca: '#f4d0b4', acessorio: 'machado' }
  },
  {
    id: 'morato', nome: 'Morato', profissao: 'Marinheiro',
    historia: 'Se perdeu do navio enquanto procurava pessoas que desapareceram em naufrágios.',
    rotina: 'marinheiro', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#a87452', cabelo: 'curto', corCabelo: '#2a1a12', roupa: '#f2f2f2', listras: '#2f4f8a', calca: '#2a3a5a', chapeu: 'marinheiro', acessorio: 'luneta' }
  },
  {
    id: 'patobelick', nome: 'PatoBelick', profissao: 'Gladiador',
    historia: 'Um dos únicos sobreviventes de uma guerra em Esparta. Viaja em busca de abrigo e comida, e ensina luta e defesa a quem quiser.',
    rotina: 'gladiador', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#d4a07a', cabelo: 'curto', corCabelo: '#2a1a12', roupa: '#8e2420', detalhe: '#b8862e', calca: '#c48e66', chapeu: 'elmo', acessorio: 'escudo_lanca' }
  },
  {
    id: 'davi', nome: 'Davi', profissao: 'Aventureiro e agricultor',
    historia: 'Filho do fundador, nascido na ilha. Forte e inteligente desde pequeno.',
    rotina: 'crianca', casa: 'com:fundador', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'crianca', pele: '#ecbc98', cabelo: 'curto', corCabelo: '#6a3e2a', roupa: '#d68a3a', calca: '#3c3656', acessorio: 'cesta' }
  },
  {
    id: 'herobrine', nome: 'Herobrine', profissao: 'Caçador',
    historia: 'Sofreu um naufrágio e, por coincidência, estava perto da ilha.',
    rotina: 'cacador', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#c99a74', cabelo: 'curto', corCabelo: '#3a2a1a', roupa: '#5a6a32', detalhe: '#7a5a3a', calca: '#4a3a28', chapeu: 'capuz', corChapeu: '#46552a', acessorio: 'arco' }
  },
  {
    id: 'gustavo', nome: 'Gustavo Trigo', profissao: 'Gato falante',
    historia: 'Um gato roxo falante.',
    rotina: 'gato', casa: 'taverna', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'gato', roupa: '#8a4ed0' }
  },
  {
    id: 'bidu', nome: 'Bidu', profissao: 'Cão pastor',
    historia: 'Veio até a ilha perseguindo o gato roxo falante.',
    rotina: 'cao', casa: 'com:fundadora', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'cao', roupa: '#8a5a30', detalhe: '#f2efe6' }
  },
  {
    id: 'caua', nome: 'Cauã', profissao: 'Químico',
    historia: 'Perdeu tudo e foi demitido. Não quer saber da cidade grande e busca um recomeço com gente nova, usando o que sabe.',
    rotina: 'quimico', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#8a5a3a', cabelo: 'rabo', corCabelo: '#1a120e', roupa: '#e6e2d6', manto: true, detalhe: '#3f8a5a', calca: '#2e2a28', acessorio: 'frasco' }
  },
  {
    id: 'yukine', nome: 'Yukine', profissao: 'Aprendiz de magia',
    historia: 'Jovem que está aprendendo a usar magia e a se comunicar com o mundo espiritual. Vive sozinho na beira da ilha.',
    rotina: 'aprendiz_magia', casa: 'santuario', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#f2d6be', cabelo: 'espetado', corCabelo: '#e8e8f0', roupa: '#e9e6f2', manto: true, detalhe: '#c03a4a', calca: '#2e2a38', acessorio: 'espirito' }
  },
  {
    id: 'kauan', nome: 'Kauan', profissao: 'Engenheiro',
    historia: 'Construiu uma ponte incrível sobre um abismo, mas o reino caiu na guerra e a ponte foi destruída. Perseguido, precisa de um lar.',
    rotina: 'engenheiro', casa: 'auto', chegada: '2026-11-03T20:00:00-04:00',
    visual: { tipo: 'humano', pele: '#b87a52', cabelo: 'coque', corCabelo: '#2a1a12', roupa: '#3a5a8a', avental: '#8a6a4a', calca: '#3a3028', chapeu: 'bandana', corChapeu: '#d0a040', acessorio: 'planta' }
  }
];
