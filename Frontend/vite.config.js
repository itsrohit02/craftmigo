import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { resolveApiBaseUrl } from './src/config/apiUrl.js'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  resolveApiBaseUrl(env.VITE_API_URL || (command === 'serve' && 'http://localhost:5000/api'), {
    isProduction: command === 'build' && mode === 'production',
  })

  return {
    plugins: [react()],
  }
})
