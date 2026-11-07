import { marked } from 'marked'

marked.setOptions({ gfm: true, breaks: true })

/**
 * 轻量 HTML 白名单清洗
 * 正文由后台管理员录入（Markdown），渲染前移除脚本与内联事件，避免 XSS。
 */
function sanitize(html) {
  return String(html || '')
    .replace(/<\s*(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"')
}

/** Markdown -> 安全 HTML（文章正文、商品详情共用） */
export function renderMarkdown(source = '') {
  return sanitize(marked.parse(source || ''))
}

/** 提取纯文本摘要 */
export function plainText(source = '', max = 120) {
  const text = String(source || '')
    .replace(/[#*`>\[\]()!-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max)}…` : text
}
