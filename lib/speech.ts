/**
 * Web Speech API 유틸 - 한국어 음성 합성
 * 100% 클라이언트 사이드, SSR 안전
 */

let cachedVoices: SpeechSynthesisVoice[] | null = null;
let voicesLoaded = false;

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
 * 한국어 음성 찾기
 */
function findKoreanVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // 정확한 한국어 매칭 우선
  const exactMatch = voices.find((v) => v.lang === 'ko-KR' || v.lang === 'ko');
  if (exactMatch) return exactMatch;

  // 한국어 포함 (보다 느슨한 매칭)
  const koreanMatch = voices.find((v) => v.lang.startsWith('ko'));
  if (koreanMatch) return koreanMatch;

  return null;
}

/**
 * 텍스트를 음성으로 읽어주기
 */
export async function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  if (!isSpeechSupported() || !text.trim()) {
    return;
  }

  try {
    // 기존 발화 중단 (중첩 재생 방지)
    window.speechSynthesis.cancel();

    // 음성 목록 로드
    const voices = await loadVoices();
    const koreanVoice = findKoreanVoice(voices);

    // 음성 합성 객체 생성
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.85;
    utterance.pitch = 1.1;

    if (koreanVoice) {
      utterance.voice = koreanVoice;
    }

    // 콜백 연결
    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = () => {
      onEnd?.(); // 에러 시에도 재생 중 상태 해제
    };

    // 재생
    window.speechSynthesis.speak(utterance);
  } catch {
    // 에러 발생 시 onEnd 호출 (정리 목적)
    onEnd?.();
  }
}

/**
 * 음성 재생 중단
 */
export function stopSpeech(): void {
  if (!isSpeechSupported()) {
    return;
  }

  try {
    window.speechSynthesis.cancel();
  } catch {
    // no-op
  }
}
