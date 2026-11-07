/**
 * 鉴权工具：JWT（jose）+ httpOnly Cookie + bcrypt 密码校验
 * 无状态会话，不额外建表；密钥来自 NUXT_AUTH_SECRET / AUTH_SECRET
 */
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma.js'
import { isDemoMode } from './response.js'

const COOKIE_NAME = 'yunjian_admin'
const MAX_AGE = 60 * 60 * 24 * 7

function secretKey() {
  const config = useRuntimeConfig()
  return new TextEncoder().encode(config.authSecret || 'dev-only-secret-please-change')
}

export async function signSession(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey())
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey())
    return payload
  } catch {
    return null
  }
}

export function setSessionCookie(event, token) {
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE
  })
}

export function clearSessionCookie(event) {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export const DEMO_ADMIN = {
  id: 'demo',
  username: 'admin',
  nickname: '演示管理员',
  role: 'demo'
}

/** 当前登录管理员；演示账号在无数据库时也可访问后台 */
export async function getCurrentAdmin(event) {
  const token = getCookie(event, COOKIE_NAME)
  if (!token) return null
  const payload = await verifySession(token)
  if (!payload?.sub) return null

  if (payload.sub === 'demo') {
    return isDemoMode() ? { ...DEMO_ADMIN } : null
  }

  return prisma.adminUser
    .findUnique({
      where: { id: String(payload.sub) },
      select: { id: true, username: true, nickname: true, role: true }
    })
    .catch(() => null)
}
