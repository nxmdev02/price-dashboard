import { load } from 'cheerio'
import { normalizePrice } from '../../utils/normalize-price'
import type { CollectPriceOptions, CollectedPrice, PriceCollector } from './types'

function products(value: unknown): Record<string, any>[] {
  if(Array.isArray(value)) return value.flatMap(products)
  if(!value||typeof value!=='object') return []
  const item=value as Record<string,any>, own=item['@type']==='Product'?[item]:[]
  return [...own,...products(item['@graph'])]
}
export class JsonLdCollector implements PriceCollector {
  supports(options:CollectPriceOptions){return options.method==='JSON_LD'}
  async collect(options:CollectPriceOptions):Promise<CollectedPrice>{
    const response=await fetch(options.url,{headers:{'user-agent':'Mozilla/5.0 (compatible; PRISM-PriceMonitor/1.0)','accept-language':'ko-KR'},signal:AbortSignal.timeout(15000)})
    if(!response.ok)throw new Error(`상품 페이지 요청에 실패했습니다. (${response.status})`)
    const $=load(await response.text()); let found:Record<string,any>|undefined
    $('script[type="application/ld+json"]').each((_,element)=>{if(found)return;try{found=products(JSON.parse($(element).text()))[0]}catch{/* 일부 사이트의 비표준 JSON-LD는 건너뜁니다. */}})
    const offer=Array.isArray(found?.offers)?found.offers[0]:found?.offers, rawPrice=offer?.price??offer?.lowPrice, finalPrice=normalizePrice(String(rawPrice??''))
    if(!found||!finalPrice)throw new Error('JSON-LD에서 유효한 상품 가격을 찾지 못했습니다.')
    return{productName:typeof found.name==='string'?found.name:undefined,salePrice:finalPrice,finalPrice,rawData:{source:'JSON_LD',rawPrice}}
  }
}
