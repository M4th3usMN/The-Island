# A Grande Ilha — como colocar no ar

O site é estático: não precisa de servidor rodando 24 horas. A posição de cada
morador é calculada a partir do relógio real (horário de Manaus), então todo
visitante, em qualquer lugar do mundo, vê exatamente a mesma cena ao mesmo
tempo. A música também toca sincronizada para todos.

## O que tem na pasta

| Arquivo | Para que serve |
|---|---|
| `index.html` | A ilha ao vivo (a página que o público abre) |
| `moradores.js` | A lista de moradores. **É o único arquivo que você edita no dia a dia** |
| `admin.html` | Ajudante para cadastrar um morador novo (monta o código pronto) |
| `js/rotinas.js` | As rotinas de cada profissão (horários e lugares) |
| `js/sprites.js` | O desenho em pixel art dos personagens |
| `js/ilha.js` | A simulação, o mapa, a música e a interface |
| `musica.mp3` | A trilha em loop |

Para testar no computador, abra o `index.html` no navegador. A música pode não
tocar ao abrir direto do computador; no site publicado ela funciona.

## Caminho recomendado: GitHub + Cloudflare Pages (grátis)

Assim, adicionar um morador é só editar um arquivo no GitHub, e o site se
atualiza sozinho.

1. Crie uma conta em **github.com**.
2. Clique em **New repository**, dê o nome `grande-ilha`, marque **Public** e crie.
3. Na página do repositório, clique em **uploading an existing file** e arraste
   todos os arquivos e a pasta `js` desta pasta. Clique em **Commit changes**.
4. Crie uma conta em **dash.cloudflare.com** e vá em **Workers e Pages** >
   **Criar** > **Pages** > **Conectar ao Git**.
5. Escolha o repositório `grande-ilha`. Em configurações de build, deixe o
   comando de build **vazio** e a pasta de saída como `/`. Clique em **Salvar e implantar**.
6. Em cerca de 1 minuto o site estará no ar num endereço como
   `grande-ilha.pages.dev`. Esse link já funciona para qualquer pessoa no mundo.

Alternativa sem GitHub: em **app.netlify.com/drop**, arraste a pasta inteira e
o site sai na hora. A desvantagem é que, para cada morador novo, você precisa
arrastar a pasta de novo.

## Adicionar um morador novo

1. Abra o `admin.html` (no seu computador ou em `seusite/admin.html`).
2. Preencha nome, profissão, história, rotina, onde mora e a data de chegada.
3. Escolha a aparência. O aviso verde confirma que ninguém tem a mesma aparência.
4. Clique em **Copiar código**.
5. No GitHub, abra `moradores.js`, clique no lápis, cole o código no fim da
   lista (logo antes do `];`) e clique em **Commit changes**.
6. O site atualiza sozinho em cerca de 1 minuto. O morador aparece chegando de
   barco no horário que você definiu.

O `admin.html` só monta o texto; ele não altera o site. Só quem tem acesso à
sua conta do GitHub consegue mudar os moradores, então o público continua
apenas assistindo.

**Dicas**
- Coloque a mesma hora de chegada para todos de um episódio. A ilha faz o
  desembarque em fila, um a cada 25 segundos, com o aviso "CHEGOU!".
- Se a profissão não existir em `js/rotinas.js`, escolha a mais parecida
  (por exemplo, um "curandeiro" pode usar a rotina `quimico`).
- Casas novas surgem sozinhas. Há 22 terrenos livres no mapa; quando
  estiverem perto de acabar, me peça para expandir a ilha.

## Domínio próprio (opcional)

1. Compre um domínio, por exemplo no **registro.br** (um `.com.br` custa em
   torno de R$ 40 por ano; confira o preço atual no site).
2. No Cloudflare Pages, abra o projeto > **Domínios personalizados** >
   **Configurar um domínio** e digite o seu domínio.
3. Siga as instruções que aparecem: no registro.br, troque os servidores DNS
   para os que o Cloudflare mostrar. A troca pode levar algumas horas.

## Horários

- O relógio da ilha é o de Manaus (UTC-4) para todos os visitantes.
- O Dia 2 começou em 03/11/2026 às 20:00. Cada dia novo começa às 20:00.
- Dia e noite seguem o relógio real: amanhecer por volta das 5h, noite a partir das 19h.
- O clima (céu limpo, nublado, chuva, neblina) muda a cada 3 horas.
