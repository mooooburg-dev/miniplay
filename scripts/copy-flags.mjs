// lib/flags.ts에 등록된 나라의 국기 SVG를 flag-icons 패키지에서 public/flags/로 복사한다.
// 사용법: node scripts/copy-flags.mjs
import { readFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'node_modules/flag-icons/flags/4x3')
const destDir = join(root, 'public/flags')

if (!existsSync(srcDir)) {
  console.error('flag-icons 패키지가 없습니다. npm install 후 다시 실행하세요.')
  process.exit(1)
}

const source = readFileSync(join(root, 'lib/flags.ts'), 'utf8')
const codes = [...new Set([...source.matchAll(/code: '([a-z]{2})'/g)].map((m) => m[1]))]

mkdirSync(destDir, { recursive: true })

// 더 이상 쓰지 않는 국기 제거
for (const file of readdirSync(destDir)) {
  if (file.endsWith('.svg') && !codes.includes(file.replace('.svg', ''))) {
    unlinkSync(join(destDir, file))
  }
}

for (const code of codes) {
  const src = join(srcDir, `${code}.svg`)
  if (!existsSync(src)) {
    console.error(`국기 파일 없음: ${code}`)
    process.exit(1)
  }
  copyFileSync(src, join(destDir, `${code}.svg`))
}

copyFileSync(join(root, 'node_modules/flag-icons/LICENSE'), join(destDir, 'LICENSE'))
console.log(`국기 ${codes.length}개 복사 완료 → public/flags/`)
