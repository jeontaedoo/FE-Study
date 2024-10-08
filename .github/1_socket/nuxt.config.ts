// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2024-04-03',
    devtools: { enabled: true },
    serverMiddleware: [
        { path: '/api', handler: '~/express-server.js' } // express 파일 경로
    ],
})
