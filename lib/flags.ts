// 국기 퀴즈 데이터
// 국기 SVG: public/flags/<code>.svg (flag-icons, MIT) — 나라 추가 시 `node scripts/copy-flags.mjs` 실행

export type FlagLevel = 1 | 2 | 3

export interface Country {
  code: string // ISO 3166-1 alpha-2 (소문자)
  name: string
  aliases?: string[] // 음성 인식용 다른 이름
}

export const FLAG_LEVELS: Record<FlagLevel, Country[]> = {
  // 레벨 1: 아이들도 알 만한 나라
  1: [
    { code: 'kr', name: '대한민국', aliases: ['한국', '남한', '코리아', 'korea'] },
    { code: 'us', name: '미국', aliases: ['미합중국', '아메리카', '유에스에이', 'usa'] },
    { code: 'jp', name: '일본' },
    { code: 'cn', name: '중국' },
    { code: 'gb', name: '영국', aliases: ['잉글랜드', '유케이', 'uk'] },
    { code: 'fr', name: '프랑스' },
    { code: 'de', name: '독일' },
    { code: 'it', name: '이탈리아', aliases: ['이태리'] },
    { code: 'ca', name: '캐나다' },
    { code: 'br', name: '브라질' },
    { code: 'es', name: '스페인' },
    { code: 'au', name: '호주', aliases: ['오스트레일리아'] },
    { code: 'ru', name: '러시아' },
    { code: 'in', name: '인도' },
    { code: 'ch', name: '스위스' },
    { code: 'mx', name: '멕시코' },
    { code: 'vn', name: '베트남', aliases: ['월남'] },
    { code: 'th', name: '태국', aliases: ['타일랜드'] },
    { code: 'tr', name: '튀르키예', aliases: ['터키', '투르키예', '튀르키에'] },
    { code: 'gr', name: '그리스' },
  ],
  // 레벨 2: 조금 생각해야 하는 나라
  2: [
    { code: 'nl', name: '네덜란드', aliases: ['홀란드', '화란'] },
    { code: 'se', name: '스웨덴' },
    { code: 'no', name: '노르웨이' },
    { code: 'fi', name: '핀란드' },
    { code: 'dk', name: '덴마크' },
    { code: 'pt', name: '포르투갈', aliases: ['포르투칼', '포르투걸'] },
    { code: 'be', name: '벨기에' },
    { code: 'at', name: '오스트리아' },
    { code: 'pl', name: '폴란드' },
    { code: 'ie', name: '아일랜드' },
    { code: 'ar', name: '아르헨티나' },
    { code: 'nz', name: '뉴질랜드' },
    { code: 'eg', name: '이집트' },
    { code: 'sa', name: '사우디아라비아', aliases: ['사우디'] },
    { code: 'ph', name: '필리핀' },
    { code: 'id', name: '인도네시아' },
    { code: 'sg', name: '싱가포르', aliases: ['싱가폴'] },
    { code: 'my', name: '말레이시아' },
    { code: 'mn', name: '몽골' },
    { code: 'za', name: '남아프리카공화국', aliases: ['남아공', '남아프리카'] },
    { code: 'ua', name: '우크라이나', aliases: ['우크라니아'] },
    { code: 'cl', name: '칠레' },
    { code: 'co', name: '콜롬비아' },
    { code: 'jm', name: '자메이카' },
    { code: 'ke', name: '케냐' },
  ],
  // 레벨 3: 어른도 헷갈리는 나라
  3: [
    { code: 'is', name: '아이슬란드' },
    { code: 'hu', name: '헝가리' },
    { code: 'cz', name: '체코' },
    { code: 'ro', name: '루마니아' },
    { code: 'bg', name: '불가리아' },
    { code: 'hr', name: '크로아티아' },
    { code: 'rs', name: '세르비아' },
    { code: 'ee', name: '에스토니아' },
    { code: 'lv', name: '라트비아' },
    { code: 'lt', name: '리투아니아' },
    { code: 'np', name: '네팔' },
    { code: 'bt', name: '부탄' },
    { code: 'lk', name: '스리랑카' },
    { code: 'kh', name: '캄보디아' },
    { code: 'la', name: '라오스' },
    { code: 'mm', name: '미얀마', aliases: ['버마'] },
    { code: 'pk', name: '파키스탄' },
    { code: 'bd', name: '방글라데시' },
    { code: 'ir', name: '이란' },
    { code: 'iq', name: '이라크' },
    { code: 'qa', name: '카타르' },
    { code: 'ae', name: '아랍에미리트', aliases: ['아랍에미레이트', '에미리트'] },
    { code: 'kz', name: '카자흐스탄' },
    { code: 'uz', name: '우즈베키스탄' },
    { code: 'ma', name: '모로코' },
    { code: 'gh', name: '가나' },
    { code: 'et', name: '에티오피아' },
    { code: 'cu', name: '쿠바' },
    { code: 've', name: '베네수엘라' },
    { code: 'uy', name: '우루과이' },
  ],
}

export const ALL_COUNTRIES: Country[] = [
  ...FLAG_LEVELS[1],
  ...FLAG_LEVELS[2],
  ...FLAG_LEVELS[3],
]

export function flagSrc(code: string) {
  return `/flags/${code}.svg`
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[\s.,!?~'"·-]/g, '')
}

const ALIAS_INDEX = ALL_COUNTRIES.flatMap((country) =>
  [country.name, ...(country.aliases ?? [])].map((alias) => ({
    country,
    alias: normalize(alias),
  })),
)

/** 가장 마지막에 끝나는 별칭을 고른다. 끝 위치가 같으면 더 긴 별칭 우선 ("미합중국" ≠ "중국") */
function findLastAlias(
  text: string,
  isValidStart: (index: number) => boolean,
): Country | null {
  let best: { country: Country; end: number; length: number } | null = null
  for (const { country, alias } of ALIAS_INDEX) {
    let index = text.lastIndexOf(alias)
    while (index >= 0 && !isValidStart(index)) {
      index = index > 0 ? text.lastIndexOf(alias, index - 1) : -1
    }
    if (index < 0) continue
    const end = index + alias.length
    if (!best || end > best.end || (end === best.end && alias.length > best.length)) {
      best = { country, end, length: alias.length }
    }
  }
  return best?.country ?? null
}

/**
 * 음성 인식 결과에서 나라를 찾는다.
 * - 여러 나라가 들리면 마지막에 말한 나라를 고른다. ("한국? 아니 일본!" → 일본)
 * - 나라 이름은 단어의 시작에서만 인정한다. ("중국이란 나라"의 "이란", "가나다라"의 "가나" 제외)
 * - 단어를 걸쳐 말해도 인정한다. ("대한 민국" → 대한민국)
 * - 단어 시작에서 못 찾으면 위치 제한 없이 다시 찾는다. ("정답은브라질"처럼 붙여서 인식된 경우)
 */
export function matchCountry(transcript: string): Country | null {
  const words = transcript.split(/\s+/).map(normalize).filter(Boolean)
  if (words.length === 0) return null

  const joined = words.join('')
  const wordStarts = new Set<number>()
  let offset = 0
  for (const word of words) {
    wordStarts.add(offset)
    offset += word.length
  }
  return (
    findLastAlias(joined, (index) => wordStarts.has(index)) ??
    findLastAlias(joined, () => true)
  )
}

/** Fisher–Yates 셔플 (원본 불변) */
export function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
