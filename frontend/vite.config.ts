import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Ganti seluruh struktur menjadi seperti ini
export default defineConfig(({ mode }) => {
  // Muat variabel env berdasarkan mode saat ini (development/production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // Optimasi bundle size
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor libraries
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            'utils-vendor': ['clsx', 'class-variance-authority', 'tailwind-merge'],
            'socket-vendor': ['socket.io-client'],
          },
        },
      },
      // Minifikasi yang lebih agresif
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      // Chunk size warning
      chunkSizeWarningLimit: 1000,
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          // GUNAKAN 'env' YANG SUDAH DILOAD, BUKAN 'process.env'
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});