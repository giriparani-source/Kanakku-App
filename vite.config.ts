import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, UserConfig} from 'vite';

export default defineConfig((): UserConfig => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          /**
           * Manual chunk splitting — groups heavy lazy-loaded views into named
           * chunks so each can be cached independently by the browser.
           * Chunks only load when the user navigates to that section.
           *
           * Vendor chunks are split first to prevent large SDKs from bloating
           * view-specific chunks.
           */
          manualChunks: (id: string) => {
            // ── Vendor: Firebase SDK ──────────────────────────────────────────
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
              return 'vendor-firebase';
            }
            // ── Vendor: Google Generative AI (Gemini) ─────────────────────────
            if (id.includes('node_modules/@google/genai') || id.includes('node_modules/@google/generative-ai')) {
              return 'vendor-gemini';
            }
            // ── Vendor: Export utilities (html2canvas, jsPDF, xlsx) ───────────
            if (
              id.includes('node_modules/html2canvas') ||
              id.includes('node_modules/jspdf') ||
              id.includes('node_modules/xlsx') ||
              id.includes('node_modules/exceljs')
            ) {
              return 'vendor-export';
            }
            // ── Vendor: DOMPurify ─────────────────────────────────────────────
            if (id.includes('node_modules/dompurify') || id.includes('node_modules/isomorphic-dompurify')) {
              return 'vendor-dompurify';
            }

            // ── App Views ─────────────────────────────────────────────────────
            // Dashboard view + its sub-components
            if (
              id.includes('components/views/DashboardView') ||
              id.includes('components/views/dashboard/') ||
              id.includes('components/views/SmartAlertsWidget')
            ) {
              return 'views-dashboard';
            }
            // Settings view (63 KB — largest view)
            if (id.includes('components/views/SettingsView')) {
              return 'views-settings';
            }
            // Onboarding view (55 KB)
            if (id.includes('components/views/OnboardingView')) {
              return 'views-onboarding';
            }
            // Insights + AI widgets
            if (
              id.includes('components/views/InsightsView') ||
              id.includes('components/views/AiBudgetCoach') ||
              id.includes('components/views/HealthScoreWidget')
            ) {
              return 'views-insights';
            }
            // Add Transaction Modal (48 KB)
            if (id.includes('components/views/AddTransactionModal')) {
              return 'views-add-transaction';
            }
            // Budget & Profile views
            if (id.includes('components/views/BudgetView')) {
              return 'views-budget';
            }
            if (id.includes('components/views/ProfileView')) {
              return 'views-profile';
            }
            // All remaining modals in one lightweight chunk
            if (id.includes('components/modals/')) {
              return 'modals';
            }
          },
        },
      },
    },
    server: {
      host: true,
      allowedHosts: true,
      cors: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
