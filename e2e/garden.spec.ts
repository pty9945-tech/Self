import { expect, test, type Page } from '@playwright/test';

async function navigate(page: Page, name: string) {
  const menu = page.getByRole('button', { name: '메뉴 열기' });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('navigation', { name: '주 메뉴' }).getByRole('button', { name }).click();
}

async function importWords(page: Page) {
  await page.getByRole('button', { name: /새로운 단어를 심어볼까요/ }).click();
  await page.getByLabel('단어 파일 선택').setInputFiles({
    name: 'study.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('연도,단어,뜻,요미가나,동의어\n2023,電車,전철,でんしゃ,전동차\n2024,ありがとう,고마워,,감사합니다|고맙습니다\n'),
  });
  await expect(page.getByText('2개 단어를 찾았어요')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: '가져오기', exact: true }).click();
  await expect(page.getByRole('heading', { name: '차곡차곡, 나의 단어장' })).toBeVisible();
}

async function exitQuiz(page: Page) {
  await page.getByRole('dialog').getByRole('button', { name: '닫기', exact: true }).click();
  const exit = page.getByRole('button', { name: '학습 나가기', exact: true });
  if (await exit.isVisible()) await exit.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  // Keep the word order and chosen blank reproducible while exercising real UI flows.
  await page.addInitScript(() => { Math.random = () => 0.99999; });
  await page.goto('/');
});

test('home and navigation fit the screen', async ({ page }, testInfo) => {
  await expect(page.getByRole('heading', { name: /오늘도, 한 단어씩 피워볼까요/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '오늘의 학습 시작' })).toBeVisible();
  await expect(page.getByText('예시 단어 22개로 시작해요')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `/tmp/kotoba-${testInfo.project.name}.png`, fullPage: true });
  await navigate(page, '단어장');
  await expect(page.getByRole('table')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('typing an answer gives feedback and advances to a fresh question', async ({ page }) => {
  await page.getByRole('button', { name: '오늘의 학습 시작' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.quiz-field')).toHaveCount(3);
  await expect(dialog.getByText('桜', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '정답 확인' })).toBeDisabled();
  await dialog.getByLabel('요미가나 정답').fill('   ');
  await expect(dialog.getByRole('button', { name: '정답 확인' })).toBeDisabled();
  await dialog.getByLabel('요미가나 정답').fill('サクラ');
  await dialog.getByLabel('요미가나 정답').press('Enter');
  await expect(dialog.getByRole('status')).toHaveText('잘했어요! 정답이에요.');
  await expect(dialog.getByLabel('요미가나 정답')).toHaveAttribute('readonly', '');
  await dialog.getByRole('button', { name: '다음 단어' }).press('Enter');
  await expect(dialog.getByText('春', { exact: true })).toBeVisible();
  await expect(dialog.getByLabel('요미가나 정답')).toHaveValue('');
  await expect(dialog.getByRole('button', { name: '정답 확인' })).toBeDisabled();
});

test('IME confirmation Enter does not submit the unfinished answer', async ({ page }) => {
  await page.getByRole('button', { name: '오늘의 학습 시작' }).click();
  const answer = page.getByLabel('요미가나 정답');
  await answer.fill('さくら');
  await answer.dispatchEvent('compositionstart', { data: 'さくら' });
  await answer.press('Enter');
  await expect(page.getByRole('dialog').getByRole('status')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '정답 확인' })).toBeVisible();
  await answer.dispatchEvent('compositionend', { data: 'さくら' });
  await answer.press('Enter');
  await expect(page.getByRole('dialog').getByRole('status')).toHaveText('잘했어요! 정답이에요.');
});

test('wrong answers are persisted in the review notebook', async ({ page }) => {
  await page.getByRole('button', { name: '오늘의 학습 시작' }).click();
  await page.getByLabel('요미가나 정답').fill('wrong');
  await page.getByRole('button', { name: '정답 확인' }).click();
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('정답: さくら');
  await exitQuiz(page);
  await navigate(page, '복습 노트');
  await expect(page.getByRole('heading', { name: '桜', exact: true })).toBeVisible();
  await page.reload();
  await navigate(page, '복습 노트');
  await expect(page.getByRole('heading', { name: '桜', exact: true })).toBeVisible();
  // Review must target the failed reading even when fresh randomization would choose the word.
  await page.evaluate(() => { Math.random = () => 0; });
  await page.getByRole('button', { name: '다시 공부하기' }).click();
  await page.getByLabel('요미가나 정답').fill('さくら');
  await page.getByRole('button', { name: '정답 확인' }).click();
  await page.getByRole('button', { name: '학습 결과 보기' }).click();
  await expect(page.getByRole('heading', { name: '오늘도 한 뼘 자랐어요!' })).toBeVisible();
  await page.getByRole('button', { name: '정원으로 돌아가기' }).click();
  await expect(page.getByRole('heading', { name: '기억의 정원이 잘 자라고 있어요' })).toBeVisible();
});

test('imports organize years, require review, and teach kana-only words with synonyms', async ({ page }) => {
  await importWords(page);
  const filter = page.getByRole('combobox', { name: '연도 필터' });
  await expect(filter.locator('option')).toHaveText(['전체 연도', '2024년', '2023년', '예시 단어']);
  await filter.selectOption('2024');
  await expect(page.getByRole('row')).toHaveCount(2);
  await expect(page.getByRole('cell', { name: 'ありがとう', exact: true })).toBeVisible();
  await navigate(page, '나의 정원');
  await page.getByRole('group', { name: '단어장 연도 선택' }).getByRole('button', { name: '전체', exact: true }).click();
  const pendingDeck = page.locator('.deck-card').filter({ has: page.getByRole('heading', { name: '2024년 단어장' }) });
  await expect(pendingDeck.getByRole('button', { name: '요미가나 검수하기' })).toBeVisible();
  await pendingDeck.getByRole('button', { name: '요미가나 검수하기' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('row').filter({ has: page.getByRole('cell', { name: 'ありがとう', exact: true }) }).getByRole('button', { name: '검수하기' }).click();
  await expect(page.getByRole('dialog').getByText('가나로만 된 단어이므로 요미가나 문제를 내지 않아요.')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('textbox')).toHaveCount(2);
  await page.getByRole('button', { name: '확인하고 저장' }).click();
  await expect(page.getByRole('alert')).toHaveText('원문이나 사전으로 읽기를 확인한 후 체크해 주세요.');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '확인하고 저장' }).click();
  await expect(page.getByRole('row').filter({ has: page.getByRole('cell', { name: 'ありがとう', exact: true }) }).getByRole('button', { name: '확인됨' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '오늘의 학습 시작' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.quiz-field')).toHaveCount(2);
  await expect(dialog.getByText('ありがとう', { exact: true })).toBeVisible();
  await expect(dialog.locator('.quiz-topline')).toContainText('1 / 1');
  await dialog.getByLabel('뜻 정답').fill('감 사 합니다!');
  await dialog.getByRole('button', { name: '정답 확인' }).click();
  await expect(dialog.locator('.answer-feedback')).toHaveText('잘했어요! 정답이에요.');
  await dialog.getByRole('button', { name: '학습 결과 보기' }).click();
  await dialog.getByRole('button', { name: '정원으로 돌아가기' }).click();
  await navigate(page, '단어장');
  await page.getByRole('combobox', { name: '연도 필터' }).selectOption('2023');
  await expect(page.getByRole('row').filter({ has: page.getByRole('cell', { name: '電車', exact: true }) }).getByRole('button', { name: '검수하기' })).toBeVisible();
});

test('reimporting a source preserves its reviewed corrections without duplicate entries', async ({ page }) => {
  await importWords(page);
  await page.getByRole('combobox', { name: '연도 필터' }).selectOption('2023');
  await page.getByRole('row').filter({ has: page.getByRole('cell', { name: '電車', exact: true }) }).getByRole('button', { name: '검수하기' }).click();
  const editor = page.getByRole('dialog');
  await editor.getByLabel('뜻', { exact: true }).fill('전동차');
  await editor.getByLabel('요미가나', { exact: true }).fill('デンシャ');
  await editor.getByRole('checkbox').check();
  await editor.getByRole('button', { name: '확인하고 저장' }).click();
  await navigate(page, '나의 정원');
  await importWords(page);
  await expect(page.getByRole('status')).toContainText('0개 단어를 가져왔어요. 중복 단어는 제외했어요.');
  await page.getByRole('combobox', { name: '연도 필터' }).selectOption('2023');
  await expect(page.getByRole('row')).toHaveCount(2);
  await expect(page.getByRole('cell', { name: '전동차', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'デンシャ', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '확인됨', exact: true })).toBeVisible();
});
