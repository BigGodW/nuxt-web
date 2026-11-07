<script setup>
const { settings } = useSiteSettings()
useHead({ title: '关于云涧' })

const timeline = [
  { year: '始', title: '从一只杯子开始', desc: '因为想找一只合手、安静、用得住的茶杯，我们开始走访产地与窑口。' },
  { year: '行', title: '走进手作现场', desc: '龙泉、德化、泾县、武夷……记录匠人如何把时间反复投进同一件事。' },
  { year: '今', title: '把器物带回日常', desc: '不做陈列柜里的收藏，只留能陪人过日子的东西。' }
]
</script>

<template>
  <div>
    <section class="cn-page-head cn-cloud-pattern border-b border-line text-center">
      <div class="cn-container">
        <p class="text-[9px] tracking-[0.35em] text-gold sm:text-[10px] sm:tracking-[0.45em]">ABOUT YUN JIAN</p>
        <h1 class="cn-title mt-3 text-[26px] sm:mt-5 sm:text-3xl md:text-5xl">{{ settings.homeQuote || '器以载道，物以养心' }}</h1>
        <p class="mx-auto mt-4 max-w-2xl text-[13px] leading-7 text-ink-soft sm:mt-6 sm:text-sm sm:leading-8">{{ settings.aboutStory || '云涧始于对日常器物的注视。' }}</p>
      </div>
    </section>

    <section class="cn-section cn-container">
      <div class="grid gap-7 sm:gap-10 md:grid-cols-2 md:items-center md:gap-12">
        <div class="cn-frame">
          <SiteMediaImage src="/images/demo/4.svg" alt="山河入礼" ratio="4 / 3" />
        </div>
        <div>
          <SiteSectionHeading en="WHY WE DO THIS" title="美，应该被使用" subtitle="我们希望器物不是被供起来，而是被拿起来、用起来，慢慢长出属于主人的痕迹。" />
          <div class="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
            <div v-for="item in timeline" :key="item.year" class="flex gap-3 border-l border-line pl-4 sm:gap-5 sm:pl-6">
              <span class="cn-seal h-8 w-8 shrink-0 text-xs tracking-normal sm:h-9 sm:w-9 sm:text-sm">{{ item.year }}</span>
              <div class="min-w-0">
                <h3 class="cn-title text-[15px] sm:text-base">{{ item.title }}</h3>
                <p class="mt-1 text-[13px] leading-6 text-ink-muted sm:mt-1.5 sm:text-sm sm:leading-7">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="cn-section bg-ink text-paper">
      <div class="cn-container grid gap-6 sm:gap-10 md:grid-cols-3">
        <div class="md:col-span-1">
          <p class="text-[9px] tracking-[0.35em] text-gold-light sm:text-[10px] sm:tracking-[0.4em]">GET IN TOUCH</p>
          <h2 class="cn-title mt-3 text-xl text-white sm:mt-4 sm:text-2xl">相见亦是有缘</h2>
          <p class="mt-3 text-[13px] leading-6 text-paper/70 sm:mt-4 sm:text-sm sm:leading-7">关于器物、合作或探访，都欢迎来信。</p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 sm:gap-6 md:col-span-2">
          <div class="border border-paper/20 p-4 sm:p-6">
            <p class="text-[11px] tracking-widest text-gold-light sm:text-xs">电话</p>
            <p class="mt-2 break-all font-serif-cn text-lg text-white sm:mt-3 sm:text-xl">{{ settings.contactPhone || '400-800-2026' }}</p>
          </div>
          <div class="border border-paper/20 p-4 sm:p-6">
            <p class="text-[11px] tracking-widest text-gold-light sm:text-xs">邮箱</p>
            <p class="mt-2 break-all font-serif-cn text-lg text-white sm:mt-3 sm:text-xl">{{ settings.contactEmail || 'hello@yunjian.cn' }}</p>
          </div>
          <div class="border border-paper/20 p-4 sm:col-span-2 sm:p-6">
            <p class="text-[11px] tracking-widest text-gold-light sm:text-xs">地址</p>
            <p class="mt-2 font-serif-cn text-lg text-white sm:mt-3 sm:text-xl">{{ settings.address || '中国 · 杭州' }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="cn-section cn-container text-center">
      <SiteSectionHeading en="START EXPLORING" title="从一件器物开始" center />
      <div class="mt-6 flex flex-wrap justify-center gap-3 sm:mt-8 sm:gap-4">
        <NuxtLink to="/products" class="cn-btn-primary">寻访器物 →</NuxtLink>
        <NuxtLink to="/articles" class="cn-btn-ghost">读器物志 →</NuxtLink>
      </div>
    </section>
  </div>
</template>
