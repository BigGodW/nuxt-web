/** GET /api/admin/upload/config —— 七牛云配置状态（不返回密钥） */
import { ok } from '../../../utils/response.js'
import { qiniuConfig, qiniuReady } from '../../../utils/qiniu.js'

export default defineEventHandler(() => {
  const config = qiniuConfig()
  return ok({
    ready: qiniuReady(),
    bucket: config.bucket,
    cdnDomain: config.cdnDomain,
    uploadUrl: config.uploadUrl,
    region: config.region
  })
})
