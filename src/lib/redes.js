import {
  InstagramLogo, YoutubeLogo, TiktokLogo, FacebookLogo, LinkedinLogo, XLogo, ThreadsLogo, PinterestLogo, Storefront, Globe,
} from '@phosphor-icons/react'

// Redes que o app conecta e agenda. A ordem é a da tela de conexão.
// `exige`: o que o post precisa ter para a rede aceitar (validado antes de
// enviar, para o erro aparecer no formulário e não só depois, na fila).
export const REDES = {
  instagram: { nome: 'Instagram', icone: InstagramLogo, exige: 'midia', obs: 'Precisa ser conta Profissional (Business ou Criador).' },
  youtube: { nome: 'YouTube', icone: YoutubeLogo, exige: 'video', obs: 'Vídeo vertical de até 3 minutos vira Short.' },
  tiktok: { nome: 'TikTok', icone: TiktokLogo, exige: 'midia', obs: 'Vídeos saem como públicos. Até 15 por dia.' },
  facebook: { nome: 'Facebook', icone: FacebookLogo, obs: 'Publica em uma Página.' },
  linkedin: { nome: 'LinkedIn', icone: LinkedinLogo },
  threads: { nome: 'Threads', icone: ThreadsLogo },
  twitter: { nome: 'X (Twitter)', icone: XLogo, obs: 'O X cobra por uso da API; o Zernio repassa o custo.' },
  pinterest: { nome: 'Pinterest', icone: PinterestLogo, exige: 'midia' },
  googlebusiness: { nome: 'Google Meu Negócio', icone: Storefront, obs: 'Publica novidades na ficha da empresa.' },
}

export const rede = (plataforma) => REDES[plataforma] || { nome: plataforma, icone: Globe }

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
