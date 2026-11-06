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
