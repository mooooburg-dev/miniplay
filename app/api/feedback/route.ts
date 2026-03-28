import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const REPO_OWNER = 'mooooburg-dev'
const REPO_NAME = 'miniplay'

export async function POST(req: NextRequest) {
  try {
    const { type, message } = await req.json()

    if (!type || !message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'invalid input' }, { status: 400 })
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'too long' }, { status: 400 })
    }

    // GitHub Issue로 생성
    if (GITHUB_TOKEN) {
      const res = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github+json',
          },
          body: JSON.stringify({
            title: `[의견함] ${type}`,
            body: `## ${type}\n\n${message}\n\n---\n_우리 가족 의견함에서 전달된 메시지입니다._`,
          }),
        },
      )

      if (!res.ok) {
        console.error('GitHub API error:', res.status, await res.text())
        return NextResponse.json({ error: 'github api failed' }, { status: 502 })
      }
    } else {
      // 토큰 미설정 시 콘솔 로그로 대체
      console.log('[Feedback]', type, ':', message)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
