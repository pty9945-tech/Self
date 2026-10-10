import type { Word } from '../data/words'
import { isKanaOnly } from './quiz'

export type ImportResult = { words: Word[]; warnings: string[] }

const aliases: Record<string, string> = {
  year: 'year', 연도: 'year', 년도: 'year',
  word: 'word', 단어: 'word',
  meaning: 'meaning', 뜻: 'meaning', 의미: 'meaning',
  reading: 'reading', 요미가나: 'reading', 후리가나: 'reading', 읽기: 'reading',
  acceptedmeanings: 'acceptedMeanings', 정답별칭: 'acceptedMeanings', 유의어: 'acceptedMeanings', 동의어: 'acceptedMeanings',
}

const normalize = (value: string): string => value.normalize('NFKC').trim()
const headerName = (name: string): string | undefined => aliases[normalize(name).toLowerCase()]

/** CSV state machine: quoted commas, escaped quotes, CRLF and quoted line breaks are supported. */
function parseCsv(content: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  let closedQuote = false
  for (let i = 0; i < content.length; i += 1) {
    const char = content[i]
    if (quoted) {
      if (char === '"' && content[i + 1] === '"') { cell += '"'; i += 1 }
      else if (char === '"') { quoted = false; closedQuote = true }
      else cell += char
      continue
    }
    if (char === '"') {
      if (cell || closedQuote) throw new Error('CSV의 따옴표 형식이 올바르지 않습니다. 쉼표가 있는 값은 전체를 큰따옴표로 감싸 주세요.')
      quoted = true
    } else if (char === ',') {
      row.push(cell); cell = ''; closedQuote = false
    } else if (char === '\r' || char === '\n') {
      row.push(cell)
      if (row.some((value) => value.trim())) rows.push(row)
      row = []; cell = ''; closedQuote = false
      if (char === '\r' && content[i + 1] === '\n') i += 1
    } else if (closedQuote) {
      if (char !== ' ' && char !== '\t') throw new Error('CSV의 닫는 따옴표 뒤에는 쉼표나 줄바꿈이 필요합니다.')
    } else cell += char
  }
  if (quoted) throw new Error('CSV에 닫히지 않은 큰따옴표가 있습니다.')
  row.push(cell)
  if (row.some((value) => value.trim())) rows.push(row)
  return rows
}

function stableId(value: string): string {
  let first = 0x811c9dc5
  let second = 0x9e3779b9
  for (let i = 0; i < value.length; i += 1) {
    first = Math.imul(first ^ value.charCodeAt(i), 0x01000193)
    second = Math.imul(second ^ value.charCodeAt(i), 0x85ebca6b)
  }
  return `import-${(first >>> 0).toString(36)}-${(second >>> 0).toString(36)}`
}

function remapObject(object: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(object)) {
    const mapped = headerName(key)
    if (mapped) result[mapped] = value
  }
  return result
}

/**
 * Structurally invalid rows are skipped with Korean warnings; an unusable file throws Error.
 * A kana check verifies format only. Imported readings always require a human semantic review.
 */
export function parseWordFile(content: string, filename: string): ImportResult {
  const text = content.replace(/^\uFEFF/, '')
  if (!text.trim()) throw new Error('파일이 비어 있습니다. 단어가 포함된 CSV 또는 JSON 파일을 선택해 주세요.')
  let rows: unknown[]
  let firstRowNumber: number
  const warnings: string[] = []
  if (/\.json$/i.test(filename)) {
    let parsed: unknown
    try { parsed = JSON.parse(text) } catch { throw new Error('JSON 형식이 올바르지 않습니다. 쉼표와 따옴표를 확인해 주세요.') }
    if (!Array.isArray(parsed)) throw new Error('JSON 파일의 최상위 값은 단어 객체의 배열이어야 합니다.')
    rows = parsed
    firstRowNumber = 1
  } else if (/\.csv$/i.test(filename)) {
    const parsed = parseCsv(text)
    if (!parsed.length) throw new Error('CSV 파일에 제목 행과 단어를 입력해 주세요.')
    const headers = parsed[0].map(headerName)
    const required = ['year', 'word', 'meaning']
    const missing = required.filter((key) => !headers.includes(key))
    if (missing.length) throw new Error(`CSV 제목에 ${missing.join(', ')} 열이 필요합니다. 연도, 단어, 뜻이라는 한글 제목도 사용할 수 있습니다.`)
    const known = headers.filter((header) => header !== undefined)
    if (new Set(known).size !== known.length) throw new Error('CSV에 같은 뜻의 제목 열이 중복되어 있습니다. 각 항목은 한 번만 입력해 주세요.')
    rows = parsed.slice(1).map((cells, index) => {
      if (cells.length !== headers.length) {
        warnings.push(`${index + 2}행: 열 개수가 제목 행과 달라 제외했습니다. 값에 쉼표가 있다면 큰따옴표로 감싸 주세요.`)
        return null
      }
      return Object.fromEntries(headers.flatMap((header, column) => header ? [[header, cells[column]]] : []))
    })
    firstRowNumber = 2
  } else throw new Error('CSV 또는 JSON 파일만 불러올 수 있습니다.')

  const words: Word[] = []
  const seen = new Set<string>()
  rows.forEach((raw, index) => {
    const rowNumber = index + firstRowNumber
    const warn = (message: string) => warnings.push(`${rowNumber}행: ${message}`)
    if (raw === null && /\.csv$/i.test(filename)) return
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      warn('단어 객체 형식이 아니어서 제외했습니다.'); return
    }
    const row = remapObject(raw as Record<string, unknown>)
    const year = typeof row.year === 'number' || typeof row.year === 'string' ? normalize(String(row.year)) : ''
    const word = typeof row.word === 'string' ? normalize(row.word) : ''
    const meaning = typeof row.meaning === 'string' ? normalize(row.meaning) : ''
    if (!/^[1-9]\d{3}$/.test(year)) { warn('연도는 2025처럼 네 자리 숫자로 입력해 주세요. 이 행은 제외했습니다.'); return }
    if (!word || !meaning) { warn('단어와 뜻이 모두 필요합니다. 이 행은 제외했습니다.'); return }
    if (word.length > 200 || meaning.length > 1000) { warn('단어는 200자, 뜻은 1,000자 이내로 입력해 주세요. 이 행은 제외했습니다.'); return }
    const kanaOnly = isKanaOnly(word)
    let reading: string | undefined
    if (!kanaOnly) {
      if (typeof row.reading !== 'string' || !normalize(row.reading)) { warn(`「${word}」의 요미가나가 없어 제외했습니다. 한자가 포함된 단어는 읽는 법이 필요합니다.`); return }
      reading = normalize(row.reading)
      if (reading.length > 200 || !isKanaOnly(reading)) { warn(`「${word}」의 요미가나는 히라가나 또는 가타카나로 입력해 주세요. 이 행은 제외했습니다.`); return }
    } else if (typeof row.reading === 'string' && row.reading.trim()) {
      warn(`「${word}」은 가나로만 되어 있어 요미가나 칸을 생략했습니다.`)
    }
    let acceptedMeanings: string[] | undefined
    if (row.acceptedMeanings !== undefined && row.acceptedMeanings !== '') {
      const values = Array.isArray(row.acceptedMeanings) ? row.acceptedMeanings
        : typeof row.acceptedMeanings === 'string' ? row.acceptedMeanings.split('|') : null
      if (!values || values.some((value) => typeof value !== 'string')) {
        warn('정답 별칭은 문자열 배열 또는 |로 구분한 문자열이어야 합니다. 이 행은 제외했습니다.'); return
      }
      acceptedMeanings = [...new Set((values as string[]).map(normalize).filter(Boolean))]
      if (acceptedMeanings.some((value) => value.length > 1000)) { warn('정답 별칭은 각각 1,000자 이내로 입력해 주세요. 이 행은 제외했습니다.'); return }
      if (!acceptedMeanings.length) acceptedMeanings = undefined
    }
    const identity = JSON.stringify([year, word, meaning, reading ?? '', [...(acceptedMeanings ?? [])].sort()])
    const id = stableId(identity)
    if (seen.has(id)) { warn(`「${word}」은 같은 내용의 중복 단어여서 한 번만 추가했습니다.`); return }
    seen.add(id)
    words.push({
      id, year, word, meaning, ...(reading ? { reading } : {}),
      ...(acceptedMeanings ? { acceptedMeanings } : {}), source: filename,
      reviewStatus: 'pending', reviewNote: '가나 표기 형식만 확인했습니다. 단어와 요미가나의 실제 일치는 사전 또는 원문 대조가 필요합니다.',
    })
  })
  if (!words.length) {
    throw new Error(warnings.length ? `불러올 수 있는 단어가 없습니다. ${warnings.slice(0, 3).join(' ')}` : '파일에 단어가 없습니다. 제목 아래에 단어를 추가해 주세요.')
  }
  return { words, warnings }
}
