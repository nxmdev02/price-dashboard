import { collectPrice } from '../../services/collectors'
import { requireAuth } from '../../utils/require-auth'

interface PreviewBody {
  url?: string
  priceSelector?: string
  productNameSelector?: string
}

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const body = await readBody<PreviewBody>(event)

  if (!body.url) {
    throw createError({ statusCode: 400, statusMessage: '상품 URL이 필요합니다.' })
  }

  let url: URL
  try {
    url = new URL(body.url)
  } catch {
    throw createError({ statusCode: 400, statusMessage: '올바른 상품 URL이 아닙니다.' })
  }

  if (url.protocol !== 'https:') {
    throw createError({ statusCode: 400, statusMessage: 'HTTPS 상품 URL만 사용할 수 있습니다.' })
  }

  return collectPrice({
    url: url.toString(),
    method: 'HTML_SELECTOR',
    selectorConfig: {
      priceSelector: body.priceSelector ?? 'meta[property="product:price:amount"]',
      productNameSelector: body.productNameSelector ?? 'meta[property="og:title"]',
    },
  })
})
