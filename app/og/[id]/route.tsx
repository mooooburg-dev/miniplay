import { ImageResponse } from 'next/og'
import { GAMES } from '@/types'

// 게임별 공유 미리보기 이미지 (1200×630). 빌드 시 정적 생성된다.
export const dynamic = 'force-static'
export const dynamicParams = false // 등록된 게임 외 경로는 404 (캐시 생성 방지)

export function generateStaticParams() {
  return GAMES.map((game) => ({ id: game.id }))
}

async function fetchOk(url: string): Promise<Response> {
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url)
      if (res.ok) return res
      lastError = new Error(`${res.status} ${url}`)
    } catch (error) {
      lastError = error
    }
  }
  throw new Error(`[og] 리소스를 불러오지 못했습니다: ${String(lastError)}`)
}

/** Google Fonts에서 필요한 글자만 담은 Jua TTF를 받는다 (satori는 woff2 미지원) */
async function loadJua(text: string): Promise<ArrayBuffer> {
  const css = await (await fetchOk(`https://fonts.googleapis.com/css2?family=Jua&text=${encodeURIComponent(text)}`)).text()
  const fontUrl = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
  if (!fontUrl) throw new Error('[og] Jua 폰트 주소를 찾지 못했습니다')
  return (await fetchOk(fontUrl)).arrayBuffer()
}

/**
 * 이모지를 Twemoji SVG data URI로 받는다.
 * next/og의 내장 이모지 로더는 실패를 확인하지 않아, 장애 시 이모지가 빠진 이미지가 영구 캐시될 수 있다.
 */
async function loadEmoji(emoji: string): Promise<string> {
  const code = [...emoji]
    .map((ch) => ch.codePointAt(0)!.toString(16))
    .filter((cp) => cp !== 'fe0f')
    .join('-')
  const svg = await (await fetchOk(`https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${code}.svg`)).text()
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const game = GAMES.find((g) => g.id === id)
  if (!game) return new Response('Not found', { status: 404 })

  const tagline = '설치 없이 바로! 온가족 무료 미니게임'
  const [font, emoji] = await Promise.all([
    loadJua(`${game.name}${game.desc}${tagline}miniplay.kr`),
    loadEmoji(game.emoji),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fdfbfb',
          backgroundImage:
            // satori는 transparent를 검은 투명으로 보간해 탁해지므로 같은 색의 투명값을 쓴다
            'radial-gradient(circle at 15% 50%, rgba(255,245,214,1), rgba(255,245,214,0) 50%), radial-gradient(circle at 85% 30%, rgba(214,229,255,1), rgba(214,229,255,0) 50%), radial-gradient(circle at 50% 85%, rgba(255,214,224,1), rgba(255,214,224,0) 55%)',
          fontFamily: 'Jua',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 56,
            padding: '56px 72px',
            borderRadius: 48,
            background: 'rgba(255,255,255,0.7)',
            boxShadow: `0 20px 60px ${game.color}33`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={emoji} width={220} height={220} alt="" />
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 620 }}>
            <div style={{ fontSize: 104, color: game.color, lineHeight: 1.1 }}>{game.name}</div>
            <div style={{ fontSize: 46, color: '#6b7280', marginTop: 16 }}>{game.desc}</div>
            <div
              style={{
                display: 'flex',
                marginTop: 36,
                fontSize: 30,
                color: 'white',
                background: game.color,
                padding: '10px 28px',
                borderRadius: 999,
                alignSelf: 'flex-start',
              }}
            >
              {tagline}
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 34, right: 48, fontSize: 34, color: '#ff6b9d', display: 'flex' }}>
          miniplay.kr
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Jua', data: font, weight: 400, style: 'normal' }],
    },
  )
}
