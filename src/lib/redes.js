import {
  InstagramLogo, YoutubeLogo, TiktokLogo, FacebookLogo, LinkedinLogo, XLogo, ThreadsLogo, PinterestLogo, Storefront, Globe,
  Butterfly, RedditLogo, SnapchatLogo, WhatsappLogo, TelegramLogo, DiscordLogo, SlackLogo, ChatCircleText,
  MetaLogo, GoogleLogo, WindowsLogo, OpenAiLogo, Megaphone, Article, ShoppingBagOpen, Browser, Browsers, ChartBar, Handshake,
} from '@phosphor-icons/react'

// Tudo o que o Zernio conecta, na ordem em que a tela de conexões mostra.
//   grupo    : seção da tela de conexões
//   publica  : entra no formulário de post e nas métricas
//   exige    : o que o post precisa ter para a rede aceitar (validado antes
//              de enviar, para o erro aparecer no formulário e não na fila)
//   conexao  : 'login' (tela oficial da rede, o padrão), 'telegram' (código
//              para o bot), 'loja' (pede o endereço da loja) ou 'painel'
//              (o Zernio só conecta pelo painel dele)
//   contas   : nomes que a conta pode ter no Zernio, quando diferem da chave
export const GRUPOS = [
  { key: 'social', titulo: 'Redes sociais' },
  { key: 'mensagens', titulo: 'Mensagens e comunidades' },
  { key: 'anuncios', titulo: 'Anúncios' },
  { key: 'sites', titulo: 'Sites e blogs' },
  { key: 'dados', titulo: 'Dados e contas' },
]

export const REDES = {
  instagram: { nome: 'Instagram', icone: InstagramLogo, grupo: 'social', publica: true, exige: 'midia', obs: 'Precisa ser conta Profissional (Business ou Criador).' },
  youtube: { nome: 'YouTube', icone: YoutubeLogo, grupo: 'social', publica: true, exige: 'video', obs: 'Vídeo vertical de até 3 minutos vira Short.' },
  tiktok: { nome: 'TikTok', icone: TiktokLogo, grupo: 'social', publica: true, exige: 'midia', obs: 'Vídeos saem como públicos. Até 15 por dia.' },
  facebook: { nome: 'Facebook', icone: FacebookLogo, grupo: 'social', publica: true, obs: 'Publica em uma Página.' },
  linkedin: { nome: 'LinkedIn', icone: LinkedinLogo, grupo: 'social', publica: true },
  threads: { nome: 'Threads', icone: ThreadsLogo, grupo: 'social', publica: true },
  twitter: { nome: 'X (Twitter)', icone: XLogo, grupo: 'social', publica: true, obs: 'O X cobra por uso da API; o Zernio repassa o custo.' },
  pinterest: { nome: 'Pinterest', icone: PinterestLogo, grupo: 'social', publica: true, exige: 'midia' },
  googlebusiness: { nome: 'Google Meu Negócio', icone: Storefront, grupo: 'social', publica: true, obs: 'Publica novidades na ficha da empresa.' },
  bluesky: { nome: 'Bluesky', icone: Butterfly, grupo: 'social', publica: true },
  reddit: { nome: 'Reddit', icone: RedditLogo, grupo: 'social', publica: true, obs: 'O Zernio informa que está temporariamente indisponível.' },
  snapchat: { nome: 'Snapchat', icone: SnapchatLogo, grupo: 'social', publica: true, exige: 'midia', obs: 'Em teste fechado no Zernio; pode recusar a conexão.' },

  whatsapp: { nome: 'WhatsApp', icone: WhatsappLogo, grupo: 'mensagens', obs: 'Número do WhatsApp Business, pela Meta.' },
  telegram: { nome: 'Telegram', icone: TelegramLogo, grupo: 'mensagens', publica: true, conexao: 'telegram', obs: 'Canal ou grupo, por um código enviado ao bot.' },
  discord: { nome: 'Discord', icone: DiscordLogo, grupo: 'mensagens', publica: true, obs: 'Um canal por conexão.' },
  slack: { nome: 'Slack', icone: SlackLogo, grupo: 'mensagens', publica: true, obs: 'Um canal por conexão.' },
  imessage: { nome: 'iMessage', icone: ChatCircleText, grupo: 'mensagens', conexao: 'painel' },

  metaads: { nome: 'Meta Ads', icone: MetaLogo, grupo: 'anuncios', contas: ['metaads', 'facebookads', 'meta-ads'] },
  googleads: { nome: 'Google Ads', icone: Megaphone, grupo: 'anuncios' },
  linkedinads: { nome: 'LinkedIn Ads', icone: LinkedinLogo, grupo: 'anuncios' },
  tiktokads: { nome: 'TikTok Ads', icone: TiktokLogo, grupo: 'anuncios' },
  xads: { nome: 'X Ads', icone: XLogo, grupo: 'anuncios', contas: ['xads', 'twitterads'] },
  pinterestads: { nome: 'Pinterest Ads', icone: PinterestLogo, grupo: 'anuncios' },
  redditads: { nome: 'Reddit Ads', icone: RedditLogo, grupo: 'anuncios' },
  microsoftads: { nome: 'Microsoft Ads', icone: WindowsLogo, grupo: 'anuncios' },
  openaiads: { nome: 'OpenAI Ads', icone: OpenAiLogo, grupo: 'anuncios', conexao: 'painel', contas: ['openaiads', 'openai-ads'] },

  wordpress: { nome: 'WordPress', icone: Article, grupo: 'sites' },
  shopify: { nome: 'Shopify', icone: ShoppingBagOpen, grupo: 'sites', conexao: 'loja' },
  wix: { nome: 'Wix', icone: Browser, grupo: 'sites' },
  webflow: { nome: 'Webflow', icone: Browsers, grupo: 'sites' },

  googleanalytics: { nome: 'Google Analytics', icone: ChartBar, grupo: 'dados', obs: 'Só leitura dos relatórios do GA4.' },
  hubspot: { nome: 'HubSpot', icone: Handshake, grupo: 'dados' },
  google: { nome: 'Conta Google', icone: GoogleLogo, grupo: 'dados', obs: 'Arquivos do Drive e e-mail.' },
  microsoft: { nome: 'Conta Microsoft', icone: WindowsLogo, grupo: 'dados', obs: 'Arquivos do OneDrive e e-mail.' },
}

// Conta do Zernio -> chave do catálogo (a conta de anúncios pode vir com outro nome).
const APELIDOS = Object.fromEntries(Object.entries(REDES).flatMap(([chave, r]) => (r.contas || []).map(nome => [nome, chave])))
export const chaveDaRede = (plataforma) => (REDES[plataforma] ? plataforma : APELIDOS[plataforma] || plataforma)
export const publica = (plataforma) => Boolean(REDES[plataforma]?.publica)

export const rede = (plataforma) => REDES[chaveDaRede(plataforma)] || { nome: plataforma, icone: Globe }

// Status do post -> rótulo e tom do Badge (a cor aqui é estado, não identidade).
export const STATUS = {
  draft: { rotulo: 'Rascunho', tom: 'neutral' },
  pending_approval: { rotulo: 'Aguardando aprovação', tom: 'warning' },
  scheduled: { rotulo: 'Agendado', tom: 'info' },
  publishing: { rotulo: 'Publicando', tom: 'warning' },
  published: { rotulo: 'Publicado', tom: 'success' },
  partial: { rotulo: 'Publicado em parte', tom: 'warning' },
  failed: { rotulo: 'Falhou', tom: 'danger' },
  cancelled: { rotulo: 'Cancelado', tom: 'neutral' },
  pending: { rotulo: 'Na fila', tom: 'info' },
  processing: { rotulo: 'Processando', tom: 'warning' },
  uploading: { rotulo: 'Enviando', tom: 'warning' },
}

export const status = (s) => STATUS[s] || { rotulo: s || 'Sem status', tom: 'neutral' }

// O que falta para cada conta escolhida aceitar o post. Lista vazia = pode enviar.
export function pendencias({ destinos, midias, conteudo }) {
  const faltas = []
  const temVideo = midias.some(m => m.tipo === 'video')
  for (const d of destinos) {
    const { nome, exige } = rede(d.plataforma)
    if (exige === 'midia' && midias.length === 0) faltas.push(`${nome} não aceita post só de texto: adicione uma imagem ou um vídeo.`)
    if (exige === 'video' && !temVideo) faltas.push(`${nome} só aceita vídeo.`)
    if (d.plataforma === 'instagram' && d.dados?.contentType === 'story' && midias.length !== 1) faltas.push('Story do Instagram leva exatamente um arquivo.')
    if (d.plataforma === 'tiktok' && temVideo && midias.length > 1) faltas.push('TikTok aceita um vídeo por post (ou só fotos).')
  }
  if (destinos.length > 0 && !conteudo.trim() && midias.length === 0) faltas.push('Escreva a legenda ou adicione um arquivo.')
  return [...new Set(faltas)]
}

// Redes em que o Zernio lê comentários e mensagens diretas.
export const TEM_INBOX = ['instagram', 'facebook', 'youtube', 'tiktok', 'linkedin', 'threads', 'twitter']
