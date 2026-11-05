// Entrada do Cloudflare Worker (Workers + Static Assets), igual ao content-hub:
//   - /api/*  -> app Hono (cf/app.js)
//   - o resto -> build do Vite em ./dist, com fallback de SPA
import app from './cf/app.js'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      return app.fetch(request, env, ctx)
    }

    return env.ASSETS.fetch(request)
  },
}
