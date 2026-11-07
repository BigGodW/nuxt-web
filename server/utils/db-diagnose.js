/**
 * 数据库故障自诊断（纯函数，不加载任何原生模块）
 *
 * 用途：Serverless / 边缘运行时无法登录机器查日志，线上一次
 * GET /api/health/db 即可定位「数据库不可用」的具体原因。
 * 所有输出均脱敏：不返回连接串、密码、完整堆栈。
 */

/** 连接串里的 user:password@ 统一打码，避免任何错误信息泄露凭据 */
export function redact(text = '') {
  return String(text)
    .replace(/([a-z][a-z0-9+.-]*:\/\/)[^@/\s]+@/gi, '$1***:***@')
    .replace(/\b(password|passwd|pwd)\s*[=:]\s*[^\s,;"']+/gi, '$1=***')
    .slice(0, 400)
}

function maskHost(hostname) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    const parts = hostname.split('.')
    return `${parts[0]}.***.***.${parts[3]}`
  }
  if (hostname.length <= 8) return '***'
  return `${hostname.slice(0, 3)}***${hostname.slice(-4)}`
}

/** 解析连接串，只返回结构信息，绝不返回完整 URL */
export function describeUrl(url) {
  if (!url) return { present: false, valid: false }
  const trimmed = String(url).trim()
  const result = {
    present: true,
    valid: false,
    length: trimmed.length,
    quoted: /^["']|["']$/.test(trimmed),
    hasWhitespace: /\s/.test(trimmed)
  }
  try {
    const parsed = new URL(trimmed)
    result.valid = true
    result.protocol = parsed.protocol.replace(':', '')
    result.host = maskHost(parsed.hostname)
    result.port = parsed.port || '5432'
    result.database = parsed.pathname.replace(/^\//, '') || '(未指定)'
    result.schema = parsed.searchParams.get('schema') || 'public'
    result.hasUsername = Boolean(parsed.username)
    result.hasPassword = Boolean(parsed.password)
    result.sslmode = parsed.searchParams.get('sslmode') || '未设置'
    result.connectTimeout = parsed.searchParams.get('connect_timeout') || '默认'
  } catch {
    result.hint = '连接串无法被 URL 解析，常见原因是引号被当成值的一部分、含空格或密码含未编码的特殊字符'
  }
  return result
}

/**
 * 按优先级解析数据库地址，并记录来源。
 * 覆盖三类运行时的差异：
 *   - 本机 / 传统服务器：process.env.DATABASE_URL
 *   - Nuxt runtimeConfig：NUXT_DATABASE_URL（运行时可覆盖）
 *   - 构建时内联：nuxt.config.js 里由 DATABASE_URL 求值的 databaseUrl
 */
export function resolveDatabaseUrl() {
  const fromEnv = process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL
  if (fromEnv) {
    return {
      url: String(fromEnv).trim(),
      source: process.env.DATABASE_URL ? 'process.env.DATABASE_URL' : 'process.env.NUXT_DATABASE_URL'
    }
  }
  try {
    const config = useRuntimeConfig()
    const inline = config.databaseUrl || config.nuxt?.databaseUrl
    if (inline) return { url: String(inline).trim(), source: 'runtimeConfig.databaseUrl（构建时内联）' }
  } catch {
    // 非 Nuxt 上下文（例如独立脚本）忽略
  }
  return { url: '', source: '未找到' }
}

/** 构造成 withDemo() 能识别的「数据库不可用」错误 */
export function databaseUnavailable() {
  const error = new Error('DATABASE_URL is not configured')
  error.name = 'PrismaClientInitializationError'
  error.code = 'DIAG_MISSING_ENV'
  return error
}

const RULES = [
  {
    code: 'missing-env',
    title: '未检测到 DATABASE_URL',
    pattern: /DATABASE_URL is not configured|environment variable not found|DIAG_MISSING_ENV/i,
    advice: '在 EdgeOne 控制台「项目设置 → 环境变量」添加 DATABASE_URL，确认作用域同时覆盖「构建时」和「运行时」，然后重新部署。可同时添加 NUXT_DATABASE_URL 作为双保险。'
  },
  {
    code: 'bad-url',
    title: '连接串格式不合法',
    pattern: /invalid.*(url|connection string|database)|the URL must start|Error parsing|provided database string|invalid port|Invalid value/i,
    advice: '检查值是否意外带了引号或空格；密码中的 @ : / # ? 等字符需要 URL 编码（percent-encode）。'
  },
  {
    code: 'engine',
    title: 'Prisma 查询引擎加载失败',
    pattern: /Cannot find module|ERR_MODULE_NOT_FOUND|query_engine|libquery_engine|Query engine|engine.*(not found|cannot|failed)|Prisma Client could not|ENOENT|ELF|GLIBC|openssl/i,
    advice: '云函数运行时的 Node/系统库与构建环境不一致。确认 .nvmrc 与 EdgeOne 构建 Node 版本一致，且构建日志中执行了 prisma generate。'
  },
  {
    code: 'migration',
    title: '数据库已连上，但表结构缺失',
    pattern: /relation .*does not exist|table .*does not exist|no such table|column .*does not exist|P2021|P2010|P2022|does not exist in the current database/i,
    advice: '在能连通该数据库的机器上执行：npm run db:deploy && npm run db:seed。'
  },
  {
    code: 'auth',
    title: '账号或密码被拒绝',
    pattern: /authentication failed|password authentication|invalid password|permission denied|P1000|role .* does not exist/i,
    advice: '核对用户名/密码，并确认 pg_hba.conf 允许云函数来源 IP 以密码方式连接。'
  },
  {
    code: 'db-missing',
    title: '目标数据库不存在',
    pattern: /database .* does not exist|P1003/i,
    advice: '确认连接串末尾的数据库名，并先在 PostgreSQL 中创建该库。'
  },
  {
    code: 'network',
    title: '无法建立到数据库的网络连接',
    pattern: /can't reach database|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ETIME|timed out|timeout|connection (refused|reset|closed)|getaddrinfo|network is unreachable|P1001|P1002|P1017|server closed/i,
    advice: '云函数出站 TCP 5432 被阻断或数据库防火墙未放行。需放行 EdgeOne 云函数地域的出口 IP，或改用支持 HTTP 连接池的数据库代理。'
  }
]

/** 把底层错误归类为可执行的中文结论 */
export function classifyDbError(error) {
  const name = String(error?.name || '')
  const code = String(error?.code || '')
  const message = String(error?.message || '')
  const text = `${name} ${code} ${message}`
  const hit = RULES.find((rule) => rule.pattern.test(text))
  return hit
    ? { code: hit.code, title: hit.title, advice: hit.advice }
    : {
        code: 'unknown',
        title: '未归类的数据库错误',
        advice: '查看 /api/health/db 返回的 error 字段，或在 EdgeOne 控制台查看云函数日志。'
      }
}

/** 用于 503 的简短可读提示（不含敏感信息，详情见 /api/health/db） */
export function describeDbError(error) {
  const info = classifyDbError(error)
  return `数据库暂不可用 · ${info.title}（${info.code}）`
}
