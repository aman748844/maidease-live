import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            // Silently absorb benign socket resets / backend restart disconnects on SSE stream
            if (['ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'ETIMEDOUT'].includes(err?.code)) {
              if (res && !res.headersSent && typeof res.writeHead === 'function') {
                try {
                  res.writeHead(502, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Server restarting or reconnecting' }));
                } catch (_) {}
              }
              return;
            }
            console.warn('[Vite Proxy]', err.message);
          });
        }
      }
    }
  }
});
