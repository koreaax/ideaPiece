import { StoryScene } from './story-types';

/**
 * 완성된 동화를 localStorage에 저장/조회/삭제하는 유틸
 * 100% 클라이언트 사이드, SSR 안전.
 */

export type SavedStory = {
  id: string; // 저장 시점의 story_id 또는 새 uuid
  childName: string;
  topic: string; // 생성 당시 주제 (표시용)
  scenes: StoryScene[]; // 전체 병합된 씬 (1~6페이지)
  endingMessage: string;
  selectedChoice: string;
  savedAt: number; // Date.now()
};

const STORAGE_KEY = 'ideapiece:saved-stories';
const MAX_SAVED = 5;

/**
 * localStorage 접근 가능 여부 확인 (프라이빗 모드 등에서 예외가 날 수 있어 실제 쓰기 테스트)
 */
export function isStorageSupported(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const testKey = '__ideapiece_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function isValidSavedStory(value: unknown): value is SavedStory {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;

  return (
    typeof item.id === 'string' &&
    typeof item.childName === 'string' &&
    typeof item.topic === 'string' &&
    Array.isArray(item.scenes) &&
    typeof item.endingMessage === 'string' &&
    typeof item.selectedChoice === 'string' &&
    typeof item.savedAt === 'number'
  );
}

/**
 * 저장된 동화 목록을 최신순으로 조회
 */
export function getSavedStories(): SavedStory[] {
  if (!isStorageSupported()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidSavedStory).sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * 새 동화를 저장 (최대 MAX_SAVED개, 초과 시 오래된 것부터 제거)
 */
export function saveStory(input: Omit<SavedStory, 'id' | 'savedAt'>): SavedStory {
  const newStory: SavedStory = {
    ...input,
    id: generateId(),
    savedAt: Date.now(),
  };

  if (!isStorageSupported()) return newStory;

  try {
    const existing = getSavedStories();
    const updated = [newStory, ...existing].slice(0, MAX_SAVED);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // 용량 초과 등 예외 발생 시 조용히 무시 (객체는 그대로 반환)
  }

  return newStory;
}

/**
 * 특정 동화 삭제
 */
export function deleteSavedStory(id: string): void {
  if (!isStorageSupported()) return;

  try {
    const existing = getSavedStories();
    const filtered = existing.filter((item) => item.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // 조용히 무시
  }
}

/**
 * 전체 삭제
 */
export function clearSavedStories(): void {
  if (!isStorageSupported()) return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 조용히 무시
  }
}

const COMPLETION_LOG_KEY = 'ideapiece:completion-log';
const MAX_COMPLETION_LOG = 200;

export type CompletionLogEntry = {
  date: string; // 'YYYY-MM-DD'
  topic: string;
};

function isValidCompletionLogEntry(value: unknown): value is CompletionLogEntry {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.date === 'string' && typeof item.topic === 'string';
}

function completionTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCompletionLog(): CompletionLogEntry[] {
  if (!isStorageSupported()) return [];
  try {
    const raw = window.localStorage.getItem(COMPLETION_LOG_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCompletionLogEntry);
  } catch {
    return [];
  }
}

/**
 * 동화 완독 시점(엔딩 도달)에 호출. 오늘 날짜로 완독 기록 1건 추가.
 * 저장 개수가 MAX_COMPLETION_LOG를 넘으면 오래된 것부터 제거.
 */
export function logCompletion(topic: string): void {
  if (!isStorageSupported()) return;
  try {
    const existing = getCompletionLog();
    const entry: CompletionLogEntry = { date: completionTodayKey(), topic };
    const updated = [...existing, entry].slice(-MAX_COMPLETION_LOG);
    window.localStorage.setItem(COMPLETION_LOG_KEY, JSON.stringify(updated));
  } catch {
    // 조용히 무시
  }
}

/**
 * 완독 통계 조회: 이번 주(오늘 기준 최근 7일, 오늘 포함) 완독 수와 전체 누적 완독 수
 */
export function getCompletionStats(): { thisWeekCount: number; totalCount: number } {
  const log = getCompletionLog();
  const totalCount = log.length;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  const thisWeekCount = log.filter((entry) => {
    const [year, month, day] = entry.date.split('-').map(Number);
    if (!year || !month || !day) return false;
    const entryDate = new Date(year, month - 1, day);
    return entryDate >= sevenDaysAgo;
  }).length;

  return { thisWeekCount, totalCount };
}
