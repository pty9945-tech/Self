import type { Word } from '../data/words'

export type QuizField = 'word' | 'meaning' | 'reading'
export type Question = { id: string; word: Word; field: QuizField }

const normalizeText = (value: string): string => value.normalize('NFKC').trim()

/** Kana letters plus the long-vowel/iteration marks, but not whitespace or punctuation. */
export function isKanaOnly(value: string): boolean {
  const normalized = normalizeText(value)
  return /[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(normalized)
    && /^[\p{Script=Hiragana}\p{Script=Katakana}ー\u3099\u309A]+$/u.test(normalized)
}

export function fieldsForWord(word: Word): QuizField[] {
  return word.reading?.trim() && !isKanaOnly(word.word)
    ? ['word', 'meaning', 'reading']
    : ['word', 'meaning']
}

function randomIndex(size: number, rng: () => number): number {
  return Math.max(0, Math.min(size - 1, Math.floor(rng() * size)))
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1, rng)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Each word appears once per shuffled deck; the hidden field is chosen independently. */
export function createQuestions(words: Word[], count = 10, rng: () => number = Math.random): Question[] {
  const uniqueWords = [...new Map(words.map((word) => [word.id, word])).values()]
  if (!uniqueWords.length || !Number.isFinite(count) || count < 1) return []
  const questions: Question[] = []
  const target = Math.floor(count)
  while (questions.length < target) {
    const deck = shuffle(uniqueWords, rng)
    if (deck.length > 1 && deck[0].id === questions.at(-1)?.word.id) {
      ;[deck[0], deck[1]] = [deck[1], deck[0]]
    }
    for (const word of deck) {
      const fields = fieldsForWord(word)
      questions.push({ id: `${word.id}-${questions.length}`, word, field: fields[randomIndex(fields.length, rng)] })
      if (questions.length === target) break
    }
  }
  return questions
}

function normalizeReading(value: string): string {
  return normalizeText(value).replace(/[\u30A1-\u30F6\u30FD-\u30FE]/g, (character) =>
    String.fromCharCode(character.charCodeAt(0) - 0x60))
}

function normalizeMeaning(value: string): string {
  return normalizeText(value).toLocaleLowerCase('ko').replace(/[\s\p{P}]/gu, '')
}

/** Readings accept equivalent kana scripts; Japanese spellings still require the actual word. */
export function checkAnswer(word: Word, field: QuizField, input: string): boolean {
  if (!normalizeText(input)) return false
  if (field === 'reading') {
    return Boolean(word.reading) && normalizeReading(input) === normalizeReading(word.reading!)
  }
  if (field === 'meaning') {
    const answer = normalizeMeaning(input)
    return Boolean(answer) && [word.meaning, ...(word.acceptedMeanings ?? [])]
      .some((meaning) => normalizeMeaning(meaning) === answer)
  }
  return normalizeText(input) === normalizeText(word.word)
}
