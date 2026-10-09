import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Mounts api/senso.js in `npm run dev` / `npm run preview` so local behaves like Vercel.
function sensoApi(env) {
  const mount = (server) => { server.middlewares.use('/api/senso', async (req, res) => {
    Object.assign(process.env, env);
    const { default: handler } = await import(/* @vite-ignore */ pathToFileURL(resolve(process.cwd(), 'api/senso.js')).href + '?t=' + Date.now());
    return handler(req, res);
  }); };
  return { name: 'senso-api', configureServer: mount, configurePreviewServer: mount };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // reads .env.local (never committed)
  return {
    plugins: [react(), tailwindcss(), sensoApi(env)],
    resolve: { alias: { '@': resolve(__dirname, 'src') } },
    build: { rollupOptions: { input: { main: resolve(__dirname, 'index.html'), app: resolve(__dirname, 'app.html') } } },
  };
});
