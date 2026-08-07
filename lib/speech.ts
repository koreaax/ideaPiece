/**
 * Web Speech API 유틸 - 한국어 음성 합성
 * 100% 클라이언트 사이드, SSR 안전
 * 문장 단위로 끊어 읽어 더 부드럽고 자연스러운 말투를 만든다.
 */

let cachedVoices: SpeechSynthesisVoice[] | null = null;
let voicesLoaded = false;
let playbackToken = 0;
let pausedFlag = false;

const SPEECH_PREFERENCES_KEY = 'ideapiece:speech-preferences';
const DEFAULT_SPEECH_PREFERENCES: SpeechPreferences = { voiceURI: null, rate: 0.85 };

/**
 * Speech Synthesis 지원 여부 확인
 */
export function isSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}

/**
 * 한국어 음성 목록 로드 (비동기)
 * 일부 브라우저에서는 voiceschanged 이벤트 대기 필요
 */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isSpeechSupported()) {
      resolve([]);
      return;
    }

    // 이미 로드됨
    if (cachedVoices && voicesLoaded) {
      resolve(cachedVoices);
      return;
    }

    const synthesizer = window.speechSynthesis;
    const existingVoices = synthesizer.getVoices();

    // 즉시 사용 가능한 음성이 있으면 반환
    if (existingVoices.length > 0) {
      cachedVoices = existingVoices;
      voicesLoaded = true;
      resolve(existingVoices);
      return;
    }

    // 음성 목록 로드 대기 (일부 브라우저는 비동기)
    const handleVoicesChanged = () => {
      const voices = synthesizer.getVoices();
      if (voices.length > 0) {
        cachedVoices = voices;
        voicesLoaded = true;
        synthesizer.removeEventListener('voiceschanged', handleVoicesChanged);
        resolve(voices);
      }
    };

    synthesizer.addEventListener('voiceschanged', handleVoicesChanged);

    // 타임아웃: 최대 2초 대기
    setTimeout(() => {
      synthesizer.removeEventListener('voiceschanged', handleVoicesChanged);
      const voices = synthesizer.getVoices();
      cachedVoices = voices;
      voicesLoaded = true;
      resolve(voices);
    }, 2000);
  });
}

/**
 * 한국어 음성 찾기 - 가능하면 네트워크(클라우드) 음성을 우선 사용해 더 부드럽게 재생
 */
function findKoreanVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const koreanVoices = voices.filter(
    (v) => v.lang === 'ko-KR' || v.lang === 'ko' || v.lang.startsWith('ko')
  );
  if (koreanVoices.length === 0) return null;

  // localService === false 인 음성은 보통 클라우드 기반 고품질 음성(예: Chrome의 Google 음성)
  const cloudVoice = koreanVoices.find((v) => !v.localService);
  if (cloudVoice) return cloudVoice;

  return koreanVoices[0];
}

/**
 * 사용 가능한 한국어 음성 전체 목록 반환 (음성 선택 UI용)
 */
export async function getAvailableKoreanVoices(): Promise<SpeechSynthesisVoice[]> {
  const voices = await loadVoices();
  return voices.filter(
    (v) => v.lang === 'ko-KR' || v.lang === 'ko' || v.lang.startsWith('ko')
  );
}

/**
 * 사용자가 선택한 음성/속도 설정
 */
export type SpeechPreferences = {
  voiceURI: string | null;
  rate: number;
};

/**
 * 저장된 음성 설정 조회 (없으면 기본값)
 */
export function getSpeechPreferences(): SpeechPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_SPEECH_PREFERENCES };

  try {
    const raw = window.localStorage.getItem(SPEECH_PREFERENCES_KEY);
    if (!raw) return { ...DEFAULT_SPEECH_PREFERENCES };

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SPEECH_PREFERENCES };

    const item = parsed as Record<string, unknown>;
    const voiceURI = typeof item.voiceURI === 'string' ? item.voiceURI : null;
    const rate = typeof item.rate === 'number' && Number.isFinite(item.rate) ? item.rate : DEFAULT_SPEECH_PREFERENCES.rate;

    return { voiceURI, rate };
  } catch {
    return { ...DEFAULT_SPEECH_PREFERENCES };
  }
}

/**
 * 음성 설정 저장 (localStorage)
 */
export function saveSpeechPreferences(prefs: SpeechPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(SPEECH_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {
    // 조용히 무시
  }
}

/**
 * 긴 텍스트를 문장 단위로 분할 (마침표 기준, 구분자 유지)
 */
function splitIntoSentences(text: string): string[] {
  const normalized = text.trim();
  if (!normalized) return [];

  const matches = normalized.match(/[^.!?]+[.!?]*/g);
  if (!matches) return [normalized];

  return matches.map((s) => s.trim()).filter(Boolean);
}

export type SpeakCallbacks = {
  onStart?: () => void;
  onEnd?: () => void;
  /** 문장 하이라이트용: 현재 재생 중인 문장의 index와 전체 문장 배열을 전달 */
  onSentenceStart?: (index: number, sentences: string[]) => void;
  onPause?: () => void;
  onResume?: () => void;
};

/**
 * 텍스트를 음성으로 읽어주기
 * 문장 단위로 나눠 순차 재생함으로써 말투에 자연스러운 쉼을 두어 더 부드럽게 들리게 한다.
 * 두 번째 인자로 함수(onEnd 단축형) 또는 콜백 객체(SpeakCallbacks)를 받는다.
 */
export async function speakText(
  text: string,
  onStartOrCallbacks?: (() => void) | SpeakCallbacks,
  onEndArg?: () => void
): Promise<void> {
  if (!isSpeechSupported() || !text.trim()) {
    return;
  }

  const callbacks: SpeakCallbacks =
    typeof onStartOrCallbacks === 'function'
      ? { onStart: onStartOrCallbacks, onEnd: onEndArg }
      : onStartOrCallbacks || {};

  const myToken = ++playbackToken;
  pausedFlag = false;

  try {
    // 기존 발화 중단 (중첩 재생 방지)
    window.speechSynthesis.cancel();

    // 음성 목록 로드
    const voices = await loadVoices();
    const preferences = getSpeechPreferences();
    const preferredVoice = preferences.voiceURI
      ? voices.find((v) => v.voiceURI === preferences.voiceURI) || null
      : null;
    const koreanVoice = preferredVoice || findKoreanVoice(voices);
    const sentences = splitIntoSentences(text);

    if (sentences.length === 0) {
      callbacks.onEnd?.();
      return;
    }

    let started = false;

    const playSentence = (index: number) => {
      // 다른 speakText/stopSpeech 호출로 무효화된 경우 중단
      if (myToken !== playbackToken) return;

      if (index >= sentences.length) {
        callbacks.onEnd?.();
        return;
      }

      callbacks.onSentenceStart?.(index, sentences);

      const utterance = new SpeechSynthesisUtterance(sentences[index]);
      utterance.lang = 'ko-KR';
      utterance.rate = preferences.rate;
      utterance.pitch = 1.1;

      if (koreanVoice) {
        utterance.voice = koreanVoice;
      }

      utterance.onstart = () => {
        if (!started) {
          started = true;
          callbacks.onStart?.();
        }
      };

      utterance.onend = () => {
        if (myToken !== playbackToken) return;
        // 일시정지 상태라면 다음 문장으로 넘어가지 않고 대기
        if (pausedFlag) return;
        // 문장 사이 짧은 쉼을 두어 더 부드럽게 이어진다
        setTimeout(() => playSentence(index + 1), 220);
      };

      utterance.onerror = () => {
        if (myToken !== playbackToken) return;
        callbacks.onEnd?.(); // 에러 시에도 재생 중 상태 해제
      };

      window.speechSynthesis.speak(utterance);
    };

    playSentence(0);
  } catch {
    // 에러 발생 시 onEnd 호출 (정리 목적)
    callbacks.onEnd?.();
  }
}

/**
 * 음성 재생 일시정지 (브라우저 pause API 사용)
 */
export function pauseSpeech(): void {
  if (!isSpeechSupported()) return;

  try {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      pausedFlag = true;
      window.speechSynthesis.pause();
    }
  } catch {
    // no-op
  }
}

/**
 * 일시정지된 음성 재생 재개
 */
export function resumeSpeech(): void {
  if (!isSpeechSupported()) return;

  try {
    if (window.speechSynthesis.paused) {
      pausedFlag = false;
      window.speechSynthesis.resume();
    }
  } catch {
    // no-op
  }
}

/**
 * 현재 일시정지 상태인지 확인
 */
export function isSpeechPaused(): boolean {
  if (!isSpeechSupported()) return false;
  return window.speechSynthesis.paused;
}

/**
 * 음성 재생 중단
 */
export function stopSpeech(): void {
  playbackToken += 1;
  pausedFlag = false;

  if (!isSpeechSupported()) {
    return;
  }

  try {
    window.speechSynthesis.cancel();
  } catch {
    // no-op
  }
}
