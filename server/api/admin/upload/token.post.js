/** POST /api/admin/upload/token —— 申请七牛云一次性上传凭证 */
import { ok } from '../../../utils/response.js'
import { createUploadToken } from '../../../utils/qiniu.js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const token = createUploadToken({
    folder: String(body?.folder || 'common'),
    fileName: String(body?.fileName || '')
  })
  return ok(token)
})
