<script setup>
import { Button, showToast } from 'vant'

definePageMeta({ layout: 'blank' })

const route = useRoute()
const router = useRouter()
const { login } = useAdminAuth()
const form = reactive({ username: 'admin', password: '' })
const loading = ref(false)

async function onSubmit() {
  if (!form.username || !form.password) return showToast('请输入账号和密码')
  loading.value = true
  try {
    await login({ username: form.username, password: form.password })
    showToast('欢迎回来')
    const redirect = String(route.query.redirect || '/admin')
    router.push(redirect.startsWith('/admin') ? redirect : '/admin')
  } catch (error) {
    showToast(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

useHead({ title: '管理后台登录' })
</script>

<template>
  <div class="grid min-h-screen md:grid-cols-2">
    <!-- 品牌区 -->
    <section class="cn-cloud-pattern relative hidden flex-col justify-between bg-ink p-12 text-paper md:flex lg:p-16">
      <div class="flex items-center gap-3">
        <span class="cn-seal h-11 w-11 text-base tracking-normal">云涧</span>
        <div>
          <p class="cn-title text-lg text-white">云涧</p>
          <p class="text-[10px] tracking-[0.22em] text-paper/60">YUN JIAN · ORIENTAL LIVING</p>
        </div>
      </div>
      <div>
        <p class="text-[11px] tracking-[0.45em] text-gold-light">ADMIN CONSOLE</p>
        <h1 class="cn-title mt-6 text-4xl leading-[1.6] text-white">一器一物<br />自有山河</h1>
        <p class="mt-6 max-w-sm text-sm leading-8 text-paper/65">在这里整理器物、写下文字，把东方生活的从容，一点点放进网站里。</p>
        <div class="cn-divider mt-10 !justify-start"><span>◆</span></div>
      </div>
      <p class="text-xs tracking-widest text-paper/40">愿日子清简，器物长伴。</p>
    </section>

    <!-- 表单区 -->
    <section class="flex items-center justify-center bg-paper px-6 py-16">
      <div class="w-full max-w-sm">
        <div class="mb-10 flex items-center gap-3 md:hidden">
          <span class="cn-seal h-10 w-10 text-sm tracking-normal">云涧</span>
          <span class="cn-title text-lg">云涧 · 管理</span>
        </div>
        <p class="text-[10px] tracking-[0.4em] text-gold">WELCOME BACK</p>
        <h2 class="cn-title mt-3 text-2xl">登录管理后台</h2>
        <p class="mt-2 text-xs text-ink-muted">请输入管理员账号以继续</p>

        <form class="mt-9 space-y-5" @submit.prevent="onSubmit">
          <div>
            <label class="admin-label">账号</label>
            <input v-model="form.username" class="admin-input" autocomplete="username" placeholder="管理员账号" />
          </div>
          <div>
            <label class="admin-label">密码</label>
            <input v-model="form.password" type="password" class="admin-input" autocomplete="current-password" placeholder="请输入密码" @keyup.enter="onSubmit" />
          </div>
          <Button block :loading="loading" class="!h-11 !border-cinnabar !bg-cinnabar !text-sm !tracking-[0.3em] !text-white" native-type="submit">登 录</Button>
        </form>

        <div class="mt-8 border border-line bg-paper-deep/40 p-4 text-xs leading-6 text-ink-muted">
          <p class="font-medium text-ink-soft">首次使用</p>
          <p class="mt-1">配置 PostgreSQL 并执行 <code>npm run db:migrate && npm run db:seed</code> 后，使用 <span class="text-cinnabar">admin / admin123</span> 登录；未配置数据库时演示模式下同账号可直接体验。</p>
        </div>
        <NuxtLink to="/" class="mt-8 inline-block text-xs tracking-widest text-ink-muted hover:text-cinnabar">← 返回站点前台</NuxtLink>
      </div>
    </section>
  </div>
</template>
