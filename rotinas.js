/* A Grande Ilha — rotinas diárias por profissão.
   Cada bloco: [início, fim, lugar, o que está fazendo, opções]
   Horas no horário da ilha (Manaus, UTC-4). Blocos podem virar a meia-noite (ex.: 22 → 6).
   Lugares: casa, fogueira, taverna, forja, oficina, laboratorio, biblioteca, arena,
            fazenda, pasto, cais, floresta, torre, santuario, ponte, passeio (visita lugares),
            gato (segue o gato). Opção { sono: true } esconde o morador dentro de casa. */
(function () {
  const S = { sono: true };
  const ROTINAS = {
    lenhador: {
      blocos: [[22, 6, 'casa', 'Dormindo', S], [6, 7, 'casa', 'Tomando café em casa'], [7, 12, 'floresta', 'Cortando lenha na floresta'],
        [12, 13, 'fogueira', 'Almoçando na fogueira'], [13, 17, 'floresta', 'Cortando lenha'], [17, 18, 'casa', 'Empilhando a lenha'],
        [18, 22, 'fogueira', 'Conversando na fogueira']],
      trabalho: ['Toc! Toc!', 'Madeira boa!', 'Árvore caindo!'], social: ['Bom dia de corte.', 'A fogueira precisa de lenha.', 'Quem quer ajudar?']
    },
    pastora: {
      blocos: [[22, 5, 'casa', 'Dormindo', S], [5, 6, 'casa', 'Acordando cedo'], [6, 12, 'pasto', 'Cuidando das ovelhas'],
        [12, 13, 'fogueira', 'Almoçando na fogueira'], [13, 17, 'pasto', 'Pastoreando o rebanho'], [17, 18, 'casa', 'Tecendo lã em casa'],
        [18, 22, 'fogueira', 'Contando histórias na fogueira']],
      trabalho: ['Vem, ovelhinha!', 'Uma, duas, três...', 'Bidu, junta elas!'], social: ['Lã nova pra todos!', 'A ilha está crescendo.', 'Bem-vindos!']
    },
    mago: {
      blocos: [[4, 12, 'casa', 'Dormindo na torre', S], [12, 13, 'fogueira', 'Almoçando longe dos outros'], [13, 17, 'floresta', 'Colhendo ervas sombrias'],
        [17, 19, 'torre', 'Lendo grimórios na torre'], [19, 20, 'fogueira', 'Observando o fogo em silêncio'], [20, 4, 'torre', 'Praticando magia das trevas']],
      trabalho: ['...', 'Umbra, venha.', 'Esta erva serve.'], social: ['Não me olhem assim.', 'O fogo esconde segredos.', 'Fui exilado...']
    },
    taverneiro: {
      blocos: [[2, 9, 'casa', 'Dormindo na taverna', S], [9, 10, 'taverna', 'Limpando as canecas'], [10, 14, 'taverna', 'Servindo o almoço'],
        [14, 15, 'fogueira', 'Descansando um pouco'], [15, 2, 'taverna', 'Servindo bebida na taverna']],
      trabalho: ['Mais uma rodada?', 'Sopa quente!', 'Aqui não tem briga.'], social: ['Larguei a espada.', 'Paz é bom negócio.']
    },
    escriba: {
      blocos: [[22, 6, 'casa', 'Dormindo', S], [6, 8, 'casa', 'Lendo à luz de vela'], [8, 10, 'biblioteca', 'Escrevendo a história da ilha'],
        [10, 12, 'passeio', 'Anotando o que vê pela ilha'], [12, 13, 'fogueira', 'Ouvindo histórias no almoço'], [13, 17, 'passeio', 'Entrevistando moradores'],
        [17, 19, 'biblioteca', 'Passando as notas a limpo'], [19, 22, 'fogueira', 'Registrando as histórias da noite']],
      trabalho: ['Anotado!', 'Conte mais...', 'Dia 2, registro 1.'], social: ['Isso vai pro livro.', 'Como chegou aqui?', 'Que história!']
    },
    ferreiro: {
      blocos: [[22, 6, 'casa', 'Dormindo', S], [6, 7, 'casa', 'Acordando'], [7, 12, 'forja', 'Forjando na forja'],
        [12, 13, 'taverna', 'Almoçando na taverna'], [13, 19, 'forja', 'Martelando o ferro'], [19, 22, 'fogueira', 'Descansando na fogueira']],
      trabalho: ['Clang! Clang!', 'Ferro no ponto.', 'Nada de inútil.'], social: ['Quem precisa de ferramenta?', 'Minha família errou.']
    },
    fazendeiro: {
      blocos: [[21, 5, 'casa', 'Dormindo', S], [5, 6, 'casa', 'Acordando'], [6, 11, 'fazenda', 'Arando a terra'],
        [11, 14, 'fogueira', 'Almoçando e descansando'], [14, 18, 'fazenda', 'Cuidando da plantação'], [18, 21, 'fogueira', 'Contando da viagem']],
      trabalho: ['Terra boa aqui!', 'Cresce, trigo!', 'Davi, assim ó.'], social: ['Eu estava à deriva...', 'Vamos ter colheita!']
    },
    cacador_recompensa: {
      blocos: [[1, 7, 'casa', 'Dormindo', S], [7, 8, 'casa', 'Afiando a espada'], [8, 12, 'floresta', 'Rastreando pegadas'],
        [12, 13, 'taverna', 'Almoçando sozinho'], [13, 18, 'passeio', 'Vigiando a ilha'], [18, 1, 'taverna', 'Ouvindo rumores na taverna']],
      trabalho: ['Hm.', 'Ele esteve aqui.', 'Eu vou achar.'], social: ['Alguém viu um forasteiro?', 'Vingança não espera.']
    },
    pescador: {
      blocos: [[21, 4, 'casa', 'Dormindo', S], [4, 11, 'cais', 'Pescando no cais'], [11, 13, 'fogueira', 'Assando peixe na fogueira'],
        [13, 15, 'casa', 'Remendando a rede'], [15, 18, 'cais', 'Pescando ao entardecer'], [18, 21, 'fogueira', 'Olhando o fogo']],
      trabalho: ['Mordeu!', 'Peixe grande!', 'Mar calmo hoje.'], social: ['Recomeçar é difícil.', 'Peixe pra todos!']
    },
    inventor: {
      blocos: [[23, 7, 'casa', 'Dormindo', S], [7, 8, 'casa', 'Desenhando ideias'], [8, 12, 'oficina', 'Inventando na oficina'],
        [12, 13, 'fogueira', 'Almoçando na fogueira'], [13, 18, 'oficina', 'Testando uma engenhoca'], [18, 20, 'passeio', 'Procurando materiais'],
        [20, 23, 'fogueira', 'Mostrando invenções']],
      trabalho: ['Eureca!', 'Quase funcionou...', 'Mais uma engrenagem.'], social: ['Olha o que eu fiz!', 'Lugar novo, ideias novas.']
    },
    // Morato: volta completa pela orla todo dia às 09:00 e às 21:00 em ponto (pedido de um seguidor)
    marinheiro: {
      pontual: true,
      blocos: [[22, 5, 'casa', 'Dormindo', S], [5, 9, 'cais', 'Vigiando o horizonte'], [9, 10, 'orla', 'Ronda da manhã pela orla', { aviso: 'começou a ronda da manhã pela orla' }],
        [10, 12, 'cais', 'Vigiando o horizonte'], [12, 13, 'taverna', 'Almoçando na taverna'],
        [13, 18, 'cais', 'Procurando sinais de náufragos'], [18, 21, 'taverna', 'Contando histórias do mar'],
        [21, 22, 'orla', 'Ronda da noite pela orla', { aviso: 'começou a ronda da noite pela orla' }]],
      trabalho: ['Terra à vista?', 'Nenhuma vela...', 'Eles estão lá fora.'], social: ['Vi navios sumirem.', 'O mar guarda segredos.']
    },
    gladiador: {
      blocos: [[22, 5, 'casa', 'Dormindo', S], [5, 8, 'arena', 'Treinando ao amanhecer'], [8, 9, 'fogueira', 'Comendo com fome de guerreiro'],
        [9, 12, 'arena', 'Treinando na arena'], [12, 13, 'fogueira', 'Almoçando'], [13, 16, 'floresta', 'Caçando comida'],
        [16, 18, 'arena', 'Ensinando luta e defesa'], [18, 22, 'fogueira', 'Contando da guerra em Esparta']],
      trabalho: ['Defesa! Ataque!', 'Mais uma vez!', 'Escudo alto!'], social: ['Isto é Esparta... era.', 'Eu ensino vocês a lutar.']
    },
    crianca: {
      blocos: [[20, 7, 'casa', 'Dormindo', S], [7, 8, 'casa', 'Tomando café com os pais'], [8, 11, 'fazenda', 'Aprendendo a plantar com Isaque'],
        [11, 12, 'floresta', 'Explorando a floresta'], [12, 13, 'fogueira', 'Almoçando com os pais'], [13, 16, 'passeio', 'Em busca de aventura'],
        [16, 18, 'arena', 'Treinando com PatoBelick'], [18, 20, 'fogueira', 'Brincando perto do fogo']],
      trabalho: ['Olha isso!', 'Eu consigo!', 'Aventura!'], social: ['Pai, olha!', 'Quero ser forte!']
    },
    cacador: {
      blocos: [[21, 5, 'casa', 'Dormindo', S], [5, 11, 'floresta', 'Caçando na floresta'], [11, 13, 'fogueira', 'Assando a caça'],
        [13, 15, 'casa', 'Fazendo flechas'], [15, 19, 'floresta', 'Caçando'], [19, 21, 'fogueira', 'Descansando na fogueira']],
      trabalho: ['Shhh...', 'Rastro fresco.', 'Na mira.'], social: ['Que sorte achar a ilha.', 'Carne pra todos!']
    },
    quimico: {
      blocos: [[23, 7, 'casa', 'Dormindo', S], [7, 8, 'casa', 'Acordando'], [8, 12, 'laboratorio', 'Misturando substâncias no laboratório'],
        [12, 13, 'fogueira', 'Almoçando'], [13, 17, 'laboratorio', 'Fazendo experimentos'], [17, 19, 'passeio', 'Ensinando o que sabe'],
        [19, 23, 'taverna', 'Conhecendo gente nova']],
      trabalho: ['Borbulhou!', 'Não cheire isso.', 'Reação perfeita.'], social: ['Cidade grande, nunca mais.', 'Gente nova, vida nova.']
    },
    aprendiz_magia: {
      blocos: [[23, 5, 'casa', 'Dormindo na beira da ilha', S], [5, 7, 'santuario', 'Meditando ao nascer do sol'], [7, 11, 'santuario', 'Falando com os espíritos'],
        [11, 12, 'casa', 'Almoçando sozinho'], [12, 16, 'floresta', 'Estudando os espíritos da floresta'], [16, 18, 'santuario', 'Treinando magia'],
        [18, 19, 'fogueira', 'Observando os outros de longe'], [19, 23, 'santuario', 'Treinando magia sob as estrelas']],
      trabalho: ['Você me ouve?', 'Os espíritos sussurram.', 'Quase...'], social: ['Oi...', 'Os espíritos gostam daqui.']
    },
    engenheiro: {
      blocos: [[22, 6, 'casa', 'Dormindo', S], [6, 7, 'casa', 'Acordando'], [7, 12, 'ponte', 'Construindo uma ponte no riacho'],
        [12, 13, 'fogueira', 'Almoçando'], [13, 17, 'oficina', 'Desenhando projetos com Vitor'], [17, 19, 'ponte', 'Reforçando a ponte'],
        [19, 22, 'fogueira', 'De olho no mar, desconfiado']],
      trabalho: ['Mais um pilar.', 'Essa não cai.', 'Medida certa.'], social: ['Minha ponte caiu...', 'Aqui eu recomeço.']
    },
    // ---- Dia 3
    relojoeiro: {
      blocos: [[23, 7, 'casa', 'Dormindo', S], [7, 8, 'casa', 'Dando corda nos relógios'], [8, 12, 'oficina', 'Ajustando engrenagens com Vitor'],
        [12, 13, 'fogueira', 'Almoçando na hora certa'], [13, 17, 'oficina', 'Montando uma máquina nova'], [17, 19, 'passeio', 'Passeando com calma pela ilha'],
        [19, 23, 'casa', 'Consertando um relógio à luz de vela']],
      trabalho: ['Tic, tac...', 'Falta uma engrenagem.', 'Precisão é tudo.'], social: ['Aqui o tempo passa devagar.', 'Que paz.']
    },
    construtor: {
      blocos: [[22, 5, 'casa', 'Dormindo', S], [5, 6, 'casa', 'Afiando as ferramentas'], [6, 12, 'passeio', 'Erguendo uma casa nova'],
        [12, 13, 'fogueira', 'Almoçando'], [13, 17, 'passeio', 'Consertando telhados'], [17, 19, 'floresta', 'Escolhendo madeira boa'],
        [19, 22, 'taverna', 'Descansando depois da obra']],
      trabalho: ['Martelo e prego!', 'Essa parede fica reta.', 'Mais uma tábua.'], social: ['Enfim, um lugar para ficar.', 'Andei muito até aqui.']
    },
    merceeiro: {
      blocos: [[22, 5, 'casa', 'Dormindo na mercearia', S], [5, 7, 'cais', 'Recebendo mercadorias do barco'], [7, 12, 'mercearia', 'Atendendo na mercearia'],
        [12, 13, 'fogueira', 'Almoçando'], [13, 15, 'passeio', 'Cuidando dos assuntos da ilha'], [15, 19, 'mercearia', 'Vendendo frutas e grãos'],
        [19, 22, 'fogueira', 'Organizando os trabalhos de amanhã']],
      trabalho: ['Fruta fresquinha!', 'Leva duas, paga uma.', 'Chegou mercadoria!'], social: ['Eu cuido da ilha.', 'Tudo em ordem por aqui.']
    },
    capitao: {
      blocos: [[23, 5, 'casa', 'Dormindo', S], [5, 10, 'cais', 'Carregando a caravela'], [10, 15, 'cais', 'Fazendo a travessia de mantimentos'],
        [15, 17, 'mercearia', 'Entregando encomendas'], [17, 19, 'taverna', 'Bebendo com a tripulação'], [19, 23, 'cais', 'Conferindo as cargas da noite']],
      trabalho: ['Içar velas!', 'Carga a bordo!', 'Mar calmo hoje.'], social: ['Cheguei aqui com fome.', 'Trago de tudo, até gente.']
    },
    cervejeiro: {
      blocos: [[3, 10, 'casa', 'Dormindo na taverna', S], [10, 13, 'fazenda', 'Colhendo mel para o hidromel'], [13, 14, 'fogueira', 'Almoçando'],
        [14, 18, 'taverna', 'Fermentando hidromel (sem contrabando!)'], [18, 3, 'taverna', 'Servindo hidromel na taverna']],
      trabalho: ['Hidromel da casa!', 'Tudo dentro da lei.', 'Mais uma caneca?'], social: ['Contrabando? Eu? Nunca mais.', 'Dei minha palavra.']
    },
    revolucionario: {
      blocos: [[1, 8, 'casa', 'Dormindo', S], [8, 10, 'biblioteca', 'Escrevendo manifestos'], [10, 12, 'passeio', 'Recrutando aliados'],
        [12, 13, 'fogueira', 'Almoçando'], [13, 16, 'arena', 'Treinando seus seguidores'], [16, 19, 'passeio', 'Espalhando suas ideias'],
        [19, 1, 'fogueira', 'Discursando na fogueira']],
      trabalho: ['Juntos somos fortes!', 'A ilha é do povo!', 'Quem está comigo?'], social: ['A revolução começa aqui.', 'Ouçam!']
    },
    ferreiro_pescador: {
      blocos: [[22, 5, 'casa', 'Dormindo', S], [5, 8, 'cais', 'Pescando como nos velhos tempos'], [8, 12, 'forja', 'Ajudando o amigo na forja'],
        [12, 13, 'fogueira', 'Almoçando'], [13, 18, 'forja', 'Forjando anzóis e ferraduras'], [18, 22, 'taverna', 'Contando como perdeu a perna']],
      trabalho: ['Toc, toc, perna de pau!', 'Ferro quente!', 'Amigo é pra isso.'], social: ['Já fui pescador.', 'O mar me deve uma perna.']
    },
    bardo: {
      blocos: [[3, 10, 'casa', 'Dormindo', S], [10, 12, 'santuario', 'Visitando Yukine'], [12, 13, 'fogueira', 'Almoçando'],
        [13, 17, 'passeio', 'Recolhendo histórias pela ilha'], [17, 19, 'fogueira', 'Compondo uma canção nova'], [19, 3, 'taverna', 'Cantando na taverna']],
      trabalho: ['♪ Lá-lá-lá ♪', 'Essa vai virar canção!', 'Ouçam esta história...'], social: ['Yukine é meu amigo.', 'Toda ilha merece uma música.']
    },
    atirador: {
      blocos: [[23, 5, 'casa', 'Dormindo', S], [5, 7, 'torre', 'Vigiando do alto da torre'], [7, 12, 'arena', 'Treinando pontaria'],
        [12, 13, 'fogueira', 'Almoçando em silêncio'], [13, 17, 'floresta', 'Patrulhando a floresta'], [17, 20, 'arena', 'Ensinando táticas ao exército'],
        [20, 23, 'cais', 'Montando guarda no cais']],
      trabalho: ['Alvo na mira.', 'Respira... e solta.', 'Posição!'], social: ['O passado pesa.', 'Aqui encontrei refúgio.']
    },
    estrategista: {
      blocos: [[0, 7, 'casa', 'Dormindo', S], [7, 9, 'arena', 'Treinando com a espada'], [9, 12, 'biblioteca', 'Estudando mapas de guerra'],
        [12, 13, 'fogueira', 'Almoçando'], [13, 16, 'passeio', 'Inspecionando as defesas da ilha'], [16, 19, 'arena', 'Treinando com a espada'],
        [19, 24, 'fogueira', 'Planejando a volta ao trono']],
      trabalho: ['Aço não se dobra.', 'Cada pedra conta.', 'Em guarda!'], social: ['Meu trono foi usurpado.', 'Silêncio não é rendição.']
    },
    // ---- Dia 4
    batedor: {
      blocos: [[23, 5, 'casa', 'Dormindo', S], [5, 7, 'cais', 'Observando o mar e o horizonte'], [7, 12, 'floresta', 'Rastreando trilhas na floresta'],
        [12, 13, 'fogueira', 'Almoçando'], [13, 16, 'passeio', 'Mapeando caminhos seguros pela ilha'], [16, 18, 'arena', 'Treinando com o machado'],
        [18, 20, 'taverna', 'Contando o que descobriu'], [20, 23, 'cais', 'Vigiando a ilha à noite']],
      trabalho: ['Pegadas frescas...', 'Caminho seguro por aqui.', 'Nada passa por mim.'], social: ['O que tem além da ilha?', 'Melhor pensar antes de lutar.']
    },
    sacerdote: {
      blocos: [[22, 4, 'casa', 'Dormindo', S], [4, 7, 'santuario', 'Rezando ao amanhecer'], [7, 12, 'santuario', 'Purificando quem visita o santuário'],
        [12, 13, 'fogueira', 'Almoçando em silêncio'], [13, 16, 'passeio', 'Abençoando as casas da ilha'], [16, 19, 'torre', 'Contemplando o tempo do alto'],
        [19, 22, 'fogueira', 'Dando bênçãos na fogueira']],
      trabalho: ['Que o tempo seja gentil.', 'Purifique-se.', 'Cada grão tem sua hora.'], social: ['Um santuário no topo da ilha...', 'Eu cuido do tempo.']
    },
    flautista: {
      blocos: [[23, 5, 'casa', 'Dormindo', S], [5, 8, 'pasto', 'Tocando para as ovelhas acordarem'], [8, 11, 'floresta', 'Mandando aves vigiarem longe'],
        [11, 13, 'cais', 'Acalmando o dragão com a flauta'], [13, 14, 'taverna', 'Almoçando'], [14, 17, 'floresta', 'Procurando gente perdida com os lobos'],
        [17, 20, 'cais', 'Tocando para o dragão dormir'], [20, 23, 'taverna', 'Tocando na taverna']],
      trabalho: ['♪ calma, calma... ♪', 'As aves viram algo no mar.', 'Os animais me escutam.'], social: ['Toda criatura tem uma canção.', 'Guardião da Sinfonia Selvagem, prazer!']
    },
    necromante: {
      blocos: [[6, 13, 'casa', 'Dormindo de dia', S], [13, 16, 'biblioteca', 'Lendo livros proibidos'], [16, 18, 'torre', 'Trocando segredos com o Fernando'],
        [18, 21, 'taverna', 'Sentado sozinho, sem beber nada'], [21, 1, 'santuario', 'Conversando com os mortos'], [1, 6, 'floresta', 'Procurando ossos antigos']],
      trabalho: ['Os mortos falam... baixinho.', 'Não tenha medo.', 'Essa ilha guarda ossos antigos.'], social: ['Boa noite. Sempre boa noite.', 'O passado nunca vai embora.']
    },
    // ---- Dia 6
    cuidador_dragoes: {
      blocos: [[22, 5, 'casa', 'Dormindo', S], [5, 8, 'cais', 'Dando peixe para o dragão'], [8, 11, 'floresta', 'Colhendo ervas para o dragão'],
        [11, 13, 'cais', 'Examinando as escamas do dragão'], [13, 14, 'taverna', 'Almoçando'], [14, 18, 'cais', 'Treinando o dragão com paciência'],
        [18, 20, 'biblioteca', 'Estudando sobre dragões'], [20, 22, 'cais', 'Cantando para o dragão dormir']],
      trabalho: ['Calma, grandão...', 'Peixe fresco!', 'Ele está aprendendo.'], social: ['Dragão também sente medo.', 'Confiança se constrói devagar.']
    },
    ferreiro_andarilho: {
      blocos: [[21, 4, 'casa', 'Dormindo na cabana', S], [4, 8, 'floresta', 'Buscando materiais com o touro'], [8, 12, 'forja', 'Montando a oficina portátil'],
        [12, 13, 'fogueira', 'Almoçando com o touro'], [13, 18, 'forja', 'Forjando com os melhores materiais'], [18, 21, 'taverna', 'Contando das viagens']],
      trabalho: ['Material bom faz lâmina boa.', 'Segura, touro!', 'Oficina pronta em dois minutos.'], social: ['Volto em três dias... ou não.', 'O touro é meu ajudante.']
    },
    cacador_veterano: {
      blocos: [[1, 7, 'casa', 'Dormindo com a corrente na mão', S], [7, 10, 'cais', 'Olhando quem desembarca'], [10, 13, 'passeio', 'Estudando o rosto dos moradores'],
        [13, 15, 'taverna', 'Escutando conversas'], [15, 19, 'cais', 'Olhando a praia de longe'], [19, 23, 'taverna', 'Bebendo sozinho no canto'], [23, 1, 'floresta', 'Seguindo pegadas']],
      trabalho: ['Todo mundo tem um preço.', 'Eu conheço essa cara...', 'Hmm.'], social: ['Ninguém aqui me reconhece... ainda.', 'Recompensa boa paga a viagem.']
    },
    // ---- Dia 5
    contrabandista: {
      blocos: [[2, 9, 'casa', 'Dormindo (com um olho aberto)', S], [9, 11, 'cais', 'Fingindo ser ex-marinheiro'], [11, 13, 'mercearia', 'Pechinchando na mercearia'],
        [13, 15, 'passeio', 'Disfarçado no meio do povo'], [15, 18, 'cais', 'Olhando os barcos que chegam'], [18, 22, 'taverna', 'Contando mentiras do mar'],
        [22, 2, 'floresta', 'Escondendo umas caixas...']],
      trabalho: ['Eu? Ex-marinheiro, claro.', 'Nada pra ver aqui.', 'Que caixas?'], social: ['Já naveguei os sete mares... acho.', 'Negócio bom é negócio quieto.']
    },
    // ---- Dia 4 (segunda leva)
    mentalista: {
      blocos: [[0, 7, 'casa', 'Dormindo', S], [7, 9, 'santuario', 'Meditando em silêncio'], [9, 12, 'biblioteca', 'Lendo pensamentos... e livros'],
        [12, 13, 'fogueira', 'Almoçando'], [13, 17, 'passeio', 'Recrutando mentes para o Clube'], [17, 20, 'taverna', 'Reunião do Clube das Mentes'],
        [20, 24, 'fogueira', 'Influenciando a conversa na fogueira']],
      trabalho: ['Eu sei o que você pensou.', 'A mente é a maior força.', 'Junte-se ao Clube.'], social: ['Vim de muito, muito longe.', 'Proteger a ilha começa na mente.']
    },
    cavaleiro_negro: {
      blocos: [[23, 5, 'casa', 'Dormindo', S], [5, 8, 'arena', 'Treinando com o montante'], [8, 12, 'passeio', 'Patrulhando as ruas da ilha'],
        [12, 13, 'fogueira', 'Almoçando de armadura'], [13, 17, 'arena', 'Treinando a guarda da ilha'], [17, 20, 'cais', 'Defendendo o cais'],
        [20, 23, 'taverna', 'Lembrando os tempos dos Cavaleiros Negros']],
      trabalho: ['Em formação!', 'O povo vem primeiro.', 'Escudos ao alto!'], social: ['Fui chefe dos Cavaleiros Negros.', 'Um bom rei defende o povo.']
    },
    lenhador_magico: {
      blocos: [[22, 5, 'casa', 'Dormindo', S], [5, 7, 'fogueira', 'Acendendo o fogo com um soco'], [7, 12, 'floresta', 'Derrubando pinheiros com um golpe só'],
        [12, 13, 'fogueira', 'Almoçando (muito)'], [13, 16, 'oficina', 'Carregando toras gigantes'], [16, 19, 'arena', 'Testando a força mágica'],
        [19, 22, 'taverna', 'Queda de braço na taverna']],
      trabalho: ['Um golpe. Uma árvore.', 'Força de sobra!', 'Madeira!'], social: ['Minha força é magia.', 'Alguém precisa levantar algo pesado?']
    },
    // ---- Dia 7
    fazendeiro_rico: {
      blocos: [[21, 4, 'casa', 'Dormindo', S], [4, 9, 'fazenda', 'Ensinando o plantio do continente'], [9, 11, 'mercearia', 'Discutindo preço com o merceeiro'],
        [11, 13, 'pasto', 'Escolhendo o melhor gado'], [13, 14, 'taverna', 'Almoçando'], [14, 18, 'fazenda', 'Abrindo uma fazenda nova'], [18, 21, 'fogueira', 'Contando que era famoso no continente']],
      trabalho: ['Aqui o preço é justo!', 'Terra boa, essa.', 'No continente eu era famoso.'], social: ['Saí de lá por causa dos preços.', 'Quer uma dica de plantio?']
    },
    mestre_ferreiro: {
      blocos: [[20, 4, 'casa', 'Dormindo', S], [4, 12, 'forja', 'Forjando como há 40 anos'], [12, 13, 'fogueira', 'Almoçando devagar'],
        [13, 17, 'forja', 'Corrigindo os aprendizes'], [17, 20, 'taverna', 'Contando do tempo antigo']],
      trabalho: ['Ferro não mente.', 'Mais forte. De novo.', 'Sessenta anos de forja.'], social: ['No meu tempo era tudo na mão.', 'Respeite o fogo, garoto.']
    },
    encantador: {
      blocos: [[23, 6, 'casa', 'Dormindo', S], [6, 10, 'forja', 'Forjando com o Kasseki'], [10, 12, 'biblioteca', 'Estudando runas antigas'],
        [12, 13, 'taverna', 'Almoçando'], [13, 17, 'torre', 'Encantando armas com o Fernando'], [17, 20, 'arena', 'Testando uma espada encantada'], [20, 23, 'forja', 'Gravando runas de madrugada']],
      trabalho: ['Essa runa brilha!', 'Lâmina encantada.', 'Cuidado, está quente.'], social: ['Armadura encantada? Faço.', 'Toda arma tem alma.']
    },
    pesquisador: {
      blocos: [[0, 7, 'casa', 'Dormindo', S], [7, 10, 'floresta', 'Estudando formigas com a lupa'], [10, 13, 'laboratorio', 'Anotando tudo no caderno'],
        [13, 14, 'taverna', 'Almoçando e anotando'], [14, 18, 'oficina', 'Inventando uma engenhoca'], [18, 21, 'fogueira', 'Tocando guitarra elétrica'], [21, 24, 'biblioteca', 'Lendo até tarde']],
      trabalho: ['Formiga é genial.', 'Anotado!', 'Hipótese confirmada.'], social: ['Quer ouvir um solo?', 'Formigas trabalham juntas. Nós também.']
    },
    curandeiro: {
      blocos: [[22, 5, 'casa', 'Dormindo', S], [5, 9, 'floresta', 'Colhendo ervas de cura'], [9, 12, 'arena', 'Cuidando dos feridos do treino'],
        [12, 13, 'taverna', 'Almoçando'], [13, 17, 'laboratorio', 'Preparando remédios'], [17, 19, 'cais', 'Examinando o dragão'], [19, 22, 'fogueira', 'Ouvindo as dores de todo mundo']],
      trabalho: ['Isso vai sarar.', 'Erva certa, dose certa.', 'Respira fundo.'], social: ['Machucou? Me chama.', 'Remédio bom é chá quente.']
    },
    padeiro: {
      blocos: [[19, 2, 'mercearia', 'Dormindo', S], [2, 7, 'mercearia', 'Assando o pão do dia'], [7, 10, 'fogueira', 'Entregando pão quentinho'],
        [10, 12, 'fazenda', 'Buscando trigo'], [12, 15, 'mercearia', 'Fazendo salgados e bolos'], [15, 19, 'taverna', 'Levando bolo para a taverna']],
      trabalho: ['Pão quentinho!', 'Olha o bolo!', 'Salgado saindo!'], social: ['Prova esse.', 'Aqui ninguém passa fome.']
    },
    aspirante_heroi: {
      blocos: [[23, 6, 'casa', 'Dormindo', S], [6, 10, 'arena', 'Treinando para ser herói'], [10, 12, 'cais', 'Fazendo pose de herói pro dragão'],
        [12, 13, 'taverna', 'Almoçando (sem pimenta!)'], [13, 17, 'passeio', 'Procurando alguém para salvar'], [17, 20, 'arena', 'Treinando mais'], [20, 23, 'fogueira', 'Sonhando com uma aventura']],
      trabalho: ['Alguém precisa de ajuda?', 'Um herói nunca descansa!', 'Atchim! Tem pimenta aqui?'], social: ['Sempre quis ser herói.', 'Pimenta é minha única fraqueza.']
    },
    padre: {
      blocos: [[21, 5, 'casa', 'Dormindo', S], [5, 8, 'santuario', 'Rezando ao amanhecer'], [8, 11, 'fogueira', 'Conversando com quem precisa'],
        [11, 13, 'cais', 'Olhando o mar de onde veio'], [13, 14, 'taverna', 'Almoçando'], [14, 17, 'biblioteca', 'Procurando quem mandou a carta'], [17, 21, 'santuario', 'Acendendo velas']],
      trabalho: ['Paz para esta ilha.', 'Quem mandou aquela carta?', 'Fique com Deus.'], social: ['Vim porque uma carta me chamou.', 'Todo mundo merece uma segunda chance.']
    },
    explorador_luz: {
      blocos: [[1, 8, 'casa', 'Dormindo com o gato Mick', S], [8, 11, 'oficina', 'Ajustando os inventos'], [11, 13, 'ponte', 'Procurando a luz no leste'],
        [13, 14, 'taverna', 'Almoçando com o Mick'], [14, 18, 'santuario', 'Vigiando o leste'], [18, 21, 'laboratorio', 'Desenhando mapas da luz'], [21, 1, 'ponte', 'Esperando a luz misteriosa', { aviso: 'foi esperar a luz misteriosa no leste' }]],
      trabalho: ['Você viu aquela luz?', 'Mick, olha!', 'Meu cachecol ajuda.'], social: ['A luz vem do leste.', 'Esse cachecol tem quatro braços, sim.']
    },
    guarda: {
      blocos: [[23, 5, 'casa', 'Dormindo', S], [5, 7, 'orla', 'Ronda na orla'], [7, 11, 'arena', 'Treinando os recrutas'],
        [11, 13, 'fogueira', 'Vigiando a praça'], [13, 14, 'taverna', 'Almoçando'], [14, 17, 'arena', 'Treinando os recrutas'], [17, 20, 'cais', 'Vigiando o caçador e o dragão'], [20, 23, 'fogueira', 'Guarda da noite']],
      trabalho: ['Postura, recruta!', 'De novo!', 'Ninguém passa.'], social: ['Meu avô me ensinou tudo.', 'A vila está segura.']
    },
    crianca_curiosa: {
      blocos: [[20, 7, 'casa', 'Dormindo', S], [7, 9, 'mercearia', 'Pedindo pão ao Lucas'], [9, 11, 'arena', 'Imitando os guerreiros'],
        [11, 13, 'cais', 'Olhando o dragão de longe'], [13, 14, 'casa', 'Almoçando'], [14, 17, 'passeio', 'Correndo pela ilha'], [17, 20, 'fogueira', 'Ouvindo histórias']],
      trabalho: ['Eu vou ser guerreiro!', 'O dragão olhou pra mim!', 'Pega eu!'], social: ['Tenho seis anos!', 'Me conta uma história?']
    },
    pintor: {
      blocos: [[2, 9, 'casa', 'Dormindo', S], [9, 12, 'cais', 'Pintando o mar'], [12, 13, 'taverna', 'Almoçando'],
        [13, 16, 'floresta', 'Pintando a floresta'], [16, 19, 'cais', 'Pintando o dragão'], [19, 22, 'fogueira', 'Pintando rostos'], [22, 2, 'casa', 'Pintando sozinho, sem dormir']],
      trabalho: ['Não se mexe!', 'Que luz bonita.', 'Mais azul...'], social: ['Meu nome é Leonardo. Não Jim.', 'Já fui outra pessoa.']
    },
    samurai: {
      blocos: [[22, 5, 'casa', 'Dormindo', S], [5, 7, 'cais', 'Meditando diante do mar'], [7, 11, 'arena', 'Treinando com a katana'],
        [11, 12, 'taverna', 'Almoçando em silêncio'], [12, 16, 'passeio', 'Perguntando pelo velho Mu'], [16, 18, 'floresta', 'Seguindo pistas na floresta'], [18, 22, 'fogueira', 'Ouvindo as histórias da ilha']],
      trabalho: ['Hai!', 'Um corte, uma vida.', 'Disciplina.'], social: ['Viram um velho chamado Mu?', 'A Rainha Amisul me enviou.', 'Honra acima de tudo.']
    },
    cartografo: {
      blocos: [[22, 6, 'casa', 'Dormindo', S], [6, 8, 'cais', 'Lendo o vento e as marés'], [8, 12, 'orla', 'Medindo a costa da ilha'],
        [12, 13, 'taverna', 'Almoçando'], [13, 16, 'biblioteca', 'Desenhando o mapa da ilha'], [16, 18, 'ponte', 'Marcando o riacho no mapa'], [18, 22, 'fogueira', 'Mostrando os mapas do mundo']],
      trabalho: ['Norte é pra lá.', 'Mais um trecho no mapa.', 'Vento leste hoje.'], social: ['Já vi o mundo todo no papel.', 'Quer ver onde fica seu reino?', 'Tenho 15 anos, mas sei navegar.']
    },
    psicologa: {
      blocos: [[22, 6, 'casa', 'Dormindo', S], [6, 8, 'casa', 'Tomando café com o Omar'], [8, 11, 'fogueira', 'Escutando quem precisa desabafar'],
        [11, 12, 'cais', 'Conversando com quem chegou de barco'], [12, 13, 'taverna', 'Almoçando'], [13, 16, 'passeio', 'Visitando os moradores'],
        [16, 18, 'santuario', 'Atendendo em silêncio no santuário'], [18, 22, 'fogueira', 'Ouvindo as histórias da noite']],
      trabalho: ['E como você se sente?', 'Pode falar, estou ouvindo.', 'Respira, um passo de cada vez.'], social: ['O Omar quer ser empresário!', 'Todo mundo aqui carrega uma história.', 'Conversar ajuda.']
    },
    crianca_empresario: {
      blocos: [[20, 7, 'casa', 'Dormindo', S], [7, 9, 'mercearia', 'Aprendendo a vender com o Felipão'], [9, 11, 'passeio', 'Oferecendo negócios pela ilha'],
        [11, 13, 'cais', 'Contando os barcos que chegam'], [13, 14, 'casa', 'Almoçando com a mãe'], [14, 17, 'taverna', 'Vendo como a taverna dá lucro'], [17, 20, 'fogueira', 'Ouvindo histórias']],
      trabalho: ['Quer comprar?', 'Faço preço bom!', 'Uma moeda, por favor.'], social: ['Vou ser empresário!', 'Um dia vou ter uma loja.', 'Minha mãe é psicóloga.']
    },
    // ---- Dia 9
    astrologo: {
      blocos: [[3, 11, 'casa', 'Dormindo', S], [11, 12, 'casa', 'Desenhando mapas do céu'], [12, 13, 'taverna', 'Almoçando'],
        [13, 16, 'biblioteca', 'Calculando o caminho dos astros'], [16, 18, 'passeio', 'Lendo os signos dos moradores'], [18, 19, 'fogueira', 'Jantando na fogueira'],
        [19, 3, 'torre', 'Observando as estrelas do alto da torre']],
      trabalho: ['Júpiter está alto hoje.', 'Os astros não mentem.', 'Olha aquela constelação!'], social: ['Qual é o seu signo?', 'Vim ver as estrelas daqui.', 'O céu desta ilha é diferente.']
    },
    domador: {
      blocos: [[21, 5, 'casa', 'Dormindo', S], [5, 7, 'pasto', 'Acalmando os animais do pasto'], [7, 11, 'floresta', 'Procurando criaturas na floresta'],
        [11, 13, 'fogueira', 'Almoçando e contando da expedição'], [13, 17, 'arena', 'Treinando criaturas na arena'], [17, 19, 'cais', 'Olhando o mar por onde chegou'],
        [19, 21, 'fogueira', 'Conversando na fogueira']],
      trabalho: ['Calma, bichinho...', 'Senta! Muito bem!', 'Essa criatura é das boas.'], social: ['Me perdi do meu grupo no mar.', 'Já domou um monstro?', 'Será que o dragão deixa eu chegar perto?']
    },
    guardiao_exilado: {
      blocos: [[0, 5, 'casa', 'Dormindo na cabana', S], [5, 9, 'arena', 'Treinando com armas de corpo a corpo'], [9, 10, 'fogueira', 'Comendo em silêncio'],
        [10, 13, 'ponte', 'Treinando na beira do riacho'], [13, 14, 'taverna', 'Almoçando'], [14, 18, 'arena', 'Treinando sem parar'],
        [18, 21, 'passeio', 'Vigiando a ilha'], [21, 0, 'fogueira', 'Afiando as lâminas na fogueira']],
      trabalho: ['Mais rápido.', 'De novo.', 'A lâmina não perdoa.'], social: ['Meu irmão me tirou tudo.', 'Treino para proteger a ilha.', 'Um velho guerreiro me ensinou.']
    },
    batata_defensor: {
      blocos: [[22, 6, 'casa', 'Dormindo', S], [6, 8, 'fazenda', 'Visitando a plantação (com respeito)'], [8, 12, 'arena', 'Treinando defesa com o garfo e a tampa'],
        [12, 13, 'taverna', 'Almoçando (nada de batata no prato!)'], [13, 17, 'cais', 'Vigiando o mar'], [17, 19, 'passeio', 'Patrulhando a ilha'],
        [19, 22, 'fogueira', 'Contando do reino das batatas, longe do fogo']],
      trabalho: ['Em guarda!', 'Ninguém passa!', 'Pela coroa das batatas!'], social: ['Eu era rei, sabia?', 'Do meu reino, só sobrou eu.', 'Batata frita? Que horror!']
    },
    tita_defensor: {
      blocos: [[23, 6, 'casa', 'Recarregando a armadura', S], [6, 8, 'cais', 'Escaneando o horizonte'], [8, 12, 'passeio', 'Patrulhando a ilha'],
        [12, 13, 'taverna', 'Almoçando'], [13, 16, 'oficina', 'Consertando o escudo de energia'], [16, 19, 'arena', 'Treinando defesa'],
        [19, 23, 'fogueira', 'Contando do mundo tecnológico']],
      trabalho: ['Escudo ativado!', 'Ninguém passa.', 'Sistema de defesa: ok.'], social: ['No meu mundo tudo era máquina.', 'Eu defendo o dragão.', 'Aqui é tudo de madeira!']
    },
    fugitivo: {
      blocos: [[3, 10, 'casa', 'Dormindo de botas, pronto para fugir', S], [10, 12, 'floresta', 'Andando por trilhas que ninguém usa'], [12, 13, 'fogueira', 'Comendo sozinho, de costas para a parede'],
        [13, 17, 'ponte', 'Vigiando quem chega pela ponte'], [17, 20, 'floresta', 'Cavando alguma coisa no mato'], [20, 3, 'taverna', 'No canto mais escuro da taverna']],
      trabalho: ['Não me olha assim.', 'Ninguém me seguiu... né?', 'Só estou de passagem.'], social: ['Fugi de um lugar pior que esse.', 'Prefiro não falar do passado.', 'Aqui ninguém me conhece. Ainda.']
    },
    engenheiro_vapor: {
      blocos: [[23, 6, 'casa', 'Dormindo', S], [6, 7, 'casa', 'Dando corda no relógio de bolso'], [7, 12, 'oficina', 'Montando uma engenhoca a vapor'],
        [12, 13, 'fogueira', 'Almoçando e apontando as coisas para aprender o nome'], [13, 15, 'biblioteca', 'Estudando o idioma da ilha'],
        [15, 18, 'cais', 'Medindo o vento para o dirigível'], [18, 20, 'oficina', 'Desenhando o dirigível'], [20, 23, 'taverna', 'Tentando conversar com as mãos']],
      trabalho: ['Pfff! Mais pressão.', 'Caldeira... quente!', 'Engrenagem... aqui.'], social: ['Eu... não falo bem. Ainda.', 'Um dia: dirigível!', 'Na minha terra, tudo a vapor.']
    },
    gato: {
      blocos: [[22, 6, 'taverna', 'Dormindo no telhado da taverna', { soneca: true }], [6, 9, 'fogueira', 'Esquentando-se no fogo'],
        [9, 20, 'passeio', 'Passeando pela ilha (fugindo do Bidu)'], [20, 22, 'taverna', 'Pedindo peixe na taverna']],
      trabalho: ['Miau. Quer dizer, oi.', 'Sou roxo, e daí?', 'Cachorro chato!'], social: ['Tem peixe?', 'Eu falo, sim.']
    },
    cao: {
      blocos: [[22, 6, 'casa', 'Dormindo na porta de casa', { soneca: true }], [6, 9, 'pasto', 'Pastoreando as ovelhas'],
        [9, 20, 'gato', 'Perseguindo o gato roxo'], [20, 22, 'fogueira', 'Deitado perto do fogo']],
      trabalho: ['Au! Au!', 'Volta aqui, gato!'], social: ['Au?', 'Rrrr... au.']
    }
  };
  ROTINAS.fundador = ROTINAS.lenhador;
  window.IlhaRotinas = ROTINAS;
})();
