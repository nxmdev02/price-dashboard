import { load } from 'cheerio'
import { normalizePrice } from '../../utils/normalize-price'
import type { CollectPriceOptions, CollectedPrice, PriceCollector } from './types'

const DEFAULT_PRICE_SELECTOR = 'meta[property="product:price:amount"]'

export class HtmlSelectorCollector implements PriceCollector {
  supports(options: CollectPriceOptions): boolean {
    return options.method === 'HTML_SELECTOR'
  }

  async collect(options: CollectPriceOptions): Promise<CollectedPrice> {
    const response = await fetch(options.url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; PRISM-PriceMonitor/1.0)',
        accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) {
      throw new Error(`상품 페이지 요청에 실패했습니다. (${response.status})`)
    }

    const html = await response.text()
    const $ = load(html)
    const priceSelector = typeof options.selectorConfig?.priceSelector === 'string'
      ? options.selectorConfig.priceSelector
      : DEFAULT_PRICE_SELECTOR
    const productNameSelector = typeof options.selectorConfig?.productNameSelector === 'string'
      ? options.selectorConfig.productNameSelector
      : 'meta[property="og:title"]'

    const priceElement = $(priceSelector).first()
    const rawPrice = priceElement.attr('content') ?? priceElement.text()
    const finalPrice = normalizePrice(rawPrice)

    if (!finalPrice) {
      throw new Error('상품 페이지에서 유효한 가격을 찾지 못했습니다.')
    }

    const nameElement = $(productNameSelector).first()
    const productName = (nameElement.attr('content') ?? nameElement.text()).trim() || undefined

    return {
      productName,
      salePrice: finalPrice,
      finalPrice,
      rawData: { rawPrice, priceSelector },
    }
  }
}
