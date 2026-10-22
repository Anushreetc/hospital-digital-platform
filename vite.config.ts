import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Two separate apps are built from this package:
//   npm run dev / build          -> public website + patient portal (index.html)
//   npm run dev:staff / build:staff -> staff app (staff.html), deployed on its own
//                                     domain, e.g. staff.wecarehospital.in
// The public bundle contains no staff or admin code at all.

// In staff mode, serve staff.html for every page request so client-side
// routes like /welcome work in development.
const staffHtmlFallback = (): Plugin => ({
  name: 'staff-html-fallback',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const accept = req.headers.accept ?? '';
      if (req.method === 'GET' && accept.includes('text/html') && !req.url?.startsWith('/@')) {
        req.url = '/staff.html';
      }
      next();
    });
  },
});

export default defineConfig(({ mode }) => {
  const isStaff = mode === 'staff';
  return {
    plugins: [react(), ...(isStaff ? [staffHtmlFallback()] : [])],
    server: {
      allowedHosts: ["terminal.local"],
      port: isStaff ? 5174 : 5173,
      proxy: {
        // Legacy Express backend (voice/telephony only).
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: isStaff ? 'dist-staff' : 'dist',
      rollupOptions: {
        input: isStaff ? 'staff.html' : 'index.html'
      }
    }
  };
});
