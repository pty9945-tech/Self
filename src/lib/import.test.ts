import { describe, expect, it } from 'vitest'
import { parseWordFile } from './import'

describe('CSV import', () => {
  it('accepts Korean headers, BOM, CRLF, quoted commas and escaped quotes', () => {
    const csv = '\uFEFF년도,단어,뜻,요미가나,정답별칭\r\n2024,優しい,"상냥하다, 친절하다",やさしい,상냥하다|친절하다\r\n2025,カメラ,"카메라 ""사진기""",,사진기\r\n'
    const { words } = parseWordFile(csv, 'vocabulary.csv')
    expect(words).toHaveLength(2)
    expect(words[0]).toMatchObject({ year: '2024', meaning: '상냥하다, 친절하다', acceptedMeanings: ['상냥하다', '친절하다'] })
    expect(words[1].meaning).toBe('카메라 "사진기"')
    expect(words[1].reading).toBeUndefined()
  })
  it('supports quoted newlines', () => {
    const { words } = parseWordFile('year,word,meaning,reading\n2025,学校,"학교\n배움의 터",がっこう', 'words.csv')
    expect(words[0].meaning).toBe('학교\n배움의 터')
  })
  it('imports aliases from the downloadable Korean template', () => {
    const { words } = parseWordFile('\uFEFF연도,단어,뜻,요미가나,동의어\n2025,ありがとう,고마워,,감사합니다|고맙습니다\n', 'kotoba-template.csv')
    expect(words[0].acceptedMeanings).toEqual(['감사합니다', '고맙습니다'])
  })
  it('skips malformed rows and reports useful Korean warnings', () => {
    const { words, warnings } = parseWordFile('year,word,meaning,reading\n2025,学校,학교,がっこう\n2025,猫,고양이,ねこ,extra\n25,春,봄,はる\n2025,花,꽃,hana\n2025,空,하늘,', 'words.csv')
    expect(words).toHaveLength(1)
    expect(warnings).toHaveLength(4)
    expect(warnings.join(' ')).toContain('네 자리')
    expect(warnings.join(' ')).toContain('요미가나')
  })
  it.each([
    ['word,meaning\n学校,학교', '제목'],
    ['year,word,단어,meaning\n2025,カメラ,カメラ,카메라', '중복'],
    ['year,word,meaning\n2025,カメラ,"카메라', '큰따옴표'],
    ['year,word,meaning\n2025,カメラ,"카메라"x', '따옴표'],
  ])('rejects unusable CSV input', (csv, message) => {
    expect(() => parseWordFile(csv, 'words.csv')).toThrow(message)
  })
})

describe('JSON import and review integrity', () => {
  const row = { year: 2025, word: '学校', meaning: '학교', reading: 'がっこう' }

  it('keeps imported records pending even if the input claims verification', () => {
    const { words } = parseWordFile(JSON.stringify([{ ...row, reviewStatus: 'verified', id: 'untrusted-id' }]), 'words.json')
    expect(words[0].reviewStatus).toBe('pending')
    expect(words[0].reviewNote).toContain('실제 일치')
    expect(words[0].id).not.toBe('untrusted-id')
    expect(words[0].source).toBe('words.json')
  })
  it('validates format without pretending to validate semantic reading accuracy', () => {
    const { words } = parseWordFile(JSON.stringify([{ ...row, reading: 'ねこ' }]), 'words.json')
    expect(words[0].reviewStatus).toBe('pending')
    expect(words[0].reading).toBe('ねこ')
  })
  it('deduplicates identical content with stable IDs across filenames and order', () => {
    const first = parseWordFile(JSON.stringify([row, row]), 'first.json')
    const second = parseWordFile(JSON.stringify([{ year: 2024, word: '猫', meaning: '고양이', reading: 'ねこ' }, row]), 'second.json')
    expect(first.words).toHaveLength(1)
    expect(first.warnings[0]).toContain('중복')
    expect(first.words[0].id).toBe(second.words[1].id)
  })
  it('omits supplied readings for kana-only words, including half-width kana', () => {
    const { words, warnings } = parseWordFile(JSON.stringify([{ year: '2024', word: 'ｶﾒﾗ', meaning: '카메라', reading: 'かめら' }]), 'words.json')
    expect(words[0].word).toBe('カメラ')
    expect(words[0].reading).toBeUndefined()
    expect(warnings[0]).toContain('생략')
  })
  it('accepts Korean JSON property names and meaning alias arrays', () => {
    const { words } = parseWordFile(JSON.stringify([{ 연도: 2025, 단어: '学校', 뜻: '학교', 요미가나: 'がっこう', 유의어: ['배움의 터'] }]), 'words.json')
    expect(words[0].acceptedMeanings).toEqual(['배움의 터'])
  })
  it.each([
    [{ ...row, year: '0000' }, '연도'],
    [{ ...row, year: '2025.5' }, '연도'],
    [{ ...row, meaning: '' }, '뜻'],
    [{ ...row, reading: undefined }, '요미가나'],
    [{ ...row, reading: 'school' }, '가타카나'],
    [{ ...row, acceptedMeanings: [123] }, '별칭'],
  ])('rejects a file with no valid rows', (invalidRow, message) => {
    expect(() => parseWordFile(JSON.stringify([invalidRow]), 'words.json')).toThrow(message)
  })
  it.each([
    ['{', 'words.json', 'JSON 형식'],
    ['{}', 'words.json', '배열'],
    ['', 'words.csv', '비어'],
    ['[]', 'words.json', '단어가 없습니다'],
    ['anything', 'words.txt', 'CSV 또는 JSON'],
  ])('rejects an invalid file', (content, filename, message) => {
    expect(() => parseWordFile(content, filename)).toThrow(message)
  })
})
