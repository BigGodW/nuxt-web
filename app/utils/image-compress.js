/**
 * 浏览器端图片压缩（零依赖，纯 Canvas）
 * ------------------------------------------------------------
 * 目标：在直传七牛之前，把手机拍摄的大图压到合理尺寸与体积，
 *      同时保留原始比例与 EXIF 方向，避免服务端再承担转码成本。
 *
 * 设计原则：
 * 1. 矢量图（SVG）与动图（GIF/APNG）跳过，避免破坏动画或矢量优势
 * 2. 已是小图且尺寸合规的文件跳过，防止二次编码劣化画质
 * 3. 优先输出 WebP（保留透明通道），不支持时降级 JPEG（透明处填白）
 * 4. 压缩结果反而更大或几乎无收益时，回退使用原文件（负优化保护）
 */
export const DEFAULT_COMPRESS = {
  enabled: true,
  maxEdge: 1920,       // 长边上限，覆盖 2x Retina 大屏展示
  quality: 82,         // 1-100，82 为画质/体积的实用平衡点
  minSize: 24 * 1024   // 小于 24KB 且尺寸合规的文件不再处理
}

const SKIP_TYPES = ['image/gif', 'image/svg+xml', 'image/apng', 'image/x-icon', 'image/vnd.microsoft.icon']

/** 体积友好展示：1.2 MB / 340 KB */
export function formatBytes(bytes = 0) {
  const size = Number(bytes) || 0
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

/** 压缩结果的一句话摘要，供后台上传反馈复用 */
export function compressionSummary(result) {
  if (!result) return ''
  if (result.skipped) return result.reason || '按原图上传'
  return `${formatBytes(result.originalSize)} → ${formatBytes(result.size)} · 省 ${result.savedRatio}% · ${result.width}×${result.height} ${result.format.toUpperCase()}`
}

/** 把文件名换成目标格式后缀（服务端凭此生成正确的 key 扩展名） */
export function renameWithExt(name, ext) {
  const base = String(name || 'image').replace(/\.[a-z0-9]+$/i, '').slice(0, 80) || 'image'
  return `${base}.${ext}`
}

function supportsWebp() {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    return false
  }
}

/** 优先用 createImageBitmap（自动按 EXIF 校正方向），否则降级 Image 元素 */
async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close?.()
      }
    } catch {
      // 部分浏览器不支持 imageOrientation 选项，走下面的降级路径
    }
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('图片解码失败'))
      el.src = objectUrl
    })
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(objectUrl)
    }
  } catch (error) {
    URL.revokeObjectURL(objectUrl)
    throw error
  }
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('图片编码失败'))),
      type,
      quality
    )
  })
}

/**
 * @param {File|Blob} input 原始文件
 * @param {object} options 覆盖 DEFAULT_COMPRESS
 * @returns {Promise<{file, originalSize, size, width, height, format, skipped, reason, savedRatio}>}
 */
export async function compressImage(input, options = {}) {
  const opt = { ...DEFAULT_COMPRESS, ...options }
  const originalSize = input?.size || 0
  const result = {
    file: input,
    originalSize,
    size: originalSize,
    width: 0,
    height: 0,
    format: '',
    skipped: true,
    reason: '',
    savedRatio: 0
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    result.reason = '非浏览器环境'
    return result
  }
  if (!opt.enabled) {
    result.reason = '已选择上传原图'
    return result
  }
  const type = String(input?.type || '').toLowerCase()
  const name = String(input?.name || '')
  if (type && !type.startsWith('image/')) {
    result.reason = '非图片文件'
    return result
  }
  if (SKIP_TYPES.includes(type) || /\.(svg|gif|apng)$/i.test(name)) {
    result.reason = '矢量图 / 动图保持原样'
    return result
  }

  let decoded
  let canvas = null
  try {
    decoded = await decode(input)
  } catch (error) {
    // 解码失败不影响主流程，直接上传原图由调用方决定
    result.reason = error.message || '解码失败，使用原图'
    return result
  }

  try {
    result.width = decoded.width
    result.height = decoded.height
    const longest = Math.max(decoded.width, decoded.height)
    if (originalSize < opt.minSize && longest <= opt.maxEdge) {
      result.reason = '文件已足够小'
      return result
    }

    const scale = Math.min(1, opt.maxEdge / longest)
    const width = Math.max(1, Math.round(decoded.width * scale))
    const height = Math.max(1, Math.round(decoded.height * scale))
    canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      result.reason = 'Canvas 不可用，使用原图'
      return result
    }

    const webp = supportsWebp()
    const targetType = webp ? 'image/webp' : 'image/jpeg'
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    // JPEG 不支持透明，先铺一层宣纸白，避免 PNG 透明区域变黑
    if (!webp) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
    }
    ctx.drawImage(decoded.source, 0, 0, width, height)

    const blob = await toBlob(canvas, targetType, Number(opt.quality) / 100)
    if (!blob.size || (originalSize && blob.size >= originalSize * 0.95)) {
      result.reason = '压缩无明显收益，保留原图'
      return result
    }

    const ext = webp ? 'webp' : 'jpg'
    result.file = new File([blob], renameWithExt(input?.name, ext), {
      type: targetType,
      lastModified: Date.now()
    })
    result.size = blob.size
    result.width = width
    result.height = height
    result.format = ext
    result.skipped = false
    result.savedRatio = originalSize ? Math.round((1 - blob.size / originalSize) * 100) : 0
    result.reason = `压缩 ${result.savedRatio}%`
    return result
  } catch (error) {
    result.reason = error.message || '压缩失败，使用原图'
    return result
  } finally {
    decoded.release?.()
    // 批量上传大图时主动释放 Canvas 显存
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
    }
  }
}
