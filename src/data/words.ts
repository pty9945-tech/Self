export type Word = {
  id: string
  year: string
  word: string
  meaning: string
  reading?: string
  acceptedMeanings?: string[]
  source?: string
  reviewStatus: 'sample' | 'pending' | 'verified'
  reviewNote?: string
}

/** Demonstration vocabulary. These entries do not come from an uploaded file. */
export const sampleWords: Word[] = [
  { id: 'sample-sakura', year: 'sample', word: '桜', meaning: '벚꽃', reading: 'さくら', reviewStatus: 'sample' },
  { id: 'sample-haru', year: 'sample', word: '春', meaning: '봄', reading: 'はる', reviewStatus: 'sample' },
  { id: 'sample-hana', year: 'sample', word: '花', meaning: '꽃', reading: 'はな', reviewStatus: 'sample' },
  { id: 'sample-sora', year: 'sample', word: '空', meaning: '하늘', reading: 'そら', reviewStatus: 'sample' },
  { id: 'sample-yume', year: 'sample', word: '夢', meaning: '꿈', reading: 'ゆめ', reviewStatus: 'sample' },
  { id: 'sample-neko', year: 'sample', word: '猫', meaning: '고양이', reading: 'ねこ', reviewStatus: 'sample' },
  { id: 'sample-tomodachi', year: 'sample', word: '友達', meaning: '친구', reading: 'ともだち', reviewStatus: 'sample' },
  { id: 'sample-gakkou', year: 'sample', word: '学校', meaning: '학교', reading: 'がっこう', reviewStatus: 'sample' },
  { id: 'sample-toshokan', year: 'sample', word: '図書館', meaning: '도서관', reading: 'としょかん', reviewStatus: 'sample' },
  { id: 'sample-densha', year: 'sample', word: '電車', meaning: '전철', reading: 'でんしゃ', acceptedMeanings: ['전동차'], reviewStatus: 'sample' },
  { id: 'sample-shashin', year: 'sample', word: '写真', meaning: '사진', reading: 'しゃしん', reviewStatus: 'sample' },
  { id: 'sample-ryokou', year: 'sample', word: '旅行', meaning: '여행', reading: 'りょこう', reviewStatus: 'sample' },
  { id: 'sample-yasashii', year: 'sample', word: '優しい', meaning: '상냥하다', reading: 'やさしい', acceptedMeanings: ['다정하다', '친절하다'], reviewStatus: 'sample' },
  { id: 'sample-tanoshii', year: 'sample', word: '楽しい', meaning: '즐겁다', reading: 'たのしい', reviewStatus: 'sample' },
  { id: 'sample-aruku', year: 'sample', word: '歩く', meaning: '걷다', reading: 'あるく', reviewStatus: 'sample' },
  { id: 'sample-manabu', year: 'sample', word: '学ぶ', meaning: '배우다', reading: 'まなぶ', acceptedMeanings: ['학습하다'], reviewStatus: 'sample' },
  { id: 'sample-arigatou', year: 'sample', word: 'ありがとう', meaning: '고마워', acceptedMeanings: ['고맙다', '감사합니다', '고마워요'], reviewStatus: 'sample' },
  { id: 'sample-ohayou', year: 'sample', word: 'おはよう', meaning: '좋은 아침', acceptedMeanings: ['좋은 아침이에요', '안녕'], reviewStatus: 'sample' },
  { id: 'sample-coffee', year: 'sample', word: 'コーヒー', meaning: '커피', reviewStatus: 'sample' },
  { id: 'sample-camera', year: 'sample', word: 'カメラ', meaning: '카메라', reviewStatus: 'sample' },
  { id: 'sample-icecream', year: 'sample', word: 'アイスクリーム', meaning: '아이스크림', reviewStatus: 'sample' },
  { id: 'sample-slowly', year: 'sample', word: 'ゆっくり', meaning: '천천히', acceptedMeanings: ['느긋하게'], reviewStatus: 'sample' },
]
