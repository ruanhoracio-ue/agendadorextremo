// Plugin do Vite para desenvolvimento: atende /api/* com o mesmo app Hono que
// roda no Worker (cf/app.js). No lugar dos bindings do Cloudflare entram:
//   - variáveis do arquivo .dev.vars (relido a cada pedido)
//   - um "KV" guardado em .dev-data/kv.json
import fs from 'node:fs'
import path from 'node:path'
import { getRequestListener } from '@hono/node-server'

function lerDevVars(raiz) {
  const arquivo = path.join(raiz, '.dev.vars')
  if (!fs.existsSync(arquivo)) return {}
  const vars = {}
  for (const linha of fs.readFileSync(arquivo, 'utf8').split('\n')) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m || !m[2]) continue
    vars[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return vars
}

function kvEmArquivo(raiz) {
  const arquivo = path.join(raiz, '.dev-data', 'kv.json')
  const ler = () => (fs.existsSync(arquivo) ? JSON.parse(fs.readFileSync(arquivo, 'utf8')) : {})
  const gravar = (dados) => {
    fs.mkdirSync(path.dirname(arquivo), { recursive: true })
    fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2))
  }
  return {
    async get(chave) { return ler()[chave] ?? null },
    async put(chave, valor) { gravar({ ...ler(), [chave]: valor }) },
    async delete(chave) { const d = ler(); delete d[chave]; gravar(d) },
  }
}

export function apiLocal() {
  return {
    name: 'agendador-api-local',
    apply: 'serve',
    configureServer(server) {
      const raiz = server.config.root
      const kv = kvEmArquivo(raiz)
      const atender = getRequestListener(async (request) => {
        // ssrLoadModule recarrega cf/app.js quando ele muda, sem reiniciar o Vite.
        const { default: app } = await server.ssrLoadModule('/cf/app.js')
        return app.fetch(request, { ...lerDevVars(raiz), AGENDADOR_KV: kv })
      })
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/')) return atender(req, res)
        next()
      })
    },
  }
}
