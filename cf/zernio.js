// Cliente da API do Zernio (https://docs.zernio.com). Só o servidor fala com
// o Zernio: a chave nunca vai para o navegador.
const BASE = 'https://zernio.com/api/v1'
const TEMPO_LIMITE_MS = 30000

export class ErroZernio extends Error {
  constructor(status, mensagem, { code, detalhes } = {}) {
    super(mensagem)
    this.status = status
    this.code = code
    this.detalhes = detalhes
  }
}

// Mensagens em português para os erros que a pessoa consegue resolver sozinha.
function mensagemAmigavel(status, corpo) {
  const original = corpo?.error || corpo?.message || ''
  if (status === 401) return 'O Zernio recusou a chave da API. Confira a chave em Configurações.'
  if (status === 402) return original || 'O Zernio pediu um meio de pagamento ou um plano com esse recurso.'
  if (status === 429) return 'Muitas chamadas ao Zernio em pouco tempo. Espere um minuto e tente de novo.'
  if (status >= 500) return 'O Zernio está fora do ar ou demorou para responder. Tente de novo em instantes.'
  return original || `O Zernio respondeu com erro ${status}.`
}

export async function zernio(chave, caminho, { method = 'GET', query, body, idempotencyKey } = {}) {
  const url = new URL(BASE + caminho)
  for (const [k, v] of Object.entries(query || {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  }

  const headers = { Authorization: `Bearer ${chave}`, Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey

  let resposta
  try {
    resposta = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    })
  } catch {
    throw new ErroZernio(504, 'Não consegui falar com o Zernio (sem resposta). Tente de novo em instantes.')
  }

  const texto = await resposta.text()
  let corpo = null
  try {
    corpo = texto ? JSON.parse(texto) : null
  } catch {
    corpo = null
  }

  if (!resposta.ok) {
    throw new ErroZernio(resposta.status, mensagemAmigavel(resposta.status, corpo), {
      code: corpo?.code,
      detalhes: corpo?.details,
    })
  }
  return corpo ?? {}
}
