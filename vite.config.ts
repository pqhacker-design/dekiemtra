import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('katex')) return 'vendor-katex';
              if (id.includes('xlsx')) return 'vendor-xlsx';
              if (id.includes('html2canvas') || id.includes('jspdf')) return 'vendor-pdf';
              if (id.includes('apexcharts') || id.includes('recharts') || id.includes('react-apexcharts')) return 'vendor-charts';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('firebase')) return 'vendor-firebase';
            }
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
