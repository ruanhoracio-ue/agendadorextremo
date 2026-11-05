// Sessão por cookie assinado (HMAC-SHA256), sem banco: o cookie carrega a
// validade e a assinatura feita com a senha do app. Trocar a senha derruba
// todas as sessões antigas.
const COOKIE = 'ag_sessao'
const DIAS = 30
const enc = new TextEncoder()

async function hmac(segredo, mensagem) {
  const chave = await crypto.subtle.importKey('raw', enc.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const assinatura = await crypto.subtle.sign('HMAC', chave, enc.encode(mensagem))
  return [...new Uint8Array(assinatura)].map(b => b.toString(16).padStart(2, '0')).join('')
}

// Comparação em tempo constante para não vazar a senha pelo tempo de resposta.
function iguais(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function senhaConfere(senha, tentativa) {
  if (typeof tentativa !== 'string' || !tentativa) return false
  return iguais(await hmac('comparar', senha), await hmac('comparar', tentativa))
}

export async function criarSessao(senha) {
  const expira = Date.now() + DIAS * 24 * 60 * 60 * 1000
  return `${expira}.${await hmac(senha, `sessao:${expira}`)}`
}

export async function sessaoValida(senha, token) {
  const [expira, assinatura] = String(token || '').split('.')
  if (!expira || !assinatura || Number(expira) < Date.now()) return false
  return iguais(assinatura, await hmac(senha, `sessao:${expira}`))
}

export function lerCookieSessao(request) {
  const cookies = request.headers.get('cookie') || ''
  const par = cookies.split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`))
  return par ? par.slice(COOKIE.length + 1) : null
}

export function cookieSessao(token, { https }) {
  const base = `${COOKIE}=${token || ''}; Path=/; HttpOnly; SameSite=Lax${https ? '; Secure' : ''}`
  return token ? `${base}; Max-Age=${DIAS * 24 * 60 * 60}` : `${base}; Max-Age=0`
}
