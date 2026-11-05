// Tradução entre o formato do Zernio e o formato enxuto que as telas usam.
// As telas só conhecem este formato.

const idDe = (v) => (v && typeof v === 'object' ? v._id : v) || null

export function contaDoZernio(a) {
  return {
    id: a._id,
    plataforma: a.platform,
    usuario: a.username || a.displayName || '',
    nome: a.displayName || a.username || '',
    foto: a.profilePicture || null,
    url: a.profileUrl || null,
    perfilId: idDe(a.profileId),
    precisaReconectar: Boolean(a.needsReconnection) || a.isActive === false,
    seguidores: typeof a.followersCount === 'number' ? a.followersCount : null,
    conectadaEm: a.connectedAt || a.createdAt || null,
  }
}

export function postDoZernio(p) {
  return {
    id: p._id,
    conteudo: p.content || '',
    status: p.status,
    agendadoPara: p.scheduledFor || null,
    fuso: p.timezone || null,
    criadoEm: p.createdAt || null,
    midias: (p.mediaItems || []).map(m => ({
      tipo: m.type || 'image',
      url: m.url || null,
      miniatura: m.thumbnail || (m.type === 'image' ? m.url : null) || null,
      nome: m.filename || null,
      tamanho: m.size || null,
      mime: m.mimeType || null,
    })),
    destinos: (p.platforms || []).map(d => ({
      plataforma: d.platform,
      contaId: idDe(d.accountId),
      usuario: (d.accountId && typeof d.accountId === 'object' && d.accountId.username) || null,
      status: d.status || null,
      url: d.platformPostUrl || null,
      publicadoEm: d.publishedAt || null,
      erro: d.errorMessage || null,
      dados: d.platformSpecificData || {},
      // Legenda própria desta rede (quando difere da legenda principal).
      conteudo: d.customContent || null,
    })),
    tiktok: p.tiktokSettings || null,
    // Vídeo do content-hub que deu origem ao post (ver cf/hub.js).
    hubVideoId: p.metadata?.hubVideoId || null,
  }
}

const METRICAS = ['impressions', 'reach', 'likes', 'comments', 'shares', 'saves', 'clicks', 'views']

export function metricaDoZernio(p) {
  const destino = (p.platforms || [])[0] || {}
  const a = p.analytics || {}
  const metricas = {}
  for (const k of METRICAS) metricas[k] = Number(a[k]) || 0
  metricas.engagementRate = Number(a.engagementRate) || 0
  return {
    id: p._id,
    conteudo: p.content || '',
    publicadoEm: p.publishedAt || p.scheduledFor || null,
    plataforma: p.platform || destino.platform || null,
    contaId: destino.accountId || null,
    usuario: destino.accountUsername || null,
    url: p.platformPostUrl || destino.platformPostUrl || null,
    externo: Boolean(p.isExternal),
    miniatura: p.thumbnailUrl || null,
    tipoMidia: p.mediaType || null,
    metricas,
  }
}

// ---------- Tela -> Zernio (criar e editar post) ----------

const DADOS_PERMITIDOS = {
  instagram: ['contentType', 'firstComment', 'shareToFeed'],
  youtube: ['title', 'visibility', 'madeForKids'],
}
const TIKTOK_PERMITIDO = ['privacyLevel', 'allowComment', 'allowDuet', 'allowStitch', 'contentPreviewConfirmed', 'expressConsentGiven', 'draft']

const escolher = (obj, chaves) => {
  const saida = {}
  for (const k of chaves) if (obj && obj[k] !== undefined && obj[k] !== '' && obj[k] !== null) saida[k] = obj[k]
  return saida
}

function erro400(mensagem) {
  const e = new Error(mensagem)
  e.status = 400
  return e
}

export function postParaZernio(entrada, { fuso }) {
  const modo = entrada?.modo
  if (!['agendar', 'agora', 'rascunho'].includes(modo)) throw erro400('Escolha entre agendar, publicar agora ou salvar rascunho.')

  const destinos = Array.isArray(entrada.destinos) ? entrada.destinos : []
  if (modo !== 'rascunho' && destinos.length === 0) throw erro400('Escolha pelo menos uma conta para publicar.')

  const corpo = {
    content: String(entrada.conteudo || ''),
    mediaItems: (Array.isArray(entrada.midias) ? entrada.midias : [])
      .filter(m => m && typeof m.url === 'string' && /^https:\/\//.test(m.url))
      .map(m => ({
        type: m.tipo === 'video' ? 'video' : 'image',
        url: m.url,
        ...(m.nome ? { filename: String(m.nome) } : {}),
        ...(Number(m.tamanho) > 0 ? { size: Number(m.tamanho) } : {}),
        ...(m.mime ? { mimeType: String(m.mime) } : {}),
      })),
    platforms: destinos.map(d => {
      const dados = escolher(d.dados, DADOS_PERMITIDOS[d.plataforma] || [])
      return {
        platform: String(d.plataforma),
        accountId: String(d.contaId),
        ...(String(d.conteudo || '').trim() ? { customContent: String(d.conteudo) } : {}),
        ...(Object.keys(dados).length ? { platformSpecificData: dados } : {}),
      }
    }),
    timezone: fuso,
    isDraft: modo === 'rascunho',
    ...(entrada.hubVideoId ? { metadata: { hubVideoId: String(entrada.hubVideoId) } } : {}),
  }

  if (destinos.some(d => d.plataforma === 'tiktok')) {
    const tiktok = escolher(entrada.tiktok, TIKTOK_PERMITIDO)
    if (Object.keys(tiktok).length) corpo.tiktokSettings = tiktok
  }

  if (modo === 'agora') corpo.publishNow = true
  if (modo === 'agendar' || (modo === 'rascunho' && entrada.agendadoPara)) {
    // Horário "de parede" (sem fuso): o Zernio interpreta no fuso do app.
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(entrada.agendadoPara || ''))) {
      throw erro400('Informe a data e a hora do agendamento.')
    }
    corpo.scheduledFor = `${entrada.agendadoPara}:00`
  }
  return corpo
}

// ---------- Caixa de entrada ----------

const falhasDoZernio = (meta) => (meta?.failedAccounts || []).map(f => ({
  plataforma: f.platform, usuario: f.accountUsername || null, erro: f.error || 'Falha ao consultar a conta.',
}))

export function postsComentadosDoZernio(r) {
  return {
    posts: (r.data || []).filter(p => !p.isAd).map(p => ({
      id: p.id, plataforma: p.platform, contaId: p.accountId, usuario: p.accountUsername || null,
      conteudo: p.content || '', imagem: p.picture || null, link: p.permalink || null,
      criadoEm: p.createdTime || null, comentarios: p.commentCount || 0, curtidas: p.likeCount || 0,
    })),
    falhas: falhasDoZernio(r.meta),
  }
}

export function comentarioDoZernio(c) {
  return {
    id: c.id,
    texto: c.message || '',
    criadoEm: c.createdTime || null,
    autor: { nome: c.from?.name || c.from?.username || 'Alguém', usuario: c.from?.username || null, foto: c.from?.picture || null, dono: Boolean(c.from?.isOwner) },
    curtidas: c.likeCount || 0,
    link: c.url || null,
    podeResponder: c.canReply !== false,
    respostas: (c.replies || []).map(comentarioDoZernio),
  }
}

export function conversasDoZernio(r) {
  return {
    conversas: (r.data || []).map(c => ({
      id: c.id, plataforma: c.platform, contaId: c.accountId, usuario: c.accountUsername || null,
      nome: c.participantName || 'Sem nome', foto: c.participantPicture || null,
      ultima: c.lastMessage || '', atualizadaEm: c.updatedTime || null, naoLidas: c.unreadCount || 0, link: c.url || null,
    })),
    falhas: falhasDoZernio(r.meta),
  }
}

export function mensagemDoZernio(m, i) {
  return {
    id: m.id || `${m.createdAt}-${i}`,
    texto: m.isDeleted ? '' : m.message || '',
    apagada: Boolean(m.isDeleted),
    enviada: m.direction === 'outgoing',
    criadaEm: m.createdAt || null,
    anexos: (m.attachments || []).map(a => ({ url: a.url || null, previa: a.previewUrl || null, tipo: a.mimeType || a.type || null, nome: a.filename || null })),
  }
}
