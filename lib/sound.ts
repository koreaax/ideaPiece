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

/**
 * 배경 앰비언트 음악 관리
 * 은은한 패드 사운드로 "숨쉬는" 느낌의 루프를 제공한다.
 * 매우 낮은 볼륨으로 TTS/효과음을 방해하지 않는다.
 */

let ambientOscillators: OscillatorNode[] = [];
let ambientGainNodes: GainNode[] = [];
let ambientLfoOscillator: OscillatorNode | null = null;
let ambientLfoGain: GainNode | null = null;
let isAmbientPlaying = false;

export function startAmbientMusic(): void {
  if (!isSoundSupported()) return;
  if (isAmbientPlaying) return; // 중복 재생 방지

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseFrequencies = [130.81, 164.81, 196.0]; // C3, E3, G3 화음
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.035, now); // 매우 작은 기본 볼륨
    masterGain.connect(ctx.destination);

    // 3개의 sine/triangle 오실레이터로 화음 구성
    baseFrequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === 0 ? 'sine' : idx === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(1, now);
      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      ambientOscillators.push(osc);
      ambientGainNodes.push(gain);
    });

    // LFO (저주파 오실레이터)로 마스터 게인을 모듈레이션
    // 주기: 약 10초, 깊이: 볼륨을 0.8배~1.2배 사이로 진동
    const lfoOsc = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const lfoToGain = ctx.createGain();

    lfoOsc.type = 'sine';
    lfoOsc.frequency.setValueAtTime(0.1, now); // 10초 주기

    // LFO 거릌이 0.2(단, 폸헭되는 ±20%)
    lfoGain.gain.setValueAtTime(0.2, now);
    // LFO 중심점 오프셋: 1.0
    lfoToGain.gain.setValueAtTime(1, now);

    lfoOsc.connect(lfoGain);
    lfoGain.connect(lfoToGain.gain);
    lfoToGain.connect(masterGain.gain);
    lfoOsc.start(now);

    ambientLfoOscillator = lfoOsc;
    ambientLfoGain = lfoGain;
    isAmbientPlaying = true;
  } catch {
    // 재생 실패 시 조용히 무시
  }
}

export function stopAmbientMusic(): void {
  if (!isSoundSupported()) return;
  if (!isAmbientPlaying) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const fadeOutDuration = 0.8; // 0.8초에 걸쳐 페이드아웃

    const allNodes = ambientOscillators.concat();
    const allGains = ambientGainNodes.concat();

    // 모든 오실레이터에서 게인 페이드 (LFO 포함)
    allGains.forEach((gain) => {
      gain.gain.exponentialRampToValueAtTime(0.001, now + fadeOutDuration);
    });

    if (ambientLfoGain) {
      ambientLfoGain.gain.exponentialRampToValueAtTime(0.001, now + fadeOutDuration);
    }

    // fadeOutDuration 후 모든 오실레이터 정지
    setTimeout(() => {
      allNodes.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          // 이미 정지된 경우 무시
        }
      });

      if (ambientLfoOscillator) {
        try {
          ambientLfoOscillator.stop();
        } catch {
          // 이미 정지된 경우 무시
        }
        ambientLfoOscillator = null;
      }

      ambientOscillators = [];
      ambientGainNodes = [];
      ambientLfoGain = null;
      isAmbientPlaying = false;
    }, fadeOutDuration * 1000);
  } catch {
    // 정지 실패 시 조용히 무시
    isAmbientPlaying = false;
  }
}

export function isAmbientMusicPlaying(): boolean {
  return isAmbientPlaying;
}

/**
 * localStorage에서 배경음악 선호도 조회
 * SSR 안전 체크 + try-catch 적용
 */
export function getAmbientMusicPreference(): boolean {
  if (typeof window === 'undefined') return true; // SSR: 기본값 true
  try {
    const stored = localStorage.getItem('ideapiece:ambient-music-enabled');
    if (stored === null) return true; // 미설정 시 기본값 true
    return stored === 'true';
  } catch {
    return true; // localStorage 접근 실패 시 기본값
  }
}

/**
 * localStorage에 배경음악 선호도 저장
 * SSR 안전 체크 + try-catch 적용
 */
export function saveAmbientMusicPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('ideapiece:ambient-music-enabled', enabled ? 'true' : 'false');
  } catch {
    // localStorage 저장 실패 시 조용히 무시
  }
}