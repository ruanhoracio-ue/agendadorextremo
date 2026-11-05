# Agendador Extremo

Agendador de redes sociais da Conversão Extrema, em cima da API do
[Zernio](https://zernio.com). Agenda posts (Instagram, YouTube, TikTok,
Facebook, LinkedIn, Threads, X, Pinterest, Google Meu Negócio), conecta as
contas e mostra as métricas dos posts e dos seguidores.

A interface usa o design system da Conversão Extrema
(`ruanhoracio-ue/design-system-conversao`): `src/index.css` e
`src/components/ui/` são cópias dele, sem alteração. O que é só do app fica em
`src/components/app/` e `src/pages/`.

## Telas

- **Dashboard** (primeira página): indicadores com variação contra o período
  anterior, visualizações por dia, próximos posts, o que precisa de atenção,
  melhores posts, desempenho por rede, seguidores por conta, caixa de entrada,
  contas e vídeos aprovados no content-hub. Um período só (7, 30 ou 90 dias)
  governa tudo. O "Analista da semana" compara os últimos 7 dias com os 7
  anteriores e escreve o que funcionou, o que caiu e o que repetir; são regras
  fixas sobre os números (`src/lib/analista.js`), não IA.
- **Calendário**: mês ou lista, com o status de cada post. Clique num dia para
  agendar, num post para ver o detalhe (status por rede, erro, tentar de novo,
  editar, excluir). Rascunhos ficam abaixo da grade. O formulário aceita um
  texto diferente por rede e, com o content-hub ligado, puxa um vídeo curto
  aprovado (arquivo e legenda). Ele também sugere os melhores horários (pelo
  engajamento dos posts já publicados) e mostra uma prévia do post em cada
  rede. "Prévia do feed" mostra a grade do Instagram com os agendados no topo.
- **Caixa de entrada**: comentários dos posts e mensagens diretas de todas as
  contas, com resposta daqui mesmo.
- **Métricas**: período, conta e origem (pelo agendador ou direto na rede).
  Indicadores com variação contra o período anterior, seguidores por conta e a
  tabela de posts ordenável.
- **Contas conectadas**: tudo o que o Zernio conecta (redes sociais,
  mensagens, anúncios, sites e blogs, dados), um cartão por conexão. O login
  acontece na tela oficial de cada serviço e volta para cá. O catálogo fica em
  `src/lib/redes.js` e as rotas do Zernio em `cf/conexoes.js`.
- **Configurações**: chave da API do Zernio, ligação com o content-hub e fuso
  horário.
- **Avisos** (sino no topo): posts que falharam nos últimos 30 dias e contas
  que a rede derrubou. Com a aba aberta, também vira notificação do navegador.

## Ligação com o content-hub

Com a chave da API de integração do content-hub cadastrada, um post criado a
partir de um vídeo aprovado devolve o status para lá: "agendado" (com a data)
ao agendar e "publicado" (com o link) quando o post vai ao ar. A segunda parte
acontece na próxima vez que o calendário for aberto depois da publicação, uma
única vez por post. Excluir o agendamento aqui não desfaz o "agendado" de lá:
a API de integração só aceita os status agendado e publicado.

## Rodar na máquina

Requer Node 22 ou mais novo.

```bash
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

`npm run dev` sobe a tela e a API juntas (a API é o mesmo código do Worker,
servido pelo Vite via `dev/apiLocal.js`). Variáveis em `.dev.vars`:

| Variável | Para quê |
| :--- | :--- |
| `ZERNIO_API_KEY` | Chave do Zernio. Opcional: também dá para colar em Configurações. |
| `APP_PASSWORD` | Senha de acesso. Sem ela o app só abre no `localhost`. |
| `CONTENT_HUB_KEY` | Chave de integração do content-hub. Opcional: também dá para colar em Configurações. |
| `CONTENT_HUB_URL` | Endereço do content-hub, se não for o de produção. |

No SSD externo (exFAT) o `npm install` é lento e ocupa muito espaço. O caminho
que funciona é espelhar a pasta no disco interno e instalar lá, como no
content-hub.

## Publicar (Cloudflare Workers)

1. Cadastrar os secrets:
   `npx wrangler@4 secret put APP_PASSWORD` e, se a chave for ficar como
   secret, `npx wrangler@4 secret put ZERNIO_API_KEY`.
2. Para colar a chave pela tela (e salvar fuso e perfil), criar o KV com
   `npx wrangler@4 kv namespace create agendador_kv` e ligar o id no
   `wrangler.jsonc`.
3. `npm run cf:deploy`.

Publicado sem `APP_PASSWORD`, o app se recusa a funcionar: quem entra pode
postar nas redes.

## Como o servidor está organizado

| Arquivo | O que faz |
| :--- | :--- |
| `cf/app.js` | Rotas `/api/*`, login e bloqueio de origem externa |
| `cf/zernio.js` | Cliente HTTP do Zernio, com erros em português |
| `cf/fonte.js` | Cada operação do app traduzida em chamadas ao Zernio |
| `cf/formato.js` | Conversão entre o formato do Zernio e o das telas |
| `cf/hub.js` | Ponte com a API de integração do content-hub |
| `cf/config.js`, `cf/sessao.js` | Chave, fuso, perfil e cookie de sessão |

A chave do Zernio nunca vai para o navegador. Os arquivos de mídia sobem do
navegador direto para o armazenamento do Zernio (endereço assinado), sem
passar pelo Worker.
