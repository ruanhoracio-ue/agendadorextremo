// Cliente da API do próprio app (/api/*). A chave do Zernio fica no servidor;
// daqui só saem pedidos para a mesma origem, com o cookie de sessão.

export class ErroApi extends Error {
  constructor(status, mensagem, code) {
    super(mensagem)
    this.status = status
    this.code = code
  }
}

async function chamar(metodo, caminho, corpo, headers) {
  let resposta
  try {
    resposta = await fetch(`/api${caminho}`, {
      method: metodo,
      credentials: 'same-origin',
      headers: { ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    })
  } catch {
    throw new ErroApi(0, 'Sem conexão com o servidor. Confira a internet e tente de novo.')
  }
  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    // Sessão expirada: o App escuta este evento e volta para o login.
    if (resposta.status === 401 && dados.code === 'sem_login') window.dispatchEvent(new Event('agendador:sem-login'))
    throw new ErroApi(resposta.status, dados.erro || `Erro ${resposta.status}.`, dados.code)
  }
  return dados
}

const consulta = (params) => {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params || {})) if (v !== undefined && v !== null && v !== '') q.set(k, v)
  const s = q.toString()
  return s ? `?${s}` : ''
}

export const api = {
  estado: () => chamar('GET', '/estado'),
  entrar: (senha) => chamar('POST', '/auth/entrar', { senha }),
  sair: () => chamar('POST', '/auth/sair'),

  salvarConfig: (mudancas) => chamar('PUT', '/config', mudancas),
  removerChave: () => chamar('DELETE', '/config/chave'),
  perfis: () => chamar('GET', '/perfis'),
  criarPerfil: (nome) => chamar('POST', '/perfis', { nome }),

  contas: () => chamar('GET', '/contas'),
  conectar: (plataforma, { reconectar, metodo } = {}) => chamar('GET', `/contas/conectar/${plataforma}${consulta({ reconectar, metodo })}`),
  desconectar: (id) => chamar('DELETE', `/contas/${encodeURIComponent(id)}`),

  posts: (de, ate) => chamar('GET', `/posts${consulta({ de, ate })}`),
  rascunhos: () => chamar('GET', '/posts?status=draft'),
  // A chave de idempotência faz um clique duplo ou uma nova tentativa depois
  // de timeout não virar dois posts.
  criarPost: (post, idempotencia) => chamar('POST', '/posts', post, { 'Idempotency-Key': idempotencia }),
  atualizarPost: (id, post) => chamar('PUT', `/posts/${encodeURIComponent(id)}`, post),
  excluirPost: (id) => chamar('DELETE', `/posts/${encodeURIComponent(id)}`),
  tentarDeNovo: (id) => chamar('POST', `/posts/${encodeURIComponent(id)}/tentar-de-novo`),

  avisos: () => chamar('GET', '/avisos'),

  removerChaveHub: () => chamar('DELETE', '/config/hub'),
  videosDoHub: (busca) => chamar('GET', `/hub/videos${consulta({ busca })}`),
  legendaDoHub: (id) => chamar('GET', `/hub/videos/${encodeURIComponent(id)}/legenda`),

  postsComentados: (conta) => chamar('GET', `/inbox/comentarios${consulta({ conta })}`),
  comentarios: (postId, conta) => chamar('GET', `/inbox/comentarios/${encodeURIComponent(postId)}${consulta({ conta })}`),
  responderComentario: (postId, resposta, idempotencia) => chamar('POST', `/inbox/comentarios/${encodeURIComponent(postId)}`, resposta, { 'Idempotency-Key': idempotencia }),
  conversas: (conta) => chamar('GET', `/inbox/conversas${consulta({ conta })}`),
  mensagens: (id, conta) => chamar('GET', `/inbox/conversas/${encodeURIComponent(id)}/mensagens${consulta({ conta })}`),
  enviarMensagem: (id, mensagem) => chamar('POST', `/inbox/conversas/${encodeURIComponent(id)}/mensagens`, mensagem),

  metricas: (filtros) => chamar('GET', `/metricas${consulta(filtros)}`),
  seguidores: (de, ate) => chamar('GET', `/seguidores${consulta({ de, ate })}`),
}

// Sobe um arquivo direto do navegador para o armazenamento do Zernio: o
// servidor só entrega o endereço assinado, o arquivo não passa por ele.
export async function enviarArquivo(arquivo, aoProgredir) {
  const { enviarPara, url } = await chamar('POST', '/midia/presign', {
    nome: arquivo.name,
    mime: arquivo.type,
    tamanho: arquivo.size,
  })
  await new Promise((resolver, rejeitar) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', enviarPara)
    xhr.setRequestHeader('Content-Type', arquivo.type)
    xhr.upload.onprogress = (e) => e.lengthComputable && aoProgredir?.(e.loaded / e.total)
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolver() : rejeitar(new ErroApi(xhr.status, 'O envio do arquivo falhou. Tente de novo.')))
    xhr.onerror = () => rejeitar(new ErroApi(0, 'O envio do arquivo foi interrompido. Confira a internet e tente de novo.'))
    xhr.send(arquivo)
  })
  return { tipo: arquivo.type.startsWith('video/') ? 'video' : 'image', url, nome: arquivo.name, tamanho: arquivo.size, mime: arquivo.type }
}
