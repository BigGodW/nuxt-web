/**
 * GET /api/health/db —— 线上数据库自诊断
 *
 * Serverless 环境无法登录机器看日志，这个端点一次请求即可区分：
 * 变量未注入 / 连接串格式错 / 网络不通 / 认证失败 / 表未迁移 / 引擎加载失败。
 *
 * 输出全部脱敏：不返回连接串、密码、完整堆栈。
 * 若设置了 NUXT_HEALTH_TOKEN，则需带 ?token=xxx 才能访问。
 */
import { prisma } from '../../utils/prisma.js'
import {
  resolveDatabaseUrl, describeUrl, classifyDbError, redact
} from '../../utils/db-diagnose.js'

const PROBE_TIMEOUT = 15000
const REQUIRED_TABLES = ['_prisma_migrations', 'articles', 'products', 'site_settings', 'admin_users']

function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`database probe timed out after ${ms}ms`)
      error.code = 'DIAG_TIMEOUT'
      reject(error)
    }, ms)
    if (timer.unref) timer.unref()
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

function result(report) {
  return {
    code: report.ok ? 0 : 503,
    message: report.diagnosis?.title || '诊断完成',
    data: report
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const requiredToken = config.healthToken || ''
  if (requiredToken && String(getQuery(event).token || '') !== requiredToken) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const { url, source } = resolveDatabaseUrl()
  const report = {
    ok: false,
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    config: {
      DATABASE_URL: process.env.DATABASE_URL ? 'present' : 'missing',
      NUXT_DATABASE_URL: process.env.NUXT_DATABASE_URL ? 'present' : 'missing',
      DEMO_MODE: process.env.DEMO_MODE ?? '(unset)',
      NUXT_DEMO_MODE: process.env.NUXT_DEMO_MODE ?? '(unset)',
      demoModeEffective: config.demoMode,
      databaseUrlInRuntimeConfig: config.databaseUrl ? 'present' : 'missing',
      resolvedFrom: source
    },
    url: describeUrl(url),
    steps: {},
    error: null,
    diagnosis: null
  }

  if (!url) {
    report.diagnosis = classifyDbError(new Error('DATABASE_URL is not configured'))
    return result(report)
  }
  if (!report.url.valid) {
    report.diagnosis = classifyDbError(new Error('Invalid database connection string'))
    return result(report)
  }

  try {
    await withTimeout(prisma.$queryRawUnsafe('SELECT 1'), PROBE_TIMEOUT)
    report.steps.connect = 'ok'

    const rows = await withTimeout(
      prisma.$queryRawUnsafe(
        "SELECT table_name FROM information_schema.tables " +
          "WHERE table_schema = 'public' AND table_name IN " +
          `(${REQUIRED_TABLES.map((name) => `'${name}'`).join(', ')})`
      ),
      PROBE_TIMEOUT
    )
    const found = rows.map((row) => String(row.table_name))
    report.steps.tables = Object.fromEntries(
      REQUIRED_TABLES.map((name) => [name, found.includes(name)])
    )
    report.steps.migrated = found.includes('_prisma_migrations')
    report.steps.schemaComplete = REQUIRED_TABLES.every((name) => found.includes(name))

    report.diagnosis = report.steps.schemaComplete
      ? {
          code: 'ok',
          title: '数据库连接正常，表结构完整',
          advice: '数据库侧无异常。若前台仍报错，请检查其他接口或查看云函数日志。'
        }
      : classifyDbError(new Error('relation "_prisma_migrations" does not exist'))
    report.ok = report.steps.schemaComplete
  } catch (error) {
    report.steps.connect = 'failed'
    report.error = {
      name: String(error?.name || ''),
      code: String(error?.code || ''),
      message: redact(error?.message || '')
    }
    report.diagnosis = classifyDbError(error)
  }

  return result(report)
})
