// Fonte de dados para quando ainda não há chave do Zernio: mesma interface de
// cf/fonte.js, com tudo vazio. Serve para as telas abrirem e poderem ser
// vistas antes da chave. Nada é inventado; o que grava ou publica é recusado.
function semChave() {
  const e = new Error('Falta cadastrar a chave da API do Zernio em Configurações.')
  e.status = 409
  e.code = 'sem_chave'
  return e
}

const recusar = async () => { throw semChave() }

export function fonteVazia() {
  return {
    perfis: async () => [],
    criarPerfil: recusar,
    contas: async () => ({ contas: [], temMetricas: true }),
    urlConexao: recusar,
    codigoTelegram: recusar,
    melhoresHorarios: async () => [],
    desconectar: recusar,
    posts: async () => [],
    criarPost: recusar,
    atualizarPost: recusar,
    excluirPost: recusar,
    tentarDeNovo: recusar,
    presign: recusar,
    metricas: async () => ({ posts: [], cortado: false }),
    seguidores: async () => [],
    avisos: async () => ({ posts: [], contas: [] }),
    postsComentados: async () => ({ posts: [], falhas: [] }),
    comentarios: async () => ({ comentarios: [] }),
    responderComentario: recusar,
    conversas: async () => ({ conversas: [], falhas: [] }),
    mensagens: async () => ({ mensagens: [] }),
    enviarMensagem: recusar,
  }
}
