/**
 * 부모 모드 설정(하루 사용 제한 시간) + 오늘 누적 사용 시간을 localStorage로 관리하는 유틸.
 * 100% 클라이언트 사이드, SSR 안전. 실제 인증이 아닌 가벼운 부모 확인용 게이트.
 */

export type ParentSettings = {
  dailyLimitMinutes: number | null; // null이면 무제한
};

export type UsageRecord = {
  date: string; // 'YYYY-MM-DD' (로컬 기준)
  usedMs: number; // 오늘 누적 사용 시간 (밀리초)
};

const SETTINGS_KEY = 'ideapiece:parent-settings';
const USAGE_KEY = 'ideapiece:usage-today';

const DEFAULT_SETTINGS: ParentSettings = {
  dailyLimitMinutes: null,
};

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

function todayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidParentSettings(value: unknown): value is ParentSettings {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return item.dailyLimitMinutes === null || typeof item.dailyLimitMinutes === 'number';
}

function isValidUsageRecord(value: unknown): value is UsageRecord {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.date === 'string' && typeof item.usedMs === 'number';
}

/**
 * 부모 모드 설정 조회 (없으면 기본값: 무제한)
 */
export function getParentSettings(): ParentSettings {
  if (!isStorageSupported()) return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidParentSettings(parsed)) return DEFAULT_SETTINGS;

    return parsed;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * 부모 모드 설정 저장
 */
export function saveParentSettings(settings: ParentSettings): void {
  if (!isStorageSupported()) return;

  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // 조용히 무시
  }
}

/**
 * 오늘 누적 사용 시간(ms)을 조회. 저장된 날짜가 오늘과 다르면 0으로 취급(자정 리셋).
 */
export function getTodayUsageMs(): number {
  if (!isStorageSupported()) return 0;

  try {
    const raw = window.localStorage.getItem(USAGE_KEY);
    if (!raw) return 0;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidUsageRecord(parsed)) return 0;
    if (parsed.date !== todayKey()) return 0;

    return parsed.usedMs;
  } catch {
    return 0;
  }
}

/**
 * 오늘 사용 시간에 deltaMs만큼 더해서 저장. 날짜가 바뀐 경우 0부터 새로 시작.
 */
export function addUsageMs(deltaMs: number): void {
  if (deltaMs <= 0) return;
  if (!isStorageSupported()) return;

  try {
    const current = getTodayUsageMs();
    const record: UsageRecord = {
      date: todayKey(),
      usedMs: current + deltaMs,
    };
    window.localStorage.setItem(USAGE_KEY, JSON.stringify(record));
  } catch {
    // 조용히 무시
  }
}

/**
 * 오늘 사용 시간을 0으로 초기화
 */
export function resetTodayUsage(): void {
  if (!isStorageSupported()) return;

  try {
    const record: UsageRecord = {
      date: todayKey(),
      usedMs: 0,
    };
    window.localStorage.setItem(USAGE_KEY, JSON.stringify(record));
  } catch {
    // 조용히 무시
  }
}

/**
 * 오늘 사용 시간이 설정된 하루 제한 시간에 도달했는지 확인
 */
export function hasReachedDailyLimit(): boolean {
  const settings = getParentSettings();
  if (settings.dailyLimitMinutes === null) return false;

  const usedMs = getTodayUsageMs();
  const limitMs = settings.dailyLimitMinutes * 60 * 1000;
  return usedMs >= limitMs;
}

/**
 * 부모 확인용 랜덤 두 자리 덧셈 문제 생성 (예: "37 + 45")
 */
export function generateParentCheckQuestion(): { a: number; b: number; answer: number } {
  const a = 10 + Math.floor(Math.random() * 90);
  const b = 10 + Math.floor(Math.random() * 90);
  return { a, b, answer: a + b };
}
