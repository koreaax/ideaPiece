import { CharacterMood } from './story-visuals';

/**
 * 사용자가 선택한 캐릭터 선호도를 localStorage에 저장/조회하는 유틸
 * 100% 클라이언트 사이드, SSR 안전.
 */

const STORAGE_KEY = 'ideapiece:character-preference';

/**
 * localStorage 접근 가능 여부 확인 (프라이빗 모드 등에서 예외가 날 수 있어 실제 쓰기 테스트)
 */
function isStorageSupported(): boolean {
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

/**
 * 저장된 캐릭터 선호도를 조회한다.
 * 저장된 값이 없거나 유효하지 않으면 null을 반환 (자동 선택 의미)
 */
export function getCharacterPreference(): CharacterMood | null {
  if (!isStorageSupported()) return null;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null) return null;

    // 저장된 값이 null 문자열인 경우도 null로 처리
    if (stored === 'null') return null;

    // 유효한 mood 값인지 검증
    const validMoods: CharacterMood[] = ['happy', 'thinking', 'brave', 'proud'];
    if (validMoods.includes(stored as CharacterMood)) {
      return stored as CharacterMood;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 캐릭터 선호도를 저장한다.
 * null을 전달하면 "자동 선택으로 되돌림" 의미이며, localStorage에서 해당 키를 제거한다.
 */
export function saveCharacterPreference(mood: CharacterMood | null): void {
  if (!isStorageSupported()) return;

  try {
    if (mood === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, mood);
    }
  } catch {
    // 조용한 실패 (프라이빗 모드 등)
  }
}
