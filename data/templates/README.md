# 대량 등록 템플릿

`models.csv`에는 남은 모델을 한 줄씩 입력합니다.

- `sidePanelTier`: 사이드 패널 단수. 관련 정보가 없으면 비워 둠
- `sidePanelIncluded`: 있으면 `true`, 없으면 `false`
- 이미지 파일은 `public/images`에 넣고 `imageFilename`에 파일명만 입력
- 아직 정하지 못한 이름은 규격 기반으로 자동 생성할 수 있으므로 비워도 됨

`competitor-mappings.csv`에는 모델과 경쟁사 상품 URL을 한 줄씩 입력합니다.

- 해당 상품이 없으면 `productUrl`을 비우고 `notes`에 `매핑 없음` 입력
- 일반 쇼핑몰의 가격 칸은 비워도 되며 공개 페이지에서 자동 확인
- 네이버 스마트스토어는 `listPrice`, `salePrice`, `shippingFee`, `optionPrice`를 직접 입력
- 금액은 쉼표와 `원` 없이 숫자만 입력
