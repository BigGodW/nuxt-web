/**
 * 七牛云前端直传
 * ------------------------------------------------------------
 * 1. 上传前在浏览器内压缩图片（等比缩放 + WebP 编码），从源头减少上传流量与存储
 * 2. 向服务端申请一次性上传凭证（密钥永不下发到浏览器）
 * 3. 通过 XHR 直传七牛，支持进度回调
 * 4. 返回可直接入库的 CDN 原图地址；前台渲染时再按屏幕尺寸实时转码
 *
 * 压缩参数集中在 nuxt.config.js 的 runtimeConfig.public.image，
 * 可用 NUXT_PUBLIC_IMAGE_* 环境变量覆盖，无需改代码。
 */
import { compressImage, DEFAULT_COMPRESS } from '../utils/image-compress.js'

export function useQiniuUpload() {
  const uploading = ref(false)
  const compressing = ref(false)
  const progress = ref(0)
  const lastCompression = ref(null)
  const { post } = useApi()
  const imageSettings = useRuntimeConfig().public?.image || {}

  /**
   * @param {File} file 原始文件
   * @param {string} folder 七牛存储目录
   * @param {{compress?: boolean, quality?: number, maxEdge?: number}|boolean} options
   *        传 false 可跳过压缩上传原图；也可覆盖单次质量/尺寸
   * @returns {Promise<string>} 图片 CDN 地址（保持与旧调用兼容）
   */
  async function upload(file, folder = 'common', options = {}) {
    const opts = typeof options === 'boolean' ? { compress: options } : (options || {})
    uploading.value = true
    progress.value = 0
    lastCompression.value = null

    try {
      let target = file

      if (file?.type?.startsWith('image/')) {
        compressing.value = true
        try {
          const settings = {
            enabled: opts.compress !== false && imageSettings.compress !== false && imageSettings.compress !== 'false',
            maxEdge: Number(opts.maxEdge || imageSettings.maxEdge) || DEFAULT_COMPRESS.maxEdge,
            quality: Number(opts.quality || imageSettings.quality) || DEFAULT_COMPRESS.quality,
            minSize: Number(imageSettings.minSize) || DEFAULT_COMPRESS.minSize
          }
          const result = await compressImage(file, settings)
          lastCompression.value = result
          target = result.file
        } finally {
          compressing.value = false
        }
      }

      const token = await post('/api/admin/upload/token', {
        folder,
        fileName: target?.name || file?.name || '',
        mimeType: target?.type || file?.type || ''
      })

      const form = new FormData()
      form.append('token', token.token)
      form.append('key', token.key)
      form.append('file', target, target?.name || 'image')

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', token.uploadUrl)
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) progress.value = Math.round((event.loaded / event.total) * 100)
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const body = JSON.parse(xhr.responseText || '{}')
              if (body.error) reject(new Error(body.error))
              else resolve(body)
            } catch {
              resolve({})
            }
          } else {
            reject(new Error(`上传失败（${xhr.status}）`))
          }
        }
        xhr.onerror = () => reject(new Error('网络异常，上传失败'))
        xhr.send(form)
      })

      progress.value = 100
      return token.url
    } finally {
      uploading.value = false
    }
  }

  return { upload, uploading, compressing, progress, lastCompression }
}
