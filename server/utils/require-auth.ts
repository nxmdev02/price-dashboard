import type { DecodedIdToken } from 'firebase-admin/auth'
import type { H3Event } from 'h3'
import { getAdminAuth } from './firebase-admin'

export async function requireAuth(event: H3Event): Promise<DecodedIdToken> {
  const authorization = getHeader(event, 'authorization')

  if (!authorization?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다.' })
  }

  const token = authorization.slice('Bearer '.length).trim()

  try {
    return await getAdminAuth().verifyIdToken(token)
  } catch {
    throw createError({ statusCode: 401, statusMessage: '로그인 정보가 유효하지 않습니다.' })
  }
}
