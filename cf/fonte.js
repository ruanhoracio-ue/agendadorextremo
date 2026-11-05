// Fonte de dados: cada método é uma (ou poucas) chamadas ao Zernio,
// devolvendo o formato das telas.
import { zernio } from './zernio.js'
import {
  contaDoZernio, postDoZernio, metricaDoZernio, postParaZernio,
  postsComentadosDoZernio, comentarioDoZernio, conversasDoZernio, mensagemDoZernio,
} from './formato.js'

const MAX_PAGINAS_METRICAS = 3

export function fonteZernio(chave, { perfilId, fuso }) {
  const z = (caminho, opcoes) => zernio(chave, caminho, opcoes)

  async function perfis() {
    const r = await z('/profiles')
    return (r.profiles || []).map(p => ({ id: p._id, nome: p.name, padrao: Boolean(p.isDefault), contas: p.accountCount ?? null }))
  }

  // Perfil usado para conectar contas: o escolhido em Configurações, senão o
  // padrão do Zernio; conta nova sem nenhum perfil ganha um "Principal".
  async function perfilAtivo() {
    if (perfilId) return perfilId
    const lista = await perfis()
    const escolhido = lista.find(p => p.padrao) || lista[0]
    if (escolhido) return escolhido.id
    const criado = await z('/profiles', { method: 'POST', body: { name: 'Principal', timezone: fuso } })
    return criado.profile._id
  }

  return {
    perfis,

    async contas() {
      const r = await z('/accounts', { query: { profileId: perfilId } })
      return { contas: (r.accounts || []).map(contaDoZernio), temMetricas: r.hasAnalyticsAccess !== false }
    },

    async criarPerfil(nome) {
      const r = await z('/profiles', { method: 'POST', body: { name: nome, timezone: fuso } })
      return { id: r.profile._id, nome: r.profile.name, padrao: Boolean(r.profile.isDefault), contas: 0 }
    },

    async urlConexao({ rota, extra }, { voltarPara, reconectarContaId, viaFacebook, loja }) {
      const r = await z(rota, {
        query: {
          profileId: await perfilAtivo(), redirect_url: voltarPara, reconnectAccountId: reconectarContaId,
          loginMethod: viaFacebook ? 'facebook_login' : undefined, shop: loja, ...extra,
        },
      })
      return { url: r.authUrl || r.url || null }
    },

    // Telegram não tem tela de login: o Zernio gera um código para mandar ao bot.
    async codigoTelegram() {
      const r = await z('/connect/telegram', { query: { profileId: await perfilAtivo() } })
      return { codigo: r.code, bot: r.botUsername, validoPorMinutos: Math.round((r.expiresIn || 900) / 60) }
    },

    // Melhores horários para postar, pelo engajamento dos posts já publicados.
    // O Zernio devolve dia da semana e hora em UTC; aqui viram dia e hora no
    // fuso do app (dia: 0 = domingo ... 6 = sábado).
    async melhoresHorarios() {
      const r = await z('/analytics/best-time', { query: { profileId: perfilId } })
      const noFuso = new Intl.DateTimeFormat('en-US', { timeZone: fuso, weekday: 'short', hour: 'numeric', hourCycle: 'h23' })
      const DIAS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return (r.slots || [])
        .filter(s => s.post_count > 0 && s.avg_engagement > 0)
        .sort((a, b) => b.avg_engagement - a.avg_engagement)
        .slice(0, 5)
        .map(s => {
          // 1º de janeiro de 2024 foi uma segunda-feira (dia 0 para o Zernio).
          const partes = Object.fromEntries(noFuso.formatToParts(new Date(Date.UTC(2024, 0, 1 + s.day_of_week, s.hour))).map(p => [p.type, p.value]))
          return { dia: DIAS.indexOf(partes.weekday), hora: Number(partes.hour), engajamento: Math.round(s.avg_engagement), posts: s.post_count }
        })
    },

    async desconectar(contaId) {
      await z(`/accounts/${encodeURIComponent(contaId)}`, { method: 'DELETE' })
    },

    async posts({ de, ate, status }) {
      const r = await z('/posts', {
        query: { fromDate: de, toDate: ate, status, profileId: perfilId, limit: 500, sortBy: 'scheduled-asc' },
      })
      return (r.posts || []).map(postDoZernio)
    },

    async criarPost(entrada, { idempotencia }) {
      const r = await z('/posts', { method: 'POST', body: postParaZernio(entrada, { fuso }), idempotencyKey: idempotencia })
      return { post: postDoZernio(r.post || {}), avisos: (r.warnings || []).map(a => (typeof a === 'string' ? a : a?.message)).filter(Boolean) }
    },

    async atualizarPost(id, entrada) {
      const r = await z(`/posts/${encodeURIComponent(id)}`, { method: 'PUT', body: postParaZernio(entrada, { fuso }) })
      return { post: postDoZernio(r.post || {}), avisos: [] }
    },

    async excluirPost(id) {
      await z(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' })
    },

    async tentarDeNovo(id) {
      const r = await z(`/posts/${encodeURIComponent(id)}/retry`, { method: 'POST' })
      return { post: postDoZernio(r.post || r || {}) }
    },

    async presign({ nome, mime, tamanho }) {
      const r = await z('/media/presign', { method: 'POST', body: { filename: nome, contentType: mime, size: tamanho } })
      return { enviarPara: r.uploadUrl, url: r.publicUrl }
    },

    async metricas({ de, ate, contaId, origem }) {
      const posts = []
      let pagina = 1
      let paginas = 1
      do {
        const r = await z('/analytics', {
          query: {
            fromDate: de, toDate: ate, accountId: contaId, profileId: perfilId,
            source: origem === 'app' ? 'late' : origem === 'externo' ? 'external' : 'all',
            limit: 100, page: pagina, sortBy: 'date', order: 'desc',
          },
        })
        posts.push(...(r.posts || []).map(metricaDoZernio))
        paginas = r.pagination?.pages || 1
        pagina++
      } while (pagina <= paginas && pagina <= MAX_PAGINAS_METRICAS)
      return { posts, cortado: paginas > MAX_PAGINAS_METRICAS }
    },

    // O que pede atenção: posts que falharam (ou saíram só em parte) nos
    // últimos 30 dias e contas que a rede derrubou.
    async avisos() {
      const desde = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
      const falhos = (status) => z('/posts', { query: { status, fromDate: desde, profileId: perfilId, limit: 50, sortBy: 'scheduled-desc' } })
      const [falhou, parcial, contas] = await Promise.all([
        falhos('failed'), falhos('partial'), z('/accounts', { query: { profileId: perfilId } }),
      ])
      return {
        posts: [...(falhou.posts || []), ...(parcial.posts || [])].map(postDoZernio),
        contas: (contas.accounts || []).map(contaDoZernio).filter(c => c.precisaReconectar),
      }
    },

    // ---------- Caixa de entrada ----------

    async postsComentados({ contaId }) {
      return postsComentadosDoZernio(await z('/inbox/comments', { query: { profileId: perfilId, accountId: contaId, limit: 50, sortBy: 'date', sortOrder: 'desc' } }))
    },

    async comentarios(postId, { contaId }) {
      const r = await z(`/inbox/comments/${encodeURIComponent(postId)}`, { query: { accountId: contaId, limit: 50 } })
      return { comentarios: (r.comments || []).map(comentarioDoZernio) }
    },

    async responderComentario(postId, { contaId, texto, comentarioId, idempotencia }) {
      await z(`/inbox/comments/${encodeURIComponent(postId)}`, {
        method: 'POST', body: { accountId: contaId, message: texto, commentId: comentarioId || undefined }, idempotencyKey: idempotencia,
      })
    },

    async conversas({ contaId }) {
      return conversasDoZernio(await z('/inbox/conversations', { query: { profileId: perfilId, accountId: contaId, limit: 50 } }))
    },

    async mensagens(conversaId, { contaId }) {
      const r = await z(`/inbox/conversations/${encodeURIComponent(conversaId)}/messages`, { query: { accountId: contaId, limit: 100 } })
      const mensagens = (r.messages || []).map(mensagemDoZernio)
      // A tela mostra da mais antiga para a mais nova, venha como vier.
      mensagens.sort((x, y) => String(x.criadaEm).localeCompare(String(y.criadaEm)))
      return { mensagens }
    },

    async enviarMensagem(conversaId, { contaId, texto }) {
      await z(`/inbox/conversations/${encodeURIComponent(conversaId)}/messages`, { method: 'POST', body: { accountId: contaId, message: texto } })
    },

    async seguidores({ de, ate }) {
      const r = await z('/accounts/follower-stats', { query: { fromDate: de, toDate: ate, profileId: perfilId, granularity: 'daily' } })
      return (r.accounts || []).map(a => ({
        contaId: a._id,
        plataforma: a.platform,
        usuario: a.username || a.displayName || '',
        atual: a.currentFollowers ?? a.followersCount ?? null,
        crescimento: a.growth ?? null,
        crescimentoPct: a.growthPercentage ?? null,
        serie: ((r.stats || {})[a._id] || []).map(p => ({ data: p.date, seguidores: p.followers })),
      }))
    },
  }
}
