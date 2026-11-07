/**
 * EdgeOne Pages 云函数产物修正（构建后自动执行）
 *
 * 现象：线上 API 返回
 *   Server Error: Cannot find module '.prisma/client/default'
 *   Require stack: /var/user/node_modules/@prisma/client/default.js
 *
 * 原因：EdgeOne 上传/解压云函数代码包时会过滤以 `.` 开头的目录，
 * Prisma 默认生成在 node_modules/.prisma/client，因此线上缺失；
 * 而 @prisma/client/default.js 固定 require('.prisma/client/default')。
 *
 * 处理：把生成产物完整复制到普通目录 yunjian-prisma-client，
 * 并把产物内 @prisma/client 的入口指向它。只改构建产物，不动源码。
 */
import {
  existsSync, mkdirSync, readdirSync, statSync, copyFileSync,
  readFileSync, writeFileSync, rmSync
} from 'node:fs'
import { join, resolve } from 'node:path'

const NODE_MODULES = resolve('.edgeone/cloud-functions/ssr-node/node_modules')
const OUTPUT_GENERATED = join(NODE_MODULES, '.prisma', 'client')
const ROOT_GENERATED = resolve('node_modules/.prisma/client')

// 本地普通 `nuxt build` 输出的是 .output，不需要这个修正
if (!existsSync(NODE_MODULES)) {
  console.log('[edgeone-prisma] 未检测到 EdgeOne 产物，跳过')
  process.exit(0)
}

// 重复构建时 .edgeone 里的生成目录可能是上一轮的旧产物，
// 而 npm install 的 postinstall 刚在项目根执行过 prisma generate。
// 两个来源合并复制（后者覆盖同名文件），确保所有 binaryTargets 引擎都进上传包。
const SOURCES = [OUTPUT_GENERATED, ROOT_GENERATED].filter((dir) => existsSync(dir))
if (!SOURCES.length) {
  console.warn('[edgeone-prisma] 未找到 Prisma 生成目录，跳过')
  process.exit(0)
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true })
  for (const name of readdirSync(src)) {
    const from = join(src, name)
    const to = join(dest, name)
    if (statSync(from).isDirectory()) copyDir(from, to)
    else copyFileSync(from, to)
  }
}

const TARGET = join(NODE_MODULES, 'yunjian-prisma-client')
rmSync(TARGET, { recursive: true, force: true })
for (const source of SOURCES) copyDir(source, TARGET)
// Windows 引擎在线上用不到，去掉可省 21MB 上传体积
rmSync(join(TARGET, 'query_engine-windows.dll.node'), { force: true })

// 打印实际打包的 Linux 引擎，便于在云端构建日志里核对目标平台是否齐全
const engines = readdirSync(TARGET).filter((name) => /^libquery_engine-.*\.so\.node$/.test(name))
console.log(`[edgeone-prisma] 打包引擎: ${engines.sort().join(', ') || '(无)'}`)

const ENTRY = join(NODE_MODULES, '@prisma', 'client', 'default.js')
if (existsSync(ENTRY)) {
  writeFileSync(
    ENTRY,
    "// Patched for EdgeOne Pages: dot-directories are stripped on upload.\n" +
      "// From node_modules/@prisma/client/ it takes two levels up to node_modules/.\n" +
      "module.exports = { ...require('../../yunjian-prisma-client/default.js') }\n"
  )
} else {
  console.warn('[edgeone-prisma] 未找到 @prisma/client/default.js，入口未修正')
}

// 平台会按 ssr-node/package.json 的 dependencies 白名单筛选/重建 node_modules，
// 未声明的目录即使打进 zip 也不会出现在运行时，因此必须显式登记该本地包。
const SSR_NODE = resolve('.edgeone/cloud-functions/ssr-node')
const PKG_PATH = join(SSR_NODE, 'package.json')
if (existsSync(PKG_PATH)) {
  const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'))
  pkg.dependencies = pkg.dependencies || {}
  pkg.dependencies['yunjian-prisma-client'] = '0.0.0'
  delete pkg.dependencies['.prisma']
  writeFileSync(PKG_PATH, `${JSON.stringify(pkg, null, 2)}\n`)
} else {
  console.warn('[edgeone-prisma] 未找到 ssr-node/package.json，依赖未登记')
}

console.log(`[edgeone-prisma] 已复制生成产物 → ${TARGET}`)
