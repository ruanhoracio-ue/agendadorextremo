// Configuração do app: chave do Zernio, perfil e fuso horário.
//
// A chave pode vir de dois lugares, nesta ordem:
//   1. secret ZERNIO_API_KEY (recomendado em produção)
//   2. colada na tela Configurações, guardada no KV (AGENDADOR_KV)
// O navegador nunca recebe a chave de volta, só os 4 últimos caracteres.
const CHAVE_KV = 'config'
export const FUSO_PADRAO = 'America/Sao_Paulo'

export async function lerConfig(env) {
  if (!env.AGENDADOR_KV) return {}
  try {
    return JSON.parse((await env.AGENDADOR_KV.get(CHAVE_KV)) || '{}')
  } catch {
    return {}
  }
}

export async function salvarConfig(env, mudancas) {
  if (!env.AGENDADOR_KV) {
    const erro = new Error('Este ambiente não tem onde guardar configurações (falta o KV AGENDADOR_KV). Cadastre a chave como secret ZERNIO_API_KEY.')
    erro.status = 501
    throw erro
  }
  const atual = await lerConfig(env)
  const nova = { ...atual, ...mudancas }
  for (const k of Object.keys(nova)) if (nova[k] === null || nova[k] === '') delete nova[k]
  await env.AGENDADOR_KV.put(CHAVE_KV, JSON.stringify(nova))
  return nova
}

export async function chaveZernio(env) {
  if (env.ZERNIO_API_KEY) return { chave: env.ZERNIO_API_KEY, origem: 'secret' }
  const { apiKey } = await lerConfig(env)
  return apiKey ? { chave: apiKey, origem: 'salva' } : { chave: null, origem: null }
}

export function fusoValido(fuso) {
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: fuso })
    return true
  } catch {
    return false
  }
}
