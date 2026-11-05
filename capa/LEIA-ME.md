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
