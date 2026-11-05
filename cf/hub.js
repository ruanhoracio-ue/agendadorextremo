// Ponte com o content-hub (API de integração dos Vídeos Curtos, documentada em
// content-hub/docs/integracao-videos-curtos.md). O agendador lê os vídeos
// aprovados e devolve o status "agendado" / "publicado" com a data e o link.
//
// A chave de integração vem do secret CONTENT_HUB_KEY ou, colada na tela
// Configurações, do KV. Como a do Zernio, nunca volta para o navegador.
import { lerConfig } from './config.js'

const URL_PADRAO = 'https://conteudoextremo.conversaoextrema.com'

export const urlDoHub = (env) => (env.CONTENT_HUB_URL || URL_PADRAO).replace(/\/+$/, '')

export async function chaveDoHub(env) {
  if (env.CONTENT_HUB_KEY) return { chave: env.CONTENT_HUB_KEY, origem: 'secret' }
  const { hubKey } = await lerConfig(env)
  return hubKey ? { chave: hubKey, origem: 'salva' } : { chave: null, origem: null }
}

function erroHub(status, mensagem) {
  const e = new Error(mensagem)
  e.status = status
  e.code = 'content_hub'
  return e
}

const video = (v) => ({
  id: v.id, titulo: v.titulo || 'Sem título', categoria: v.categoria || null, status: v.status,
  dataAgendada: v.dataAgendada || null, linkVideo: v.linkFinalizado || null, temLegenda: Boolean(v.linkLegenda),
})

export function hub(env, chave) {
  const base = `${urlDoHub(env)}/api/integracao`

  async function chamar(caminho, { method = 'GET', body } = {}) {
    let r
    try {
      r = await fetch(base + caminho, {
        method,
        headers: { Authorization: `Bearer ${chave}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(20000),
      })
    } catch {
      throw erroHub(504, 'O content-hub não respondeu. Tente de novo em instantes.')
    }
    const dados = await r.json().catch(() => ({}))
    if (r.status === 401) throw erroHub(400, 'O content-hub recusou a chave de integração. Confira em Configurações.')
    if (!r.ok) throw erroHub(r.status >= 500 ? 502 : r.status, dados.error || `O content-hub respondeu com erro ${r.status}.`)
    return dados
  }

  return {
    async videos({ status = 'aprovado', busca } = {}) {
      // O content-hub filtra o status depois de cortar a lista, então pede o máximo.
      const q = new URLSearchParams({ status, limite: '200' })
      if (busca) q.set('busca', busca)
      const r = await chamar(`/videos-curtos?${q}`)
      return (r.videos || []).map(video)
    },

    // Texto do .txt de legendas anexado ao vídeo. O link vem do próprio
    // content-hub e só é seguido se apontar para ele mesmo.
    async legenda(id) {
      const r = await chamar(`/videos-curtos/${encodeURIComponent(id)}`)
      const link = r.video?.linkLegenda
      if (!link) return ''
      if (new URL(link).origin !== new URL(base).origin) throw erroHub(502, 'O link da legenda aponta para fora do content-hub.')
      const arquivo = await fetch(link, { signal: AbortSignal.timeout(20000) })
      return arquivo.ok ? (await arquivo.text()).slice(0, 20000) : ''
    },

    marcar: (id, mudanca) => chamar(`/videos-curtos/${encodeURIComponent(id)}/status`, { method: 'POST', body: mudanca }),
  }
}
