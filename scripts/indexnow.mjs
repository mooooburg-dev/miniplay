// IndexNow 색인 요청: 운영 사이트맵의 URL을 검색엔진에 즉시 알린다.
// - 중앙 엔드포인트(api.indexnow.org): Bing·Yandex 등 참여 엔진 전체에 전파
// - 네이버 전용 엔드포인트(searchadvisor.naver.com): 네이버에 직접 전송
// 사용법: npm run indexnow            (배포 완료 후 실행 — 키 파일이 운영에 있어야 함)
//        npm run indexnow -- --dry   (전송 없이 대상 URL만 출력)
const SITE_URL = 'https://miniplay.kr'
const HOST = 'miniplay.kr'
const KEY = '3fa25c19a6fa43ef815ef656c8ceabf2' // public/<KEY>.txt 와 같은 값
const ENDPOINTS = {
  central: 'https://api.indexnow.org/indexnow',
  naver: 'https://searchadvisor.naver.com/indexnow',
}

const dryRun = process.argv.includes('--dry')

async function getSitemapUrls() {
  const res = await fetch(`${SITE_URL}/sitemap.xml`)
  if (!res.ok) throw new Error(`사이트맵 조회 실패 (${res.status})`)
  const xml = await res.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
  return [...new Set(urls)].filter((u) => u.startsWith(SITE_URL))
}

async function verifyKeyFile() {
  const res = await fetch(`${SITE_URL}/${KEY}.txt`)
  const body = (await res.text()).trim()
  if (!res.ok || body !== KEY) {
    throw new Error(`키 파일 검증 실패 (${res.status}) — 배포가 끝났는지 확인하세요: ${SITE_URL}/${KEY}.txt`)
  }
}

const urls = await getSitemapUrls()
console.log(`[IndexNow] 대상 URL ${urls.length}개`)
if (urls.length === 0) throw new Error('사이트맵에서 URL을 찾지 못했습니다')
urls.forEach((u) => console.log('  ' + u))
if (dryRun) process.exit(0)

await verifyKeyFile()
const payload = { host: HOST, key: KEY, keyLocation: `${SITE_URL}/${KEY}.txt`, urlList: urls }
let failed = false
for (const [name, endpoint] of Object.entries(ENDPOINTS)) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })
    const ok = res.status === 200 || res.status === 202
    if (!ok) failed = true
    console.log(`[IndexNow] ${ok ? '✅' : '⚠️'} ${name} ${res.status} ${ok ? '' : await res.text().catch(() => '')}`)
  } catch (error) {
    failed = true
    console.error(`[IndexNow] ❌ ${name}`, error)
  }
}
process.exit(failed ? 1 : 0)
