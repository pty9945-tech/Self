import { describe, expect, it } from 'vitest'
import { sampleWords, type Word } from '../data/words'
import { checkAnswer, createQuestions, fieldsForWord, isKanaOnly } from './quiz'

const word: Word = {
  id: 'school', year: '2025', word: '学校', meaning: '학교', reading: 'がっこう',
  acceptedMeanings: ['배움의 터'], reviewStatus: 'verified',
}

describe('kana-only words', () => {
  it.each(['ありがとう', 'コーヒー', 'ｶﾞｯｺｳ', 'ひらがなカタカナ', 'ゆっくり'])('%s omits a separate reading', (value) => {
    expect(isKanaOnly(value)).toBe(true)
    expect(fieldsForWord({ ...word, word: value })).toEqual(['word', 'meaning'])
  })
  it.each(['', ' ', 'ー', '学校', '優しい', 'ABC', '123', 'あ い', 'あ！'])('%s is not a kana-only word', (value) => {
    expect(isKanaOnly(value)).toBe(false)
  })
  it('keeps three fields for kanji with a reading', () => {
    expect(fieldsForWord(word)).toEqual(['word', 'meaning', 'reading'])
  })
})

describe('typed answer grading', () => {
  it('normalizes reading width and kana script', () => {
    expect(checkAnswer(word, 'reading', ' ｶﾞｯｺｳ ')).toBe(true)
    expect(checkAnswer(word, 'reading', 'ガッコウ')).toBe(true)
    expect(checkAnswer(word, 'reading', 'がっこう')).toBe(true)
    expect(checkAnswer(word, 'reading', 'がこう')).toBe(false)
    expect(checkAnswer(word, 'reading', 'gakkou')).toBe(false)
  })
  it('requires the actual word when its spelling is hidden', () => {
    expect(checkAnswer(word, 'word', ' 学校 ')).toBe(true)
    expect(checkAnswer(word, 'word', 'がっこう')).toBe(false)
    expect(checkAnswer({ ...word, word: 'コーヒー' }, 'word', 'こーひー')).toBe(false)
    expect(checkAnswer({ ...word, word: 'コーヒー' }, 'word', 'ｺｰﾋｰ')).toBe(true)
  })
  it('accepts only registered meanings and aliases, ignoring whitespace and punctuation', () => {
    expect(checkAnswer(word, 'meaning', '학 교!')).toBe(true)
    expect(checkAnswer(word, 'meaning', '배움의터')).toBe(true)
    expect(checkAnswer(word, 'meaning', '공부하는 곳')).toBe(false)
    expect(checkAnswer({ ...word, meaning: 'ABC' }, 'meaning', 'ａｂｃ')).toBe(true)
  })
  it.each(['', ' ', '\n', '！…'])('does not accept an empty meaning answer: %s', (input) => {
    expect(checkAnswer(word, 'meaning', input)).toBe(false)
  })
})

describe('question decks', () => {
  it('uses each word before repeating and avoids adjacent repeats across deck boundaries', () => {
    const deck = sampleWords.slice(0, 4)
    const questions = createQuestions(deck, 13, () => 0)
    expect(questions).toHaveLength(13)
    expect(new Set(questions.map((question) => question.id)).size).toBe(13)
    for (let start = 0; start < 12; start += 4) {
      expect(new Set(questions.slice(start, start + 4).map((question) => question.word.id)).size).toBe(4)
    }
    questions.slice(1).forEach((question, index) => expect(question.word.id).not.toBe(questions[index].word.id))
  })
  it('chooses random fields and never hides a kana-only reading', () => {
    expect(createQuestions([word], 1, () => 0)[0].field).toBe('word')
    expect(createQuestions([word], 1, () => 0.4)[0].field).toBe('meaning')
    expect(createQuestions([word], 1, () => 0.9)[0].field).toBe('reading')
    const kanaWord = { ...word, word: 'カメラ' }
    expect(createQuestions([kanaWord], 1, () => 0.9)[0].field).toBe('meaning')
  })
  it('does not mutate its inputs or loop on an empty deck', () => {
    const original = [...sampleWords]
    createQuestions(original, 10)
    expect(original).toEqual(sampleWords)
    expect(createQuestions([], 10)).toEqual([])
    expect(createQuestions(sampleWords, 0)).toEqual([])
    expect(createQuestions(sampleWords, Infinity)).toEqual([])
  })
})
