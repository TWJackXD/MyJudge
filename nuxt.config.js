// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: false },

  runtimeConfig: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    JUDGE0_API_URL: process.env.JUDGE0_API_URL,
    JUDGE0_API_KEY: process.env.JUDGE0_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET
  },

  app: {
    head: {
      title: 'MyJudge - 專為教學開發之 Judge 平臺',
      meta: [
        { name: 'description', content: '為教學開發之程式 Judge 平臺' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100..900&family=Ubuntu+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap' },
      ]
    }
  },

  css: [
    '@/assets/css/main.css',
    '@fortawesome/fontawesome-svg-core/styles.css'
  ],

  vite: {
    plugins: [
      tailwindcss(),
    ],
    optimizeDeps: {
      include: [
        '@tiptap/extension-table',
        '@tiptap/extension-table-row',
        '@tiptap/extension-table-cell',
        '@tiptap/extension-table-header',
        'pdfjs-dist'
      ]
    }
  },

  monacoEditor: {
    locale: 'zh-hant',
    componentName: {
      codeEditor: 'MonacoEditor',
      diffEditor: 'MonacoDiffEditor'
    }
  },

  modules: ['nuxt-monaco-editor'],

  nitro: {
    routeRules: {
      '/api/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Credentials': 'true'
        }
      }
    }
  },

  build: {
    transpile: [
      '@tiptap/extension-table',
      '@tiptap/extension-table-row',
      '@tiptap/extension-table-cell',
      '@tiptap/extension-table-header'
    ]
  }
})