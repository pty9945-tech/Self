import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, BookOpen, Check, CheckCheck, ChevronRight, CircleHelp, FileText, Flower2, Home, Leaf, LibraryBig, ListFilter, Menu, Plus, RotateCcw, Search, ShieldCheck, Sparkles, Sprout, Target, Upload, X } from 'lucide-react';
import GardenScene from './components/GardenScene';
import SakuraMark from './components/SakuraMark';
import Modal from './components/Modal';
import { sampleWords, type Word } from './data/words';
import { checkAnswer, createQuestions, fieldsForWord, isKanaOnly, type Question, type QuizField } from './lib/quiz';
import { parseWordFile } from './lib/import';
import { loadGarden, saveGarden, type Attempt } from './lib/storage';

type Page = 'home' | 'words' | 'review';
type Session = { questions: Question[]; index: number; results: boolean[]; label: string };
const fieldNames: Record<QuizField, string> = { word: '단어', meaning: '뜻', reading: '요미가나' };
const yearLabel = (year: string) => year === 'sample' ? '예시 단어장' : `${year}년 단어장`;

function download(name: string, data: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export default function App() {
  const [stored] = useState(loadGarden);
  const [words, setWords] = useState<Word[]>(stored.words);
  const [attempts, setAttempts] = useState<Attempt[]>(stored.attempts);
  const [page, setPage] = useState<Page>('home');
  const [year, setYear] = useState('all');
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [editing, setEditing] = useState<Word | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [storageFailed, setStorageFailed] = useState(false);
  const allWords = useMemo(() => [...words, ...sampleWords], [words]);
  const years = useMemo(() => [...new Set(words.map(word => word.year))].sort((a, b) => b.localeCompare(a)), [words]);
  const learned = new Set(attempts.filter(attempt => attempt.correct).map(attempt => attempt.wordId)).size;
  const accuracy = attempts.length ? Math.round(attempts.filter(attempt => attempt.correct).length / attempts.length * 100) : 0;
  const lastAnswers = new Map<string, boolean>();
  attempts.forEach(attempt => lastAnswers.set(`${attempt.wordId}:${attempt.field}`, attempt.correct));
  const missed = new Set([...lastAnswers].filter(([, correct]) => !correct).map(([key]) => key.slice(0, key.lastIndexOf(':'))));
  const reviewWords = allWords.filter(word => missed.has(word.id));
  const visibleWords = allWords.filter(word => (year === 'all' || word.year === year) && `${word.word} ${word.meaning} ${word.reading ?? ''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

  useEffect(() => { setStorageFailed(!saveGarden({ words, attempts })); }, [words, attempts]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 5000); return () => clearTimeout(timer); }, [toast]);
  const navigate = (next: Page) => { setPage(next); setMenuOpen(false); setSearch(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const start = (pool: Word[], label: string) => {
    const eligible = pool.filter(word => word.reviewStatus !== 'pending');
    if (!eligible.length) { setToast('단어장에서 요미가나 검수를 완료하면 학습할 수 있어요.'); return; }
    setSession({ questions: createQuestions(eligible, Math.min(10, eligible.length)), index: 0, results: [], label });
  };
  const beginToday = () => {
    const verified = words.filter(word => word.reviewStatus === 'verified');
    start(verified.length ? verified : sampleWords, verified.length ? '오늘의 학습' : '예시 단어 학습');
  };
  const beginReview = (pool: Word[]) => {
    const questions: Question[] = pool.filter(word => word.reviewStatus !== 'pending').flatMap(word =>
      fieldsForWord(word).filter(field => lastAnswers.get(`${word.id}:${field}`) === false).map(field => ({ id: `review-${word.id}-${field}`, word, field })));
    for (let index = questions.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [questions[index], questions[other]] = [questions[other], questions[index]];
    }
    if (questions.length) setSession({ questions: questions.slice(0, 10), index: 0, results: [], label: '복습 노트' });
  };
  const onAnswer = (correct: boolean) => {
    if (!session || session.results.length > session.index) return;
    const current = session.questions[session.index];
    setAttempts(previous => [...previous, { wordId: current.word.id, field: current.field, correct, date: new Date().toISOString() }]);
    setSession({ ...session, results: [...session.results, correct] });
  };

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
    {menuOpen && <button className="nav-scrim" onClick={() => setMenuOpen(false)} aria-label="메뉴 닫기" />}
    <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
      <button className="brand" onClick={() => navigate('home')} aria-label="코토바 정원 홈"><SakuraMark /><span><strong>코토바 정원</strong><small>ことばの庭</small></span></button>
      <div className="sidebar-divider" />
      <span className="nav-label">MY LEARNING</span>
      <nav aria-label="주 메뉴">
        <button className={`nav-item ${page === 'home' ? 'active' : ''}`} onClick={() => navigate('home')}><Home size={19} />나의 정원<ChevronRight className="nav-chevron" size={15} /></button>
        <button className={`nav-item ${page === 'words' ? 'active' : ''}`} onClick={() => navigate('words')}><LibraryBig size={19} />단어장<span className="nav-count">{allWords.length}</span></button>
        <button className={`nav-item ${page === 'review' ? 'active' : ''}`} onClick={() => navigate('review')}><RotateCcw size={19} />복습 노트{reviewWords.length > 0 && <span className="nav-count">{reviewWords.length}</span>}</button>
      </nav>
      <div className="sidebar-bottom">
        <div className="daily-note"><div className="note-sprout"><Sprout size={29} strokeWidth={1.4} /></div><span className="little-japanese" lang="ja">一日、一歩。</span><strong>조금씩, 매일.</strong><p>오늘 심은 작은 단어가<br />내일의 실력이 될 거예요.</p><span className="note-petal">✿</span></div>
        <button className="about-link" onClick={() => setAboutOpen(true)}><CircleHelp size={17} />이 정원에 대해</button>
        <p className="sidebar-copyright">작은 배움이 피어나는 곳</p>
      </div>
    </aside>

    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" aria-label="메뉴 열기" onClick={() => setMenuOpen(true)}><Menu size={22} /></button><Flower2 size={17} /><span>나의 일본어 공부</span><ChevronRight size={13} /><strong>{page === 'home' ? '나의 정원' : page === 'words' ? '단어장' : '복습 노트'}</strong></div><div className="topbar-right"><span className="today-date">{today}</span><div className="profile-flower" aria-label="나의 정원"><Flower2 size={21} /></div></div></header>
      <main id="main-content" className="main-content">
        {storageFailed && <div className="notice warning" role="alert">브라우저에 저장할 수 없어요. 단어장의 ‘내보내기’로 단어를 보관해 주세요. 이 창을 닫으면 현재 학습 기록이 사라질 수 있어요.</div>}
        {page === 'home' && <>
          <section className="page-heading"><div><div className="eyebrow">YOUR LITTLE JAPANESE GARDEN</div><h1>오늘도, 한 단어씩 피워볼까요?<span className="heading-flower">✿</span></h1><p>서두르지 않아도 괜찮아요. 나만의 속도로 일본어와 가까워져요.</p></div></section>
          <section className="hero">
            <div className="hero-copy"><span className="hero-tag"><span />매일 자라는 나의 일본어</span><h2>단어를 심고,<br />실력을 피우세요.</h2><p>빈칸을 채우며 기억하는 즐거움.<br />작은 배움이 모여, 어느새 풍성한 정원이 돼요.</p><button className="primary-button hero-button" onClick={beginToday}>오늘의 학습 시작<ArrowRight size={18} /></button><span className="hero-footnote">하루 10단어, 나만의 작은 습관</span></div>
            <GardenScene className="hero-art" /><span className="hero-stamp" lang="ja">日々<br />成長</span>
          </section>
          <section className="stats-grid" aria-label="학습 현황">
            <Stat icon={<BookOpen size={21} />} label="정원에 심은 단어" value={allWords.length} unit="개" detail={words.length ? `내 단어 ${words.length}개 · 예시 ${sampleWords.length}개` : `예시 단어 ${sampleWords.length}개로 시작해요`} color="rose" />
            <Stat icon={<Sprout size={23} />} label="한 번 이상 맞힌 단어" value={learned} unit="개" detail={learned ? '기억의 새싹이 자라고 있어요' : '첫 번째 새싹을 틔워보세요'} color="sage" />
            <Stat icon={<Target size={22} />} label="나의 정답률" value={accuracy} unit="%" detail={attempts.length ? `${attempts.length}문제에 도전했어요` : '학습을 시작하면 기록돼요'} color="sand" />
          </section>
          <section className="collection-section">
            <div className="section-heading"><div><h2>나의 단어장 <span>ことばの本棚</span></h2><p>연도별로 차곡차곡, 배우고 싶은 단어장을 골라보세요.</p></div><button className="text-button" onClick={() => navigate('words')}>전체 보기<ArrowRight size={16} /></button></div>
            <div className="year-tabs" role="group" aria-label="단어장 연도 선택"><button className={year === 'all' ? 'selected' : ''} onClick={() => setYear('all')}>전체</button>{years.map(value => <button key={value} className={year === value ? 'selected' : ''} onClick={() => setYear(value)}>{value}년</button>)}<button className={year === 'sample' ? 'selected' : ''} onClick={() => setYear('sample')}>예시 단어장</button></div>
            <div className="lower-grid"><div>
              <div className="deck-grid">
                {[...years, 'sample'].filter(value => year === 'all' || year === value).map(value => {
                  const deckWords = allWords.filter(word => word.year === value);
                  const answered = new Set(attempts.filter(attempt => attempt.correct && deckWords.some(word => word.id === attempt.wordId)).map(attempt => attempt.wordId)).size;
                  const pending = deckWords.filter(word => word.reviewStatus === 'pending').length;
                  return <article className={`deck-card ${value === 'sample' ? 'sample-deck' : ''}`} key={value}><div className="deck-top"><div className="deck-icon"><BookOpen size={23} strokeWidth={1.5} /></div><span className={`pill ${pending ? 'pill-amber' : ''}`}>{value === 'sample' ? '체험용' : pending ? `${pending}개 검수 대기` : '검수 완료'}</span></div><h3>{yearLabel(value)}</h3><p>{value === 'sample' ? '봄처럼 가볍게, 첫 일본어 공부' : '차곡차곡 모아둔 나의 일본어 단어'}</p><div className="deck-meta"><span>{deckWords.length}개 단어</span><span>{answered}/{deckWords.length}개 학습</span></div><div className="progress-track"><span style={{ width: `${answered / deckWords.length * 100}%` }} /></div><button className="deck-action" onClick={() => { if (pending === deckWords.length) { setYear(value); navigate('words'); } else start(deckWords, yearLabel(value)); }}>{pending === deckWords.length ? '요미가나 검수하기' : '이 단어장 학습하기'}<ArrowRight size={16} /></button></article>;
                })}
                <button className="add-deck" onClick={() => setImportOpen(true)}><span className="add-deck-icon"><Plus size={24} /></span><strong>새로운 단어를 심어볼까요?</strong><span>단어 파일을 가져오면<br />연도별로 정리해 드려요.</span><span className="add-deck-link">단어 가져오기<ArrowRight size={14} /></span></button>
              </div>
              {!words.length && <p className="sample-note"><CircleHelp size={14} />지금은 예시 단어장이에요. 실제 자료를 추가해 나만의 정원을 만들어보세요.</p>}
            </div><aside className="how-card"><span className="how-eyebrow"><Sparkles size={15} />작은 공부 안내서</span><h3>읽고, 떠올리고, 채우기.</h3><p>세 부분 중 랜덤으로 비워진<br />한 칸을 직접 입력해 보세요.</p><div className="mini-quiz"><span lang="ja">桜</span><span className="mini-blank">?</span><span lang="ja">さくら</span></div><div className="mini-labels"><span>단어</span><span>뜻</span><span>요미가나</span></div><div className="how-divider" /><p className="how-tip"><Leaf size={16} />가나로만 된 단어는<br />단어와 뜻, 두 칸으로 공부해요.</p></aside></div>
          </section>
          <div className="bottom-message"><span /> <Flower2 size={16} /><p lang="ja">千里の道も一歩から</p><span /><small>천 리 길도 한 걸음부터</small></div>
        </>}

        {page === 'words' && <>
          <div className="page-heading page-heading-actions"><div><div className="eyebrow">MY WORD COLLECTION</div><h1>차곡차곡, 나의 단어장</h1><p>연도별 단어를 살펴보고, 요미가나를 확인해 주세요.</p></div><button className="primary-button" onClick={() => setImportOpen(true)}><Plus size={18} />단어 가져오기</button></div>
          <div className="notice"><ShieldCheck size={20} /><span>가져온 단어는 <strong>검수 대기</strong>로 등록돼요. 원문·사전으로 읽기를 확인하고 저장하면 학습에 포함됩니다.</span></div>
          <div className="word-toolbar"><label className="search-box"><Search size={18} /><input placeholder="단어, 뜻, 요미가나 검색" value={search} onChange={event => setSearch(event.target.value)} /></label><label className="select-wrap"><ListFilter size={17} /><select aria-label="연도 필터" value={year} onChange={event => setYear(event.target.value)}><option value="all">전체 연도</option>{years.map(value => <option key={value} value={value}>{value}년</option>)}<option value="sample">예시 단어</option></select></label><button className="secondary-button export-button" onClick={() => { if (!words.length) { setToast('가져온 단어가 아직 없어요.'); return; } download('kotoba-words.json', JSON.stringify(words.map(({ year: wordYear, word, meaning, reading, acceptedMeanings }) => ({ year: wordYear, word, meaning, reading, acceptedMeanings })), null, 2), 'application/json'); }}><ArrowDownToLine size={17} />내보내기</button></div>
          <div className="word-table-container"><table className="word-table"><thead><tr><th>단어</th><th>뜻</th><th>요미가나</th><th>연도</th><th>검수</th></tr></thead><tbody>{visibleWords.map(word => <tr key={word.id}><td lang="ja" className="table-word">{word.word}</td><td>{word.meaning}</td><td lang="ja">{isKanaOnly(word.word) ? <span className="muted">—</span> : word.reading}</td><td>{word.year === 'sample' ? '예시' : word.year}</td><td>{word.reviewStatus === 'sample' ? <span className="pill">예시</span> : <button className={`review-status ${word.reviewStatus === 'pending' ? 'pending' : 'verified'}`} onClick={() => setEditing(word)}>{word.reviewStatus === 'pending' ? '검수하기' : <><Check size={13} />확인됨</>}</button>}</td></tr>)}</tbody></table>{!visibleWords.length && <div className="empty-state"><Search size={32} /><h3>찾으시는 단어가 없어요</h3><p>다른 검색어나 연도를 선택해 보세요.</p></div>}</div>
          <p className="table-footnote">{visibleWords.length}개 단어 · 예시 단어는 원본 자료에 포함되지 않아요. 가져온 자료는 이 브라우저에만 저장됩니다.</p>
        </>}

        {page === 'review' && <>
          <div className="page-heading page-heading-actions"><div><div className="eyebrow">A LITTLE MORE PRACTICE</div><h1>다시 만나면, 더 오래 기억해요</h1><p>틀린 단어를 다시 채우며 기억의 뿌리를 내려보세요.</p></div>{reviewWords.length > 0 && <button className="primary-button" onClick={() => beginReview(reviewWords)}><RotateCcw size={17} />{reviewWords.length}개 단어 복습</button>}</div>
          {reviewWords.length ? <div className="review-grid">{reviewWords.map(word => <article className="review-card" key={word.id}><span className="pill">{word.year === 'sample' ? '예시 단어' : `${word.year}년`}</span><h2 lang="ja">{word.word}</h2>{!isKanaOnly(word.word) && <p className="reading" lang="ja">{word.reading}</p>}<p>{word.meaning}</p><button className="text-button" onClick={() => beginReview([word])}>다시 공부하기<ArrowRight size={15} /></button></article>)}</div> : <div className="empty-state review-empty"><div className="empty-flower"><Flower2 size={48} strokeWidth={1.2} /></div><h2>{attempts.length ? '기억의 정원이 잘 자라고 있어요' : '아직 복습할 단어가 없어요'}</h2><p>{attempts.length ? '틀린 단어가 생기면 이곳에 모아둘게요.' : '학습 중 틀린 단어는 이곳에 차곡차곡 모여요.'}</p><button className="primary-button" onClick={beginToday}>단어 공부하러 가기<ArrowRight size={17} /></button></div>}
          <div className="notice subtle"><Sprout size={20} /><span>같은 단어에서도 틀렸던 항목을 모두 맞히면 복습 노트에서 사라져요.</span></div>
        </>}
        <footer className="main-footer"><span><SakuraMark />코토바 정원</span><small>한 단어씩, 나만의 속도로.</small></footer>
      </main>
    </div>

    {importOpen && <ImportModal onClose={() => setImportOpen(false)} onImport={incoming => {
      const keys = new Set(words.map(word => `${word.year}\0${word.word}\0${word.reading ?? ''}\0${word.meaning}`));
      const ids = new Set(words.map(word => word.id));
      const fresh = incoming.filter(word => { const key = `${word.year}\0${word.word}\0${word.reading ?? ''}\0${word.meaning}`; if (keys.has(key) || ids.has(word.id)) return false; keys.add(key); ids.add(word.id); return true; });
      setWords(previous => [...previous, ...fresh]); setImportOpen(false); setYear('all'); navigate('words'); setToast(`${fresh.length}개 단어를 가져왔어요.${fresh.length < incoming.length ? ' 중복 단어는 제외했어요.' : ''} 요미가나 검수를 진행해 주세요.`);
    }} />}
    {editing && <ReviewModal word={editing} onClose={() => setEditing(null)} onSave={updated => { setWords(previous => previous.map(word => word.id === updated.id ? updated : word)); setEditing(null); setToast('검수한 내용을 저장했어요.'); }} />}
    {session && <QuizModal session={session} onClose={() => setSession(null)} onAnswer={onAnswer} onNext={() => setSession({ ...session, index: session.index + 1 })} onRetry={() => setSession({ questions: session.questions.filter((_, index) => !session.results[index]), index: 0, results: [], label: '틀린 단어 다시 학습' })} />}
    {aboutOpen && <Modal title="코토바 정원에 오신 걸 환영해요" onClose={() => setAboutOpen(false)}><div className="about-content"><Flower2 size={36} /><p>단어·뜻·요미가나 중 무작위로 비워진 칸을 키보드로 채우며 일본어를 공부하는 작은 정원이에요.</p><p>뜻은 등록된 뜻과 동의어를 정답으로 인정하며 띄어쓰기·문장부호 차이는 허용해요. 요미가나는 히라가나와 가타카나 모두 입력할 수 있어요.</p><p>단어와 학습 기록은 현재 브라우저에 저장돼요. 기기 간 자동 동기화는 없으며, 브라우저 데이터를 삭제하면 기록도 지워집니다. 단어장의 내보내기로 원본 단어를 보관할 수 있어요.</p><p>가져온 단어의 읽기는 원문·사전으로 확인해야 해요. 자동 형식 검사는 요미가나의 의미상 일치를 보장하지 않습니다.</p></div></Modal>}
    {toast && <div className="toast" role="status"><Check size={18} /><span>{toast}</span><button aria-label="알림 닫기" onClick={() => setToast('')}><X size={16} /></button></div>}
  </div>;
}

function Stat({ icon, label, value, unit, detail, color }: { icon: React.ReactNode; label: string; value: number; unit: string; detail: string; color: string }) {
  return <article className="stat-card"><div className={`stat-icon ${color}`}>{icon}</div><div><span className="stat-label">{label}</span><div className="stat-number">{value}<span>{unit}</span></div><p>{detail}</p></div></article>;
}

function ImportModal({ onClose, onImport }: { onClose: () => void; onImport: (words: Word[]) => void }) {
  const [parsed, setParsed] = useState<{ words: Word[]; warnings: string[] } | null>(null);
  const [error, setError] = useState('');
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const readFile = async (file?: File) => {
    if (!file || loading) return;
    setError(''); setParsed(null); setFilename(file.name);
    if (file.size > 2 * 1024 * 1024) { setError('2MB 이하 파일을 선택해 주세요.'); return; }
    setLoading(true);
    try { const content = await file.text(); if (mounted.current) setParsed(parseWordFile(content, file.name)); }
    catch (problem) { if (mounted.current) setError(problem instanceof Error ? problem.message : '파일을 읽지 못했어요. 형식을 확인해 주세요.'); }
    finally { if (mounted.current) setLoading(false); }
  };
  return <Modal title="새로운 단어 가져오기" onClose={onClose}>
    <p className="modal-description">CSV 또는 JSON 파일을 가져오세요. 파일 안의 연도를 기준으로 단어장을 만들어요.</p>
    <input ref={fileRef} className="visually-hidden" type="file" accept=".csv,.json" aria-label="단어 파일 선택" onChange={event => void readFile(event.target.files?.[0])} />
    <button className="drop-zone" disabled={loading} onClick={() => fileRef.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void readFile(event.dataTransfer.files[0]); }}><Upload size={28} /><strong>{loading ? '파일을 읽고 있어요…' : filename || '파일을 선택하거나 여기에 놓아주세요'}</strong><span>CSV · JSON / 최대 2MB</span></button>
    <div className="import-guide"><strong><FileText size={16} />파일에는 이런 정보가 필요해요</strong><code>연도,단어,뜻,요미가나</code><p>가나만 있는 단어는 요미가나를 비워도 돼요.<br />여러 정답은 CSV의 ‘동의어’ 열에서 <code>|</code>로 구분해 주세요.</p><button className="text-button" onClick={() => download('kotoba-template.csv', '\uFEFF연도,단어,뜻,요미가나,동의어\n2025,桜,벚꽃,さくら,\n2025,ありがとう,고마워,,감사합니다|고맙습니다\n', 'text/csv;charset=utf-8')}>CSV 양식 내려받기<ArrowDownToLine size={15} /></button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {parsed && <div className="import-preview" role="status"><strong><CheckCheck size={18} />{parsed.words.length}개 단어를 찾았어요</strong><p>{[...new Set(parsed.words.map(word => word.year))].sort().join('년 · ')}년</p>{parsed.warnings.length > 0 && <ul>{parsed.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}<p>요미가나는 검수 대기로 등록됩니다.</p></div>}
    <div className="modal-actions"><button className="secondary-button" onClick={onClose}>취소</button><button className="primary-button" disabled={!parsed?.words.length || loading} onClick={() => parsed && onImport(parsed.words)}>가져오기<ArrowRight size={16} /></button></div>
  </Modal>;
}

function ReviewModal({ word, onClose, onSave }: { word: Word; onClose: () => void; onSave: (word: Word) => void }) {
  const [reading, setReading] = useState(word.reading ?? '');
  const [meaning, setMeaning] = useState(word.meaning);
  const [aliases, setAliases] = useState(word.acceptedMeanings?.join(' | ') ?? '');
  const [confirmed, setConfirmed] = useState(word.reviewStatus === 'verified');
  const [error, setError] = useState('');
  const kanaOnly = isKanaOnly(word.word);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!meaning.trim() || (!kanaOnly && (!reading.trim() || !isKanaOnly(reading.trim())))) { setError('뜻과 가나로 된 요미가나를 입력해 주세요.'); return; }
    if (!confirmed) { setError('원문이나 사전으로 읽기를 확인한 후 체크해 주세요.'); return; }
    onSave({ ...word, meaning: meaning.trim(), reading: kanaOnly ? undefined : reading.trim(), acceptedMeanings: aliases.split('|').map(value => value.trim()).filter(Boolean), reviewStatus: 'verified', reviewNote: '사용자가 원문·사전으로 확인' });
  };
  return <Modal title="요미가나 검수" onClose={onClose}><form onSubmit={submit} className="review-form"><div className="review-word"><span lang="ja">{word.word}</span><span className="pill">{word.year}년</span></div><p className="modal-description">동음·다독 한자는 문맥에 따라 읽기가 달라져요. 원문이나 신뢰할 수 있는 사전과 대조해 주세요.</p><label>뜻<input value={meaning} onChange={event => { setMeaning(event.target.value); setConfirmed(false); }} required /></label>{!kanaOnly ? <label>요미가나<input lang="ja" value={reading} onChange={event => { setReading(event.target.value); setConfirmed(false); }} required autoComplete="off" /></label> : <p className="notice subtle">가나로만 된 단어이므로 요미가나 문제를 내지 않아요.</p>}<label>뜻의 동의어 <span className="muted">(선택, |로 구분)</span><input value={aliases} onChange={event => setAliases(event.target.value)} /></label><label className="checkbox-label"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /><span>원문·사전으로 단어의 뜻과 읽기를 확인했어요.</span></label>{error && <p role="alert" className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>취소</button><button className="primary-button" type="submit"><ShieldCheck size={17} />확인하고 저장</button></div></form></Modal>;
}

function QuizModal({ session, onClose, onAnswer, onNext, onRetry }: { session: Session; onClose: () => void; onAnswer: (correct: boolean) => void; onNext: () => void; onRetry: () => void }) {
  const [answer, setAnswer] = useState('');
  const [exitConfirm, setExitConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const composing = useRef(false);
  const completed = session.index >= session.questions.length;
  const question = session.questions[session.index];
  const answered = session.results.length > session.index;
  const correct = session.results[session.index];
  useEffect(() => { setAnswer(''); composing.current = false; inputRef.current?.focus(); }, [session.index, session.questions]);
  useEffect(() => { if (answered) nextRef.current?.focus(); }, [answered]);
  const close = () => { if (!completed && session.results.length < session.questions.length) setExitConfirm(true); else onClose(); };
  const submit = (event: FormEvent) => { event.preventDefault(); if (!answer.trim() || composing.current || answered) return; onAnswer(checkAnswer(question.word, question.field, answer)); };
  return <Modal title={session.label} onClose={close} wide>
    {exitConfirm ? <div className="exit-confirm"><Flower2 size={36} /><h3>잠시 쉬어갈까요?</h3><p>지금까지 답한 문제의 기록은 저장돼요.</p><div className="modal-actions"><button className="secondary-button" onClick={() => setExitConfirm(false)}>계속 공부하기</button><button className="primary-button" onClick={onClose}>학습 나가기</button></div></div> : completed ? <div className="quiz-summary"><div className="summary-flower"><Flower2 size={46} /></div><div className="eyebrow">A LITTLE GROWTH, EVERY DAY</div><h2>오늘도 한 뼘 자랐어요!</h2><p>정원에 새로운 기억을 심어주었네요.</p><div className="summary-score">{session.results.filter(Boolean).length}<span> / {session.questions.length}</span></div><p>문제를 맞혔어요</p><div className="modal-actions">{session.results.some(result => !result) && <button className="secondary-button" onClick={onRetry}><RotateCcw size={16} />틀린 단어 다시</button>}<button className="primary-button" onClick={onClose}>정원으로 돌아가기<ArrowRight size={17} /></button></div></div> : <>
      <div className="quiz-topline"><span><Sprout size={16} />작은 기억이 자라는 중</span><strong>{session.index + 1}<span> / {session.questions.length}</span></strong></div><div className="progress-track quiz-progress"><span style={{ width: `${session.index / session.questions.length * 100}%` }} /></div>
      <div className="quiz-instruction"><span className="pill">{question.word.year === 'sample' ? '예시 단어' : `${question.word.year}년`}</span><h3>비어 있는 <em>{fieldNames[question.field]}</em>{question.field === 'meaning' ? '을' : '를'} 채워주세요.</h3><p>기억을 떠올리며, 키보드로 직접 입력해요.</p></div>
      <form onSubmit={submit} className="quiz-form">
        <div className={`quiz-fields ${fieldsForWord(question.word).length === 2 ? 'two-fields' : ''}`}>{fieldsForWord(question.word).map(field => <div key={field} className={`quiz-field ${field === question.field ? 'blank-field' : ''} ${answered && field === question.field ? correct ? 'answer-correct' : 'answer-wrong' : ''}`}><label htmlFor={field === question.field ? 'quiz-answer' : undefined}>{fieldNames[field]}</label>{field === question.field ? <input ref={inputRef} id="quiz-answer" aria-label={`${fieldNames[field]} 정답`} value={answer} onChange={event => setAnswer(event.target.value)} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} onKeyDown={event => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || composing.current || event.keyCode === 229)) event.preventDefault(); }} placeholder={field === 'meaning' ? '뜻을 입력하세요' : '일본어로 입력하세요'} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} readOnly={answered} lang={field === 'meaning' ? 'ko' : 'ja'} /> : <span lang={field === 'meaning' ? 'ko' : 'ja'}>{question.word[field]}</span>}</div>)}</div>
        {answered ? <div className={`answer-feedback ${correct ? 'correct' : 'wrong'}`} role="status"><strong>{correct ? <><Check size={19} />잘했어요! 정답이에요.</> : <><Sprout size={19} />괜찮아요. 한 번 더 기억해 볼까요?</>}</strong>{!correct && <p>정답: <b lang={question.field === 'meaning' ? 'ko' : 'ja'}>{question.word[question.field]}</b></p>}</div> : <p className="quiz-hint">{question.field === 'reading' ? '히라가나 또는 가타카나로 입력해 주세요.' : question.field === 'meaning' ? '등록된 뜻·동의어를 정답으로 인정해요.' : '보이는 뜻에 해당하는 일본어 표기를 입력해 주세요.'}</p>}
        <div className="quiz-actions"><span className="keyboard-hint">Enter ↵ 로 {answered ? '다음 문제' : '정답 확인'}</span>{answered ? <button key="next-question" ref={nextRef} type="button" className="primary-button" onClick={onNext} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); onNext(); } }}>{session.index + 1 === session.questions.length ? '학습 결과 보기' : '다음 단어'}<ArrowRight size={17} /></button> : <button key="check-answer" className="primary-button" type="submit" disabled={!answer.trim()}>정답 확인<Check size={17} /></button>}</div>
      </form>
      <button className="quiz-back" onClick={close}><ArrowLeft size={14} />정원으로 돌아가기</button>
    </>}
  </Modal>;
}
