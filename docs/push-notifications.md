# 푸시 알림

miniplay는 Web Push API를 사용하여 브라우저 푸시 알림을 지원합니다.

## 아키텍처

```
클라이언트                     서버                      외부
┌──────────┐   subscribe   ┌──────────┐            ┌───────┐
│ 브라우저   │ ──────────→  │ API Route │ ────────→ │ Redis │
│ (SW 등록) │              │ /push/*   │            └───────┘
└──────────┘              └──────────┘
                               │
                          send │ (관리자)
                               ▼
                          ┌──────────┐
                          │ web-push │ → 브라우저 푸시 서비스
                          └──────────┘
```

## 환경 변수

| 변수 | 용도 | 위치 |
| --- | --- | --- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID 공개키 (클라이언트 구독용) | 클라이언트 |
| `VAPID_PRIVATE_KEY` | VAPID 비공개키 (발송용) | 서버 |
| `REDIS_URL` | 구독 정보 저장소 | 서버 |
| `PUSH_ADMIN_SECRET` | 발송 API 인증 토큰 | 서버 |

## 클라이언트 구독

`lib/push-client.ts`에서 구독/해제를 관리합니다.

### 구독 흐름

1. `NotificationToggle` 컴포넌트에서 토글 클릭
2. `Notification.requestPermission()` 호출
3. `pushManager.subscribe()` — VAPID 공개키로 구독 생성
4. `POST /api/push/subscribe` — 구독 정보를 서버에 전달
5. 서버에서 Redis SET에 구독 JSON 저장

### 해제 흐름

1. `pushSubscription.unsubscribe()` 호출
2. `POST /api/push/unsubscribe` — endpoint 전달
3. 서버에서 Redis SET에서 해당 구독 제거

## 서버 발송

`POST /api/push/send`로 전체 구독자에게 알림을 발송합니다.

### 요청

```bash
curl -X POST https://miniplay.kr/api/push/send \
  -H "Authorization: Bearer YOUR_PUSH_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "새 게임 추가!",
    "body": "눈치게임이 추가되었어요",
    "url": "/game/nunchi"
  }'
```

### 응답

```json
{ "sent": 42, "failed": 3, "total": 45 }
```

### 만료 구독 정리

발송 시 `410 Gone` 또는 `404 Not Found` 응답을 받으면 해당 구독을 Redis에서 자동 삭제합니다.

## Service Worker

`worker/index.js`에서 푸시 이벤트를 처리합니다.

- **`push` 이벤트**: JSON 페이로드 파싱 → `showNotification()` 호출
- **`notificationclick` 이벤트**: 알림 닫기 → 기존 창 포커스 또는 새 창 열기

## 타입 정의

```typescript
// types/push.ts
interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}
```
