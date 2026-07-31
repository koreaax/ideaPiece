/**
 * Web Audio API 기반 합성 효과음 유틸
 * 외부 mp3/wav 파일 없이 OscillatorNode로 짧은 효과음을 즉석 생성한다.
 * 100% 클라이언트 사이드, SSR 안전.
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!('AudioContext' in window)) return null;

  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }

    return audioContext;
  } catch {
    return null;
  }
}

/**
 * Web Audio API 지원 여부 확인
 */
export function isSoundSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'AudioContext' in window;
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number,
  type: OscillatorType,
  sweepTo?: number
) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  if (sweepTo) {
    oscillator.frequency.exponentialRampToValueAtTime(sweepTo, startTime + duration);
  }

  gainNode.gain.setValueAtTime(volume, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/**
 * 페이지 넘길 때 재생하는 "휙" 스윕 효과음
 */
export function playPageTurnSound(): void {
  if (!isSoundSupported()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    playTone(ctx, 400, now, 0.15, 0.15, 'sine', 800);
  } catch {
    // 재생 실패 시 조용히 무시
  }
}

/**
 * 분기 선택 카드를 누를 때 재생하는 밝은 2음 "딩동" 효과음
 */
export function playChoiceSound(): void {
  if (!isSoundSupported()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    playTone(ctx, 523.25, now, 0.1, 0.12, 'triangle'); // C5
    playTone(ctx, 659.25, now + 0.1, 0.12, 0.12, 'triangle'); // E5
  } catch {
    // 재생 실패 시 조용히 무시
  }
}

/**
 * 동화 완독/엔딩 시 재생하는 축하 상승 아르페지오 (C-E-G)
 */
export function playCompleteSound(): void {
  if (!isSoundSupported()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    playTone(ctx, 523.25, now, 0.12, 0.13, 'sine'); // C5
    playTone(ctx, 659.25, now + 0.12, 0.12, 0.13, 'sine'); // E5
    playTone(ctx, 783.99, now + 0.24, 0.16, 0.13, 'sine'); // G5
  } catch {
    // 재생 실패 시 조용히 무시
  }
}
