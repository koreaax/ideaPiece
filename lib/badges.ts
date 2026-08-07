'use client';

/**
 * 완독 누적 카운트 기반 배지/스티커 보상 시스템
 * 100% 클라이언트 사이드, SSR 안전.
 * lib/story-storage.ts의 getCompletionStats()를 단일 진실 공급원으로 사용.
 */

import { getCompletionStats } from './story-storage';

export type Badge = {
  id: string;
  threshold: number; // 이 개수 이상 완독하면 획득
  emoji: string;
  label: string;
};

export const BADGE_DEFINITIONS: Badge[] = [
  {
    id: 'seedling-reader',
    threshold: 3,
    emoji: '🌱',
    label: '새싹 독서가',
  },
  {
    id: 'consistent-reader',
    threshold: 5,
    emoji: '🌿',
    label: '꾸준한 독서가',
  },
  {
    id: 'passionate-reader',
    threshold: 10,
    emoji: '🌳',
    label: '열정 독서가',
  },
  {
    id: 'master-reader',
    threshold: 20,
    emoji: '🏆',
    label: '동화 마스터',
  },
];

/**
 * localStorage 접근 가능 여부 확인
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

const LAST_SEEN_BADGE_COUNT_KEY = 'ideapiece:last-seen-badge-count';

/**
 * 현재 totalCount 기준으로 threshold를 충족한 모든 배지 반환 (오름차순)
 */
export function getEarnedBadges(): Badge[] {
  try {
    const stats = getCompletionStats();
    return BADGE_DEFINITIONS.filter((badge) => stats.totalCount >= badge.threshold).sort(
      (a, b) => a.threshold - b.threshold,
    );
  } catch {
    return [];
  }
}

/**
 * 현재 획득한 배지 목록 중 "마지막 확인 개수" 이후의 새 배지만 반환
 */
export function getNewlyEarnedBadges(): Badge[] {
  if (!isStorageSupported()) {
    return getEarnedBadges();
  }

  try {
    const lastSeen = window.localStorage.getItem(LAST_SEEN_BADGE_COUNT_KEY);
    const lastSeenCount = lastSeen ? parseInt(lastSeen, 10) : 0;

    const currentEarned = getEarnedBadges();
    const newBadges = currentEarned.slice(lastSeenCount);

    return newBadges;
  } catch {
    return [];
  }
}

/**
 * 현재 획득 배지 개수를 "마지막 확인 개수"로 저장(확인 처리)
 */
export function markBadgesAsSeen(): void {
  if (!isStorageSupported()) return;

  try {
    const currentEarned = getEarnedBadges();
    window.localStorage.setItem(LAST_SEEN_BADGE_COUNT_KEY, String(currentEarned.length));
  } catch {
    // 조용히 무시
  }
}
