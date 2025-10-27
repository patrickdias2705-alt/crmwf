import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/chatwoot-proxy': {
        target: 'https://chatwoot-chatwoot.l0vghu.easypanel.host',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/chatwoot-proxy/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Log para debug
            console.log('Proxying to:', proxyReq.path);
          });
        },
      },
      '/functions/v1': {
        target: 'https://xqeqaagnnkilihlfjbrm.supabase.co',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying Supabase function:', proxyReq.path);
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
