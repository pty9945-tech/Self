import type { Word } from '../data/words';

export interface Attempt { wordId: string; field: 'word' | 'meaning' | 'reading'; correct: boolean; date: string }
export interface GardenState { words: Word[]; attempts: Attempt[] }
const KEY = 'kotoba-garden-v1';

export function loadGarden(): GardenState {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (!raw || typeof raw !== 'object') return { words: [], attempts: [] };
    const candidate = raw as Partial<GardenState>;
    const words = Array.isArray(candidate.words) ? candidate.words.filter((word): word is Word =>
      !!word && typeof word.id === 'string' && typeof word.word === 'string' && typeof word.meaning === 'string' && typeof word.year === 'string' &&
      ['sample', 'pending', 'verified'].includes(word.reviewStatus) && (word.reading === undefined || typeof word.reading === 'string') &&
      (word.acceptedMeanings === undefined || (Array.isArray(word.acceptedMeanings) && word.acceptedMeanings.every(value => typeof value === 'string')))
    ) : [];
    const attempts = Array.isArray(candidate.attempts) ? candidate.attempts.filter((attempt): attempt is Attempt =>
      !!attempt && typeof attempt.wordId === 'string' && typeof attempt.correct === 'boolean' && typeof attempt.date === 'string' && ['word', 'meaning', 'reading'].includes(attempt.field)
    ) : [];
    return { words, attempts };
  } catch { return { words: [], attempts: [] }; }
}

export function saveGarden(state: GardenState): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}
