// API do Agendador Extremo (Hono, roda no Cloudflare Worker e no dev local).
//
//   /api/estado          o que a tela precisa para começar (login, chave, fuso)
//   /api/auth/*          entrar e sair
//   /api/config          chave do Zernio, perfil e fuso
//   /api/contas          contas conectadas, conectar e desconectar
//   /api/posts           listar, criar, editar, excluir, tentar de novo
//   /api/midia/presign   endereço para o navegador subir o arquivo direto
//   /api/metricas        números dos posts
//   /api/seguidores      histórico de seguidores por conta
//   /api/avisos          posts que falharam e contas que caíram
//   /api/hub/*           vídeos aprovados do content-hub
//   /api/inbox/*         comentários e mensagens
import { Hono } from 'hono'
import { ErroZernio, zernio } from './zernio.js'
import { criarSessao, sessaoValida, senhaConfere, lerCookieSessao, cookieSessao } from './sessao.js'
import { lerConfig, salvarConfig, chaveZernio, fusoValido, FUSO_PADRAO } from './config.js'
import { fonteZernio } from './fonte.js'
import { fonteVazia } from './vazia.js'
import { hub, chaveDoHub } from './hub.js'

const app = new Hono().basePath('/api')

const PLATAFORMAS_CONEXAO = ['instagram', 'youtube', 'tiktok', 'facebook', 'linkedin', 'twitter', 'threads', 'pinterest', 'googlebusiness']
const TIPOS_DE_ARQUIVO = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/avi', 'video/x-msvideo', 'video/webm', 'video/x-m4v',
]
const DATA = /^\d{4}-\d{2}-\d{2}$/

function erro(status, mensagem, code) {
  const e = new Error(mensagem)
  e.status = status
  e.code = code
  return e
}

const ehLocal = (c) => ['localhost', '127.0.0.1', '[::1]'].includes(new URL(c.req.url).hostname)

// Sem APP_PASSWORD o app só abre no localhost (desenvolvimento). Publicado
// sem senha ele se recusa a funcionar: quem entra pode postar nas redes.
async function acesso(c) {
  const senha = c.env.APP_PASSWORD
  if (!senha) return ehLocal(c) ? 'livre' : 'bloqueado'
  return (await sessaoValida(senha, lerCookieSessao(c.req.raw))) ? 'logado' : 'sem-login'
}

app.onError((e, c) => {
  if (e instanceof ErroZernio) {
    // 401 do Zernio é chave errada, não sessão expirada: não pode chegar à
    // tela como 401, senão ela mandaria a pessoa para o login.
    const status = e.status === 401 ? 502 : e.status >= 500 ? 502 : e.status
    return c.json({ erro: e.message, code: e.status === 401 ? 'chave_invalida' : e.code || 'zernio' }, status)
  }
  if (e.status) return c.json({ erro: e.message, code: e.code }, e.status)
  console.error(e)
  return c.json({ erro: 'Erro inesperado no servidor.' }, 500)
})

// Pedidos que mudam algo só valem vindos da própria origem do app.
app.use('*', async (c, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    const origem = c.req.header('origin')
    if (origem && origem !== new URL(c.req.url).origin) throw erro(403, 'Origem não permitida.')
  }
  await next()
})

app.get('/health', (c) => c.json({ status: 'ok' }))

app.get('/estado', async (c) => {
  const situacao = await acesso(c)
  if (situacao === 'bloqueado' || situacao === 'sem-login') return c.json({ acesso: situacao })
  const config = await lerConfig(c.env)
  const { chave, origem } = await chaveZernio(c.env)
  return c.json({
    acesso: situacao,
    chave: { configurada: Boolean(chave), origem, final: chave ? chave.slice(-4) : null },
    hub: await estadoDoHub(c.env),
    fuso: config.fuso || FUSO_PADRAO,
    perfilId: config.perfilId || null,
    podeSalvar: Boolean(c.env.AGENDADOR_KV),
  })
})

async function estadoDoHub(env) {
  const { chave, origem } = await chaveDoHub(env)
  return { configurada: Boolean(chave), origem, final: chave ? chave.slice(-4) : null }
}

app.post('/auth/entrar', async (c) => {
  const senha = c.env.APP_PASSWORD
  if (!senha) throw erro(400, 'Este ambiente não usa senha.')
  const { senha: tentativa } = await c.req.json().catch(() => ({}))
  if (!(await senhaConfere(senha, tentativa))) throw erro(401, 'Senha incorreta.')
  c.header('Set-Cookie', cookieSessao(await criarSessao(senha), { https: new URL(c.req.url).protocol === 'https:' }))
  return c.json({ ok: true })
})

app.post('/auth/sair', (c) => {
  c.header('Set-Cookie', cookieSessao(null, { https: new URL(c.req.url).protocol === 'https:' }))
  return c.json({ ok: true })
})

// Daqui para baixo, só com acesso liberado.
app.use('*', async (c, next) => {
  const situacao = await acesso(c)
  if (situacao === 'bloqueado') throw erro(503, 'Falta configurar a senha do app (APP_PASSWORD).', 'sem_senha')
  if (situacao === 'sem-login') throw erro(401, 'Faça login para continuar.', 'sem_login')
  await next()
})

// ---------- Configuração ----------

app.put('/config', async (c) => {
  const corpo = await c.req.json().catch(() => ({}))
  const mudancas = {}

  if (corpo.apiKey !== undefined) {
    const chave = String(corpo.apiKey || '').trim()
    if (!chave) throw erro(400, 'Cole a chave da API do Zernio.')
    // Testa a chave antes de guardar: chave errada não chega a ser salva.
    try {
      await zernio(chave, '/profiles')
    } catch (e) {
      throw erro(400, e.status === 401 ? 'O Zernio recusou essa chave. Confira se copiou inteira.' : e.message, 'chave_invalida')
    }
    mudancas.apiKey = chave
  }
  if (corpo.hubKey !== undefined) {
    const chave = String(corpo.hubKey || '').trim()
    if (!chave) throw erro(400, 'Cole a chave de integração do content-hub.')
    // Mesma regra da chave do Zernio: só guarda depois de conferir que funciona.
    await hub(c.env, chave).videos()
    mudancas.hubKey = chave
  }
  if (corpo.fuso !== undefined) {
    if (!fusoValido(corpo.fuso)) throw erro(400, 'Fuso horário desconhecido.')
    mudancas.fuso = corpo.fuso
  }
  if (corpo.perfilId !== undefined) mudancas.perfilId = corpo.perfilId ? String(corpo.perfilId) : null

  await salvarConfig(c.env, mudancas)
  return c.json({ ok: true })
})

app.delete('/config/chave', async (c) => {
  await salvarConfig(c.env, { apiKey: null })
  return c.json({ ok: true })
})

app.delete('/config/hub', async (c) => {
  await salvarConfig(c.env, { hubKey: null })
  return c.json({ ok: true })
})

// Fonte de dados do pedido: o Zernio, com a chave e o perfil configurados.
// Sem chave, as leituras voltam vazias (as telas abrem) e as gravações são
// recusadas com o aviso de que falta a chave.
async function fonte(c) {
  const { chave } = await chaveZernio(c.env)
  if (!chave) return fonteVazia()
  const config = await lerConfig(c.env)
  return fonteZernio(chave, { perfilId: config.perfilId || undefined, fuso: config.fuso || FUSO_PADRAO })
}

const dataOuNada = (v) => (v && DATA.test(v) ? v : undefined)

// ---------- Content-hub ----------

// Devolve a ponte com o content-hub, ou null quando não há chave cadastrada.
async function hubDoPedido(c) {
  const { chave } = await chaveDoHub(c.env)
  return chave ? hub(c.env, chave) : null
}

async function hubObrigatorio(c) {
  const h = await hubDoPedido(c)
  if (!h) throw erro(409, 'Falta cadastrar a chave de integração do content-hub em Configurações.', 'sem_hub')
  return h
}

app.get('/hub/videos', async (c) => c.json({ videos: await (await hubObrigatorio(c)).videos({ busca: c.req.query('busca') || undefined }) }))

app.get('/hub/videos/:id/legenda', async (c) => c.json({ legenda: await (await hubObrigatorio(c)).legenda(c.req.param('id')) }))

const linkDoPost = (post) => post.destinos.find(d => d.url)?.url

// Depois de criar ou editar um post que veio do content-hub, devolve o status
// para lá. Falha aqui não desfaz o post: vira um aviso na tela.
async function avisarHub(c, post, entrada) {
  if (!entrada?.hubVideoId || entrada.modo === 'rascunho') return null
  const h = await hubDoPedido(c)
  if (!h) return null
  try {
    if (post.status === 'published') await h.marcar(entrada.hubVideoId, { status: 'publicado', linkPost: linkDoPost(post) })
    else await h.marcar(entrada.hubVideoId, { status: 'agendado', dataAgendada: post.agendadoPara || new Date().toISOString() })
    return null
  } catch (e) {
    return `O post foi salvo, mas o content-hub não foi atualizado: ${e.message}`
  }
}

// Posts do content-hub que já foram ao ar: marca "publicado" lá, com o link,
// uma única vez por post (o KV lembra quais já foram avisados).
async function sincronizarHub(c, posts) {
  const kv = c.env.AGENDADOR_KV
  if (!kv) return
  const pendentes = posts.filter(p => p.hubVideoId && p.status === 'published')
  if (!pendentes.length) return
  const h = await hubDoPedido(c)
  if (!h) return
  for (const post of pendentes) {
    const marca = `hub:publicado:${post.id}`
    if (await kv.get(marca)) continue
    try {
      await h.marcar(post.hubVideoId, { status: 'publicado', linkPost: linkDoPost(post) })
      await kv.put(marca, new Date().toISOString())
    } catch (e) {
      console.error('content-hub:', e.message)
    }
  }
}

app.get('/perfis', async (c) => c.json({ perfis: await (await fonte(c)).perfis() }))

app.post('/perfis', async (c) => {
  const { nome } = await c.req.json().catch(() => ({}))
  if (!String(nome || '').trim()) throw erro(400, 'Dê um nome ao perfil.')
  return c.json({ perfil: await (await fonte(c)).criarPerfil(String(nome).trim()) }, 201)
})

// ---------- Contas ----------

app.get('/contas', async (c) => c.json(await (await fonte(c)).contas()))

app.get('/contas/conectar/:plataforma', async (c) => {
  const plataforma = c.req.param('plataforma')
  if (!PLATAFORMAS_CONEXAO.includes(plataforma)) throw erro(400, 'Rede não suportada.')
  const voltarPara = `${new URL(c.req.url).origin}/contas?conectada=${plataforma}`
  const f = await fonte(c)
  return c.json(await f.urlConexao(plataforma, {
    voltarPara,
    reconectarContaId: c.req.query('reconectar') || undefined,
    // Instagram tem dois caminhos de login: direto ou pela Página do Facebook.
    viaFacebook: plataforma === 'instagram' && c.req.query('metodo') === 'facebook',
  }))
})

app.delete('/contas/:id', async (c) => {
  await (await fonte(c)).desconectar(c.req.param('id'))
  return c.json({ ok: true })
})

// ---------- Posts ----------

app.get('/posts', async (c) => {
  const f = await fonte(c)
  const posts = await f.posts({
    de: dataOuNada(c.req.query('de')),
    ate: dataOuNada(c.req.query('ate')),
    status: c.req.query('status') === 'draft' ? 'draft' : undefined,
  })
  // Não segura a resposta: o aviso ao content-hub segue depois dela.
  const tarefa = sincronizarHub(c, posts).catch(() => {})
  try { c.executionCtx.waitUntil(tarefa) } catch { /* fora do Worker (dev) não há executionCtx */ }
  return c.json({ posts })
})

app.post('/posts', async (c) => {
  const f = await fonte(c)
  const entrada = await c.req.json().catch(() => null)
  const r = await f.criarPost(entrada, { idempotencia: c.req.header('idempotency-key') })
  const aviso = await avisarHub(c, r.post, entrada)
  return c.json({ ...r, avisos: [...r.avisos, ...(aviso ? [aviso] : [])] }, 201)
})

app.put('/posts/:id', async (c) => {
  const f = await fonte(c)
  const entrada = await c.req.json().catch(() => null)
  const r = await f.atualizarPost(c.req.param('id'), entrada)
  const aviso = await avisarHub(c, r.post, entrada)
  return c.json({ ...r, avisos: [...r.avisos, ...(aviso ? [aviso] : [])] })
})

app.delete('/posts/:id', async (c) => {
  await (await fonte(c)).excluirPost(c.req.param('id'))
  return c.json({ ok: true })
})

app.post('/posts/:id/tentar-de-novo', async (c) => c.json(await (await fonte(c)).tentarDeNovo(c.req.param('id'))))

// ---------- Mídia ----------

app.post('/midia/presign', async (c) => {
  const { nome, mime, tamanho } = await c.req.json().catch(() => ({}))
  if (!nome || !TIPOS_DE_ARQUIVO.includes(mime)) throw erro(400, 'Tipo de arquivo não aceito. Use imagem (JPG, PNG, WebP, GIF) ou vídeo (MP4, MOV, WebM).')
  return c.json(await (await fonte(c)).presign({ nome: String(nome), mime, tamanho: Number(tamanho) || undefined }))
})

// ---------- Métricas ----------

app.get('/metricas', async (c) => {
  const f = await fonte(c)
  return c.json(await f.metricas({
    de: dataOuNada(c.req.query('de')),
    ate: dataOuNada(c.req.query('ate')),
    contaId: c.req.query('conta') || undefined,
    origem: c.req.query('origem') || 'todos',
  }))
})

app.get('/seguidores', async (c) => {
  const f = await fonte(c)
  return c.json({ contas: await f.seguidores({ de: dataOuNada(c.req.query('de')), ate: dataOuNada(c.req.query('ate')) }) })
})

// ---------- Avisos ----------

app.get('/avisos', async (c) => c.json(await (await fonte(c)).avisos()))

// ---------- Caixa de entrada ----------

const textoObrigatorio = (v) => {
  const texto = String(v || '').trim()
  if (!texto) throw erro(400, 'Escreva a mensagem antes de enviar.')
  return texto
}

app.get('/inbox/comentarios', async (c) => c.json(await (await fonte(c)).postsComentados({ contaId: c.req.query('conta') || undefined })))

app.get('/inbox/comentarios/:postId', async (c) => {
  if (!c.req.query('conta')) throw erro(400, 'Informe a conta.')
  return c.json(await (await fonte(c)).comentarios(c.req.param('postId'), { contaId: c.req.query('conta') }))
})

app.post('/inbox/comentarios/:postId', async (c) => {
  const { contaId, texto, comentarioId } = await c.req.json().catch(() => ({}))
  if (!contaId) throw erro(400, 'Informe a conta.')
  await (await fonte(c)).responderComentario(c.req.param('postId'), {
    contaId: String(contaId), texto: textoObrigatorio(texto), comentarioId: comentarioId ? String(comentarioId) : undefined,
    idempotencia: c.req.header('idempotency-key'),
  })
  return c.json({ ok: true }, 201)
})

app.get('/inbox/conversas', async (c) => c.json(await (await fonte(c)).conversas({ contaId: c.req.query('conta') || undefined })))

app.get('/inbox/conversas/:id/mensagens', async (c) => {
  if (!c.req.query('conta')) throw erro(400, 'Informe a conta.')
  return c.json(await (await fonte(c)).mensagens(c.req.param('id'), { contaId: c.req.query('conta') }))
})

app.post('/inbox/conversas/:id/mensagens', async (c) => {
  const { contaId, texto } = await c.req.json().catch(() => ({}))
  if (!contaId) throw erro(400, 'Informe a conta.')
  await (await fonte(c)).enviarMensagem(c.req.param('id'), { contaId: String(contaId), texto: textoObrigatorio(texto) })
  return c.json({ ok: true }, 201)
})

export default app
