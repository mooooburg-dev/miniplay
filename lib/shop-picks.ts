import type { GameType } from '@/types'

// 게임별 "함께 하면 더 재밌는 놀이템" — 클릭은 골드박스 투데이 /go/[id] 리다이렉트로 보낸다
// (클릭 기록·제휴 딥링크·죽은 링크 교체는 goldbox에서 처리). 상품 추가: goldbox /admin/pool 등록 → id 기입
export interface ShopPick {
  productId: number // goldbox.today gb_products.id (goldbox /admin/pool 에 등록된 상품)
  name: string // 짧게 다듬은 상품명 (원본 상품 제목을 그대로 붙이지 말 것)
  image: string // 상품 썸네일 URL (goldbox 상품 상세의 이미지 URL)
  note: string // 게임과의 연결 한 줄 — 사실만, 효능·가격 표현 금지
}

// 게임별 0~2개. 비어 있으면 섹션 자체를 렌더하지 않는다.
export const SHOP_PICKS: Partial<Record<GameType, ShopPick[]>> = {
  croc: [],
  mole: [],
  balloon: [],
  bomb: [],
  flag: [],
  ladder: [],
  roulette: [],
  spin: [],
}

export function shopPickUrl(productId: number, game: GameType) {
  return `https://goldbox.today/go/${productId}?utm_source=miniplay&utm_medium=referral&utm_campaign=${game}`
}
