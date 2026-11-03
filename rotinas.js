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
    marinheiro: {
      blocos: [[22, 5, 'casa', 'Dormindo', S], [5, 12, 'cais', 'Vigiando o horizonte'], [12, 13, 'taverna', 'Almoçando na taverna'],
        [13, 18, 'cais', 'Procurando sinais de náufragos'], [18, 22, 'taverna', 'Contando histórias do mar']],
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
