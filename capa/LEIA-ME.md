# Capa padrão dos vídeos "Como cheguei à ilha"

Mesma capa para todos os episódios de origem: céu estrelado, a ilha com a fogueira no horizonte,
o morador no barco, o selo "COMO CHEGUEI À ILHA", o gancho (até 8 palavras) e o nome em ouro.
Tudo que importa fica dentro do recorte 3:4 do perfil.

Gerar (1080x1920, JPG):

    node capa/grava.js "id=jareel&ep=4&gancho=A família dizia que ele era *inútil*&prof=o ferreiro" capa_jareel.jpg

- id: o id do morador em moradores.js (o boneco é desenhado com o visual dele)
- ep: número pequeno no canto
- gancho: frase curta; *palavra* fica em ouro
- prof (opcional): texto em lilás embaixo do nome; sem ele usa "o <profissão>"
- nome (opcional): troca o nome mostrado
- selo (opcional): troca o selo "COMO CHEGUEI À ILHA" (ex.: selo=EPISÓDIO 4 · O DRAGÃO)
- dragao=1 (opcional): desenha o dragão no lugar do morador (episódios de evento)

Exemplo do Ep. 4:

    node capa/grava.js "dragao=1&ep=4&selo=A ilha decide&gancho=Vocês escolheram o *dragão*&nome=O DRAGÃO&prof=episódio 4" capa_ep4.jpg
