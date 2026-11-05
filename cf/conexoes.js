// Tudo o que o Zernio conecta por redirecionamento: a chave é o nome que a
// tela usa, o valor é a rota do Zernio que devolve o endereço de login.
// Conexões que o Zernio só faz com credenciais digitadas no painel dele
// (OpenAI Ads, Whop, iMessage) não entram aqui: a tela manda para o painel.
export const CONEXOES = {
  // Redes sociais
  instagram: { rota: '/connect/instagram' },
  youtube: { rota: '/connect/youtube' },
  tiktok: { rota: '/connect/tiktok' },
  facebook: { rota: '/connect/facebook' },
  linkedin: { rota: '/connect/linkedin' },
  threads: { rota: '/connect/threads' },
  twitter: { rota: '/connect/twitter' },
  pinterest: { rota: '/connect/pinterest' },
  googlebusiness: { rota: '/connect/googlebusiness' },
  bluesky: { rota: '/connect/bluesky' },
  reddit: { rota: '/connect/reddit' },
  snapchat: { rota: '/connect/snapchat' },
  // Mensagens e comunidades
  whatsapp: { rota: '/connect/whatsapp', extra: { signup: 'hosted', language: 'pt-BR' } },
  discord: { rota: '/connect/discord' },
  slack: { rota: '/connect/slack' },
  // Anúncios
  metaads: { rota: '/connect/facebook/ads' },
  googleads: { rota: '/connect/googleads/ads' },
  linkedinads: { rota: '/connect/linkedin/ads' },
  tiktokads: { rota: '/connect/tiktok/ads' },
  xads: { rota: '/connect/twitter/ads' },
  pinterestads: { rota: '/connect/pinterest/ads' },
  redditads: { rota: '/connect/redditads/ads' },
  microsoftads: { rota: '/connect/microsoftads/ads' },
  // Sites e blogs
  wordpress: { rota: '/connect/wordpress' },
  shopify: { rota: '/connect/shopify', pede: 'shop' },
  wix: { rota: '/connect/wix' },
  webflow: { rota: '/connect/webflow' },
  // Dados e contas
  googleanalytics: { rota: '/connect/googleanalytics' },
  hubspot: { rota: '/connect/hubspot' },
  google: { rota: '/connect/google' },
  microsoft: { rota: '/connect/microsoft' },
}
