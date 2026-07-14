import { requireAuth } from '../../utils/require-auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  return {
    uid: user.uid,
    email: user.email ?? null,
  }
})
