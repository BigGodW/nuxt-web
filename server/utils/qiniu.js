import qiniu from 'qiniu'
import { randomUUID } from 'node:crypto'

/** 七牛云配置（密钥只在服务端出现） */
export function qiniuConfig() {
  const config = useRuntimeConfig()
  return {
    accessKey: config.qiniu?.accessKey || '',
    secretKey: config.qiniu?.secretKey || '',
    bucket: config.qiniu?.bucket || '',
    cdnDomain: (config.qiniu?.cdnDomain || config.public?.qiniuCdnDomain || '').replace(/^https?:\/\//, '').replace(/\/$/, ''),
    uploadUrl: config.qiniu?.uploadUrl || 'https://upload.qiniup.com',
    region: config.qiniu?.region || 'z0'
  }
}

export function qiniuReady() {
  const c = qiniuConfig()
  return Boolean(c.accessKey && c.secretKey && c.bucket)
}

/** key -> 可访问 URL */
export function buildPublicUrl(key, domain = '') {
  const clean = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return clean ? `https://${clean}/${key}` : key
}

/** 单次上传体积上限（前端压缩后通常远低于此值，作为兜底保护） */
const MAX_UPLOAD_SIZE = 20 * 1024 * 1024

/** 生成一次性上传凭证，限定 scope = bucket:key，有效期 1 小时 */
export function createUploadToken({ folder = 'common', fileName = '' } = {}) {
  const config = qiniuConfig()
  if (!qiniuReady()) {
    throw createError({
      statusCode: 400,
      statusMessage: '尚未配置七牛云：请在 .env 中填写 NUXT_QINIU_ACCESS_KEY / SECRET_KEY / BUCKET / CDN_DOMAIN，也可直接使用外链图片'
    })
  }

  const safeFolder = String(folder).replace(/[^a-zA-Z0-9_/-]/g, '').replace(/^\/+|\/+$/g, '') || 'common'
  const extMatch = String(fileName).toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|svg|avif|mp4)$/)
  const ext = extMatch ? extMatch[0] : ''
  const now = new Date()
  const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
  const key = `${safeFolder}/${datePath}/${randomUUID().replace(/-/g, '')}${ext}`

  const mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey)
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: `${config.bucket}:${key}`,
    expires: 3600,
    insertOnly: 1,
    fsizeLimit: MAX_UPLOAD_SIZE
  })
  const token = putPolicy.uploadToken(mac)

  return {
    token,
    key,
    url: buildPublicUrl(key, config.cdnDomain),
    uploadUrl: config.uploadUrl,
    expiresIn: 3600
  }
}

/** 删除空间中的文件（后台可选调用） */
export async function deleteObject(key) {
  const config = qiniuConfig()
  if (!qiniuReady()) throw createError({ statusCode: 400, statusMessage: '七牛云未配置' })
  const mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey)
  // qiniu v7 的 BucketManager 需要 conf.Config 实例（普通对象缺少 getRegionsProvider）
  const bucketConfig = new qiniu.conf.Config({ zone: resolveZone(config.region), useHttpsDomain: true })
  const bucketManager = new qiniu.rs.BucketManager(mac, bucketConfig)
  return new Promise((resolve, reject) => {
    bucketManager.delete(config.bucket, key, (err, body, info) => {
      if (err || info.statusCode >= 300) reject(err || new Error(JSON.stringify(body)))
      else resolve(body)
    })
  })
}

function resolveZone(region) {
  return ({
    z0: qiniu.zone.Zone_z0,
    z1: qiniu.zone.Zone_z1,
    z2: qiniu.zone.Zone_z2,
    na0: qiniu.zone.Zone_na0,
    as0: qiniu.zone.Zone_as0
  })[region] || qiniu.zone.Zone_z0
}
