import { normalizePrice } from '../../utils/normalize-price'
import type { CollectPriceOptions, CollectedPrice, PriceCollector } from './types'

interface NaverItem { title:string; link:string; productId?:string; lprice:string }
export class NaverShoppingCollector implements PriceCollector {
  supports(options:CollectPriceOptions){return options.method==='NAVER_SEARCH_API'}
  async collect(options:CollectPriceOptions):Promise<CollectedPrice>{
    const config=useRuntimeConfig(), clientId=config.naverClientId, secret=config.naverClientSecret
    if(!clientId||!secret)throw new Error('네이버 쇼핑 API 키가 없어 수동 가격 관리가 필요합니다.')
    const query=String(options.optionConfig?.searchQuery||options.externalProductId||'').trim()
    if(!query)throw new Error('네이버 검색어 또는 외부 제품번호가 필요합니다.')
    const response=await fetch(`https://openapi.naver.com/v1/search/shop.json?display=100&query=${encodeURIComponent(query)}`,{headers:{'X-Naver-Client-Id':String(clientId),'X-Naver-Client-Secret':String(secret)},signal:AbortSignal.timeout(15000)})
    if(!response.ok)throw new Error(`네이버 쇼핑 검색 API 요청에 실패했습니다. (${response.status})`)
    const data=await response.json() as {items?:NaverItem[]}, expected=String(options.externalProductId||'')
    const matches=(data.items||[]).filter(item=>!expected||item.productId===expected||item.link.includes(`/products/${expected}`)||item.link.includes(`/catalog/${expected}`))
    if(matches.length!==1)throw new Error(matches.length?'네이버 검색 결과가 여러 개여서 자동 판별할 수 없습니다.':'등록 상품과 일치하는 네이버 검색 결과가 없습니다.')
    const item=matches[0]!, finalPrice=normalizePrice(item.lprice);if(!finalPrice)throw new Error('네이버 검색 결과의 가격이 올바르지 않습니다.')
    return{productName:item.title.replace(/<[^>]+>/g,''),salePrice:finalPrice,finalPrice,rawData:{source:'NAVER_SEARCH_API',productId:item.productId,link:item.link}}
  }
}
