import tailwindcss from '@tailwindcss/vite'

/**
 * 云涧 · 全站配置
 * 纯 JavaScript（不使用 TypeScript），所有业务配置集中在 runtimeConfig 中，
 * 通过 .env 以 NUXT_ 前缀覆盖，方便后期调整而无需改动代码。
 */
export default defineNuxtConfig({
  compatibilityDate: '2026-11-07',
  devtools: { enabled: true },

  // 全局样式：Tailwind 4 + 中国风主题变量
  css: ['vant/lib/index.css', '~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
    // 显式预声明运行时依赖，避免 Vite 反复 re-optimize 导致开发服务器重启
    optimizeDeps: {
      include: ['vant', 'marked', '@vue/devtools-core']
    }
  },

  // 管理后台无需 SEO，采用 SPA 模式；前台保持 SSR
  routeRules: {
    '/admin/**': { ssr: false }
  },

  runtimeConfig: {
    // 数据库地址：供 Prisma 运行时兜底读取；部署时可用 NUXT_DATABASE_URL 覆盖
    databaseUrl: process.env.DATABASE_URL || '',
    // 支持 .env 中的 AUTH_SECRET / DEMO_MODE，也可用 NUXT_AUTH_SECRET / NUXT_DEMO_MODE 在运行时覆盖
    authSecret: process.env.NUXT_AUTH_SECRET || process.env.AUTH_SECRET || 'dev-only-secret-please-change',
    demoMode: process.env.DEMO_MODE !== 'false',
    qiniu: {
      accessKey: '',
      secretKey: '',
      bucket: '',
      cdnDomain: '',
      region: 'z0',
      uploadUrl: 'https://upload.qiniup.com'
    },
    public: {
      siteName: '云涧',
      // 站点正式域名（可选）：分享链接与二维码优先用它；留空则用当前请求域名
      siteUrl: '',
      qiniuCdnDomain: '',
      // 图片压缩与 CDN 实时转码（可用 NUXT_PUBLIC_IMAGE_* 覆盖）
      image: {
        compress: process.env.NUXT_PUBLIC_IMAGE_COMPRESS !== 'false', // 上传前是否在浏览器内压缩
        maxEdge: 1920, // 上传图长边上限（px）
        quality: 82, // 上传压缩质量 1-100
        minSize: 24576, // 小于该体积且尺寸合规的图片跳过压缩
        cdnQuality: 82, // CDN  imageView2 输出质量
        srcsetWidths: [320, 480, 640, 800, 1200, 1600]
      }
    }
  },

  app: {
    head: {
      title: '云涧 · 东方器物与生活美学',
      htmlAttrs: { lang: 'zh-CN' },
      meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'description', content: '云涧，甄选东方器物、茶瓷文房，记录有温度的生活美学。' },
      { name: 'theme-color', content: '#f7f3ea' }],

      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
  },

  nitro: {
    // Prisma / qiniu 属于 Node 生态，显式声明避免被打进客户端包
    externals: { traceInclude: [] }
  },

  // Nuxt 4 默认 srcDir = app/，server/ 与 public/ 位于项目根目录
  srcDir: 'app/',
  serverDir: 'server/'
});