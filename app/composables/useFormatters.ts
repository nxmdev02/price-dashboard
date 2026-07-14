export function useFormatters() {
  const money = (value: unknown) => typeof value === 'number' ? `${value.toLocaleString('ko-KR')}원` : '미정'
  const shippingText = (value: unknown) => value === 0 ? '무료' : money(value)
  const statusText = (status: string) => ({ SUCCESS: '정상', FAILED: '실패', REVIEW_REQUIRED: '검토 필요', IDLE: '대기' }[status] || status)
  const statusClass = (status: string) => ({ SUCCESS: 'status-success', FAILED: 'status-failed', REVIEW_REQUIRED: 'status-review', IDLE: 'status-unknown' }[status] || 'status-unknown')
  const productStatusText = (status: string) => ({ ACTIVE: '사용중', DRAFT: '초안', ARCHIVED: '보관' }[status] || status)
  const platformText = (platform: string) => ({ NAVER_SMARTSTORE: '네이버 스마트스토어', CAFE24: '카페24', OWN_MALL: '자사몰', OTHER: '기타' }[platform] || platform)
  const methodText = (method: string) => ({ MANUAL: '수동 입력', HTML_SELECTOR: 'HTML 자동 수집', JSON_LD: 'JSON-LD 자동 수집', NAVER_SEARCH_API: '네이버 검색 API' }[method] || method)
  const modelLabel = (product: any) => `${product.modelCode} · W${product.width} × D${product.depth} × H${product.height} · 드롭다운 도어 ${product.doorCount}개`
  const formatDate = (value: unknown) => value ? new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value as string)) : '조회 전'

  return { money, shippingText, statusText, statusClass, productStatusText, platformText, methodText, modelLabel, formatDate }
}
