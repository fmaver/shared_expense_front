import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createRequire } from 'module';

// La versión del perfil sale de package.json y se congela en el build: sin esto habría que
// mantenerla a mano en dos lugares y se desincronizan el día que alguien se olvida.
const { version } = createRequire(import.meta.url)('./package.json');

export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  optimizeDeps: { exclude: ['lucide-react'] },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
