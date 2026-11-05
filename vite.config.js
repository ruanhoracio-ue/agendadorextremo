import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { apiLocal } from './dev/apiLocal.js'

// https://vitejs.dev/config/
export default defineConfig({
  // apiLocal: serve /api/* com o mesmo app Hono do Worker, dentro do próprio
  // Vite. Assim `npm run dev` sobe tudo em um processo só.
  plugins: [react(), tailwindcss(), apiLocal()],
})
