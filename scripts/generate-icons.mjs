/**
 * PWA 아이콘 생성 스크립트
 * 실행: node scripts/generate-icons.mjs
 *
 * sharp 패키지 필요: npx 로 일회성 실행 가능
 */
import { writeFileSync } from 'fs'
import { execSync } from 'child_process'

// SVG 아이콘 소스
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="100%" style="stop-color:#e94560"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <text x="256" y="300" text-anchor="middle" font-size="240" font-family="sans-serif">🎮</text>
</svg>`

writeFileSync('public/icon.svg', svg)
console.log('✅ public/icon.svg 생성 완료')

// sharp가 설치되어 있으면 PNG도 생성
try {
  execSync('npx --yes sharp-cli -i public/icon.svg -o public/icon-192.png resize 192 192', { stdio: 'inherit' })
  execSync('npx --yes sharp-cli -i public/icon.svg -o public/icon-512.png resize 512 512', { stdio: 'inherit' })
  execSync('npx --yes sharp-cli -i public/icon.svg -o public/apple-touch-icon.png resize 180 180', { stdio: 'inherit' })
  console.log('✅ PNG 아이콘 생성 완료 (192, 512, 180)')
} catch {
  console.log('⚠️  sharp-cli로 PNG 변환 실패. 수동으로 PNG 아이콘을 준비해주세요.')
  console.log('   온라인 도구: https://realfavicongenerator.net/')
}
