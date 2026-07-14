import { HtmlSelectorCollector } from './html-selector.collector'
import { JsonLdCollector } from './json-ld.collector'
import type { CollectPriceOptions, CollectedPrice, PriceCollector } from './types'

export class Cafe24Collector implements PriceCollector {
  supports(options:CollectPriceOptions){return options.method==='CAFE24_API'}
  async collect(options:CollectPriceOptions):Promise<CollectedPrice>{
    try{return await new JsonLdCollector().collect({...options,method:'JSON_LD'})}
    catch{return new HtmlSelectorCollector().collect({...options,method:'HTML_SELECTOR',selectorConfig:{priceSelector:'#span_product_price_sale, #span_product_price_text, meta[property="product:price:amount"]',productNameSelector:'meta[property="og:title"]',...options.selectorConfig}})}
  }
}
