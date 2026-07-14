import { HtmlSelectorCollector } from './html-selector.collector'
import { JsonLdCollector } from './json-ld.collector'
import { Cafe24Collector } from './cafe24.collector'
import { NaverShoppingCollector } from './naver-shopping.collector'
import type { CollectPriceOptions, CollectedPrice, PriceCollector } from './types'

const collectors: PriceCollector[] = [new NaverShoppingCollector(), new Cafe24Collector(), new JsonLdCollector(), new HtmlSelectorCollector()]

export async function collectPrice(options: CollectPriceOptions): Promise<CollectedPrice> {
  const collector = collectors.find(candidate => candidate.supports(options))

  if (!collector) {
    throw new Error(`지원하지 않는 가격 수집 방식입니다: ${options.method}`)
  }

  return collector.collect(options)
}
