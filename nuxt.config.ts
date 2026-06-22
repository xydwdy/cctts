// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
  ],

  nitro: {
    preset: 'vercel',
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  app: {
    head: {
      title: 'CCTTS - Legado × MiMo TTS',
      meta: [
        { name: 'description', content: '为 Legado 阅读 App 接入小米 MiMo TTS 语音合成引擎' },
      ],
    },
  },
})